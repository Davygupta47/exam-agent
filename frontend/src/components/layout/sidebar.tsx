"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  FileSignature,
  BookOpen,
  FileX,
  Award,
  Bell,
  Calendar,
  LogOut,
  GraduationCap,
  Users,
  UserCheck,
  User,
  Settings,
  Upload,
} from "lucide-react";
import { useComingSoon } from "@/components/ui/coming-soon-modal";
import { fetchApi } from "@/lib/api";
import { User as UserType } from "@/types";

interface SidebarProps {
  role?: "student" | "faculty" | "admin";
  user?: UserType | null;
  onCloseMobile?: () => void;
}

export function Sidebar({ role = "student", user, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { showComingSoon } = useComingSoon();

  const handleLogout = async () => {
    await fetchApi("/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const studentNavItems = [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard, isReal: true },
    { label: "Profile", href: "/student/profile", icon: User, isReal: true },
    { label: "Payment Info", icon: CreditCard, isReal: false },
    { label: "Registration", icon: FileSignature, isReal: false },
    { label: "Courses", icon: BookOpen, isReal: false },
    { label: "Drop Semester", icon: FileX, isReal: false },
    { label: "Result", icon: Award, isReal: false },
    { label: "Notice", icon: Bell, isReal: false },
    { label: "Schedule", icon: Calendar, isReal: false },
  ];

  const facultyNavItems = [
    { label: "Dashboard", href: "/faculty", icon: LayoutDashboard, isReal: true },
    { label: "Profile", href: "/faculty/profile", icon: User, isReal: true },
    ...(user?.designation === 'HOD' ? [
      { label: "Teacher Allocation", href: "/faculty/teacher-allocation", icon: Users, isReal: true },
    ] : []),
    { label: "Schedule", icon: Calendar, isReal: false },
    { label: "Course Notices", icon: Bell, isReal: false },
    { label: "Upload Answers", icon: Upload, isReal: false },
  ];

  const adminNavItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard, isReal: true },
    { label: "Profile", href: "/admin/profile", icon: User, isReal: true },
    { label: "System Logs", icon: Settings, isReal: false },
  ];

  const navItems =
    role === "faculty"
      ? facultyNavItems
      : role === "admin"
        ? adminNavItems
        : studentNavItems;

  return (
    <aside className="w-64 h-[calc(100vh-2rem)] my-4 ml-4 rounded-[28px] bg-surface border border-subtle text-ink flex flex-col justify-between p-6 soft-shadow flex-shrink-0 select-none overflow-hidden">
      {/* Top Logo */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-3 px-2 py-3 mb-4 flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            {/* Logo mark matching reference: graduation cap */}
            <svg
              className="w-7 h-7 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight text-ink">
              Campus Portal
            </h1>
            <p className="text-xs text-ink-muted capitalize">{role} Portal</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 overflow-y-auto pr-1 flex-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isReal && item.href && pathname === item.href;

            if (item.isReal && item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${isActive
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                      : "text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-ink-muted"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => showComingSoon(item.label)}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all text-left"
              >
                <Icon className="w-5 h-5 text-ink-muted" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Button Pinned to Bottom */}
      <div className="pt-4 border-t border-subtle">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium text-ink-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
        >
          <LogOut className="w-5 h-5 text-ink-muted group-hover:text-red-600" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
