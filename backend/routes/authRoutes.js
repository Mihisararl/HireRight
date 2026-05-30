import express from 'express';
import { register, login, verifyEmail, getMe, updateProfile } from '../controllers/authController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify/:token', verifyEmail);
router.get('/me', auth(), getMe);
router.put('/profile', auth(), updateProfile);

export default router;
