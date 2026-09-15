-- Departments
CREATE TABLE departments (
  id          SERIAL PRIMARY KEY,
  tenant_id   INT NOT NULL REFERENCES tenants(id),
  name        VARCHAR(200) NOT NULL,     
  code        VARCHAR(30) NOT NULL,      
  hod_id      INT REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- Programs
CREATE TABLE programs (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  department_id   INT NOT NULL REFERENCES departments(id),
  name            VARCHAR(200) NOT NULL,     
  code            VARCHAR(30) NOT NULL,      
  duration_years  SMALLINT DEFAULT 4,
  total_semesters SMALLINT DEFAULT 8,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- Batches
CREATE TABLE batches (
  id            SERIAL PRIMARY KEY,
  tenant_id     INT NOT NULL REFERENCES tenants(id),
  program_id    INT NOT NULL REFERENCES programs(id),
  start_year    SMALLINT NOT NULL,         
  passout_year  SMALLINT NOT NULL,         
  label         VARCHAR(20),               
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, program_id, start_year)
);

-- Subjects 
CREATE TABLE subjects (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  name            VARCHAR(300) NOT NULL,      
  code            VARCHAR(20) NOT NULL,       
  department_id   INT REFERENCES departments(id),  
  year            SMALLINT,                    
  semester        SMALLINT NOT NULL,           
  course_type     course_type NOT NULL DEFAULT 'THEORY',
    -- THEORY | PRACTICAL | SESSIONAL
  elective_type   elective_type NOT NULL DEFAULT 'COMPULSORY',
    -- COMPULSORY | PROFESSIONAL_ELECTIVE_I | PROFESSIONAL_ELECTIVE_II | PROFESSIONAL_ELECTIVE_III | PROFESSIONAL_ELECTIVE_II_LAB |
    -- PROFESSIONAL_ELECTIVE_III_LAB | OPEN_ELECTIVE_I | OPEN_ELECTIVE_II
  credits         NUMERIC(3,1) NOT NULL DEFAULT 3.0,
  internal_max    SMALLINT DEFAULT 30,
  internal_pass   SMALLINT DEFAULT 12,
  external_max    SMALLINT DEFAULT 70,
  external_pass   SMALLINT DEFAULT 28,
  total_pass      SMALLINT DEFAULT 40,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code, department_id)
);

CREATE TABLE department_subjects (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  department_id   INT NOT NULL REFERENCES departments(id),
  subject_id      INT NOT NULL REFERENCES subjects(id),
  UNIQUE(tenant_id, department_id, subject_id)
);
CREATE INDEX idx_subjects_dept_sem ON subjects(tenant_id, department_id, semester);
CREATE INDEX idx_subjects_elective ON subjects(tenant_id, elective_type);
CREATE INDEX idx_subjects_code ON subjects(tenant_id, code);