/** Amount the customer should pay for a service request (LKR). */
export const getRequestPayableAmount = (request) => {
  if (!request) return 0;

  const offerPrice = request.providerOffer?.proposedPrice;
  if (offerPrice != null && Number(offerPrice) > 0) {
    return Number(offerPrice);
  }

  const dailyBudget = request.dailyBudget ?? request.budget;
  if (dailyBudget != null && Number(dailyBudget) > 0) {
    return Number(dailyBudget);
  }

  return 0;
};
