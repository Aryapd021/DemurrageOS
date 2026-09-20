"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useTaskByToken, useConfirmExternalTask } from "@/lib/hooks/use-tasks";
import { 
  Truck, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  AlertCircle,
  FileCheck
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ExternalConfirmationPage() {
  const params = useParams();
  const token = params?.token as string;

  const { data: task, isLoading, error } = useTaskByToken(token);
  const confirmMutation = useConfirmExternalTask();

  const [transporterName, setTransporterName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [pickupDate, setPickupDate] = useState("2026-09-15T10:00");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center text-slate-500 text-sm">
          Validating secure token...
        </div>
      </div>
    );
  }

  if (!task || error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-md text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Invalid or Expired Link</h2>
          <p className="text-xs text-slate-500">
            This pickup confirmation token is either expired (72h limit) or has already been revoked. Please contact the Customs House Agent (Apex Logistics) for a re-dispatch.
          </p>
        </div>
      </div>
    );
  }

  const isAlreadyConfirmed = task.status === "CONFIRMED" || submitted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transporterName || !vehicleNumber || !driverPhone) return;

    await confirmMutation.mutateAsync({
      token,
      transporterName,
      driverPhone,
      vehicleNumber,
      scheduledPickupTime: pickupDate,
      notes,
    });
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand identifier */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            OS
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-lg">DemurrageOS</span>
          <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
            Dispatch Gateway
          </span>
        </div>

        <h2 className="text-center text-xl font-extrabold text-slate-900 tracking-tight">
          Container Pickup Confirmation
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Apex Logistics Customs House Agency • Single-Use Dispatch Verification
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-8 space-y-6">
          {/* Target Container details */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Container Number
              </span>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                Verified Token
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-blue-700">
              {task.containerNumber}
            </div>

            <div className="text-xs text-slate-600 border-t border-slate-200/60 pt-2 space-y-1">
              <div>
                Client Importer: <strong className="text-slate-800">{task.clientName}</strong>
              </div>
              <div className="text-slate-500">
                Task: <span className="font-medium text-slate-700">{task.title}</span>
              </div>
            </div>
          </div>

          {isAlreadyConfirmed ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Pickup Appointment Confirmed!
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Thank you. Your vehicle details and appointment time have been logged into the container timeline. The terminal gate appointment has been verified.
              </p>
              <div className="pt-3">
                <span className="text-[11px] text-slate-400">
                  Confirmation logged at: {task.confirmedAt ? formatDate(task.confirmedAt) : "Just now"}
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transporter / Logistics Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  placeholder="e.g. Mahalakshmi Transport Co."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="e.g. +91 98201 12345"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle / Trailer Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. MH 46 AR 8921"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-semibold uppercase text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scheduled Pickup Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Special Instructions / Gate Pass Remarks
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any gate-out specific notes or driver name..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={confirmMutation.isPending}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>
                    {confirmMutation.isPending ? "Submitting Confirmation..." : "Confirm Pickup Appointment"}
                  </span>
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Encrypted 256-bit single-purpose session</span>
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
