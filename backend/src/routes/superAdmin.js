import express from 'express';
import { createSchool, getSchools, toggleSchoolStatus, getSuperAdminAnalytics } from '../controllers/superAdmin.js';
import { verifyJWT, checkRole } from '../middlewares/auth.js';

const router = express.Router();

router.use(verifyJWT);
router.use(checkRole(['SUPER_ADMIN']));

router.post('/schools', createSchool);
router.get('/schools', getSchools);
router.patch('/schools/:id/status', toggleSchoolStatus);
router.get('/analytics', getSuperAdminAnalytics);

export default router;
