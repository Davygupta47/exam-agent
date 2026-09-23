BEGIN;

CREATE TEMP TABLE tmp_external_allocations (
  student_name TEXT,
  college_roll_no TEXT,
  autonomy_roll_no TEXT,
  subject_allocated TEXT,
  elective_type elective_type
);

\copy tmp_external_allocations (student_name, college_roll_no, autonomy_roll_no, subject_allocated) FROM '/Users/savvy/Downloads/pe1.txt' WITH (FORMAT csv, DELIMITER E'\t', HEADER true)

UPDATE tmp_external_allocations
SET elective_type = 'PROFESSIONAL_ELECTIVE_I'
WHERE elective_type IS NULL;

\copy tmp_external_allocations (student_name, college_roll_no, autonomy_roll_no, subject_allocated) FROM '/Users/savvy/Downloads/pe2.txt' WITH (FORMAT csv, DELIMITER E'\t', HEADER true)

UPDATE tmp_external_allocations
SET elective_type = 'PROFESSIONAL_ELECTIVE_II'
WHERE elective_type IS NULL;

\copy tmp_external_allocations (student_name, college_roll_no, autonomy_roll_no, subject_allocated) FROM '/Users/savvy/Downloads/oe1.txt' WITH (FORMAT csv, DELIMITER E'\t', HEADER true)

UPDATE tmp_external_allocations
SET elective_type = 'OPEN_ELECTIVE_I'
WHERE elective_type IS NULL;

INSERT INTO elective_allocations (
  tenant_id,
  student_id,
  semester,
  elective_type,
  subject_id,
  preference_rank
)
SELECT
  1,
  s.id,
  5,
  a.elective_type,
  sub.id,
  1
FROM tmp_external_allocations a
JOIN students s
  ON s.tenant_id = 1
 AND s.autonomy_roll_no = a.autonomy_roll_no
JOIN subjects sub
  ON sub.tenant_id = 1
 AND sub.code = regexp_replace(
   a.subject_allocated,
   '^.*\(([^()]*)\)$',
   '\1'
 )
 AND sub.department_id = s.department_id
ON CONFLICT (tenant_id, student_id, semester, elective_type)
DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  preference_rank = EXCLUDED.preference_rank,
  allocated_at = NOW();

INSERT INTO student_subjects (
  tenant_id,
  student_id,
  subject_id,
  is_elective,
  opted_at
)
SELECT
  ea.tenant_id,
  ea.student_id,
  ea.subject_id,
  TRUE,
  ea.allocated_at
FROM elective_allocations ea
WHERE ea.tenant_id = 1
  AND ea.semester = 5
ON CONFLICT (tenant_id, student_id, subject_id)
DO NOTHING;

COMMIT;