import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { query, pool } from '../config/db.js';
import { ELECTIVE_CONFIG } from '../config/electiveConfig.js';

// In-memory timer handle for auto-allocation
let allocationTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Open Elective Window ───────────────────────────────────────────
export async function openElectiveWindow(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = req.user!.tenant_id;
    const semester = parseInt((req.body.semester as string) || '5', 10);

    // Close any existing open windows for this semester
    await query(
      `UPDATE elective_windows SET status = 'CLOSED' WHERE tenant_id = $1 AND semester = $2 AND status = 'OPEN'`,
      [tenantId, semester]
    );

    // Clear previous allocations & preferences statuses so we start fresh
    await query(`DELETE FROM elective_allocations WHERE tenant_id = $1 AND semester = $2`, [tenantId, semester]);
    await query(
      `UPDATE elective_preferences SET status = 'SUBMITTED' WHERE tenant_id = $1 AND semester = $2`,
      [tenantId, semester]
    );

    const opensAt = new Date();
    const closesAt = new Date(opensAt.getTime() + ELECTIVE_CONFIG.WINDOW_DURATION_MS);

    const windowRes = await query(
      `INSERT INTO elective_windows (tenant_id, semester, opens_at, closes_at, status)
       VALUES ($1, $2, $3, $4, 'OPEN')
       RETURNING id, opens_at, closes_at, status`,
      [tenantId, semester, opensAt.toISOString(), closesAt.toISOString()]
    );

    // Schedule auto-allocation
    if (allocationTimer) clearTimeout(allocationTimer);
    allocationTimer = setTimeout(async () => {
      console.log(`[Elective] Auto-allocation triggered for semester ${semester}`);
      try {
        await performAllocation(tenantId, semester);
      } catch (err: any) {
        console.error('[Elective] Auto-allocation error:', err.message);
      }
    }, ELECTIVE_CONFIG.WINDOW_DURATION_MS);

    return res.json({
      success: true,
      message: `Elective window opened. Closes at ${closesAt.toISOString()} (${ELECTIVE_CONFIG.WINDOW_DURATION_MS / 1000}s)`,
      window: windowRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

// ─── Window Status ──────────────────────────────────────────────────
export async function getElectiveWindowStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = req.user!.tenant_id;
    const semester = parseInt((req.query.semester as string) || '5', 10);

    const windowRes = await query(
      `SELECT id, opens_at, closes_at, status
       FROM elective_windows
       WHERE tenant_id = $1 AND semester = $2
       ORDER BY created_at DESC LIMIT 1`,
      [tenantId, semester]
    );

    const window = windowRes.rows[0] || null;

    // Preference submission count
    const countRes = await query(
      `SELECT COUNT(DISTINCT student_id) as submitted_count
       FROM elective_preferences
       WHERE tenant_id = $1 AND semester = $2 AND status = 'SUBMITTED'`,
      [tenantId, semester]
    );
    const submittedCount = parseInt(countRes.rows[0]?.submitted_count || '0', 10);

    // Total students in this semester
    const totalRes = await query(
      `SELECT COUNT(*) as total FROM students WHERE tenant_id = $1 AND current_semester = $2`,
      [tenantId, semester]
    );
    const totalStudents = parseInt(totalRes.rows[0]?.total || '0', 10);

    // Allocation count
    const allocCountRes = await query(
      `SELECT COUNT(DISTINCT student_id) as allocated_count
       FROM elective_allocations
       WHERE tenant_id = $1 AND semester = $2`,
      [tenantId, semester]
    );
    const allocatedCount = parseInt(allocCountRes.rows[0]?.allocated_count || '0', 10);

    return res.json({
      success: true,
      window,
      submittedCount,
      totalStudents,
      allocatedCount,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Run Allocation (manual trigger) ────────────────────────────────
export async function runAllocation(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = req.user!.tenant_id;
    const semester = parseInt((req.body.semester as string) || '5', 10);

    // Close the window first
    await query(
      `UPDATE elective_windows SET status = 'CLOSED' WHERE tenant_id = $1 AND semester = $2 AND status = 'OPEN'`,
      [tenantId, semester]
    );

    if (allocationTimer) {
      clearTimeout(allocationTimer);
      allocationTimer = null;
    }

    const result = await performAllocation(tenantId, semester);

    return res.json({
      success: true,
      message: 'Elective allocation completed successfully.',
      result,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Core Allocation Algorithm ──────────────────────────────────────
async function performAllocation(tenantId: number, semester: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Mark window as ALLOCATED
    await client.query(
      `UPDATE elective_windows SET status = 'ALLOCATED' WHERE tenant_id = $1 AND semester = $2 AND status IN ('OPEN', 'CLOSED')`,
      [tenantId, semester]
    );

    // Clear previous allocations for this semester
    await client.query(
      `DELETE FROM elective_allocations WHERE tenant_id = $1 AND semester = $2`,
      [tenantId, semester]
    );

    // Remove previous elective enrollments from student_subjects
    await client.query(
      `DELETE FROM student_subjects WHERE tenant_id = $1 AND is_elective = TRUE
       AND student_id IN (SELECT id FROM students WHERE tenant_id = $1 AND current_semester = $2)`,
      [tenantId, semester]
    );

    // Get all departments
    const depts = await client.query(`SELECT id, code FROM departments WHERE tenant_id = $1`, [tenantId]);

    // Get all elective types that have preferences
    const electiveTypes = ['PROFESSIONAL_ELECTIVE_I', 'PROFESSIONAL_ELECTIVE_II', 'OPEN_ELECTIVE_I'];

    const summary: { department: string; elective_type: string; allocated: number; total: number }[] = [];

    for (const dept of depts.rows) {
      for (const etype of electiveTypes) {
        // Check if subjects exist for this dept/etype/semester
        const subjectCheck = await client.query(
          `SELECT 1 FROM subjects WHERE tenant_id = $1 AND department_id = $2
           AND semester = $3 AND elective_type = $4::elective_type AND course_type = 'THEORY' LIMIT 1`,
          [tenantId, dept.id, semester, etype]
        );
        if (subjectCheck.rows.length === 0) continue;

        // Get capacities for each subject
        const capacities = await client.query(
          `SELECT sub.id as subject_id, COALESCE(ec.capacity, $4) as capacity
           FROM subjects sub
           LEFT JOIN elective_capacities ec ON ec.subject_id = sub.id AND ec.tenant_id = $1 AND ec.semester = $3
           WHERE sub.tenant_id = $1 AND sub.department_id = $2 AND sub.semester = $3
             AND sub.elective_type = $5::elective_type AND sub.course_type = 'THEORY'`,
          [tenantId, dept.id, semester, ELECTIVE_CONFIG.PE_CAPACITY, etype]
        );
        const capMap = new Map<number, number>(); // subject_id -> remaining capacity
        for (const c of capacities.rows) {
          capMap.set(c.subject_id, parseInt(c.capacity, 10));
        }

        // Track which subjects have been filled (allocated count)
        const allocCount = new Map<number, number>(); // subject_id -> count allocated so far
        for (const subId of capMap.keys()) allocCount.set(subId, 0);

        // Track allocated students
        const allocatedStudents = new Set<number>();

        // ── Round 1: 1st preference ──
        const round1 = await client.query(
          `SELECT ep.student_id, ep.pref_1_id, s.second_year_gpa
           FROM elective_preferences ep
           JOIN students s ON s.id = ep.student_id AND s.tenant_id = $1
           WHERE ep.tenant_id = $1 AND ep.semester = $2 AND ep.elective_type = $3::elective_type
             AND s.department_id = $4
           ORDER BY ep.pref_1_id, s.second_year_gpa DESC NULLS LAST, s.id ASC`,
          [tenantId, semester, etype, dept.id]
        );

        // Group by pref_1_id, pick top N by capacity
        const pref1Groups = new Map<number, typeof round1.rows>();
        for (const row of round1.rows) {
          const group = pref1Groups.get(row.pref_1_id) || [];
          group.push(row);
          pref1Groups.set(row.pref_1_id, group);
        }

        for (const [subjectId, students] of pref1Groups) {
          const cap = capMap.get(subjectId) || 0;
          const allocated = allocCount.get(subjectId) || 0;
          const remaining = cap - allocated;
          const toAllocate = students.slice(0, remaining);
          for (const s of toAllocate) {
            await client.query(
              `INSERT INTO elective_allocations (tenant_id, student_id, semester, elective_type, subject_id, preference_rank)
               VALUES ($1, $2, $3, $4::elective_type, $5, 1)`,
              [tenantId, s.student_id, semester, etype, subjectId]
            );
            allocatedStudents.add(s.student_id);
            allocCount.set(subjectId, (allocCount.get(subjectId) || 0) + 1);
          }
        }

        // ── Round 2: 2nd preference (unallocated students) ──
        const round2 = await client.query(
          `SELECT ep.student_id, ep.pref_2_id, s.second_year_gpa
           FROM elective_preferences ep
           JOIN students s ON s.id = ep.student_id AND s.tenant_id = $1
           WHERE ep.tenant_id = $1 AND ep.semester = $2 AND ep.elective_type = $3::elective_type
             AND s.department_id = $4
           ORDER BY ep.pref_2_id, s.second_year_gpa DESC NULLS LAST, s.id ASC`,
          [tenantId, semester, etype, dept.id]
        );

        const pref2Groups = new Map<number, typeof round2.rows>();
        for (const row of round2.rows) {
          if (allocatedStudents.has(row.student_id)) continue;
          const group = pref2Groups.get(row.pref_2_id) || [];
          group.push(row);
          pref2Groups.set(row.pref_2_id, group);
        }

        for (const [subjectId, students] of pref2Groups) {
          const cap = capMap.get(subjectId) || 0;
          const allocated = allocCount.get(subjectId) || 0;
          const remaining = cap - allocated;
          if (remaining <= 0) continue;
          const toAllocate = students.slice(0, remaining);
          for (const s of toAllocate) {
            await client.query(
              `INSERT INTO elective_allocations (tenant_id, student_id, semester, elective_type, subject_id, preference_rank)
               VALUES ($1, $2, $3, $4::elective_type, $5, 2)`,
              [tenantId, s.student_id, semester, etype, subjectId]
            );
            allocatedStudents.add(s.student_id);
            allocCount.set(subjectId, (allocCount.get(subjectId) || 0) + 1);
          }
        }

        // ── Round 3: 3rd preference (still unallocated) ──
        const round3 = await client.query(
          `SELECT ep.student_id, ep.pref_3_id, s.second_year_gpa
           FROM elective_preferences ep
           JOIN students s ON s.id = ep.student_id AND s.tenant_id = $1
           WHERE ep.tenant_id = $1 AND ep.semester = $2 AND ep.elective_type = $3::elective_type
             AND s.department_id = $4
           ORDER BY ep.pref_3_id, s.second_year_gpa DESC NULLS LAST, s.id ASC`,
          [tenantId, semester, etype, dept.id]
        );

        const pref3Groups = new Map<number, typeof round3.rows>();
        for (const row of round3.rows) {
          if (allocatedStudents.has(row.student_id)) continue;
          const group = pref3Groups.get(row.pref_3_id) || [];
          group.push(row);
          pref3Groups.set(row.pref_3_id, group);
        }

        for (const [subjectId, students] of pref3Groups) {
          const cap = capMap.get(subjectId) || 0;
          const allocated = allocCount.get(subjectId) || 0;
          const remaining = cap - allocated;
          if (remaining <= 0) continue;
          const toAllocate = students.slice(0, remaining);
          for (const s of toAllocate) {
            await client.query(
              `INSERT INTO elective_allocations (tenant_id, student_id, semester, elective_type, subject_id, preference_rank)
               VALUES ($1, $2, $3, $4::elective_type, $5, 3)`,
              [tenantId, s.student_id, semester, etype, subjectId]
            );
            allocatedStudents.add(s.student_id);
            allocCount.set(subjectId, (allocCount.get(subjectId) || 0) + 1);
          }
        }

        // ── Force-assign remaining to least-full subject ──
        const allPrefs = await client.query(
          `SELECT ep.student_id FROM elective_preferences ep
           JOIN students s ON s.id = ep.student_id AND s.tenant_id = $1
           WHERE ep.tenant_id = $1 AND ep.semester = $2 AND ep.elective_type = $3::elective_type
             AND s.department_id = $4
           ORDER BY s.second_year_gpa DESC NULLS LAST, s.id ASC`,
          [tenantId, semester, etype, dept.id]
        );

        for (const row of allPrefs.rows) {
          if (allocatedStudents.has(row.student_id)) continue;
          // Find subject with most remaining capacity
          let bestSubject: number | null = null;
          let bestRemaining = 0;
          for (const [subId, cap] of capMap) {
            const alloc = allocCount.get(subId) || 0;
            const rem = cap - alloc;
            if (rem > bestRemaining) {
              bestRemaining = rem;
              bestSubject = subId;
            }
          }
          if (bestSubject && bestRemaining > 0) {
            await client.query(
              `INSERT INTO elective_allocations (tenant_id, student_id, semester, elective_type, subject_id, preference_rank)
               VALUES ($1, $2, $3, $4::elective_type, $5, 3)`,
              [tenantId, row.student_id, semester, etype, bestSubject]
            );
            allocatedStudents.add(row.student_id);
            allocCount.set(bestSubject, (allocCount.get(bestSubject) || 0) + 1);
          }
        }

        // Count summary
        const totalStudentsInDept = await client.query(
          `SELECT COUNT(*) as c FROM students WHERE department_id = $1 AND tenant_id = $2 AND current_semester = $3`,
          [dept.id, tenantId, semester]
        );

        summary.push({
          department: dept.code,
          elective_type: etype,
          allocated: allocatedStudents.size,
          total: parseInt(totalStudentsInDept.rows[0].c, 10),
        });
      }
    }

    // Enroll allocated electives into student_subjects
    await client.query(
      `INSERT INTO student_subjects (tenant_id, student_id, subject_id, is_elective, opted_at)
       SELECT ea.tenant_id, ea.student_id, ea.subject_id, TRUE, ea.allocated_at
       FROM elective_allocations ea
       WHERE ea.tenant_id = $1 AND ea.semester = $2
       ON CONFLICT (tenant_id, student_id, subject_id) DO NOTHING`,
      [tenantId, semester]
    );

    // Update preference statuses
    await client.query(
      `UPDATE elective_preferences SET status = 'ALLOCATED' WHERE tenant_id = $1 AND semester = $2`,
      [tenantId, semester]
    );

    await client.query('COMMIT');

    // Generate test.csv
    await generateTestCSV(tenantId, semester);

    console.log('[Elective] Allocation complete:', summary);
    return summary;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Generate test.csv ──────────────────────────────────────────────
async function generateTestCSV(tenantId: number, semester: number) {
  // Get all students in this semester with their compulsory subjects and allocations
  const result = await query(
    `SELECT
       s.college_roll_no,
       s.name as student_name,
       d.code as department,
       s.second_year_gpa,
       -- Compulsory subjects (codes)
       COALESCE(
         (SELECT string_agg(sub.code, '; ' ORDER BY sub.code)
          FROM student_subjects ss
          JOIN subjects sub ON sub.id = ss.subject_id
          WHERE ss.student_id = s.id AND ss.is_elective = FALSE),
         ''
       ) as compulsory_subjects,
       -- Elective allocation
       ea.elective_type,
       esub.code as allocated_subject_code,
       esub.name as allocated_subject_name,
       ea.preference_rank
     FROM students s
     JOIN departments d ON d.id = s.department_id
     LEFT JOIN elective_allocations ea ON ea.student_id = s.id AND ea.tenant_id = $1 AND ea.semester = $2
     LEFT JOIN subjects esub ON esub.id = ea.subject_id
     WHERE s.tenant_id = $1 AND s.current_semester = $2
     ORDER BY d.code, s.college_roll_no, ea.elective_type`,
    [tenantId, semester]
  );

  const header = 'student_roll_no,student_name,department,second_year_gpa,compulsory_subjects,elective_type,allocated_subject_code,allocated_subject_name,preference_rank';

  const rows = result.rows.map((r) => {
    const csvEscape = (val: string | null | undefined) => {
      if (!val) return '';
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };
    return [
      csvEscape(r.college_roll_no),
      csvEscape(r.student_name),
      csvEscape(r.department),
      r.second_year_gpa ?? '',
      csvEscape(r.compulsory_subjects),
      csvEscape(r.elective_type),
      csvEscape(r.allocated_subject_code),
      csvEscape(r.allocated_subject_name),
      r.preference_rank ?? '',
    ].join(',');
  });

  const csv = [header, ...rows].join('\n');

  const csvPath = path.resolve(process.cwd(), '../db/test.csv');
  fs.writeFileSync(csvPath, csv, 'utf8');
  console.log(`[Elective] test.csv written to ${csvPath} (${rows.length} rows)`);
}

// ─── Export CSV Download ────────────────────────────────────────────
export async function exportAllocationCSV(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = req.user!.tenant_id;
    const semester = parseInt((req.query.semester as string) || '5', 10);

    // Regenerate to ensure it's fresh
    await generateTestCSV(tenantId, semester);

    const csvPath = path.resolve(process.cwd(), '../db/test.csv');
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ success: false, error: 'No allocation CSV found. Run allocation first.' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="test.csv"');
    const stream = fs.createReadStream(csvPath);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}
