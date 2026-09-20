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
    <header className="h-16 bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 select-none transition-colors duration-200">
      {/* Left: Org + Client Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 pr-4 border-r border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
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
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search container, BL number, port, or CFS..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Right: Theme toggle, Actions, Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dedicated Dark / Light Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        <Link
          href="/imports/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Import CSV</span>
        </Link>

        <Link
          href="/alerts"
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Operational Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        </Link>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* User avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-xs font-bold">
              {loading ? "…" : initials}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {loading ? "Loading…" : displayName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">{displayRole}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{displayName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.email ?? "demo@demurrageos.app"}</div>
                <div className="mt-1.5 inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded">
                  <User className="w-2.5 h-2.5" />
                  {displayRole}
                </div>
              </div>
              <div className="py-1">
                <Link
                  href="/settings/tariffs"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Tariff &amp; CFS Settings
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); signOut(); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
