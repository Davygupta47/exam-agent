-- Question
CREATE TABLE question_papers (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  subject_id      INT NOT NULL REFERENCES subjects(id),
  exam_type       exam_type,
  academic_year   VARCHAR(10), 
  exam_date       DATE,
  max_marks       SMALLINT,
  uploaded_by     INT REFERENCES users(id),
  file_url        TEXT NOT NULL,
  status          VARCHAR(20) DEFAULT 'UPLOADED', -- UPLOADED | APPROVED | PUBLISHED | HIDDEN
  tags            JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_qp_subject ON question_papers(tenant_id, subject_id);


CREATE TABLE notifications (
  id          SERIAL PRIMARY KEY,
  tenant_id   INT NOT NULL REFERENCES tenants(id),
  user_id     INT NOT NULL REFERENCES users(id),
  title       VARCHAR(300) NOT NULL,
  body        TEXT,
  category    VARCHAR(30) DEFAULT 'INFORMATION', -- ACTION_REQUIRED | REMINDER | INFORMATION | RESULT | PAYMENT | WARNING
  channel     VARCHAR(20) DEFAULT 'in_app',   -- email | sms | push | in_app
  is_read     BOOLEAN DEFAULT FALSE,
  link_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(tenant_id, user_id, is_read);

CREATE TABLE email_logs (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  to_email        VARCHAR(255) NOT NULL,
  subject         VARCHAR(500),
  status          VARCHAR(20) DEFAULT 'QUEUED',  -- QUEUED | SENT | FAILED
  error_message   TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE audit_logs (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenants(id),
  user_id         INT REFERENCES users(id),
  action          VARCHAR(100) NOT NULL,
  entity_type     VARCHAR(50) NOT NULL, -- marks | result | payment | registration | admit_card
  entity_id       INT NOT NULL,
  old_value       JSONB,
  new_value       JSONB,
  reason          TEXT,
  ip_address      INET,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_time ON audit_logs(tenant_id, created_at);
CREATE INDEX idx_audit_user ON audit_logs(tenant_id, user_id);