import { isAgreementConfirmed } from './serviceAgreement.js';

/** Amount the customer should pay for a service request (LKR). */
export const getRequestPayableAmount = (request) => {
  if (!request) return 0;

  if (!isAgreementConfirmed(request)) {
    return 0;
  }

  if (request.agreedTotalAmount != null && Number(request.agreedTotalAmount) > 0) {
    return Number(request.agreedTotalAmount);
  }

  const offer = request.providerOffer;
  if (offer?.totalEstimatedCost != null && Number(offer.totalEstimatedCost) > 0) {
    return Number(offer.totalEstimatedCost);
  }
  if (offer?.proposedPrice != null && Number(offer.proposedPrice) > 0) {
    return Number(offer.proposedPrice);
  }

  const response = request.providerResponse;
  if (response?.totalEstimatedCost != null && Number(response.totalEstimatedCost) > 0
    && response.customerConfirmation === 'accepted') {
    return Number(response.totalEstimatedCost);
  }

  const dailyBudget = request.dailyBudget ?? request.budget;
  if (dailyBudget != null && Number(dailyBudget) > 0) {
    return Number(dailyBudget);
  }

  return 0;
};
