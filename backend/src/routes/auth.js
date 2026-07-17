import express from 'express';
import { login, refresh, acceptInvite, forgotPassword, resetPassword, changePassword } from '../controllers/auth.js';
import { verifyJWT } from '../middlewares/auth.js';
import { authLimiter, forgotPasswordLimiter } from '../middlewares/rateLimit.js';

const router = express.Router();

router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/accept-invite', authLimiter, acceptInvite);

router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/change-password', verifyJWT, changePassword);

export default router;
