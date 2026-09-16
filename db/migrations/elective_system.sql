-- PE
CREATE TABLE pe_lab_pairs (
  id            SERIAL PRIMARY KEY,
  tenant_id     INT NOT NULL REFERENCES tenants(id),
  theory_id     INT NOT NULL REFERENCES subjects(id),
  lab_id        INT NOT NULL REFERENCES subjects(id),
  UNIQUE(tenant_id, theory_id)
);

-- Elective-seats
CREATE TABLE elective_capacities (
  id          SERIAL PRIMARY KEY,
  tenant_id   INT NOT NULL REFERENCES tenants(id),
  subject_id  INT NOT NULL REFERENCES subjects(id),
  semester    SMALLINT NOT NULL,
  capacity    SMALLINT NOT NULL DEFAULT 26,
  UNIQUE(tenant_id, subject_id, semester)
);

-- Preferences
CREATE TABLE elective_preferences (
  id            SERIAL PRIMARY KEY,
  tenant_id     INT NOT NULL REFERENCES tenants(id),
  student_id    INT NOT NULL REFERENCES students(id),
  semester      SMALLINT NOT NULL,
  elective_type elective_type NOT NULL,
  pref_1_id     INT NOT NULL REFERENCES subjects(id),
  pref_2_id     INT NOT NULL REFERENCES subjects(id),
  pref_3_id     INT NOT NULL REFERENCES subjects(id),
  status        VARCHAR(20) DEFAULT 'SUBMITTED', -- SUBMITTED | PROCESSING | ALLOCATED
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, student_id, semester, elective_type)
);
CREATE TABLE elective_allocations (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  student_id      INT NOT NULL REFERENCES students(id),
  semester        SMALLINT NOT NULL,
  elective_type   elective_type NOT NULL,
  subject_id      INT NOT NULL REFERENCES subjects(id),
  preference_rank SMALLINT NOT NULL, -- 1, 2, or 3
  allocated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, student_id, semester, elective_type)
);

CREATE INDEX idx_alloc_subject ON elective_allocations(tenant_id, subject_id, semester);