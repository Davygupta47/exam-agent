import { Router } from 'express';
import {
  getFacultyDashboard,
  getFacultyProfile,
  updateFacultyProfile,
} from '../controllers/facultyController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Protect all routes with authentication and faculty/teacher role
router.use(requireAuth, requireRole(['faculty']));

router.get('/dashboard', getFacultyDashboard);
router.get('/profile', getFacultyProfile);
router.patch('/profile', updateFacultyProfile);

export default router;
