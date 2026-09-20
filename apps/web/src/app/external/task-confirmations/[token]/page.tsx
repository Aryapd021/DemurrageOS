'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchApi } from '../../../../lib/api';
import { Truck, CheckCircle2, AlertCircle, Clock, MapPin, Calendar } from 'lucide-react';

export default function ExternalTaskConfirmationPage() {
  const params = useParams();
  const token = params.token as string;
  const [confirmedState, setConfirmedState] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['external-task', token],
    queryFn: () => fetchApi<{ data: any }>(`/api/v1/external/task-confirmations/${token}`),
    retry: false
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      return fetchApi<{ data: any }>(`/api/v1/external/task-confirmations/${token}/confirm`, {
        method: 'POST'
      });
    },
    onSuccess: (res) => {
      setConfirmedState(res.data.confirmedAt);
    }
  });

  const task = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="text-center text-slate-500">
          <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Validating pickup dispatch token...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Invalid or Expired Link</h2>
          <p className="text-xs text-slate-500 mt-2">
            This pickup confirmation link is no longer valid or has elapsed the 72-hour security window. Please contact your dispatch coordinator.
          </p>
        </div>
      </div>
    );
  }

  const isConfirmed = !!confirmedState || !!task.confirmedAt;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Transporter Pickup Dispatch</h1>
            <p className="text-xs text-slate-500">Single-purpose external verification portal</p>
          </div>
        </div>

        {isConfirmed ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Pickup Confirmed!</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your pickup confirmation for container <strong className="font-mono">{task.containerNumber}</strong> has been logged in the CHA dispatch system.
            </p>
            <p className="text-[11px] text-slate-400">
              Confirmed at: {new Date(confirmedState || task.confirmedAt).toLocaleString()}
            </p>
          </div>
        ) : task.isExpired ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Link Expired</h2>
            <p className="text-xs text-slate-600">
              This 72-hour confirmation window has lapsed. Please request a new link from the logistics operator.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Container Number</span>
                <span className="font-mono font-black text-slate-900 text-base">{task.containerNumber}</span>
              </div>

              {task.pickupLocation && (
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{task.pickupLocation}</span>
                </div>
              )}

              {task.scheduledDate && (
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Scheduled Window: {new Date(task.scheduledDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              {confirmMutation.isPending ? (
                'Confirming Pickup...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Confirm Pickup Scheduled
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-400">
              By confirming, you certify that transport equipment has been scheduled for this container.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
