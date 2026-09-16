-- Allocating here!
CREATE OR REPLACE FUNCTION allocate_electives(
  p_tenant_id INT,
  p_semester  SMALLINT
) RETURNS TABLE(department TEXT, elective_category TEXT, allocated INT, total_students INT) AS $$
DECLARE
  v_dept RECORD;
  v_etype elective_type;
  v_etypes elective_type[] := ARRAY[
    'PROFESSIONAL_ELECTIVE_I',
    'PROFESSIONAL_ELECTIVE_II',
    'OPEN_ELECTIVE_I'
  ]::elective_type[];
  v_allocated INT;
  v_total INT;
BEGIN
  DELETE FROM elective_allocations WHERE tenant_id = p_tenant_id AND semester = p_semester;
  UPDATE elective_preferences SET status = 'PROCESSING'
    WHERE tenant_id = p_tenant_id AND semester = p_semester;

  FOR v_dept IN SELECT id, code FROM departments WHERE tenant_id = p_tenant_id LOOP

    FOREACH v_etype IN ARRAY v_etypes LOOP
      IF NOT EXISTS (
        SELECT 1 FROM subjects
        WHERE tenant_id = p_tenant_id AND department_id = v_dept.id
          AND semester = p_semester AND elective_type = v_etype
          AND course_type = 'THEORY'
      ) THEN CONTINUE; END IF;

      -- 1st pref
      INSERT INTO elective_allocations (tenant_id, student_id, semester, elective_type, subject_id, preference_rank)
      SELECT p_tenant_id, sub.student_id, p_semester, v_etype, sub.pref_1_id, 1
      FROM (
        SELECT ep.student_id, ep.pref_1_id,
          ROW_NUMBER() OVER (PARTITION BY ep.pref_1_id ORDER BY s.second_year_gpa DESC, s.id) as rn
        FROM elective_preferences ep
        JOIN students s ON s.id = ep.student_id AND s.tenant_id = p_tenant_id
        WHERE ep.tenant_id = p_tenant_id
          AND ep.semester = p_semester
          AND ep.elective_type = v_etype
          AND s.department_id = v_dept.id
      ) sub
      JOIN elective_capacities ec ON ec.subject_id = sub.pref_1_id
        AND ec.tenant_id = p_tenant_id AND ec.semester = p_semester
      WHERE sub.rn <= ec.capacity;

      -- 2nd pref
      INSERT INTO elective_allocations (tenant_id, student_id, semester, elective_type, subject_id, preference_rank)
      SELECT p_tenant_id, sub.student_id, p_semester, v_etype, sub.pref_2_id, 2
      FROM (
        SELECT ep.student_id, ep.pref_2_id,
          ROW_NUMBER() OVER (PARTITION BY ep.pref_2_id ORDER BY s.second_year_gpa DESC, s.id) as rn
        FROM elective_preferences ep
        JOIN students s ON s.id = ep.student_id AND s.tenant_id = p_tenant_id
        WHERE ep.tenant_id = p_tenant_id
          AND ep.semester = p_semester
          AND ep.elective_type = v_etype
          AND s.department_id = v_dept.id
          -- Not already allocated
          AND NOT EXISTS (
            SELECT 1 FROM elective_allocations ea
            WHERE ea.student_id = ep.student_id
              AND ea.semester = p_semester AND ea.elective_type = v_etype
              AND ea.tenant_id = p_tenant_id
          )
      ) sub
      JOIN elective_capacities ec ON ec.subject_id = sub.pref_2_id
        AND ec.tenant_id = p_tenant_id AND ec.semester = p_semester
      -- Remaining capacity = capacity - already allocated count
      WHERE sub.rn <= (
        ec.capacity - (
          SELECT COUNT(*) FROM elective_allocations ea2
          WHERE ea2.subject_id = sub.pref_2_id AND ea2.semester = p_semester
            AND ea2.tenant_id = p_tenant_id
        )
      );

      -- === ROUND 3: 3rd preference (still unallocated) ===
      INSERT INTO elective_allocations (tenant_id, student_id, semester, elective_type, subject_id, preference_rank)
      SELECT p_tenant_id, sub.student_id, p_semester, v_etype, sub.pref_3_id, 3
      FROM (
        SELECT ep.student_id, ep.pref_3_id,
          ROW_NUMBER() OVER (PARTITION BY ep.pref_3_id ORDER BY s.second_year_gpa DESC, s.id) as rn
        FROM elective_preferences ep
        JOIN students s ON s.id = ep.student_id AND s.tenant_id = p_tenant_id
        WHERE ep.tenant_id = p_tenant_id
          AND ep.semester = p_semester
          AND ep.elective_type = v_etype
          AND s.department_id = v_dept.id
          AND NOT EXISTS (
            SELECT 1 FROM elective_allocations ea
            WHERE ea.student_id = ep.student_id
              AND ea.semester = p_semester AND ea.elective_type = v_etype
              AND ea.tenant_id = p_tenant_id
          )
      ) sub
      JOIN elective_capacities ec ON ec.subject_id = sub.pref_3_id
        AND ec.tenant_id = p_tenant_id AND ec.semester = p_semester
      WHERE sub.rn <= (
        ec.capacity - (
          SELECT COUNT(*) FROM elective_allocations ea2
          WHERE ea2.subject_id = sub.pref_3_id AND ea2.semester = p_semester
            AND ea2.tenant_id = p_tenant_id
        )
      );
      -- Last Assign
      PERFORM force_assign_remaining(p_tenant_id, p_semester, v_etype, v_dept.id);

      SELECT COUNT(*) INTO v_allocated FROM elective_allocations
        WHERE tenant_id = p_tenant_id AND semester = p_semester AND elective_type = v_etype
        AND student_id IN (SELECT id FROM students WHERE department_id = v_dept.id AND tenant_id = p_tenant_id);
      SELECT COUNT(*) INTO v_total FROM students
        WHERE department_id = v_dept.id AND tenant_id = p_tenant_id AND current_semester = p_semester;

      department := v_dept.code;
      elective_category := v_etype::TEXT;
      allocated := v_allocated;
      total_students := v_total;
      RETURN NEXT;

    END LOOP;
  END LOOP;

  UPDATE elective_preferences SET status = 'ALLOCATED'
    WHERE tenant_id = p_tenant_id AND semester = p_semester;

  INSERT INTO student_subjects (tenant_id, student_id, subject_id, is_elective, opted_at)
  SELECT ea.tenant_id, ea.student_id, ea.subject_id, TRUE, ea.allocated_at
  FROM elective_allocations ea
  WHERE ea.tenant_id = p_tenant_id AND ea.semester = p_semester
  ON CONFLICT (tenant_id, student_id, subject_id) DO NOTHING;

  INSERT INTO student_subjects (tenant_id, student_id, subject_id, is_elective, opted_at)
  SELECT ea.tenant_id, ea.student_id, plp.lab_id, TRUE, ea.allocated_at
  FROM elective_allocations ea
  JOIN pe_lab_pairs plp ON plp.theory_id = ea.subject_id AND plp.tenant_id = ea.tenant_id
  WHERE ea.tenant_id = p_tenant_id AND ea.semester = p_semester
    AND ea.elective_type = 'PROFESSIONAL_ELECTIVE_II'
  ON CONFLICT (tenant_id, student_id, subject_id) DO NOTHING;

  RETURN;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION force_assign_remaining(
  p_tenant_id INT,
  p_semester  SMALLINT,
  p_etype     elective_type,
  p_dept_id   INT
) RETURNS VOID AS $$
DECLARE
  v_student RECORD;
  v_subject RECORD;
BEGIN
  FOR v_student IN
    SELECT ep.student_id
    FROM elective_preferences ep
    JOIN students s ON s.id = ep.student_id AND s.tenant_id = p_tenant_id
    WHERE ep.tenant_id = p_tenant_id
      AND ep.semester = p_semester
      AND ep.elective_type = p_etype
      AND s.department_id = p_dept_id
      AND NOT EXISTS (
        SELECT 1 FROM elective_allocations ea
        WHERE ea.student_id = ep.student_id
          AND ea.semester = p_semester AND ea.elective_type = p_etype
          AND ea.tenant_id = p_tenant_id
      )
    ORDER BY s.second_year_gpa DESC, s.id
  LOOP
    SELECT sub.id INTO v_subject
    FROM subjects sub
    JOIN elective_capacities ec ON ec.subject_id = sub.id
      AND ec.tenant_id = p_tenant_id AND ec.semester = p_semester
    WHERE sub.tenant_id = p_tenant_id
      AND sub.department_id = p_dept_id
      AND sub.semester = p_semester
      AND sub.elective_type = p_etype
      AND sub.course_type = 'THEORY'
      AND (
        SELECT COUNT(*) FROM elective_allocations ea
        WHERE ea.subject_id = sub.id AND ea.semester = p_semester
          AND ea.tenant_id = p_tenant_id
      ) < ec.capacity
    ORDER BY (
        SELECT COUNT(*) FROM elective_allocations ea
        WHERE ea.subject_id = sub.id AND ea.semester = p_semester
          AND ea.tenant_id = p_tenant_id
      ) ASC
    LIMIT 1;

    IF v_subject.id IS NOT NULL THEN
      INSERT INTO elective_allocations (tenant_id, student_id, semester, elective_type, subject_id, preference_rank)
      VALUES (p_tenant_id, v_student.student_id, p_semester, p_etype, v_subject.id, 3);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
