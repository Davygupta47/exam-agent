"use client";

import * as React from "react";
import { fetchApi } from "@/lib/api";
import { CheckCircle2, AlertCircle, Sparkles, Send } from "lucide-react";

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
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Preference selections
  const [selectedType, setSelectedType] = React.useState<string>("PROFESSIONAL_ELECTIVE_I");
  const [pref1, setPref1] = React.useState<string>("");
  const [pref2, setPref2] = React.useState<string>("");
  const [pref3, setPref3] = React.useState<string>("");

  const loadElectives = React.useCallback(async () => {
    setLoading(true);
    const res = await fetchApi("/student/electives");
    if (res.success && res.availableElectives) {
      setElectives(res.availableElectives);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadElectives();
  }, [loadElectives]);

  // Filter electives by selected category
  const currentOptions = electives.filter((e) => e.elective_type === selectedType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pref1 || !pref2 || !pref3) {
      setMessage({ type: "error", text: "Please select all 3 preferences in order." });
      return;
    }
    if (pref1 === pref2 || pref2 === pref3 || pref1 === pref3) {
      setMessage({ type: "error", text: "Each preference must be a different subject." });
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
      setMessage({ type: "success", text: res.message || "Preferences submitted successfully!" });
      if (onRefresh) onRefresh();
    } else {
      setMessage({ type: "error", text: res.error || "Failed to submit elective choices." });
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-[22px] bg-white dark:bg-[#0F1538] border border-[#E4E8F5] dark:border-[#232C63] animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-[#1A2255] rounded-md mb-4" />
        <div className="h-20 bg-slate-100 dark:bg-[#1A2255] rounded-xl" />
      </div>
    );
  }

  if (electives.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 p-6 rounded-[24px] bg-white dark:bg-[#0F1538] border border-[#E4E8F5] dark:border-[#232C63] soft-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h2 className="text-base font-semibold text-[#0E1330] dark:text-[#EAEDFB] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0D2185] dark:text-[#4C66F5]" />
            Elective Course Selection
          </h2>
          <p className="text-xs text-[#6B7194] dark:text-[#8C95C6] mt-0.5">
            Submit your ordered preferences for Semester {semester} electives.
          </p>
        </div>

        {/* Elective Category Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#1A2255]">
          <button
            type="button"
            onClick={() => { setSelectedType("PROFESSIONAL_ELECTIVE_I"); setMessage(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedType === "PROFESSIONAL_ELECTIVE_I"
                ? "bg-white dark:bg-[#0D2185] text-[#0D2185] dark:text-white shadow-xs"
                : "text-[#6B7194] dark:text-[#8C95C6] hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            PE-I
          </button>
          <button
            type="button"
            onClick={() => { setSelectedType("PROFESSIONAL_ELECTIVE_II"); setMessage(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedType === "PROFESSIONAL_ELECTIVE_II"
                ? "bg-white dark:bg-[#0D2185] text-[#0D2185] dark:text-white shadow-xs"
                : "text-[#6B7194] dark:text-[#8C95C6] hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            PE-II
          </button>
          <button
            type="button"
            onClick={() => { setSelectedType("OPEN_ELECTIVE_I"); setMessage(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedType === "OPEN_ELECTIVE_I"
                ? "bg-white dark:bg-[#0D2185] text-[#0D2185] dark:text-white shadow-xs"
                : "text-[#6B7194] dark:text-[#8C95C6] hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Open Elective
          </button>
        </div>
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
            <label className="block text-xs font-medium text-[#0E1330] dark:text-[#EAEDFB] mb-1.5">
              1st Preference (Primary)
            </label>
            <select
              value={pref1}
              onChange={(e) => setPref1(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1A2255] border border-[#E4E8F5] dark:border-[#232C63] text-xs text-[#0E1330] dark:text-[#EAEDFB] focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
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
            <label className="block text-xs font-medium text-[#0E1330] dark:text-[#EAEDFB] mb-1.5">
              2nd Preference
            </label>
            <select
              value={pref2}
              onChange={(e) => setPref2(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1A2255] border border-[#E4E8F5] dark:border-[#232C63] text-xs text-[#0E1330] dark:text-[#EAEDFB] focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
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
            <label className="block text-xs font-medium text-[#0E1330] dark:text-[#EAEDFB] mb-1.5">
              3rd Preference
            </label>
            <select
              value={pref3}
              onChange={(e) => setPref3(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1A2255] border border-[#E4E8F5] dark:border-[#232C63] text-xs text-[#0E1330] dark:text-[#EAEDFB] focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
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
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-[#0D2185] hover:bg-[#0A1A6B] dark:bg-[#4C66F5] dark:hover:bg-[#6178F7] text-white transition-all disabled:opacity-50 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? "Submitting..." : "Submit Preferences"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
