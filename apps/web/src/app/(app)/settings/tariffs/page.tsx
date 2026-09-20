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
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
          Master Configuration
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Tariff Engine & CFS Directory
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Deterministic two-clock rate cards, free-time policies, and port-specific CFS directory
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab("CARRIERS")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            tab === "CARRIERS"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Ship className="w-4 h-4" />
          <span>Carrier Demurrage Tariffs</span>
        </button>

        <button
          onClick={() => setTab("CFS")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            tab === "CFS"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
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
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 block">
                    Shipping Line
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{t.line}</h3>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Standard Free</span>
                    <strong className="text-slate-800">{t.freeDaysStandard} Days</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">AEO Privilege</span>
                    <strong className="text-emerald-700">{t.freeDaysAEO} Days</strong>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">
                    Escalating Daily Slabs
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50">
                    <span className="text-slate-600">{t.slab1.days}</span>
                    <span className="font-mono font-bold text-rose-600">
                      ₹{t.slab1.rateINR.toLocaleString("en-IN")}/day
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-rose-50/50">
                    <span className="text-slate-600">{t.slab2.days}</span>
                    <span className="font-mono font-bold text-rose-700">
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
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cfs.port}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{cfs.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400">Code: {cfs.code}</span>
                </div>

                <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Free Time Upon Gate-In</span>
                    <strong className="text-slate-800">{cfs.freeDays} Calendar Days</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Ground Rent Daily Tier</span>
                    <strong className="font-mono text-rose-600">
                      ₹{cfs.groundRentDailyINR.toLocaleString("en-IN")}/day
                    </strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Port Shifting Fee (Audit Target)</span>
                    <strong className="font-mono text-purple-700">
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
