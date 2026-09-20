"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Anchor, ShieldCheck, Activity, Terminal } from "lucide-react";

export default function HeroSection() {
  const [containerSearch, setContainerSearch] = useState("");
  const [searchResult, setSearchResult] = useState<string | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!containerSearch.trim()) return;
    setSearchResult(
      "Automated Two-Clock Protection: 48h DPD clearance window, e-DO free-day tariff ingestion, and driver dispatch active. Live consignment telemetry and client records are encrypted. Sign in to your CHA workspace to access real-time boxes."
    );
  };

  return (
    <section className="relative min-h-[94vh] flex flex-col justify-between pt-28 pb-14 overflow-hidden bg-transparent text-white select-none">

      {/* ── Hero Main Content ── */}
      <div className="max-w-6xl mx-auto px-6 w-full relative z-10 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7">
            {/* Status pill badge with live beacon */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#0d1627]/90 border border-slate-700/60 text-xs font-semibold text-sky-400 mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span className="font-mono text-[11px] tracking-wide text-slate-300">
                JNPT · MUNDRA · CHENNAI PORT TELEMETRY ACTIVE
              </span>
            </div>

            {/* Main Headline in Outfit geometric display font */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08] mb-6 font-heading">
              Stop Demurrage Bleed
              <br />
              <span className="text-[#d97706]">Before the Clock Bills.</span>
            </h1>

            {/* Subheading in Plus Jakarta Sans */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mb-8 font-normal">
              The dedicated operating system engineered for licensed Indian Customs House Agents. Unify container discharge ETA, 48-hour DPD clearance limits, and dual-clock financial exposure to protect importer capital.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-8">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2.5 py-3.5 px-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-900/30 cursor-pointer"
              >
                <span>Launch Authorized Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2.5 py-3.5 px-7 rounded-lg bg-[#0e172a]/90 hover:bg-[#1e293b] border border-slate-700/80 text-slate-200 hover:text-white text-sm font-semibold transition-colors cursor-pointer backdrop-blur-sm"
              >
                <span>CHA Portal Sign In</span>
              </Link>
            </div>

            {/* Clean Quick Query Bar */}
            <div className="bg-[#0b1325]/85 border border-slate-700/60 p-4 rounded-xl max-w-xl backdrop-blur-md shadow-xl">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-sky-400" /> Container Milestone Protection Engine
                </span>
                <span className="text-sky-400 text-[10px]">Real-Time EDI</span>
              </div>
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter Container No. (e.g. MSKU8294102 or TCKU8821047)"
                    value={containerSearch}
                    onChange={(e) => setContainerSearch(e.target.value)}
                    className="w-full bg-[#060b14] border border-slate-700/70 text-xs text-white rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Verify
                </button>
              </form>
              {searchResult && (
                <div className="text-xs text-amber-300 mt-2.5 p-2.5 bg-[#060b14] rounded-lg border border-amber-900/60 font-mono leading-relaxed">
                  {searchResult}
                </div>
              )}
            </div>
          </div>

          {/* Right Hero Column: Interactive Live Gantry Telemetry Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-slate-700/80 bg-[#0a1222]/90 backdrop-blur-xl shadow-2xl overflow-hidden group">
              {/* Image Preview with Atmospheric Gradient */}
              <div className="relative h-56 sm:h-64 w-full overflow-hidden">
                <img
                  src="/images/gantry-sky-dramatic.jpg"
                  alt="Port Gantry Crane Terminal Operation"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1222] via-[#0a1222]/40 to-transparent" />
                
                {/* Real-time Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#070c16]/90 border border-slate-700/80 text-[10px] font-mono font-semibold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE SURVEILLANCE ENGINE · BERTH 03</span>
                </div>

                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-amber-500/90 text-slate-950 text-[10px] font-bold font-mono">
                  JNPT NSFT
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Operational Engine</div>
                    <div className="text-sm font-black text-white font-mono">Automated DPD Protocol</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-mono">Clearance SLA</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono">Zero Overdue Window</div>
                  </div>
                </div>
              </div>

              {/* Telemetry Breakdown Details */}
              <div className="p-4 space-y-3 bg-[#0a1222]/95 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#060b14] border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Clock 1: Water-Side</div>
                    <div className="font-semibold text-white mt-0.5 flex items-center justify-between">
                      <span>Liner Demurrage</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Free Days Guarded</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#060b14] border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Clock 2: Land-Side</div>
                    <div className="font-semibold text-white mt-0.5 flex items-center justify-between">
                      <span>CFS Ground Rent</span>
                      <span className="text-[10px] text-amber-400 font-mono">Fallback Shielded</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 font-mono">
                  <span>Confidential Workspace: <strong className="text-slate-200">Encrypted</strong></span>
                  <Link href="/login" className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors">
                    <span>Authorized Access</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Key Metrics Strip: Customers Served, Damage Prevented, Money Saved ── */}
      <div className="max-w-6xl mx-auto px-6 w-full relative z-10 pt-6 border-t border-slate-800/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
          <div className="p-3.5 bg-[#0a1120]/70 rounded-lg border border-slate-800 backdrop-blur-sm">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Customers Served</div>
            <div className="text-xl font-bold text-white mt-0.5 font-heading">140+ CHA Firms</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Licensed Custom House Agents</div>
          </div>
          <div className="p-3.5 bg-[#0a1120]/70 rounded-lg border border-slate-800 backdrop-blur-sm">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Damage Prevented</div>
            <div className="text-xl font-bold text-[#d97706] mt-0.5 font-heading">₹48.6 Cr+</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Avoidable demurrage &amp; rent saved</div>
          </div>
          <div className="p-3.5 bg-[#0a1120]/70 rounded-lg border border-slate-800 backdrop-blur-sm">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Avg Money Saved</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5 font-heading">₹3.2 L / Mo</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Average savings per importer client</div>
          </div>
          <div className="p-3.5 bg-[#0a1120]/70 rounded-lg border border-slate-800 backdrop-blur-sm">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Containers Protected</div>
            <div className="text-xl font-bold text-white mt-0.5 font-heading">45,000+ Annual</div>
          </div>
        </div>
      </div>
    </section>
  );
}
