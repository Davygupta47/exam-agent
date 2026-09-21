"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatCards } from "@/components/dashboard/stat-cards";
import { CourseCard } from "@/components/dashboard/course-card";
import { InstructorsRail } from "@/components/dashboard/instructors-rail";
import { DailyNotices } from "@/components/dashboard/daily-notices";
import { ElectiveSelector } from "@/components/dashboard/elective-selector";
import { fetchApi } from "@/lib/api";
import { User, Course, FacultySummary, Notice, DashboardStat } from "@/types";

export default function StudentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<any>(null);
  const [stats, setStats] = React.useState<DashboardStat[]>([]);
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [faculty, setFaculty] = React.useState<FacultySummary[]>([]);
  const [notices, setNotices] = React.useState<Notice[]>([]);

  const loadData = React.useCallback(async () => {
    // Check me
    const meRes = await fetchApi("/auth/me");
    if (!meRes.success || !meRes.user) {
      router.push("/login?role=student");
      return;
    }
    if (meRes.user.role !== "student") {
      router.push(`/${meRes.user.role === "super_admin" || meRes.user.role === "admin" ? "admin" : "faculty"}`);
      return;
    }
    setUser(meRes.user);

    // Fetch dashboard
    const dashRes = await fetchApi("/student/dashboard");
    if (dashRes.success && dashRes.data) {
      setProfile(dashRes.data.profile);
      setStats(dashRes.data.stats || []);
      setCourses(dashRes.data.enrolledCourses || []);
      setFaculty(dashRes.data.faculty || []);
      setNotices(dashRes.data.notices || []);
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
          <p className="text-xs text-ink-muted">Loading your student portal...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      user={user}
      role="student"
      subtitle={`${profile?.current_semester || 5}th Semester • ${profile?.department_code || "AIML"}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Welcome Banner matching reference image */}
        <WelcomeBanner
          name={profile?.name || user?.full_name || "Student"}
          subtitle="Always stay updated in your student portal"
        />

        {/* 12-Column Grid Layout matching reference image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main 9-column content */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-8">
            {/* Stat Cards (3-up with middle highlighted) */}
            <StatCards stats={stats} title="Academic Metrics" />

            {/* Enrolled Courses */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-ink">
                  Enrolled Courses
                </h2>
                <span className="text-xs text-ink-muted">
                  {courses.length} Active Subjects
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {courses.map((course, idx) => (
                  <CourseCard key={course.id} course={course} index={idx} />
                ))}
              </div>
            </div>

            {/* Elective Selection Module */}
            <ElectiveSelector
              semester={profile?.current_semester || 5}
              onRefresh={loadData}
            />
          </div>

          {/* Right 3-4 column rail */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-8">
            {/* Course Instructors Avatars */}
            <InstructorsRail faculty={faculty} />

            {/* Daily Notices Panel */}
            <DailyNotices notices={notices} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
