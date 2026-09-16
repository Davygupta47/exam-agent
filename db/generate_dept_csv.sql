CREATE OR REPLACE FUNCTION generate_dept_sheet(
  p_tenant_id INT,
  p_semester  SMALLINT,
  p_dept_code VARCHAR
) RETURNS VOID AS $$
DECLARE
  v_dept_id INT;
  v_table_name TEXT;
  v_subject RECORD;
  v_col_sql TEXT := '';
  v_full_sql TEXT;
BEGIN
  SELECT id INTO v_dept_id FROM departments
    WHERE code = p_dept_code AND tenant_id = p_tenant_id;

  v_table_name := 'sheet_sem' || p_semester || '_' || lower(replace(p_dept_code, ' ', '_'));

EXECUTE 'DROP TABLE IF EXISTS ' || v_table_name;


  FOR v_subject IN
    SELECT sub.code
    FROM subjects sub
    WHERE sub.tenant_id = p_tenant_id
      AND sub.department_id = v_dept_id
      AND sub.semester = p_semester
      AND sub.elective_type = 'COMPULSORY'
    ORDER BY sub.code
  LOOP
    v_col_sql := v_col_sql || ', '
      || quote_ident(v_subject.code || '_int') || ' NUMERIC(5,2)'
      || ', ' || quote_ident(v_subject.code || '_ext') || ' NUMERIC(5,2)'
      || ', ' || quote_ident(v_subject.code || '_total') || ' NUMERIC(5,2)';
  END LOOP;

  -- Professional Elective I
  v_col_sql := v_col_sql 
    || ', PE_I_code VARCHAR(20), PE_I_int NUMERIC(5,2), PE_I_ext NUMERIC(5,2), PE_I_total NUMERIC(5,2)'
    || ', PE_II_code VARCHAR(20), PE_II_int NUMERIC(5,2), PE_II_ext NUMERIC(5,2), PE_II_total NUMERIC(5,2)'
    || ', PE_II_LAB_code VARCHAR(20), PE_II_LAB_int NUMERIC(5,2), PE_II_LAB_ext NUMERIC(5,2), PE_II_LAB_total NUMERIC(5,2)'
    || ', OE_I_code VARCHAR(20), OE_I_int NUMERIC(5,2), OE_I_ext NUMERIC(5,2), OE_I_total NUMERIC(5,2)';

  v_full_sql := 'CREATE TABLE ' || v_table_name || ' ('
    || 'id SERIAL PRIMARY KEY'
    || ', autonomy_roll_no VARCHAR(30)'
    || ', college_roll_no VARCHAR(30)'
    || ', name VARCHAR(200)'
    || ', cgpa_2y NUMERIC(4,2)'
    || v_col_sql
    || ')';
  EXECUTE v_full_sql;

  v_full_sql := 'INSERT INTO ' || v_table_name
    || ' (autonomy_roll_no, college_roll_no, name, cgpa_2y)'
    || ' SELECT s.autonomy_roll_no, s.college_roll_no, s.name, s.second_year_gpa'
    || ' FROM students s'
    || ' WHERE s.tenant_id = ' || p_tenant_id
    || ' AND s.department_id = ' || v_dept_id
    || ' AND s.current_semester = ' || p_semester
    || ' ORDER BY s.college_roll_no';
  EXECUTE v_full_sql;

  RAISE NOTICE 'Created table: %', v_table_name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_sheet_with_electives(
  p_tenant_id INT,
  p_semester  SMALLINT,
  p_dept_code VARCHAR
) RETURNS VOID AS $$
DECLARE
  v_table_name TEXT;
  v_sql TEXT;
BEGIN
  v_table_name := 'sheet_sem' || p_semester || '_' || lower(replace(p_dept_code, ' ', '_'));
  v_sql := 'UPDATE ' || v_table_name || ' t SET PE_I_code = sub.code '
        || 'FROM student_subjects ss JOIN subjects sub ON sub.id = ss.subject_id AND sub.elective_type = ''PROFESSIONAL_ELECTIVE_I'' '
        || 'JOIN students s ON s.id = ss.student_id '
        || 'WHERE s.college_roll_no = t.college_roll_no AND ss.tenant_id = $1';
  EXECUTE v_sql USING p_tenant_id;

  v_sql := 'UPDATE ' || v_table_name || ' t SET PE_II_code = sub.code '
        || 'FROM student_subjects ss JOIN subjects sub ON sub.id = ss.subject_id AND sub.elective_type = ''PROFESSIONAL_ELECTIVE_II'' '
        || 'JOIN students s ON s.id = ss.student_id '
        || 'WHERE s.college_roll_no = t.college_roll_no AND ss.tenant_id = $1';
  EXECUTE v_sql USING p_tenant_id;
  v_sql := 'UPDATE ' || v_table_name || ' t SET PE_II_LAB_code = sub.code '
        || 'FROM student_subjects ss JOIN subjects sub ON sub.id = ss.subject_id AND sub.elective_type = ''PROFESSIONAL_ELECTIVE_II_LAB'' '
        || 'JOIN students s ON s.id = ss.student_id '
        || 'WHERE s.college_roll_no = t.college_roll_no AND ss.tenant_id = $1';
  EXECUTE v_sql USING p_tenant_id;
  v_sql := 'UPDATE ' || v_table_name || ' t SET OE_I_code = sub.code '
        || 'FROM student_subjects ss JOIN subjects sub ON sub.id = ss.subject_id AND sub.elective_type = ''OPEN_ELECTIVE_I'' '
        || 'JOIN students s ON s.id = ss.student_id '
        || 'WHERE s.college_roll_no = t.college_roll_no AND ss.tenant_id = $1';
  EXECUTE v_sql USING p_tenant_id;

  RAISE NOTICE 'Updated table % with elective codes', v_table_name;
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION export_dept_csv(
  p_semester  SMALLINT,
  p_dept_code VARCHAR,
  p_file_path TEXT
) RETURNS TEXT AS $$
DECLARE
  v_table_name TEXT;
  v_count INT;
BEGIN
  v_table_name := 'sheet_sem' || p_semester || '_' || lower(replace(p_dept_code, ' ', '_'));
  
-- CSV
  EXECUTE 'COPY (SELECT * FROM ' || v_table_name || ' ORDER BY college_roll_no) TO '
    || quote_literal(p_file_path) || ' WITH (FORMAT csv, HEADER true)';

  EXECUTE 'SELECT COUNT(*) FROM ' || v_table_name INTO v_count;
  RETURN 'Exported ' || v_count || ' rows to ' || p_file_path;
END;
$$ LANGUAGE plpgsql;
