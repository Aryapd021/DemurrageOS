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
  CheckCircle2
} from "lucide-react";

export default function ClientsDirectoryPage() {
  const { clients, setSelectedClientId } = useClientScope();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Client Directory
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Managed Client Importers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Accounts under CHA management • Scoped operational access and exposure tracking
          </p>
        </div>
      </div>

      {/* Grid of Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clients.map((client) => {
          const hasCritical = client.criticalRiskCount > 0;

          return (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-blue-300 transition-all space-y-4 group"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {client.code}
                    </span>
                    {client.aeoStatus !== "NONE" && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {client.aeoStatus}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {client.name}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Total Exposure
                  </span>
                  <span
                    className={`text-lg font-black font-mono ${
                      client.totalExposureINR > 0 ? "text-rose-600" : "text-slate-800"
                    }`}
                  >
                    {formatINR(client.totalExposureINR)}
                  </span>
                </div>
              </div>

              {/* Metrics bar */}
              <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <ContainerIcon className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="text-slate-500 block text-[11px]">Active Containers</span>
                    <strong className="text-slate-800 font-bold">
                      {client.activeContainersCount} containers
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AlertCircle
                    className={`w-4 h-4 ${hasCritical ? "text-rose-600" : "text-emerald-600"}`}
                  />
                  <div>
                    <span className="text-slate-500 block text-[11px]">Critical Alerts</span>
                    <strong
                      className={`font-bold ${hasCritical ? "text-rose-600" : "text-emerald-600"}`}
                    >
                      {client.criticalRiskCount} at risk
                    </strong>
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedClientId(client.id);
                  }}
                  className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg transition-colors text-center"
                >
                  Switch Scope to {client.name.split(" ")[0]}
                </button>

                <Link
                  href={`/clients/${client.id}`}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
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
