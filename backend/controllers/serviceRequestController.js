import ServiceRequest from "../models/ServiceRequest.js";
import User from "../models/User.js";

// POST - Create service request
export const createServiceRequest = async (req, res) => {
  try {
    // Coerce numeric fields if necessary
    const payload = { ...req.body, userId: req.user.id };
    if (payload.budget) payload.budget = Number(payload.budget);

    const newRequest = new ServiceRequest(payload);
    await newRequest.save();

    res.status(201).json({
      message: "Service request created successfully",
      serviceRequest: newRequest,
    });
  } catch (error) {
    console.error('createServiceRequest error:', error);
    const resp = {
      message: "Failed to create service request",
      error: error.message,
    };
    if (process.env.NODE_ENV === 'development') resp.stack = error.stack;
    res.status(500).json(resp);
  }
};

// GET - Get all service requests
export const getAllServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service requests",
      error: error.message,
    });
  }
};

// GET - Get service requests by user
export const getServiceRequestsByUser = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service requests",
      error: error.message,
    });
  }
};

// PUT - Update service request
export const updateServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    if (payload.budget) payload.budget = Number(payload.budget);

    const updatedRequest = await ServiceRequest.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      payload,
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Service request not found or not authorized" });
    }

    res.status(200).json({
      message: "Service request updated successfully",
      serviceRequest: updatedRequest,
    });
  } catch (error) {
    console.error('updateServiceRequest error:', error);
    res.status(500).json({
      message: "Failed to update service request",
      error: error.message,
    });
  }
};

// GET - Get available service requests for providers
export const getAvailableServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ status: "Pending" })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch available service requests",
      error: error.message,
    });
  }
};

// POST - Accept a service request (Send offer to customer)
export const acceptServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, proposedPrice, proposedDate } = req.body;

    // Check if provider is approved
    const provider = await User.findById(req.user.id);
    if (!provider || provider.role !== 'provider') {
      return res.status(403).json({ message: "Only providers can send offers" });
    }

    if (provider.providerStatus !== 'approved') {
      return res.status(403).json({
        message: "Your provider account is not approved yet. Please wait for admin approval.",
        providerStatus: provider.providerStatus
      });
    }

    const serviceRequest = await ServiceRequest.findById(id);

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    if (serviceRequest.status !== "Pending") {
      return res.status(400).json({ message: "Service request is not available" });
    }

    // Send offer to customer instead of directly accepting
    serviceRequest.status = "OfferSent";
    serviceRequest.providerId = req.user.id;
    serviceRequest.providerOffer = {
      sendAt: new Date(),
      message: message || '',
      proposedPrice: proposedPrice || serviceRequest.budget,
      proposedDate: proposedDate || serviceRequest.preferredDate,
      customerResponse: 'pending'
    };

    await serviceRequest.save();

    res.status(200).json({
      message: "Offer sent to customer successfully",
      serviceRequest,
    });
  } catch (error) {
    console.error('acceptServiceRequest error:', error);
    res.status(500).json({
      message: "Failed to send offer",
      error: error.message,
    });
  }
};

// GET - Get provider's accepted service requests
export const getProviderServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ providerId: req.user.id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch provider service requests",
      error: error.message,
    });
  }
};

// PUT - Complete a service request
export const completeServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceRequest = await ServiceRequest.findOne({
      _id: id,
      providerId: req.user.id
    });

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found or not authorized" });
    }

    if (serviceRequest.status !== "Accepted") {
      return res.status(400).json({ message: "Service request is not in accepted status" });
    }

    serviceRequest.status = "Completed";
    serviceRequest.completedAt = new Date();

    await serviceRequest.save();

    res.status(200).json({
      message: "Service request completed successfully",
      serviceRequest,
    });
  } catch (error) {
    console.error('completeServiceRequest error:', error);
    res.status(500).json({
      message: "Failed to complete service request",
      error: error.message,
    });
  }
};

// POST - Customer accepts provider offer
export const acceptProviderOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceRequest = await ServiceRequest.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found or not authorized" });
    }

    if (serviceRequest.status !== "OfferSent") {
      return res.status(400).json({ message: "No pending offer for this request" });
    }

    serviceRequest.status = "Accepted";
    serviceRequest.acceptedAt = new Date();
    serviceRequest.providerOffer.customerResponse = 'accepted';
    serviceRequest.providerOffer.customerResponseAt = new Date();

    await serviceRequest.save();

    res.status(200).json({
      message: "Provider offer accepted successfully",
      serviceRequest,
    });
  } catch (error) {
    console.error('acceptProviderOffer error:', error);
    res.status(500).json({
      message: "Failed to accept offer",
      error: error.message,
    });
  }
};

// POST - Customer rejects provider offer
export const rejectProviderOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceRequest = await ServiceRequest.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found or not authorized" });
    }

    if (serviceRequest.status !== "OfferSent") {
      return res.status(400).json({ message: "No pending offer for this request" });
    }

    // Reset to pending and clear provider offer
    serviceRequest.status = "Pending";
    serviceRequest.providerOffer.customerResponse = 'rejected';
    serviceRequest.providerOffer.customerResponseAt = new Date();
    serviceRequest.providerId = null;

    await serviceRequest.save();

    res.status(200).json({
      message: "Provider offer rejected successfully",
      serviceRequest,
    });
  } catch (error) {
    console.error('rejectProviderOffer error:', error);
    res.status(500).json({
      message: "Failed to reject offer",
      error: error.message,
    });
  }
};

