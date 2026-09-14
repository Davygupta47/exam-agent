CREATE TABLE exam_cycles (
  id                          SERIAL PRIMARY KEY,
  tenant_id                   INT NOT NULL REFERENCES tenants(id),
  name                        VARCHAR(300) NOT NULL,
  exam_type                   exam_type NOT NULL,
  semester                    SMALLINT,
  status                      exam_cycle_status DEFAULT 'DRAFT',
  registration_start          TIMESTAMPTZ,
  registration_deadline       TIMESTAMPTZ,
  late_registration_deadline  TIMESTAMPTZ,
  exam_start_date             DATE,
  exam_end_date               DATE,
  admit_card_date             DATE,
  marks_deadline              DATE,
  result_target_date          DATE,
  base_fee                    NUMERIC(10,2) DEFAULT 0,
  per_backlog_fee             NUMERIC(10,2) DEFAULT 0,
  late_fee                    NUMERIC(10,2) DEFAULT 0,
  created_by                  INT REFERENCES users(id),
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exam_cycles_status ON exam_cycles(tenant_id, status);

CREATE TABLE exam_cycle_subjects (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  exam_cycle_id   INT NOT NULL REFERENCES exam_cycles(id) ON DELETE CASCADE,
  subject_id      INT NOT NULL REFERENCES subjects(id),
  UNIQUE(tenant_id, exam_cycle_id, subject_id)
);

CREATE TABLE exam_registrations (
  id                    SERIAL PRIMARY KEY,
  tenant_id             INT NOT NULL REFERENCES tenants(id),
  exam_cycle_id         INT NOT NULL REFERENCES exam_cycles(id),
  student_id            INT NOT NULL REFERENCES students(id),
  status                registration_status DEFAULT 'NOT_STARTED',
  total_fee             NUMERIC(10,2) DEFAULT 0,
  is_late               BOOLEAN DEFAULT FALSE,
  is_eligible           BOOLEAN DEFAULT TRUE,
  ineligibility_reason  TEXT,
  registered_at         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, exam_cycle_id, student_id)
);

CREATE INDEX idx_exam_reg_status ON exam_registrations(tenant_id, exam_cycle_id, status);

CREATE TABLE exam_registration_subjects (
  id                SERIAL PRIMARY KEY,
  tenant_id         INT NOT NULL REFERENCES tenants(id),
  registration_id   INT NOT NULL REFERENCES exam_registrations(id) ON DELETE CASCADE,
  subject_id        INT NOT NULL REFERENCES subjects(id),
  is_backlog        BOOLEAN DEFAULT FALSE,
  UNIQUE(tenant_id, registration_id, subject_id)
);