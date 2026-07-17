import express from 'express';
import { getStudentFees, payFeeSimulated, getStudentTransactions } from '../controllers/student.js';
import { verifyJWT, checkRole } from '../middlewares/auth.js';

const router = express.Router();

router.use(verifyJWT);
router.use(checkRole(['STUDENT']));

router.get('/fees', getStudentFees);
router.post('/fees/:id/pay', payFeeSimulated);
router.get('/transactions', getStudentTransactions);

export default router;
