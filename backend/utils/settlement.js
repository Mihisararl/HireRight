import { PLATFORM_COMMISSION_PERCENT } from '../constants/commission.js';
import { SETTLEMENT_TYPES, SETTLEMENT_TYPE_VALUES } from '../constants/settlement.js';

const roundMoney = (value) => Math.round(Number(value) * 100) / 100;

/**
 * @param {{
 *   totalAmount: number,
 *   settlementType: string,
 *   settlementAmountInput?: number | null,
 *   commissionRatePercent?: number,
 * }} params
 */
export const calculateSettlement = ({
  totalAmount,
  settlementType,
  settlementAmountInput = null,
  commissionRatePercent = PLATFORM_COMMISSION_PERCENT,
}) => {
  const total = roundMoney(totalAmount);
  if (!Number.isFinite(total) || total < 0) {
    throw new Error('Invalid total payment amount');
  }

  if (!SETTLEMENT_TYPE_VALUES.includes(settlementType)) {
    throw new Error('Invalid settlement type');
  }

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
      refundAmount = 0;
      break;

    case SETTLEMENT_TYPES.PARTIAL_RELEASE: {
      const entered = roundMoney(settlementAmountInput);
      if (!Number.isFinite(entered) || entered < 0) {
        throw new Error('Settlement amount must be a non-negative number');
      }
      if (entered > total) {
        throw new Error('Settlement amount cannot exceed total payment amount');
      }
      settlementAmount = entered;
      commissionAmount = roundMoney(settlementAmount * rate);
      providerAmount = roundMoney(settlementAmount - commissionAmount);
      refundAmount = roundMoney(total - settlementAmount);
      break;
    }

    case SETTLEMENT_TYPES.FULL_REFUND:
      settlementAmount = 0;
      commissionAmount = 0;
      providerAmount = 0;
      refundAmount = total;
      break;

    default:
      throw new Error('Unsupported settlement type');
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

/**
 * @returns {{ ok: true } | { ok: false, message: string, statusCode?: number }}
 */
export const validateSettlementRequest = ({
  settlementType,
  settlementAmountInput,
  totalAmount,
  requireDispute = false,
  hasDispute = false,
}) => {
  if (!SETTLEMENT_TYPE_VALUES.includes(settlementType)) {
    return { ok: false, message: 'Invalid settlement type', statusCode: 400 };
  }

  if (settlementType === SETTLEMENT_TYPES.PARTIAL_RELEASE && requireDispute && !hasDispute) {
    return {
      ok: false,
      message: 'Partial settlement is only available when there is a complaint or dispute',
      statusCode: 400,
    };
  }

  try {
    calculateSettlement({
      totalAmount,
      settlementType,
      settlementAmountInput,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message, statusCode: 400 };
  }
};
