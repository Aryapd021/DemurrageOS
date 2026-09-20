"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Box, Calculator, ArrowRight, Check } from "lucide-react";

type ContainerType = "20DC" | "40DC" | "40HC";
type DeliveryMode = "DPD" | "CFS";

interface SpecData {
  name: string;
  typeCode: string;
  length: string;
  width: string;
  height: string;
  capacity: string;
  tareWeight: string;
  maxPayload: string;
  bestFor: string;
  svgLength: number;
  svgHeight: number;
}

const CONTAINER_SPECS: Record<ContainerType, SpecData> = {
  "20DC": {
    name: "Standard 20 DC",
    typeCode: "20' General Purpose",
    length: "5.90 m (19' 4\")",
    width: "2.35 m (7' 8\")",
    height: "2.39 m (7' 10\")",
    capacity: "33.2 m³",
    tareWeight: "2,230 kg",
    maxPayload: "28,250 kg",
    bestFor: "Heavy dense goods, minerals, chemicals, auto parts",
    svgLength: 220,
    svgHeight: 110,
  },
  "40DC": {
    name: "Standard 40 DC",
    typeCode: "40' General Purpose",
    length: "12.03 m (39' 5\")",
    width: "2.35 m (7' 8\")",
    height: "2.39 m (7' 10\")",
    capacity: "67.7 m³",
    tareWeight: "3,750 kg",
    maxPayload: "26,730 kg",
    bestFor: "General consumer goods, textiles, industrial equipment",
    svgLength: 360,
    svgHeight: 110,
  },
  "40HC": {
    name: "High Cube 40 HC",
    typeCode: "40' High Cube",
    length: "12.03 m (39' 5\")",
    width: "2.35 m (7' 8\")",
    height: "2.70 m (8' 10\")",
    capacity: "76.3 m³",
    tareWeight: "3,900 kg",
    maxPayload: "26,580 kg",
    bestFor: "Light voluminous cargo, consumer electronics, furniture",
    svgLength: 360,
    svgHeight: 130,
  },
};

const PORT_TARIFFS: Record<string, { baseFreeDays: number; cfsRatePerDay: number }> = {
  "INJAV - JNPT Nhava Sheva": { baseFreeDays: 5, cfsRatePerDay: 1800 },
  "INMUN - Mundra APSEZ": { baseFreeDays: 4, cfsRatePerDay: 2200 },
  "INMAA - Chennai Port": { baseFreeDays: 5, cfsRatePerDay: 1650 },
};

const CARRIERS = [
  { name: "Maersk Line", tier1Rate: 3800, tier2Rate: 7500 },
  { name: "MSC", tier1Rate: 3500, tier2Rate: 7200 },
  { name: "CMA CGM", tier1Rate: 3900, tier2Rate: 8000 },
  { name: "Hapag-Lloyd", tier1Rate: 4100, tier2Rate: 8200 },
];

export default function ContainerSpecsCalculator() {
  const [selectedType, setSelectedType] = useState<ContainerType>("20DC");
  const [viewMode, setViewMode] = useState<"render" | "sling" | "schematic">("render");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("DPD");
  const [selectedPort, setSelectedPort] = useState("INJAV - JNPT Nhava Sheva");
  const [selectedCarrier, setSelectedCarrier] = useState("Maersk Line");
  const [containerCount, setContainerCount] = useState(2);
  const [overdueDays, setOverdueDays] = useState(4);

  const spec = CONTAINER_SPECS[selectedType];
  const portInfo = PORT_TARIFFS[selectedPort] || PORT_TARIFFS["INJAV - JNPT Nhava Sheva"];
  const carrierInfo = CARRIERS.find((c) => c.name === selectedCarrier) || CARRIERS[0];

  const multiplier = selectedType === "20DC" ? 1 : 2;
  const carrierDemurragePerBox = overdueDays <= 3 
    ? overdueDays * carrierInfo.tier1Rate * multiplier
    : (3 * carrierInfo.tier1Rate * multiplier) + ((overdueDays - 3) * carrierInfo.tier2Rate * multiplier);

  const cfsGroundRentPerBox = deliveryMode === "CFS"
    ? (overdueDays + 2) * portInfo.cfsRatePerDay * multiplier
    : overdueDays > 2 ? (overdueDays - 2) * portInfo.cfsRatePerDay * multiplier : 0;

  const totalCarrierDemurrage = carrierDemurragePerBox * containerCount;
  const totalCfsRent = cfsGroundRentPerBox * containerCount;
  const totalExposure = totalCarrierDemurrage + totalCfsRent;

  return (
    <section id="interactive-specs" className="py-20 bg-[#060a12]/75 backdrop-blur-md text-slate-200 border-t border-slate-800/80 select-none">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Title */}
        <div className="max-w-2xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0f172a] border border-[#1e293b] text-xs font-semibold uppercase tracking-wider text-amber-500 mb-3">
            <Box className="w-3.5 h-3.5" />
            <span>ISO Container Specifications &amp; Tariff Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Container Types &amp; Demurrage Calculator
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
            Verify standard tare dimensions and simulate combined carrier demurrage and CFS ground rent across Indian port tariffs.
          </p>
        </div>

        {/* Top: Clean Spec Selector + Native Vector Wireframe */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Spec details (7 cols) */}
          <div className="lg:col-span-7 bg-[#0b1325] border border-[#1e293b] rounded-xl p-6 flex flex-col justify-between">
            <div>
              {/* Type toggle */}
              <div className="flex items-center gap-2 pb-5 border-b border-[#1e293b]">
                {(["20DC", "40DC", "40HC"] as ContainerType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      selectedType === t
                        ? "bg-[#b45309] text-white shadow-sm"
                        : "bg-[#0f172a] text-slate-400 hover:text-white"
                    }`}
                  >
                    {t === "20DC" ? "20' Standard" : t === "40DC" ? "40' Standard" : "40' High Cube"}
                  </button>
                ))}
              </div>

              {/* Active container metrics */}
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{spec.name}</h3>
                  <div className="text-xs text-amber-500 font-mono mt-0.5">{spec.typeCode}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Max Payload</div>
                  <div className="text-xs font-bold text-slate-200">{spec.maxPayload}</div>
                </div>
              </div>

              {/* 4 spec boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
                <div className="bg-[#0e182f] p-3 rounded-lg border border-[#1e293b]">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Length</div>
                  <div className="text-xs font-bold text-white mt-0.5">{spec.length}</div>
                </div>
                <div className="bg-[#0e182f] p-3 rounded-lg border border-[#1e293b]">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Width</div>
                  <div className="text-xs font-bold text-white mt-0.5">{spec.width}</div>
                </div>
                <div className="bg-[#0e182f] p-3 rounded-lg border border-[#1e293b]">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Height</div>
                  <div className="text-xs font-bold text-white mt-0.5">{spec.height}</div>
                </div>
                <div className="bg-[#0e182f] p-3 rounded-lg border border-[#1e293b]">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Volume</div>
                  <div className="text-xs font-bold text-white mt-0.5">{spec.capacity}</div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-[#0e182f] border border-[#1e293b] text-xs text-slate-300">
                <span className="font-semibold text-white">Recommended Cargo: </span>
                {spec.bestFor}
              </div>
            </div>

            {/* Delivery condition toggle */}
            <div className="mt-6 pt-5 border-t border-[#1e293b]">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                Delivery Routing Mode
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryMode("DPD")}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    deliveryMode === "DPD"
                      ? "bg-[#b45309]/15 border-[#b45309] text-white"
                      : "bg-[#0e182f] border-[#1e293b] text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Direct Port Delivery (DPD)</span>
                    {deliveryMode === "DPD" && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">48-hour terminal exit window.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMode("CFS")}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    deliveryMode === "CFS"
                      ? "bg-[#b45309]/15 border-[#b45309] text-white"
                      : "bg-[#0e182f] border-[#1e293b] text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>CFS En-Route Handover</span>
                    {deliveryMode === "CFS" && <Check className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Off-dock yard destuffing.</p>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Visual Blueprint & Render Showcase (5 cols) */}
          <div className="lg:col-span-5 bg-[#0b1325] border border-[#1e293b] rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                <span>Visual Architecture</span>
                <span className="text-[10px] font-mono text-amber-500 font-bold">{spec.typeCode}</span>
              </div>

              {/* View mode buttons */}
              <div className="flex items-center gap-1.5 p-1 bg-[#070d1a] border border-[#1e293b] rounded-lg mb-3">
                <button
                  type="button"
                  onClick={() => setViewMode("render")}
                  className={`flex-1 py-1 px-2 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                    viewMode === "render"
                      ? "bg-amber-600/30 text-amber-400 border border-amber-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Yard Stack
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("sling")}
                  className={`flex-1 py-1 px-2 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                    viewMode === "sling"
                      ? "bg-amber-600/30 text-amber-400 border border-amber-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Crane Sling
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("schematic")}
                  className={`flex-1 py-1 px-2 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                    viewMode === "schematic"
                      ? "bg-amber-600/30 text-amber-400 border border-amber-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Schematic
                </button>
              </div>

              {/* Visual Display Frame */}
              <div className="h-60 bg-[#070d1a] border border-[#1e293b] rounded-xl relative overflow-hidden group">
                {viewMode === "render" ? (
                  <div className="w-full h-full relative">
                    <img
                      src="/images/container-stack-dark-orange.jpg"
                      alt="Modern Stacked Shipping Containers with Highlighted Unit"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070d1a] via-transparent to-transparent" />
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono bg-[#070c16]/90 border border-slate-700/80 p-2 rounded backdrop-blur-sm">
                      <span className="text-amber-400 font-bold">ACTIVE UNIT HIGHLIGHT</span>
                      <span className="text-slate-300">Payload: {spec.maxPayload}</span>
                    </div>
                  </div>
                ) : viewMode === "sling" ? (
                  <div className="w-full h-full relative">
                    <img
                      src="/images/container-hoist-sling-white.jpg"
                      alt="Suspended White Shipping Container on Crane Hoist Slings"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070d1a] via-transparent to-transparent" />
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono bg-[#070c16]/90 border border-slate-700/80 p-2 rounded backdrop-blur-sm">
                      <span className="text-emerald-400 font-bold">SLING TENSION OK</span>
                      <span className="text-slate-300">Tare: {spec.tareWeight}</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <svg viewBox="0 0 400 200" className="w-full h-full">
                      {/* Container 3D wireframe isometric outline */}
                      <rect x="40" y="50" width={spec.svgLength} height={spec.svgHeight} rx="4" fill="#0d1b33" stroke="#b45309" strokeWidth="2" />
                      {/* Corrugation lines */}
                      {Array.from({ length: 9 }).map((_, i) => (
                        <line
                          key={i}
                          x1={55 + i * (spec.svgLength / 10)}
                          y1="54"
                          x2={55 + i * (spec.svgLength / 10)}
                          y2={46 + spec.svgHeight}
                          stroke="#1e293b"
                          strokeWidth="2"
                        />
                      ))}
                      {/* Corner casting brackets */}
                      <rect x="40" y="50" width="12" height="12" fill="#b45309" />
                      <rect x={28 + spec.svgLength} y="50" width="12" height="12" fill="#b45309" />
                      <rect x="40" y={38 + spec.svgHeight} width="12" height="12" fill="#b45309" />
                      <rect x={28 + spec.svgLength} y={38 + spec.svgHeight} width="12" height="12" fill="#b45309" />

                      {/* Clean Technical Dimension Labels */}
                      <text x={40 + spec.svgLength / 2} y="38" fill="#94a3b8" fontSize="11" textAnchor="middle" fontFamily="monospace">
                        {spec.length}
                      </text>
                      <text x={34 + spec.svgLength} y={50 + spec.svgHeight / 2} fill="#94a3b8" fontSize="11" textAnchor="start" fontFamily="monospace" dominantBaseline="middle">
                        {spec.height}
                      </text>
                      <text x={40 + spec.svgLength / 2} y={50 + spec.svgHeight / 2} fill="#e2e8f0" fontSize="13" fontWeight="bold" textAnchor="middle">
                        DemurrageOS · {spec.name}
                      </text>
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>ISO 668 Standard Specification</span>
              <Link href="/dashboard" className="text-amber-500 hover:text-amber-400 font-semibold inline-flex items-center gap-1">
                Open Live Core <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom: Clean Demurrage Calculator */}
        <div className="bg-[#0b1325] border border-[#1e293b] rounded-xl p-6">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[#1e293b]">
            <Calculator className="w-4 h-4 text-amber-500" />
            <h3 className="text-base font-bold text-white">Live Port Demurrage &amp; CFS Exposure Estimator</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1.5">
                Discharge Gateway Port
              </label>
              <select
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#1e293b] text-white text-xs rounded-lg p-2.5 focus:border-amber-500 focus:outline-none"
              >
                {Object.keys(PORT_TARIFFS).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1.5">
                Ocean Shipping Line
              </label>
              <select
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#1e293b] text-white text-xs rounded-lg p-2.5 focus:border-amber-500 focus:outline-none"
              >
                {CARRIERS.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1.5">
                Container Count (TEUs)
              </label>
              <div className="flex items-center bg-[#0f172a] border border-[#1e293b] rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setContainerCount((c) => Math.max(1, c - 1))}
                  className="px-3 py-2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  -
                </button>
                <div className="flex-1 text-center text-xs font-bold text-white">
                  {containerCount} {containerCount === 1 ? "Box" : "Boxes"}
                </div>
                <button
                  type="button"
                  onClick={() => setContainerCount((c) => Math.min(20, c + 1))}
                  className="px-3 py-2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1.5">
                Days Past Free-Time: <span className="text-amber-500 font-bold">{overdueDays} Days</span>
              </label>
              <input
                type="range"
                min="0"
                max="14"
                value={overdueDays}
                onChange={(e) => setOverdueDays(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer h-2 bg-[#1e293b] rounded-lg mt-2"
              />
            </div>
          </div>

          {/* Result summary banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-[#070d1a] border border-[#1e293b]">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Carrier Demurrage</div>
              <div className="text-xl font-bold text-rose-400 mt-0.5">
                ₹{totalCarrierDemurrage.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">CFS Ground Rent</div>
              <div className="text-xl font-bold text-amber-500 mt-0.5">
                ₹{totalCfsRent.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Financial Exposure</div>
              <div className="text-xl font-extrabold text-white mt-0.5">
                ₹{totalExposure.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
