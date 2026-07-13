import { ensureStoredLocation } from '../../utils/locationUtils.js';

export const resolveDailyBudget = (payload) => {
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

  if (obj.providerOffer) {
    if (!obj.providerOffer.totalEstimatedCost && obj.providerOffer.proposedPrice) {
      obj.providerOffer.totalEstimatedCost = obj.providerOffer.proposedPrice;
      obj.providerOffer.dailyRate = obj.providerOffer.dailyRate ?? obj.providerOffer.proposedPrice;
      obj.providerOffer.estimatedDurationDays = obj.providerOffer.estimatedDurationDays ?? 1;
    }
    if (!obj.providerOffer.providerMessage && obj.providerOffer.message) {
      obj.providerOffer.providerMessage = obj.providerOffer.message;
    }
  }

  return obj;
};

export const mapRequests = (requests) => {
  if (Array.isArray(requests)) {
    return requests.map((item) => normalizeServiceRequest(item));
  }
  return normalizeServiceRequest(requests);
};

export const saveServiceRequest = async (serviceRequest) => {
  ensureStoredLocation(serviceRequest);
  return serviceRequest.save();
};
