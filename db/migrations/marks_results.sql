-- Marks
CREATE TABLE marks_submissions (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  subject_id      INT NOT NULL REFERENCES subjects(id),
  exam_cycle_id   INT NOT NULL REFERENCES exam_cycles(id),
  teacher_id      INT NOT NULL REFERENCES teachers(id),
  status          marks_status DEFAULT 'DRAFT',
  csv_file_url    TEXT,
  total_students  INT,
  valid_count     INT,
  error_count     INT,
  errors          JSONB DEFAULT '[]',
  submitted_at    TIMESTAMPTZ,
  verified_by     INT REFERENCES users(id),
  verified_at     TIMESTAMPTZ,
  locked_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, subject_id, exam_cycle_id)
);


-- Student marks
CREATE TABLE marks (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  submission_id   INT NOT NULL REFERENCES marks_submissions(id),
  student_id      INT NOT NULL REFERENCES students(id),
  subject_id      INT NOT NULL REFERENCES subjects(id),
  exam_cycle_id   INT NOT NULL REFERENCES exam_cycles(id),
  internal_marks  NUMERIC(5,2),
  external_marks  NUMERIC(5,2),
  total_marks     NUMERIC(5,2),
  is_absent       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, student_id, subject_id, exam_cycle_id)
);

CREATE INDEX idx_marks_student ON marks(tenant_id, student_id);
CREATE INDEX idx_marks_submission ON marks(tenant_id, submission_id);


-- Marks requests
CREATE TABLE marks_corrections (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  mark_id         INT NOT NULL REFERENCES marks(id),
  old_internal    NUMERIC(5,2),
  old_external    NUMERIC(5,2),
  new_internal    NUMERIC(5,2),
  new_external    NUMERIC(5,2),
  reason          TEXT NOT NULL,
  requested_by    INT NOT NULL REFERENCES users(id),
  approved_by     INT REFERENCES users(id),
  status          VARCHAR(20) DEFAULT 'REQUESTED',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- Grading
CREATE TABLE grade_rules (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  min_percentage  NUMERIC(5,2) NOT NULL,
  max_percentage  NUMERIC(5,2) NOT NULL,
  grade           VARCHAR(5) NOT NULL,        
  grade_point     NUMERIC(3,1) NOT NULL,      
  is_pass         BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- Results
CREATE TABLE results (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  student_id      INT NOT NULL REFERENCES students(id),
  exam_cycle_id   INT NOT NULL REFERENCES exam_cycles(id),
  semester        SMALLINT,
  sgpa            NUMERIC(4,2),
  cgpa            NUMERIC(4,2),
  total_credits   SMALLINT,
  earned_credits  SMALLINT,
  has_backlog     BOOLEAN DEFAULT FALSE,
  status          VARCHAR(20) DEFAULT 'DRAFT',
  marksheet_url   TEXT,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, student_id, exam_cycle_id)
);

CREATE INDEX idx_results_cycle ON results(tenant_id, exam_cycle_id);


-- Result
CREATE TABLE result_subjects (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  result_id       INT NOT NULL REFERENCES results(id) ON DELETE CASCADE,
  subject_id      INT NOT NULL REFERENCES subjects(id),
  internal_marks  NUMERIC(5,2),
  external_marks  NUMERIC(5,2),
  total_marks     NUMERIC(5,2),
  grade           VARCHAR(5),
  grade_point     NUMERIC(3,1),
  credits         SMALLINT,
  is_pass         BOOLEAN,
  is_backlog      BOOLEAN DEFAULT FALSE,
  UNIQUE(tenant_id, result_id, subject_id)
);