"use client";

import * as React from "react";
import { fetchApi } from "@/lib/api";
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Clock,
  Trophy,
} from "lucide-react";

interface ElectiveOption {
  id: number;
  code: string;
  name: string;
  credits: number;
  course_type: string;
  elective_type: string;
  capacity?: number;
  enrolled_count?: string;
}

interface ElectiveWindow {
  id: number;
  opens_at: string;
  closes_at: string;
  status: string; // OPEN | CLOSED | ALLOCATED
}

interface AllocationResult {
  elective_type: string;
  preference_rank: number;
  subject_code: string;
  subject_name: string;
  credits: number;
}

export function ElectiveSelector({
  semester = 5,
  onRefresh,
}: {
  semester?: number;
  onRefresh?: () => void;
}) {
  const [electives, setElectives] = React.useState<ElectiveOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [electiveWindow, setElectiveWindow] =
    React.useState<ElectiveWindow | null>(null);
  const [allocations, setAllocations] = React.useState<AllocationResult[]>([]);
  const [timeRemaining, setTimeRemaining] = React.useState<number>(0);

  // Preference selections
  const [selectedType, setSelectedType] = React.useState<string>(
    "PROFESSIONAL_ELECTIVE_I"
  );
  const [pref1, setPref1] = React.useState<string>("");
  const [pref2, setPref2] = React.useState<string>("");
  const [pref3, setPref3] = React.useState<string>("");

  const loadElectives = React.useCallback(async () => {
    setLoading(true);
    const res = await fetchApi("/student/electives");
    if (res.success) {
      setElectives(res.availableElectives || []);
      setElectiveWindow(res.electiveWindow || null);
      setAllocations(res.allocations || []);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadElectives();
  }, [loadElectives]);

  // Countdown timer
  React.useEffect(() => {
    if (!electiveWindow || electiveWindow.status !== "OPEN") {
      setTimeRemaining(0);
      return;
    }

    const update = () => {
      const closes = new Date(electiveWindow.closes_at).getTime();
      const now = Date.now();
      const remaining = Math.max(0, closes - now);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        // Window just closed — reload to get fresh state
        loadElectives();
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [electiveWindow, loadElectives]);

  // Filter electives by selected category
  const currentOptions = electives.filter(
    (e) => e.elective_type === selectedType
  );

  // Window state helpers
  const isWindowOpen = electiveWindow?.status === "OPEN" && timeRemaining > 0;
  /*
  [isAllocated] ei ta remove kora karon akhon amra direct allocate korchi. future ei ta abar revert kore dite hobe.
  */

  //const isAllocated = electiveWindow?.status === "ALLOCATED";
  const hasAllocations = allocations.length > 0;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pref1 || !pref2 || !pref3) {
      setMessage({
        type: "error",
        text: "Please select all 3 preferences in order.",
      });
      return;
    }
    if (pref1 === pref2 || pref2 === pref3 || pref1 === pref3) {
      setMessage({
        type: "error",
        text: "Each preference must be a different subject.",
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const res = await fetchApi("/student/electives", {
      method: "POST",
      body: JSON.stringify({
        semester,
        elective_type: selectedType,
        pref_1_id: parseInt(pref1, 10),
        pref_2_id: parseInt(pref2, 10),
        pref_3_id: parseInt(pref3, 10),
      }),
    });

    setSubmitting(false);

    if (res.success) {
      setMessage({
        type: "success",
        text:
          res.message ||
          "Preferences recorded! Allocation will happen after the deadline.",
      });
      if (onRefresh) onRefresh();
    } else {
      setMessage({
        type: "error",
        text: res.error || "Failed to submit elective choices.",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-[22px] bg-surface border border-subtle animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md mb-4" />
        <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (electives.length === 0) {
    return null;
  }

  // ── Allocation Results View ──
  if (hasAllocations) {
    return (
      <div className="mt-8 p-6 rounded-[24px] bg-surface border border-subtle soft-shadow">
        <div className="flex items-center gap-2 mb-5">
          <Trophy className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base font-semibold text-ink">
            Elective Allocation Results
          </h2>
        </div>

        <div className="space-y-3">
          {allocations.map((alloc, idx) => {
            const prefLabel =
              alloc.preference_rank === 1
                ? "1st Preference"
                : alloc.preference_rank === 2
                ? "2nd Preference"
                : "3rd Preference";
            const prefColor =
              alloc.preference_rank === 1
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : alloc.preference_rank === 2
                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";

            return (
              <div key={idx} className={`p-4 rounded-xl border ${prefColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      {alloc.subject_code} — {alloc.subject_name}
                    </p>
                    <p className="text-xs mt-0.5 opacity-80">
                      {alloc.elective_type.replace(/_/g, " ")} • {alloc.credits}{" "}
                      Credits
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/60 dark:bg-black/20">
                    {prefLabel} ✓
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 rounded-[24px] bg-surface border border-subtle soft-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Elective Course Selection
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Submit your ordered preferences for Semester {semester} electives.
          </p>
        </div>

        {/* Countdown Timer */}
        {isWindowOpen && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {formatTime(timeRemaining)}
            </span>
            <span className="text-xs text-ink-muted">
              remaining
            </span>
          </div>
        )}

        {/* Window Closed Message */}
        {electiveWindow && electiveWindow.status === "CLOSED" && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              Window closed — Allocation in progress...
            </span>
          </div>
        )}

        {!electiveWindow && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-subtle">
            <Clock className="w-4 h-4 text-ink-muted" />
            <span className="text-xs font-medium text-ink-muted">
              No elective window is currently open
            </span>
          </div>
        )}
      </div>

      {/* Elective Category Switcher */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-muted border border-subtle mb-5 w-fit">
        <button
          type="button"
          onClick={() => {
            setSelectedType("PROFESSIONAL_ELECTIVE_I");
            setMessage(null);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedType === "PROFESSIONAL_ELECTIVE_I"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          PE-I
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedType("PROFESSIONAL_ELECTIVE_II");
            setMessage(null);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedType === "PROFESSIONAL_ELECTIVE_II"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          PE-II
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedType("OPEN_ELECTIVE_I");
            setMessage(null);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedType === "OPEN_ELECTIVE_I"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          Open Elective
        </button>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 mb-5 ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Preference 1 */}
          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              1st Preference (Primary)
            </label>
            <select
              value={pref1}
              onChange={(e) => setPref1(e.target.value)}
              required
              disabled={!isWindowOpen}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Choose 1st choice...</option>
              {currentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.code} — {opt.name} ({opt.credits} cr)
                </option>
              ))}
            </select>
          </div>

          {/* Preference 2 */}
          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              2nd Preference
            </label>
            <select
              value={pref2}
              onChange={(e) => setPref2(e.target.value)}
              required
              disabled={!isWindowOpen}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Choose 2nd choice...</option>
              {currentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.code} — {opt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preference 3 */}
          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              3rd Preference
            </label>
            <select
              value={pref3}
              onChange={(e) => setPref3(e.target.value)}
              required
              disabled={!isWindowOpen}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-subtle text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Choose 3rd choice...</option>
              {currentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.code} — {opt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting || !isWindowOpen}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? "Submitting..." : "Submit Preferences"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
