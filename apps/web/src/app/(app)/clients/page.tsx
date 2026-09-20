"use client";

import React from "react";
import Link from "next/link";
import { useClientScope } from "@/lib/stores/client-scope-context";
import { formatINR } from "@/lib/utils";
import {
  Building2,
  ShieldCheck,
  Container as ContainerIcon,
  AlertCircle,
  ArrowRight,
  Mail,
  Phone,
} from "lucide-react";

export default function ClientsDirectoryPage() {
  const { clients, setSelectedClientId } = useClientScope();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
            Client Directory
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            Managed Client Importers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Accounts under CHA management • Scoped operational access and exposure tracking
          </p>
        </div>
      </div>

      {/* Grid of Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {clients.map((client) => {
          const hasCritical = client.criticalRiskCount > 0;

          return (
            <div
              key={client.id}
              className="rounded-xl p-6 space-y-4 transition-all duration-200 hover:translate-y-[-2px] bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
              style={
                hasCritical
                  ? { borderLeft: "3px solid #ef4444" }
                  : { borderLeft: "3px solid #3b82f6" }
              }
            >
              {/* Top: Code + Name + Exposure */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {client.code}
                    </span>
                    {client.aeoStatus !== "NONE" && (
                      <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {client.aeoStatus}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {client.name}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                    Total Exposure
                  </span>
                  <span
                    className={`text-lg font-black font-mono ${
                      client.totalExposureINR > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {formatINR(client.totalExposureINR)}
                  </span>
                </div>
              </div>

              {/* Metrics bar */}
              <div className="grid grid-cols-2 gap-3 py-3 text-xs border-t border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <ContainerIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Active Containers</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">
                      {client.activeContainersCount} containers
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AlertCircle
                    className={`w-4 h-4 ${hasCritical ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}
                  />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Critical Alerts</span>
                    <strong
                      className={`font-bold ${hasCritical ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}
                    >
                      {client.criticalRiskCount} at risk
                    </strong>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={() => setSelectedClientId(client.id)}
                  className="flex-1 py-2 px-3 font-semibold text-xs rounded-lg transition-all cursor-pointer bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                >
                  Switch Scope to {client.name.split(" ")[0]}
                </button>

                <Link
                  href={`/clients/${client.id}`}
                  className="py-2 px-3 font-semibold text-xs rounded-lg transition-all flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
