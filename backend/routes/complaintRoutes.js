import express from 'express';
import auth from '../middleware/authMiddleware.js';
import { createComplaint, getUserComplaints, getComplaintByServiceRequest, reopenComplaint } from '../controllers/complaintController.js';

const router = express.Router();

router.post('/', auth(), createComplaint);
router.get('/my', auth(), getUserComplaints);
router.get('/service/:serviceRequestId', auth(), getComplaintByServiceRequest);
router.put('/:id/reopen', auth(), reopenComplaint);

export default router;
