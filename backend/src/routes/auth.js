import express from 'express';
import { login, refresh, acceptInvite } from '../controllers/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/accept-invite', acceptInvite);

export default router;
