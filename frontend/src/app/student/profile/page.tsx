"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { fetchApi } from "@/lib/api";
import { User, StudentProfile } from "@/types";
import { Lock, Camera, CheckCircle2, AlertCircle, Save } from "lucide-react";

export default function StudentProfilePage() {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<StudentProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Editable fields state
  const [phone, setPhone] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [address, setAddress] = React.useState("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadProfile = React.useCallback(async () => {
    const meRes = await fetchApi("/auth/me");
    if (!meRes.success || !meRes.user) {
      router.push("/login?role=student");
      return;
    }
    setUser(meRes.user);

    const profileRes = await fetchApi("/student/profile");
    if (profileRes.success && profileRes.profile) {
      setProfile(profileRes.profile);
      setPhone(profileRes.profile.phone || "");
      setBio(profileRes.profile.bio || "");
      setAddress(profileRes.profile.address || "");
    }
    setLoading(false);
  }, [router]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetchApi("/student/profile", {
      method: "PATCH",
      body: JSON.stringify({ phone, bio, address }),
    });

    setSaving(false);
    if (res.success) {
      setMessage({ type: "success", text: "Profile updated successfully." });
    } else {
      setMessage({ type: "error", text: res.error || "Failed to update profile." });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size must be less than 2 MB." });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/me/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      setUploading(false);

      if (data.success && data.avatarUrl) {
        setMessage({ type: "success", text: "Avatar updated successfully." });
        setUser((prev) => (prev ? { ...prev, avatar_url: data.avatarUrl } : null));
        setProfile((prev) => (prev ? { ...prev, photo_url: data.avatarUrl } : null));
      } else {
        setMessage({ type: "error", text: data.error || "Upload failed." });
      }
    } catch (err: any) {
      setUploading(false);
      setMessage({ type: "error", text: "Error uploading avatar." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#0D2185] dark:border-[#4C66F5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell
      user={user}
      role="student"
      subtitle={`${profile?.current_semester || 5}th Semester • Profile Settings`}
    >
      <div className="max-w-4xl mx-auto py-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink tracking-tight">Student Profile</h1>
          <p className="text-sm text-ink-muted">View academic records and update contact information.</p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2.5 mb-6 ${
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

        <div className="bg-surface rounded-[24px] p-6 sm:p-8 border border-subtle soft-shadow mb-8">
          {/* Avatar Header */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-subtle">
            <div className="relative group">
              {profile?.photo_url || user?.avatar_url ? (
                <img
                  src={profile?.photo_url || user?.avatar_url || ""}
                  alt={profile?.name || "Student"}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-[#0D2185] dark:ring-[#4C66F5]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#0D2185] to-[#4C66F5] text-white font-bold text-2xl flex items-center justify-center ring-4 ring-[#0D2185] dark:ring-[#4C66F5]">
                  {profile?.name ? profile.name.slice(0, 2).toUpperCase() : "ST"}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-[#0D2185] text-white hover:bg-[#0A1A6B] shadow-md transition-all"
                title="Upload profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-ink">{profile?.name}</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Roll No: <span className="font-semibold text-ink">{profile?.college_roll_no}</span>
              </p>
              <p className="text-xs text-ink-muted">
                Department: {profile?.department_name} ({profile?.department_code})
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="pt-8 space-y-6">
            {/* Locked Identity Details */}
            <div>
              <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#6B7194]" />
                <span>Verified Academic Credentials (Managed by Administrator)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1A2255]/50 border border-subtle">
                  <label className="block text-[11px] text-ink-muted">College Roll No</label>
                  <p className="text-sm font-semibold text-ink mt-0.5">{profile?.college_roll_no}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1A2255]/50 border border-subtle">
                  <label className="block text-[11px] text-ink-muted">Autonomy Roll No</label>
                  <p className="text-sm font-semibold text-ink mt-0.5">{profile?.autonomy_roll_no}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1A2255]/50 border border-subtle">
                  <label className="block text-[11px] text-ink-muted">Registration No</label>
                  <p className="text-sm font-semibold text-ink mt-0.5">{profile?.registration_no}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1A2255]/50 border border-subtle">
                  <label className="block text-[11px] text-ink-muted">Program & Batch</label>
                  <p className="text-sm font-semibold text-ink mt-0.5">{profile?.program_name} ({profile?.batch_label})</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1A2255]/50 border border-subtle">
                  <label className="block text-[11px] text-ink-muted">Current Semester</label>
                  <p className="text-sm font-semibold text-ink mt-0.5">{profile?.current_semester}th Semester</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1A2255]/50 border border-subtle">
                  <label className="block text-[11px] text-ink-muted">Official Email</label>
                  <p className="text-sm font-semibold text-ink mt-0.5 truncate">{profile?.email}</p>
                </div>
              </div>
            </div>

            {/* Editable Contact Fields */}
            <div className="pt-4 border-t border-subtle">
              <h3 className="text-sm font-semibold text-ink mb-4">Contact Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-subtle text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1.5">Mailing Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="City, State, PIN"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-subtle text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-ink mb-1.5">Short Bio / Interests</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief summary of your academic interests or background..."
                    className="w-full px-4 py-2.5 rounded-xl bg-surface border border-subtle text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[#0D2185] dark:focus:ring-[#4C66F5]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-7 py-3 rounded-full text-xs font-semibold bg-[#0D2185] hover:bg-[#0A1A6B] dark:bg-[#4C66F5] dark:hover:bg-[#6178F7] text-white shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving changes..." : "Save changes"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
