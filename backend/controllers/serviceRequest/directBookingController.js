import ServiceRequest from '../../models/ServiceRequest.js';
import {
  AGREEMENT_STATUSES,
  applyAgreedTerms,
  parseProviderEstimate,
} from '../../utils/serviceAgreement.js';
import { mapRequests, normalizeServiceRequest, saveServiceRequest } from './serviceRequestHelpers.js';

// GET - Get direct booking requests for provider (from Services page)
export const getDirectBookingRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      providerId: req.user.id,
      bookingType: 'direct',
      'providerResponse.status': 'pending',
      $or: [
        { agreementStatus: AGREEMENT_STATUSES.PENDING_PROVIDER_ESTIMATE },
        { agreementStatus: { $exists: false } },
        { agreementStatus: null },
      ],
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

// POST - Provider submits duration estimate for direct booking
export const submitDirectBookingEstimate = async (req, res) => {
  try {
    const { id } = req.params;

    let estimate;
    try {
      estimate = parseProviderEstimate(req.body);
    } catch (parseError) {
      return res.status(400).json({ message: parseError.message });
    }

    const serviceRequest = await ServiceRequest.findOne({
      _id: id,
      providerId: req.user.id,
      bookingType: 'direct',
    });

    if (!serviceRequest) {
      return res.status(404).json({ message: "Booking request not found or not authorized" });
    }

    if (serviceRequest.providerResponse?.status !== 'pending') {
      return res.status(400).json({ message: "This booking has already been responded to" });
    }

    serviceRequest.status = 'OfferSent';
    serviceRequest.agreementStatus = AGREEMENT_STATUSES.PENDING_CUSTOMER_CONFIRMATION;
    serviceRequest.providerResponse = {
      respondedAt: new Date(),
      status: 'estimated',
      providerMessage: estimate.providerMessage,
      responseMessage: estimate.providerMessage,
      dailyRate: estimate.dailyRate,
      estimatedDurationDays: estimate.estimatedDurationDays,
      totalEstimatedCost: estimate.totalEstimatedCost,
      customerConfirmation: 'pending',
    };

    await saveServiceRequest(serviceRequest);

    res.status(200).json({
      message: "Booking estimate sent to customer",
      serviceRequest: normalizeServiceRequest(serviceRequest),
    });
  } catch (error) {
    console.error('submitDirectBookingEstimate error:', error);
    res.status(500).json({
      message: "Failed to submit booking estimate",
      error: error.message,
    });
  }
};

/** @deprecated Use submitDirectBookingEstimate */
export const acceptDirectBooking = submitDirectBookingEstimate;

// POST - Customer confirms direct booking proposal
export const confirmDirectBookingProposal = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceRequest = await ServiceRequest.findOne({
      _id: id,
      userId: req.user.id,
      bookingType: 'direct',
    });

    if (!serviceRequest) {
      return res.status(404).json({ message: "Booking not found or not authorized" });
    }

    if (serviceRequest.status !== 'OfferSent'
      || serviceRequest.providerResponse?.status !== 'estimated'
      || serviceRequest.providerResponse?.customerConfirmation !== 'pending') {
      return res.status(400).json({ message: "No pending booking proposal to confirm" });
    }

    const estimate = {
      dailyRate: serviceRequest.providerResponse.dailyRate,
      estimatedDurationDays: serviceRequest.providerResponse.estimatedDurationDays,
      totalEstimatedCost: serviceRequest.providerResponse.totalEstimatedCost,
      providerMessage: serviceRequest.providerResponse.providerMessage,
    };

    serviceRequest.status = 'Confirmed';
    serviceRequest.acceptedAt = new Date();
    serviceRequest.providerResponse.status = 'accepted';
    serviceRequest.providerResponse.customerConfirmation = 'accepted';
    serviceRequest.providerResponse.customerConfirmedAt = new Date();
    applyAgreedTerms(serviceRequest, estimate);
    serviceRequest.agreementStatus = AGREEMENT_STATUSES.PAYMENT_PENDING;

    await saveServiceRequest(serviceRequest);

    res.status(200).json({
      message: "Booking proposal confirmed",
      serviceRequest: normalizeServiceRequest(serviceRequest),
    });
  } catch (error) {
    console.error('confirmDirectBookingProposal error:', error);
    res.status(500).json({
      message: "Failed to confirm booking proposal",
      error: error.message,
    });
  }
};

// POST - Customer rejects direct booking proposal
export const rejectDirectBookingProposal = async (req, res) => {
  try {
    const { id } = req.params;

    const serviceRequest = await ServiceRequest.findOne({
      _id: id,
      userId: req.user.id,
      bookingType: 'direct',
    });

    if (!serviceRequest) {
      return res.status(404).json({ message: "Booking not found or not authorized" });
    }

    if (serviceRequest.status !== 'OfferSent'
      || serviceRequest.providerResponse?.status !== 'estimated') {
      return res.status(400).json({ message: "No pending booking proposal to reject" });
    }

    serviceRequest.status = 'ProviderRejected';
    serviceRequest.agreementStatus = AGREEMENT_STATUSES.REJECTED;
    serviceRequest.providerResponse.status = 'rejected';
    serviceRequest.providerResponse.customerConfirmation = 'rejected';
    serviceRequest.providerResponse.customerConfirmedAt = new Date();

    await saveServiceRequest(serviceRequest);

    res.status(200).json({
      message: "Booking proposal rejected",
      serviceRequest: normalizeServiceRequest(serviceRequest),
    });
  } catch (error) {
    console.error('rejectDirectBookingProposal error:', error);
    res.status(500).json({
      message: "Failed to reject booking proposal",
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
    serviceRequest.agreementStatus = AGREEMENT_STATUSES.REJECTED;
    serviceRequest.providerResponse.respondedAt = new Date();
    serviceRequest.providerResponse.status = 'rejected';
    serviceRequest.providerResponse.responseMessage = responseMessage || 'Booking rejected';
    serviceRequest.providerResponse.customerConfirmation = 'rejected';

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
