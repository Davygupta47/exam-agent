import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';
import { facultyProfileUpdateSchema } from '../validators/authValidators.js';

export async function getFacultyDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    // Fetch teacher profile
    const teacherRes = await query(
      `SELECT t.id, t.teacher_code, t.name, t.initials, t.email, t.phone,
              t.designation, t.photo_url, t.bio, t.address,
              d.id as department_id, d.name as department_name, d.code as department_code
       FROM teachers t
       JOIN departments d ON d.id = t.department_id
       WHERE t.user_id = $1`,
      [userId]
    );

    if (teacherRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Faculty record not found' });
    }

    const teacher = teacherRes.rows[0];

    // Fetch subjects taught from teacher_subjects or matching department subjects
    let subjectsRes = await query(
      `SELECT s.id, s.name, s.code, s.credits, s.course_type, s.elective_type, s.semester,
              (SELECT COUNT(*) FROM student_subjects ss WHERE ss.subject_id = s.id) as student_count
       FROM teacher_subjects ts
       JOIN subjects s ON s.id = ts.subject_id
       WHERE ts.teacher_id = $1
       ORDER BY s.semester, s.code`,
      [teacher.id]
    );

    // If teacher_subjects table is not explicitly populated for this teacher, link department subjects
    if (subjectsRes.rows.length === 0) {
      subjectsRes = await query(
        `SELECT s.id, s.name, s.code, s.credits, s.course_type, s.elective_type, s.semester,
                (SELECT COUNT(*) FROM student_subjects ss WHERE ss.subject_id = s.id) as student_count
         FROM subjects s
         WHERE s.department_id = $1 AND s.semester = 5
         ORDER BY s.code
         LIMIT 4`,
        [teacher.department_id]
      );
    }

    // Faculty stats
    const totalStudentsTaught = subjectsRes.rows.reduce(
      (sum, s) => sum + parseInt(s.student_count || '0', 10),
      0
    );

    return res.json({
      success: true,
      data: {
        profile: teacher,
        stats: [
          {
            label: 'Department',
            value: teacher.department_code,
            subtext: teacher.designation,
            highlight: false,
          },
          {
            label: 'Subjects Taught',
            value: `${subjectsRes.rows.length} Courses`,
            subtext: 'Active Semester 5',
            highlight: true,
          },
          {
            label: 'Students Enrolled',
            value: `${totalStudentsTaught}`,
            subtext: 'Across All Sections',
            highlight: false,
          },
        ],
        subjectsTaught: subjectsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getFacultyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const teacherRes = await query(
      `SELECT t.id, t.teacher_code, t.name, t.initials, t.email, t.phone,
              t.designation, t.photo_url, t.bio, t.address,
              d.name as department_name, d.code as department_code,
              u.avatar_url
       FROM teachers t
       JOIN users u ON u.id = t.user_id
       JOIN departments d ON d.id = t.department_id
       WHERE t.user_id = $1`,
      [userId]
    );

    if (teacherRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Faculty record not found' });
    }

    return res.json({ success: true, profile: teacherRes.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateFacultyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const validated = facultyProfileUpdateSchema.parse(req.body);

    const updateRes = await query(
      `UPDATE teachers
       SET phone = COALESCE($1, phone),
           bio = COALESCE($2, bio),
           address = COALESCE($3, address),
           updated_at = NOW()
       WHERE user_id = $4
       RETURNING id, name, phone, bio, address`,
      [validated.phone, validated.bio, validated.address, userId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Faculty record not found' });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updateRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
}
