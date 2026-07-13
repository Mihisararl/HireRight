import express from 'express';
import { register, verifyEmail } from '../controllers/auth/authRegistrationController.js';
import { forgotPassword, validateResetToken, resetPassword } from '../controllers/auth/authPasswordController.js';
import { login, googleAuth } from '../controllers/auth/authSessionController.js';
import { getMe, updateProfile } from '../controllers/profile/profileController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', validateResetToken);
router.post('/reset-password', resetPassword);
router.get('/verify/:token', verifyEmail);
router.get('/me', auth(), getMe);
router.put('/profile', auth(), updateProfile);

export default router;
