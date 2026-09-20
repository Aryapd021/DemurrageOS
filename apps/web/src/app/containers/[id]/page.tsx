'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../../lib/api';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  FileText,
  Truck,
  DollarSign,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Upload,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Edit3,
  Sparkles,
  Search,
  BookOpen
} from 'lucide-react';

export default function ContainerDetailPage() {
  const params = useParams();
  const containerId = params.id as string;
  const queryClient = useQueryClient();

  // State modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState<any | null>(null);
  const [showManualSignalModal, setShowManualSignalModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Knowledge search state
  const [knowledgeQuery, setKnowledgeQuery] = useState('');
  const [knowledgeResults, setKnowledgeResults] = useState<any[]>([]);
  const [isSearchingKnowledge, setIsSearchingKnowledge] = useState(false);

  // Form states
  const [uploadDocType, setUploadDocType] = useState('BILL_OF_LADING');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [manualSignalType, setManualSignalType] = useState('VALUATION_CONSISTENCY');
  const [manualScore, setManualScore] = useState(85);
  const [manualReason, setManualReason] = useState('Verified against commercial invoice');
  const [taskName, setTaskName] = useState('Ramesh Kumar (Highway Freight)');
  const [taskPhone, setTaskPhone] = useState('+91 9876543210');
  const [taskTitle, setTaskTitle] = useState('Schedule Container Gate-Out & Pickup');

  // Queries
  const { data: containerData, isLoading: loadingContainer } = useQuery({
    queryKey: ['container', containerId],
    queryFn: () => fetchApi<{ data: any }>(`/api/v1/containers/${containerId}`)
  });

  const { data: riskData } = useQuery({
    queryKey: ['risk', containerId],
    queryFn: () => fetchApi<{ data: any }>(`/api/v1/containers/${containerId}/risk`)
  });

  const { data: signalsData } = useQuery({
    queryKey: ['signals', containerId],
    queryFn: () => fetchApi<{ data: any[] }>(`/api/v1/containers/${containerId}/compliance-signals`)
  });

  const { data: documentsData } = useQuery({
    queryKey: ['documents', containerId],
    queryFn: () => fetchApi<{ data: any[] }>(`/api/v1/documents/container/${containerId}`)
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', containerId],
    queryFn: () => fetchApi<{ data: any[] }>(`/api/v1/tasks/container/${containerId}`)
  });

  const container = containerData?.data;
  const risk = riskData?.data;
  const signals = signalsData?.data || [];
  const documents = documentsData?.data || [];
  const tasks = tasksData?.data || [];

  // Mutations
  const uploadDocMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error('Please select a file');
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('clientId', container.clientId);
      formData.append('containerId', container.id);
      formData.append('documentType', uploadDocType);

      return fetchApi('/api/v1/documents/upload', {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: () => {
      setShowUploadModal(false);
      setUploadFile(null);
      queryClient.invalidateQueries({ queryKey: ['documents', containerId] });
      queryClient.invalidateQueries({ queryKey: ['signals', containerId] });
      queryClient.invalidateQueries({ queryKey: ['risk', containerId] });
    }
  });

  const reviewDocMutation = useMutation({
    mutationFn: async ({ docId, action, acceptedFields }: { docId: string; action: string; acceptedFields: any }) => {
      return fetchApi(`/api/v1/documents/${docId}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, acceptedFields })
      });
    },
    onSuccess: () => {
      setShowReviewModal(null);
      queryClient.invalidateQueries({ queryKey: ['documents', containerId] });
      queryClient.invalidateQueries({ queryKey: ['signals', containerId] });
      queryClient.invalidateQueries({ queryKey: ['risk', containerId] });
      queryClient.invalidateQueries({ queryKey: ['container', containerId] });
    }
  });

  const manualSignalMutation = useMutation({
    mutationFn: async () => {
      return fetchApi(`/api/v1/containers/${containerId}/compliance-signals`, {
        method: 'POST',
        body: JSON.stringify({
          signalType: manualSignalType,
          score: manualScore,
          reason: manualReason
        })
      });
    },
    onSuccess: () => {
      setShowManualSignalModal(false);
      queryClient.invalidateQueries({ queryKey: ['signals', containerId] });
      queryClient.invalidateQueries({ queryKey: ['risk', containerId] });
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      return fetchApi<{ data: any }>('/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify({
          containerId,
          title: taskTitle,
          taskType: 'PICKUP',
          assigneeType: 'EXTERNAL_CONTACT',
          externalContactName: taskName,
          externalContactPhone: taskPhone,
          pickupLocation: 'Nhava Sheva Gateway CFS, Gate 2'
        })
      });
    },
    onSuccess: () => {
      setShowTaskModal(false);
      queryClient.invalidateQueries({ queryKey: ['tasks', containerId] });
      queryClient.invalidateQueries({ queryKey: ['risk', containerId] });
    }
  });

  const fallbackCfsMutation = useMutation({
    mutationFn: async () => {
      return fetchApi(`/api/v1/containers/${containerId}/fallback-cfs`, {
        method: 'POST',
        body: JSON.stringify({
          cfsId: container.cfsId || '00000000-0000-0000-0000-000000000003',
          reason: 'Diverted to CFS due to 48-hour DPD clearance expiry window.'
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['container', containerId] });
      queryClient.invalidateQueries({ queryKey: ['signals', containerId] });
      queryClient.invalidateQueries({ queryKey: ['risk', containerId] });
    }
  });

  const handleSearchKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!knowledgeQuery.trim()) return;
    setIsSearchingKnowledge(true);
    try {
      const res = await fetchApi<{ data: any[] }>('/api/v1/knowledge/query', {
        method: 'POST',
        body: JSON.stringify({ query: knowledgeQuery, nResults: 3 })
      });
      setKnowledgeResults(res.data || []);
    } catch (err) {
      console.error('Knowledge search failed', err);
    } finally {
      setIsSearchingKnowledge(false);
    }
  };

  if (loadingContainer || !container) {
    return (
      <div className="text-center py-20 text-slate-500">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading container details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Container Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {container.containerNumber}
            </h1>
            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
              {container.size}ft {container.containerType}
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              container.deliveryMode === 'DPD_DIRECT' 
                ? 'bg-emerald-100 text-emerald-800' 
                : container.deliveryMode === 'DPD_CFS'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-indigo-100 text-indigo-800'
            }`}>
              {container.deliveryMode.replace('_', ' ')}
            </span>
          </div>

          <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
            <span className="font-semibold text-slate-900">{container.client?.name}</span>
            {container.client?.aeoStatus && (
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                AEO Certified
              </span>
            )}
            {container.client?.acpStatus && (
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                ACP Enrolled
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {container.deliveryMode !== 'CFS' && (
            <button
              onClick={() => fallbackCfsMutation.mutate()}
              disabled={fallbackCfsMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition"
            >
              {fallbackCfsMutation.isPending ? 'Processing...' : 'Fallback DPD to CFS'}
            </button>
          )}
          <button
            onClick={() => setShowTaskModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-1.5 shadow-sm"
          >
            <Truck className="w-4 h-4" /> Assign Pickup Task
          </button>
        </div>
      </div>

      {/* Grid: Risk Explainability + Financial Two-Clock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Explainability (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Deterministic Risk Assessment
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Computed deterministically from deadline countdown, compliance signals, and status.
              </p>
            </div>
            {risk && (
              <div className="flex items-center gap-3">
                <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                  risk.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-200' :
                  risk.severity === 'HIGH' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                  'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {risk.severity} Risk
                </span>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">{risk.riskScore}</span>
                  <span className="text-xs text-slate-400">/100</span>
                </div>
              </div>
            )}
          </div>

          {/* Structured Reasons Breakdown */}
          <div className="mt-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contributing Risk Factors</h3>
            {risk?.reasons?.map((reason: any, idx: number) => (
              <div key={idx} className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                    reason.category === 'DEADLINE' ? 'bg-red-100 text-red-800' :
                    reason.category === 'COMPLIANCE' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-200 text-slate-800'
                  }`}>
                    {reason.category}
                  </span>
                  <span className="text-slate-700 font-medium">{reason.explanation}</span>
                </div>
                <span className="font-mono font-bold text-slate-600 ml-2">+{reason.contribution} pts</span>
              </div>
            ))}
          </div>

          {/* Recommended Operational Actions */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Operational Actions</h3>
            <ul className="space-y-1.5">
              {risk?.recommendedActions?.map((act: string, idx: number) => (
                <li key={idx} className="text-xs text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  {act}
                </li>
              ))}
            </ul>
          </div>

          {/* Advisory Insight & Fallback Prediction (Advisory Only - Rule 20) */}
          {risk?.advisory ? (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-purple-900">Advisory Insight: DPD Fallback & Exposure Analysis</span>
                    <span className="text-[10px] bg-purple-200/70 text-purple-800 font-semibold px-2 py-0.5 rounded">Advisory Only</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    risk.advisory.status === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-200' :
                    risk.advisory.status === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {risk.advisory.predictedFallback ? 'DPD-to-CFS Fallback Imminent' : 'Normal Clearance Staging'}
                  </span>
                </div>
                <p className="text-xs text-purple-900 mt-2 leading-relaxed">
                  {risk.advisory.explanation}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/90 p-2.5 rounded-lg border border-purple-100">
                    <span className="text-[11px] text-purple-700 block font-medium">Fallback Probability</span>
                    <span className="text-base font-black text-purple-950 font-mono">
                      {Math.round(risk.advisory.fallbackProbability * 100)}%
                    </span>
                  </div>
                  <div className="bg-white/90 p-2.5 rounded-lg border border-purple-100">
                    <span className="text-[11px] text-purple-700 block font-medium">Preventable Exposure Estimate</span>
                    <span className="text-base font-black text-purple-950 font-mono">
                      {risk.advisory.preventableExposureInr != null
                        ? `₹${risk.advisory.preventableExposureInr.toLocaleString()}`
                        : 'N/A (No authoritative tariff)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-400" />
                <span>Advisory Insight: Predictive advisory analysis is currently unavailable. Authoritative deterministic risk is fully calculated above.</span>
              </div>
            </div>
          )}
        </div>

        {/* Financial Two-Clock Card (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" /> Two-Clock Demurrage Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Authoritative tariff calculations.</p>

            <div className="mt-5 space-y-4">
              {/* Clock 1: Carrier Demurrage */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Carrier Demurrage Clock</span>
                  <span className="text-emerald-700">MAERSK Line</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-900">
                    ₹{container.charges?.find((c: any) => c.chargeType === 'DEMURRAGE')?.amount || 0}
                  </span>
                  <span className="text-xs text-slate-500">
                    {container.dischargeDate ? 'Active' : 'Pending Discharge'}
                  </span>
                </div>
              </div>

              {/* Clock 2: CFS Ground Rent */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>CFS Ground-Rent Clock</span>
                  <span className="text-blue-700">Nhava Sheva CFS</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-900">
                    ₹{container.charges?.find((c: any) => c.chargeType === 'CFS_GROUND_RENT')?.amount || 0}
                  </span>
                  <span className="text-xs text-slate-500">
                    {container.gateInDate ? 'Active at CFS' : 'Not yet gated-in'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            AI suggestions cannot directly modify these authoritative charges.
          </div>
        </div>
      </div>

      {/* Compliance Signals Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" /> Compliance Signal Engine (v1)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Four independent structured signals feeding the deterministic risk calculation.
            </p>
          </div>
          <button
            onClick={() => setShowManualSignalModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" /> Add / Override Manual Signal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {signals.map((sig: any) => {
            const isManual = sig.source === 'MANUAL';
            return (
              <div key={sig.id} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                      isManual ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {sig.source}
                    </span>
                    <span className="text-lg font-black text-slate-900">{sig.score}/100</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs mt-2.5">
                    {sig.signalType.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {sig.reason || 'Calculated deterministically.'}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  Updated: {new Date(sig.updatedAt || sig.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document Extraction & Review Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Document Ingestion & Human-in-the-Loop Review
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              AI extracts suggestions into staging. Human acceptance is strictly required before authoritative DB update.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Document
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No documents attached yet. Click "Upload Document" to ingest B/L, Delivery Order, or Bill of Entry.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-4">
            {documents.map((doc: any) => (
              <div key={doc.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{doc.fileName}</span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border">
                      {doc.documentType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                    <span>Status: <strong className="text-slate-700">{doc.extractionStatus}</strong></span>
                    {doc.overallConfidence !== null && (
                      <span>AI Confidence: <strong className="text-slate-700">{Math.round(doc.overallConfidence * 100)}%</strong></span>
                    )}
                    <span>
                      Review: <strong className={
                        doc.reviewStatus === 'ACCEPTED' ? 'text-emerald-600' :
                        doc.reviewStatus === 'CORRECTED' ? 'text-blue-600' :
                        doc.reviewStatus === 'REJECTED' ? 'text-red-600' : 'text-amber-600'
                      }>{doc.reviewStatus.replace('_', ' ')}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {doc.originalExtractedFields && (
                    <button
                      onClick={() => setShowReviewModal(doc)}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Review & Apply AI Fields
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* External Task Confirmation & Handoff Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" /> External Task Confirmation & Network Handoff
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure 72-hour cryptographic token handoff to external transporters without leaking tenant dashboard data.
            </p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No active external pickup tasks for this container.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-4">
            {tasks.map((task: any) => {
              const isConfirmed = !!task.confirmedAt;
              const isExpired = task.tokenExpiresAt && new Date(task.tokenExpiresAt) < new Date();
              return (
                <div key={task.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{task.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isConfirmed ? 'bg-emerald-100 text-emerald-800' :
                        isExpired ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isConfirmed ? 'Confirmed by Transporter' : isExpired ? 'Token Expired' : 'Awaiting External Confirmation'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Assigned to: <strong className="text-slate-700">{task.externalContactName}</strong> ({task.externalContactPhone || task.externalContactEmail})
                    </p>
                    {isConfirmed && (
                      <p className="text-xs text-emerald-700 mt-0.5 font-medium">
                        Confirmed at: {new Date(task.confirmedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Port Tariffs & Customs Intelligence Knowledge Panel (ChromaDB) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Port Tariffs & Customs Intelligence (ChromaDB)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Query port demurrage tariffs, free-day policies, and customs circulars with multi-tenant privacy protection.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchKnowledge} className="mt-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={knowledgeQuery}
              onChange={(e) => setKnowledgeQuery(e.target.value)}
              placeholder="e.g. JNPT demurrage rates for 40ft container or DPD clearance guidelines..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingKnowledge || !knowledgeQuery.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            {isSearchingKnowledge ? 'Searching...' : 'Search Tariffs'}
          </button>
        </form>

        {knowledgeResults.length > 0 && (
          <div className="mt-4 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Matched Knowledge Results ({knowledgeResults.length})
            </span>
            {knowledgeResults.map((item: any, idx: number) => {
              const isGlobal = item.metadata?.org_id === 'GLOBAL_PUBLIC';
              const relevancePct = item.distance !== null && item.distance !== undefined
                ? `${Math.max(10, Math.min(99, Math.round((1 - item.distance) * 100)))}%`
                : 'High Match';
              return (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{item.metadata?.title || 'Tariff Circular'}</span>
                      <span className="text-[10px] text-slate-500">Source: {item.metadata?.category || 'Port Authority / Customs Notice'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-slate-500">Relevance: {relevancePct}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isGlobal ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {isGlobal ? 'GLOBAL_PUBLIC' : 'Organization Specific'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 leading-relaxed text-[11px]">
                    <span className="font-semibold text-slate-500 block text-[10px] uppercase mb-0.5">Content</span>
                    {item.text}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Upload Document */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Upload Shipping Document</h3>
            <p className="text-xs text-slate-500 mt-1">
              Document will be stored safely and processed by advisory AI extraction service.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Document Type</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900"
                >
                  <option value="BILL_OF_LADING">Bill of Lading</option>
                  <option value="DELIVERY_ORDER">Delivery Order</option>
                  <option value="BILL_OF_ENTRY">Bill of Entry</option>
                  <option value="CFS_GATE_PASS">CFS Gate-Pass</option>
                  <option value="CARRIER_DD_INVOICE">Carrier D&D Invoice</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">File (PDF or Image)</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => uploadDocMutation.mutate()}
                disabled={!uploadFile || uploadDocMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                {uploadDocMutation.isPending ? 'Uploading & Enqueueing...' : 'Upload & Process'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Human-In-The-Loop Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Review Staged AI Suggestions: {showReviewModal.documentType}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm or correct extracted values before they mutate authoritative container fields.
                </p>
              </div>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                Human Review Required
              </span>
            </div>

            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
              {Object.entries(showReviewModal.originalExtractedFields || {}).map(([key, val]: [string, any]) => {
                const conf = showReviewModal.fieldLevelConfidence?.[key]?.confidence || 0.9;
                return (
                  <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                    <div className="w-1/3">
                      <span className="text-xs font-bold text-slate-700 block">{key}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400">Confidence: {Math.round(conf * 100)}%</span>
                        {key === 'containerNumber' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ISO 6346 Checked
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-2/3">
                      <span className="text-[10px] text-blue-700 font-semibold block mb-1">
                        Staged Suggestion ➔ Verified Authoritative Field
                      </span>
                      <input
                        type="text"
                        defaultValue={String(val)}
                        id={`field-${key}`}
                        className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2 bg-white text-slate-900"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t flex items-center justify-between">
              <button
                onClick={() => reviewDocMutation.mutate({
                  docId: showReviewModal.id,
                  action: 'REJECT',
                  acceptedFields: {}
                })}
                className="px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg"
              >
                Reject AI Extraction
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowReviewModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const fields: Record<string, any> = {};
                    Object.keys(showReviewModal.originalExtractedFields || {}).forEach(k => {
                      const input = document.getElementById(`field-${k}`) as HTMLInputElement;
                      if (input) fields[k] = input.value;
                    });
                    reviewDocMutation.mutate({
                      docId: showReviewModal.id,
                      action: 'ACCEPT',
                      acceptedFields: fields
                    });
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Accept & Apply Authoritative Values
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Manual Compliance Signal */}
      {showManualSignalModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Add / Override Compliance Signal</h3>
            <p className="text-xs text-slate-500 mt-1">
              Manual signals are recorded with CHA identity in the audit log.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Signal Type</label>
                <select
                  value={manualSignalType}
                  onChange={(e) => setManualSignalType(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900"
                >
                  <option value="VALUATION_CONSISTENCY">Valuation Consistency</option>
                  <option value="HS_CODE_NOVELTY">HS Code Novelty</option>
                  <option value="DOC_COMPLETENESS">Document Completeness</option>
                  <option value="AEO_ACP_STATUS">AEO / ACP Status</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Readiness Score (0 - 100): <span className="font-bold text-blue-600">{manualScore}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={manualScore}
                  onChange={(e) => setManualScore(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Reason / Notes</label>
                <textarea
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  rows={3}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowManualSignalModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => manualSignalMutation.mutate()}
                disabled={manualSignalMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Save Signal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Assign External Task */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Assign External Pickup Task</h3>
            <p className="text-xs text-slate-500 mt-1">
              Generates a secure 72-hour one-time confirmation link for the transporter.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Trucker / Transporter Contact Name</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone / WhatsApp Number</label>
                <input
                  type="text"
                  value={taskPhone}
                  onChange={(e) => setTaskPhone(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => createTaskMutation.mutate()}
                disabled={createTaskMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                {createTaskMutation.isPending ? 'Generating...' : 'Dispatch Task Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
