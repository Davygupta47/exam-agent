-- Elective windows: tracks when preference submission is open
CREATE TABLE IF NOT EXISTS elective_windows (
  id          SERIAL PRIMARY KEY,
  tenant_id   INT NOT NULL REFERENCES tenants(id),
  semester    SMALLINT NOT NULL,
  opens_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closes_at   TIMESTAMPTZ NOT NULL,
  status      VARCHAR(20) DEFAULT 'OPEN',  -- OPEN | CLOSED | ALLOCATED
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
