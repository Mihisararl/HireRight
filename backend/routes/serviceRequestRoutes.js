import express from "express";
import {
  createServiceRequest,
  getAllServiceRequests,
  getServiceRequestsByUser,
  updateServiceRequest,
  getAvailableServiceRequests,
  acceptServiceRequest,
  getProviderServiceRequests,
  completeServiceRequest,
  completeServiceRequestByCustomer,
  acceptProviderOffer,
  rejectProviderOffer,
  getDirectBookingRequests,
  submitDirectBookingEstimate,
  rejectDirectBooking,
  confirmDirectBookingProposal,
  rejectDirectBookingProposal,
} from "../controllers/serviceRequestController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/services", auth('customer'), createServiceRequest);
router.get("/services", getAllServiceRequests);
router.get("/services/user", auth(), getServiceRequestsByUser);
router.get("/services/available", auth(), getAvailableServiceRequests);
router.get("/services/provider", auth(), getProviderServiceRequests);
router.get("/services/bookings/direct", auth(), getDirectBookingRequests);
router.post("/services/:id/accept", auth(), acceptServiceRequest);
router.post("/services/:id/complete", auth(), completeServiceRequest);
router.post("/services/:id/complete-by-customer", auth(), completeServiceRequestByCustomer);
router.post("/services/:id/accept-offer", auth(), acceptProviderOffer);
router.post("/services/:id/reject-offer", auth(), rejectProviderOffer);
router.post("/services/:id/submit-estimate", auth(), submitDirectBookingEstimate);
router.post("/services/:id/accept-booking", auth(), submitDirectBookingEstimate);
router.post("/services/:id/confirm-proposal", auth(), confirmDirectBookingProposal);
router.post("/services/:id/reject-proposal", auth(), rejectDirectBookingProposal);
router.post("/services/:id/reject-booking", auth(), rejectDirectBooking);
router.put("/services/:id", auth(), updateServiceRequest);

export default router;
