/** LKR per day — supports legacy `budget` field on older service requests */
export const getRequestDailyBudget = (request) => (
  Number(request?.dailyBudget ?? request?.budget ?? 0)
);

/** Total amount customer pays after both parties agree */
export const getRequestPayableAmount = (request) => {
  if (!request) return 0;

  const confirmed = ['Accepted', 'Confirmed', 'Completed'].includes(request.status);
  if (!confirmed) return 0;

  if (request.agreedTotalAmount != null && Number(request.agreedTotalAmount) > 0) {
    return Number(request.agreedTotalAmount);
  }

  const offer = request.providerOffer;
  if (offer?.totalEstimatedCost != null && Number(offer.totalEstimatedCost) > 0
    && offer.customerResponse === 'accepted') {
    return Number(offer.totalEstimatedCost);
  }
  if (offer?.proposedPrice != null && Number(offer.proposedPrice) > 0
    && offer.customerResponse === 'accepted') {
    return Number(offer.proposedPrice);
  }

  const response = request.providerResponse;
  if (response?.totalEstimatedCost != null && Number(response.totalEstimatedCost) > 0
    && response.customerConfirmation === 'accepted') {
    return Number(response.totalEstimatedCost);
  }

  return getRequestDailyBudget(request);
};

/** Best amount to show on job cards (budget, offer, or agreed total) */
export const getRequestDisplayAmount = (request) => {
  if (request?.agreedTotalAmount != null && Number(request.agreedTotalAmount) > 0) {
    return Number(request.agreedTotalAmount);
  }

  const offer = request?.providerOffer;
  if (offer?.totalEstimatedCost != null && Number(offer.totalEstimatedCost) > 0) {
    return Number(offer.totalEstimatedCost);
  }
  if (offer?.proposedPrice != null && Number(offer.proposedPrice) > 0) {
    return Number(offer.proposedPrice);
  }

  const response = request?.providerResponse;
  if (response?.totalEstimatedCost != null && Number(response.totalEstimatedCost) > 0) {
    return Number(response.totalEstimatedCost);
  }

  return getRequestDailyBudget(request);
};

export const formatLkr = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

export const formatLkrPerDay = (value) => `${formatLkr(value)} / day`;
