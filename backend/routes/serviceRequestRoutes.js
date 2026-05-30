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
  acceptDirectBooking,
  rejectDirectBooking,
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
router.post("/services/:id/accept-booking", auth(), acceptDirectBooking);
router.post("/services/:id/reject-booking", auth(), rejectDirectBooking);
router.put("/services/:id", auth(), updateServiceRequest);

export default router;
