"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const STEPS = [
  { icon: "🚢", title: "Vessel Discharge onto Quay", sub: "JNPT NSFT Terminal · Berth Telemetry Ingested", date: "Day 0 · Berth Discharge", color: "#60a5fa", highlight: false },
  { icon: "📋", title: "Carrier Free-Time Clock Starts", sub: "Automatic ODeX electronic delivery order (e-DO) ingestion", date: "Day 1 · Clock 1 Active", color: "#34d399", highlight: false },
  { icon: "⏰", title: "DPD 48-Hour Terminal Window", sub: "Automated alert sent to CHA dispatch team before fallback cutoff", date: "Day 2 · 48h Direct Gate Buffer", color: "#f59e0b", highlight: false },
  { icon: "⚠️", title: "Unmitigated DPD Fallback Threat", sub: "Without DemurrageOS, delayed truck handoff auto-diverts box to CFS yard", date: "Day 3 · Secondary Clock Risk", color: "#ef4444", highlight: true },
  { icon: "🏭", title: "CFS Ground Rent Escalation Avoided", sub: "DemurrageOS triggers fast-track transporter dispatch before penalties start", date: "Day 3 · Escalation Evaded", color: "#f97316", highlight: false },
  { icon: "📱", title: "Passwordless Driver Gate Token Dispatched", sub: "Secure 72-hour cryptographic link sent via SMS / WhatsApp", date: "Day 4 · Truck Chassis Assigned", color: "#a78bfa", highlight: false },
  { icon: "🚛", title: "Verified Gate-Out & Zero Penalty Accrued", sub: "₹1,45,000 in cascading demurrage & ground rent completely prevented", date: "Day 4 · Gate Cleared", color: "#34d399", highlight: false },
];

export default function JourneyTimeline() {
  const [visible, setVisible] = useState(0);
  const [activeStep, setActiveStep] = useState<number>(3);
  const ref = useRef<HTMLElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          STEPS.forEach((_, i) => {
            setTimeout(() => setVisible((v) => Math.max(v, i + 1)), i * 200);
          });
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={ref}
      style={{
        backgroundColor: "rgba(6, 10, 18, 0.7)",
        backdropFilter: "blur(8px)",
        padding: "96px 24px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div
            style={{
              display: "inline-block",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 100,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "rgba(232,232,240,0.45)",
              textTransform: "uppercase" as const,
              marginBottom: 16,
            }}
          >
            Container Journey Lifecycle
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
            How DemurrageOS Prevents{" "}
            <span style={{ color: "#f59e0b" }}>Cascading Port Clearance Bleed</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(232,232,240,0.45)", lineHeight: 1.7, maxWidth: 640, margin: "0 auto" }}>
            From vessel discharge to final gate-out: see how automated dual-clock surveillance shields importers from ₹1,45,000+ in overlapping shipping line detention and CFS ground rent penalties.
          </p>
        </div>

        {/* 2-Column Grid: Left = Timeline, Right = Interactive Multi-Modal Route Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Timeline Steps */}
          <div className="lg:col-span-7">
            <div style={{ position: "relative", paddingLeft: 36 }}>
              {/* Spine */}
              <div
                style={{
                  position: "absolute",
                  left: 11,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {STEPS.map((step, i) => {
                  const isSelected = activeStep === i;
                  return (
                    <div
                      key={i}
                      onClick={() => setActiveStep(i)}
                      style={{
                        position: "relative",
                        opacity: visible > i ? 1 : 0,
                        transform: visible > i ? "translateY(0)" : "translateY(12px)",
                        transition: "opacity 0.4s ease, transform 0.4s ease",
                        cursor: "pointer",
                      }}
                    >
                      {/* Dot */}
                      <div
                        style={{
                          position: "absolute",
                          left: -36 + 5,
                          top: 16,
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: step.color,
                          border: "2px solid #0a0a0f",
                          boxShadow: step.highlight || isSelected ? `0 0 12px ${step.color}` : "none",
                          zIndex: 1,
                        }}
                      />

                      <div
                        style={{
                          border: isSelected 
                            ? `1px solid ${step.color}` 
                            : step.highlight 
                            ? `1px solid ${step.color}50` 
                            : "1px solid rgba(255,255,255,0.07)",
                          borderRadius: 12,
                          padding: "16px 20px",
                          background: isSelected
                            ? `linear-gradient(135deg, ${step.color}15 0%, rgba(255,255,255,0.03) 100%)`
                            : step.highlight
                            ? `linear-gradient(135deg, ${step.color}08 0%, rgba(255,255,255,0.01) 100%)`
                            : "rgba(255,255,255,0.02)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {step.highlight && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                backgroundColor: step.color,
                                animation: "pulse2 1.5s infinite",
                              }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase" as const,
                                color: step.color,
                              }}
                            >
                              Fallback Event — Clock 2 Starts
                            </span>
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 18 }}>{step.icon}</span>
                              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
                                {step.title}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: "rgba(232,232,240,0.45)", marginTop: 4 }}>
                              {step.sub}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "rgba(232,232,240,0.3)",
                              whiteSpace: "nowrap" as const,
                              flexShrink: 0,
                            }}
                          >
                            {step.date}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Multi-Modal Terminal & Highway Flow Visualizer */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="rounded-2xl border border-slate-700/80 bg-[#09101d]/90 backdrop-blur-xl p-4 shadow-2xl space-y-4">
              
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                    Multi-Modal Corridor Telemetry
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800">
                  JNPT NHAVA SHEVA
                </span>
              </div>

              {/* Visual Map Frame */}
              <div className="relative rounded-xl overflow-hidden border border-slate-700/70 h-64 sm:h-72 w-full group">
                <img
                  src="/images/port-multimodal-tiltshift.jpg"
                  alt="JNPT Multimodal Terminal and Highway Logistics Route"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09101d] via-[#09101d]/30 to-transparent" />

                {/* Interactive Sector Overlay Badges */}
                <div className="absolute top-3 left-3 bg-[#070c16]/90 border border-slate-700 px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 backdrop-blur-sm">
                  <span>ACTIVE SECTOR: </span>
                  <strong className="text-amber-400">
                    {activeStep <= 1 
                      ? "QUAY BERTH 03 (DISCHARGE)" 
                      : activeStep === 2 
                      ? "DPD GATE BUFFER (48H)" 
                      : activeStep <= 4 
                      ? "SPEEDY CFS OFF-DOCK YARD" 
                      : "NH4B HIGHWAY DISPATCH"}
                  </strong>
                </div>

                {/* Spatial Indicators */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono bg-[#070c16]/95 border border-slate-700/80 p-2.5 rounded-lg backdrop-blur-md">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase">Container Standard</div>
                    <div className="text-white font-bold">40&apos; HC IMPORT UNIT</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] text-slate-400 uppercase">Route Distance</div>
                    <div className="text-slate-200 font-semibold">14.2 km to CFS</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-slate-400 uppercase">Dual Status</div>
                    <div className="text-rose-400 font-bold">
                      {activeStep >= 3 ? "2 Clocks Running" : "1 Clock Active"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanatory Sector Steps Switcher */}
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setActiveStep(0)}
                  className={`p-2 rounded border transition-colors cursor-pointer ${
                    activeStep <= 1 
                      ? "bg-blue-600/30 border-blue-500 text-blue-300 font-bold" 
                      : "bg-[#060b14] border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  1. Quay
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className={`p-2 rounded border transition-colors cursor-pointer ${
                    activeStep === 2 
                      ? "bg-amber-600/30 border-amber-500 text-amber-300 font-bold" 
                      : "bg-[#060b14] border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  2. DPD Gate
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className={`p-2 rounded border transition-colors cursor-pointer ${
                    activeStep >= 3 && activeStep <= 4
                      ? "bg-rose-600/30 border-rose-500 text-rose-300 font-bold" 
                      : "bg-[#060b14] border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  3. CFS Yard
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(5)}
                  className={`p-2 rounded border transition-colors cursor-pointer ${
                    activeStep >= 5 
                      ? "bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold" 
                      : "bg-[#060b14] border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  4. Highway
                </button>
              </div>

              {/* Total Financial Summary */}
              <div className="p-3.5 rounded-xl bg-[#060b14] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-mono text-slate-400">Preventable Exposure Evaded</div>
                  <div className="text-xl font-black text-amber-400 font-mono">₹1,45,000 / Box</div>
                  <div className="text-[11px] text-slate-400">₹85,000 avoidable with timely DPD trucker handoff</div>
                </div>
                <Link
                  href="/login"
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow font-mono"
                >
                  Authorize Portal &rarr;
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes pulse2 {
          0%, 100% { opacity: 1; box-shadow: 0 0 4px currentColor; }
          50% { opacity: 0.4; box-shadow: none; }
        }
      `}</style>
    </section>
  );
}
