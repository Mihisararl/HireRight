/** Platform commission rate as a decimal (5% = 0.05). Change here to update globally. */
export const PLATFORM_COMMISSION_RATE = 0.05;

/** Platform commission rate as a percentage for storage and display (e.g. 5). */
export const PLATFORM_COMMISSION_PERCENT = PLATFORM_COMMISSION_RATE * 100;

/**
 * @param {number} serviceAmount - Full amount paid by the customer
 * @param {number} [commissionRatePercent] - Override rate in percent (default from constant)
 */
export const calculateCommissionBreakdown = (serviceAmount, commissionRatePercent = PLATFORM_COMMISSION_PERCENT) => {
  const normalizedServiceAmount = Number(serviceAmount);
  if (!Number.isFinite(normalizedServiceAmount) || normalizedServiceAmount < 0) {
    throw new Error('Invalid service amount');
  }

  const ratePercent = Number(commissionRatePercent);
  const rate = ratePercent / 100;
  const commissionAmount = Math.round(normalizedServiceAmount * rate * 100) / 100;
  const providerAmount = Math.round((normalizedServiceAmount - commissionAmount) * 100) / 100;

  return {
    serviceAmount: normalizedServiceAmount,
    commissionRate: ratePercent,
    commissionAmount,
    providerAmount,
  };
};
