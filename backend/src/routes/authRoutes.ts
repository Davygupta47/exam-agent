import { Router } from 'express';
import { login, logout, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
