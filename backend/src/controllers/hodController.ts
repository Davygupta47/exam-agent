import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db.js';
import { z } from 'zod';

export async function getDepartmentTeachers(req: Request, res: Response, next: NextFunction) {
  try {
    const departmentId = req.user!.department_id;
    if (!departmentId) {
      return res.status(400).json({ success: false, error: 'User does not belong to a department' });
    }

    // Return ALL teachers across the tenant — the HOD needs cross-dept teachers
    // for open electives (e.g. CHE faculty for CHE3121). Filtering is done client-side
    // using teacher_code prefix matching against the subject's speciality_code.
    const teachersRes = await query(
      `SELECT t.id, t.teacher_code, t.name, t.initials, t.email, t.designation, t.photo_url,
          t.department_id,
          d.code as department_code,
          -- Derive a prefix from the teacher_code for speciality matching
          -- e.g. AIML01 -> 'AIML', CHE01 -> 'CHE', DS01 -> 'DS'
          REGEXP_REPLACE(t.teacher_code, '[0-9]+$', '') as teacher_prefix,
          CASE WHEN t.designation = 'Technical Assistant' THEN 'TECHNICAL_ASSISTANT' ELSE 'INSTRUCTOR' END as teacher_type
       FROM teachers t
       JOIN departments d ON d.id = t.department_id
       WHERE t.tenant_id = $1
       ORDER BY t.department_id, t.name`,
      [req.user!.tenant_id]
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
      `SELECT s.id, s.name, s.code, s.credits, s.course_type, s.elective_type,
          s.department_id, d.code as department_code,
          -- speciality_code: find which department 'owns' this subject code by matching
          -- the dept.code as a prefix of the subject code (e.g. AML3101 -> AML, CHE3121 -> CHE).
          -- Falls back to LEFT(code,3) for unmapped prefixes (e.g. AEI, MEC, IOT, INC...).
          COALESCE(
            (SELECT d2.code FROM departments d2
             WHERE s.tenant_id = d2.tenant_id
               AND s.code LIKE d2.code || '%'
             ORDER BY LENGTH(d2.code) DESC
             LIMIT 1),
            LEFT(s.code, 3)
          ) as speciality_code
       FROM subjects s
       JOIN departments d ON d.id = s.department_id
       WHERE s.tenant_id = $1 AND s.department_id = $2 AND s.semester = 5
       ORDER BY s.course_type DESC, s.elective_type, s.code`,
      [req.user!.tenant_id, departmentId]
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
      `SELECT ts.id, ts.teacher_id, ts.subject_id, ts.assignment_role
       FROM teacher_subjects ts
       JOIN subjects s ON ts.subject_id = s.id
       JOIN teachers t ON ts.teacher_id = t.id
       WHERE ts.tenant_id = $1 AND s.tenant_id = $1 AND s.department_id = $2 AND s.semester = 5`,
      [req.user!.tenant_id, departmentId]
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
    assignment_role: z.enum(['INSTRUCTOR', 'TECHNICAL_ASSISTANT']).default('INSTRUCTOR'),
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

    const subjectsRes = await query(
      `SELECT s.id, s.code, s.department_id, s.course_type, s.elective_type,
                LEFT(s.code, 3) as speciality_code
         FROM subjects s
         JOIN departments d ON d.id = s.department_id
       WHERE s.tenant_id = $1 AND s.department_id = $2 AND s.semester = 5`,
      [req.user!.tenant_id, departmentId]
    );
    const teachersRes = await query(
      `SELECT id, teacher_code, department_id, designation,
              REGEXP_REPLACE(teacher_code, '[0-9]+$', '') as teacher_prefix
       FROM teachers
       WHERE tenant_id = $1`,
      [req.user!.tenant_id]
    );
    const subjectsById = new Map(subjectsRes.rows.map((subject) => [subject.id, subject]));
    const teachersById = new Map(teachersRes.rows.map((teacher) => [teacher.id, teacher]));
    const subjectAssignments = new Map<number, typeof assignments>();

    for (const assignment of assignments) {
      const subject = subjectsById.get(assignment.subject_id);
      const teacher = teachersById.get(assignment.teacher_id);
      if (!subject || !teacher) {
        return res.status(400).json({ success: false, error: 'Invalid subject or teacher selection' });
      }

      const isAssistant = teacher.designation === 'Technical Assistant';
      // Compare the teacher's code prefix (stripped of trailing digits) against
      // the subject's speciality_code (dept code for compulsory, 3-char for electives)
      const teacherPrefix = (teacher.teacher_prefix || '').toUpperCase();
      const subjectSpeciality = (subject.speciality_code || '').toUpperCase();
      const specialityMatches = teacherPrefix === subjectSpeciality;

      const isCompulsory = subject.elective_type?.toUpperCase() === 'COMPULSORY';
      const isPractical = subject.course_type?.toUpperCase() === 'PRACTICAL';

      if (teacherPrefix === 'ADMIN') {
        return res.status(400).json({ success: false, error: 'Cannot assign Admin' });
      }

      let eligible = false;
      if (isPractical) {
        eligible = specialityMatches;
      } else if (isCompulsory) {
        eligible = teacher.department_id === subject.department_id;
      } else {
        eligible = specialityMatches;
      }

      // additional check for assistants: must be a practical course
      if (isAssistant && !isPractical) {
        eligible = false;
      }

      if (!eligible || (assignment.assignment_role === 'TECHNICAL_ASSISTANT' && !isAssistant) ||
        (assignment.assignment_role === 'INSTRUCTOR' && isAssistant)) {
        return res.status(400).json({ success: false, error: `${teacher.teacher_code} is not eligible for ${subject.code}` });
      }

      const current = subjectAssignments.get(assignment.subject_id) || [];
      current.push(assignment);
      subjectAssignments.set(assignment.subject_id, current);
    }

    for (const [subjectId, selected] of subjectAssignments) {
      const subject = subjectsById.get(subjectId);
      const instructors = selected.filter((assignment) => assignment.assignment_role === 'INSTRUCTOR');
      const assistants = selected.filter((assignment) => assignment.assignment_role === 'TECHNICAL_ASSISTANT');
      if (!subject || instructors.length !== 1 || assistants.length > (subject.course_type === 'PRACTICAL' ? 2 : 0)) {
        return res.status(400).json({ success: false, error: `${subject?.code || 'Subject'} needs one instructor and up to two assistants for practicals` });
      }
    }

    await query(
      `DELETE FROM teacher_subjects ts
       USING subjects s
       WHERE ts.subject_id = s.id AND ts.tenant_id = $1 AND s.tenant_id = $1 AND s.department_id = $2 AND s.semester = 5`,
      [req.user!.tenant_id, departmentId]
    );

    for (const assignment of assignments) {
      await query(
        `INSERT INTO teacher_subjects (tenant_id, teacher_id, subject_id, assignment_role)
         VALUES ($1, $2, $3, $4)`,
        [req.user!.tenant_id, assignment.teacher_id, assignment.subject_id, assignment.assignment_role]
      );
    }

    await query('COMMIT');

    return res.json({ success: true, message: 'Assignments saved successfully' });
  } catch (err) {
    await query('ROLLBACK');
    next(err);
  }
}
