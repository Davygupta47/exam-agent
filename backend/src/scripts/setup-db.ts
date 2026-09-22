import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { parse } from 'csv-parse/sync';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { ELECTIVE_CONFIG } from '../config/electiveConfig.js';

const { Client } = pg;

async function run() {
  console.log('====================================================');
  console.log('  College Exam Portal — Database Initialization     ');
  console.log('====================================================');

  const dbConfig = {
    host: env.PGHOST,
    port: env.PGPORT,
    user: env.PGUSER,
    password: env.PGPASSWORD,
  };

  // Step 1: Ensure target database exists
  console.log(`[1/6] Connecting to PostgreSQL at ${dbConfig.host}:${dbConfig.port}...`);
  const rootClient = new Client({ ...dbConfig, database: 'postgres' });

  try {
    await rootClient.connect();
    const checkDb = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [env.PGDATABASE]
    );

    if (checkDb.rows.length === 0) {
      console.log(`[1/6] Database "${env.PGDATABASE}" does not exist. Creating it...`);
      
      // Try to refresh template1 collation if Windows collation updated
      try {
        await rootClient.query(`ALTER DATABASE template1 REFRESH COLLATION VERSION;`);
      } catch {}

      try {
        await rootClient.query(`CREATE DATABASE "${env.PGDATABASE}"`);
        console.log(`[1/6] Database "${env.PGDATABASE}" created successfully.`);
      } catch (createErr: any) {
        if (createErr.message?.includes('collation') || createErr.message?.includes('template')) {
          console.log(`[1/6] Template1 collation mismatch detected. Attempting creation with template0...`);
          try {
            await rootClient.query(`CREATE DATABASE "${env.PGDATABASE}" TEMPLATE template0`);
            console.log(`[1/6] Database "${env.PGDATABASE}" created successfully with template0.`);
          } catch (t0Err) {
            await rootClient.query(`CREATE DATABASE "${env.PGDATABASE}" LC_COLLATE 'C' LC_CTYPE 'C'`);
            console.log(`[1/6] Database "${env.PGDATABASE}" created successfully with C collation.`);
          }
        } else {
          throw createErr;
        }
      }
    } else {
      console.log(`[1/6] Database "${env.PGDATABASE}" already exists.`);
    }
  } catch (err: any) {
    console.error(`[1/6] Database creation error: ${err.message}`);
    throw err;
  } finally {
    await rootClient.end().catch(() => {});
  }

  // Step 2: Connect to target database
  const client = new Client(
    env.DATABASE_URL
      ? { connectionString: env.DATABASE_URL }
      : { ...dbConfig, database: env.PGDATABASE }
  );

  await client.connect();
  console.log(`[2/6] Connected to database "${env.PGDATABASE}".`);

  // Step 3: Run migration files in order
  console.log('[3/6] Running schema migrations...');
  const migrationsDir = path.resolve(process.cwd(), '../db/migrations');
  const migrationFiles = [
    'extensions.sql',
    'enums.sql',
    'users_tenant.sql',
    'academic.sql',
    'students_teachers.sql',
    'elective_system.sql',
    'exam_cycles.sql',
    'scheduling.sql',
    'marks_results.sql',
    'notifications.sql',
    'profile_extras.sql',
    'elective_window.sql',
  ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`  Applying: ${file}`);
        const sql = fs.readFileSync(filePath, 'utf8');
        try {
          await client.query(sql);
        } catch (mErr: any) {
          // Ignore type/relation already exists
          if (mErr.code === '42710' || mErr.code === '42P07' || mErr.message?.includes('already exists')) {
            console.log(`  (Note: Objects in ${file} already exist, skipping creation)`);
          } else {
            console.warn(`  Warning applying ${file}: ${mErr.message}`);
          }
        }
      } else {
        console.warn(`  Warning: Migration file not found: ${file}`);
      }
    }

  // Step 4: Seed Tenants, Departments, Programs, Batches
  console.log('[4/6] Seeding foundational academic structure...');
  await client.query(`
    INSERT INTO tenants (id, name, slug) VALUES (1, 'Heritage Institute of Technology', 'heritage-it')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO departments (id, tenant_id, name, code) VALUES
      (1, 1, 'Artificial Intelligence & Machine Learning', 'AIML'),
      (2, 1, 'Data Science', 'Data Science')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO programs (id, tenant_id, department_id, name, code) VALUES
      (1, 1, 1, 'B.Tech CSE (AIML)', 'BTECH-AIML'),
      (2, 1, 2, 'B.Tech CSE (Data Science)', 'BTECH-DS')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO batches (id, tenant_id, program_id, start_year, passout_year, label) VALUES
      (1, 1, 1, 2023, 2027, '2023-2027'),
      (2, 1, 2, 2023, 2027, '2023-2027')
    ON CONFLICT (id) DO NOTHING;

    SELECT setval('tenants_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tenants));
    SELECT setval('departments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM departments));
    SELECT setval('programs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM programs));
    SELECT setval('batches_id_seq', (SELECT COALESCE(MAX(id), 1) FROM batches));
  `);

  // Step 5: Ingest CSV files
  console.log('[5/6] Ingesting CSV files and generating user accounts...');

  // 5a. Subjects CSV
  const subjectsPath = path.resolve(process.cwd(), '../db/subjects.csv');
  if (fs.existsSync(subjectsPath)) {
    const subjectsRaw = fs.readFileSync(subjectsPath, 'utf8');
    const subjects = parse(subjectsRaw, { columns: true, skip_empty_lines: true });

    console.log(`  Importing ${subjects.length} subjects...`);
    for (const sub of subjects) {
      if (!sub.subject_code || !sub.subject_code.trim()) continue;

      const courseType =
        sub.course_type === 'Practical'
          ? 'PRACTICAL'
          : sub.course_type === 'Sessional'
          ? 'SESSIONAL'
          : 'THEORY';

      let electiveType = 'COMPULSORY';
      switch (sub.elective_type) {
        case 'Professional Elective-I':
          electiveType = 'PROFESSIONAL_ELECTIVE_I';
          break;
        case 'Professional Elective-II':
          electiveType = 'PROFESSIONAL_ELECTIVE_II';
          break;
        case 'Professional Elective-III':
          electiveType = 'PROFESSIONAL_ELECTIVE_III';
          break;
        case 'Professional Elective-II (Lab)':
          electiveType = 'PROFESSIONAL_ELECTIVE_II_LAB';
          break;
        case 'Professional Elective-III (Lab)':
          electiveType = 'PROFESSIONAL_ELECTIVE_III_LAB';
          break;
        case 'Open Elective-I':
          electiveType = 'OPEN_ELECTIVE_I';
          break;
        case 'Open Elective-II':
          electiveType = 'OPEN_ELECTIVE_II';
          break;
      }

      // Department ID
      const deptId = sub.department && sub.department.trim().toUpperCase() === 'DATA SCIENCE' ? 2 : 1;

      await client.query(
        `INSERT INTO subjects (tenant_id, name, code, department_id, year, semester, course_type, elective_type, credits)
         VALUES (1, $1, $2, $3, $4, $5, $6::course_type, $7::elective_type, $8)
         ON CONFLICT (tenant_id, code, department_id) DO UPDATE
         SET name = EXCLUDED.name, credits = EXCLUDED.credits, elective_type = EXCLUDED.elective_type`,
        [
          sub.subject_name,
          sub.subject_code.trim(),
          deptId,
          parseInt(sub.year || '3', 10),
          parseInt(sub.semester || '5', 10),
          courseType,
          electiveType,
          parseFloat(sub.credits || '3.0'),
        ]
      );
    }
  }

  // Pre-compute password hashes for speed
  const studentPasswordHash = await bcrypt.hash('Student@123', 10);
  const teacherPasswordHash = await bcrypt.hash('Teacher@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

  // 5b. Teachers CSV
  const teachersPath = path.resolve(process.cwd(), '../db/teachers.csv');
  if (fs.existsSync(teachersPath)) {
    const teachersRaw = fs.readFileSync(teachersPath, 'utf8');
    const teachers = parse(teachersRaw, { columns: true, skip_empty_lines: true });

    console.log(`  Importing ${teachers.length} teachers & admins...`);
    for (const t of teachers) {
      const isTeacherAdmin = t.teacher_id === 'ADMIN01' || t.department === 'ADMIN';
      const role = isTeacherAdmin ? 'super_admin' : t.designation === 'HOD' ? 'hod' : 'teacher';
      const passwordHash = isTeacherAdmin ? adminPasswordHash : teacherPasswordHash;
      const deptId = t.department && t.department.trim().toUpperCase() === 'DATA SCIENCE' ? 2 : 1;

      // Upsert into users
      const userRes = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
         VALUES (1, $1, $2, $3, $4, TRUE)
         ON CONFLICT (tenant_id, email)
         DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
         RETURNING id`,
        [t.mail_id.toLowerCase().trim(), passwordHash, t.name.trim(), role]
      );
      const userId = userRes.rows[0].id;

      // Upsert into teachers
      await client.query(
        `INSERT INTO teachers (tenant_id, user_id, teacher_code, name, initials, email, department_id, designation)
         VALUES (1, $1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tenant_id, teacher_code)
         DO UPDATE SET user_id = EXCLUDED.user_id, designation = EXCLUDED.designation, email = EXCLUDED.email`,
        [
          userId,
          t.teacher_id.trim(),
          t.name.trim(),
          t.initials ? t.initials.trim() : null,
          t.mail_id.toLowerCase().trim(),
          deptId,
          t.designation.trim(),
        ]
      );
    }
  }

  // Also ensure default admin user (basab.chowdhury@heritageit.edu is the Principal/Admin)
  await client.query(
    `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
     VALUES (1, 'basab.chowdhury@heritageit.edu', $1, 'Prof. (Dr.) Basab Chowdhury', 'super_admin', TRUE)
     ON CONFLICT (tenant_id, email) DO UPDATE SET password_hash = $1`,
    [adminPasswordHash]
  );

  // 5c. Students CSV
  const studentsPath = path.resolve(process.cwd(), '../db/students.csv');
  if (fs.existsSync(studentsPath)) {
    const studentsRaw = fs.readFileSync(studentsPath, 'utf8');
    const students = parse(studentsRaw, { columns: true, skip_empty_lines: true });

    console.log(`  Importing ${students.length} students...`);
    for (const s of students) {
      const autonomyRoll = s.Autonomy_Roll_No || s.autonomy_roll_no;
      const collegeRoll = s.College_Roll_No || s.college_roll_no;
      const regNo = s.Registration_No || s.registration_no;
      const name = s.Name || s.name;
      const dept = s.Department || s.department;
      const gpa = s.Second_Year_GPA || s.second_year_gpa;

      const mailId = s.Mail_Id || s.mail_id;

      if (!collegeRoll || !name) continue;

      // Use email from CSV (Mail_Id column) for login
      const email = mailId ? mailId.toLowerCase().trim() : `${collegeRoll}@heritageit.edu`.toLowerCase();
      const deptId = dept && dept.trim().toUpperCase() === 'DATA SCIENCE' ? 2 : 1;
      const progId = deptId === 2 ? 2 : 1;

      // Upsert user
      const userRes = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, full_name, role, is_active)
         VALUES (1, $1, $2, $3, 'student', TRUE)
         ON CONFLICT (tenant_id, email)
         DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id`,
        [email, studentPasswordHash, name.trim()]
      );
      const userId = userRes.rows[0].id;

      // Upsert student
      await client.query(
        `INSERT INTO students (tenant_id, user_id, autonomy_roll_no, college_roll_no, registration_no, name, email, department_id, program_id, batch_id, current_semester, second_year_gpa)
         VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, 1, 5, $9)
         ON CONFLICT (tenant_id, autonomy_roll_no)
         DO UPDATE SET user_id = EXCLUDED.user_id, college_roll_no = EXCLUDED.college_roll_no, second_year_gpa = EXCLUDED.second_year_gpa`,
        [
          userId,
          autonomyRoll ? autonomyRoll.trim() : null,
          collegeRoll.trim(),
          regNo ? regNo.trim() : `REG_${collegeRoll}`,
          name.trim(),
          email,
          deptId,
          progId,
          gpa ? parseFloat(gpa) : null,
        ]
      );
    }
  }

  // Step 6: Enroll students in compulsory subjects & setup capacities
  console.log('[6/6] Enrolling students in semester compulsory subjects and configuring electives...');
  await client.query(`
    INSERT INTO student_subjects (tenant_id, student_id, subject_id, is_elective)
    SELECT DISTINCT 1, s.id, sub.id, FALSE
    FROM students s
    JOIN subjects sub ON sub.department_id = s.department_id
      AND sub.semester = s.current_semester
      AND sub.elective_type = 'COMPULSORY'
      AND sub.tenant_id = s.tenant_id
    ON CONFLICT (tenant_id, student_id, subject_id) DO NOTHING;

    INSERT INTO elective_capacities (tenant_id, subject_id, semester, capacity)
    SELECT 1, id, semester, ${ELECTIVE_CONFIG.PE_CAPACITY}
    FROM subjects
    WHERE tenant_id = 1
      AND elective_type IN ('PROFESSIONAL_ELECTIVE_I', 'PROFESSIONAL_ELECTIVE_II')
      AND course_type = 'THEORY'
    ON CONFLICT (tenant_id, subject_id, semester) DO NOTHING;

    INSERT INTO elective_capacities (tenant_id, subject_id, semester, capacity)
    SELECT 1, id, semester, ${ELECTIVE_CONFIG.OE_CAPACITY}
    FROM subjects
    WHERE tenant_id = 1
      AND elective_type IN ('OPEN_ELECTIVE_I', 'OPEN_ELECTIVE_II')
      AND course_type = 'THEORY'
    ON CONFLICT (tenant_id, subject_id, semester) DO NOTHING;

    -- Seed sample notices for the Daily Notice panel
    INSERT INTO notifications (tenant_id, user_id, title, body, category, is_read)
    VALUES
      (1, 1, 'End-Semester Exam Registration Open', 'Form fill-up for the upcoming 5th semester end-term examination has started. Ensure all electives are finalized.', 'ACTION_REQUIRED', FALSE),
      (1, 1, 'Course Enrollment Verification', 'Verify your enrolled subjects before the deadline. Contact department coordinator for discrepancies.', 'REMINDER', FALSE),
      (1, 1, 'Library Book Return Notice', 'All issued books for the previous term must be renewed or returned by end of this week.', 'INFORMATION', TRUE)
    ON CONFLICT DO NOTHING;
  `);

  // Fetch summary counts
  const summary = await client.query(`
    SELECT
      (SELECT COUNT(*) FROM users) as users_count,
      (SELECT COUNT(*) FROM students) as students_count,
      (SELECT COUNT(*) FROM teachers) as teachers_count,
      (SELECT COUNT(*) FROM subjects) as subjects_count,
      (SELECT COUNT(*) FROM student_subjects) as enrollments_count
  `);

  await client.end();

  console.log('\n====================================================');
  console.log('  Database Setup Completed Successfully!           ');
  console.log('====================================================');
  console.log(`  Users Provisioned:    ${summary.rows[0].users_count}`);
  console.log(`  Students:             ${summary.rows[0].students_count}`);
  console.log(`  Teachers:             ${summary.rows[0].teachers_count}`);
  console.log(`  Subjects:             ${summary.rows[0].subjects_count}`);
  console.log(`  Subject Enrollments:  ${summary.rows[0].enrollments_count}`);
  console.log('----------------------------------------------------');
  console.log('  Ready for Login:');
  console.log('  - Student: 2310018001 / Student@123');
  console.log('  - Faculty: AIML01 / Teacher@123');
  console.log('  - Admin:   admin@heritageit.edu / Admin@123');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('[Setup Error]', err);
  process.exit(1);
});
