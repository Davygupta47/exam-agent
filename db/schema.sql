CREATE TABLE IF NOT EXISTS students (
    autonomy_roll_no  VARCHAR(20) NOT NULL,
    college_roll_no   VARCHAR(20) NOT NULL UNIQUE,
    registration_no   VARCHAR(20) NOT NULL,
    name              VARCHAR(100) NOT NULL,
    department        VARCHAR(10) NOT NULL,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (autonomy_roll_no, registration_no)
);
CREATE INDEX idx_students_department ON students(department);
CREATE INDEX idx_students_name ON students(name);
