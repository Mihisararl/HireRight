import ServiceRequest from "../models/ServiceRequest.js";
import User from "../models/User.js";
import Provider from "../models/Provider.js";
import {
  validateServiceLocation,
  stopJourneyForProvider,
  ensureStoredLocation,
} from "../utils/locationUtils.js";
import { attachProviderProfilesToRequests } from "../utils/providerProfileUtils.js";

const resolveDailyBudget = (payload) => {
  const value = payload?.dailyBudget ?? payload?.budget;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
};

/** Map legacy budget field and strip removed fields for API responses */
export const normalizeServiceRequest = (doc) => {
  if (!doc) return doc;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  if (obj.dailyBudget == null && obj.budget != null) {
    obj.dailyBudget = obj.budget;
  }
  delete obj.estimatedDuration;
  return obj;
};

const mapRequests = (requests) => {
  if (Array.isArray(requests)) {
    return requests.map((item) => normalizeServiceRequest(item));
  }
  return normalizeServiceRequest(requests);
};

const saveServiceRequest = async (serviceRequest) => {
  ensureStoredLocation(serviceRequest);
  return serviceRequest.save();
};

// POST - Create service request
export const createServiceRequest = async (req, res) => {
  try {
    // Coerce numeric fields if necessary
    const payload = { ...req.body, userId: req.user.id };
    delete payload.estimatedDuration;

    const dailyBudget = resolveDailyBudget(payload);
    if (!dailyBudget) {
      return res.status(400).json({ message: 'Daily budget (LKR per day) is required' });
    }
    payload.dailyBudget = dailyBudget;
    delete payload.budget;

    const locationCheck = validateServiceLocation(payload.location);
    if (!locationCheck.valid) {
      return res.status(400).json({ message: locationCheck.message });
    }
    payload.location = locationCheck.location;

    // If this is a direct booking, initialize providerResponse
    if (payload.bookingType === 'direct') {
      payload.providerResponse = {
        respondedAt: null,
        status: 'pending',
        responseMessage: null
      };
      payload.status = 'Pending';
    }

    const newRequest = new ServiceRequest(payload);
    await newRequest.save();

    res.status(201).json({
      message: "Service request created successfully",
      serviceRequest: normalizeServiceRequest(newRequest),
    });
  } catch (error) {
    console.error('createServiceRequest error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: error.message || 'Invalid service request data',
        error: error.message,
      });
    }
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
    res.status(200).json(mapRequests(requests));
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
    const requests = await ServiceRequest.find({ userId: req.user.id })
      .populate('providerId', 'name email phone profilePhoto')
      .sort({ createdAt: -1 });

    const enrichedRequests = await attachProviderProfilesToRequests(requests);
    res.status(200).json(mapRequests(enrichedRequests));
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
    delete payload.estimatedDuration;

    if (payload.dailyBudget !== undefined || payload.budget !== undefined) {
      const dailyBudget = resolveDailyBudget(payload);
      if (!dailyBudget) {
        return res.status(400).json({ message: 'Daily budget (LKR per day) must be a positive number' });
      }
      payload.dailyBudget = dailyBudget;
      delete payload.budget;
    }

    if (payload.location !== undefined) {
      const locationCheck = validateServiceLocation(payload.location);
      if (!locationCheck.valid) {
        return res.status(400).json({ message: locationCheck.message });
      }
      payload.location = locationCheck.location;
    }

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
      serviceRequest: normalizeServiceRequest(updatedRequest),
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
    const query = { status: "Pending", bookingType: "post" };

    const requests = await ServiceRequest.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    // Filter to only include requests where userId exists and has role 'customer'
    const filteredRequests = requests.filter(
      (request) => request.userId && request.userId.role === 'customer'
    );

    res.status(200).json(mapRequests(filteredRequests));
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

    const providerAccount = await User.findById(req.user.id);
    const providerProfile = await Provider.findOne({ userId: req.user.id });

    if (!providerAccount || providerAccount.role !== 'provider') {
      return res.status(403).json({ message: "Only providers can send offers" });
    }

    const isApproved = providerProfile?.status === 'approved' || providerAccount.providerStatus === 'approved';
    if (!isApproved) {
      return res.status(403).json({
        message: "Your provider account is not approved yet. Please wait for admin approval.",
        providerStatus: providerProfile?.status || providerAccount.providerStatus
      });
    }

    const serviceRequest = await ServiceRequest.findById(id);

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    if (serviceRequest.status !== "Pending") {
      return res.status(400).json({ message: "Service request is not available" });
    }

    if (serviceRequest.bookingType !== 'post') {
      return res.status(400).json({ message: "This request is not open for offers" });
    }

    const normalizedPrice = Number(proposedPrice);
    const offerPrice = Number.isFinite(normalizedPrice) && normalizedPrice > 0
      ? normalizedPrice
      : (serviceRequest.dailyBudget ?? serviceRequest.budget);

    // Send offer to customer instead of directly accepting
    serviceRequest.status = "OfferSent";
    serviceRequest.providerId = req.user.id;
    serviceRequest.providerOffer = {
      sendAt: new Date(),
      message: message || '',
      proposedPrice: offerPrice,
      proposedDate: proposedDate || serviceRequest.preferredDate,
      customerResponse: 'pending'
    };

    await saveServiceRequest(serviceRequest);

    res.status(200).json({
      message: "Offer sent to customer successfully",
      serviceRequest: normalizeServiceRequest(serviceRequest),
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
    res.status(200).json(mapRequests(requests));
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

    if (!['Accepted', 'Confirmed'].includes(serviceRequest.status)) {
      return res.status(400).json({ message: "Service request is not in a completable status" });
    }

    serviceRequest.providerCompleted = true;
    serviceRequest.providerCompletedAt = new Date();

    if (serviceRequest.customerCompleted) {
      serviceRequest.status = "Completed";
      serviceRequest.completedAt = new Date();
    }

    serviceRequest.journeyActive = false;
    await saveServiceRequest(serviceRequest);
    await stopJourneyForProvider(req.user.id);

    res.status(200).json({
      message: "Provider completion recorded",
      serviceRequest: normalizeServiceRequest(serviceRequest),
    });
  } catch (error) {
    console.error('completeServiceRequest error:', error);
    res.status(500).json({
      message: "Failed to complete service request",
      error: error.message,
    });
  }
};

// POST - Customer marks a service request completed
export const completeServiceRequestByCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceRequest = await ServiceRequest.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found or not authorized" });
    }

    if (!['Accepted', 'Confirmed'].includes(serviceRequest.status)) {
      return res.status(400).json({ message: "Service request is not in a completable status" });
    }

    serviceRequest.customerCompleted = true;
    serviceRequest.customerCompletedAt = new Date();

    if (serviceRequest.providerCompleted) {
      serviceRequest.status = "Completed";
      serviceRequest.completedAt = new Date();
    }

    serviceRequest.journeyActive = false;
    await saveServiceRequest(serviceRequest);

    if (serviceRequest.status === 'Completed' && serviceRequest.providerId) {
      await stopJourneyForProvider(serviceRequest.providerId);
    }

    res.status(200).json({
      message: "Customer completion recorded",
      serviceRequest: normalizeServiceRequest(serviceRequest),
    });
  } catch (error) {
    console.error('completeServiceRequestByCustomer error:', error);
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

    await saveServiceRequest(serviceRequest);

    res.status(200).json({
      message: "Provider offer accepted successfully",
      serviceRequest: normalizeServiceRequest(serviceRequest),
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

    await saveServiceRequest(serviceRequest);

    res.status(200).json({
      message: "Provider offer rejected successfully",
      serviceRequest: normalizeServiceRequest(serviceRequest),
    });
  } catch (error) {
    console.error('rejectProviderOffer error:', error);
    res.status(500).json({
      message: "Failed to reject offer",
      error: error.message,
    });
  }
};

// GET - Get direct booking requests for provider (from Services page)
export const getDirectBookingRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      providerId: req.user.id,
      bookingType: 'direct',
      'providerResponse.status': 'pending'
    })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json(mapRequests(requests));
  } catch (error) {
    console.error('getDirectBookingRequests error:', error);
    res.status(500).json({
      message: "Failed to fetch booking requests",
      error: error.message,
    });
  }
};

// POST - Provider accepts direct booking from Services page
export const acceptDirectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { responseMessage } = req.body;

    const serviceRequest = await ServiceRequest.findOne({
      _id: id,
      providerId: req.user.id,
      bookingType: 'direct'
    });

    if (!serviceRequest) {
      return res.status(404).json({ message: "Booking request not found or not authorized" });
    }

    if (serviceRequest.providerResponse?.status !== 'pending') {
      return res.status(400).json({ message: "This booking has already been responded to" });
    }

    serviceRequest.status = "Confirmed";
    serviceRequest.providerResponse = {
      respondedAt: new Date(),
      status: 'accepted',
      responseMessage: responseMessage || 'Booking accepted'
    };
    serviceRequest.acceptedAt = new Date();

    await saveServiceRequest(serviceRequest);

    res.status(200).json({
      message: "Booking accepted successfully",
      serviceRequest: normalizeServiceRequest(serviceRequest),
    });
  } catch (error) {
    console.error('acceptDirectBooking error:', error);
    res.status(500).json({
      message: "Failed to accept booking",
      error: error.message,
    });
  }
};

// POST - Provider rejects direct booking from Services page
export const rejectDirectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { responseMessage } = req.body;

    const serviceRequest = await ServiceRequest.findOne({
      _id: id,
      providerId: req.user.id,
      bookingType: 'direct'
    });

    if (!serviceRequest) {
      return res.status(404).json({ message: "Booking request not found or not authorized" });
    }

    if (serviceRequest.providerResponse?.status !== 'pending') {
      return res.status(400).json({ message: "This booking has already been responded to" });
    }

    serviceRequest.status = "ProviderRejected";
    serviceRequest.providerResponse = {
      respondedAt: new Date(),
      status: 'rejected',
      responseMessage: responseMessage || 'Booking rejected'
    };

    await saveServiceRequest(serviceRequest);

    res.status(200).json({
      message: "Booking rejected successfully",
      serviceRequest: normalizeServiceRequest(serviceRequest),
    });
  } catch (error) {
    console.error('rejectDirectBooking error:', error);
    res.status(500).json({
      message: "Failed to reject booking",
      error: error.message,
    });
  }
};

