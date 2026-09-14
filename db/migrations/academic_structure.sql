-- ============================================================
-- 004_academic_structure.sql
-- Departments, Programs, Batches, Subjects
-- ============================================================

-- Departments: CSE, ECE, ME, AIML, etc.
CREATE TABLE departments (
  id          SERIAL PRIMARY KEY,
  tenant_id   INT NOT NULL REFERENCES tenants(id),
  name        VARCHAR(200) NOT NULL,     -- 'Computer Science & Engineering'
  code        VARCHAR(20) NOT NULL,      -- 'CSE', 'AIML', 'ECE'
  hod_id      INT REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- Programs: B.Tech CSE, B.Tech AIML, M.Tech CSE, etc.
CREATE TABLE programs (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  department_id   INT NOT NULL REFERENCES departments(id),
  name            VARCHAR(200) NOT NULL,     -- 'B.Tech CSE AIML'
  code            VARCHAR(20) NOT NULL,      -- 'BTECH-AIML'
  duration_years  SMALLINT DEFAULT 4,
  total_semesters SMALLINT DEFAULT 8,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- Batches: 2024-2028, 2023-2027, etc.
CREATE TABLE batches (
  id            SERIAL PRIMARY KEY,
  tenant_id     INT NOT NULL REFERENCES tenants(id),
  program_id    INT NOT NULL REFERENCES programs(id),
  start_year    SMALLINT NOT NULL,         -- 2024
  passout_year  SMALLINT NOT NULL,         -- 2028
  label         VARCHAR(20),               -- '2024-2028' (can be auto-generated)
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, program_id, start_year)
);

-- Subjects / Courses
-- subject_type: 'COMMON' = shared across all depts, 'DEPARTMENTAL' = dept-specific
-- Common subjects have department_id = NULL
CREATE TABLE subjects (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  name            VARCHAR(200) NOT NULL,      -- 'Machine Learning'
  code            VARCHAR(20) NOT NULL,       -- 'CS501'
  department_id   INT REFERENCES departments(id),  -- NULL for common subjects
  semester        SMALLINT NOT NULL,           -- which semester (1-8)
  credits         SMALLINT NOT NULL DEFAULT 4,
  subject_type    VARCHAR(15) DEFAULT 'DEPARTMENTAL',  -- 'COMMON' | 'DEPARTMENTAL'
  -- Marks configuration (spec §6)
  internal_max    SMALLINT DEFAULT 30,
  internal_pass   SMALLINT DEFAULT 12,
  external_max    SMALLINT DEFAULT 70,
  external_pass   SMALLINT DEFAULT 28,
  total_pass      SMALLINT DEFAULT 40,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- Quick lookup: find all subjects for a dept + semester
CREATE INDEX idx_subjects_dept_sem ON subjects(tenant_id, department_id, semester);
CREATE INDEX idx_subjects_type ON subjects(tenant_id, subject_type);
