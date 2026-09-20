"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useContainer } from "@/lib/hooks/use-containers";
import { useDocuments, useUpdateDocumentField, useAcceptDocument } from "@/lib/hooks/use-documents";
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Edit2, 
  Check, 
  Eye, 
  FileCheck,
  ShieldAlert
} from "lucide-react";
import { DocumentRecord } from "@demurrageos/shared-types";

export default function DocumentViewerPage() {
  const params = useParams();
  const containerId = params?.containerId as string;
  const { data: container } = useContainer(containerId);
  const { data: documents = [], isLoading } = useDocuments(containerId);
  const updateFieldMutation = useUpdateDocumentField();
  const acceptDocMutation = useAcceptDocument();

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [acceptedNotice, setAcceptedNotice] = useState<string | null>(null);

  const activeDoc: DocumentRecord | undefined =
    documents.find((d) => d.id === selectedDocId) || documents[0];

  const handleStartEdit = (key: string, currentValue: any) => {
    setEditingFieldKey(key);
    setEditValue(String(currentValue));
  };

  const handleSaveEdit = async (docId: string, fieldKey: string) => {
    if (!editingFieldKey) return;
    await updateFieldMutation.mutateAsync({
      documentId: docId,
      fieldKey,
      newValue: editValue,
    });
    setEditingFieldKey(null);
  };

  const handleAcceptDocument = async (docId: string) => {
    await acceptDocMutation.mutateAsync(docId);
    setAcceptedNotice(`Document fields verified and committed to PostgreSQL authoritative record!`);
    setTimeout(() => setAcceptedNotice(null), 4000);
  };

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400">Loading parsed documents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/containers/${containerId}`}
            className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Human-in-the-Loop Document Verification
            </div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>{container?.containerNumber || "Container"}</span>
              <span className="text-slate-400 font-normal text-sm">Parsed Trade Documents</span>
            </h1>
          </div>
        </div>

        {activeDoc && activeDoc.status !== "REVIEWED" && (
          <button
            onClick={() => handleAcceptDocument(activeDoc.id)}
            disabled={acceptDocMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            <span>Accept & Commit to System of Record</span>
          </button>
        )}
      </div>

      {acceptedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg p-3 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{acceptedNotice}</span>
        </div>
      )}

      {/* Main Side-by-Side Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Document Tabs & PDF Simulator (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Document selection tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  (activeDoc?.id === doc.id)
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{doc.documentType.replace(/_/g, " ")}</span>
                {doc.status === "REVIEWED" ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            ))}
          </div>

          {/* Simulated PDF Preview Canvas */}
          <div className="bg-slate-800 rounded-xl p-6 shadow-inner border border-slate-700 text-white min-h-[500px] flex flex-col justify-between font-mono">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span>PDF PREVIEW: {activeDoc?.filename}</span>
                </div>
                <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                  Original Source Document
                </span>
              </div>

              {/* Mock PDF Document Content */}
              <div className="bg-white text-slate-900 p-6 rounded shadow-lg text-xs space-y-4 font-sans max-w-xl mx-auto border border-slate-200">
                <div className="border-b border-slate-300 pb-3 flex justify-between items-start">
                  <div>
                    <div className="font-extrabold text-sm tracking-wider uppercase text-blue-900">
                      {activeDoc?.documentType === "DELIVERY_ORDER" ? "MAERSK LINE INDIA" : "INDIAN CUSTOMS EDI"}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {activeDoc?.documentType === "DELIVERY_ORDER"
                        ? "ELECTRONIC DELIVERY ORDER (e-DO)"
                        : "BILL OF ENTRY FOR HOME CONSUMPTION (FORM I)"}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-500">
                    <div>Date: 05-SEP-2026</div>
                    <div className="font-mono font-bold text-slate-700">{activeDoc?.filename}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Consignee:</span>
                    <strong className="text-slate-800">BHARAT STEEL CORPORATION PVT LTD</strong>
                    <div className="text-[10px] text-slate-500">MIDC Industrial Area, Taloja, Navi Mumbai</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Container No:</span>
                    <strong className="text-blue-700 font-mono text-sm">{container?.containerNumber}</strong>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">B/L No:</span>
                    <span className="font-mono font-medium">{container?.blNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Free Time:</span>
                    <span className="font-bold text-emerald-700">5 CALENDAR DAYS</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Port:</span>
                    <span>NHAVA SHEVA</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded text-[11px] text-amber-900">
                  <strong>Notice:</strong> Carrier demurrage shall run concurrently after free time expiration. CFS shifting and ground rent charges are applicable as per nominated terminal tariff.
                </div>
              </div>
            </div>

            <div className="text-center text-slate-400 text-[11px] pt-4">
              AI OCR extraction performed by Python ai-service • Staged in temporary review buffer
            </div>
          </div>
        </div>

        {/* Right: Extracted Fields Review Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-sm">Extracted Entities & Confidence</h3>
            </div>
            {activeDoc?.status === "REVIEWED" ? (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <Check className="w-3 h-3" />
                Verified
              </span>
            ) : (
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Review Required
              </span>
            )}
          </div>

          <div className="space-y-3">
            {activeDoc &&
              Object.entries(activeDoc.extractedFields).map(([key, field]) => {
                const isEditing = editingFieldKey === key;
                const isLowConfidence = field.confidence < 0.92;

                return (
                  <div
                    key={key}
                    className={`p-3 rounded-lg border text-xs transition-colors ${
                      field.flaggedForReview
                        ? "bg-amber-50/70 border-amber-300"
                        : "bg-slate-50/60 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">{field.label}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            isLowConfidence
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {(field.confidence * 100).toFixed(0)}% conf
                        </span>
                        {!isEditing && (
                          <button
                            onClick={() => handleStartEdit(key, field.value)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded"
                            title="Edit field value"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 bg-white border border-blue-400 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleSaveEdit(activeDoc.id, key)}
                          className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="font-semibold text-slate-800 mt-1 font-mono break-all">
                        {String(field.value)}
                      </div>
                    )}

                    {field.flaggedForReview && !isEditing && (
                      <div className="text-[10px] text-amber-800 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>Flagged: Value departs from historical baseline or novel code detected</span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
              <span>System Architectural Rule</span>
            </div>
            <div>
              AI extraction cannot directly mutate authoritative container records. Every field requires human review or programmatic validation before acceptance.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
