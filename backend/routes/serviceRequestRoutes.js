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
  acceptProviderOffer,
  rejectProviderOffer,
} from "../controllers/serviceRequestController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/services", auth(), createServiceRequest);
router.get("/services", getAllServiceRequests);
router.get("/services/user", auth(), getServiceRequestsByUser);
router.get("/services/available", auth(), getAvailableServiceRequests);
router.get("/services/provider", auth(), getProviderServiceRequests);
router.post("/services/:id/accept", auth(), acceptServiceRequest);
router.post("/services/:id/complete", auth(), completeServiceRequest);
router.post("/services/:id/accept-offer", auth(), acceptProviderOffer);
router.post("/services/:id/reject-offer", auth(), rejectProviderOffer);
router.put("/services/:id", auth(), updateServiceRequest);

export default router;
