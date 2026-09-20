"use client";

import React, { useState } from "react";
import { formatINR } from "@/lib/utils";
import { 
  Building, 
  Ship, 
  Clock, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  SlidersHorizontal 
} from "lucide-react";

interface CarrierTariff {
  line: string;
  freeDaysStandard: number;
  freeDaysAEO: number;
  slab1: { days: string; rateINR: number };
  slab2: { days: string; rateINR: number };
}

interface CfsEntity {
  name: string;
  port: string;
  code: string;
  freeDays: number;
  groundRentDailyINR: number;
  shiftingChargeINR: number;
}

const CARRIER_TARIFFS: CarrierTariff[] = [
  {
    line: "Maersk Line India",
    freeDaysStandard: 5,
    freeDaysAEO: 10,
    slab1: { days: "Days 1 - 5 overdue", rateINR: 14000 },
    slab2: { days: "Days 6+ overdue", rateINR: 22000 },
  },
  {
    line: "MSC Mediterranean Shipping",
    freeDaysStandard: 7,
    freeDaysAEO: 14,
    slab1: { days: "Days 1 - 7 overdue", rateINR: 11000 },
    slab2: { days: "Days 8+ overdue", rateINR: 19500 },
  },
  {
    line: "CMA CGM India",
    freeDaysStandard: 5,
    freeDaysAEO: 10,
    slab1: { days: "Days 1 - 5 overdue", rateINR: 13500 },
    slab2: { days: "Days 6+ overdue", rateINR: 21000 },
  },
];

const CFS_ENTITIES: CfsEntity[] = [
  {
    name: "Speedy CFS Terminal 2",
    port: "Nhava Sheva (JNPT)",
    code: "INNSA-CFS-SPD",
    freeDays: 3,
    groundRentDailyINR: 15000,
    shiftingChargeINR: 12000,
  },
  {
    name: "Sattva CFS Ponneri",
    port: "Chennai Port (CITPL)",
    code: "INMAA-CFS-SAT",
    freeDays: 3,
    groundRentDailyINR: 7500,
    shiftingChargeINR: 8500,
  },
  {
    name: "JWC CFS Logistics Park",
    port: "Nhava Sheva (BMCT)",
    code: "INNSA-CFS-JWC",
    freeDays: 3,
    groundRentDailyINR: 10000,
    shiftingChargeINR: 9000,
  },
];

export default function TariffsAndSettingsPage() {
  const [tab, setTab] = useState<"CARRIERS" | "CFS">("CARRIERS");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Master Configuration
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
          Tariff Engine &amp; CFS Directory
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Deterministic two-clock rate cards, free-time policies, and port-specific CFS directory
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10">
        <button
          onClick={() => setTab("CARRIERS")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            tab === "CARRIERS"
              ? "border-amber-600 dark:border-amber-500 text-amber-800 dark:text-amber-400 font-bold"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Ship className="w-4 h-4" />
          <span>Carrier Demurrage Tariffs</span>
        </button>

        <button
          onClick={() => setTab("CFS")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            tab === "CFS"
              ? "border-amber-600 dark:border-amber-500 text-amber-800 dark:text-amber-400 font-bold"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>CFS Ground Rent Directory</span>
        </button>
      </div>

      {/* Carrier Tariffs */}
      {tab === "CARRIERS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CARRIER_TARIFFS.map((t) => (
              <div
                key={t.line}
                className="bg-white dark:bg-[#0c1424] rounded-xl border border-slate-200 dark:border-white/5 p-5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-amber-400 block">
                    Shipping Line
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{t.line}</h3>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-slate-100 dark:border-white/5">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Standard Free</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-bold">{t.freeDaysStandard} Days</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">AEO Privilege</span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{t.freeDaysAEO} Days</strong>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Escalating Daily Slabs
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <span className="text-slate-700 dark:text-slate-300">{t.slab1.days}</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      ₹{t.slab1.rateINR.toLocaleString("en-IN")}/day
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                    <span className="text-slate-700 dark:text-slate-300">{t.slab2.days}</span>
                    <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                      ₹{t.slab2.rateINR.toLocaleString("en-IN")}/day
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CFS Directory */}
      {tab === "CFS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CFS_ENTITIES.map((cfs) => (
              <div
                key={cfs.code}
                className="bg-white dark:bg-[#0c1424] rounded-xl border border-slate-200 dark:border-white/5 p-5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>{cfs.port}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{cfs.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Code: {cfs.code}</span>
                </div>

                <div className="space-y-2 text-xs bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Free Time Upon Gate-In</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-bold">{cfs.freeDays} Calendar Days</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Ground Rent Daily Tier</span>
                    <strong className="font-mono text-rose-600 dark:text-rose-400">
                      ₹{cfs.groundRentDailyINR.toLocaleString("en-IN")}/day
                    </strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-white/10">
                    <span className="text-slate-600 dark:text-slate-400">Port Shifting Fee (Audit Target)</span>
                    <strong className="font-mono text-purple-700 dark:text-purple-400">
                      ₹{cfs.shiftingChargeINR.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
