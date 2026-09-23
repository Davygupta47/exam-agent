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
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
      );
    }
    if (label.toLowerCase().includes("gpa") || label.toLowerCase().includes("result") || label.toLowerCase().includes("grade")) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center mb-4">
          <Award className="w-6 h-6" />
        </div>
      );
    }
    if (label.toLowerCase().includes("student") || label.toLowerCase().includes("faculty") || label.toLowerCase().includes("teacher")) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 flex items-center justify-center mb-4">
          <Users className="w-6 h-6" />
        </div>
      );
    }
    if (label.toLowerCase().includes("department")) {
      return (
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 flex items-center justify-center mb-4">
          <Building className="w-6 h-6" />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center mb-4">
        <Layers className="w-6 h-6" />
      </div>
    );
  };

  return (
    <div className="mb-8">
      {title && (
        <h2 className="text-base font-bold text-ink mb-4">
          {title}
        </h2>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat, idx) => {
          const isSelected = stat.highlight !== undefined ? stat.highlight : idx === 1;

          return (
            <div
              key={stat.label}
              className={`p-6 rounded-[22px] bg-surface border border-subtle transition-all flex flex-col justify-between ${
                isSelected
                  ? "border-2 border-blue-600 dark:border-blue-500 shadow-md shadow-blue-500/10"
                  : "border border-subtle shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div>
                {getIcon(stat.label)}
                <p className="text-2xl sm:text-3xl font-bold text-ink tracking-tight mb-1">
                  {stat.value}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  {stat.label}
                </p>
              </div>

              {stat.subtext && (
                <div className="mt-5 pt-3 border-t border-subtle flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-muted">
                    {stat.subtext}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500" />
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
