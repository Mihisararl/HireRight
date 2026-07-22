const DEFAULT_COMMISSION_RATE = 5;

export const SETTLEMENT_TYPES = {
  FULL_RELEASE: 'FULL_RELEASE',
  PARTIAL_RELEASE: 'PARTIAL_RELEASE',
  FULL_REFUND: 'FULL_REFUND',
};

const roundMoney = (value) => Math.round(Number(value) * 100) / 100;

export const calculateSettlement = ({
  totalAmount,
  settlementType = SETTLEMENT_TYPES.FULL_RELEASE,
  settlementAmountInput = null,
  commissionRatePercent = DEFAULT_COMMISSION_RATE,
}) => {
  const total = roundMoney(totalAmount);
  const commissionRate = Number(commissionRatePercent);
  const rate = commissionRate / 100;

  let settlementAmount = 0;
  let commissionAmount = 0;
  let providerAmount = 0;
  let refundAmount = 0;

  switch (settlementType) {
    case SETTLEMENT_TYPES.FULL_RELEASE:
      settlementAmount = total;
      commissionAmount = roundMoney(total * rate);
      providerAmount = roundMoney(total - commissionAmount);
      break;
    case SETTLEMENT_TYPES.PARTIAL_RELEASE: {
      const entered = roundMoney(settlementAmountInput);
      settlementAmount = entered;
      commissionAmount = roundMoney(settlementAmount * rate);
      providerAmount = roundMoney(settlementAmount - commissionAmount);
      refundAmount = roundMoney(total - settlementAmount);
      break;
    }
    case SETTLEMENT_TYPES.FULL_REFUND:
      refundAmount = total;
      break;
    default:
      break;
  }

  return {
    serviceAmount: total,
    settlementType,
    settlementAmount,
    commissionRate,
    commissionAmount,
    providerAmount,
    refundAmount,
  };
};

export const getPaymentBreakdown = (payment) => {
  const serviceAmount = Number(payment?.serviceAmount ?? payment?.amount ?? 0);
  const commissionRate = Number(payment?.commissionRate ?? DEFAULT_COMMISSION_RATE);
  const settled = payment?.status === 'approved'
    && (payment?.payoutStatus === 'paid' || payment?.payoutStatus === 'refunded');

  if (settled && payment?.settlementType) {
    return {
      serviceAmount,
      settlementType: payment.settlementType,
      settlementAmount: Number(payment.settlementAmount ?? 0),
      commissionRate,
      commissionAmount: Number(payment.commissionAmount ?? 0),
      providerAmount: Number(payment.providerAmount ?? 0),
      refundAmount: Number(payment.refundAmount ?? 0),
    };
  }

  if (settled) {
    if (payment?.commissionAmount != null && payment?.providerAmount != null) {
      return {
        serviceAmount,
        settlementType: SETTLEMENT_TYPES.FULL_RELEASE,
        settlementAmount: serviceAmount,
        commissionRate,
        commissionAmount: Number(payment.commissionAmount),
        providerAmount: Number(payment.providerAmount),
        refundAmount: Number(payment.refundAmount ?? 0),
      };
    }
    return {
      serviceAmount,
      settlementType: SETTLEMENT_TYPES.FULL_RELEASE,
      settlementAmount: serviceAmount,
      commissionRate,
      commissionAmount: 0,
      providerAmount: serviceAmount,
      refundAmount: 0,
    };
  }

  return calculateSettlement({
    totalAmount: serviceAmount,
    settlementType: payment?.settlementType || SETTLEMENT_TYPES.FULL_RELEASE,
    settlementAmountInput: payment?.settlementAmount,
    commissionRatePercent: commissionRate,
  });
};
