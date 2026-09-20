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
  Building2 
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
  Cell 
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

export default function AnalyticsPage() {
  const { selectedClient, isClientScoped } = useClientScope();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
          Intelligence & Performance
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Root Cause & Preventable Exposure Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {isClientScoped
            ? `Targeted analytics for ${selectedClient?.name}`
            : "Aggregated CHA demurrage avoidance and root-cause benchmarking across all clients"}
        </p>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Avoidance Potential</span>
            <TrendingDown className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600">
            ₹27.9L
          </div>
          <span className="text-[11px] text-slate-500">
            Historical preventable exposure saved in past 6 months
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg DPD Fallback Rate</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600">
            18.4%
          </div>
          <span className="text-[11px] text-slate-500">
            Containers missing 48hr window and transferring to CFS
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">DO Turnaround Time</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-600">
            1.2 Days
          </div>
          <span className="text-[11px] text-slate-500">
            Average time between vessel discharge and DO issuance
          </span>
        </div>
      </div>

      {/* Chart 1: Monthly Preventable vs Unavoidable */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Preventable vs. Unavoidable Exposure Trend
            </h3>
            <p className="text-[11px] text-slate-500">
              Green represents avoidable charges intercepted via early task assignment & document validation
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_EXPOSURE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `₹${val / 100000}L`} />
              <Tooltip
                formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, ""]}
                contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff", borderRadius: 8, fontSize: 12 }}
              />
              <Legend />
              <Bar dataKey="preventable" name="Preventable Avoidance" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unavoidable" name="Statutory / Inevitable" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Carrier Demurrage vs CFS Ground Rent */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm">
            Current Exposure Composition by Charge Channel
          </h3>
          <p className="text-[11px] text-slate-500">
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
                  paddingAngle={5}
                  dataKey="amount"
                >
                  {CARRIER_VS_CFS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, "Amount"]}
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff", borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {CARRIER_VS_CFS.map((item) => (
              <div
                key={item.name}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-slate-800">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-slate-900">
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
