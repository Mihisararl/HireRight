import express from 'express';
import { createPayhereHash, handlePayhereNotify, getProviderPayments, getUserPayments } from '../controllers/paymentController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/payhere-hash', createPayhereHash);
router.post('/notify', handlePayhereNotify);
router.get('/provider', auth(), getProviderPayments);
router.get('/user', auth(), getUserPayments);

export default router;
