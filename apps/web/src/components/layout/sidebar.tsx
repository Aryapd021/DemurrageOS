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
  HelpCircle,
  FileText
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
    <aside className="w-60 bg-[#090e1b] text-slate-300 flex flex-col justify-between border-r border-[#1e293b] shrink-0 select-none">
      <div className="py-5 px-3">
        {/* Brand header */}
        <Link href="/landing" className="flex items-center gap-2.5 px-3 mb-6 no-underline group">
          <div className="w-7 h-7 rounded-md bg-[#b45309] text-white flex items-center justify-center font-black text-xs shadow">
            D
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors">
              DemurrageOS
            </div>
            <div className="text-[10px] text-slate-500 font-mono">CHA Platform v1.2</div>
          </div>
        </Link>

        <div className="px-3 mb-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Operational Modules
          </div>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                  isActive
                    ? "bg-[#b45309] text-white font-semibold shadow"
                    : "text-slate-400 hover:text-white hover:bg-[#151f33]"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-bold font-mono",
                      isActive
                        ? "bg-[#78350f] text-white"
                        : "bg-[#151f33] text-slate-400 group-hover:text-slate-200"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 mt-6 mb-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Administration
          </div>
        </div>

        <nav className="space-y-1">
          {SETTINGS_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                  isActive
                    ? "bg-[#b45309] text-white font-semibold shadow"
                    : "text-slate-400 hover:text-white hover:bg-[#151f33]"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom info banner */}
      <div className="p-3 m-3 bg-[#0d1527] rounded-lg border border-[#1e293b] text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>JNPT &amp; Mundra Sync Live</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1">
          EDI free-time countdowns synchronized.
        </div>
      </div>
    </aside>
  );
}
