-- import_data.sql
-- Proper PostgreSQL COPY-based import from CSV files
-- Run AFTER schema.sql has been executed

-- Step 1: Insert the tenant (Heritage Institute of Technology)
INSERT INTO tenants (name, slug) VALUES
  ('Heritage Institute of Technology', 'heritage-it');

-- Step 2: Insert departments
INSERT INTO departments (tenant_id, name, code) VALUES
  (1, 'Artificial Intelligence & Machine Learning', 'AIML'),
  (1, 'Data Science', 'Data Science');

-- Step 3: Insert programs
INSERT INTO programs (tenant_id, department_id, name, code) VALUES
  (1, 1, 'B.Tech CSE (AIML)', 'BTECH-AIML'),
  (1, 2, 'B.Tech CSE (Data Science)', 'BTECH-DS');

-- Step 4: Insert batch (2023-2027, currently in 5th sem = 3rd year)
INSERT INTO batches (tenant_id, program_id, start_year, passout_year, label) VALUES
  (1, 1, 2023, 2027, '2023-2027'),
  (1, 2, 2023, 2027, '2023-2027');

-- Step 5: Import subjects from subjects.csv using a temp table
-- (because CSV has department name, not department_id)
CREATE TEMP TABLE tmp_subjects (
  subject_code    VARCHAR(20),
  subject_name    VARCHAR(300),
  department      VARCHAR(50),
  year            SMALLINT,
  semester        SMALLINT,
  course_type_str VARCHAR(30),
  elective_type_str VARCHAR(50),
  credits         NUMERIC(3,1)
);

COPY tmp_subjects FROM '/docker-entrypoint-initdb.d/source/subjects.csv'
  WITH (FORMAT csv, HEADER true);

-- Map CSV values to enum values and insert
INSERT INTO subjects (tenant_id, name, code, department_id, year, semester, course_type, elective_type, credits)
SELECT
  1,
  ts.subject_name,
  ts.subject_code,
  d.id,
  ts.year,
  ts.semester,
  CASE ts.course_type_str
    WHEN 'Theory' THEN 'THEORY'::course_type
    WHEN 'Practical' THEN 'PRACTICAL'::course_type
    WHEN 'Sessional' THEN 'SESSIONAL'::course_type
  END,
  CASE
    WHEN ts.elective_type_str = 'Compulsory' THEN 'COMPULSORY'::elective_type
    WHEN ts.elective_type_str = 'Professional Elective-I' THEN 'PROFESSIONAL_ELECTIVE_I'::elective_type
    WHEN ts.elective_type_str = 'Professional Elective-II' THEN 'PROFESSIONAL_ELECTIVE_II'::elective_type
    WHEN ts.elective_type_str = 'Professional Elective-III' THEN 'PROFESSIONAL_ELECTIVE_III'::elective_type
    WHEN ts.elective_type_str = 'Professional Elective-II (Lab)' THEN 'PROFESSIONAL_ELECTIVE_II_LAB'::elective_type
    WHEN ts.elective_type_str = 'Professional Elective-III (Lab)' THEN 'PROFESSIONAL_ELECTIVE_III_LAB'::elective_type
    WHEN ts.elective_type_str = 'Open Elective-I' THEN 'OPEN_ELECTIVE_I'::elective_type
    WHEN ts.elective_type_str = 'Open Elective-II' THEN 'OPEN_ELECTIVE_II'::elective_type
  END,
  ts.credits
FROM tmp_subjects ts
JOIN departments d ON d.code = ts.department AND d.tenant_id = 1;

DROP TABLE tmp_subjects;

-- Step 6: Import students from students.csv using a temp table
CREATE TEMP TABLE tmp_students (
  autonomy_roll_no  VARCHAR(30),
  college_roll_no   VARCHAR(30),
  registration_no   VARCHAR(30),
  name              VARCHAR(200),
  department        VARCHAR(50),
  second_year_gpa   NUMERIC(4,2)
);

COPY tmp_students FROM '/docker-entrypoint-initdb.d/source/students.csv'
  WITH (FORMAT csv, HEADER true);

INSERT INTO students (tenant_id, autonomy_roll_no, college_roll_no, registration_no, name,
                      department_id, program_id, batch_id, current_semester, second_year_gpa)
SELECT
  1,
  ts.autonomy_roll_no,
  ts.college_roll_no,
  ts.registration_no,
  ts.name,
  d.id,
  p.id,
  b.id,
  5,
  ts.second_year_gpa
FROM tmp_students ts
JOIN departments d ON d.code = ts.department AND d.tenant_id = 1
JOIN programs p ON p.department_id = d.id AND p.tenant_id = 1
JOIN batches b ON b.program_id = p.id AND b.tenant_id = 1 AND b.start_year = 2023;

DROP TABLE tmp_students;

-- Step 7: Import teachers from teachers.csv using a temp table
CREATE TEMP TABLE tmp_teachers (
  teacher_id    VARCHAR(20),
  name          VARCHAR(200),
  initials      VARCHAR(10),
  department    VARCHAR(50),
  designation   VARCHAR(100),
  mail_id       VARCHAR(255)
);

COPY tmp_teachers FROM '/docker-entrypoint-initdb.d/source/teachers.csv'
  WITH (FORMAT csv, HEADER true);

INSERT INTO teachers (tenant_id, teacher_code, name, initials, email, department_id, designation)
SELECT
  1,
  tt.teacher_id,
  tt.name,
  tt.initials,
  tt.mail_id,
  d.id,
  tt.designation
FROM tmp_teachers tt
JOIN departments d ON d.code = tt.department AND d.tenant_id = 1;

DROP TABLE tmp_teachers;

-- Step 8: Auto-enroll students in compulsory subjects for their department + semester
INSERT INTO student_subjects (tenant_id, student_id, subject_id, is_elective)
SELECT DISTINCT
  1,
  s.id,
  sub.id,
  FALSE
FROM students s
JOIN subjects sub ON sub.department_id = s.department_id
                 AND sub.semester = s.current_semester
                 AND sub.elective_type = 'COMPULSORY'
                 AND sub.tenant_id = s.tenant_id;

-- Done! Verify counts
DO $$
DECLARE
  t_count INT; s_count INT; sub_count INT; te_count INT; enr_count INT;
BEGIN
  SELECT count(*) INTO t_count FROM tenants;
  SELECT count(*) INTO s_count FROM students;
  SELECT count(*) INTO sub_count FROM subjects;
  SELECT count(*) INTO te_count FROM teachers;
  SELECT count(*) INTO enr_count FROM student_subjects;
  RAISE NOTICE '=== Import Summary ===';
  RAISE NOTICE 'Tenants:     %', t_count;
  RAISE NOTICE 'Students:    %', s_count;
  RAISE NOTICE 'Subjects:    %', sub_count;
  RAISE NOTICE 'Teachers:    %', te_count;
  RAISE NOTICE 'Enrollments: %', enr_count;
END $$;
