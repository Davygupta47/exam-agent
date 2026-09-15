CREATE TABLE payments (
  id                  SERIAL PRIMARY KEY,
  tenant_id           INT NOT NULL REFERENCES tenants(id),
  registration_id     INT NOT NULL REFERENCES exam_registrations(id),
  student_id          INT NOT NULL REFERENCES students(id),
  amount              NUMERIC(10,2) NOT NULL,
  status              payment_status DEFAULT 'PENDING',
  gateway             VARCHAR(50),           
  gateway_order_id    VARCHAR(255),
  gateway_payment_id  VARCHAR(255),
  receipt_number      VARCHAR(50),
  receipt_url         TEXT,
  paid_at             TIMESTAMPTZ,
  failure_reason      TEXT,
  refund_amount       NUMERIC(10,2),
  refund_reason       TEXT,
  webhook_payload     JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_status ON payments(tenant_id, status);
CREATE INDEX idx_payments_student ON payments(tenant_id, student_id);
CREATE INDEX idx_payments_gateway ON payments(gateway_order_id);