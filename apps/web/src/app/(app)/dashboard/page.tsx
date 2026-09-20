"use client";

import React from "react";
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
  Building2 
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
  Cell 
} from "recharts";

const MOCK_TREND_DATA = [
  { day: "Mon", totalExposure: 140000, preventable: 95000 },
  { day: "Tue", totalExposure: 180000, preventable: 120000 },
  { day: "Wed", totalExposure: 210000, preventable: 155000 },
  { day: "Thu", totalExposure: 260000, preventable: 195000 },
  { day: "Fri", totalExposure: 310000, preventable: 235000 },
  { day: "Sat", totalExposure: 320000, preventable: 242000 },
  { day: "Sun", totalExposure: 333000, preventable: 249750 },
];

const ROOT_CAUSE_DATA = [
  { name: "DO Re-issuance / Extension", value: 38, color: "#ef4444" },
  { name: "Customs Query / Exam", value: 27, color: "#f59e0b" },
  { name: "Trucker Transporter Delay", value: 20, color: "#3b82f6" },
  { name: "DPD Buffer Overstay", value: 15, color: "#8b5cf6" },
];

export default function DashboardPage() {
  const { selectedClientId, selectedClient, isClientScoped, setSelectedClientId } = useClientScope();
  const { data: metrics, isLoading } = useDashboardMetrics(selectedClientId);

  return (
    <div className="space-y-6">
      {/* Top Banner with Active Client Scope Context */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#1e293b] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
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
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Reset to All Clients
            </button>
          )}
          <Link
            href="/containers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
          >
            <span>View All Containers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Big KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* At Risk Containers */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-2 transition-colors">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Containers At Risk</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
              {isLoading ? "..." : metrics?.atRiskContainers}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-400">
              / {isLoading ? "..." : metrics?.totalContainers} total active
            </span>
          </div>
          <div className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded px-2 py-0.5 font-medium inline-block">
            Immediate operational intervention needed
          </div>
        </div>

        {/* Current Total Exposure */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-2 transition-colors">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Accrued Exposure (INR)</span>
            <TrendingUp className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
            {isLoading ? "..." : formatINR(metrics?.totalExposureINR || 0)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Demurrage + CFS Ground Rent currently running
          </div>
        </div>

        {/* Preventable Exposure */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-2 transition-colors">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Preventable Exposure</span>
            <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-700 dark:text-emerald-400">
            {isLoading ? "..." : formatINR(metrics?.preventableExposureINR || 0)}
          </div>
          <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded px-2 py-0.5 font-medium inline-block">
            75% recoverable via fast-track pickup &amp; DO
          </div>
        </div>

        {/* Client Accounts Managed */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-2 transition-colors">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isClientScoped ? "AEO Level" : "Active Client Accounts"}
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-3xl font-black font-mono text-blue-700 dark:text-blue-400">
            {isLoading ? "..." : isClientScoped ? selectedClient?.aeoStatus : metrics?.activeClientsCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {isClientScoped ? "Extended free-time agreements apply" : "Managed under Apex CHA firm"}
          </div>
        </div>
      </div>

      {/* 2 Charts: Exposure Growth & Root Cause Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 7-day exposure trend */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Exposure Trajectory (Past 7 Days)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tracking cumulative exposure vs. preventable savings potential
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
              INR (₹)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_TREND_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, ""]}
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff", borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="totalExposure" stroke="#e11d48" fillOpacity={1} fill="url(#colorTotal)" name="Total Exposure" />
                <Area type="monotone" dataKey="preventable" stroke="#059669" fillOpacity={1} fill="url(#colorPrev)" name="Preventable" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Root Cause Donut Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Root Cause Breakdown</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Primary operational bottlenecks</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ROOT_CAUSE_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {ROOT_CAUSE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val}%`, "Share"]}
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff", borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {ROOT_CAUSE_DATA.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate max-w-[170px]">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Gateway Terminal & Multimodal Route Feed */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              JNPT NSFT · 16 Boxes
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              Mundra · 7 Boxes
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              MAA · 4 Boxes
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-52 group">
            <img
              src="/images/port-multimodal-tiltshift.jpg"
              alt="Multimodal JNPT Port Terminal Route Flow"
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
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="text-[10px] uppercase font-mono font-bold text-slate-400">DPD 48h Window</div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">22 / 27 Clear</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                5 units currently inside 12-hour escalation buffer
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="text-[10px] uppercase font-mono font-bold text-slate-400">CFS Turnaround</div>
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400">38 mins avg</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Speedy, Ameya &amp; JWR off-dock operational
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="text-[10px] uppercase font-mono font-bold text-slate-400">EDI Gate-Pass</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">100% Synced</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ICEGATE e-Sanchit manifests matched
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 2 Cards: Urgent Alerts & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Alerts */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Urgent Operational Alerts</h3>
            </div>
            <Link href="/alerts" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              View all &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {(metrics?.urgentAlerts || []).map((alert: any) => (
              <div
                key={alert.id}
                className="p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs transition-colors space-y-1"
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
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      alert.severity === "CRITICAL"
                        ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300"
                        : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300">{alert.message}</p>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                  Logged: {formatDate(alert.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Action Tasks */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Pending Action Tasks</h3>
            </div>
            <Link href="/tasks" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Manage tasks &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {(metrics?.recentTasks || []).slice(0, 3).map((task: any) => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="block p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{task.title}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      task.status === "CONFIRMED"
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                        : task.status === "ASSIGNED"
                        ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Container: <strong className="font-mono text-slate-700 dark:text-slate-300">{task.containerNumber}</strong> • {task.clientName}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">
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
