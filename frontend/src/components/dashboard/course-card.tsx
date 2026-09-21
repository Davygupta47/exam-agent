"use client";

import * as React from "react";
import { Course } from "@/types";
import { Laptop, BarChart2, Database, Cpu } from "lucide-react";
import { useComingSoon } from "@/components/ui/coming-soon-modal";

interface CourseCardProps {
  course: Course;
  index?: number;
}

export function CourseCard({ course }: CourseCardProps) {
  const { showComingSoon } = useComingSoon();

  const getCardIcon = () => {
    const code = (course.code || "").toUpperCase();
    const name = (course.name || "").toLowerCase();

    if (name.includes("database") || code.includes("CSE3101") || code.includes("CSE3151")) {
      return (
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-[#162052] flex items-center justify-center text-[#0D2185] dark:text-[#8C97D6] shadow-xs border border-blue-100 dark:border-[#1E2B63]">
          <Database className="w-7 h-7" />
        </div>
      );
    }
    if (name.includes("program") || name.includes("java") || name.includes("compiler")) {
      return (
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-[#162052] flex items-center justify-center text-[#0D2185] dark:text-[#8C97D6] shadow-xs border border-indigo-100 dark:border-[#1E2B63]">
          <Laptop className="w-7 h-7" />
        </div>
      );
    }
    if (name.includes("machine") || name.includes("learning") || name.includes("ai")) {
      return (
        <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-[#162052] flex items-center justify-center text-[#0D2185] dark:text-[#8C97D6] shadow-xs border border-purple-100 dark:border-[#1E2B63]">
          <Cpu className="w-7 h-7" />
        </div>
      );
    }
    return (
      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-[#162052] flex items-center justify-center text-[#0D2185] dark:text-[#8C97D6] shadow-xs border border-slate-200 dark:border-[#1E2B63]">
        <BarChart2 className="w-7 h-7" />
      </div>
    );
  };

  return (
    <div className="p-6 rounded-[22px] bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-[#2E3E8C] transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-[#162052] text-[#0D2185] dark:text-[#8C97D6] uppercase tracking-wider border border-blue-100 dark:border-[#1E2B63]">
              {course.code}
            </span>
            <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
              {course.credits} Credits
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white leading-snug">
            {course.name}
          </h3>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 capitalize">
            {course.course_type.toLowerCase()} • {course.elective_type === "COMPULSORY" ? "Compulsory" : "Elective"}
          </p>
        </div>

        <div className="flex-shrink-0">
          {getCardIcon()}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1E2B63]/60">
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Enrolled & Active
        </span>
        <button
          type="button"
          onClick={() => showComingSoon(`Course Details: ${course.name}`)}
          className="px-6 py-2 rounded-full text-xs font-semibold bg-[#0D2185] hover:bg-[#081454] dark:bg-[#4C66F5] dark:hover:bg-[#6178F7] text-white shadow-xs transition-all active:scale-95"
        >
          View
        </button>
      </div>
    </div>
  );
}
