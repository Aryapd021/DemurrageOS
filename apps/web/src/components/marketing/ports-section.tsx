"use client";

import { useState } from "react";
import Link from "next/link";

const PORTS = [
  { code: "INJAV", name: "JNPT Nhava Sheva", state: "Maharashtra", terminals: "NSFT · NSICT · Gateway · BMCT", vol: "India's #1 container port" },
  { code: "INMUN", name: "Mundra Port — APSEZ", state: "Gujarat", terminals: "MICT · MSCT · PSA Mundra", vol: "India's fastest-growing port" },
  { code: "INMAA", name: "Chennai CITPL", state: "Tamil Nadu", terminals: "CTPL · DP World Chennai", vol: "South India's primary gateway" },
];

const LINES = [
  { name: "Maersk", color: "#3b82f6" },
  { name: "MSC", color: "#e8e8f0" },
  { name: "CMA CGM", color: "#ef4444" },
  { name: "Hapag-Lloyd", color: "#f97316" },
  { name: "COSCO", color: "#ef4444" },
  { name: "Evergreen", color: "#22c55e" },
  { name: "ONE", color: "#a78bfa" },
  { name: "Yang Ming", color: "#60a5fa" },
];

export default function PortsSection() {
  const [selectedLine, setSelectedLine] = useState("ONE");
  return (
    <>
      <section
        id="ports"
        style={{
          backgroundColor: "rgba(6, 10, 18, 0.7)",
          backdropFilter: "blur(8px)",
          padding: "96px 24px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div
              style={{
                display: "inline-block",
                border: "1px solid rgba(52,211,153,0.25)",
                borderRadius: 100,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "#34d399",
                textTransform: "uppercase" as const,
                marginBottom: 16,
                background: "rgba(52,211,153,0.05)",
              }}
            >
              Live Coverage
            </div>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 800,
                letterSpacing: "-0.035em",
                color: "#fff",
                margin: "0 0 16px",
                lineHeight: 1.1,
              }}
            >
              Tracking Live Across{" "}
              <span style={{ color: "#f59e0b" }}>India's Top 3 Container Ports</span>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(232,232,240,0.45)", maxWidth: 540, margin: "0 auto", lineHeight: 1.7 }}>
              Real CFS directories, carrier tariff schedules, and port gate-movement data — covering 85% of India's containerised import volume.
            </p>
          </div>

          {/* Port cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 40 }}>
            {PORTS.map((p, i) => (
              <div
                key={p.code}
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16,
                  padding: "24px",
                  background: "rgba(255,255,255,0.02)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    right: 16,
                    top: 12,
                    fontSize: 64,
                    fontWeight: 900,
                    color: "rgba(255,255,255,0.03)",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ position: "relative" }}>
                  <div style={{ display: "inline-block", fontFamily: "monospace", fontSize: 11, color: "rgba(232,232,240,0.35)", background: "rgba(255,255,255,0.05)", borderRadius: 5, padding: "2px 8px", marginBottom: 12 }}>
                    {p.code}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{p.name}</h3>
                  <p style={{ fontSize: 12, color: "rgba(232,232,240,0.35)", margin: "0 0 16px" }}>{p.state}</p>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                    <div style={{ fontSize: 11, color: "rgba(232,232,240,0.3)", marginBottom: 4 }}>TERMINALS</div>
                    <div style={{ fontSize: 13, color: "rgba(232,232,240,0.7)", fontWeight: 500 }}>{p.terminals}</div>
                    <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600, marginTop: 8 }}>{p.vol}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Carrier Fleet & Spreader Crane Telemetry */}
          <div className="mt-12 rounded-2xl border border-slate-700/80 bg-[#09101d]/90 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Carrier Tariff Engine &amp; Spreader Hoist Telemetry
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  Automated Free-Day Parser Across All Major Lines
                </h3>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                ODeX &amp; Carrier EDI Integrated
              </div>
            </div>

            {/* Carrier selector tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {LINES.map((l) => (
                <button
                  key={l.name}
                  type="button"
                  onClick={() => setSelectedLine(l.name)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer border ${
                    selectedLine === l.name
                      ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30"
                      : "bg-[#060b14] text-slate-300 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>

            {/* Interactive Grid: Visual Crane Hoist + Tariff Rule Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Dynamic Carrier Container Real Imagery Frame */}
              <div className="lg:col-span-6 relative rounded-xl overflow-hidden border border-slate-700/80 h-64 sm:h-72 group">
                <img
                  src={
                    selectedLine === "MSC"
                      ? "/images/msc-yellow-containers-stack.jpg"
                      : selectedLine === "ONE"
                      ? "/images/crane-hoist-one-container.jpg"
                      : selectedLine === "Maersk"
                      ? "/images/container-hoist-sling-white.jpg"
                      : "/images/container-stack-dark-orange.jpg"
                  }
                  alt={`${selectedLine} container terminal operations`}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09101d] via-[#09101d]/20 to-transparent" />
                
                {/* Spreader telemetry pin */}
                <div className="absolute top-3 left-3 bg-[#070c16]/90 border border-slate-700 px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 backdrop-blur-sm">
                  <span>TERMINAL PROTOCOL: </span>
                  <strong className="text-emerald-400">
                    {selectedLine === "MSC" ? "MSC MEDLOG YARD DISCHARGE" : selectedLine === "ONE" ? "QUAY SPREADER LOCKED" : "DPD CLEARANCE BUFFER"}
                  </strong>
                </div>

                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-blue-950/90 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold">
                  {selectedLine} Carrier Sync
                </div>

                <div className="absolute bottom-3 left-3 right-3 bg-[#070c16]/95 border border-slate-700/80 p-3 rounded-lg backdrop-blur-md flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Selected Carrier</div>
                    <div className="text-white font-bold">{selectedLine} Fleet Telemetry</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase">ODeX Electronic DO</div>
                    <div className="text-emerald-400 font-semibold">Auto-Synced</div>
                  </div>
                </div>
              </div>

              {/* Tariff Details Matrix */}
              <div className="lg:col-span-6 space-y-3">
                <div className="p-4 rounded-xl bg-[#060b14] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Standard Water-Side Free Time</span>
                    <span className="font-bold text-amber-400 font-mono">
                      {selectedLine === "ONE" ? "4 Calendar Days" : selectedLine === "Maersk" ? "5 Calendar Days" : "4 Calendar Days"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Combined Detention &amp; Demurrage</span>
                    <span className="font-bold text-white font-mono">14 Days Window</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Tier 1 Demurrage Escalation</span>
                    <span className="font-bold text-rose-400 font-mono">₹4,200 / TEU / Day</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">Tier 2 Penalty (Day 6+)</span>
                    <span className="font-bold text-rose-500 font-mono">₹8,400 / TEU / Day</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0e1626]/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  DemurrageOS automatically ingests delivery orders (DO) directly from ODeX and liner portals, calculating the exact expiry timestamp down to the minute.
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Supported at JNPT, Mundra, and Chennai</span>
                  <Link
                    href="/login"
                    className="text-xs font-mono font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    View Tariff Matrix &rarr;
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        style={{
          backgroundColor: "transparent",
          padding: "0 24px 96px",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "56px 48px",
              background: "rgba(11, 19, 37, 0.85)",
              backdropFilter: "blur(12px)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative" }}>
              <h2
                style={{
                  fontSize: "clamp(24px, 3.5vw, 40px)",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.035em",
                  margin: "0 0 16px",
                  lineHeight: 1.1,
                }}
              >
                Join 140+ CHAs Managing{" "}
                <span style={{ color: "#d97706" }}>₹48.6 Cr+</span> in Demurrage Protection
              </h2>
              <p style={{ fontSize: 15, color: "rgba(226,232,240,0.65)", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7 }}>
                Protect your importer clients from dual-clock demurrage and CFS ground rent penalties across JNPT Nhava Sheva, Mundra, and Chennai. Real live company consignments are strictly secured behind authorized portal login.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link
                  href="/login"
                  style={{
                    display: "inline-block",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    padding: "14px 28px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "none",
                    letterSpacing: "-0.01em",
                    boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
                  }}
                >
                  Launch Authorized Portal →
                </Link>
                <Link
                  href="/dashboard?demo=true"
                  style={{
                    display: "inline-block",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(226,232,240,0.85)",
                    padding: "14px 28px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  Explore Live Demo
                </Link>
              </div>
              <p style={{ fontSize: 12, color: "rgba(226,232,240,0.35)", marginTop: 24, marginBottom: 0 }}>
                140+ CHA Brokerages · ₹48.6 Cr+ Protected · Zero Unauthorized Data Exposure
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function CtaBanner() {
  return null; // merged above
}
