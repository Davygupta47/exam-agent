-- Students
CREATE TABLE students (
  id                SERIAL PRIMARY KEY,
  tenant_id         INT NOT NULL REFERENCES tenants(id),
  user_id           INT REFERENCES users(id),          
  autonomy_roll_no  VARCHAR(30),                        
  college_roll_no   VARCHAR(30),                        
  registration_no   VARCHAR(30) NOT NULL,               
  name              VARCHAR(200) NOT NULL,
  email             VARCHAR(255),
  phone             VARCHAR(20),
  department_id     INT NOT NULL REFERENCES departments(id),
  program_id        INT NOT NULL REFERENCES programs(id),
  batch_id          INT NOT NULL REFERENCES batches(id),
  current_semester  SMALLINT DEFAULT 5,                 
  status            VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE | INACTIVE | GRADUATED | SUSPENDED
  photo_url         TEXT,
  second_year_gpa   NUMERIC(4,2),                       
  data_source       VARCHAR(20) DEFAULT 'csv',          
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, registration_no),
  UNIQUE(tenant_id, autonomy_roll_no)
);
CREATE INDEX idx_students_dept ON students(tenant_id, department_id);
CREATE INDEX idx_students_batch ON students(tenant_id, batch_id);
CREATE INDEX idx_students_roll ON students(tenant_id, college_roll_no);
CREATE INDEX idx_students_name ON students USING gin (name gin_trgm_ops);

-- Teachers 
CREATE TABLE teachers (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  user_id         INT REFERENCES users(id),
  teacher_code    VARCHAR(20) NOT NULL,
  name            VARCHAR(200) NOT NULL,
  initials        VARCHAR(10),
  email           VARCHAR(255),
  phone           VARCHAR(20),
  department_id   INT NOT NULL REFERENCES departments(id),
  designation     VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, teacher_code),
  UNIQUE(tenant_id, email)
);
CREATE TABLE teacher_subjects (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  teacher_id      INT NOT NULL REFERENCES teachers(id),
  subject_id      INT NOT NULL REFERENCES subjects(id),
  batch_id        INT REFERENCES batches(id),
  academic_year   VARCHAR(10),
  UNIQUE(tenant_id, teacher_id, subject_id, batch_id)
);

CREATE TABLE student_subjects (
  id          SERIAL PRIMARY KEY,
  tenant_id   INT NOT NULL REFERENCES tenants(id),
  student_id  INT NOT NULL REFERENCES students(id),
  subject_id  INT NOT NULL REFERENCES subjects(id),
  is_backlog  BOOLEAN DEFAULT FALSE,
  is_elective BOOLEAN DEFAULT FALSE,                   
  opted_at    TIMESTAMPTZ,                             
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, student_id, subject_id)
);