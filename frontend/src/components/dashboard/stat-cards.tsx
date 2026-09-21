"use client";

import * as React from "react";
import { DashboardStat } from "@/types";
import { BookOpen, Layers, Award, Users, Building } from "lucide-react";

interface StatCardsProps {
  stats: DashboardStat[];
  title?: string;
}

export function StatCards({ stats, title = "Overview" }: StatCardsProps) {
  const getIcon = (label: string) => {
    if (label.toLowerCase().includes("course") || label.toLowerCase().includes("subject")) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-[#162052] text-[#0D2185] dark:text-[#8C97D6] border border-blue-100 dark:border-[#1E2B63] flex items-center justify-center mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
      );
    }
    if (label.toLowerCase().includes("gpa") || label.toLowerCase().includes("result") || label.toLowerCase().includes("grade")) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#122E26] text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-[#1A4535] flex items-center justify-center mb-4">
          <Award className="w-6 h-6" />
        </div>
      );
    }
    if (label.toLowerCase().includes("student") || label.toLowerCase().includes("faculty") || label.toLowerCase().includes("teacher")) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-[#251A45] text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-[#382668] flex items-center justify-center mb-4">
          <Users className="w-6 h-6" />
        </div>
      );
    }
    if (label.toLowerCase().includes("department")) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-[#2C2114] text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-[#42311C] flex items-center justify-center mb-4">
          <Building className="w-6 h-6" />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-[#162052] text-indigo-600 dark:text-[#8C97D6] border border-indigo-100 dark:border-[#1E2B63] flex items-center justify-center mb-4">
        <Layers className="w-6 h-6" />
      </div>
    );
  };

  return (
    <div className="mb-8">
      {title && (
        <h2 className="text-base font-bold text-[#0F172A] dark:text-white mb-4">
          {title}
        </h2>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat, idx) => {
          const isSelected = stat.highlight !== undefined ? stat.highlight : idx === 1;

          return (
            <div
              key={stat.label}
              className={`p-6 rounded-[22px] bg-white dark:bg-[#0E1535] transition-all flex flex-col justify-between ${
                isSelected
                  ? "border-2 border-[#0D2185] dark:border-[#4C66F5] shadow-md shadow-blue-900/5"
                  : "border border-slate-200 dark:border-[#1E2B63] shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div>
                {getIcon(stat.label)}
                <p className="text-2xl sm:text-3xl font-bold text-[#0F172A] dark:text-white tracking-tight mb-1">
                  {stat.value}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                  {stat.label}
                </p>
              </div>

              {stat.subtext && (
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-[#1E2B63]/60 flex items-center justify-between">
                  <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                    {stat.subtext}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#0D2185] dark:bg-[#4C66F5]" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
