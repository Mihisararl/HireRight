export const calculateTotalEstimatedCost = (dailyRate, estimatedDurationDays) => {
  const rate = Number(dailyRate);
  const days = Number(estimatedDurationDays);
  if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(days) || days <= 0) {
    return 0;
  }
  return Math.round(rate * days * 100) / 100;
};

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
    };
  }

  const offer = request.providerOffer;
  if (offer && (offer.totalEstimatedCost > 0 || offer.proposedPrice > 0)) {
    return {
      dailyRate: offer.dailyRate ?? offer.proposedPrice,
      estimatedDurationDays: offer.estimatedDurationDays ?? 1,
      totalEstimatedCost: offer.totalEstimatedCost ?? offer.proposedPrice,
      providerMessage: offer.providerMessage ?? offer.message ?? '',
    };
  }

  const response = request.providerResponse;
  if (response?.totalEstimatedCost > 0) {
    return {
      dailyRate: response.dailyRate,
      estimatedDurationDays: response.estimatedDurationDays,
      totalEstimatedCost: response.totalEstimatedCost,
      providerMessage: response.providerMessage ?? response.responseMessage ?? '',
    };
  }

  return null;
};

export const isPendingCustomerConfirmation = (request) => {
  if (request?.bookingType === 'direct') {
    return request.status === 'OfferSent'
      && request.providerResponse?.status === 'estimated'
      && request.providerResponse?.customerConfirmation === 'pending';
  }
  return request?.status === 'OfferSent'
    && request?.providerOffer?.customerResponse === 'pending';
};
