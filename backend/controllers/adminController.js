import User from '../models/User.js';
import WorkerRegistrationRequest from '../models/WorkerRegistrationRequest.js';
import Provider from '../models/Provider.js';
import Payment from '../models/Payment.js';
import Complaint from '../models/Complaint.js';

// Get all users
export const getUsers = async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
};

// Get pending provider registration requests
export const getProviderRequests = async (req, res) => {
    try {
        const requests = await WorkerRegistrationRequest.find().sort({ createdAt: -1 });
        res.json(requests);
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

        // Find the corresponding User account
        const user = await User.findOne({ email: registrationRequest.email, role: 'provider' });
        if (!user) {
            return res.status(404).json({ message: 'Associated user account not found' });
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
            approvedAt: new Date(),
            approvedBy: req.user.id
        });

        // Update WorkerRegistrationRequest status
        registrationRequest.status = 'approved';
        registrationRequest.approvedAt = new Date();
        registrationRequest.reviewedBy = req.user.id;
        await registrationRequest.save();

        // Update User account status
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

        // Update User account status
        const user = await User.findOne({ email: registrationRequest.email, role: 'provider' });
        if (user) {
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
        .populate('providerId', 'name email');

    res.json(payments);
};

// Approve payment
export const approvePayment = async (req, res) => {
    const { id } = req.params;
    const payment = await Payment.findById(id);

    if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = 'approved';
    await payment.save();

    res.json({ message: 'Payment approved' });
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
    await complaint.save();

    res.json({ message: 'Complaint resolved' });
};
