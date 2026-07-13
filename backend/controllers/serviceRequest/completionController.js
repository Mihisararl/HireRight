import ServiceRequest from '../../models/ServiceRequest.js';
import { stopJourneyForProvider } from '../../utils/locationUtils.js';
import { AGREEMENT_STATUSES } from '../../utils/serviceAgreement.js';
import { normalizeServiceRequest, saveServiceRequest } from './serviceRequestHelpers.js';

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
      serviceRequest.agreementStatus = AGREEMENT_STATUSES.COMPLETED;
    } else {
      serviceRequest.agreementStatus = AGREEMENT_STATUSES.IN_PROGRESS;
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
      serviceRequest.agreementStatus = AGREEMENT_STATUSES.COMPLETED;
    } else {
      serviceRequest.agreementStatus = AGREEMENT_STATUSES.IN_PROGRESS;
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
