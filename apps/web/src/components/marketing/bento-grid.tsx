"use client";

import React from "react";
import Link from "next/link";
import { Building2, Globe2, Cpu, PhoneCall, ArrowRight, CheckCircle2 } from "lucide-react";

export default function BentoGrid() {
  return (
    <section id="features" className="py-20 bg-[#060a12]/70 backdrop-blur-md text-slate-200 border-t border-slate-800/80 select-none">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0f172a] border border-[#1e293b] text-xs font-semibold uppercase tracking-wider text-amber-500 mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>CHA Operational Modules</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Engineered for Indian Customs Brokerages
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
            Eliminate friction between terminal operators, shipping lines, and transport fleets before penalties accrue.
          </p>
        </div>

        {/* Clean Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Multi-Client Command */}
          <div className="bg-[#0b1325] border border-[#1e293b] rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Multi-Importer Command
                </span>
                <span className="text-[10px] bg-[#1e293b] text-emerald-400 border border-emerald-900/60 px-2 py-0.5 rounded font-mono font-semibold">
                  140+ CHA Firms Served
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Consolidated Exposure Across Importers
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Roll up demurrage risk across hundreds of consignee accounts or isolate a single importer with instant cryptographic scoping.
              </p>

              <div className="mt-4 space-y-2">
                {[
                  { sector: "Engineering & Auto Components", volume: "1,420 TEU / Mo", impact: "₹14.2 L Saved", color: "#34d399" },
                  { sector: "Agro-Commodities & Spices", volume: "860 TEU / Mo", impact: "Zero DPD Fallback", color: "#60a5fa" },
                  { sector: "Specialty Chemicals & Polymers", volume: "2,100 TEU / Mo", impact: "100% Free Days Guarded", color: "#34d399" },
                  { sector: "Consumer Electronics & Retail", volume: "640 TEU / Mo", impact: "Fast-Track Clearance", color: "#f59e0b" },
                ].map((s) => (
                  <div
                    key={s.sector}
                    className="flex justify-between items-center bg-[#070d1a] border border-[#1e293b] rounded-lg px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-slate-200">{s.sector}</span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-400">{s.volume}</span>
                      <span className="font-bold" style={{ color: s.color }}>
                        {s.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs">
              <span className="text-slate-400">Isolated Client Scope Architecture</span>
              <Link href="/login" className="text-amber-500 hover:text-amber-400 font-semibold inline-flex items-center gap-1">
                Access Client Command <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: Carrier Lines */}
          <div className="bg-[#0b1325] border border-[#1e293b] rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5" /> Shipping Line Tariffs
                </span>
                <span className="text-[10px] bg-[#1e293b] text-slate-300 px-2 py-0.5 rounded font-mono">
                  Scale of Rates
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Pre-Loaded Carrier Free-Time Matrices
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Calculates tiered penalty slabs automatically for major container lines operating in Indian waters.
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4">
                {[
                  { name: "Maersk Line", free: "5 Days DPD", slab: "Tier 1: ₹3,800/d" },
                  { name: "MSC Mediterranean", free: "5 Days DPD", slab: "Tier 1: ₹3,500/d" },
                  { name: "CMA CGM", free: "4 Days DPD", slab: "Tier 1: ₹3,900/d" },
                  { name: "Hapag-Lloyd", free: "5 Days DPD", slab: "Tier 1: ₹4,100/d" },
                ].map((line) => (
                  <div key={line.name} className="p-3 bg-[#070d1a] border border-[#1e293b] rounded-lg text-xs">
                    <div className="font-semibold text-white">{line.name}</div>
                    <div className="text-[11px] text-amber-500 mt-0.5 font-mono">{line.free}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{line.slab}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs">
              <span className="text-slate-400">Carrier tariff tables updated for 2026</span>
              <Link href="/login" className="text-amber-500 hover:text-amber-400 font-semibold inline-flex items-center gap-1">
                View Tariff Engine <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 3: Document Extraction */}
          <div className="bg-[#0b1325] border border-[#1e293b] rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> Manifest Ingestion
                </span>
                <span className="text-[10px] bg-[#1e293b] text-slate-300 px-2 py-0.5 rounded font-mono">
                  OCR &amp; EDI
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Automated e-DO &amp; Bill of Entry Parser
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Ingest Delivery Orders and ICEGATE notifications to start billing clocks with zero manual entry.
              </p>

              <div className="mt-4 space-y-2">
                {[
                  { field: "Delivery Order Free Days", value: "Auto-Extracted from e-DO", conf: "99.8%" },
                  { field: "ICEGATE Gate-Pass Token", value: "EDI Validated & Synced", conf: "100%" },
                  { field: "DPD Route Window Buffer", value: "48-Hour Terminal Clock", conf: "Real-Time" },
                ].map((r) => (
                  <div
                    key={r.field}
                    className="flex justify-between items-center bg-[#070d1a] border border-[#1e293b] rounded-lg px-3 py-2 text-xs"
                  >
                    <span className="text-slate-400">{r.field}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white font-mono">{r.value}</span>
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">{r.conf}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs">
              <span className="text-slate-400">PDF, Excel, and EDI Manifest Support</span>
              <Link href="/login" className="text-amber-500 hover:text-amber-400 font-semibold inline-flex items-center gap-1">
                Authorized Manifest Ingestion <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 4: Transporter Token Links */}
          <div className="bg-[#0b1325] border border-[#1e293b] rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" /> Transporter Dispatch
                </span>
                <span className="text-[10px] bg-[#1e293b] text-slate-300 px-2 py-0.5 rounded font-mono">
                  Token Links
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                72-Hour Passwordless Pickup Confirmation
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Dispatch single-use confirmation links to truck drivers via SMS or WhatsApp without requiring software logins.
              </p>

              <div className="mt-4 p-3 bg-[#070d1a] border border-[#1e293b] rounded-lg text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">Dynamic Driver Handoff Protocol</span>
                  <span className="text-[10px] text-emerald-400 font-mono">72h Single-Use</span>
                </div>
                <div className="p-1.5 bg-[#0a1222] rounded text-[11px] font-mono text-slate-400 truncate">
                  demurrageos.app/confirm/[encrypted_dispatch_token]
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Real-time gate scan halts land-side ground rent instantly</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs">
              <span className="text-slate-400">Cryptographic audit trail for customs compliance</span>
              <Link href="/login" className="text-amber-500 hover:text-amber-400 font-semibold inline-flex items-center gap-1">
                Explore Dispatch Automation <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
