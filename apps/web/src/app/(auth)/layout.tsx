import type { Metadata } from "next";
import Link from "next/link";
import { Anchor, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "CHA Portal Access — DemurrageOS",
  description: "Secure terminal workspace for Customs House Agents and freight handlers.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#070c16] text-[#e2e8f0] flex flex-col lg:flex-row antialiased select-none font-sans">
      {/* Left visual column featuring the cinematic video */}
      <div className="relative lg:w-6/12 xl:w-7/12 flex flex-col justify-between p-8 sm:p-12 overflow-hidden border-b lg:border-b-0 lg:border-r border-[#1e293b] bg-[#070c16]">
        
        {/* Background video */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover object-center opacity-55"
          >
            <source src="/videos/landing-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#070c16] via-[#070c16]/75 to-[#070c16]/45" />
        </div>

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2.5 text-white no-underline group">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow">
              D
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white group-hover:text-amber-400 transition-colors">
                DemurrageOS
              </span>
              <span className="ml-2 text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-[#1e293b] text-slate-300 border border-[#334155]">
                Customs Gateway
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded bg-[#0f172a]/90 border border-[#1e293b] text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>JNPT · Mundra · Chennai Active</span>
          </div>
        </div>

        {/* Center narrative */}
        <div className="relative z-10 max-w-lg my-12 lg:my-auto">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-[#334155] bg-[#0f172a]/90 text-[11px] font-medium text-amber-500 mb-4">
            <Anchor className="w-3.5 h-3.5" />
            <span>CHA Operational Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4">
            Zero Overdue Clocks.
            <br />
            <span className="text-[#d97706]">Complete Tariff Control.</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            The dedicated operating system engineered for licensed Indian Customs Brokers. Unify container discharge ETA, two-clock financial exposure, and automated driver dispatch in one verified workspace.
          </p>

          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#1e293b]">
            <div className="bg-[#0b1324]/80 p-3 rounded-xl border border-[#1e293b]">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tracked Ports</div>
              <div className="text-sm font-bold text-white mt-0.5">JNPT · Mundra · MAA</div>
            </div>
            <div className="bg-[#0b1324]/80 p-3 rounded-xl border border-[#1e293b]">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Saved Exposure</div>
              <div className="text-sm font-bold text-amber-500 mt-0.5">₹18.4 Lakhs</div>
            </div>
            <div className="bg-[#0b1324]/80 p-3 rounded-xl border border-[#1e293b]">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Boxes</div>
              <div className="text-sm font-bold text-white mt-0.5">27 Monitored</div>
            </div>
          </div>

          {/* Customs Field Inspection & Gate-Pass Telemetry Preview */}
          <div className="mt-5 p-3 rounded-xl bg-[#0a1120]/90 border border-slate-800 backdrop-blur-md flex items-center gap-3.5">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-700">
              <img
                src="/images/customs-inspector-gantry.jpg"
                alt="Port Customs Inspector at Gantry Crane"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1120]/80 to-transparent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ICEGATE EDI Verified
                </span>
                <span className="text-[9px] font-mono text-slate-400">BE: 8941029</span>
              </div>
              <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                Field Inspection &amp; Gate-Out Pass Clear
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                Direct Port Delivery (DPD) 48-Hour Protocol Active
              </p>
            </div>
          </div>
        </div>

        {/* Bottom endorsement */}
        <div className="relative z-10 pt-4 flex items-center gap-2.5 text-xs text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Used daily by licensed Custom House Agents managing Nhava Sheva &amp; Adani Mundra consignments.</span>
        </div>
      </div>

      {/* Right form column */}
      <div className="lg:w-6/12 xl:w-5/12 flex flex-col justify-center p-6 sm:p-10 lg:p-14 bg-[#070c16]">
        <div className="w-full max-w-md mx-auto">
          {children}

          {/* Footer note */}
          <p className="mt-8 pt-6 border-t border-[#1e293b] text-center text-xs text-slate-500">
            DemurrageOS CHA Gateway ·{" "}
            <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
              Terms
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
