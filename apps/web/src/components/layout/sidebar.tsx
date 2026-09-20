"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Container as ContainerIcon,
  Bell,
  CheckSquare,
  FileSpreadsheet,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
    badge: "CHA",
  },
  {
    label: "Containers",
    href: "/containers",
    icon: ContainerIcon,
  },
  {
    label: "Alerts",
    href: "/alerts",
    icon: Bell,
    badge: "2",
    badgeDanger: true,
  },
  {
    label: "Tasks & Handoff",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    label: "CSV Ingestion",
    href: "/imports/new",
    icon: FileSpreadsheet,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
];

const SETTINGS_ITEMS = [
  {
    label: "Tariffs & CFS",
    href: "/settings/tariffs",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between select-none bg-white dark:bg-[#060c18] border-r border-slate-200 dark:border-white/5 transition-colors duration-200">
      <div className="py-5 px-3">
        {/* Brand header */}
        <Link
          href="/landing"
          className="flex items-center gap-3 px-3 mb-7 no-underline group"
        >
          <div
            className="w-8 h-8 rounded-lg text-white flex items-center justify-center font-black text-sm shadow-lg transition-all duration-200 group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
              boxShadow: "0 0 16px rgba(180,83,9,0.4)",
            }}
          >
            D
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-200">
              DemurrageOS
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">CHA Platform v1.2</div>
          </div>
        </Link>

        {/* Nav group: Operational */}
        <div className="px-3 mb-1.5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Operational
          </div>
        </div>
        <hr className="border-slate-200 dark:border-white/5 mx-3 mb-2" />

        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group border-l-2",
                  isActive
                    ? "border-amber-500 text-amber-800 dark:text-white bg-amber-500/10 font-semibold"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-all duration-150",
                      isActive
                        ? "text-amber-600 dark:text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-bold font-mono",
                      item.badgeDanger
                        ? isActive
                          ? "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300"
                          : "bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400"
                        : isActive
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Nav group: Administration */}
        <div className="px-3 mt-6 mb-1.5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Administration
          </div>
        </div>
        <hr className="border-slate-200 dark:border-white/5 mx-3 mb-2" />

        <nav className="space-y-0.5">
          {SETTINGS_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group border-l-2",
                  isActive
                    ? "border-amber-500 text-amber-800 dark:text-white bg-amber-500/10 font-semibold"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-slate-700"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-all duration-150",
                    isActive
                      ? "text-amber-600 dark:text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom sync status */}
      <div className="m-3 p-3 rounded-xl text-xs bg-slate-50 dark:bg-[#040a12] border border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
          {/* Pulsing green dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          JNPT &amp; Mundra Sync Live
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
          EDI free-time countdowns synchronized.
        </div>
      </div>
    </aside>
  );
}
