"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useContainer, useTriggerDpdFallback } from "@/lib/hooks/use-containers";
import { DeliveryModeBadge } from "@/components/containers/delivery-mode-badge";
import { TwoClockCard } from "@/components/containers/two-clock-card";
import { RiskExplainabilityPanel } from "@/components/containers/risk-explainability-panel";
import { EventTimeline } from "@/components/containers/event-timeline";
import { formatINR, formatDate } from "@/lib/utils";
import { 
  ArrowLeft, 
  FileText, 
  CheckSquare, 
  ArrowRightLeft, 
  Ship, 
  MapPin, 
  Receipt, 
  ShieldAlert, 
  Calendar, 
  Download,
  AlertOctagon,
  Sparkles
} from "lucide-react";

export default function ContainerDetailPage() {
  const params = useParams();
  const containerId = params?.containerId as string;
  const { data: container, isLoading } = useContainer(containerId);
  const fallbackMutation = useTriggerDpdFallback();
  const [isSimulating, setIsSimulating] = useState(false);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400">
        Loading container operational record...
      </div>
    );
  }

  if (!container) {
    return (
      <div className="py-20 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Container Not Found</h2>
        <Link href="/containers" className="text-blue-600 text-xs hover:underline">
          &larr; Back to Container List
        </Link>
      </div>
    );
  }

  const handleSimulateFallback = async () => {
    setIsSimulating(true);
    try {
      await fallbackMutation.mutateAsync(container.id);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Live Simulation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/containers"
            className="p-1.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span>{container.clientName}</span>
              <span>•</span>
              <span className="font-mono">BL: {container.blNumber}</span>
            </div>
            <h1 className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              {container.containerNumber}
              <DeliveryModeBadge
                mode={container.deliveryMode}
                hasFallback={container.twoClocks.hasFallback}
                size="md"
              />
            </h1>
          </div>
        </div>

        {/* Demo trigger: DPD Fallback simulation button */}
        <div className="flex items-center gap-2.5">
          {!container.twoClocks.hasFallback && container.deliveryMode.startsWith("DPD") && (
            <button
              onClick={handleSimulateFallback}
              disabled={isSimulating || fallbackMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all border border-amber-400 active:scale-95 cursor-pointer"
              title="Demo feature: Trigger real-time DPD fallback to activate secondary CFS clock"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isSimulating ? "Simulating Fallback..." : "Simulate DPD→CFS Fallback"}</span>
            </button>
          )}

          <Link
            href={`/containers/${container.id}/documents`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs rounded-lg shadow-sm transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Document Side-by-Side</span>
          </Link>
        </div>
      </div>

      {/* Snapshot Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Exposure */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm transition-colors">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Current Demurrage Exposure
          </div>
          <div
            className={`text-2xl font-extrabold font-mono mt-1 ${
              container.currentExposureINR > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-800 dark:text-slate-100"
            }`}
          >
            {formatINR(container.currentExposureINR)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Projected: <strong className="font-mono">{formatINR(container.projectedExposureINR)}</strong>
          </div>
        </div>

        {/* Vessel & Shipping Line */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm transition-colors">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Shipping Line / Vessel
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">
            {container.shippingLine}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {container.vesselName} (Voy {container.voyageNumber})
          </div>
        </div>

        {/* Port of Discharge */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm transition-colors">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Discharge Port &amp; Yard
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">
            {container.portOfDischarge}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {container.currentLocation}
          </div>
        </div>

        {/* Free Days Status */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm transition-colors">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Carrier Free Time
          </div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
            {container.twoClocks.carrierClock.daysOverdue > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                {container.twoClocks.carrierClock.daysOverdue} Days Overdue
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {container.twoClocks.carrierClock.freeDaysRemaining} Days Free
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Discharged: {formatDate(container.dischargedAt)}
          </div>
        </div>
      </div>

      {/* Two-Clock Engine Card */}
      <TwoClockCard clocks={container.twoClocks} />

      {/* Main 2-column layout: Left = Financial Charges & Timeline, Right = Risk & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Financial Breakdown Table */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Itemized Exposure &amp; Charge Audit
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                Total: {formatINR(container.currentExposureINR)}
              </span>
            </div>

            {container.charges.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No active charges accrued. Container is within free time.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {container.charges.map((charge, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>{charge.label}</span>
                        {charge.isAuditTarget && (
                          <span className="text-[10px] bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-900">
                            Audit Target
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Basis: {charge.clockBasis} • {charge.daysBilled} days billed @ ₹
                        {charge.dailyRate.toLocaleString("en-IN")}/day
                      </div>
                    </div>
                    <div className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm">
                      {formatINR(charge.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operational Event Timeline */}
          <EventTimeline events={container.events} />
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Risk Explainability Panel */}
          <RiskExplainabilityPanel
            risk={container.risk}
            complianceSignals={container.complianceSignals}
          />

          {/* Quick Tasks Card */}
          <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Associated Tasks</h3>
              </div>
              <Link
                href="/tasks"
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                View all tasks
              </Link>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Transporter Pickup Handoff
                  </span>
                  <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-900">
                    ASSIGNED
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Assign pickup to external trucker without login using secure 72h link.
                </div>
                <div className="pt-1">
                  <Link
                    href="/tasks/tsk_01_pickup_ramesh"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <span>Manage External Handoff &rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
