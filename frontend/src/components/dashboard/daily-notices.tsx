"use client";

import * as React from "react";
import { Notice } from "@/types";
import { useComingSoon } from "@/components/ui/coming-soon-modal";

interface DailyNoticesProps {
  notices: Notice[];
}

export function DailyNotices({ notices }: DailyNoticesProps) {
  const { showComingSoon } = useComingSoon();

  const sampleNotices: Notice[] = [
    {
      id: 1,
      title: "Prelim payment due",
      body: "Form fill-up for regular examination has opened. Clear dues before the closing date.",
      category: "ACTION_REQUIRED",
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Exam schedule released",
      body: "Theory and practical examination routine for 5th semester is now verified by the controller.",
      category: "INFORMATION",
      is_read: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  const items = notices && notices.length > 0 ? notices : sampleNotices;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
          Daily notice
        </h2>
        <button
          type="button"
          onClick={() => showComingSoon("All Campus Notices")}
          className="text-xs font-semibold text-[#0D2185] dark:text-[#4C66F5] hover:underline"
        >
          See all
        </button>
      </div>

      <div className="p-5 rounded-[22px] bg-white dark:bg-[#0E1535] border border-slate-200 dark:border-[#1E2B63] shadow-xs divide-y divide-slate-100 dark:divide-[#1E2B63]/60">
        {items.map((notice, idx) => (
          <div key={notice.id} className={`${idx === 0 ? "pb-4" : "pt-4"}`}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                {notice.title}
              </h3>
              {!notice.is_read && (
                <span className="w-2 h-2 rounded-full bg-[#0D2185] dark:bg-[#4C66F5] mt-1.5 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] line-clamp-2 mt-1 mb-2.5 leading-relaxed">
              {notice.body}
            </p>
            <button
              type="button"
              onClick={() => showComingSoon(`Notice Details: ${notice.title}`)}
              className="text-xs font-semibold text-[#0D2185] dark:text-[#4C66F5] hover:underline"
            >
              See more
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
