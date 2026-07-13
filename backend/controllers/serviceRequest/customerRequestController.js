import ServiceRequest from '../../models/ServiceRequest.js';
import { validateServiceLocation } from '../../utils/locationUtils.js';
import { attachProviderProfilesToRequests } from '../../utils/providerProfileUtils.js';
import { AGREEMENT_STATUSES } from '../../utils/serviceAgreement.js';
import {
  mapRequests,
  normalizeServiceRequest,
  resolveDailyBudget,
} from './serviceRequestHelpers.js';

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

    payload.agreementStatus = AGREEMENT_STATUSES.PENDING_PROVIDER_ESTIMATE;
    payload.status = 'Pending';

    if (payload.bookingType === 'direct') {
      payload.providerResponse = {
        status: 'pending',
        customerConfirmation: 'pending',
      };
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
