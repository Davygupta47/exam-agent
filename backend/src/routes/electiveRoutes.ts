import { Router } from 'express';
import {
  openElectiveWindow,
  getElectiveWindowStatus,
  runAllocation,
  exportAllocationCSV,
} from '../controllers/electiveController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Admin-only routes
router.use(requireAuth, requireRole(['admin']));

router.post('/open-window', openElectiveWindow);
router.get('/window-status', getElectiveWindowStatus);
router.post('/run-allocation', runAllocation);
router.get('/export-csv', exportAllocationCSV);

export default router;
