"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClientSwitcher } from "./client-switcher";
import { Bell, Upload, Search, LogOut, ChevronDown, User, Sun, Moon } from "lucide-react";
import { MOCK_ORGANIZATION } from "@/lib/api/mock-data";
import { useAuth } from "@/lib/stores/auth-context";
import { useTheme } from "@/lib/stores/theme-context";

export function Header() {
  const { user, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.name ?? "Rohit Mehta";
  const displayOrg = user?.orgName ?? MOCK_ORGANIZATION.name;
  const displayRole = user?.role ?? "ADMIN";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 px-6 flex items-center justify-between sticky top-0 z-30 select-none bg-white/95 dark:bg-[#060c18]/95 border-b border-slate-200 dark:border-white/5 backdrop-blur transition-colors duration-200">
      {/* Left: Brand + Client Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 pr-4 border-r border-slate-200 dark:border-white/10">
          <div
            className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
              boxShadow: "0 0 12px rgba(180,83,9,0.35)",
            }}
          >
            D
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              DemurrageOS
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                CHA
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]">
              {displayOrg}
            </div>
          </div>
        </div>
        <ClientSwitcher />
      </div>

      {/* Middle: Search */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-4">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search container, BL, port, or CFS..."
            className="w-full rounded-lg pl-9 pr-14 py-1.5 text-xs bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-sans"
          />
          {/* ⌘K hint */}
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 bg-white dark:bg-white/5 pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 rounded-lg transition-colors cursor-pointer text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Import CSV — amber branded */}
        <Link
          href="/imports/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
            boxShadow: "0 0 12px rgba(180,83,9,0.3)",
          }}
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Import CSV</span>
        </Link>

        {/* Alert bell with animated ping */}
        <Link
          href="/alerts"
          className="relative p-2 rounded-lg transition-colors text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10"
          title="Operational Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-70" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
          </span>
        </Link>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* User avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <div
              className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold"
              style={{
                background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {loading ? "…" : initials}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {loading ? "Loading…" : displayName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">{displayRole}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hidden lg:block" />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-2xl z-50 overflow-hidden bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/10">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{displayName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {user?.email ?? "demo@demurrageos.app"}
                </div>
                <div className="mt-1.5 inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  <User className="w-2.5 h-2.5" />
                  {displayRole}
                </div>
              </div>
              <div className="py-1">
                <Link
                  href="/settings/tariffs"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Tariff &amp; CFS Settings
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
