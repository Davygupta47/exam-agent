import { Request, Response, NextFunction } from 'express';
import { query, pool } from '../config/db.js';
import { studentProfileUpdateSchema, electiveSelectionSchema } from '../validators/authValidators.js';

export async function getStudentDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    // Fetch student info
    const studentRes = await query(
      `SELECT s.id, s.name, s.autonomy_roll_no, s.college_roll_no, s.registration_no,
              s.current_semester, s.second_year_gpa, s.photo_url, s.bio, s.address,
              s.phone, u.email,
              d.id as department_id, d.name as department_name, d.code as department_code,
              p.name as program_name, p.code as program_code,
              b.label as batch_label, b.start_year, b.passout_year
       FROM students s
       JOIN users u ON u.id = s.user_id
       JOIN departments d ON d.id = s.department_id
       JOIN programs p ON p.id = s.program_id
       JOIN batches b ON b.id = s.batch_id
       WHERE s.user_id = $1`,
      [userId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student record not found' });
    }

    const student = studentRes.rows[0];

    // Fetch enrolled courses
    const coursesRes = await query(
      `SELECT sub.id, sub.name, sub.code, sub.credits, sub.course_type, sub.elective_type,
              ss.is_elective, ss.opted_at
       FROM student_subjects ss
       JOIN subjects sub ON sub.id = ss.subject_id
       WHERE ss.student_id = $1
       ORDER BY sub.course_type, sub.code`,
      [student.id]
    );

    // Calculate total credits
    const totalCredits = coursesRes.rows.reduce((acc, c) => acc + parseFloat(c.credits || '0'), 0);

    // Fetch department faculty members
    const facultyRes = await query(
      `SELECT t.id, t.teacher_code, t.name, t.initials, t.email, t.designation,
              t.photo_url, d.name as department_name
       FROM teachers t
       JOIN departments d ON d.id = t.department_id
       WHERE t.department_id = $1
       ORDER BY t.designation DESC, t.name ASC
       LIMIT 8`,
      [student.department_id]
    );

    // Fetch notices for student/tenant
    const noticesRes = await query(
      `SELECT id, title, body, category, is_read, created_at
       FROM notifications
       WHERE tenant_id = $1 AND (user_id = $2 OR user_id = 1)
       ORDER BY created_at DESC
       LIMIT 5`,
      [student.tenant_id || 1, userId]
    );

    return res.json({
      success: true,
      data: {
        profile: student,
        stats: [
          {
            label: 'Current Semester',
            value: `${student.current_semester}th Sem`,
            subtext: `${student.batch_label || '2023-2027'} Batch`,
            highlight: false,
          },
          {
            label: 'Enrolled Courses',
            value: `${coursesRes.rows.length} Subjects`,
            subtext: `${totalCredits.toFixed(1)} Total Credits`,
            highlight: true, // Selected card with primary border per reference
          },
          {
            label: '2nd Year GPA',
            value: student.second_year_gpa ? `${student.second_year_gpa}` : 'N/A',
            subtext: 'Cumulative Grade',
            highlight: false,
          },
        ],
        enrolledCourses: coursesRes.rows,
        faculty: facultyRes.rows,
        notices: noticesRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getStudentProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    const result = await query(
      `SELECT s.id, s.name, s.autonomy_roll_no, s.college_roll_no, s.registration_no,
              s.current_semester, s.second_year_gpa, s.photo_url, s.bio, s.address,
              s.phone, s.status, u.email, u.avatar_url,
              d.name as department_name, d.code as department_code,
              p.name as program_name, b.label as batch_label
       FROM students s
       JOIN users u ON u.id = s.user_id
       JOIN departments d ON d.id = s.department_id
       JOIN programs p ON p.id = s.program_id
       JOIN batches b ON b.id = s.batch_id
       WHERE s.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    return res.json({ success: true, profile: result.rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function updateStudentProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const validated = studentProfileUpdateSchema.parse(req.body);

    const updateRes = await query(
      `UPDATE students
       SET phone = COALESCE($1, phone),
           bio = COALESCE($2, bio),
           address = COALESCE($3, address),
           updated_at = NOW()
       WHERE user_id = $4
       RETURNING id, name, phone, bio, address`,
      [validated.phone, validated.bio, validated.address, userId]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
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

export async function getStudentElectives(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;

    // Get student details
    const studentRes = await query(
      `SELECT s.id, s.tenant_id, s.department_id, s.current_semester
       FROM students s
       WHERE s.user_id = $1`,
      [userId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student record not found' });
    }

    const { id: studentId, tenant_id, department_id, current_semester } = studentRes.rows[0];

    // Fetch available electives for this department and semester
    const electivesRes = await query(
      `SELECT sub.id, sub.code, sub.name, sub.course_type, sub.elective_type, sub.credits,
              ec.capacity,
              (SELECT COUNT(*) FROM student_subjects ss WHERE ss.subject_id = sub.id) as enrolled_count
       FROM subjects sub
       LEFT JOIN elective_capacities ec ON ec.subject_id = sub.id AND ec.semester = sub.semester
       WHERE sub.tenant_id = $1
         AND (sub.department_id = $2 OR sub.elective_type IN ('OPEN_ELECTIVE_I', 'OPEN_ELECTIVE_II'))
         AND sub.semester = $3
         AND sub.elective_type != 'COMPULSORY'
       ORDER BY sub.elective_type, sub.code`,
      [tenant_id, department_id, current_semester]
    );

    // Fetch existing preferences
    const prefsRes = await query(
      `SELECT ep.id, ep.semester, ep.elective_type, ep.pref_1_id, ep.pref_2_id, ep.pref_3_id, ep.status,
              s1.name as pref_1_name, s1.code as pref_1_code,
              s2.name as pref_2_name, s2.code as pref_2_code,
              s3.name as pref_3_name, s3.code as pref_3_code
       FROM elective_preferences ep
       LEFT JOIN subjects s1 ON s1.id = ep.pref_1_id
       LEFT JOIN subjects s2 ON s2.id = ep.pref_2_id
       LEFT JOIN subjects s3 ON s3.id = ep.pref_3_id
       WHERE ep.tenant_id = $1 AND ep.student_id = $2 AND ep.semester = $3`,
      [tenant_id, studentId, current_semester]
    );

    return res.json({
      success: true,
      availableElectives: electivesRes.rows,
      submittedPreferences: prefsRes.rows,
      semester: current_semester,
    });
  } catch (err) {
    next(err);
  }
}

export async function submitStudentElectives(req: Request, res: Response, next: NextFunction) {
  const client = await pool.connect();
  try {
    const userId = req.user!.id;
    const validated = electiveSelectionSchema.parse(req.body);

    const studentRes = await client.query(
      `SELECT id, tenant_id, department_id, current_semester FROM students WHERE user_id = $1`,
      [userId]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student record not found' });
    }

    const { id: studentId, tenant_id } = studentRes.rows[0];

    await client.query('BEGIN');

    // Save or update preferences
    await client.query(
      `INSERT INTO elective_preferences (tenant_id, student_id, semester, elective_type, pref_1_id, pref_2_id, pref_3_id, status)
       VALUES ($1, $2, $3, $4::elective_type, $5, $6, $7, 'SUBMITTED')
       ON CONFLICT (tenant_id, student_id, semester, elective_type)
       DO UPDATE SET pref_1_id = EXCLUDED.pref_1_id,
                     pref_2_id = EXCLUDED.pref_2_id,
                     pref_3_id = EXCLUDED.pref_3_id,
                     status = 'SUBMITTED',
                     created_at = NOW()`,
      [tenant_id, studentId, validated.semester, validated.elective_type, validated.pref_1_id, validated.pref_2_id, validated.pref_3_id]
    );

    // Also directly enroll the preferred elective in student_subjects if capacity is available
    await client.query(
      `INSERT INTO student_subjects (tenant_id, student_id, subject_id, is_elective, opted_at)
       VALUES ($1, $2, $3, TRUE, NOW())
       ON CONFLICT (tenant_id, student_id, subject_id) DO NOTHING`,
      [tenant_id, studentId, validated.pref_1_id]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Elective preferences submitted successfully and enrolled.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}
