import express from "express";
import {
  registerProvider,
  getApprovedProviders,
  getProvidersByCategory,
  updateAvailability,
  getMyAvailability
} from "../controllers/providerController.js";
import { getProviderServiceRequests } from "../controllers/serviceRequest/providerOfferController.js";
import {
  updateProviderLocation,
  getProviderLocation,
  startProviderJourney
} from "../controllers/locationController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/register', auth(), registerProvider);
router.get('/approved', getApprovedProviders);
router.get('/category/:category', getProvidersByCategory);
router.get('/availability/me', auth(), getMyAvailability);
router.put('/availability', auth(), updateAvailability);
router.get('/jobs', auth(), getProviderServiceRequests);
router.post('/update-location', auth(), updateProviderLocation);
router.post('/start-journey', auth(), startProviderJourney);
router.get('/:id/location', auth(), getProviderLocation);

export default router;
