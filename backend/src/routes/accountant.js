import express from 'express';
import {
  getStudentFeesQueue,
  recordManualTransaction,
  reconcileCheque,
  getDashboardMetrics,
  getTransactionsList
} from '../controllers/accountant.js';
import { verifyJWT, attachSchoolScope, checkRole, checkPermission } from '../middlewares/auth.js';

const router = express.Router();

router.use(verifyJWT);
router.use(attachSchoolScope);
router.use(checkRole(['SCHOOL_ADMIN', 'ACCOUNTANT']));

// Student Fees Queue (Standard access for reading lists)
router.get('/student-fees', getStudentFeesQueue);

// School-wide Transactions list
router.get('/transactions', getTransactionsList);

// Payment Recording
router.post('/transactions', checkPermission('can_record_payment'), recordManualTransaction);

// Cheque Reconciliation
router.patch('/transactions/:id/reconcile', checkPermission('can_reconcile_cheque'), reconcileCheque);

// Dashboard metrics
router.get('/dashboard/metrics', checkPermission('can_view_dashboard_metrics'), getDashboardMetrics);

export default router;
