import User from '../models/User.js';
import WorkerRegistrationRequest from '../models/WorkerRegistrationRequest.js';
import Provider from '../models/Provider.js';
import Payment from '../models/Payment.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Complaint from '../models/Complaint.js';
import UserPaymentDetails from '../models/UserPaymentDetails.js';
import { SETTLEMENT_TYPES } from '../constants/settlement.js';
import { calculateSettlement, validateSettlementRequest } from '../utils/settlement.js';
import {
  applyPaymentSettlement,
  COMPLAINT_REOPEN_WINDOW_MS,
  getPaymentServiceAmount,
  resolveSettlementOptions,
  validatePaymentRelease,
} from '../utils/paymentRelease.js';
import { enrichPaymentParties } from '../utils/paymentParties.js';

const loadUserForRegistrationRequest = (email) => User.findOne({ email });

const isPendingProviderRegistration = (user) => (
    user.role === 'provider' && user.providerStatus === 'pending'
);

const validateUserForProviderApproval = (user, res) => {
    if (!user) {
        res.status(404).json({ message: 'Associated user account not found' });
        return false;
    }
    if (user.role === 'admin') {
        res.status(403).json({ message: 'Admin accounts cannot be registered as providers' });
        return false;
    }
    if (!isPendingProviderRegistration(user)) {
        res.status(400).json({
            message: 'User must have role provider with pending status before approval. They should complete worker registration first.'
        });
        return false;
    }
    return true;
};

// Get all users
export const getUsers = async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
};

// Get pending provider registration requests
export const getProviderRequests = async (req, res) => {
    try {
        const requests = await WorkerRegistrationRequest.find().sort({ createdAt: -1 });
        const sortedRequests = requests.sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return 0;
        });
        res.json(sortedRequests);
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch provider requests',
            error: error.message
        });
    }
};

// Approve provider and migrate to Provider collection
export const approveProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const registrationRequest = await WorkerRegistrationRequest.findById(id);

        if (!registrationRequest) {
            return res.status(404).json({ message: 'Registration request not found' });
        }

        if (registrationRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending requests can be approved' });
        }

        // Find the corresponding User account (same email lookup as rejectProvider)
        const user = await loadUserForRegistrationRequest(registrationRequest.email);
        if (!validateUserForProviderApproval(user, res)) return;

        const existingProvider = await Provider.findOne({ userId: user._id });
        if (existingProvider) {
            return res.status(400).json({ message: 'Provider profile already exists for this user' });
        }

        // Create Provider record (approved provider)
        const provider = await Provider.create({
            userId: user._id,
            firstName: registrationRequest.firstName,
            lastName: registrationRequest.lastName,
            email: registrationRequest.email,
            phone: registrationRequest.phone,
            district: registrationRequest.district,
            city: registrationRequest.city,
            postalCode: registrationRequest.postalCode,
            serviceCategory: registrationRequest.serviceCategory,
            yearsOfExperience: registrationRequest.yearsOfExperience,
            hourlyRate: registrationRequest.hourlyRate,
            professionalBio: registrationRequest.professionalBio,
            portfolioPhoto: registrationRequest.portfolioPhoto,
            idDocument: registrationRequest.idDocument,
            nicNumber: registrationRequest.nicNumber,
            bankName: registrationRequest.bankName,
            accountNumber: registrationRequest.accountNumber,
            branch: registrationRequest.branch,
            accountHolderName: registrationRequest.accountHolderName,
            approvedAt: new Date(),
            approvedBy: req.user.id
        });

        // Update WorkerRegistrationRequest status
        registrationRequest.status = 'approved';
        registrationRequest.approvedAt = new Date();
        registrationRequest.reviewedBy = req.user.id;
        await registrationRequest.save();

        // Update User account status (role already provider from registration submission)
        user.providerStatus = 'approved';
        user.approvedAt = new Date();
        await user.save();

        res.json({
            message: 'Provider approved and migrated to active providers',
            provider: provider
        });
    } catch (error) {
        console.error('approveProvider error:', error);
        res.status(500).json({
            message: 'Failed to approve provider',
            error: error.message
        });
    }
};

// Reject provider registration request
export const rejectProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewNotes } = req.body;

        const registrationRequest = await WorkerRegistrationRequest.findById(id);

        if (!registrationRequest) {
            return res.status(404).json({ message: 'Registration request not found' });
        }

        if (registrationRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending requests can be rejected' });
        }

        // Update WorkerRegistrationRequest status
        registrationRequest.status = 'rejected';
        registrationRequest.rejectedAt = new Date();
        registrationRequest.reviewedBy = req.user.id;
        registrationRequest.reviewNotes = reviewNotes || '';
        await registrationRequest.save();

        // Update linked user when they completed worker registration (role: provider, pending)
        const user = await loadUserForRegistrationRequest(registrationRequest.email);
        if (user && user.role !== 'admin' && isPendingProviderRegistration(user)) {
            user.providerStatus = 'rejected';
            user.rejectedAt = new Date();
            await user.save();
        }

        res.json({
            message: 'Provider registration request rejected'
        });
    } catch (error) {
        console.error('rejectProvider error:', error);
        res.status(500).json({
            message: 'Failed to reject provider',
            error: error.message
        });
    }
};

// Get payments
export const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('userId', 'name email')
            .populate('providerId', 'firstName lastName email phone')
            .populate({
                path: 'serviceRequestId',
                select: 'customerCompleted providerCompleted customerCompletedAt providerCompletedAt userId providerId',
                populate: [
                    { path: 'userId', select: 'name email' },
                    { path: 'providerId', select: 'name email phone' },
                ],
            })
            .sort({ createdAt: -1 })
            .lean();

        const enrichedPayments = await Promise.all(
            payments.map((payment) => enrichPaymentParties(payment))
        );

        res.json(enrichedPayments);
    } catch (error) {
        console.error('getPayments error:', error);
        res.status(500).json({ message: 'Failed to fetch payments' });
    }
};

// Release / settle payment (full, partial, or refund per complaint decision)
export const approvePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id);

        const validation = await validatePaymentRelease(payment);
        if (!validation.ok) {
            return res.status(validation.statusCode || 400).json({ message: validation.message });
        }

        const settlementOptions = resolveSettlementOptions(payment, validation.latestComplaint);

        if (settlementOptions.settlementType === SETTLEMENT_TYPES.PARTIAL_RELEASE) {
            const totalAmount = getPaymentServiceAmount(payment);
            const partialValidation = validateSettlementRequest({
                settlementType: SETTLEMENT_TYPES.PARTIAL_RELEASE,
                settlementAmountInput: settlementOptions.settlementAmountInput,
                totalAmount,
                requireDispute: true,
                hasDispute: settlementOptions.hasDispute,
            });
            if (!partialValidation.ok) {
                return res.status(partialValidation.statusCode || 400).json({ message: partialValidation.message });
            }
        }

        applyPaymentSettlement(payment, settlementOptions);
        await payment.save();

        const settlementLabel = payment.settlementType === SETTLEMENT_TYPES.FULL_REFUND
            ? 'Payment refunded to customer'
            : 'Payment settled and released to provider';

        res.json({
            message: settlementLabel,
            payment,
        });
    } catch (error) {
        console.error('approvePayment error:', error);
        res.status(500).json({ message: error.message || 'Failed to settle payment' });
    }
};

export const previewSettlement = async (req, res) => {
    try {
        const { totalAmount, settlementType, settlementAmount, commissionRate } = req.body || {};

        const validation = validateSettlementRequest({
            settlementType: settlementType || SETTLEMENT_TYPES.FULL_RELEASE,
            settlementAmountInput: settlementAmount,
            totalAmount,
            requireDispute: settlementType === SETTLEMENT_TYPES.PARTIAL_RELEASE,
            hasDispute: true,
        });

        if (!validation.ok) {
            return res.status(validation.statusCode || 400).json({ message: validation.message });
        }

        const breakdown = calculateSettlement({
            totalAmount,
            settlementType: settlementType || SETTLEMENT_TYPES.FULL_RELEASE,
            settlementAmountInput: settlementAmount,
            commissionRatePercent: commissionRate,
        });

        res.json(breakdown);
    } catch (error) {
        console.error('previewSettlement error:', error);
        res.status(400).json({ message: error.message || 'Failed to preview settlement' });
    }
};

export const getPaymentStats = async (req, res) => {
    try {
        const [totalTransactions, settledAgg, pendingPayments] = await Promise.all([
            Payment.countDocuments({
                payoutStatus: { $in: ['hold', 'paid', 'refunded'] },
                status: { $in: ['pending', 'approved'] },
            }),
            Payment.aggregate([
                { $match: { status: 'approved', payoutStatus: { $in: ['paid', 'refunded'] } } },
                {
                    $group: {
                        _id: null,
                        totalReleasedPayments: {
                            $sum: {
                                $cond: [{ $eq: ['$payoutStatus', 'paid'] }, 1, 0],
                            },
                        },
                        totalCommissionEarned: {
                            $sum: { $ifNull: ['$commissionAmount', 0] },
                        },
                        totalProviderPayout: {
                            $sum: { $ifNull: ['$providerAmount', 0] },
                        },
                        totalRefundedAmount: {
                            $sum: { $ifNull: ['$refundAmount', 0] },
                        },
                        totalPartialSettlements: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$settlementType', SETTLEMENT_TYPES.PARTIAL_RELEASE] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),
            Payment.countDocuments({
                payoutStatus: 'hold',
                status: 'pending',
            }),
        ]);

        const settled = settledAgg[0] || {
            totalReleasedPayments: 0,
            totalCommissionEarned: 0,
            totalProviderPayout: 0,
            totalRefundedAmount: 0,
            totalPartialSettlements: 0,
        };

        res.json({
            totalTransactions,
            totalCommissionEarned: Math.round(settled.totalCommissionEarned * 100) / 100,
            totalReleasedPayments: settled.totalReleasedPayments,
            totalPendingPayments: pendingPayments,
            totalProviderPayout: Math.round(settled.totalProviderPayout * 100) / 100,
            totalRefundedAmount: Math.round(settled.totalRefundedAmount * 100) / 100,
            totalPartialSettlements: settled.totalPartialSettlements,
        });
    } catch (error) {
        console.error('getPaymentStats error:', error);
        res.status(500).json({ message: 'Failed to fetch payment statistics' });
    }
};

// Get complaints
export const getComplaints = async (req, res) => {
    const complaints = await Complaint.find()
        .populate('userId', 'name email')
        .populate('serviceRequestId', 'serviceTitle customerCompleted providerCompleted');

    res.json(complaints);
};

// Resolve complaint with settlement decision
export const resolveComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { settlementType, settlementAmount } = req.body || {};
        const complaint = await Complaint.findById(id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (complaint.status !== 'open') {
            return res.status(400).json({ message: 'Only open complaints can be resolved' });
        }

        const payment = complaint.serviceRequestId
            ? await Payment.findOne({ serviceRequestId: complaint.serviceRequestId })
            : null;

        const totalAmount = payment ? getPaymentServiceAmount(payment) : 0;
        const chosenType = settlementType || SETTLEMENT_TYPES.FULL_RELEASE;

        if (payment) {
            const settlementValidation = validateSettlementRequest({
                settlementType: chosenType,
                settlementAmountInput: settlementAmount,
                totalAmount,
                requireDispute: chosenType === SETTLEMENT_TYPES.PARTIAL_RELEASE,
                hasDispute: true,
            });

            if (!settlementValidation.ok) {
                return res.status(settlementValidation.statusCode || 400).json({
                    message: settlementValidation.message,
                });
            }
        } else if (chosenType !== SETTLEMENT_TYPES.FULL_RELEASE) {
            return res.status(400).json({
                message: 'Cannot apply partial settlement or refund without a linked payment record',
            });
        }

        const preview = payment
            ? calculateSettlement({
                totalAmount,
                settlementType: chosenType,
                settlementAmountInput: settlementAmount,
                commissionRatePercent: payment.commissionRate,
            })
            : null;

        complaint.status = 'resolved';
        complaint.settlementType = chosenType;
        complaint.settlementAmount = preview?.settlementAmount ?? 0;
        complaint.resolvedAt = new Date();
        complaint.reopenUntil = new Date(Date.now() + COMPLAINT_REOPEN_WINDOW_MS);
        await complaint.save();

        if (complaint.serviceRequestId && payment) {
            payment.payoutStatus = 'hold';
            payment.holdUntil = complaint.reopenUntil;
            await payment.save();
        }

        res.json({
            message: 'Complaint resolved with settlement decision recorded',
            complaint,
            settlementPreview: preview,
        });
    } catch (error) {
        console.error('resolveComplaint error:', error);
        res.status(500).json({ message: error.message || 'Failed to resolve complaint' });
    }
};

// Get user bank details (admin only)
export const getUserBankDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const details = await UserPaymentDetails.findOne({ userId: id });

        if (!details) {
            return res.json({ hasDetails: false });
        }

        res.json({
            hasDetails: true,
            user: {
                name: details.name,
                email: details.email,
                phone: details.phone,
                address: details.address,
                postalCode: details.postalCode
            },
            bank: {
                bankName: details.bankName,
                accountNumber: details.accountNumber,
                accountHolderName: details.accountHolderName,
                branch: details.branch
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch bank details' });
    }
};
