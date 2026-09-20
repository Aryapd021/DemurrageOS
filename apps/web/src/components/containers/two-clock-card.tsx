import React from "react";
import { TwoClockDetails } from "@demurrageos/shared-types";
import { formatDate } from "@/lib/utils";
import { Clock, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

interface TwoClockCardProps {
  clocks: TwoClockDetails;
}

export function TwoClockCard({ clocks }: TwoClockCardProps) {
  const { carrierClock, cfsClock, hasFallback } = clocks;

  return (
    <div className="bg-white dark:bg-[#0c1424] rounded-xl border border-slate-200 dark:border-white/5 p-5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
            Two-Clock Free-Time &amp; Ground Rent Engine
          </h3>
        </div>
        {hasFallback && (
          <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-900">
            Dual Clock Active (DPD Fallback)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clock 1: Carrier Demurrage Clock */}
        <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Clock 1: Carrier Demurrage
            </span>
            {carrierClock.daysOverdue > 0 ? (
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                {carrierClock.daysOverdue} Days Overdue
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                {carrierClock.freeDaysRemaining} Free Days Left
              </span>
            )}
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clock Basis</div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{carrierClock.basis}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60 dark:border-white/10">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Discharged At</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(carrierClock.startDate)}</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Free Period End</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(carrierClock.expiryDate)}</span>
            </div>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                carrierClock.daysOverdue > 0 ? "bg-rose-500" : "bg-emerald-500"
              }`}
              style={{
                width: `${
                  carrierClock.daysOverdue > 0
                    ? 100
                    : Math.max(10, ((carrierClock.freeDaysTotal - carrierClock.freeDaysRemaining) / carrierClock.freeDaysTotal) * 100)
                }%`,
              }}
            />
          </div>
        </div>

        {/* Clock 2: CFS Ground Rent Clock */}
        {cfsClock ? (
          <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Clock 2: CFS Ground Rent
              </span>
              {cfsClock.daysOverdue > 0 ? (
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  {cfsClock.daysOverdue} Days Overdue
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  {cfsClock.freeDaysRemaining} Free Days Left
                </span>
              )}
            </div>

            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clock Basis</div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{cfsClock.basis}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">CFS Gate-In</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(cfsClock.startDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[11px]">CFS Free End</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(cfsClock.expiryDate)}</span>
              </div>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  cfsClock.daysOverdue > 0 ? "bg-rose-500" : "bg-amber-500"
                }`}
                style={{
                  width: `${
                    cfsClock.daysOverdue > 0
                      ? 100
                      : Math.max(10, ((cfsClock.freeDaysTotal - cfsClock.freeDaysRemaining) / cfsClock.freeDaysTotal) * 100)
                  }%`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 p-4 flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">No Secondary CFS Clock</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs">
              This container is on DPD Direct or has not entered a secondary CFS station. Ground rent is not accumulating.
            </span>
          </div>
        )}
      </div>

      <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-lg p-3 text-[11px] text-blue-950 dark:text-blue-200 flex items-start gap-2">
        <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Domain Invariant: </span>
          Carrier demurrage runs continuously from original port discharge, while CFS ground rent runs strictly from CFS gate-in timestamp. Both clocks bill concurrently during operational delays.
        </div>
      </div>
    </div>
  );
}
