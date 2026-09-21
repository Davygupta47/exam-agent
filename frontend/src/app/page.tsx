"use client";

import * as React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  ArrowRight,
  Sparkles,
  Shield,
  Layers,
  GraduationCap,
  BookOpen,
  Users,
  CheckCircle2,
  Cpu,
  Database,
  Lock,
  ChevronRight,
  Command,
} from "lucide-react";

export default function LandingPage() {
  const [selectedRole, setSelectedRole] = React.useState<"student" | "faculty" | "admin">("student");

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070B1E] text-[#0F172A] dark:text-[#F1F5F9] selection:bg-[#0D2185] selection:text-white dark:selection:bg-[#4C66F5] overflow-x-hidden">
      {/* 1. Apple-style Floating Header */}
      <div className="fixed top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <header className="pointer-events-auto h-14 px-5 rounded-full bg-white/80 dark:bg-[#0E1535]/80 backdrop-blur-xl border border-slate-200/80 dark:border-[#1E2B63] shadow-lg shadow-black/5 flex items-center justify-between gap-6 max-w-4xl w-full">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0D2185] dark:bg-[#4C66F5] flex items-center justify-center text-white shadow-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#0F172A] dark:text-white">
              {siteConfig.name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
            <a href="#macbook-preview" className="hover:text-[#0F172A] dark:hover:text-white transition-colors">
              Experience
            </a>
            <a href="#features" className="hover:text-[#0F172A] dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-[#0F172A] dark:hover:text-white transition-colors">
              Architecture
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#0D2185] hover:bg-[#081454] dark:bg-[#4C66F5] dark:hover:bg-[#6178F7] text-white shadow-xs transition-colors"
            >
              <span>Sign in</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </header>
      </div>

      {/* 2. Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 px-6 max-w-5xl mx-auto text-center relative">
        {/* Subtle top spotlight */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-500/10 via-indigo-500/15 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs text-xs font-medium text-[#0D2185] dark:text-[#8C97D6] mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Heritage Institute of Technology • Exam Portal</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0F172A] dark:text-white leading-[1.1] mb-6 max-w-4xl mx-auto">
            The college operating system. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D2185] via-[#374785] to-[#4C66F5] dark:from-[#8C97D6] dark:via-[#DDE3FF] dark:to-white">
              Engineered for clarity.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            One unified, high-performance platform powering student course selections, faculty assignments, and administrative registries with zero friction.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/login"
              className="flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold bg-[#0D2185] hover:bg-[#081454] dark:bg-[#4C66F5] dark:hover:bg-[#6178F7] text-white shadow-md shadow-blue-900/10 transition-all active:scale-98"
            >
              <span>Enter Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#macbook-preview"
              className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-white dark:bg-[#0E1535] hover:bg-slate-50 dark:hover:bg-[#141D45] text-[#0F172A] dark:text-white border border-slate-200 dark:border-[#1E2B63] shadow-xs transition-colors"
            >
              <span>Explore Preview</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. Centerpiece: Realistic MacBook Pro Hardware Showcase */}
      <section id="macbook-preview" className="pt-4 pb-24 px-4 sm:px-8 max-w-6xl mx-auto">
        {/* Interactive MacBook Role Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 rounded-2xl bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-md shadow-black/5">
            <button
              type="button"
              onClick={() => setSelectedRole("student")}
              className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedRole === "student"
                  ? "bg-[#0D2185] dark:bg-[#4C66F5] text-white shadow-xs"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
              }`}
            >
              Student Workspace
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("faculty")}
              className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedRole === "faculty"
                  ? "bg-[#0D2185] dark:bg-[#4C66F5] text-white shadow-xs"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
              }`}
            >
              Faculty Desk
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole("admin")}
              className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedRole === "admin"
                  ? "bg-[#0D2185] dark:bg-[#4C66F5] text-white shadow-xs"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
              }`}
            >
              Admin Command
            </button>
          </div>
        </div>

        {/* MacBook Pro Display Device Mockup */}
        <div className="relative mx-auto max-w-5xl">
          {/* Ambient device backlight */}
          <div className="absolute -inset-4 bg-gradient-to-b from-blue-500/10 to-indigo-600/10 rounded-[48px] blur-2xl pointer-events-none" />

          {/* Screen Bezel (Matte Black Aluminum) */}
          <div className="relative rounded-[28px] sm:rounded-[36px] bg-[#0A0D14] p-3 sm:p-5 shadow-2xl border-4 border-[#272B35]">
            {/* Top Camera Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-[#0A0D14] rounded-b-xl flex items-center justify-center gap-2 z-30">
              <div className="w-2 h-2 rounded-full bg-[#1A1D24] border border-[#2E3340] flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-blue-400/80" />
              </div>
              <div className="w-1 h-1 rounded-full bg-[#14171E]" />
            </div>

            {/* Inner Screen Display */}
            <div className="relative rounded-[18px] sm:rounded-[24px] bg-[#F8FAFC] dark:bg-[#070B1E] overflow-hidden border border-black/30 aspect-[16/10] flex flex-col select-none">
              {/* macOS-style Glass Menu Bar */}
              <div className="h-7 px-3.5 bg-white/70 dark:bg-[#0E1535]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-[#1E2B63] flex items-center justify-between text-[11px] text-[#0F172A] dark:text-slate-300 z-20">
                <div className="flex items-center gap-3.5">
                  {/* Window dots */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                  </div>
                  <span className="font-semibold text-[10px] sm:text-xs">Campus Portal</span>
                  <span className="hidden sm:inline text-[10px] text-slate-400">File</span>
                  <span className="hidden sm:inline text-[10px] text-slate-400">View</span>
                  <span className="hidden sm:inline text-[10px] text-slate-400">Semester</span>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Heritage IT • 2026</span>
                  <span>100%</span>
                  <span>Thu 9:41 AM</span>
                </div>
              </div>

              {/* Dynamic Screen Content Based on Selected Role */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-left">
                {selectedRole === "student" && (
                  <div className="space-y-4">
                    {/* Welcome banner inside MacBook */}
                    <div className="banner-gradient rounded-[20px] p-5 text-white shadow-md flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-blue-200 font-medium">September 4, 2026</span>
                        <h3 className="text-lg sm:text-xl font-bold mt-0.5">Welcome back, John!</h3>
                        <p className="text-xs text-blue-100/90">Always stay updated in your student portal</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Stat cards inside MacBook */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-[16px] bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Current Semester</span>
                        <p className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white mt-0.5">5th Sem</p>
                        <span className="text-[9px] text-slate-400">2023-2027 Batch</span>
                      </div>
                      <div className="p-3.5 rounded-[16px] bg-white dark:bg-[#0E1535] border-2 border-[#0D2185] dark:border-[#4C66F5] shadow-sm">
                        <span className="text-[10px] text-[#0D2185] dark:text-[#4C66F5] font-semibold">Enrolled Courses</span>
                        <p className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white mt-0.5">6 Subjects</p>
                        <span className="text-[9px] text-slate-400">21.5 Total Credits</span>
                      </div>
                      <div className="p-3.5 rounded-[16px] bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">2nd Year GPA</span>
                        <p className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white mt-0.5">9.08</p>
                        <span className="text-[9px] text-slate-400">Cumulative Grade</span>
                      </div>
                    </div>

                    {/* 2-up Enrolled courses inside MacBook */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#0F172A] dark:text-white">Enrolled Courses</span>
                        <span className="text-[10px] text-[#0D2185] dark:text-[#4C66F5] font-medium">See all</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-[16px] bg-[#EEF4FF] dark:bg-[#162052]/60 border border-[#D7E4FD] dark:border-[#1E2B63] flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-[#0D2185] dark:text-[#8C97D6]">CSE3101</span>
                            <p className="text-xs font-semibold text-[#0D2185] dark:text-white">Database Systems</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">4.0 Credits • Theory</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-[#0D2185] text-white">View</span>
                        </div>
                        <div className="p-3.5 rounded-[16px] bg-[#EEF4FF] dark:bg-[#162052]/60 border border-[#D7E4FD] dark:border-[#1E2B63] flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-[#0D2185] dark:text-[#8C97D6]">AML3144</span>
                            <p className="text-xs font-semibold text-[#0D2185] dark:text-white">OOP Using Java</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">3.0 Credits • Theory</p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-[#0D2185] text-white">View</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRole === "faculty" && (
                  <div className="space-y-4">
                    <div className="banner-gradient rounded-[20px] p-5 text-white shadow-md flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-blue-200 font-medium">Faculty Workspace</span>
                        <h3 className="text-lg sm:text-xl font-bold mt-0.5">Prof. (Dr.) Sujay Saha</h3>
                        <p className="text-xs text-blue-100/90">Head of Department • AIML</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-[16px] bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Assigned Department</span>
                        <p className="text-base font-bold text-[#0F172A] dark:text-white mt-0.5">AIML</p>
                      </div>
                      <div className="p-3.5 rounded-[16px] bg-white dark:bg-[#0E1535] border-2 border-[#0D2185] dark:border-[#4C66F5] shadow-sm">
                        <span className="text-[10px] text-[#0D2185] dark:text-[#4C66F5] font-semibold">Subjects Taught</span>
                        <p className="text-base font-bold text-[#0F172A] dark:text-white mt-0.5">4 Courses</p>
                      </div>
                      <div className="p-3.5 rounded-[16px] bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Students Enrolled</span>
                        <p className="text-base font-bold text-[#0F172A] dark:text-white mt-0.5">129 Students</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-[18px] bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-[10px] font-bold text-[#0D2185] dark:text-[#8C97D6]">AML3101</span>
                          <h4 className="text-xs font-bold text-[#0F172A] dark:text-white">Machine Learning (Theory)</h4>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-[#0D2185] text-white">
                          Upload Marks
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Semester 5 • 65 Enrolled Students • Verified Syllabus
                      </p>
                    </div>
                  </div>
                )}

                {selectedRole === "admin" && (
                  <div className="space-y-4">
                    <div className="banner-gradient rounded-[20px] p-5 text-white shadow-md flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-blue-200 font-medium">Administrator Control</span>
                        <h3 className="text-lg sm:text-xl font-bold mt-0.5">Campus Administration</h3>
                        <p className="text-xs text-blue-100/90">System Registry & Account Provisioning</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-[14px] bg-white dark:bg-[#0E1535] border-2 border-[#0D2185] dark:border-[#4C66F5] shadow-xs text-center">
                        <span className="text-[9px] text-slate-500 dark:text-slate-400">Total Students</span>
                        <p className="text-base font-bold text-[#0F172A] dark:text-white">129</p>
                      </div>
                      <div className="p-3 rounded-[14px] bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs text-center">
                        <span className="text-[9px] text-slate-500 dark:text-slate-400">Total Faculty</span>
                        <p className="text-base font-bold text-[#0F172A] dark:text-white">13</p>
                      </div>
                      <div className="p-3 rounded-[14px] bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs text-center">
                        <span className="text-[9px] text-slate-500 dark:text-slate-400">Departments</span>
                        <p className="text-base font-bold text-[#0F172A] dark:text-white">2</p>
                      </div>
                      <div className="p-3 rounded-[14px] bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs text-center">
                        <span className="text-[9px] text-slate-500 dark:text-slate-400">Total Courses</span>
                        <p className="text-base font-bold text-[#0F172A] dark:text-white">88</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-[16px] bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0F172A] dark:text-white">
                        Registry Access: AIML & Data Science
                      </span>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-[#0D2185] text-white">
                          + Add Student
                        </span>
                        <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-[#141D45] text-[#0F172A] dark:text-white border border-slate-200 dark:border-[#1E2B63]">
                          + Add Teacher
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lower MacBook Base & Chin */}
          <div className="relative mx-auto w-[108%] -left-[4%] h-5 bg-gradient-to-b from-[#C4C9D4] to-[#8C93A0] dark:from-[#2A2E39] dark:to-[#171A21] rounded-b-[20px] shadow-xl border-t border-white/20 flex justify-center">
            {/* Display opening indent */}
            <div className="w-24 h-1.5 bg-[#69707C] dark:bg-[#101318] rounded-b-md" />
          </div>
        </div>
      </section>

      {/* 4. Apple Keynote Style Feature Bento Grid */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0D2185] dark:text-[#4C66F5]">
            Hardware-Grade Engineering
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] dark:text-white mt-2 mb-4">
            Designed for precision, built for scale.
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] dark:text-[#94A3B8]">
            Every interaction is mapped to relational database integrity without artificial layers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-[28px] bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-[#162052] text-[#0D2185] dark:text-[#4C66F5] flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-2">
                Retina Curriculum Clarity
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Mandatory core theory and practical labs are automatically locked and enrolled for active semester terms.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-[#1E2B63]/60 text-xs font-semibold text-[#0D2185] dark:text-[#4C66F5]">
              88 Validated Course Codes →
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-[28px] bg-white dark:bg-[#0E1535] border-2 border-[#0D2185] dark:border-[#4C66F5] shadow-md flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-[#162052] text-[#0D2185] dark:text-[#4C66F5] flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-2">
                Transactional Electives
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                Order preferences for Professional Electives I, II, and Open Electives with transactional database integrity and capacity limits.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-[#1E2B63]/60 text-xs font-semibold text-[#0D2185] dark:text-[#4C66F5]">
              ACID Transactional Guarantees →
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-[28px] bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#122E26] text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-2">
                Silicon-Tight Security
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                HttpOnly encrypted JWT cookies with role verification on every API request. Zero exposure of password hashes.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-[#1E2B63]/60 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Role-Based Access Control →
            </div>
          </div>
        </div>
      </section>

      {/* 5. Architectural Foundation Section */}
      <section id="architecture" className="py-20 px-6 bg-slate-100/70 dark:bg-[#0E1535]/50 border-y border-slate-200 dark:border-[#1E2B63]">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#0D2185] dark:text-[#4C66F5]">
            Built with modern standards
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white mt-2 mb-10">
            Powered by enterprise-grade infrastructure
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs text-left">
              <Database className="w-5 h-5 text-[#0D2185] dark:text-[#4C66F5] mb-2" />
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">PostgreSQL</h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">Normalized schema with enums & indexes</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs text-left">
              <Cpu className="w-5 h-5 text-[#0D2185] dark:text-[#4C66F5] mb-2" />
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">Next.js 16</h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">App router with server components</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs text-left">
              <Layers className="w-5 h-5 text-[#0D2185] dark:text-[#4C66F5] mb-2" />
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">Express & TS</h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">Parameterized SQL with Zod schemas</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs text-left">
              <Lock className="w-5 h-5 text-[#0D2185] dark:text-[#4C66F5] mb-2" />
              <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">HttpOnly Auth</h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">Secure cross-site session verification</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Closing Apple-Style Call to Action */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center">
        <div className="rounded-[32px] banner-gradient p-12 sm:p-16 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Step into your academic workspace.
            </h2>
            <p className="text-sm sm:text-base text-blue-100/90 mb-8 font-normal leading-relaxed">
              Sign in with your roll number, teacher code, or administrator account to get started.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold bg-white text-[#0D2185] hover:bg-blue-50 shadow-lg shadow-black/10 transition-all active:scale-98"
            >
              <span>Sign in to your portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="py-10 px-6 border-t border-slate-200 dark:border-[#1E2B63] text-xs text-[#64748B] dark:text-[#94A3B8] text-center">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {siteConfig.collegeName}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/login?role=student" className="hover:text-[#0F172A] dark:hover:text-white transition-colors">
              Student
            </Link>
            <Link href="/login?role=faculty" className="hover:text-[#0F172A] dark:hover:text-white transition-colors">
              Faculty
            </Link>
            <Link href="/login?role=admin" className="hover:text-[#0F172A] dark:hover:text-white transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
