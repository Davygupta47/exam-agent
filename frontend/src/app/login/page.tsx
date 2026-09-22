"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, User, AlertCircle, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { fetchApi } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleParam = searchParams.get("role");
  const initialRole =
    roleParam === "faculty" || roleParam === "admin" ? roleParam : "student";

  const [role, setRole] = React.useState<"student" | "faculty" | "admin">(initialRole);
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync role if url query changes
  React.useEffect(() => {
    if (roleParam === "faculty" || roleParam === "admin" || roleParam === "student") {
      setRole(roleParam);
    }
  }, [roleParam]);

  const identifierLabel = "Email Address";

  const identifierPlaceholder =
    role === "student"
      ? "[EMAIL_ADDRESS]"
      : role === "faculty"
        ? "[EMAIL_ADDRESS]"
        : "[EMAIL_ADDRESS]";

  const handleRoleChange = (newRole: "student" | "faculty" | "admin") => {
    setRole(newRole);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please fill in both fields");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        role,
        identifier: identifier.trim(),
        password,
      }),
    });

    setLoading(false);

    if (res.success) {
      // Redirect to appropriate role dashboard
      if (role === "student") {
        router.push("/student");
      } else if (role === "faculty") {
        router.push("/faculty");
      } else {
        router.push("/admin");
      }
    } else {
      setError(res.error || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col lg:flex-row">
      {/* Navy Brand Panel on Left */}
      <div className="lg:w-5/12 sidebar-gradient text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#8C97D6] hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-3.5 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Campus Portal</h1>
              <p className="text-xs text-[#8C97D6]">Heritage Institute of Technology</p>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight mb-4">
            Secure single sign-on for your academic records
          </h2>
          <p className="text-sm text-[#8C97D6] leading-relaxed max-w-sm">
            Sign in using your assigned university credentials to manage your courses, view marks, and access verified schedules.
          </p>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/10 text-xs text-[#8C97D6]">
          <p className="font-medium text-white mb-1">Testing Credentials:</p>
          <p>• Student: aakash.deep.aiml27@heritageit.edu.in / Student@123</p>
          <p>• Faculty (HOD): sujay.saha@heritageit.edu / Teacher@123</p>
          <p>• Admin: basab.chowdhury@heritageit.edu / Admin@123</p>
        </div>
      </div>

      {/* Form Card on Right */}
      <div className="lg:w-7/12 flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        <div className="flex justify-end mb-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md mx-auto">
          {/* Segmented Control */}
          <div className="mb-8">
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-surface-muted border border-subtle">
              <button
                type="button"
                onClick={() => handleRoleChange("student")}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${role === "student"
                  ? "bg-[#0D2185] dark:bg-[#4C66F5] text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
                  }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("faculty")}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${role === "faculty"
                  ? "bg-[#0D2185] dark:bg-[#4C66F5] text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
                  }`}
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("admin")}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${role === "admin"
                  ? "bg-[#0D2185] dark:bg-[#4C66F5] text-white shadow-xs"
                  : "text-ink-muted hover:text-ink"
                  }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Identifier input */}
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                {identifierLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={identifierPlaceholder}
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-subtle text-sm text-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5] transition-all"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-ink">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-4 pr-11 py-3 rounded-xl bg-surface border border-subtle text-sm text-ink placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-ink transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Primary Sign in Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-full text-sm font-semibold bg-[#0D2185] hover:bg-[#0A1A6B] dark:bg-[#4C66F5] dark:hover:bg-[#6178F7] text-white shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          {/* Footer Notice */}
          <div className="mt-8 text-center">
            <p className="text-xs text-ink-muted">
              Accounts are created by your administrator.
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-ink-muted mt-8">
          Campus Examination System • Heritage Institute of Technology
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-page flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
