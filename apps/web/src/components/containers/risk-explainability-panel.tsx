import React from "react";
import { RiskExplainability, ComplianceSignal } from "@demurrageos/shared-types";
import { AlertTriangle, ShieldAlert, CheckCircle2, ArrowRightCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskExplainabilityPanelProps {
  risk: RiskExplainability;
  complianceSignals: ComplianceSignal[];
}

export function RiskExplainabilityPanel({ risk, complianceSignals }: RiskExplainabilityPanelProps) {
  const isCritical = risk.level === "CRITICAL";
  const isHigh = risk.level === "HIGH";

  return (
    <div className="bg-white dark:bg-[#0c1425] rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 transition-colors">
      {/* Header with Risk Level Badge and Score */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <ShieldAlert
            className={cn(
              "w-5 h-5",
              isCritical ? "text-rose-600 dark:text-rose-400" : isHigh ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
            )}
          />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Risk Assessment &amp; Explainability</h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Deterministic composite score driven by urgency, customs, and financial exposure
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Score</div>
            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{risk.totalScore}/100</div>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
              isCritical
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                : isHigh
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
            )}
          >
            {risk.level} RISK
          </span>
        </div>
      </div>

      {/* Cascading Demurrage Risk Cliff Banner (if High or Critical) */}
      {(isCritical || isHigh) && (
        <div className="rounded-xl overflow-hidden border border-rose-200 dark:border-rose-900/60 bg-rose-950/20 relative group">
          <div className="flex flex-col sm:flex-row items-stretch">
            <div className="sm:w-36 h-28 sm:h-auto relative shrink-0 overflow-hidden">
              <img
                src="/images/container-risk-overboard.jpg"
                alt="Container Demurrage Loss Risk"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-transparent to-[#0c1425]/90" />
            </div>
            <div className="p-3.5 flex-1 flex flex-col justify-center space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  Cascading Demurrage Cliff Alert
                </span>
                <span className="text-[10px] font-mono text-slate-400">₹85,000 Preventable</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                48-hour DPD window lapsed. Container subject to CFS off-dock diversion, activating secondary ground rent clock.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Structured "Why is this container at risk?" */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Why is this container at risk?</span>
        </div>
        <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#070d1a] rounded-lg p-3 border border-slate-100 dark:border-slate-800">
          {risk.reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 mt-1.5 shrink-0" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Compliance Signals Pill Tags */}
      {complianceSignals.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Compliance &amp; Document Intelligence Signals</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {complianceSignals.map((signal) => (
              <div
                key={signal.id}
                className={cn(
                  "p-2.5 rounded-lg border text-xs space-y-1 transition-colors",
                  signal.severity === "ALERT"
                    ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200"
                    : signal.severity === "WARNING"
                    ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200"
                    : "bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200"
                )}
              >
                <div className="font-semibold flex items-center justify-between">
                  <span>{signal.title}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/70 dark:bg-slate-800/80">
                    +{signal.score} pts
                  </span>
                </div>
                <div className="text-[11px] opacity-90">{signal.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Action */}
      <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <ArrowRightCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Recommended Operational Actions</span>
        </div>
        <div className="space-y-2">
          {risk.recommendedActions.map((action, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-lg p-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
