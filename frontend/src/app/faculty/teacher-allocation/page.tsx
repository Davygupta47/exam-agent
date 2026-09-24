"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { fetchApi } from "@/lib/api";
import { User } from "@/types";
import { Save, AlertCircle, Users, BookOpen } from "lucide-react";

interface Teacher {
  id: number;
  name: string;
  initials?: string;
  teacher_code: string;
  teacher_prefix: string;  // e.g. 'AIML', 'CHE', 'DS' — stripped from teacher_code
  designation: string;
  department_id: number;
  department_code: string;
  teacher_type: "INSTRUCTOR" | "TECHNICAL_ASSISTANT";
}

interface Subject {
  id: number;
  name: string;
  code: string;
  credits: number;
  course_type: string;
  elective_type: string;
  department_id: number;
  department_code: string;
  speciality_code: string;
}

interface Assignment {
  subject_id: number;
  teacher_id: number;
  assignment_role: "INSTRUCTOR" | "TECHNICAL_ASSISTANT";
}

export default function TeacherAllocationPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [stats, setStats] = React.useState({ student_count: 0 });
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [assignments, setAssignments] = React.useState<Record<number, number[]>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      const meRes = await fetchApi("/auth/me");
      if (!meRes.success || !meRes.user) {
        router.push("/login?role=faculty");
        return;
      }
      
      if (meRes.user.role !== "hod") {
        router.push("/faculty");
        return;
      }
      setUser(meRes.user);

      const [teachersRes, statsRes, subjectsRes, assignmentsRes] = await Promise.all([
        fetchApi("/hod/teachers"),
        fetchApi("/hod/stats"),
        fetchApi("/hod/assignable-subjects"),
        fetchApi("/hod/assignments"),
      ]);

      if (!teachersRes.success) {
        // If they get a 403 Forbidden, redirect to dashboard
        router.push("/faculty");
        return;
      }

      setTeachers(teachersRes.data || []);
      setStats(statsRes.data || { student_count: 0 });
      setSubjects(subjectsRes.data || []);

      const currentAssignments: Record<number, number[]> = {};
      (assignmentsRes.data || []).forEach((a: Assignment) => {
        const current = currentAssignments[a.subject_id] || [];
        if (a.assignment_role === "TECHNICAL_ASSISTANT") {
          current.push(a.teacher_id);
        } else {
          current.unshift(a.teacher_id);
        }
        currentAssignments[a.subject_id] = current;
      });
      setAssignments(currentAssignments);
    } catch (err) {
      console.error(err);
      setError("Failed to load allocation data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssignmentChange = (subjectId: number, index: number, teacherId: string) => {
    setAssignments(prev => ({
      ...prev,
      [subjectId]: (prev[subjectId] || []).map((value, currentIndex) =>
        currentIndex === index ? parseInt(teacherId, 10) : value
      ).concat((prev[subjectId] || []).length <= index ? [parseInt(teacherId, 10)] : []),
    }));
    setError(null);
    setSuccessMsg(null);
  };

  const getEligibleTeachers = (subject: Subject, role: "INSTRUCTOR" | "TECHNICAL_ASSISTANT") => {
    const isCompulsory = subject.elective_type?.toUpperCase() === "COMPULSORY";
    const isPractical = subject.course_type?.toUpperCase() === "PRACTICAL";

    // For electives and practicals, match against the first 3 characters of the subject code
    const subjectPrefix = subject.code.substring(0, 3).toUpperCase();
    const matchesSpeciality = (teacher: Teacher) =>
      teacher.teacher_prefix?.toUpperCase() === subjectPrefix;

    return teachers.filter((teacher) => {
      // Exclude Admin from allocation
      if (teacher.teacher_prefix?.toUpperCase() === "ADMIN" || teacher.department_code?.toUpperCase() === "ADMIN") {
        return false;
      }

      if (role === "TECHNICAL_ASSISTANT" && teacher.teacher_type !== "TECHNICAL_ASSISTANT") return false;
      if (role === "INSTRUCTOR" && teacher.teacher_type !== "INSTRUCTOR") return false;

      // Practical subjects always use 3-char prefix matching
      if (isPractical) {
        return matchesSpeciality(teacher);
      }

      // Theory Compulsory: strictly within the department
      if (isCompulsory) {
        return teacher.department_id === subject.department_id;
      }
      
      // Theory Electives: match 3 characters of subject code
      return matchesSpeciality(teacher);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      assignments: Object.entries(assignments).flatMap(([subjectId, teacherIds]) =>
        teacherIds
          .filter((teacherId) => teacherId && !isNaN(teacherId))
          .map((teacherId, index) => ({
            subject_id: parseInt(subjectId, 10),
            teacher_id: teacherId,
            assignment_role: index === 0 ? "INSTRUCTOR" : "TECHNICAL_ASSISTANT",
          }))
      ),
    };

    try {
      const res = await fetchApi("/hod/assign-teacher", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setSuccessMsg("Assignments saved successfully!");
      } else {
        setError(res.error || "Failed to save assignments.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-ink-muted">Loading teacher allocation...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell user={user} role="faculty" subtitle="HOD Portal • Teacher Allocation">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-surface p-6 rounded-[22px] border border-subtle shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight mb-2">
              Teacher Allocation
            </h1>
            <p className="text-sm text-ink-muted max-w-2xl">
              Assign departmental faculty to 5th-semester subjects. Assignments are used for timetable generation and marks uploading.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50">
               <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
               <div>
                 <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Teachers</p>
                 <p className="text-sm font-bold text-ink leading-none">{teachers.length}</p>
               </div>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50">
               <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
               <div>
                 <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Students (5th Sem)</p>
                 <p className="text-sm font-bold text-ink leading-none">{stats.student_count}</p>
               </div>
             </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-sm flex items-center gap-2">
            <Save className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Allocation Table */}
        <div className="bg-surface border border-subtle rounded-[22px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-muted border-b border-subtle">
                  <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">Subject Code</th>
                  <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">Subject Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-ink-muted uppercase tracking-wider">Assigned Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        {subject.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-ink">
                        {subject.name}
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">
                        {subject.credits} Credits
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-ink-muted">
                        {subject.course_type} 
                        {subject.elective_type !== 'NONE' && ` • ${subject.elective_type}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2 min-w-[250px]">
                        <select
                          className="w-full px-3 py-2 rounded-xl bg-surface border border-subtle text-sm text-ink focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 transition-all"
                          value={assignments[subject.id]?.[0] || ""}
                          onChange={(e) => handleAssignmentChange(subject.id, 0, e.target.value)}
                        >
                          <option value="">-- Instructor --</option>
                          {getEligibleTeachers(subject, "INSTRUCTOR").map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.teacher_code} • {teacher.name}
                            </option>
                          ))}
                        </select>
                        {subject.course_type === "PRACTICAL" && [1, 2].map((index) => (
                          <select
                            key={index}
                            className="w-full px-3 py-2 rounded-xl bg-surface border border-subtle text-sm text-ink focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 transition-all"
                            value={assignments[subject.id]?.[index] || ""}
                            onChange={(e) => handleAssignmentChange(subject.id, index, e.target.value)}
                          >
                            <option value="">-- Technical Assistant {index} (optional) --</option>
                            {getEligibleTeachers(subject, "TECHNICAL_ASSISTANT").map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.teacher_code} • {teacher.name}
                              </option>
                            ))}
                          </select>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {subjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-ink-muted">
                      No 5th-semester subjects found for your department.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Action Footer */}
          {subjects.length > 0 && (
            <div className="px-6 py-4 bg-surface-muted border-t border-subtle flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Assignments</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
