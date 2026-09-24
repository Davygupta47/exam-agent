-- Distinguish the faculty instructor from technical assistants assigned to a lab.
ALTER TABLE teacher_subjects
  ADD COLUMN IF NOT EXISTS assignment_role VARCHAR(30) NOT NULL DEFAULT 'INSTRUCTOR';

UPDATE teacher_subjects
SET assignment_role = 'INSTRUCTOR'
WHERE assignment_role IS NULL;

ALTER TABLE teacher_subjects
  DROP CONSTRAINT IF EXISTS teacher_subjects_teacher_id_subject_id_batch_id_key;

ALTER TABLE teacher_subjects
  ADD CONSTRAINT teacher_subjects_assignment_unique
  UNIQUE (tenant_id, teacher_id, subject_id, batch_id, assignment_role);

ALTER TABLE teacher_subjects
  DROP CONSTRAINT IF EXISTS teacher_subjects_assignment_role_check;

ALTER TABLE teacher_subjects
  ADD CONSTRAINT teacher_subjects_assignment_role_check
  CHECK (assignment_role IN ('INSTRUCTOR', 'TECHNICAL_ASSISTANT'));
