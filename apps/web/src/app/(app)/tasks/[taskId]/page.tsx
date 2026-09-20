"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTask, useAssignExternalTask } from "@/lib/hooks/use-tasks";
import { formatDate } from "@/lib/utils";
import { 
  ArrowLeft, 
  CheckSquare, 
  Truck, 
  User, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  Send
} from "lucide-react";

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params?.taskId as string;
  const { data: task, isLoading } = useTask(taskId);
  const assignMutation = useAssignExternalTask();

  const [transporterName, setTransporterName] = useState("");
  const [transporterPhone, setTransporterPhone] = useState("");
  const [copied, setCopied] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  if (isLoading) {
    return <div className="py-20 text-center text-slate-400">Loading task details...</div>;
  }

  if (!task) {
    return (
      <div className="py-20 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Task Not Found</h2>
        <Link href="/tasks" className="text-blue-600 text-xs hover:underline">
          &larr; Back to Task List
        </Link>
      </div>
    );
  }

  const isConfirmed = task.status === "CONFIRMED";
  const isExternal = task.assigneeType === "EXTERNAL";
  const hasToken = !!task.externalToken;
  const confirmationUrl = typeof window !== "undefined" && task.externalToken
    ? `${window.location.origin}/confirm/${task.externalToken}`
    : `/confirm/${task.externalToken}`;

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(confirmationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transporterName || !transporterPhone) return;

    await assignMutation.mutateAsync({
      taskId: task.id,
      assigneeName: transporterName,
      assigneeContact: transporterPhone,
    });
    setShowAssignModal(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/tasks"
            className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Task #{task.id} • {task.clientName}
            </div>
            <h1 className="text-xl font-bold text-slate-900">{task.title}</h1>
          </div>
        </div>

        {/* Status Pill */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
            isConfirmed
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : task.status === "ASSIGNED"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-slate-100 text-slate-700 border-slate-200"
          }`}
        >
          {isConfirmed ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span>{task.status}</span>
        </span>
      </div>

      {/* Task Description & Container Link */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Task Description
          </h3>
          <p className="text-sm text-slate-800 whitespace-pre-line mt-1">
            {task.description}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Target Container:</span>
            <Link
              href={`/containers/${task.containerId}`}
              className="font-mono font-bold text-blue-600 hover:underline"
            >
              {task.containerNumber} &rarr;
            </Link>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Due Date: </span>
            <strong className="text-slate-700">{formatDate(task.dueDate)}</strong>
          </div>
        </div>
      </div>

      {/* External Handoff Panel */}
      <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                External Coordination & Dispatch Handoff
              </h3>
              <p className="text-[11px] text-slate-500">
                Single-purpose unauthenticated confirmation token for truckers & outside contacts
              </p>
            </div>
          </div>

          {!isExternal && !isConfirmed && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Assign to External Contact</span>
            </button>
          )}
        </div>

        {/* Active External Handoff State */}
        {isExternal && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Assignee
                </span>
                <span className="font-semibold text-slate-800 text-xs">
                  {task.assigneeName}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Contact Phone / SMS
                </span>
                <span className="font-mono font-semibold text-slate-800 text-xs">
                  {task.assigneeContact}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Token Expiration (72h)
                </span>
                <span className="font-medium text-slate-700 text-xs">
                  {task.tokenExpiry ? formatDate(task.tokenExpiry) : "72 Hours"}
                </span>
              </div>
            </div>

            {/* Confirmation status feedback */}
            {isConfirmed ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pickup Appointment Confirmed!</span>
                </div>
                <div className="text-[11px] text-emerald-800">
                  Confirmed at: <strong>{task.confirmedAt ? formatDate(task.confirmedAt) : "Recently"}</strong>. 
                  Container timeline and operational status have been updated in real-time.
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Single-Purpose Confirmation Link (No Login Required)</span>
                  </span>
                  <span className="text-[10px] font-semibold bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded">
                    Token Active
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={confirmationUrl}
                    className="flex-1 bg-white border border-blue-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-blue-700 border border-blue-300 font-semibold text-xs rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                  <a
                    href={`/confirm/${task.externalToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Public Link</span>
                  </a>
                </div>

                <p className="text-[11px] text-blue-800/80">
                  The trucker or dispatch manager can open this link on mobile without any credentials, enter their vehicle number, and submit confirmation.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modal / Inline form to assign */}
        {showAssignModal && (
          <form onSubmit={handleAssignSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">Assign to External Transporter</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Transporter / Driver Name
                </label>
                <input
                  type="text"
                  required
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  placeholder="e.g. Ramesh Yadav (Mahalakshmi Transport)"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Contact Phone (WhatsApp / SMS)
                </label>
                <input
                  type="text"
                  required
                  value={transporterPhone}
                  onChange={(e) => setTransporterPhone(e.target.value)}
                  placeholder="+91 98201 12345"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assignMutation.isPending}
                className="px-3.5 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700"
              >
                Generate Token & Send Link
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
