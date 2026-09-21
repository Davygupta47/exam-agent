import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, pool } from '../config/db.js';
import { createStudentSchema, createTeacherSchema } from '../validators/authValidators.js';

export async function getAdminDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const [studentCountRes, teacherCountRes, deptCountRes, subjectCountRes] = await Promise.all([
      query('SELECT COUNT(*) as count FROM students'),
      query('SELECT COUNT(*) as count FROM teachers'),
      query('SELECT COUNT(*) as count FROM departments'),
      query('SELECT COUNT(*) as count FROM subjects'),
    ]);

    const studentCount = parseInt(studentCountRes.rows[0].count, 10);
    const teacherCount = parseInt(teacherCountRes.rows[0].count, 10);
    const deptCount = parseInt(deptCountRes.rows[0].count, 10);
    const subjectCount = parseInt(subjectCountRes.rows[0].count, 10);

    // Department breakdown
    const deptBreakdownRes = await query(`
      SELECT d.code, d.name,
             COUNT(DISTINCT s.id) as student_count,
             COUNT(DISTINCT t.id) as teacher_count
      FROM departments d
      LEFT JOIN students s ON s.department_id = d.id
      LEFT JOIN teachers t ON t.department_id = d.id
      GROUP BY d.id, d.code, d.name
      ORDER BY d.name
    `);

    return res.json({
      success: true,
      stats: [
        {
          label: 'Total Students',
          value: studentCount.toLocaleString(),
          subtext: 'Registered & Active',
          highlight: true,
        },
        {
          label: 'Total Faculty',
          value: teacherCount.toLocaleString(),
          subtext: 'Teaching & Research',
          highlight: false,
        },
        {
          label: 'Academic Departments',
          value: deptCount.toLocaleString(),
          subtext: 'Degree Programs',
          highlight: false,
        },
        {
          label: 'Total Courses',
          value: subjectCount.toLocaleString(),
          subtext: 'Theory & Practical',
          highlight: false,
        },
      ],
      departmentBreakdown: deptBreakdownRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '15', 10)));
    const offset = (page - 1) * limit;
    const search = ((req.query.search as string) || '').trim();
    const dept = ((req.query.department as string) || '').trim();

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (s.name ILIKE $${params.length} OR s.college_roll_no ILIKE $${params.length} OR s.autonomy_roll_no ILIKE $${params.length} OR s.registration_no ILIKE $${params.length})`;
    }

    if (dept) {
      params.push(dept);
      whereClause += ` AND d.code = $${params.length}`;
    }

    const countRes = await query(
      `SELECT COUNT(*) as count FROM students s JOIN departments d ON d.id = s.department_id ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit);
    params.push(offset);
    const dataRes = await query(
      `SELECT s.id, s.name, s.college_roll_no, s.autonomy_roll_no, s.registration_no,
              s.current_semester, s.second_year_gpa, s.photo_url, s.created_at,
              d.name as department_name, d.code as department_code,
              u.email
       FROM students s
       JOIN departments d ON d.id = s.department_id
       LEFT JOIN users u ON u.id = s.user_id
       ${whereClause}
       ORDER BY s.id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({
      success: true,
      students: dataRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createStudent(req: Request, res: Response, next: NextFunction) {
  const client = await pool.connect();
  try {
    const validated = createStudentSchema.parse(req.body);

    // Check duplicate roll numbers
    const dupCheck = await client.query(
      `SELECT id FROM students WHERE college_roll_no = $1 OR autonomy_roll_no = $2 OR registration_no = $3`,
      [validated.college_roll_no, validated.autonomy_roll_no, validated.registration_no]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'A student with this Roll Number or Registration Number already exists',
      });
    }

    // Check duplicate email
    const emailCheck = await client.query(`SELECT id FROM users WHERE email = $1`, [validated.email.toLowerCase()]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'A user with this email address already exists' });
    }

    // Generate random temporary password
    const tempPassword = `Pass@${crypto.randomBytes(3).toString('hex')}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await client.query('BEGIN');

    // Get default program and batch for department
    const progRes = await client.query(
      `SELECT p.id as program_id, b.id as batch_id
       FROM programs p
       JOIN batches b ON b.program_id = p.id
       WHERE p.department_id = $1
       LIMIT 1`,
      [validated.department_id]
    );

    const programId = progRes.rows[0]?.program_id || 1;
    const batchId = progRes.rows[0]?.batch_id || 1;

    // Create user
    const userRes = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, phone, role, is_active)
       VALUES (1, $1, $2, $3, $4, 'student', TRUE)
       RETURNING id`,
      [validated.email.toLowerCase(), passwordHash, validated.name, validated.phone || null]
    );
    const userId = userRes.rows[0].id;

    // Create student
    const studentRes = await client.query(
      `INSERT INTO students (tenant_id, user_id, autonomy_roll_no, college_roll_no, registration_no, name, email, phone, department_id, program_id, batch_id, current_semester, second_year_gpa)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, name, college_roll_no, autonomy_roll_no, registration_no, current_semester`,
      [
        userId,
        validated.autonomy_roll_no,
        validated.college_roll_no,
        validated.registration_no,
        validated.name,
        validated.email.toLowerCase(),
        validated.phone || null,
        validated.department_id,
        programId,
        batchId,
        validated.current_semester,
        validated.second_year_gpa || null,
      ]
    );

    // Auto-enroll in department compulsory subjects for the semester
    await client.query(
      `INSERT INTO student_subjects (tenant_id, student_id, subject_id, is_elective)
       SELECT 1, $1, s.id, FALSE
       FROM subjects s
       WHERE s.department_id = $2 AND s.semester = $3 AND s.elective_type = 'COMPULSORY'
       ON CONFLICT DO NOTHING`,
      [studentRes.rows[0].id, validated.department_id, validated.current_semester]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Student created successfully',
      student: studentRes.rows[0],
      tempPassword, // Shown to admin once
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function getAdminTeachers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '15', 10)));
    const offset = (page - 1) * limit;
    const search = ((req.query.search as string) || '').trim();

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (t.name ILIKE $${params.length} OR t.teacher_code ILIKE $${params.length} OR t.designation ILIKE $${params.length} OR t.email ILIKE $${params.length})`;
    }

    const countRes = await query(`SELECT COUNT(*) as count FROM teachers t ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    params.push(limit);
    params.push(offset);
    const dataRes = await query(
      `SELECT t.id, t.teacher_code, t.name, t.initials, t.email, t.phone, t.designation, t.photo_url,
              d.name as department_name, d.code as department_code
       FROM teachers t
       JOIN departments d ON d.id = t.department_id
       ${whereClause}
       ORDER BY t.id ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({
      success: true,
      teachers: dataRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createTeacher(req: Request, res: Response, next: NextFunction) {
  const client = await pool.connect();
  try {
    const validated = createTeacherSchema.parse(req.body);

    const dupCheck = await client.query(
      `SELECT id FROM teachers WHERE teacher_code = $1 OR email = $2`,
      [validated.teacher_code, validated.email.toLowerCase()]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'A faculty member with this Teacher Code or Email already exists',
      });
    }

    const tempPassword = `Faculty@${crypto.randomBytes(3).toString('hex')}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await client.query('BEGIN');

    // Create user
    const userRes = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, phone, role, is_active)
       VALUES (1, $1, $2, $3, $4, 'teacher', TRUE)
       RETURNING id`,
      [validated.email.toLowerCase(), passwordHash, validated.name, validated.phone || null]
    );
    const userId = userRes.rows[0].id;

    // Create teacher
    const teacherRes = await client.query(
      `INSERT INTO teachers (tenant_id, user_id, teacher_code, name, initials, email, phone, department_id, designation)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, teacher_code, name, designation, email`,
      [
        userId,
        validated.teacher_code,
        validated.name,
        validated.initials || null,
        validated.email.toLowerCase(),
        validated.phone || null,
        validated.department_id,
        validated.designation,
      ]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      teacher: teacherRes.rows[0],
      tempPassword, // Shown to admin once
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function getDepartments(req: Request, res: Response, next: NextFunction) {
  try {
    const depts = await query('SELECT id, name, code FROM departments ORDER BY name');
    return res.json({ success: true, departments: depts.rows });
  } catch (err) {
    next(err);
  }
}
