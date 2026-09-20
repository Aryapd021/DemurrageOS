"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useDashboardMetrics } from "@/lib/hooks/use-metrics";
import { useClientScope } from "@/lib/stores/client-scope-context";
import { formatINR, formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  CheckSquare,
  Zap,
  Building2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { SkeletonKPICard, SkeletonAlertCard, Skeleton } from "@/components/ui/skeleton";

const TREND_7D = [
  { day: "Mon", totalExposure: 140000, preventable: 95000 },
  { day: "Tue", totalExposure: 180000, preventable: 120000 },
  { day: "Wed", totalExposure: 210000, preventable: 155000 },
  { day: "Thu", totalExposure: 260000, preventable: 195000 },
  { day: "Fri", totalExposure: 310000, preventable: 235000 },
  { day: "Sat", totalExposure: 320000, preventable: 242000 },
  { day: "Sun", totalExposure: 333000, preventable: 249750 },
];

const TREND_30D = [
  { day: "W1", totalExposure: 520000, preventable: 380000 },
  { day: "W2", totalExposure: 690000, preventable: 510000 },
  { day: "W3", totalExposure: 810000, preventable: 620000 },
  { day: "W4", totalExposure: 333000, preventable: 249750 },
];

const TREND_90D = [
  { day: "Apr", totalExposure: 1200000, preventable: 900000 },
  { day: "May", totalExposure: 1500000, preventable: 1100000 },
  { day: "Jun", totalExposure: 980000, preventable: 700000 },
];

const TREND_DATA_MAP: Record<string, typeof TREND_7D> = {
  "7d": TREND_7D,
  "30d": TREND_30D,
  "90d": TREND_90D,
};

const ROOT_CAUSE_DATA = [
  { name: "DO Re-issuance / Extension", value: 38, color: "#ef4444" },
  { name: "Customs Query / Exam", value: 27, color: "#f59e0b" },
  { name: "Trucker Transporter Delay", value: 20, color: "#3b82f6" },
  { name: "DPD Buffer Overstay", value: 15, color: "#8b5cf6" },
];

const CARD_CONFIGS = [
  {
    key: "atRiskContainers",
    label: "Containers At Risk",
    icon: AlertTriangle,
    iconColor: "text-rose-500 dark:text-rose-400",
    accentColor: "#ef4444",
    valueColor: "text-rose-600 dark:text-rose-400",
    tag: "Immediate operational intervention needed",
    tagClass: "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/60 dark:border-rose-900",
    suffix: "",
    isINR: false,
  },
  {
    key: "totalExposureINR",
    label: "Accrued Exposure (INR)",
    icon: TrendingUp,
    iconColor: "text-rose-500 dark:text-rose-400",
    accentColor: "#f43f5e",
    valueColor: "text-slate-900 dark:text-white",
    tag: "Demurrage + CFS Ground Rent running",
    tagClass: "text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800/60 dark:border-slate-700",
    suffix: "",
    isINR: true,
  },
  {
    key: "preventableExposureINR",
    label: "Preventable Exposure",
    icon: Zap,
    iconColor: "text-emerald-500 dark:text-emerald-400",
    accentColor: "#10b981",
    valueColor: "text-emerald-600 dark:text-emerald-400",
    tag: "75% recoverable via fast-track DO",
    tagClass: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-900",
    suffix: "",
    isINR: true,
  },
  {
    key: "activeClientsCount",
    label: "Active Client Accounts",
    icon: ShieldCheck,
    iconColor: "text-blue-500 dark:text-blue-400",
    accentColor: "#3b82f6",
    valueColor: "text-blue-600 dark:text-blue-400",
    tag: "Managed under Apex CHA firm",
    tagClass: "text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800/60 dark:border-slate-700",
    suffix: "",
    isINR: false,
  },
];

export default function DashboardPage() {
  const { selectedClientId, selectedClient, isClientScoped, setSelectedClientId } =
    useClientScope();
  const { data: metrics, isLoading } = useDashboardMetrics(selectedClientId);
  const [trendRange, setTrendRange] = useState<"7d" | "30d" | "90d">("7d");

  const trendData = TREND_DATA_MAP[trendRange];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-colors">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>
              {isClientScoped
                ? `Operational Rollup: ${selectedClient?.name}`
                : "Organization Consolidated Rollup (All Clients)"}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {isClientScoped ? selectedClient?.name : "Demurrage Exposure Overview"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isClientScoped
              ? `Client Code: ${selectedClient?.code} • AEO Status: ${selectedClient?.aeoStatus}`
              : "Unified CHA command center across all managed importer accounts"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isClientScoped && (
            <button
              onClick={() => setSelectedClientId("ALL")}
              className="px-3 py-1.5 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10"
            >
              Reset to All Clients
            </button>
          )}
          <Link
            href="/containers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-white font-semibold text-xs rounded-lg transition-all hover:opacity-90 bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <span>View All Containers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? [...Array(4)].map((_, i) => <SkeletonKPICard key={i} />)
          : CARD_CONFIGS.map((cfg) => {
              const Icon = cfg.icon;
              const rawValue = (metrics as any)?.[cfg.key] ?? 0;
              const displayValue = cfg.isINR
                ? formatINR(rawValue)
                : null;

              return (
                <div
                  key={cfg.key}
                  className="rounded-xl p-5 space-y-3 transition-all duration-200 hover:translate-y-[-2px] bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
                  style={{
                    borderLeft: `3px solid ${cfg.accentColor}`,
                  }}
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {cfg.label}
                    </span>
                    <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                  </div>

                  <div
                    className={`text-3xl font-black font-mono ${cfg.valueColor}`}
                  >
                    {cfg.isINR ? (
                      <span>{displayValue}</span>
                    ) : (
                      <AnimatedCounter value={rawValue} />
                    )}
                  </div>

                  <div
                    className={`text-[11px] px-2 py-0.5 rounded-full border inline-block font-medium ${cfg.tagClass}`}
                  >
                    {cfg.tag}
                  </div>
                </div>
              );
            })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Exposure Trend */}
        <div className="lg:col-span-8 rounded-xl p-5 space-y-4 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Exposure Trajectory</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Cumulative exposure vs. preventable savings
              </p>
            </div>
            <div className="flex items-center gap-1">
              {(["7d", "30d", "90d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTrendRange(r)}
                  className={`text-[11px] font-mono font-semibold px-2 py-1 rounded transition-all cursor-pointer border ${
                    trendRange === r
                      ? "bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-400 border-amber-300 dark:border-amber-500/40"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tick={{ fill: "#64748b" }} />
                <YAxis stroke="#94a3b8" fontSize={11} tick={{ fill: "#64748b" }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, ""]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    borderRadius: 10,
                    fontSize: 12,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                  }}
                />
                <Area type="monotone" dataKey="totalExposure" stroke="#e11d48" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total Exposure" />
                <Area type="monotone" dataKey="preventable" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorPrev)" name="Preventable" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="w-3 h-0.5 bg-rose-500 rounded-full inline-block" />
              Total Exposure
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="w-3 h-0.5 bg-emerald-500 rounded-full inline-block" />
              Preventable
            </div>
          </div>
        </div>

        {/* Right: Root Cause Donut */}
        <div className="lg:col-span-4 rounded-xl p-5 space-y-4 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <div className="pb-3 border-b border-slate-100 dark:border-white/5">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Root Cause Breakdown</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Primary operational bottlenecks</p>
          </div>

          <div className="relative h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ROOT_CAUSE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {ROOT_CAUSE_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val}%`, "Share"]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">38%</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">Top cause</div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            {ROOT_CAUSE_DATA.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate max-w-[160px]">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Port Telemetry */}
      <div className="rounded-xl p-5 space-y-4 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Active Indian Port Telemetry &amp; DPD Gate Clearance
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live terminal feeder telemetry and highway clearance status
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-semibold">
              JNPT NSFT · 16 Boxes
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Mundra · 7 Boxes
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              MAA · 4 Boxes
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-52 group">
            <img
              src="/images/port-multimodal-tiltshift.jpg"
              alt="Multimodal JNPT Port Terminal"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                JNPT Nhava Sheva Terminal 3
              </span>
              <span className="text-amber-300 font-bold">DPD Express Open</span>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {[
              {
                label: "DPD 48h Window",
                value: "22 / 27 Clear",
                valueClass: "text-emerald-600 dark:text-emerald-400",
                desc: "5 units inside 12-hour escalation buffer",
              },
              {
                label: "CFS Turnaround",
                value: "38 mins avg",
                valueClass: "text-blue-600 dark:text-blue-400",
                desc: "Speedy, Ameya & JWR off-dock operational",
              },
              {
                label: "EDI Gate-Pass",
                value: "100% Synced",
                valueClass: "text-slate-900 dark:text-white font-mono",
                desc: "ICEGATE e-Sanchit manifests matched",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-3 rounded-lg space-y-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5"
              >
                <div className="text-[10px] uppercase font-mono font-bold text-slate-500 dark:text-slate-400">
                  {stat.label}
                </div>
                <div className={`text-sm font-bold ${stat.valueClass}`}>{stat.value}</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Alerts + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Alerts */}
        <div className="rounded-xl p-5 space-y-3 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Urgent Operational Alerts</h3>
            </div>
            <Link href="/alerts" className="text-xs text-amber-600 dark:text-amber-500 font-semibold hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
              View all →
            </Link>
          </div>

          <div className="space-y-2.5">
            {isLoading
              ? [...Array(3)].map((_, i) => <SkeletonAlertCard key={i} />)
              : (metrics?.urgentAlerts || []).map((alert: any) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg text-xs space-y-1 transition-all duration-200 hover:translate-x-0.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {alert.containerNumber}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                          ({alert.clientName})
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                          alert.severity === "CRITICAL"
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{alert.message}</p>
                    <div className="text-[10px] text-slate-500 dark:text-slate-500 pt-0.5">
                      Logged: {formatDate(alert.timestamp)}
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Priority Tasks */}
        <div className="rounded-xl p-5 space-y-3 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Pending Action Tasks</h3>
            </div>
            <Link href="/tasks" className="text-xs text-amber-600 dark:text-amber-500 font-semibold hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
              Manage tasks →
            </Link>
          </div>

          <div className="space-y-2.5">
            {isLoading
              ? [...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))
              : (metrics?.recentTasks || []).slice(0, 3).map((task: any) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block p-3 rounded-lg text-xs space-y-1 transition-all duration-200 hover:translate-x-0.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{task.title}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                          task.status === "CONFIRMED"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                            : task.status === "ASSIGNED"
                            ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Container:{" "}
                      <strong className="font-mono text-slate-700 dark:text-slate-300">{task.containerNumber}</strong>{" "}
                      • {task.clientName}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Assignee: {task.assigneeName || "Unassigned"} ({task.assigneeType})
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
