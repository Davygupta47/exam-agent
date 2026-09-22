import { Router } from 'express';
import {
  getDepartmentTeachers,
  getDepartmentStats,
  getAssignableSubjects,
  getTeacherAssignments,
  assignTeachersToSubjects,
} from '../controllers/hodController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Protect all routes with authentication and HOD role
router.use(requireAuth, requireRole(['hod']));

router.get('/teachers', getDepartmentTeachers);
router.get('/stats', getDepartmentStats);
router.get('/assignable-subjects', getAssignableSubjects);
router.get('/assignments', getTeacherAssignments);
router.post('/assign-teacher', assignTeachersToSubjects);

export default router;
