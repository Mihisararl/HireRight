import Complaint from '../models/Complaint.js';
import ServiceRequest from '../models/ServiceRequest.js';
import {
  PLATFORM_COMMISSION_PERCENT,
  calculateCommissionBreakdown,
} from '../constants/commission.js';

/** Customer can reopen a resolved complaint within this window before payment release. */
export const COMPLAINT_REOPEN_WINDOW_MS = 48 * 60 * 60 * 1000;

export const getPaymentServiceAmount = (payment) => (
  Number(payment.serviceAmount ?? payment.amount ?? 0)
);

export const getProjectedCommission = (payment) => {
  const serviceAmount = getPaymentServiceAmount(payment);
  const commissionRate = payment.commissionRate ?? PLATFORM_COMMISSION_PERCENT;
  return calculateCommissionBreakdown(serviceAmount, commissionRate);
};

/**
 * Validates whether a payment can be released to the provider.
 * @returns {{ ok: true } | { ok: false, message: string, statusCode?: number }}
 */
export const validatePaymentRelease = async (payment) => {
  if (!payment) {
    return { ok: false, message: 'Payment not found', statusCode: 404 };
  }

  if (payment.payoutStatus === 'paid' || payment.status === 'approved') {
    return { ok: false, message: 'Payment has already been released', statusCode: 400 };
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
 * Applies commission, marks payment as released, and saves.
 * Caller must run validatePaymentRelease first.
 */
export const applyPaymentRelease = (payment) => {
  const serviceAmount = getPaymentServiceAmount(payment);
  if (!Number.isFinite(serviceAmount) || serviceAmount <= 0) {
    throw new Error('Invalid payment service amount');
  }

  const commissionRate = payment.commissionRate ?? PLATFORM_COMMISSION_PERCENT;
  const { commissionAmount, providerAmount } = calculateCommissionBreakdown(
    serviceAmount,
    commissionRate
  );

  const now = new Date();

  payment.serviceAmount = serviceAmount;
  payment.commissionRate = commissionRate;
  payment.commissionAmount = commissionAmount;
  payment.providerAmount = providerAmount;
  payment.status = 'approved';
  payment.payoutStatus = 'paid';
  payment.approvedAt = payment.approvedAt || now;
  payment.releasedAt = now;

  return payment;
};
