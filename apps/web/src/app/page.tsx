'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Truck,
  Filter
} from 'lucide-react';

export default function DashboardPage() {
  const [selectedClient, setSelectedClient] = useState<string>('ALL');

  const { data, isLoading, error } = useQuery({
    queryKey: ['containers'],
    queryFn: () => fetchApi<{ data: any[] }>('/api/v1/containers'),
  });

  const containers = data?.data || [];

  const clients = [
    { id: 'ALL', name: 'All Importers & Exporters' },
    { id: '11111111-1111-1111-1111-111111111111', name: 'Tata Electronics (AEO+ACP)' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Reliance Retail (AEO)' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Pinnacle Auto Parts' },
  ];

  const filtered = selectedClient === 'ALL'
    ? containers
    : containers.filter(c => c.clientId === selectedClient);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active Container Exposure Dashboard</h1>
          <p className="text-slate-300 text-sm mt-1">
            Real-time compliance readiness, two-clock demurrage tracking, and automated handoffs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-center">
            <span className="text-xs text-slate-400 block font-medium">Containers Tracked</span>
            <span className="text-xl font-bold text-white">{containers.length}</span>
          </div>
          <div className="bg-red-950/80 border border-red-800/60 rounded-xl px-4 py-2 text-center">
            <span className="text-xs text-red-300 block font-medium">Demurrage At Risk</span>
            <span className="text-xl font-bold text-red-400">
              {containers.filter(c => c.freeTimeExpiresAt && new Date(c.freeTimeExpiresAt) < new Date(Date.now() + 24 * 3600 * 1000)).length}
            </span>
          </div>
        </div>
      </div>

      {/* Client Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <Filter className="w-4 h-4 text-slate-500 mr-2" />
        {clients.map(client => (
          <button
            key={client.id}
            onClick={() => setSelectedClient(client.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedClient === client.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {client.name}
          </button>
        ))}
      </div>

      {/* Container List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Loading authoritative container data...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          Failed to load containers. Please verify the API is running at localhost:4000.
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
          No containers matching this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(cntr => {
            const isExpiringSoon = cntr.freeTimeExpiresAt && new Date(cntr.freeTimeExpiresAt) < new Date(Date.now() + 24 * 3600 * 1000);
            return (
              <div 
                key={cntr.id} 
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                        {cntr.containerNumber}
                      </span>
                      <span className="ml-2 text-xs font-semibold text-slate-500">
                        {cntr.size}ft {cntr.containerType}
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      cntr.deliveryMode === 'DPD_DIRECT' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : cntr.deliveryMode === 'DPD_CFS'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    }`}>
                      {cntr.deliveryMode.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-semibold text-slate-900 text-sm">{cntr.client?.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">HS Code: {cntr.hsCode || 'Not set'}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Free Time Expiry
                      </span>
                      <span className={`font-semibold ${isExpiringSoon ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                        {cntr.freeTimeExpiresAt ? new Date(cntr.freeTimeExpiresAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Documents
                      </span>
                      <span className="font-semibold text-slate-700">
                        {cntr.documents?.length || 0} attached
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Compliance Signals
                      </span>
                      <span className="font-semibold text-slate-700">
                        {cntr.complianceSignals?.length || 0} evaluated
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Link
                    href={`/containers/${cntr.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                  >
                    Inspect & Act <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
