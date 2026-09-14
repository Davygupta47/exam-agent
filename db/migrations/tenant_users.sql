CREATE TABLE tenants (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  is_active   BOOLEAN DEFAULT TRUE,
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  tenant_id     INT NOT NULL REFERENCES tenants(id),
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  full_name     VARCHAR(200) NOT NULL,
  phone         VARCHAR(20),
  role          VARCHAR(30) NOT NULL DEFAULT 'student',
    -- super_admin | exam_controller | hod | teacher | student | finance
  is_active     BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);