import express from "express";
import { registerProvider, getApprovedProviders, getProvidersByCategory } from "../controllers/providerController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post('/register', auth(), registerProvider);
router.get('/approved', getApprovedProviders);
router.get('/category/:category', getProvidersByCategory);

export default router;
