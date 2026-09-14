-- Departments
CREATE TABLE departments (
  id          SERIAL PRIMARY KEY,
  tenant_id   INT NOT NULL REFERENCES tenants(id),
  name        VARCHAR(200) NOT NULL,    
  code        VARCHAR(20) NOT NULL,     
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
  code            VARCHAR(20) NOT NULL,      
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


CREATE TABLE subjects (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  name            VARCHAR(200) NOT NULL,     
  code            VARCHAR(20) NOT NULL,       
  department_id   INT REFERENCES departments(id),  
  semester        SMALLINT NOT NULL,           
  credits         SMALLINT NOT NULL DEFAULT 4,
  subject_type    VARCHAR(15) DEFAULT 'DEPARTMENTAL',  -- 'COMMON' | 'DEPARTMENTAL'
  internal_max    SMALLINT DEFAULT 30,
  internal_pass   SMALLINT DEFAULT 12,
  external_max    SMALLINT DEFAULT 70,
  external_pass   SMALLINT DEFAULT 28,
  total_pass      SMALLINT DEFAULT 40,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_subjects_dept_sem ON subjects(tenant_id, department_id, semester);
CREATE INDEX idx_subjects_type ON subjects(tenant_id, subject_type);