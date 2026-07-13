import Complaint from '../models/Complaint.js';

export const createComplaint = async (req, res) => {
  try {
    const {
      serviceRequestId,
      providerName,
      providerPhone,
      subject,
      message
    } = req.body || {};

    if (!providerName || !providerPhone || !message) {
      return res.status(400).json({
        message: 'Provider name, provider phone, and issue description are required.'
      });
    }

    const complaint = new Complaint({
      userId: req.user.id,
      serviceRequestId: serviceRequestId || undefined,
      providerName,
      providerPhone,
      subject: subject || 'Service Issue',
      message,
      status: 'open'
    });

    await complaint.save();

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint
    });
  } catch (error) {
    console.error('createComplaint error:', error);
    res.status(500).json({ message: 'Failed to submit complaint' });
  }
};

export const getUserComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    console.error('getUserComplaints error:', error);
    res.status(500).json({ message: 'Failed to fetch complaints' });
  }
};

export const getComplaintByServiceRequest = async (req, res) => {
  try {
    const { serviceRequestId } = req.params;
    const complaint = await Complaint.findOne({
      userId: req.user.id,
      serviceRequestId
    }).sort({ createdAt: -1 });

    if (!complaint) {
      return res.json(null);
    }

    res.json(complaint);
  } catch (error) {
    console.error('getComplaintByServiceRequest error:', error);
    res.status(500).json({ message: 'Failed to fetch complaint' });
  }
};

// Allows a customer to reopen a resolved complaint within the allowed reopening period.
export const reopenComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findOne({ _id: id, userId: req.user.id });

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({ message: 'Only resolved complaints can be reopened' });
    }

    if (!complaint.reopenUntil || Date.now() > complaint.reopenUntil.getTime()) {
      return res.status(400).json({ message: 'Reopen window has expired' });
    }

    complaint.status = 'open';
    complaint.reopenedAt = new Date();
    complaint.reopenCount = (complaint.reopenCount || 0) + 1;
    await complaint.save();

    res.json({ message: 'Complaint reopened', complaint });
  } catch (error) {
    console.error('reopenComplaint error:', error);
    res.status(500).json({ message: 'Failed to reopen complaint' });
  }
};
