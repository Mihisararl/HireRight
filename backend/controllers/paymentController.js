import crypto from 'crypto';
import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Provider from '../models/Provider.js';
import Complaint from '../models/Complaint.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { getRequestPayableAmount } from '../utils/serviceRequestAmount.js';

const md5 = (value) => crypto.createHash('md5').update(value).digest('hex');

const PAYMENT_HOLD_DAYS = 3;

const upsertServicePayment = async ({
  userId,
  providerId,
  serviceRequestId,
  amount,
  currency = 'LKR',
}) => {
  const normalizedAmount = Number(amount);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error('Invalid payment amount');
  }

  const holdUntil = new Date();
  holdUntil.setDate(holdUntil.getDate() + PAYMENT_HOLD_DAYS);

  const payment = await Payment.findOneAndUpdate(
    { serviceRequestId },
    {
      $set: {
        userId,
        providerId,
        serviceRequestId,
        amount: normalizedAmount,
        currency,
        status: 'pending',
        payoutStatus: 'hold',
        holdUntil,
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true, new: true }
  );

  return payment;
};

const getNgrokUrl = async () => {
  try {
    const response = await fetch('http://127.0.0.1:4040/api/tunnels');
    if (response.ok) {
      const data = await response.json();
      const tunnel = data.tunnels?.find(t => t.proto === 'https' || t.public_url?.startsWith('https://'));
      if (tunnel && tunnel.public_url) {
        return tunnel.public_url;
      }
    }
  } catch (err) {
    // ngrok is not running or not accessible
  }
  return null;
};

export const createPayhereHash = async (req, res) => {
  try {
    const { order_id, amount, currency } = req.body || {};

    if (!order_id || !amount || !currency) {
      return res.status(400).json({ message: 'order_id, amount, currency are required' });
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantId || !merchantSecret) {
      return res.status(500).json({ message: 'PayHere configuration missing' });
    }

    const hashedSecret = md5(merchantSecret).toUpperCase();
    const hash = md5(`${merchantId}${order_id}${amount}${currency}${hashedSecret}`).toUpperCase();

    // Dynamically check if ngrok is active to set the notification URL
    const ngrokUrl = await getNgrokUrl();
    const notifyUrl = ngrokUrl
      ? `${ngrokUrl}/api/payment/notify`
      : (process.env.PAYHERE_NOTIFY_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payment/notify`);

    console.log(`Generated hash for order ${order_id}. Notify URL: ${notifyUrl}`);

    res.json({ merchant_id: merchantId, hash, notify_url: notifyUrl });
  } catch (error) {
    console.error('createPayhereHash error:', error);
    res.status(500).json({ message: 'Failed to generate PayHere hash' });
  }
};

export const handlePayhereNotify = async (req, res) => {
  try {
    const payload = req.body || {};
    console.log('Incoming PayHere Notification payload:', JSON.stringify(payload, null, 2));

    const statusCode = String(payload.status_code || '');

    if (statusCode !== '2') {
      console.log(`Payment not completed. Status code: ${statusCode}`);
      return res.status(200).json({ message: 'Payment not completed' });
    }

    // Verify MD5 Signature to secure callback
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    if (merchantId && merchantSecret) {
      const hashedSecret = md5(merchantSecret).toUpperCase();
      const localMd5sig = md5(
        `${payload.merchant_id}${payload.order_id}${payload.payhere_amount}${payload.payhere_currency}${payload.status_code}${hashedSecret}`
      ).toUpperCase();

      if (localMd5sig !== (payload.md5sig || '').toUpperCase()) {
        console.warn(`handlePayhereNotify warning: Signature mismatch! Expected: ${localMd5sig}, Received: ${payload.md5sig}`);
      } else {
        console.log('PayHere signature verification successful.');
      }
    }

    const amount = Number(payload.payhere_amount || payload.amount || 0);
    const currency = payload.payhere_currency || payload.currency || 'LKR';

    // Safely parse user/provider IDs as MongoDB ObjectIds
    const customerUserId = payload.custom_1 && mongoose.Types.ObjectId.isValid(payload.custom_1) ? payload.custom_1 : null;
    const providerUserId = payload.custom_2 && mongoose.Types.ObjectId.isValid(payload.custom_2) ? payload.custom_2 : null;
    const serviceRequestId = payload.order_id && mongoose.Types.ObjectId.isValid(payload.order_id) ? payload.order_id : null;

    let providerId = null;
    if (providerUserId) {
      const providerProfile = await Provider.findOne({ userId: providerUserId }).select('_id');
      providerId = providerProfile?._id || null;
    }

    console.log(`Recording payment - User: ${customerUserId}, Provider: ${providerId}, ServiceRequest: ${serviceRequestId}, Amount: ${amount}`);

    if (!customerUserId || !serviceRequestId) {
      console.warn('PayHere notify missing customer or service request id');
      return res.status(200).json({ message: 'Missing metadata' });
    }

    await upsertServicePayment({
      userId: customerUserId,
      providerId,
      serviceRequestId,
      amount,
      currency,
    });
    console.log('Payment recorded successfully in database.');

    res.status(200).json({ message: 'Payment recorded' });
  } catch (error) {
    console.error('handlePayhereNotify error:', error);
    res.status(500).json({ message: 'Failed to process notification' });
  }
};

/** Called from frontend after PayHere onCompleted (localhost notify often unreachable) */
export const confirmPayment = async (req, res) => {
  try {
    const { serviceRequestId, amount, providerUserId } = req.body || {};

    if (!serviceRequestId || amount == null) {
      return res.status(400).json({ message: 'serviceRequestId and amount are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceRequestId)) {
      return res.status(400).json({ message: 'Invalid serviceRequestId' });
    }

    const serviceRequest = await ServiceRequest.findOne({
      _id: serviceRequestId,
      userId: req.user.id,
    });

    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found or not authorized' });
    }

    if (!['Accepted', 'Confirmed'].includes(serviceRequest.status)) {
      return res.status(400).json({ message: 'This booking is not ready for payment' });
    }

    const expectedAmount = getRequestPayableAmount(serviceRequest);
    const paidAmount = Number(amount);

    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    if (expectedAmount > 0 && Math.abs(paidAmount - expectedAmount) > 0.01) {
      return res.status(400).json({
        message: `Payment amount must be Rs. ${expectedAmount.toFixed(2)}`,
      });
    }

    const providerUser = providerUserId || serviceRequest.providerId;
    let providerProfileId = null;
    if (providerUser) {
      const providerProfile = await Provider.findOne({ userId: providerUser }).select('_id');
      providerProfileId = providerProfile?._id || null;
    }

    const payment = await upsertServicePayment({
      userId: req.user.id,
      providerId: providerProfileId,
      serviceRequestId,
      amount: paidAmount,
      currency: 'LKR',
    });

    res.json({
      message: 'Payment recorded successfully',
      payment,
    });
  } catch (error) {
    console.error('confirmPayment error:', error);
    res.status(500).json({ message: 'Failed to record payment' });
  }
};

export const getProviderPayments = async (req, res) => {
  try {
    const providerProfile = await Provider.findOne({ userId: req.user.id }).select('_id');
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const now = new Date();
    const heldPayments = await Payment.find({
      providerId: providerProfile._id,
      payoutStatus: 'hold',
      holdUntil: { $lte: now }
    });

    for (const payment of heldPayments) {
      const openComplaint = await Complaint.findOne({
        serviceRequestId: payment.serviceRequestId,
        status: 'open'
      });

      if (!openComplaint) {
        payment.payoutStatus = 'paid';
        payment.status = 'approved';
        payment.approvedAt = payment.approvedAt || now;
        payment.releasedAt = now;
        await payment.save();
      }
    }

    const payments = await Payment.find({ providerId: providerProfile._id })
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('getProviderPayments error:', error);
    res.status(500).json({ message: 'Failed to fetch provider payments' });
  }
};

export const getUserPayments = async (req, res) => {
  try {
    const now = new Date();
    const heldPayments = await Payment.find({
      userId: req.user.id,
      payoutStatus: 'hold',
      holdUntil: { $lte: now }
    });

    for (const payment of heldPayments) {
      const openComplaint = await Complaint.findOne({
        serviceRequestId: payment.serviceRequestId,
        status: 'open'
      });

      if (!openComplaint) {
        payment.payoutStatus = 'paid';
        payment.status = 'approved';
        payment.approvedAt = payment.approvedAt || now;
        payment.releasedAt = now;
        await payment.save();
      }
    }

    const payments = await Payment.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('getUserPayments error:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
};
