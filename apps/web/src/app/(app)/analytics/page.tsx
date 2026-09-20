"use client";

import React from "react";
import { useClientScope } from "@/lib/stores/client-scope-context";
import { formatINR } from "@/lib/utils";
import {
  BarChart3,
  TrendingDown,
  Zap,
  AlertTriangle,
  Clock,
  Building2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const MONTHLY_EXPOSURE_DATA = [
  { month: "Apr", preventable: 450000, unavoidable: 150000 },
  { month: "May", preventable: 520000, unavoidable: 180000 },
  { month: "Jun", preventable: 390000, unavoidable: 140000 },
  { month: "Jul", preventable: 610000, unavoidable: 210000 },
  { month: "Aug", preventable: 480000, unavoidable: 160000 },
  { month: "Sep", preventable: 340000, unavoidable: 110000 },
];

const CARRIER_VS_CFS = [
  { name: "Carrier Demurrage (Maersk, MSC, CMA)", amount: 173000, color: "#3b82f6" },
  { name: "CFS Ground Rent (Speedy, Sattva, JWC)", amount: 120000, color: "#f59e0b" },
  { name: "Port Terminal Storage", amount: 28000, color: "#8b5cf6" },
  { name: "Internal Shifting Charges", amount: 12000, color: "#ec4899" },
];

const KPI_CARDS = [
  {
    label: "Total Avoidance Potential",
    value: "₹27.9L",
    valueClass: "text-emerald-600 dark:text-emerald-400",
    borderColor: "#10b981",
    icon: TrendingDown,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    desc: "Historical preventable exposure saved in past 6 months",
  },
  {
    label: "Avg DPD Fallback Rate",
    value: "18.4%",
    valueClass: "text-amber-600 dark:text-amber-400",
    borderColor: "#f59e0b",
    icon: AlertTriangle,
    iconClass: "text-amber-600 dark:text-amber-400",
    desc: "Containers missing 48hr window and transferring to CFS",
  },
  {
    label: "DO Turnaround Time",
    value: "1.2 Days",
    valueClass: "text-blue-600 dark:text-blue-400",
    borderColor: "#3b82f6",
    icon: Clock,
    iconClass: "text-blue-600 dark:text-blue-400",
    desc: "Average time between vessel discharge and DO issuance",
  },
];

export default function AnalyticsPage() {
  const { selectedClient, isClientScoped } = useClientScope();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
          Intelligence &amp; Performance
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
          Root Cause &amp; Preventable Exposure Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isClientScoped
            ? `Targeted analytics for ${selectedClient?.name}`
            : "Aggregated CHA demurrage avoidance and root-cause benchmarking across all clients"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl p-5 space-y-2 transition-all duration-200 hover:translate-y-[-2px] bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
              style={{
                borderLeft: `3px solid ${card.borderColor}`,
              }}
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {card.label}
                </span>
                <Icon className={`w-4 h-4 ${card.iconClass}`} />
              </div>
              <div className={`text-2xl font-black font-mono ${card.valueClass}`}>
                {card.value}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{card.desc}</span>
            </div>
          );
        })}
      </div>

      {/* Chart 1: Monthly Bar */}
      <div className="rounded-xl p-6 space-y-4 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Preventable vs. Unavoidable Exposure Trend
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Green represents avoidable charges intercepted via early task assignment &amp; document validation
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_EXPOSURE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tick={{ fill: "#64748b" }} />
              <YAxis stroke="#94a3b8" fontSize={12} tick={{ fill: "#64748b" }} tickFormatter={(v) => `₹${v / 100000}L`} />
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
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#64748b" }}
              />
              <Bar dataKey="preventable" name="Preventable Avoidance" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unavoidable" name="Statutory / Inevitable" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Pie + Legend */}
      <div className="rounded-xl p-6 space-y-4 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="pb-3 border-b border-slate-100 dark:border-white/5">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Current Exposure Composition by Charge Channel
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Comparing carrier discharge clock demurrage vs. post-fallback CFS ground rent
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CARRIER_VS_CFS}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="amount"
                  strokeWidth={0}
                >
                  {CARRIER_VS_CFS.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, "Amount"]}
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
          </div>

          <div className="space-y-2">
            {CARRIER_VS_CFS.map((item) => (
              <div
                key={item.name}
                className="p-3 rounded-lg flex items-center justify-between text-xs transition-colors bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {formatINR(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
