import User from '../models/User.js';
import WorkerRegistrationRequest from '../models/WorkerRegistrationRequest.js';
import Provider from '../models/Provider.js';
import Payment from '../models/Payment.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Complaint from '../models/Complaint.js';
import UserPaymentDetails from '../models/UserPaymentDetails.js';
import {
  applyPaymentRelease,
  COMPLAINT_REOPEN_WINDOW_MS,
  validatePaymentRelease,
} from '../utils/paymentRelease.js';

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
    const payments = await Payment.find()
        .populate('userId', 'name email')
        .populate('providerId', 'firstName lastName email phone')
        .populate('serviceRequestId', 'customerCompleted providerCompleted customerCompletedAt providerCompletedAt');

    res.json(payments);
};

// Release payment to provider (with 5% platform commission)
export const approvePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id);

        const validation = await validatePaymentRelease(payment);
        if (!validation.ok) {
            return res.status(validation.statusCode || 400).json({ message: validation.message });
        }

        applyPaymentRelease(payment);
        await payment.save();

        res.json({
            message: 'Payment released to provider',
            payment,
        });
    } catch (error) {
        console.error('approvePayment error:', error);
        res.status(500).json({ message: 'Failed to release payment' });
    }
};

export const getPaymentStats = async (req, res) => {
    try {
        const [totalTransactions, releasedAgg, pendingPayments] = await Promise.all([
            Payment.countDocuments({
                payoutStatus: { $in: ['hold', 'paid'] },
                status: { $in: ['pending', 'approved'] },
            }),
            Payment.aggregate([
                { $match: { payoutStatus: 'paid', status: 'approved' } },
                {
                    $group: {
                        _id: null,
                        totalReleasedPayments: { $sum: 1 },
                        totalCommissionEarned: {
                            $sum: {
                                $ifNull: [
                                    '$commissionAmount',
                                    {
                                        $multiply: [
                                            { $ifNull: ['$serviceAmount', '$amount'] },
                                            { $divide: [{ $ifNull: ['$commissionRate', 5] }, 100] },
                                        ],
                                    },
                                ],
                            },
                        },
                        totalProviderPayout: {
                            $sum: {
                                $ifNull: [
                                    '$providerAmount',
                                    {
                                        $multiply: [
                                            { $ifNull: ['$serviceAmount', '$amount'] },
                                            {
                                                $subtract: [
                                                    1,
                                                    { $divide: [{ $ifNull: ['$commissionRate', 5] }, 100] },
                                                ],
                                            },
                                        ],
                                    },
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

        const released = releasedAgg[0] || {
            totalReleasedPayments: 0,
            totalCommissionEarned: 0,
            totalProviderPayout: 0,
        };

        res.json({
            totalTransactions,
            totalCommissionEarned: Math.round(released.totalCommissionEarned * 100) / 100,
            totalReleasedPayments: released.totalReleasedPayments,
            totalPendingPayments: pendingPayments,
            totalProviderPayout: Math.round(released.totalProviderPayout * 100) / 100,
        });
    } catch (error) {
        console.error('getPaymentStats error:', error);
        res.status(500).json({ message: 'Failed to fetch payment statistics' });
    }
};

// Get complaints
export const getComplaints = async (req, res) => {
    const complaints = await Complaint.find()
        .populate('userId', 'name email');

    res.json(complaints);
};

// Resolve complaint
export const resolveComplaint = async (req, res) => {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);

    if (!complaint) {
        return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = 'resolved';
    complaint.resolvedAt = new Date();
    complaint.reopenUntil = new Date(Date.now() + COMPLAINT_REOPEN_WINDOW_MS);
    await complaint.save();

    if (complaint.serviceRequestId) {
        const serviceRequest = await ServiceRequest.findById(complaint.serviceRequestId);
        const bothCompleted = serviceRequest?.customerCompleted && serviceRequest?.providerCompleted;

        if (bothCompleted) {
            const payment = await Payment.findOne({ serviceRequestId: complaint.serviceRequestId });
            if (payment) {
                payment.payoutStatus = 'hold';
                payment.holdUntil = complaint.reopenUntil;
                await payment.save();
            }
        }
    }

    res.json({ message: 'Complaint resolved' });
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
