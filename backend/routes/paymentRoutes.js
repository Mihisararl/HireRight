import express from 'express';
import { createPayhereHash, handlePayhereNotify, confirmPayment, getProviderPayments, getUserPayments } from '../controllers/paymentController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/payhere-hash', auth(), createPayhereHash);
router.post('/notify', handlePayhereNotify);
router.post('/confirm', auth(), confirmPayment);
router.get('/provider', auth(), getProviderPayments);
router.get('/user', auth(), getUserPayments);

export default router;
