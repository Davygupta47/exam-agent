import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/db.js';

export interface AuthUser {
  id: number;
  tenant_id: number;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string | null;
  student_id?: number | null;
  teacher_id?: number | null;
  roll_no?: string | null;
  teacher_code?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Session missing or expired' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: number; role: string };

    const userRes = await query(
      `SELECT u.id, u.tenant_id, u.email, u.full_name, u.role, u.avatar_url,
              s.id as student_id, s.college_roll_no as roll_no, s.photo_url as student_photo,
              t.id as teacher_id, t.teacher_code, t.photo_url as teacher_photo
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN teachers t ON t.user_id = u.id
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [decoded.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User account not found or disabled' });
    }

    const row = userRes.rows[0];
    req.user = {
      id: row.id,
      tenant_id: row.tenant_id,
      email: row.email,
      full_name: row.full_name,
      role: row.role,
      avatar_url: row.avatar_url || row.student_photo || row.teacher_photo || null,
      student_id: row.student_id || null,
      teacher_id: row.teacher_id || null,
      roll_no: row.roll_no || null,
      teacher_code: row.teacher_code || null,
    };

    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired session' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Role normalizations
    const userRole = req.user.role;
    const isAllowed = allowedRoles.some((role) => {
      if (role === 'admin') {
        return ['super_admin', 'exam_controller', 'admin'].includes(userRole);
      }
      if (role === 'faculty') {
        return ['teacher', 'hod', 'faculty'].includes(userRole);
      }
      if (role === 'student') {
        return userRole === 'student';
      }
      return role === userRole;
    });

    if (!isAllowed) {
      return res.status(403).json({ success: false, error: 'Forbidden: Insufficient permissions for this resource' });
    }

    next();
  };
}
