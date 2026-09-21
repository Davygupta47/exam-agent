"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { fetchApi } from "@/lib/api";
import { User } from "@/types";
import { ShieldCheck, UserCheck, KeyRound } from "lucide-react";

export default function AdminProfilePage() {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const meRes = await fetchApi("/auth/me");
      if (!meRes.success || !meRes.user) {
        router.push("/login?role=admin");
        return;
      }
      setUser(meRes.user);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#0D2185] dark:border-[#4C66F5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell user={user} role="admin" subtitle="System Administrator Profile">
      <div className="max-w-4xl mx-auto py-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink tracking-tight">Admin Profile</h1>
          <p className="text-sm text-ink-muted">System administration credentials and access level.</p>
        </div>

        <div className="bg-surface rounded-[24px] p-6 sm:p-8 border border-subtle soft-shadow space-y-6">
          <div className="flex items-center gap-5 pb-6 border-b border-subtle">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#0D2185] to-[#4C66F5] text-white flex items-center justify-center text-2xl font-bold ring-4 ring-[#0D2185] dark:ring-[#4C66F5]">
              AD
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">{user?.full_name || "System Administrator"}</h2>
              <p className="text-xs text-ink-muted mt-0.5">Primary Super Administrator</p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold mt-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Full Access Permissions</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A2255]/50 border border-subtle">
              <span className="text-[11px] text-ink-muted">Account Email</span>
              <p className="text-sm font-semibold text-ink mt-0.5">{user?.email}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A2255]/50 border border-subtle">
              <span className="text-[11px] text-ink-muted">Assigned Role</span>
              <p className="text-sm font-semibold text-ink mt-0.5 capitalize">{user?.role}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A2255]/50 border border-subtle">
              <span className="text-[11px] text-ink-muted">Security Scope</span>
              <p className="text-sm font-semibold text-ink mt-0.5">Campus Tenant & Examinations</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A2255]/50 border border-subtle">
              <span className="text-[11px] text-ink-muted">Authentication Mode</span>
              <p className="text-sm font-semibold text-ink mt-0.5">JWT HttpOnly Secure Cookie</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
