const DEFAULT_COMMISSION_RATE = 5;

export const getPaymentBreakdown = (payment) => {
  const serviceAmount = Number(payment?.serviceAmount ?? payment?.amount ?? 0);
  const commissionRate = Number(payment?.commissionRate ?? DEFAULT_COMMISSION_RATE);
  const released = payment?.payoutStatus === 'paid' || payment?.status === 'approved';

  if (released) {
    if (payment?.commissionAmount != null && payment?.providerAmount != null) {
      return {
        serviceAmount,
        commissionRate,
        commissionAmount: Number(payment.commissionAmount),
        providerAmount: Number(payment.providerAmount),
      };
    }
    return {
      serviceAmount,
      commissionRate,
      commissionAmount: 0,
      providerAmount: serviceAmount,
    };
  }

  const commissionAmount = Math.round(serviceAmount * (commissionRate / 100) * 100) / 100;
  const providerAmount = Math.round((serviceAmount - commissionAmount) * 100) / 100;

  return {
    serviceAmount,
    commissionRate,
    commissionAmount,
    providerAmount,
  };
};
