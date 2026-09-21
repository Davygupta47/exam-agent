"use client";

import * as React from "react";
import { FacultySummary } from "@/types";
import * as Tooltip from "@radix-ui/react-tooltip";

interface InstructorsRailProps {
  faculty: FacultySummary[];
}

export function InstructorsRail({ faculty }: InstructorsRailProps) {
  if (!faculty || faculty.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-[#0E1330] dark:text-[#EAEDFB] mb-4">
        Course instructors
      </h2>

      <Tooltip.Provider delayDuration={100}>
        <div className="flex items-center gap-3 overflow-x-auto py-2">
          {faculty.slice(0, 5).map((f) => {
            const initials = f.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <Tooltip.Root key={f.id}>
                <Tooltip.Trigger asChild>
                  <div className="relative group cursor-pointer">
                    {f.photo_url ? (
                      <img
                        src={f.photo_url}
                        alt={f.name}
                        className="w-13 h-13 rounded-full object-cover ring-2 ring-[#0D2185] dark:ring-[#4C66F5] ring-offset-2 ring-offset-[#F3F5FC] dark:ring-offset-[#070B22] transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-full bg-gradient-to-br from-[#0D2185] to-[#4C66F5] text-white font-semibold text-xs flex items-center justify-center ring-2 ring-[#0D2185] dark:ring-[#4C66F5] ring-offset-2 ring-offset-[#F3F5FC] dark:ring-offset-[#070B22] transition-transform group-hover:scale-105 shadow-sm">
                        {initials}
                      </div>
                    )}
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="z-50 px-3 py-2 text-xs rounded-xl bg-[#0E1330] text-white shadow-xl max-w-xs animate-in fade-in zoom-in-95"
                    sideOffset={6}
                  >
                    <p className="font-semibold text-white">{f.name}</p>
                    <p className="text-[11px] text-blue-200">{f.designation}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{f.department_name}</p>
                    <Tooltip.Arrow className="fill-[#0E1330]" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          })}
        </div>
      </Tooltip.Provider>
    </div>
  );
}
