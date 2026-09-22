"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { ComingSoonProvider } from "@/components/ui/coming-soon-modal";
import { User } from "@/types";
import { X } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  user?: User | null;
  role?: "student" | "faculty" | "admin";
  subtitle?: string;
}

export function AppShell({ children, user, role = "student", subtitle }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <ComingSoonProvider>
      <div className="h-screen w-screen overflow-hidden bg-page flex flex-row">
        {/* Fixed Desktop Sidebar (>= 1024px) */}
        <div className="hidden lg:flex flex-shrink-0 h-screen z-30 select-none">
          <Sidebar role={role} user={user} />
        </div>

        {/* Mobile Drawer (< 1024px) */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex-1 max-w-xs w-full flex flex-col z-50">
              <Sidebar role={role} user={user} onCloseMobile={() => setMobileMenuOpen(false)} />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-6 right-2 p-2 rounded-full bg-white/20 text-white"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Independently Scrollable Main Content Area */}
        <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
          <Topbar
            user={user}
            subtitle={subtitle}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />
          <main className="flex-1 px-4 sm:px-8 pb-16 pt-2 sm:pt-4">
            {children}
          </main>
        </div>
      </div>
    </ComingSoonProvider>
  );
}
