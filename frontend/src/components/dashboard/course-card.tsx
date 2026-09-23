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
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs border border-blue-100 dark:border-blue-900/50">
          <Database className="w-7 h-7" />
        </div>
      );
    }
    if (name.includes("program") || name.includes("java") || name.includes("compiler")) {
      return (
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs border border-indigo-100 dark:border-indigo-900/50">
          <Laptop className="w-7 h-7" />
        </div>
      );
    }
    if (name.includes("machine") || name.includes("learning") || name.includes("ai")) {
      return (
        <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xs border border-purple-100 dark:border-purple-900/50">
          <Cpu className="w-7 h-7" />
        </div>
      );
    }
    return (
      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xs border border-slate-200 dark:border-slate-700">
        <BarChart2 className="w-7 h-7" />
      </div>
    );
  };

  return (
    <div className="p-6 rounded-[22px] bg-surface border border-subtle shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col justify-between">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 uppercase tracking-wider border border-blue-100 dark:border-blue-900/50">
              {course.code}
            </span>
            <span className="text-xs font-medium text-ink-muted">
              {course.credits} Credits
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-ink leading-snug">
            {course.name}
          </h3>
          <p className="text-xs text-ink-muted mt-1 capitalize">
            {course.course_type.toLowerCase()} • {course.elective_type === "COMPULSORY" ? "Compulsory" : "Elective"}
          </p>
        </div>

        <div className="flex-shrink-0">
          {getCardIcon()}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-subtle">
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Enrolled & Active
        </span>
        <button
          type="button"
          onClick={() => showComingSoon(`Course Details: ${course.name}`)}
          className="px-6 py-2 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-xs transition-all active:scale-95"
        >
          View
        </button>
      </div>
    </div>
  );
}
