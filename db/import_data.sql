INSERT INTO tenants (name, slug) VALUES
  ('Heritage Institute of Technology', 'heritage-it');
INSERT INTO departments (tenant_id, name, code) VALUES
  (1, 'Artificial Intelligence & Machine Learning', 'AIML'),
  (1, 'Data Science', 'Data Science');
INSERT INTO programs (tenant_id, department_id, name, code) VALUES
  (1, 1, 'B.Tech CSE (AIML)', 'BTECH-AIML'),
  (1, 2, 'B.Tech CSE (Data Science)', 'BTECH-DS');
INSERT INTO batches (tenant_id, program_id, start_year, passout_year, label) VALUES
  (1, 1, 2023, 2027, '2023-2027'),
  (1, 2, 2023, 2027, '2023-2027');

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
JOIN departments d ON upper(d.code) = upper(ts.department) AND d.tenant_id = 1
WHERE ts.subject_code IS NOT NULL AND trim(ts.subject_code) != '';

DROP TABLE tmp_subjects;



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
INSERT INTO students (tenant_id, autonomy_roll_no, college_roll_no, registration_no, name,department_id, program_id, batch_id, current_semester, second_year_gpa)
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
JOIN departments d ON upper(d.code) = upper(ts.department) AND d.tenant_id = 1
JOIN programs p ON p.department_id = d.id AND p.tenant_id = 1
JOIN batches b ON b.program_id = p.id AND b.tenant_id = 1 AND b.start_year = 2023;
DROP TABLE tmp_students;



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
JOIN departments d ON upper(d.code) = upper(tt.department) AND d.tenant_id = 1;
DROP TABLE tmp_teachers;



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

INSERT INTO elective_capacities (tenant_id, subject_id, semester, capacity)
SELECT 1, id, semester, 26
FROM subjects
WHERE tenant_id = 1
  AND elective_type IN ('PROFESSIONAL_ELECTIVE_I', 'PROFESSIONAL_ELECTIVE_II')
  AND course_type = 'THEORY';

INSERT INTO elective_capacities (tenant_id, subject_id, semester, capacity)
SELECT 1, id, semester, 50
FROM subjects
WHERE tenant_id = 1
  AND elective_type IN ('OPEN_ELECTIVE_I', 'OPEN_ELECTIVE_II')
  AND course_type = 'THEORY';

INSERT INTO pe_lab_pairs (tenant_id, theory_id, lab_id)
SELECT 1, t.id, l.id
FROM (
  SELECT id, code, ROW_NUMBER() OVER (ORDER BY code) as pos
  FROM subjects WHERE tenant_id = 1 AND department_id = 1
    AND semester = 5 AND elective_type = 'PROFESSIONAL_ELECTIVE_II' AND course_type = 'THEORY'
) t
JOIN (
  SELECT id, code, ROW_NUMBER() OVER (ORDER BY code) as pos
  FROM subjects WHERE tenant_id = 1 AND department_id = 1
    AND semester = 5 AND elective_type = 'PROFESSIONAL_ELECTIVE_II_LAB' AND course_type = 'PRACTICAL'
) l ON t.pos = l.pos;

INSERT INTO pe_lab_pairs (tenant_id, theory_id, lab_id)
SELECT 1, t.id, l.id
FROM (
  SELECT id, code, ROW_NUMBER() OVER (ORDER BY code) as pos
  FROM subjects WHERE tenant_id = 1 AND department_id = 2
    AND semester = 5 AND elective_type = 'PROFESSIONAL_ELECTIVE_II' AND course_type = 'THEORY'
) t
JOIN (
  SELECT id, code, ROW_NUMBER() OVER (ORDER BY code) as pos
  FROM subjects WHERE tenant_id = 1 AND department_id = 2
    AND semester = 5 AND elective_type = 'PROFESSIONAL_ELECTIVE_II_LAB' AND course_type = 'PRACTICAL'
) l ON t.pos = l.pos;


-- Counting here!!
DO $$
DECLARE
  t_count INT; s_count INT; sub_count INT; te_count INT; enr_count INT;
  cap_count INT; pair_count INT;
BEGIN
  SELECT count(*) INTO t_count FROM tenants;
  SELECT count(*) INTO s_count FROM students;
  SELECT count(*) INTO sub_count FROM subjects;
  SELECT count(*) INTO te_count FROM teachers;
  SELECT count(*) INTO enr_count FROM student_subjects;
  SELECT count(*) INTO cap_count FROM elective_capacities;
  SELECT count(*) INTO pair_count FROM pe_lab_pairs;
  RAISE NOTICE '=== Import Summary ===';
  RAISE NOTICE 'Tenants:          %', t_count;
  RAISE NOTICE 'Students:         %', s_count;
  RAISE NOTICE 'Subjects:         %', sub_count;
  RAISE NOTICE 'Teachers:         %', te_count;
  RAISE NOTICE 'Enrollments:      %', enr_count;
  RAISE NOTICE 'Elective caps:    %', cap_count;
  RAISE NOTICE 'PE-II lab pairs:  %', pair_count;
END $$;

