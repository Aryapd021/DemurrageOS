"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useContainers } from "@/lib/hooks/use-containers";
import { useClientScope } from "@/lib/stores/client-scope-context";
import { DeliveryModeBadge } from "@/components/containers/delivery-mode-badge";
import { formatINR } from "@/lib/utils";
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  Ship,
  FileSpreadsheet
} from "lucide-react";
import { ContainerStatus, DeliveryMode } from "@demurrageos/shared-types";

export default function ContainersPage() {
  const { selectedClientId, selectedClient, isClientScoped } = useClientScope();
  const { data: containers = [], isLoading } = useContainers(selectedClientId);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [modeFilter, setModeFilter] = useState<string>("ALL");

  const filteredContainers = containers.filter((c) => {
    const matchesSearch =
      c.containerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.blNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.portOfDischarge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shippingLine.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesMode = modeFilter === "ALL" || c.deliveryMode === modeFilter;

    return matchesSearch && matchesStatus && matchesMode;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {isClientScoped ? `${selectedClient?.name} Operations` : "All Clients Consolidated"}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Active Containers</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time tracking of carrier demurrage, CFS ground rent, and delivery mode routing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/imports/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Upload Port / EDI CSV</span>
          </Link>
        </div>
      </div>

      {/* Filters bar */}
      <div className="rounded-xl p-4 flex flex-col md:flex-row items-center gap-3 bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by container number (e.g. MSKU8294102), B/L, or port..."
            className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-xs font-medium focus:outline-none cursor-pointer bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Risk Statuses</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="WARNING">Warning</option>
            <option value="ON_TRACK">On Track</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-xs font-medium focus:outline-none cursor-pointer bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">All Delivery Modes</option>
            <option value="DPD_DIRECT">DPD Direct</option>
            <option value="DPD_CFS">DPD via CFS</option>
            <option value="CFS">CFS Route</option>
          </select>
        </div>
      </div>

      {/* Container Table */}
      <div className="rounded-xl overflow-hidden bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                <th className="py-3.5 px-4">Container &amp; B/L</th>
                {!isClientScoped && <th className="py-3.5 px-4">Client</th>}
                <th className="py-3.5 px-4">Delivery Mode</th>
                <th className="py-3.5 px-4">Port &amp; Line</th>
                <th className="py-3.5 px-4">Two Clocks Status</th>
                <th className="py-3.5 px-4">Risk &amp; Score</th>
                <th className="py-3.5 px-4 text-right">Exposure</th>
                <th className="py-3.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={isClientScoped ? 7 : 8} className="p-0">
                    <div>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-slate-100 dark:border-white/5">
                          <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                          <div className="h-4 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                          <div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                          <div className="h-4 w-24 ml-auto animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : filteredContainers.length === 0 ? (
                <tr>
                  <td colSpan={isClientScoped ? 7 : 8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No containers found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredContainers.map((container) => {
                  const isCritical = container.status === "CRITICAL";
                  const isWarning = container.status === "WARNING";

                  return (
                    <tr
                      key={container.id}
                      className="transition-colors duration-150 group cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      {/* Container & BL */}
                      <td className="py-3.5 px-4">
                        <Link href={`/containers/${container.id}`} className="block">
                          <div className="font-bold text-blue-400 group-hover:text-amber-400 flex items-center gap-1.5 font-mono text-sm transition-colors">
                            {container.containerNumber}
                          </div>
                          <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                            B/L: {container.blNumber}
                          </div>
                        </Link>
                      </td>

                      {/* Client Column */}
                      {!isClientScoped && (
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                            {container.clientName}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">Direct Client</div>
                        </td>
                      )}

                      {/* Delivery Mode Badge */}
                      <td className="py-3.5 px-4">
                        <DeliveryModeBadge
                          mode={container.deliveryMode}
                          hasFallback={container.twoClocks.hasFallback}
                          size="sm"
                        />
                      </td>

                      {/* Port & Shipping Line */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Ship className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>{container.shippingLine}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[170px] mt-0.5">
                          {container.portOfDischarge}
                        </div>
                      </td>

                      {/* Two Clocks Status */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase w-12">Carrier:</span>
                            {container.twoClocks.carrierClock.daysOverdue > 0 ? (
                              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                +{container.twoClocks.carrierClock.daysOverdue}d overdue
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {container.twoClocks.carrierClock.freeDaysRemaining}d remaining
                              </span>
                            )}
                          </div>
                          {container.twoClocks.cfsClock && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase w-12">CFS Rent:</span>
                              {container.twoClocks.cfsClock.daysOverdue > 0 ? (
                                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                  +{container.twoClocks.cfsClock.daysOverdue}d overdue
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  {container.twoClocks.cfsClock.freeDaysRemaining}d remaining
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Risk & Score */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              isCritical
                                ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                                : isWarning
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                                : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                            }`}
                          >
                            {container.risk.level}
                          </span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {container.risk.totalScore}/100
                          </span>
                        </div>
                      </td>

                      {/* Financial Exposure */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className={`font-bold font-mono text-sm ${
                            container.currentExposureINR > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {formatINR(container.currentExposureINR)}
                        </div>
                        {container.projectedExposureINR > container.currentExposureINR && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            Proj: {formatINR(container.projectedExposureINR)}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-center">
                        <Link
                          href={`/containers/${container.id}`}
                          className="p-1.5 inline-flex rounded transition-colors text-slate-400 hover:text-amber-600 dark:text-slate-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-white/5"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
