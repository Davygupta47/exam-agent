import { Router } from 'express';
import {
  getStudentDashboard,
  getStudentProfile,
  updateStudentProfile,
  getStudentElectives,
  submitStudentElectives,
} from '../controllers/studentController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Protect all routes with authentication and student role
router.use(requireAuth, requireRole(['student']));

router.get('/dashboard', getStudentDashboard);
router.get('/profile', getStudentProfile);
router.patch('/profile', updateStudentProfile);
router.get('/electives', getStudentElectives);
router.post('/electives', submitStudentElectives);

export default router;
