import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Complaint from '../models/Complaint.js';

// Get all users
export const getUsers = async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
};

// Get pending provider requests
export const getProviderRequests = async (req, res) => {
    const requests = await User.find({
        role: 'provider',
        providerStatus: 'pending'
    }).select('-password');

    res.json(requests);
};

// Approve provider
export const approveProvider = async (req, res) => {
    const { id } = req.params;
    const provider = await User.findById(id);

    if (!provider || provider.role !== 'provider') {
        return res.status(404).json({ message: 'Provider not found' });
    }

    provider.providerStatus = 'approved';
    provider.approvedAt = new Date();
    await provider.save();

    res.json({ message: 'Provider approved' });
};

// Reject provider
export const rejectProvider = async (req, res) => {
    const { id } = req.params;
    const provider = await User.findById(id);

    if (!provider || provider.role !== 'provider') {
        return res.status(404).json({ message: 'Provider not found' });
    }

    provider.providerStatus = 'rejected';
    provider.rejectedAt = new Date();
    await provider.save();

    res.json({ message: 'Provider rejected' });
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
