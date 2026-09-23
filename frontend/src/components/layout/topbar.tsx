"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Bell, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useComingSoon } from "@/components/ui/coming-soon-modal";
import { User } from "@/types";

interface TopbarProps {
  user?: User | null;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
}

export function Topbar({ user, subtitle, onOpenMobileMenu }: TopbarProps) {
  const { showComingSoon } = useComingSoon();
  const [searchTerm, setSearchTerm] = React.useState("");

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <header className="h-24 px-6 sm:px-8 flex items-center justify-between gap-6 w-full flex-shrink-0">
      {/* Mobile Menu Button (< 1024px) */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="lg:hidden p-2 rounded-xl text-ink-muted hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Search Pill */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-surface border border-subtle text-sm text-ink placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3.5">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => showComingSoon("Notifications Center")}
          className="relative p-2.5 rounded-full bg-surface border border-subtle text-ink-muted hover:text-ink hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* User Avatar & Name */}
        <Link
          href={`/${user?.role === "teacher" || user?.role === "hod" ? "faculty" : user?.role === "super_admin" || user?.role === "admin" ? "admin" : "student"}/profile`}
          className="flex items-center gap-3 pl-2 pr-3 py-1 rounded-full bg-surface border border-subtle hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-600 dark:ring-blue-500"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-blue-600 dark:ring-blue-500">
              {initials}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <h2 className="text-sm font-bold text-ink leading-tight">
              {user?.full_name || "User"}
            </h2>
            <p className="text-xs text-ink-muted">
              {subtitle || (user?.role ? user.role.toUpperCase() : "Member")}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
