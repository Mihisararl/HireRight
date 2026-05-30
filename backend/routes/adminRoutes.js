import express from 'express';
import auth from '../middleware/authMiddleware.js';
import {
    getUsers,
    getProviderRequests,
    approveProvider,
    rejectProvider,
    getPayments,
    approvePayment,
    getComplaints,
    resolveComplaint,
    getUserBankDetails
} from '../controllers/adminController.js';

const router = express.Router();

router.get('/users', auth('admin'), getUsers);
router.get('/provider-requests', auth('admin'), getProviderRequests);
router.post('/provider-requests/:id/approve', auth('admin'), approveProvider);
router.post('/provider-requests/:id/reject', auth('admin'), rejectProvider);
router.get('/payments', auth('admin'), getPayments);
router.post('/payments/:id/approve', auth('admin'), approvePayment);
router.get('/complaints', auth('admin'), getComplaints);
router.post('/complaints/:id/resolve', auth('admin'), resolveComplaint);
router.get('/users/:id/bank-details', auth('admin'), getUserBankDetails);

export default router;
