import express from "express";
import { registerProvider } from "../controllers/providerController.js";

const router = express.Router();

router.post('/register', registerProvider);

export default router;
