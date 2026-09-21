import { Router } from 'express';
import { uploadAvatar, handleAvatarUpload } from '../controllers/avatarController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/avatar', requireAuth, uploadAvatar.single('avatar'), handleAvatarUpload);

export default router;
