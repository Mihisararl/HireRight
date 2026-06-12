export const AGREEMENT_STATUSES = {
  PENDING_PROVIDER_ESTIMATE: 'PENDING_PROVIDER_ESTIMATE',
  PENDING_CUSTOMER_CONFIRMATION: 'PENDING_CUSTOMER_CONFIRMATION',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

const roundMoney = (value) => Math.round(Number(value) * 100) / 100;

export const calculateTotalEstimatedCost = (dailyRate, estimatedDurationDays) => {
  const rate = Number(dailyRate);
  const days = Number(estimatedDurationDays);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('Daily rate must be greater than 0');
  }
  if (!Number.isFinite(days) || days <= 0) {
    throw new Error('Estimated duration must be greater than 0 days');
  }
  return roundMoney(rate * days);
};

/**
 * Parse provider estimate from request body (supports legacy proposedPrice as total).
 */
export const parseProviderEstimate = (body = {}) => {
  const dailyRate = Number(body.dailyRate);
  const estimatedDurationDays = Number(body.estimatedDurationDays);
  const providerMessage = String(body.providerMessage ?? body.message ?? '').trim();

  if (Number.isFinite(dailyRate) && dailyRate > 0
    && Number.isFinite(estimatedDurationDays) && estimatedDurationDays > 0) {
    const totalEstimatedCost = calculateTotalEstimatedCost(dailyRate, estimatedDurationDays);
    return {
      dailyRate,
      estimatedDurationDays,
      totalEstimatedCost,
      providerMessage,
    };
  }

  const legacyTotal = Number(body.proposedPrice ?? body.totalEstimatedCost);
  if (Number.isFinite(legacyTotal) && legacyTotal > 0) {
    return {
      dailyRate: legacyTotal,
      estimatedDurationDays: 1,
      totalEstimatedCost: legacyTotal,
      providerMessage,
    };
  }

  throw new Error('Daily rate and estimated duration (days) are required');
};

export const applyAgreedTerms = (serviceRequest, estimate) => {
  serviceRequest.dailyRate = estimate.dailyRate;
  serviceRequest.estimatedDurationDays = estimate.estimatedDurationDays;
  serviceRequest.agreedTotalAmount = estimate.totalEstimatedCost;
  serviceRequest.agreementStatus = AGREEMENT_STATUSES.CONFIRMED;
};

export const isAgreementConfirmed = (request) => (
  ['Accepted', 'Confirmed'].includes(request?.status)
  || request?.agreementStatus === AGREEMENT_STATUSES.CONFIRMED
  || request?.agreementStatus === AGREEMENT_STATUSES.PAYMENT_PENDING
  || request?.agreementStatus === AGREEMENT_STATUSES.IN_PROGRESS
);

export const getEstimateFromRequest = (request) => {
  if (!request) return null;

  if (request.agreedTotalAmount > 0) {
    return {
      dailyRate: request.dailyRate,
      estimatedDurationDays: request.estimatedDurationDays,
      totalEstimatedCost: request.agreedTotalAmount,
      providerMessage: request.providerOffer?.providerMessage
        || request.providerResponse?.providerMessage
        || '',
      source: 'agreed',
    };
  }

  const offer = request.providerOffer;
  if (offer?.totalEstimatedCost > 0 || offer?.proposedPrice > 0) {
    return {
      dailyRate: offer.dailyRate ?? offer.proposedPrice,
      estimatedDurationDays: offer.estimatedDurationDays ?? 1,
      totalEstimatedCost: offer.totalEstimatedCost ?? offer.proposedPrice,
      providerMessage: offer.providerMessage ?? offer.message ?? '',
      source: 'offer',
    };
  }

  const response = request.providerResponse;
  if (response?.totalEstimatedCost > 0) {
    return {
      dailyRate: response.dailyRate,
      estimatedDurationDays: response.estimatedDurationDays,
      totalEstimatedCost: response.totalEstimatedCost,
      providerMessage: response.providerMessage ?? response.responseMessage ?? '',
      source: 'direct',
    };
  }

  return null;
};
