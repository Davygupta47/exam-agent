import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { query } from '../config/db.js';

// Setup uploads directory
const uploadDir = path.resolve(process.cwd(), 'uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `avatar_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP image files are allowed'));
  }
};

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter,
});

export async function handleAvatarUpload(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    const userId = req.user!.id;
    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    // Update users table
    await query(`UPDATE users SET avatar_url = $1 WHERE id = $2`, [avatarPath, userId]);

    // Also update student or teacher table if applicable
    if (req.user!.student_id) {
      await query(`UPDATE students SET photo_url = $1 WHERE id = $2`, [avatarPath, req.user!.student_id]);
    } else if (req.user!.teacher_id) {
      await query(`UPDATE teachers SET photo_url = $1 WHERE id = $2`, [avatarPath, req.user!.teacher_id]);
    }

    return res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl: avatarPath,
    });
  } catch (err) {
    next(err);
  }
}
