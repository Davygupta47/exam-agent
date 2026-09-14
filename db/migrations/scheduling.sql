-- Exam rooms
CREATE TABLE exam_rooms (
  id          SERIAL PRIMARY KEY,
  tenant_id   INT NOT NULL REFERENCES tenants(id),
  name        VARCHAR(50) NOT NULL,       
  building    VARCHAR(100),
  capacity    SMALLINT DEFAULT 60,
  is_active   BOOLEAN DEFAULT TRUE,
  UNIQUE(tenant_id, name)
);

-- Schedule
CREATE TABLE exam_schedules (
  id                SERIAL PRIMARY KEY,
  tenant_id         INT NOT NULL REFERENCES tenants(id),
  exam_cycle_id     INT NOT NULL REFERENCES exam_cycles(id),
  subject_id        INT NOT NULL REFERENCES subjects(id),
  room_id           INT REFERENCES exam_rooms(id),
  exam_date         DATE NOT NULL,
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  duration_minutes  SMALLINT,
  invigilator_id    INT REFERENCES teachers(id),
  is_published      BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, room_id, exam_date, start_time)
);

CREATE INDEX idx_schedules_cycle ON exam_schedules(tenant_id, exam_cycle_id);
CREATE INDEX idx_schedules_date ON exam_schedules(tenant_id, exam_date);


-- Admit-cards
CREATE TABLE admit_cards (
  id                SERIAL PRIMARY KEY,
  tenant_id         INT NOT NULL REFERENCES tenants(id),
  registration_id   INT NOT NULL REFERENCES exam_registrations(id),
  student_id        INT NOT NULL REFERENCES students(id),
  exam_cycle_id     INT NOT NULL REFERENCES exam_cycles(id),
  verification_id   VARCHAR(100) NOT NULL UNIQUE,  
  pdf_url           TEXT,
  is_valid          BOOLEAN DEFAULT TRUE,
  generated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, registration_id)
);
