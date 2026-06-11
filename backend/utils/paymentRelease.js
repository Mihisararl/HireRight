import Complaint from '../models/Complaint.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { SETTLEMENT_TYPES } from '../constants/settlement.js';
import { calculateSettlement } from './settlement.js';

/** Customer can reopen a resolved complaint within this window before payment release. */
export const COMPLAINT_REOPEN_WINDOW_MS = 48 * 60 * 60 * 1000;

export const getPaymentServiceAmount = (payment) => (
  Number(payment.serviceAmount ?? payment.amount ?? 0)
);

export const isPaymentSettled = (payment) => (
  payment?.status === 'approved'
  && (payment?.payoutStatus === 'paid' || payment?.payoutStatus === 'refunded')
);

/**
 * Validates whether a payment can be released/settled.
 * @returns {{ ok: true, serviceRequest, latestComplaint } | { ok: false, message: string, statusCode?: number }}
 */
export const validatePaymentRelease = async (payment) => {
  if (!payment) {
    return { ok: false, message: 'Payment not found', statusCode: 404 };
  }

  if (isPaymentSettled(payment)) {
    return { ok: false, message: 'Payment has already been settled', statusCode: 400 };
  }

  if (!payment.serviceRequestId) {
    return { ok: false, message: 'Payment is not linked to a service request', statusCode: 400 };
  }

  const serviceRequest = await ServiceRequest.findById(payment.serviceRequestId);
  if (!serviceRequest) {
    return { ok: false, message: 'Service request not found', statusCode: 404 };
  }

  const bothCompleted = serviceRequest.customerCompleted && serviceRequest.providerCompleted;
  if (!bothCompleted) {
    return {
      ok: false,
      message: 'Cannot release payment until both customer and provider complete the task',
      statusCode: 400,
    };
  }

  const latestComplaint = await Complaint.findOne({
    serviceRequestId: serviceRequest._id,
  }).sort({ createdAt: -1 });

  if (latestComplaint?.status === 'open') {
    return {
      ok: false,
      message: 'Service provider has a complaint. Please resolve it before releasing payment.',
      statusCode: 400,
    };
  }

  if (
    latestComplaint?.status === 'resolved'
    && latestComplaint.reopenUntil
    && Date.now() < latestComplaint.reopenUntil.getTime()
  ) {
    return {
      ok: false,
      message: 'Complaint resolved. Waiting 48 hours for possible reopen before releasing payment.',
      statusCode: 400,
    };
  }

  return { ok: true, serviceRequest, latestComplaint };
};

/**
 * Resolves settlement type/amount for a payment release.
 */
export const resolveSettlementOptions = (payment, latestComplaint) => {
  if (latestComplaint?.status === 'resolved' && latestComplaint.settlementType) {
    return {
      settlementType: latestComplaint.settlementType,
      settlementAmountInput: latestComplaint.settlementAmount,
      hasDispute: true,
    };
  }

  return {
    settlementType: SETTLEMENT_TYPES.FULL_RELEASE,
    settlementAmountInput: null,
    hasDispute: Boolean(latestComplaint),
  };
};

/**
 * Applies settlement, commission, and marks payment as settled.
 * Caller must run validatePaymentRelease first.
 */
export const applyPaymentSettlement = (payment, options = {}) => {
  const serviceAmount = getPaymentServiceAmount(payment);
  if (!Number.isFinite(serviceAmount) || serviceAmount <= 0) {
    throw new Error('Invalid payment service amount');
  }

  const settlementType = options.settlementType || SETTLEMENT_TYPES.FULL_RELEASE;
  const settlementAmountInput = options.settlementAmountInput ?? null;
  const commissionRate = payment.commissionRate ?? options.commissionRatePercent;

  const breakdown = calculateSettlement({
    totalAmount: serviceAmount,
    settlementType,
    settlementAmountInput,
    commissionRatePercent: commissionRate,
  });

  const now = new Date();

  payment.serviceAmount = breakdown.serviceAmount;
  payment.settlementType = breakdown.settlementType;
  payment.settlementAmount = breakdown.settlementAmount;
  payment.commissionRate = breakdown.commissionRate;
  payment.commissionAmount = breakdown.commissionAmount;
  payment.providerAmount = breakdown.providerAmount;
  payment.refundAmount = breakdown.refundAmount;
  payment.status = 'approved';
  payment.payoutStatus = settlementType === SETTLEMENT_TYPES.FULL_REFUND ? 'refunded' : 'paid';
  payment.approvedAt = payment.approvedAt || now;
  payment.releasedAt = now;

  return payment;
};

/** @deprecated Use applyPaymentSettlement with FULL_RELEASE */
export const applyPaymentRelease = (payment) => applyPaymentSettlement(payment, {
  settlementType: SETTLEMENT_TYPES.FULL_RELEASE,
});
