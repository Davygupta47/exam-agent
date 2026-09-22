import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { loginSchema } from '../validators/authValidators.js';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = loginSchema.parse(req.body);
    const { role, identifier, password } = validated;

    let userQuery = '';
    let params: any[] = [];

    if (role === 'student') {
      userQuery = `
        SELECT u.id, u.tenant_id, u.email, u.password_hash, u.full_name, u.role, u.is_active,
               u.avatar_url, s.id as student_id, s.college_roll_no as roll_no, s.photo_url as student_photo
        FROM users u
        JOIN students s ON s.user_id = u.id
        WHERE (LOWER(u.email) = LOWER($1) OR LOWER(s.email) = LOWER($1) OR LOWER(s.college_roll_no) = LOWER($1) OR LOWER(s.autonomy_roll_no) = LOWER($1))
          AND u.role = 'student'
      `;
      params = [identifier.trim()];
    } else if (role === 'faculty') {
      userQuery = `
        SELECT u.id, u.tenant_id, u.email, u.password_hash, u.full_name, u.role, u.is_active,
               u.avatar_url, t.id as teacher_id, t.teacher_code, t.photo_url as teacher_photo,
               t.designation, t.department_id
        FROM users u
        JOIN teachers t ON t.user_id = u.id
        WHERE (LOWER(u.email) = LOWER($1) OR LOWER(t.email) = LOWER($1) OR LOWER(t.teacher_code) = LOWER($1))
          AND u.role IN ('teacher', 'hod', 'faculty')
      `;
      params = [identifier.trim()];
    } else if (role === 'admin') {
      userQuery = `
        SELECT u.id, u.tenant_id, u.email, u.password_hash, u.full_name, u.role, u.is_active,
               u.avatar_url, t.id as teacher_id, t.teacher_code,
               t.designation, t.department_id
        FROM users u
        LEFT JOIN teachers t ON t.user_id = u.id
        WHERE (LOWER(u.email) = LOWER($1) OR LOWER(t.email) = LOWER($1) OR LOWER(t.teacher_code) = LOWER($1))
          AND u.role IN ('super_admin', 'exam_controller', 'admin')
      `;
      params = [identifier.trim()];
    }

    const result = await query(userQuery, params);

    const errorMessage = 'Email or password is incorrect';

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: errorMessage });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ success: false, error: 'Account is deactivated' });
    }

    if (!user.password_hash) {
      return res.status(401).json({ success: false, error: errorMessage });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: errorMessage });
    }

    // Update last_login_at
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { userId: user.id, role: user.role, tenantId: user.tenant_id },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url || user.student_photo || user.teacher_photo || null,
        roll_no: user.roll_no || null,
        teacher_code: user.teacher_code || null,
        student_id: user.student_id || null,
        teacher_id: user.teacher_id || null,
        designation: user.designation || null,
        department_id: user.department_id || null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie('token', { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
}

export async function getMe(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  return res.json({
    success: true,
    user: req.user,
  });
}
