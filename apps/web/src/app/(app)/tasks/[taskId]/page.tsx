"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTask, useAssignExternalTask } from "@/lib/hooks/use-tasks";
import { formatDate } from "@/lib/utils";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  User, 
  Truck, 
  Copy, 
  Check, 
  ExternalLink,
  Calendar,
  AlertCircle,
  Link as LinkIcon,
  Send
} from "lucide-react";

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const { data: task, isLoading } = useTask(taskId);
  const assignMutation = useAssignExternalTask();

  const [copied, setCopied] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [transporterName, setTransporterName] = useState("");
  const [transporterPhone, setTransporterPhone] = useState("");

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Loading operational task details...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="py-20 text-center space-y-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Task Not Found</h2>
        <Link href="/tasks" className="text-blue-600 dark:text-blue-400 text-xs hover:underline">
          &larr; Back to Tasks
        </Link>
      </div>
    );
  }

  const isExternal = task.assigneeType === "EXTERNAL";
  const isConfirmed = task.status === "CONFIRMED";
  const confirmationUrl = typeof window !== "undefined" && task.externalToken
    ? `${window.location.origin}/confirm/${task.externalToken}`
    : `https://app.demurrageos.com/confirm/${task.externalToken || "demo-token"}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(confirmationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            className="p-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Task #{task.id} • {task.clientName}
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{task.title}</h1>
          </div>
        </div>

        {/* Status Pill */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
            isConfirmed
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
              : task.status === "ASSIGNED"
              ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-700"
          }`}
        >
          {isConfirmed ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          )}
          <span>{task.status}</span>
        </span>
      </div>

      {/* Task Description & Container Link */}
      <div className="bg-white dark:bg-[#0c1424] rounded-xl border border-slate-200 dark:border-white/5 p-5 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Task Description
          </h3>
          <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line mt-1">
            {task.description}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Target Container:</span>
            <Link
              href={`/containers/${task.containerId}`}
              className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {task.containerNumber} &rarr;
            </Link>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 font-medium">Due Date: </span>
            <strong className="text-slate-800 dark:text-slate-200">{formatDate(task.dueDate)}</strong>
          </div>
        </div>
      </div>

      {/* External Handoff Panel */}
      <div className="bg-white dark:bg-[#0c1424] rounded-xl border border-blue-200 dark:border-blue-900/40 p-6 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                External Coordination &amp; Dispatch Handoff
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Single-purpose unauthenticated confirmation token for truckers &amp; outside contacts
              </p>
            </div>
          </div>

          {!isExternal && !isConfirmed && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
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
              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                  Assignee
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {task.assigneeName}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                  Contact Phone / SMS
                </span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {task.assigneeContact}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                  Token Expiration (72h)
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                  {task.tokenExpiry ? formatDate(task.tokenExpiry) : "72 Hours"}
                </span>
              </div>
            </div>

            {/* Confirmation status feedback */}
            {isConfirmed ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Pickup Appointment Confirmed!</span>
                </div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-400">
                  Confirmed at: <strong>{task.confirmedAt ? formatDate(task.confirmedAt) : "Recently"}</strong>. 
                  Container timeline and operational status have been updated in real-time.
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Single-Purpose Confirmation Link (No Login Required)</span>
                  </span>
                  <span className="text-[10px] font-semibold bg-blue-200/80 dark:bg-blue-900/60 text-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">
                    Token Active
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={confirmationUrl}
                    className="flex-1 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
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

                <p className="text-[11px] text-blue-800/80 dark:text-blue-400/80">
                  The trucker or dispatch manager can open this link on mobile without any credentials, enter their vehicle number, and submit confirmation.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modal / Inline form to assign */}
        {showAssignModal && (
          <form onSubmit={handleAssignSubmit} className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Assign to External Transporter</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Transporter / Driver Name
                </label>
                <input
                  type="text"
                  required
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  placeholder="e.g. Ramesh Yadav (Mahalakshmi Transport)"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Contact Phone (WhatsApp / SMS)
                </label>
                <input
                  type="text"
                  required
                  value={transporterPhone}
                  onChange={(e) => setTransporterPhone(e.target.value)}
                  placeholder="+91 98201 12345"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assignMutation.isPending}
                className="px-3.5 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Generate Token &amp; Send Link
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
