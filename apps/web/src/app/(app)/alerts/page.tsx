"use client";

import React from "react";
import Link from "next/link";
import { useDashboardMetrics } from "@/lib/hooks/use-metrics";
import { useClientScope } from "@/lib/stores/client-scope-context";
import { formatDate } from "@/lib/utils";
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2,
  Clock,
  ExternalLink
} from "lucide-react";

export default function AlertsPage() {
  const { selectedClientId, isClientScoped } = useClientScope();
  const { data: metrics, isLoading } = useDashboardMetrics(selectedClientId);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
          Early Warning Engine
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Operational Alerts & Deduplication
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time triggers on expiring free time, DPD fallbacks, and customs documentation queries
        </p>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Loading operational alerts...
          </div>
        ) : metrics?.urgentAlerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">All Clear</h3>
            <p className="text-xs text-slate-500">
              No active warnings or critical demurrage alerts for this client scope.
            </p>
          </div>
        ) : (
          (metrics?.urgentAlerts || []).map((alert: any) => {
            const isCritical = alert.severity === "CRITICAL";

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border p-5 shadow-sm space-y-3 transition-all ${
                  isCritical
                    ? "border-rose-200 hover:border-rose-300"
                    : "border-amber-200 hover:border-amber-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isCritical ? (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/containers/${alert.containerId}`}
                          className="font-mono font-bold text-blue-600 hover:underline text-sm"
                        >
                          {alert.containerNumber}
                        </Link>
                        {!isClientScoped && (
                          <span className="text-xs font-semibold text-slate-500">
                            • {alert.clientName}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Trigger: {alert.type.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      isCritical
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-800 font-medium pl-7">
                  {alert.message}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 pl-7">
                  <span>Detected: {formatDate(alert.timestamp)}</span>
                  <Link
                    href={`/containers/${alert.containerId}`}
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
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
