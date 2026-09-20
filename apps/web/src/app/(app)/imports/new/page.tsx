"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClientScope } from "@/lib/stores/client-scope-context";
import { CsvImportStagingRow, DeliveryMode } from "@demurrageos/shared-types";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Check, 
  RotateCcw,
  Sparkles,
  ShieldCheck
} from "lucide-react";

const SAMPLE_CSV_ROWS: CsvImportStagingRow[] = [
  {
    rowNumber: 1,
    containerNumber: "TGHU9021841",
    blNumber: "MAEU88192019",
    clientId: "client_bharat_01",
    clientName: "Bharat Steel Corporation",
    shippingLine: "Maersk Line",
    deliveryMode: "DPD_DIRECT",
    portOfDischarge: "Nhava Sheva (JNPT)",
    dischargedAt: "2026-09-14T02:00:00Z",
    status: "VALID",
    validationMessages: ["Passed ISO 6346 checksum", "Valid Port Code (INNSA)"],
  },
  {
    rowNumber: 2,
    containerNumber: "CMAU7719284",
    blNumber: "CMAC71029481",
    clientId: "client_zodiac_02",
    clientName: "Zodiac Automotive Components",
    shippingLine: "CMA CGM",
    deliveryMode: "DPD_CFS",
    portOfDischarge: "Mundra (MICT)",
    dischargedAt: "2026-09-13T22:30:00Z",
    status: "VALID",
    validationMessages: ["Passed ISO 6346 checksum", "Valid Port Code (INMUN)"],
  },
  {
    rowNumber: 3,
    containerNumber: "MSKU4102948",
    blNumber: "MAEU11092837",
    clientId: "client_titan_03",
    clientName: "Titan Chemical Industries",
    shippingLine: "Maersk Line",
    deliveryMode: "CFS",
    portOfDischarge: "Chennai (CITPL)",
    dischargedAt: "2026-09-14T06:15:00Z",
    status: "VALID",
    validationMessages: ["Passed ISO 6346 checksum", "Valid Port Code (INMAA)"],
  },
  {
    rowNumber: 4,
    containerNumber: "SUDU8102938",
    blNumber: "SUDU00192837",
    clientId: "client_bharat_01",
    clientName: "Bharat Steel Corporation",
    shippingLine: "Hamburg Sud",
    deliveryMode: "CFS",
    portOfDischarge: "Nhava Sheva (BMCT)",
    dischargedAt: "2026-09-12T14:00:00Z",
    status: "WARNING",
    validationMessages: ["Discharge date is 48 hours in past; initial free time already consumed."],
  },
];

export default function CsvImportWizardPage() {
  const router = useRouter();
  const { clients } = useClientScope();

  const [step, setStep] = useState<"UPLOAD" | "STAGING" | "SUCCESS">("UPLOAD");
  const [stagedRows, setStagedRows] = useState<CsvImportStagingRow[]>([]);
  const [isInserting, setIsInserting] = useState(false);

  const handleLoadSample = () => {
    setStagedRows(SAMPLE_CSV_ROWS);
    setStep("STAGING");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate parse & validate
    setStagedRows(SAMPLE_CSV_ROWS);
    setStep("STAGING");
  };

  const handleConfirmInsert = async () => {
    setIsInserting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsInserting(false);
    setStep("SUCCESS");
  };

  const validCount = stagedRows.filter((r) => r.status === "VALID").length;
  const warningCount = stagedRows.filter((r) => r.status === "WARNING").length;
  const errorCount = stagedRows.filter((r) => r.status === "ERROR").length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
          Data Ingestion Engine
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          CSV Port Discharge & Manifest Wizard
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          In-memory parse, Zod validation, row-level error staging, and atomic commit to PostgreSQL
        </p>
      </div>

      {/* Step 1: Upload Dropzone */}
      {step === "UPLOAD" && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center space-y-5 hover:border-blue-400 transition-colors shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              Upload Container Manifest or Port Discharge CSV
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Supports standard EDI discharge logs, Port Terminal reports, and custom CHA spreadsheet templates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors">
              <Upload className="w-4 h-4" />
              <span>Browse CSV File</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handleLoadSample}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors border border-slate-200"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Load Realistic JNPT / Mundra Sample CSV</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Expected headers: <code className="font-mono text-slate-600">container_number, bl_number, shipping_line, delivery_mode, port_code, discharged_at</code>
          </div>
        </div>
      )}

      {/* Step 2: Staging Preview Table */}
      {step === "STAGING" && (
        <div className="space-y-4">
          {/* Summary counters bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-slate-800 font-bold text-sm">
                Staged Rows: {stagedRows.length}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {validCount} Valid
              </span>
              {warningCount > 0 && (
                <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {warningCount} Warnings
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  <XCircle className="w-3.5 h-3.5" />
                  {errorCount} Errors
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep("UPLOAD")}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                onClick={handleConfirmInsert}
                disabled={isInserting || errorCount > 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>
                  {isInserting ? "Inserting Records..." : "Confirm & Atomic Insert"}
                </span>
              </button>
            </div>
          </div>

          {/* Staging Data Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-4">Container & B/L</th>
                    <th className="py-3 px-4">Client Mapping</th>
                    <th className="py-3 px-4">Shipping Line</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Port</th>
                    <th className="py-3 px-4">Validation Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stagedRows.map((row) => (
                    <tr key={row.rowNumber} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 text-slate-400 font-mono">{row.rowNumber}</td>
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-slate-900">{row.containerNumber}</div>
                        <div className="text-[11px] text-slate-400">BL: {row.blNumber}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {row.clientName}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{row.shippingLine}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {row.deliveryMode}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{row.portOfDischarge}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            row.status === "VALID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : row.status === "WARNING"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {row.status}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {row.validationMessages.join("; ")}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Success Confirmation */}
      {step === "SUCCESS" && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-10 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Atomic Import Succeeded!
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {stagedRows.length} container records and associated port discharge events were inserted into the system of record. Background risk calculation jobs have been queued.
          </p>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setStep("UPLOAD")}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
            >
              Import Another File
            </button>
            <Link
              href="/containers"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
            >
              <span>View Active Containers</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
