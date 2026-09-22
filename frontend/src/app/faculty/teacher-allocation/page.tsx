"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { fetchApi } from "@/lib/api";
import { User, TeacherProfile } from "@/types";
import { Save, AlertCircle, Users, BookOpen } from "lucide-react";
import { useComingSoon } from "@/components/ui/coming-soon-modal";

interface Teacher {
  id: number;
  name: string;
  initials?: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  credits: number;
  course_type: string;
  elective_type: string;
}

export default function TeacherAllocationPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [stats, setStats] = React.useState({ student_count: 0 });
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [assignments, setAssignments] = React.useState<Record<number, number>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      const meRes = await fetchApi("/auth/me");
      if (!meRes.success || !meRes.user) {
        router.push("/login?role=faculty");
        return;
      }
      
      // Prevent non-HOD from accessing
      // Note: role could be 'hod' or 'teacher' depending on how the backend mapped it.
      // But we can check if the API calls succeed. We'll rely on the backend `requireRole(['hod'])`
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

      const currentAssignments: Record<number, number> = {};
      (assignmentsRes.data || []).forEach((a: any) => {
        currentAssignments[a.subject_id] = a.teacher_id;
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

  const handleAssignmentChange = (subjectId: number, teacherId: string) => {
    setAssignments(prev => ({
      ...prev,
      [subjectId]: parseInt(teacherId, 10),
    }));
    setError(null);
    setSuccessMsg(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      assignments: Object.entries(assignments)
        .filter(([_, teacherId]) => teacherId && !isNaN(teacherId))
        .map(([subjectId, teacherId]) => ({
          subject_id: parseInt(subjectId, 10),
          teacher_id: teacherId,
        })),
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
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0D2185] dark:border-[#4C66F5] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Loading teacher allocation...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell user={user} role="faculty" subtitle="HOD Portal • Teacher Allocation">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white dark:bg-[#0E1535] p-6 rounded-[22px] border border-slate-200 dark:border-[#1E2B63] shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white tracking-tight mb-2">
              Teacher Allocation
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-2xl">
              Assign departmental faculty to 5th-semester subjects. Assignments are used for timetable generation and marks uploading.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-[#162052] rounded-xl border border-blue-100 dark:border-[#1E2B63]">
               <Users className="w-4 h-4 text-[#0D2185] dark:text-[#8C97D6]" />
               <div>
                 <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-bold uppercase tracking-wider">Teachers</p>
                 <p className="text-sm font-bold text-[#0F172A] dark:text-white leading-none">{teachers.length}</p>
               </div>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-[#162052] rounded-xl border border-blue-100 dark:border-[#1E2B63]">
               <BookOpen className="w-4 h-4 text-[#0D2185] dark:text-[#8C97D6]" />
               <div>
                 <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-bold uppercase tracking-wider">Students (5th Sem)</p>
                 <p className="text-sm font-bold text-[#0F172A] dark:text-white leading-none">{stats.student_count}</p>
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
        <div className="bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] rounded-[22px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#162052] border-b border-slate-200 dark:border-[#1E2B63]">
                  <th className="px-6 py-4 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Subject Code</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Subject Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">Assigned Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1E2B63]/60">
                {subjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-slate-50/50 dark:hover:bg-[#162052]/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-[#1C254A] text-[#0D2185] dark:text-[#8C97D6] uppercase tracking-wider">
                        {subject.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-[#0F172A] dark:text-white">
                        {subject.name}
                      </div>
                      <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                        {subject.credits} Credits
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8]">
                        {subject.course_type} 
                        {subject.elective_type !== 'NONE' && ` • ${subject.elective_type}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className="w-full min-w-[200px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#162052] border border-slate-200 dark:border-[#1E2B63] text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0D2185] transition-all"
                        value={assignments[subject.id] || ""}
                        onChange={(e) => handleAssignmentChange(subject.id, e.target.value)}
                      >
                        <option value="">-- Unassigned --</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} {t.initials ? `(${t.initials})` : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {subjects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
                      No 5th-semester subjects found for your department.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Action Footer */}
          {subjects.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 dark:bg-[#162052] border-t border-slate-200 dark:border-[#1E2B63] flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold bg-[#0D2185] hover:bg-[#0A1A6B] dark:bg-[#4C66F5] dark:hover:bg-[#6178F7] text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
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
