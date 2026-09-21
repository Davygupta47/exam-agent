"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatCards } from "@/components/dashboard/stat-cards";
import { fetchApi } from "@/lib/api";
import { User, TeacherProfile, DashboardStat } from "@/types";
import { UploadCloud } from "lucide-react";
import { useComingSoon } from "@/components/ui/coming-soon-modal";

export default function FacultyDashboardPage() {
  const router = useRouter();
  const { showComingSoon } = useComingSoon();
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<TeacherProfile | null>(null);
  const [stats, setStats] = React.useState<DashboardStat[]>([]);
  const [subjects, setSubjects] = React.useState<any[]>([]);

  const loadData = React.useCallback(async () => {
    const meRes = await fetchApi("/auth/me");
    if (!meRes.success || !meRes.user) {
      router.push("/login?role=faculty");
      return;
    }
    if (meRes.user.role === "student") {
      router.push("/student");
      return;
    }
    setUser(meRes.user);

    const dashRes = await fetchApi("/faculty/dashboard");
    if (dashRes.success && dashRes.data) {
      setProfile(dashRes.data.profile);
      setStats(dashRes.data.stats || []);
      setSubjects(dashRes.data.subjectsTaught || []);
    }
    setLoading(false);
  }, [router]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0D2185] dark:border-[#4C66F5] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Loading faculty portal...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      user={user}
      role="faculty"
      subtitle={`${profile?.designation || "Faculty"} • ${profile?.department_code || "AIML"}`}
    >
      <div className="max-w-7xl mx-auto">
        <WelcomeBanner
          name={profile?.name || user?.full_name || "Faculty Member"}
          subtitle="Manage active coursework, schedules, and student assessment"
        />

        <StatCards stats={stats} title="Faculty Teaching Overview" />

        {/* Subjects Taught */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
              Subjects Taught
            </h2>
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Active Semester Courses
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="p-6 rounded-[22px] bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-[#2E3E8C] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-[#162052] text-[#0D2185] dark:text-[#8C97D6] uppercase tracking-wider border border-blue-100 dark:border-[#1E2B63]">
                      {sub.code}
                    </span>
                    <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                      {sub.credits} Credits • {sub.course_type}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white leading-snug">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                    Semester {sub.semester} • {sub.student_count || "0"} Students Enrolled
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-[#1E2B63]/60 mt-4">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Syllabus Verified
                  </span>
                  <button
                    type="button"
                    onClick={() => showComingSoon(`Upload Marks: ${sub.name} (${sub.code})`)}
                    className="flex items-center gap-2 px-6 py-2 rounded-full text-xs font-semibold bg-[#0D2185] hover:bg-[#081454] dark:bg-[#4C66F5] dark:hover:bg-[#6178F7] text-white shadow-xs transition-all active:scale-95"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload marks</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
