import express from 'express';
import { login, refresh, acceptInvite, forgotPassword, resetPassword, changePassword } from '../controllers/auth.js';
import { verifyJWT } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/accept-invite', acceptInvite);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', verifyJWT, changePassword);

export default router;
