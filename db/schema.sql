CREATE TABLE IF NOT EXISTS students (
    id                SERIAL PRIMARY KEY,
    autonomy_roll_no  VARCHAR(20) NOT NULL UNIQUE,
    college_roll_no   VARCHAR(20),
    registration_no   VARCHAR(20),
    name              VARCHAR(100) NOT NULL,
    department        VARCHAR(10) NOT NULL,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
