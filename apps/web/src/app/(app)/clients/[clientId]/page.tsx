"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useClientScope } from "@/lib/stores/client-scope-context";
import { useContainers } from "@/lib/hooks/use-containers";
import { useDashboardMetrics } from "@/lib/hooks/use-metrics";
import { formatINR } from "@/lib/utils";
import { 
  Building2, 
  ShieldCheck, 
  ArrowLeft, 
  Container as ContainerIcon, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Mail,
  Phone
} from "lucide-react";

export default function SingleClientDashboardPage() {
  const params = useParams();
  const clientId = params?.clientId as string;
  const { clients, setSelectedClientId } = useClientScope();
  const client = clients.find((c) => c.id === clientId);

  const { data: metrics } = useDashboardMetrics(clientId);
  const { data: containers = [] } = useContainers(clientId);

  useEffect(() => {
    if (clientId) {
      setSelectedClientId(clientId);
    }
  }, [clientId, setSelectedClientId]);

  if (!client) {
    return (
      <div className="py-20 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Client Account Not Found</h2>
        <Link href="/clients" className="text-blue-600 text-xs hover:underline">
          &larr; Back to Client Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/clients"
            className="p-1.5 bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {client.code}
              </span>
              {client.aeoStatus !== "NONE" && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {client.aeoStatus} Authorized Economic Operator
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              {client.name}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
              <span>{client.email}</span>
              <span>•</span>
              <span>{client.phone}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/containers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
          >
            <span>View {client.name.split(" ")[0]}'s Containers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Containers
          </span>
          <div className="text-2xl font-black font-mono text-slate-800">
            {containers.length}
          </div>
          <span className="text-[11px] text-slate-500">Currently in port or CFS</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Current Demurrage Exposure
          </span>
          <div
            className={`text-2xl font-black font-mono ${
              client.totalExposureINR > 0 ? "text-rose-600" : "text-slate-800"
            }`}
          >
            {formatINR(client.totalExposureINR)}
          </div>
          <span className="text-[11px] text-slate-500">Accumulated across active shipments</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Critical Risk Containers
          </span>
          <div
            className={`text-2xl font-black font-mono ${
              client.criticalRiskCount > 0 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {client.criticalRiskCount}
          </div>
          <span className="text-[11px] text-slate-500">Requiring immediate clearance</span>
        </div>
      </div>

      {/* Containers list preview */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Containers for this Client</h3>
        <div className="divide-y divide-slate-100 text-xs">
          {containers.map((c) => (
            <div key={c.id} className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded">
              <div>
                <Link
                  href={`/containers/${c.id}`}
                  className="font-mono font-bold text-blue-600 hover:underline text-sm"
                >
                  {c.containerNumber}
                </Link>
                <div className="text-slate-400 text-[11px]">
                  {c.shippingLine} • {c.portOfDischarge}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-mono font-bold ${
                    c.currentExposureINR > 0 ? "text-rose-600" : "text-slate-700"
                  }`}
                >
                  {formatINR(c.currentExposureINR)}
                </div>
                <div className="text-[10px] text-slate-400">{c.deliveryMode}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
