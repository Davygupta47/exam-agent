"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatCards } from "@/components/dashboard/stat-cards";
import { fetchApi } from "@/lib/api";
import { User, DashboardStat } from "@/types";
import {
  UserPlus,
  GraduationCap,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Clock,
  Download,
  Play,
  Sparkles,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<User | null>(null);
  const [stats, setStats] = React.useState<DashboardStat[]>([]);

  // Tab: students or teachers
  const [activeTab, setActiveTab] = React.useState<"students" | "teachers">("students");

  // Students state
  const [students, setStudents] = React.useState<any[]>([]);
  const [studentSearch, setStudentSearch] = React.useState("");
  const [studentPage, setStudentPage] = React.useState(1);
  const [studentTotalPages, setStudentTotalPages] = React.useState(1);

  // Teachers state
  const [teachers, setTeachers] = React.useState<any[]>([]);
  const [teacherSearch, setTeacherSearch] = React.useState("");
  const [teacherPage, setTeacherPage] = React.useState(1);
  const [teacherTotalPages, setTeacherTotalPages] = React.useState(1);

  // Slide-over states
  const [showAddStudent, setShowAddStudent] = React.useState(false);
  const [showAddTeacher, setShowAddTeacher] = React.useState(false);
  const [departments, setDepartments] = React.useState<any[]>([]);

  // Generated temporary credentials modal
  const [createdCredential, setCreatedCredential] = React.useState<{
    title: string;
    identifier: string;
    tempPass: string;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Add Student Form State
  const [newStudent, setNewStudent] = React.useState({
    name: "",
    college_roll_no: "",
    autonomy_roll_no: "",
    registration_no: "",
    email: "",
    department_id: "1",
    current_semester: 5,
    second_year_gpa: "",
  });

  // Add Teacher Form State
  const [newTeacher, setNewTeacher] = React.useState({
    name: "",
    teacher_code: "",
    email: "",
    department_id: "1",
    designation: "Assistant Professor",
    initials: "",
  });

  const [formError, setFormError] = React.useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = React.useState(false);

  // Elective Management state
  const [electiveWindow, setElectiveWindow] = React.useState<any>(null);
  const [electiveSubmitted, setElectiveSubmitted] = React.useState(0);
  const [electiveTotal, setElectiveTotal] = React.useState(0);
  const [electiveAllocated, setElectiveAllocated] = React.useState(0);
  const [electiveTimeRemaining, setElectiveTimeRemaining] = React.useState(0);
  const [electiveLoading, setElectiveLoading] = React.useState(false);
  const [electiveMsg, setElectiveMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = React.useCallback(async () => {
    const meRes = await fetchApi("/auth/me");
    if (!meRes.success || !meRes.user) {
      router.push("/login?role=admin");
      return;
    }
    setUser(meRes.user);

    const dashRes = await fetchApi("/admin/dashboard");
    if (dashRes.success) {
      setStats(dashRes.stats || []);
    }

    const deptsRes = await fetchApi("/admin/departments");
    if (deptsRes.success && deptsRes.departments) {
      setDepartments(deptsRes.departments);
    }

    setLoading(false);
  }, [router]);

  const loadElectiveStatus = React.useCallback(async () => {
    const res = await fetchApi("/admin/electives/window-status?semester=5");
    if (res.success) {
      setElectiveWindow(res.window);
      setElectiveSubmitted(res.submittedCount || 0);
      setElectiveTotal(res.totalStudents || 0);
      setElectiveAllocated(res.allocatedCount || 0);
    }
  }, []);

  const loadStudents = React.useCallback(async () => {
    const res = await fetchApi(
      `/admin/students?page=${studentPage}&limit=10&search=${encodeURIComponent(studentSearch)}`
    );
    if (res.success && res.students) {
      setStudents(res.students);
      setStudentTotalPages(res.pagination.totalPages || 1);
    }
  }, [studentPage, studentSearch]);

  const loadTeachers = React.useCallback(async () => {
    const res = await fetchApi(
      `/admin/teachers?page=${teacherPage}&limit=10&search=${encodeURIComponent(teacherSearch)}`
    );
    if (res.success && res.teachers) {
      setTeachers(res.teachers);
      setTeacherTotalPages(res.pagination.totalPages || 1);
    }
  }, [teacherPage, teacherSearch]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  React.useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  React.useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  React.useEffect(() => {
    loadElectiveStatus();
  }, [loadElectiveStatus]);

  // Elective countdown timer
  React.useEffect(() => {
    if (!electiveWindow || electiveWindow.status !== "OPEN") {
      setElectiveTimeRemaining(0);
      return;
    }
    const update = () => {
      const closes = new Date(electiveWindow.closes_at).getTime();
      const remaining = Math.max(0, closes - Date.now());
      setElectiveTimeRemaining(remaining);
      if (remaining <= 0) loadElectiveStatus();
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [electiveWindow, loadElectiveStatus]);

  // Elective polling when window is open
  React.useEffect(() => {
    if (!electiveWindow || electiveWindow.status !== "OPEN") return;
    const poll = setInterval(loadElectiveStatus, 10000); // poll every 10s
    return () => clearInterval(poll);
  }, [electiveWindow, loadElectiveStatus]);

  const handleOpenWindow = async () => {
    setElectiveLoading(true);
    setElectiveMsg(null);
    const res = await fetchApi("/admin/electives/open-window", {
      method: "POST",
      body: JSON.stringify({ semester: 5 }),
    });
    setElectiveLoading(false);
    if (res.success) {
      setElectiveMsg({ type: "success", text: res.message || "Window opened!" });
      loadElectiveStatus();
    } else {
      setElectiveMsg({ type: "error", text: res.error || "Failed to open window" });
    }
  };

  const handleRunAllocation = async () => {
    setElectiveLoading(true);
    setElectiveMsg(null);
    const res = await fetchApi("/admin/electives/run-allocation", {
      method: "POST",
      body: JSON.stringify({ semester: 5 }),
    });
    setElectiveLoading(false);
    if (res.success) {
      setElectiveMsg({ type: "success", text: "Allocation completed! CSV generated." });
      loadElectiveStatus();
    } else {
      setElectiveMsg({ type: "error", text: res.error || "Allocation failed" });
    }
  };

  const handleDownloadCSV = () => {
    window.open("/api/admin/electives/export-csv?semester=5", "_blank");
  };

  const formatElectiveTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const res = await fetchApi("/admin/students", {
      method: "POST",
      body: JSON.stringify({
        ...newStudent,
        department_id: parseInt(newStudent.department_id, 10),
        current_semester: parseInt(newStudent.current_semester.toString(), 10),
        second_year_gpa: newStudent.second_year_gpa ? parseFloat(newStudent.second_year_gpa) : null,
      }),
    });

    setFormSubmitting(false);

    if (res.success) {
      setShowAddStudent(false);
      setCreatedCredential({
        title: "Student Account Created",
        identifier: `Roll No: ${newStudent.college_roll_no}`,
        tempPass: res.tempPassword,
      });
      setNewStudent({
        name: "",
        college_roll_no: "",
        autonomy_roll_no: "",
        registration_no: "",
        email: "",
        department_id: "1",
        current_semester: 5,
        second_year_gpa: "",
      });
      loadStudents();
      loadData();
    } else {
      setFormError(res.error || "Failed to create student.");
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    const res = await fetchApi("/admin/teachers", {
      method: "POST",
      body: JSON.stringify({
        ...newTeacher,
        department_id: parseInt(newTeacher.department_id, 10),
      }),
    });

    setFormSubmitting(false);

    if (res.success) {
      setShowAddTeacher(false);
      setCreatedCredential({
        title: "Faculty Account Created",
        identifier: `Code: ${newTeacher.teacher_code}`,
        tempPass: res.tempPassword,
      });
      setNewTeacher({
        name: "",
        teacher_code: "",
        email: "",
        department_id: "1",
        designation: "Assistant Professor",
        initials: "",
      });
      loadTeachers();
      loadData();
    } else {
      setFormError(res.error || "Failed to create faculty member.");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#0D2185] dark:border-[#4C66F5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell user={user} role="admin" subtitle="System Administrator">
      <div className="max-w-7xl mx-auto">
        <WelcomeBanner
          name={user?.full_name || "Administrator"}
          subtitle="Manage campus registry, provision accounts, and oversee enrollment"
        />

        <StatCards stats={stats} title="System Overview & Totals" />

        {/* ─── Elective Management Panel ─── */}
        <div className="mb-8 p-6 rounded-[24px] bg-white dark:bg-[#0F1538] border border-[#E4E8F5] dark:border-[#232C63] soft-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0D2185] dark:text-[#4C66F5]" />
              <h2 className="text-base font-semibold text-[#0E1330] dark:text-[#EAEDFB]">
                Elective Allocation Management
              </h2>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                TEST MODE
              </span>
            </div>

            {/* Live countdown */}
            {electiveWindow?.status === "OPEN" && electiveTimeRemaining > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#0D2185]/10 to-[#4C66F5]/10 dark:from-[#4C66F5]/20 dark:to-[#6178F7]/20 border border-[#0D2185]/20 dark:border-[#4C66F5]/30">
                <Clock className="w-4 h-4 text-[#0D2185] dark:text-[#4C66F5] animate-pulse" />
                <span className="text-sm font-bold text-[#0D2185] dark:text-[#4C66F5] tabular-nums">
                  {formatElectiveTime(electiveTimeRemaining)}
                </span>
                <span className="text-xs text-[#6B7194] dark:text-[#8C95C6]">remaining</span>
              </div>
            )}
          </div>

          {electiveMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 mb-4 ${
              electiveMsg.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
            }`}>
              {electiveMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{electiveMsg.text}</span>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A2255] border border-[#E4E8F5] dark:border-[#232C63]">
              <p className="text-[11px] font-medium text-[#6B7194] dark:text-[#8C95C6] mb-1">Window Status</p>
              <p className="text-sm font-bold text-[#0E1330] dark:text-[#EAEDFB]">
                {electiveWindow?.status === "OPEN" ? "🟢 Open" : electiveWindow?.status === "ALLOCATED" ? "✅ Allocated" : electiveWindow?.status === "CLOSED" ? "🟡 Closed" : "⚪ Not Started"}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A2255] border border-[#E4E8F5] dark:border-[#232C63]">
              <p className="text-[11px] font-medium text-[#6B7194] dark:text-[#8C95C6] mb-1">Preferences Submitted</p>
              <p className="text-sm font-bold text-[#0E1330] dark:text-[#EAEDFB]">
                {electiveSubmitted} <span className="text-xs font-normal text-[#6B7194]">/ {electiveTotal} students</span>
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A2255] border border-[#E4E8F5] dark:border-[#232C63]">
              <p className="text-[11px] font-medium text-[#6B7194] dark:text-[#8C95C6] mb-1">Students Allocated</p>
              <p className="text-sm font-bold text-[#0E1330] dark:text-[#EAEDFB]">{electiveAllocated}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleOpenWindow}
              disabled={electiveLoading || electiveWindow?.status === "OPEN"}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0D2185] hover:bg-[#0A1A6B] dark:bg-[#4C66F5] dark:hover:bg-[#6178F7] text-white shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Open 5-min Window</span>
            </button>

            <button
              type="button"
              onClick={handleRunAllocation}
              disabled={electiveLoading || (!electiveWindow || electiveWindow.status === "ALLOCATED")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Allocation Now</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              disabled={electiveWindow?.status !== "ALLOCATED"}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-white dark:bg-[#1A2255] hover:bg-slate-50 dark:hover:bg-[#232C63] border border-[#E4E8F5] dark:border-[#232C63] text-[#0E1330] dark:text-[#EAEDFB] shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download test.csv</span>
            </button>
          </div>
        </div>

        {/* Action Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="inline-flex p-1 rounded-2xl bg-surface border border-subtle">
            <button
              type="button"
              onClick={() => setActiveTab("students")}
              className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "students"
                  ? "bg-[#0D2185] dark:bg-[#4C66F5] text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Students Directory
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("teachers")}
              className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "teachers"
                  ? "bg-[#0D2185] dark:bg-[#4C66F5] text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Faculty Directory
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setShowAddStudent(true); setFormError(null); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0D2185] hover:bg-[#0A1A6B] dark:bg-[#4C66F5] dark:hover:bg-[#6178F7] text-white shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add student</span>
            </button>
            <button
              type="button"
              onClick={() => { setShowAddTeacher(true); setFormError(null); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-white dark:bg-[#0F1538] hover:bg-slate-50 dark:hover:bg-[#1A2255] border border-subtle text-ink shadow-xs transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Add teacher</span>
            </button>
          </div>
        </div>

        {/* Students Table Tab */}
        {activeTab === "students" && (
          <div className="bg-surface rounded-[24px] border border-subtle soft-shadow overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
                  placeholder="Search students by name or roll..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#1A2255] border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              <span className="text-xs text-ink-muted">
                Page {studentPage} of {studentTotalPages}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-subtle bg-slate-50/50 dark:bg-[#1A2255]/30 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                    <th className="py-3.5 px-6">Name</th>
                    <th className="py-3.5 px-6">Roll Numbers</th>
                    <th className="py-3.5 px-6">Department</th>
                    <th className="py-3.5 px-6">Semester</th>
                    <th className="py-3.5 px-6">GPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle text-xs text-ink">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1A2255]/20 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-ink">{s.name}</div>
                        <div className="text-[11px] text-ink-muted">{s.email}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-medium text-ink">{s.college_roll_no}</div>
                        <div className="text-[11px] text-ink-muted">Autonomy: {s.autonomy_roll_no}</div>
                      </td>
                      <td className="py-3.5 px-6">{s.department_code}</td>
                      <td className="py-3.5 px-6">{s.current_semester}th Sem</td>
                      <td className="py-3.5 px-6 font-semibold text-ink">{s.second_year_gpa || "N/A"}</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-ink-muted">
                        No students found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-subtle flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                disabled={studentPage === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-slate-100 dark:hover:bg-[#1A2255] disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                onClick={() => setStudentPage((p) => Math.min(studentTotalPages, p + 1))}
                disabled={studentPage === studentTotalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-slate-100 dark:hover:bg-[#1A2255] disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Teachers Table Tab */}
        {activeTab === "teachers" && (
          <div className="bg-surface rounded-[24px] border border-subtle soft-shadow overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => { setTeacherSearch(e.target.value); setTeacherPage(1); }}
                  placeholder="Search faculty by name or code..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#1A2255] border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              <span className="text-xs text-ink-muted">
                Page {teacherPage} of {teacherTotalPages}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-subtle bg-slate-50/50 dark:bg-[#1A2255]/30 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                    <th className="py-3.5 px-6">Faculty Name</th>
                    <th className="py-3.5 px-6">Teacher Code</th>
                    <th className="py-3.5 px-6">Department</th>
                    <th className="py-3.5 px-6">Designation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle text-xs text-ink">
                  {teachers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1A2255]/20 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-ink">{t.name}</div>
                        <div className="text-[11px] text-ink-muted">{t.email}</div>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-ink">{t.teacher_code}</td>
                      <td className="py-3.5 px-6">{t.department_code}</td>
                      <td className="py-3.5 px-6">{t.designation}</td>
                    </tr>
                  ))}
                  {teachers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-xs text-ink-muted">
                        No faculty found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-subtle flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTeacherPage((p) => Math.max(1, p - 1))}
                disabled={teacherPage === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-slate-100 dark:hover:bg-[#1A2255] disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                onClick={() => setTeacherPage((p) => Math.min(teacherTotalPages, p + 1))}
                disabled={teacherPage === teacherTotalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-slate-100 dark:hover:bg-[#1A2255] disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Slide-over: Add Student */}
        {showAddStudent && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowAddStudent(false)} />
            <div className="relative w-full max-w-lg bg-surface h-full shadow-2xl p-6 sm:p-8 overflow-y-auto z-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-subtle mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Add New Student</h2>
                    <p className="text-xs text-ink-muted">Creates student and provisions login account.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddStudent(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-ink"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form id="student-form" onSubmit={handleCreateStudent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      placeholder="e.g. Suman Sengupta"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-ink mb-1">College Roll No</label>
                      <input
                        type="text"
                        required
                        value={newStudent.college_roll_no}
                        onChange={(e) => setNewStudent({ ...newStudent, college_roll_no: e.target.value })}
                        placeholder="e.g. 2310018150"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink mb-1">Autonomy Roll No</label>
                      <input
                        type="text"
                        required
                        value={newStudent.autonomy_roll_no}
                        onChange={(e) => setNewStudent({ ...newStudent, autonomy_roll_no: e.target.value })}
                        placeholder="e.g. 12623018150"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Registration No</label>
                    <input
                      type="text"
                      required
                      value={newStudent.registration_no}
                      onChange={(e) => setNewStudent({ ...newStudent, registration_no: e.target.value })}
                      placeholder="e.g. Reg_12623018150"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                      placeholder="student@heritageit.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-ink mb-1">Department</label>
                      <select
                        value={newStudent.department_id}
                        onChange={(e) => setNewStudent({ ...newStudent, department_id: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-surface-muted border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-ink mb-1">Semester</label>
                      <input
                        type="number"
                        min={1}
                        max={8}
                        value={newStudent.current_semester}
                        onChange={(e) => setNewStudent({ ...newStudent, current_semester: parseInt(e.target.value, 10) || 5 })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">2nd Year GPA (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      max={10}
                      value={newStudent.second_year_gpa}
                      onChange={(e) => setNewStudent({ ...newStudent, second_year_gpa: e.target.value })}
                      placeholder="e.g. 8.75"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                    />
                  </div>
                </form>
              </div>

              <div className="pt-6 border-t border-subtle flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="student-form"
                  disabled={formSubmitting}
                  className="px-7 py-2.5 rounded-full text-xs font-semibold bg-[#0D2185] hover:bg-[#0A1A6B] dark:bg-[#4C66F5] text-white disabled:opacity-50"
                >
                  {formSubmitting ? "Creating..." : "Save Student"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Slide-over: Add Teacher */}
        {showAddTeacher && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowAddTeacher(false)} />
            <div className="relative w-full max-w-lg bg-surface h-full shadow-2xl p-6 sm:p-8 overflow-y-auto z-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-subtle mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Add Faculty Member</h2>
                    <p className="text-xs text-ink-muted">Creates faculty record and login credentials.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddTeacher(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-ink"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form id="teacher-form" onSubmit={handleCreateTeacher} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newTeacher.name}
                      onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                      placeholder="e.g. Prof. Arpita Roy"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-ink mb-1">Teacher Code</label>
                      <input
                        type="text"
                        required
                        value={newTeacher.teacher_code}
                        onChange={(e) => setNewTeacher({ ...newTeacher, teacher_code: e.target.value })}
                        placeholder="e.g. AIML10"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink mb-1">Initials</label>
                      <input
                        type="text"
                        value={newTeacher.initials}
                        onChange={(e) => setNewTeacher({ ...newTeacher, initials: e.target.value })}
                        placeholder="e.g. AR"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={newTeacher.email}
                      onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                      placeholder="arpita.roy@heritageit.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Department</label>
                    <select
                      value={newTeacher.department_id}
                      onChange={(e) => setNewTeacher({ ...newTeacher, department_id: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-muted border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Designation</label>
                    <input
                      type="text"
                      required
                      value={newTeacher.designation}
                      onChange={(e) => setNewTeacher({ ...newTeacher, designation: e.target.value })}
                      placeholder="Assistant Professor"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-muted border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                    />
                  </div>
                </form>
              </div>

              <div className="pt-6 border-t border-subtle flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddTeacher(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="teacher-form"
                  disabled={formSubmitting}
                  className="px-7 py-2.5 rounded-full text-xs font-semibold bg-[#0D2185] hover:bg-[#0A1A6B] dark:bg-[#4C66F5] text-white disabled:opacity-50"
                >
                  {formSubmitting ? "Creating..." : "Save Faculty"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Temporary Credentials Display Modal */}
        {createdCredential && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
            <div className="relative w-full max-w-md bg-surface rounded-[24px] p-6 border border-subtle shadow-2xl z-50 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-ink mb-1">{createdCredential.title}</h3>
              <p className="text-xs text-ink-muted mb-6">
                Share this temporary password with the user. It will not be shown again.
              </p>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A2255] border border-subtle text-left mb-6 space-y-2">
                <div>
                  <span className="text-[11px] text-ink-muted">Identifier</span>
                  <p className="text-xs font-semibold text-ink">{createdCredential.identifier}</p>
                </div>
                <div>
                  <span className="text-[11px] text-ink-muted">Temporary Password</span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <code className="text-sm font-bold text-[#0D2185] dark:text-[#4C66F5] bg-white dark:bg-[#0F1538] px-2.5 py-1 rounded-md border border-subtle select-all">
                      {createdCredential.tempPass}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(createdCredential.tempPass)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-ink hover:bg-slate-200 dark:hover:bg-[#232C63] transition-colors"
                      title="Copy password"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCreatedCredential(null)}
                className="w-full py-2.5 rounded-full text-xs font-semibold bg-[#0D2185] hover:bg-[#0A1A6B] dark:bg-[#4C66F5] text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
