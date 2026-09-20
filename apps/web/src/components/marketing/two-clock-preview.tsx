"use client";

import React from "react";
import Link from "next/link";
import { Split, Ship, Truck, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function TwoClockPreview() {
  return (
    <section id="two-clocks" className="py-20 bg-[#060a12]/60 backdrop-blur-md text-slate-200 border-t border-slate-800/80 select-none">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Title */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0f172a] border border-[#1e293b] text-xs font-semibold uppercase tracking-wider text-amber-500 mb-3">
            <Split className="w-3.5 h-3.5" />
            <span>Dual-Clock Financial Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            The Two-Clock Problem in Indian Port Clearance
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
            When cargo arrives at Nhava Sheva or Mundra, two independent billing clocks start running. Most ERPs monitor only the shipping line, leaving importers exposed to CFS ground rent.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Clock 1: Carrier Demurrage Clock */}
          <div className="bg-[#0b1325] border border-[#1e293b] rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-900 flex items-center justify-center font-bold text-xs">
                    <Ship className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Clock 1: Ocean Carrier Demurrage</h3>
                    <p className="text-[11px] text-slate-400">Governed by Shipping Line Tariff Agreement</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900">
                  WATER-SIDE
                </span>
              </div>

              <div className="space-y-3 mt-5 text-xs">
                <div className="p-3 bg-[#070d1a] rounded-lg border border-[#1e293b] flex items-center justify-between">
                  <span className="text-slate-400">Clock Commences:</span>
                  <span className="font-semibold text-white">Vessel Discharge onto Quay</span>
                </div>
                <div className="p-3 bg-[#070d1a] rounded-lg border border-[#1e293b] flex items-center justify-between">
                  <span className="text-slate-400">Standard Free Days:</span>
                  <span className="font-semibold text-amber-500">3 to 5 Calendar Days</span>
                </div>
                <div className="p-3 bg-[#070d1a] rounded-lg border border-[#1e293b] flex items-center justify-between">
                  <span className="text-slate-400">Escalation Penalty:</span>
                  <span className="font-semibold text-rose-400">₹4,500 – ₹9,000 / day / TEU</span>
                </div>
              </div>

              {/* Subtle visual banner */}
              <div className="mt-4 rounded-lg overflow-hidden border border-[#1e293b] h-20 relative group">
                <img
                  src="/images/msc-yellow-containers-stack.jpg"
                  alt="Water-side quay container stack"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#070d1a]/90 via-[#070d1a]/40 to-transparent flex items-center p-3">
                  <div className="text-[10px] font-mono font-bold text-sky-400 bg-[#070c16]/90 px-2 py-0.5 rounded border border-sky-900/60">
                    QUAY CRANE DISCHARGE · VESSEL DISCHARGE PROTOCOL
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                Continues to bill until the laden container physically gates out of the port terminal gates.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1e293b] flex items-center justify-between text-xs">
              <span className="text-slate-400">Automated e-DO Free-Time Parser</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> EDI Monitored
              </span>
            </div>
          </div>

          {/* Clock 2: CFS Off-Dock Ground Rent */}
          <div className="bg-[#0b1325] border border-[#1e293b] rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-950/60 text-amber-500 border border-amber-900 flex items-center justify-center font-bold text-xs">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Clock 2: CFS Off-Dock Ground Rent</h3>
                    <p className="text-[11px] text-slate-400">Governed by Container Freight Station Tariff</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-900">
                  LAND-SIDE
                </span>
              </div>

              <div className="space-y-3 mt-5 text-xs">
                <div className="p-3 bg-[#070d1a] rounded-lg border border-[#1e293b] flex items-center justify-between">
                  <span className="text-slate-400">Clock Commences:</span>
                  <span className="font-semibold text-white">DPD Fallback / CFS Gate-In</span>
                </div>
                <div className="p-3 bg-[#070d1a] rounded-lg border border-[#1e293b] flex items-center justify-between">
                  <span className="text-slate-400">Standard Free Days:</span>
                  <span className="font-semibold text-amber-500">0 to 3 Days (Strict)</span>
                </div>
                <div className="p-3 bg-[#070d1a] rounded-lg border border-[#1e293b] flex items-center justify-between">
                  <span className="text-slate-400">Escalation Penalty:</span>
                  <span className="font-semibold text-rose-400">₹1,500 – ₹3,500 / day / TEU</span>
                </div>
              </div>

              {/* Subtle visual banner */}
              <div className="mt-4 rounded-lg overflow-hidden border border-[#1e293b] h-20 relative group">
                <img
                  src="/images/container-stack-dark-orange.jpg"
                  alt="CFS off-dock container stack with isolated at-risk box"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#070d1a]/90 via-[#070d1a]/40 to-transparent flex items-center p-3">
                  <div className="text-[10px] font-mono font-bold text-amber-400 bg-[#070c16]/90 px-2 py-0.5 rounded border border-amber-900/60">
                    CFS OFF-DOCK STORAGE · AT-RISK BOX ISOLATION
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-4 leading-relaxed">
                Runs completely independently of carrier free days when containers fail the 48-hour DPD clearance window.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-[#1e293b] flex items-center justify-between text-xs">
              <span className="text-slate-400">Direct CFS Yard Integration</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Synchronized
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
