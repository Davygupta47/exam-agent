import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';
import { z } from 'zod';

export async function getDepartmentTeachers(req: Request, res: Response, next: NextFunction) {
  try {
    const departmentId = req.user!.department_id;
    if (!departmentId) {
      return res.status(400).json({ success: false, error: 'User does not belong to a department' });
    }

    const teachersRes = await query(
      `SELECT t.id, t.teacher_code, t.name, t.initials, t.email, t.designation, t.photo_url
       FROM teachers t
       WHERE t.department_id = $1
       ORDER BY t.name`,
      [departmentId]
    );

    return res.json({ success: true, data: teachersRes.rows });
  } catch (err) {
    next(err);
  }
}

export async function getDepartmentStats(req: Request, res: Response, next: NextFunction) {
  try {
    const departmentId = req.user!.department_id;
    if (!departmentId) {
      return res.status(400).json({ success: false, error: 'User does not belong to a department' });
    }

    const statsRes = await query(
      `SELECT COUNT(*) as student_count
       FROM students
       WHERE department_id = $1 AND current_semester = 5 AND status = 'ACTIVE'`,
      [departmentId]
    );

    return res.json({
      success: true,
      data: {
        student_count: parseInt(statsRes.rows[0].student_count || '0', 10),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAssignableSubjects(req: Request, res: Response, next: NextFunction) {
  try {
    const departmentId = req.user!.department_id;
    if (!departmentId) {
      return res.status(400).json({ success: false, error: 'User does not belong to a department' });
    }

    // According to the user, HOD can assign compulsory subjects, PE-I, PE-II, labs.
    // Basically any subject belonging to this department for semester 5.
    const subjectsRes = await query(
      `SELECT s.id, s.name, s.code, s.credits, s.course_type, s.elective_type
       FROM subjects s
       WHERE s.department_id = $1 AND s.semester = 5
       ORDER BY s.course_type DESC, s.elective_type, s.code`,
      [departmentId]
    );

    return res.json({ success: true, data: subjectsRes.rows });
  } catch (err) {
    next(err);
  }
}

export async function getTeacherAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const departmentId = req.user!.department_id;
    if (!departmentId) {
      return res.status(400).json({ success: false, error: 'User does not belong to a department' });
    }

    const assignmentsRes = await query(
      `SELECT ts.id, ts.teacher_id, ts.subject_id
       FROM teacher_subjects ts
       JOIN subjects s ON ts.subject_id = s.id
       JOIN teachers t ON ts.teacher_id = t.id
       WHERE s.department_id = $1 AND s.semester = 5 AND t.department_id = $1`,
      [departmentId]
    );

    return res.json({ success: true, data: assignmentsRes.rows });
  } catch (err) {
    next(err);
  }
}

const assignTeacherSchema = z.object({
  assignments: z.array(z.object({
    subject_id: z.number().int().positive(),
    teacher_id: z.number().int().positive(),
  })),
});

export async function assignTeachersToSubjects(req: Request, res: Response, next: NextFunction) {
  try {
    const departmentId = req.user!.department_id;
    if (!departmentId) {
      return res.status(400).json({ success: false, error: 'User does not belong to a department' });
    }

    const { assignments } = assignTeacherSchema.parse(req.body);

    await query('BEGIN');
    
    // For simplicity, we clear existing assignments for these subjects and insert new ones
    // We only touch semester 5 subjects belonging to this department
    await query(
      `DELETE FROM teacher_subjects ts
       USING subjects s
       WHERE ts.subject_id = s.id AND s.department_id = $1 AND s.semester = 5`,
      [departmentId]
    );

    for (const assignment of assignments) {
      // Just basic validation to ensure the subject and teacher exist
      await query(
        `INSERT INTO teacher_subjects (tenant_id, teacher_id, subject_id)
         VALUES ($1, $2, $3)`,
        [req.user!.tenant_id, assignment.teacher_id, assignment.subject_id]
      );
    }

    await query('COMMIT');

    return res.json({ success: true, message: 'Assignments saved successfully' });
  } catch (err) {
    await query('ROLLBACK');
    next(err);
  }
}
