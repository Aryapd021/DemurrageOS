"use client";

import React from "react";
import Link from "next/link";
import { useDashboardMetrics } from "@/lib/hooks/use-metrics";
import { useClientScope } from "@/lib/stores/client-scope-context";
import { formatDate } from "@/lib/utils";
import {
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { SkeletonAlertCard } from "@/components/ui/skeleton";

export default function AlertsPage() {
  const { selectedClientId, isClientScoped } = useClientScope();
  const { data: metrics, isLoading } = useDashboardMetrics(selectedClientId);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
          Early Warning Engine
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
          Operational Alerts &amp; Deduplication
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Real-time triggers on expiring free time, DPD fallbacks, and customs documentation queries
        </p>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => <SkeletonAlertCard key={i} />)
        ) : metrics?.urgentAlerts.length === 0 ? (
          <div className="rounded-xl p-10 text-center space-y-3 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">All Clear</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No active warnings or critical demurrage alerts for this client scope.
            </p>
          </div>
        ) : (
          (metrics?.urgentAlerts || []).map((alert: any, index: number) => {
            const isCritical = alert.severity === "CRITICAL";
            return (
              <div
                key={alert.id}
                className="rounded-xl p-5 space-y-3 transition-all duration-200 hover:translate-x-0.5 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
                style={{
                  borderLeft: `3px solid ${isCritical ? "#ef4444" : "#f59e0b"}`,
                  animationDelay: `${index * 80}ms`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isCritical ? (
                      <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/containers/${alert.containerId}`}
                          className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm transition-colors"
                        >
                          {alert.containerNumber}
                        </Link>
                        {!isClientScoped && (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            • {alert.clientName}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        Trigger: {alert.type.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      isCritical
                        ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                        : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium pl-7">
                  {alert.message}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pl-7 border-t border-slate-100 dark:border-white/5">
                  <span>Detected: {formatDate(alert.timestamp)}</span>
                  <Link
                    href={`/containers/${alert.containerId}`}
                    className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                  >
                    <span>Investigate Container</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
