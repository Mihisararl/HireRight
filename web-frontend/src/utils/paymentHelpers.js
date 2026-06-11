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
    // Legacy payments released before commission tracking
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

export const formatLkr = (value) => `Rs. ${Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})}`;

export const getPaymentStatusLabel = (payment) => {
  if (payment?.payoutStatus === 'paid' || payment?.status === 'approved') {
    return 'Released';
  }
  if (payment?.payoutStatus === 'hold') {
    return 'Hold';
  }
  return payment?.status || 'Pending';
};
