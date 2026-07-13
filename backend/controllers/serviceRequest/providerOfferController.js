import ServiceRequest from '../../models/ServiceRequest.js';
import User from '../../models/User.js';
import Provider from '../../models/Provider.js';
import {
  AGREEMENT_STATUSES,
  applyAgreedTerms,
  parseProviderEstimate,
} from '../../utils/serviceAgreement.js';
import {
  mapRequests,
  normalizeServiceRequest,
  saveServiceRequest,
} from './serviceRequestHelpers.js';

// GET - Get available service requests for providers
export const getAvailableServiceRequests = async (req, res) => {
  try {
    const query = {
      status: "Pending",
      bookingType: "post",
      $or: [
        { agreementStatus: AGREEMENT_STATUSES.PENDING_PROVIDER_ESTIMATE },
        { agreementStatus: { $exists: false } },
        { agreementStatus: null },
      ],
    };

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

// POST - Send offer with provider duration estimate (post requests)
export const acceptServiceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { proposedDate } = req.body;

    let estimate;
    try {
      estimate = parseProviderEstimate(req.body);
    } catch (parseError) {
      return res.status(400).json({ message: parseError.message });
    }

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

    serviceRequest.status = "OfferSent";
    serviceRequest.agreementStatus = AGREEMENT_STATUSES.PENDING_CUSTOMER_CONFIRMATION;
    serviceRequest.providerId = req.user.id;
    serviceRequest.providerOffer = {
      sendAt: new Date(),
      message: estimate.providerMessage,
      providerMessage: estimate.providerMessage,
      dailyRate: estimate.dailyRate,
      estimatedDurationDays: estimate.estimatedDurationDays,
      totalEstimatedCost: estimate.totalEstimatedCost,
      proposedPrice: estimate.totalEstimatedCost,
      proposedDate: proposedDate || serviceRequest.preferredDate,
      customerResponse: 'pending',
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

    const estimate = {
      dailyRate: serviceRequest.providerOffer.dailyRate
        ?? serviceRequest.providerOffer.proposedPrice,
      estimatedDurationDays: serviceRequest.providerOffer.estimatedDurationDays ?? 1,
      totalEstimatedCost: serviceRequest.providerOffer.totalEstimatedCost
        ?? serviceRequest.providerOffer.proposedPrice,
      providerMessage: serviceRequest.providerOffer.providerMessage
        ?? serviceRequest.providerOffer.message,
    };

    serviceRequest.status = "Accepted";
    serviceRequest.acceptedAt = new Date();
    serviceRequest.providerOffer.customerResponse = 'accepted';
    serviceRequest.providerOffer.customerResponseAt = new Date();
    applyAgreedTerms(serviceRequest, estimate);
    serviceRequest.agreementStatus = AGREEMENT_STATUSES.PAYMENT_PENDING;

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

    serviceRequest.status = "Pending";
    serviceRequest.agreementStatus = AGREEMENT_STATUSES.PENDING_PROVIDER_ESTIMATE;
    serviceRequest.providerOffer.customerResponse = 'rejected';
    serviceRequest.providerOffer.customerResponseAt = new Date();
    serviceRequest.providerId = null;
    serviceRequest.set('providerOffer', undefined);

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
