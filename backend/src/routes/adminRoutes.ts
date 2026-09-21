import { Router } from 'express';
import {
  getAdminDashboard,
  getAdminStudents,
  createStudent,
  getAdminTeachers,
  createTeacher,
  getDepartments,
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Protect all routes with authentication and admin role
router.use(requireAuth, requireRole(['admin']));

router.get('/dashboard', getAdminDashboard);
router.get('/students', getAdminStudents);
router.post('/students', createStudent);
router.get('/teachers', getAdminTeachers);
router.post('/teachers', createTeacher);
router.get('/departments', getDepartments);

export default router;
