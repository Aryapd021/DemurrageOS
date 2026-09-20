import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function renderHtml(initialToken = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DemurrageOS — Operational Control System</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    code, .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
  <div id="app" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-500/30">
          D
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="text-xl font-bold tracking-tight text-white">DemurrageOS</h1>
            <span class="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">CHA Core v1.0</span>
          </div>
          <p class="text-xs text-slate-400">Apex Global Freight & Customs Agency (Lic: CHA/BOM/2021/8892)</p>
        </div>
      </div>

      <!-- Controls / Client Switcher -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
          <label for="clientSelect" class="text-xs font-medium text-slate-400 px-2">Client Scope:</label>
          <select id="clientSelect" onchange="onClientChange(this.value)" class="bg-slate-900 text-sm font-medium text-white rounded px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Clients (Portfolio Rollup)</option>
            <option value="client-tata">Tata Motors Commercial Vehicles (AEO-T2)</option>
            <option value="client-reliance">Reliance Retail Logistics (Non-AEO)</option>
            <option value="client-sunpharma">Sun Pharma Advanced Logistics (AEO-T1)</option>
          </select>
        </div>

        <nav class="flex space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
          <button onclick="switchTab('dashboard')" id="tab-dashboard" class="px-3 py-1.5 font-medium rounded bg-indigo-600 text-white">Dashboard</button>
          <button onclick="switchTab('containers')" id="tab-containers" class="px-3 py-1.5 font-medium rounded text-slate-400 hover:text-white">Containers</button>
          <button onclick="switchTab('import')" id="tab-import" class="px-3 py-1.5 font-medium rounded text-slate-400 hover:text-white">CSV Ingestion</button>
          <button onclick="switchTab('queues')" id="tab-queues" class="px-3 py-1.5 font-medium rounded text-slate-400 hover:text-white">BullMQ Jobs</button>
        </nav>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="py-6">
      <!-- DASHBOARD TAB -->
      <section id="view-dashboard">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6" id="summaryCards">
          <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow">
            <div class="text-xs font-medium text-slate-400">Total Current Exposure</div>
            <div class="text-2xl font-bold text-amber-400 mt-1" id="stat-totalExposure">₹0</div>
            <div class="text-[11px] text-slate-400 mt-1">Across active shipments</div>
          </div>
          <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow">
            <div class="text-xs font-medium text-slate-400">Projected Exposure (72h)</div>
            <div class="text-2xl font-bold text-rose-400 mt-1" id="stat-projectedExposure">₹0</div>
            <div class="text-[11px] text-rose-400/80 mt-1">If no action taken</div>
          </div>
          <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow">
            <div class="text-xs font-medium text-slate-400">Carrier Demurrage</div>
            <div class="text-2xl font-bold text-indigo-300 mt-1" id="stat-carrierDemurrage">₹0</div>
            <div class="text-[11px] text-slate-400 mt-1">Shipping line clock</div>
          </div>
          <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow">
            <div class="text-xs font-medium text-slate-400">CFS Ground Rent</div>
            <div class="text-2xl font-bold text-cyan-300 mt-1" id="stat-cfsGroundRent">₹0</div>
            <div class="text-[11px] text-slate-400 mt-1">Off-dock storage clock</div>
          </div>
          <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 shadow">
            <div class="text-xs font-medium text-slate-400">At-Risk Containers</div>
            <div class="text-2xl font-bold text-rose-500 mt-1" id="stat-atRiskCount">0</div>
            <div class="text-[11px] text-slate-400 mt-1">Urgency High / Critical</div>
          </div>
        </div>

        <!-- At-Risk Alert Banner -->
        <div id="riskAlertBanner" class="hidden mb-6 p-4 rounded-xl bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-600/40 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">!</div>
            <div>
              <div class="text-sm font-semibold text-rose-200">Critical Two-Clock Fallback Active on Container MSKU7890123</div>
              <div class="text-xs text-slate-400">DPD evacuation failed. Both carrier demurrage and CFS ground rent clocks are actively accruing charges.</div>
            </div>
          </div>
          <button onclick="openContainerDetail('cnt-msku7890123')" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow">Inspect Two-Clock Exposure</button>
        </div>

        <!-- Containers Table -->
        <div class="bg-slate-800/80 rounded-xl border border-slate-700/80 overflow-hidden shadow">
          <div class="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-white tracking-wide uppercase">Operational Container Registry</h2>
            <div class="text-xs text-slate-400" id="containerCountBadge">Showing 0 containers</div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-700">
                <tr>
                  <th class="px-6 py-3">Container #</th>
                  <th class="px-6 py-3">Client</th>
                  <th class="px-6 py-3">Delivery Mode</th>
                  <th class="px-6 py-3">Status</th>
                  <th class="px-6 py-3">Deterministic Risk</th>
                  <th class="px-6 py-3">Demurrage</th>
                  <th class="px-6 py-3">CFS Rent</th>
                  <th class="px-6 py-3">Total Exposure</th>
                  <th class="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="containersTableBody" class="divide-y divide-slate-700/60">
                <!-- Populated dynamically -->
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- CSV INGESTION TAB -->
      <section id="view-import" class="hidden">
        <div class="bg-slate-800/80 rounded-xl border border-slate-700/80 p-6 shadow">
          <div class="flex items-center justify-between pb-4 border-b border-slate-700 mb-6">
            <div>
              <h2 class="text-base font-bold text-white">CSV Ingestion Pipeline (Platform Plan §2)</h2>
              <p class="text-xs text-slate-400 mt-0.5">Stream/Parse → Zod Validation → Error Detection → Staging Preview → User Confirmation → Atomic DB Insert</p>
            </div>
            <button onclick="loadSampleCsv()" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg font-medium">Load Realistic CSV Sample</button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Paste CSV Contents (Includes client_name & delivery_mode):</label>
              <textarea id="csvInput" rows="6" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="container_number,client_name,delivery_mode,carrier_name,port_of_discharge,size_type..."></textarea>
            </div>
            <div class="flex justify-between items-center">
              <div class="text-xs text-slate-400">
                <span class="text-amber-400 font-medium">Platform Rule:</span> If <code class="text-indigo-300">delivery_mode</code> is blank, it defaults conservatively to <code class="text-indigo-300">CFS</code> (never DPD_DIRECT).
              </div>
              <button onclick="previewCsv()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow">Validate & Preview Staging Batch</button>
            </div>

            <!-- Staging Preview Area -->
            <div id="stagingPreviewArea" class="hidden mt-6 pt-6 border-t border-slate-700">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-sm font-bold text-white">Staging Batch Preview</h3>
                  <div class="text-xs text-slate-400 mt-0.5" id="stagingStats">0 Total Rows</div>
                </div>
                <button onclick="commitCsv()" id="btnCommitBatch" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow">Confirm & Atomic Insert</button>
              </div>
              <div class="overflow-x-auto rounded-lg border border-slate-700">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th class="px-4 py-2.5">Row</th>
                      <th class="px-4 py-2.5">Container #</th>
                      <th class="px-4 py-2.5">Client</th>
                      <th class="px-4 py-2.5">Delivery Mode</th>
                      <th class="px-4 py-2.5">Carrier</th>
                      <th class="px-4 py-2.5">Validation Notes</th>
                    </tr>
                  </thead>
                  <tbody id="stagingTableBody" class="divide-y divide-slate-700/60 bg-slate-800"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- QUEUES TAB -->
      <section id="view-queues" class="hidden">
        <div class="bg-slate-800/80 rounded-xl border border-slate-700/80 p-6 shadow">
          <div class="flex items-center justify-between pb-4 border-b border-slate-700 mb-4">
            <div>
              <h2 class="text-base font-bold text-white">BullMQ Asynchronous Job Pipeline (Platform Plan §3)</h2>
              <p class="text-xs text-slate-400">Decoupled execution: calculate-container-risk, check-expiring-free-time, process-document-extraction, send-task-confirmation</p>
            </div>
            <button onclick="refreshQueues()" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs text-white rounded-lg font-medium">Refresh Queue</button>
          </div>
          <div class="overflow-x-auto rounded-lg border border-slate-700">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-900 text-slate-400 text-[10px] uppercase">
                <tr>
                  <th class="px-4 py-2.5">Job ID</th>
                  <th class="px-4 py-2.5">Queue / Job Name</th>
                  <th class="px-4 py-2.5">Timestamp</th>
                  <th class="px-4 py-2.5">Payload Data</th>
                </tr>
              </thead>
              <tbody id="queuesTableBody" class="divide-y divide-slate-700/60 bg-slate-800"></tbody>
            </table>
          </div>
        </div>
      </section>
    </main>

    <!-- CONTAINER DETAIL MODAL -->
    <div id="containerModal" class="hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div class="flex items-center space-x-3">
            <h2 class="text-xl font-bold text-white font-mono" id="modalContainerNumber">MSKU0000000</h2>
            <span id="modalModeBadge" class="px-2.5 py-1 text-xs font-bold rounded">CFS</span>
            <span id="modalTwoClockBadge" class="hidden px-2.5 py-1 text-xs font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">TWO-CLOCK ACTIVE</span>
          </div>
          <button onclick="closeModal()" class="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
        </div>

        <div class="space-y-6">
          <!-- Fallback Simulation Banner -->
          <div id="modalFallbackControl" class="p-4 rounded-xl bg-slate-800/80 border border-amber-500/40 flex items-center justify-between">
            <div>
              <div class="text-xs font-bold text-amber-300 uppercase tracking-wider">Appendix B Primary Demo Flow</div>
              <div class="text-xs text-slate-300 mt-0.5">Trigger DPD_TO_CFS_FALLBACK event to engage the secondary CFS storage clock and shifting charge fee.</div>
            </div>
            <button onclick="triggerFallbackCurrent()" id="btnTriggerFallback" class="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow">
              ⚡ Trigger DPD Fallback Now
            </button>
          </div>

          <!-- Two-Clock Financial Breakdown Card -->
          <div class="bg-slate-800/60 rounded-xl p-5 border border-slate-700">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Financial Exposure & Two-Clock Clocks (INR ₹)</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Clock 1: Carrier Demurrage -->
              <div class="bg-slate-900/80 p-4 rounded-lg border border-indigo-900/40">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-xs font-semibold text-indigo-300">Clock 1: Carrier Demurrage</div>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-200">Discharge Basis</span>
                </div>
                <div class="text-lg font-bold text-white" id="modalCarrierDemurrage">₹0</div>
                <div class="text-xs text-slate-400 mt-1" id="modalCarrierDays">0 days overdue (Free time: 5 days)</div>
              </div>

              <!-- Clock 2: CFS Ground Rent -->
              <div class="bg-slate-900/80 p-4 rounded-lg border border-cyan-900/40">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-xs font-semibold text-cyan-300">Clock 2: CFS Ground Rent</div>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-200">CFS_GATE_IN Basis</span>
                </div>
                <div class="text-lg font-bold text-white" id="modalCfsGroundRent">₹0</div>
                <div class="text-xs text-slate-400 mt-1" id="modalCfsDays">0 days overdue (Free time: 3 days)</div>
              </div>
            </div>

            <!-- Shifting and Total -->
            <div class="mt-4 pt-4 border-t border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div class="text-slate-300">
                Terminal Shifting Charge (Audit Target): <span class="font-bold font-mono text-white" id="modalShifting">₹0</span>
              </div>
              <div class="text-right">
                <span class="text-slate-400">Total Exposure: </span>
                <span class="text-base font-bold font-mono text-amber-400" id="modalTotalExposure">₹0</span>
                <span class="text-slate-400 ml-2">(Projected 72h: <span class="text-rose-400 font-semibold" id="modalProjectedExposure">₹0</span>)</span>
              </div>
            </div>
          </div>

          <!-- Deterministic Explainable Risk Analysis -->
          <div class="bg-slate-800/60 rounded-xl p-5 border border-slate-700">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Deterministic Risk & Compliance Explainability</h3>
              <div id="modalRiskScoreBadge" class="text-xs font-bold px-2.5 py-1 rounded">Score: 0</div>
            </div>
            <div class="space-y-2" id="modalRiskReasons">
              <!-- Rendered dynamically -->
            </div>
          </div>

          <!-- External Task Assignment / Trucker Handoff (Platform Plan §7) -->
          <div class="bg-slate-800/60 rounded-xl p-5 border border-slate-700">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">External Trucker Handoff & Dispatch</h3>
            <div id="modalTaskStatusArea" class="space-y-3">
              <!-- Populated dynamically -->
            </div>
          </div>

          <!-- Document Intelligence Staging (Human-in-the-loop) -->
          <div class="bg-slate-800/60 rounded-xl p-5 border border-slate-700" id="modalDocArea">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Document Intelligence & Human Confirmation</h3>
            <div id="modalDocContent" class="space-y-2 text-xs text-slate-300">
              <!-- Populated dynamically -->
            </div>
          </div>

          <!-- Event Timeline -->
          <div class="bg-slate-800/60 rounded-xl p-5 border border-slate-700">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Event Timeline (Immutable Audit Trail)</h3>
            <div class="space-y-2" id="modalEventTimeline">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DRIVER EXTERNAL CONFIRMATION MODAL / VIEW (For testing the token link) -->
    <div id="externalConfirmModal" class="hidden fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center space-x-2 text-emerald-400 text-xs font-bold mb-2">
          <span>🔒 Single-Purpose Unauthenticated Dispatch Link</span>
        </div>
        <h2 class="text-lg font-bold text-white mb-1">Confirm Container Pickup Assignment</h2>
        <p class="text-xs text-slate-400 mb-4">No password or login required. Valid for 72 hours from dispatch.</p>

        <div class="bg-slate-800/90 p-4 rounded-xl border border-slate-700 space-y-2 text-xs mb-6">
          <div class="flex justify-between">
            <span class="text-slate-400">Container:</span>
            <span class="font-bold font-mono text-white" id="extConfirmContainer">---</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Client / Consignee:</span>
            <span class="font-medium text-white" id="extConfirmClient">---</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Assigned Driver:</span>
            <span class="font-medium text-indigo-300" id="extConfirmDriver">---</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Location / Terminal:</span>
            <span class="font-medium text-white" id="extConfirmLocation">---</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Token Status:</span>
            <span class="font-medium text-emerald-400" id="extConfirmTokenStatus">Active (72h expiry)</span>
          </div>
        </div>

        <div id="extConfirmSuccessMsg" class="hidden p-3 bg-emerald-900/40 border border-emerald-600/50 rounded-lg text-xs text-emerald-300 mb-4 text-center font-medium">
          ✓ Pickup Confirmed! CHA operational dashboard has been updated in real-time.
        </div>

        <div class="flex justify-end space-x-3">
          <button onclick="closeExternalConfirmModal()" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg">Close</button>
          <button onclick="submitExternalConfirm()" id="btnSubmitConfirm" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow">Confirm Container Pickup (1-Tap)</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const API = 'http://localhost:4000';
    let currentScopeClientId = '';
    let currentContainer = null;
    let currentToken = '${initialToken}';

    async function init() {
      await loadClients();
      await loadDashboard();
      if (currentToken) {
        openExternalConfirmByToken(currentToken);
      }
    }

    function switchTab(tab) {
      ['dashboard', 'import', 'queues'].forEach(t => {
        document.getElementById('view-' + t).classList.add('hidden');
        document.getElementById('tab-' + t).classList.remove('bg-indigo-600', 'text-white');
        document.getElementById('tab-' + t).classList.add('text-slate-400');
      });
      document.getElementById('view-' + tab).classList.remove('hidden');
      document.getElementById('tab-' + tab).classList.add('bg-indigo-600', 'text-white');
      document.getElementById('tab-' + tab).classList.remove('text-slate-400');
      if (tab === 'queues') refreshQueues();
    }

    async function loadClients() {
      try {
        const res = await fetch(API + '/api/v1/clients');
        const data = await res.json();
        if (data.success && data.clients) {
          const sel = document.getElementById('clientSelect');
          sel.innerHTML = '<option value="">All Clients (Portfolio Rollup)</option>' +
            data.clients.map(c => '<option value="' + c.id + '">' + c.name + (c.isAeoAcp ? ' (AEO-T2)' : '') + '</option>').join('');
        }
      } catch (e) {
        console.error('Failed loading clients', e);
      }
    }

    function onClientChange(clientId) {
      currentScopeClientId = clientId;
      loadDashboard();
    }

    async function loadDashboard() {
      try {
        let q = currentScopeClientId ? '?clientId=' + currentScopeClientId : '';
        const [sumRes, contRes] = await Promise.all([
          fetch(API + '/api/v1/analytics/exposure-summary' + q),
          fetch(API + '/api/v1/containers' + q)
        ]);
        const sumData = await sumRes.json();
        const contData = await contRes.json();

        if (sumData.success && sumData.summary) {
          const s = sumData.summary;
          document.getElementById('stat-totalExposure').innerText = '₹' + s.totalCurrentExposure.toLocaleString('en-IN');
          document.getElementById('stat-projectedExposure').innerText = '₹' + s.totalProjectedExposure.toLocaleString('en-IN');
          document.getElementById('stat-carrierDemurrage').innerText = '₹' + s.totalCarrierDemurrage.toLocaleString('en-IN');
          document.getElementById('stat-cfsGroundRent').innerText = '₹' + s.totalCfsGroundRent.toLocaleString('en-IN');
          document.getElementById('stat-atRiskCount').innerText = s.atRiskCount;
        }

        if (contData.success && contData.containers) {
          renderContainersTable(contData.containers);
        }
      } catch (e) {
        console.error('Failed loading dashboard', e);
      }
    }

    function renderContainersTable(containers) {
      document.getElementById('containerCountBadge').innerText = 'Showing ' + containers.length + ' containers';
      const tbody = document.getElementById('containersTableBody');
      
      let hasTwoClockAlert = false;

      tbody.innerHTML = containers.map(c => {
        const bd = c.chargeBreakdown || {};
        const risk = c.riskAssessment || { score: 0, urgency: 'LOW' };
        const isTwoClock = bd.isTwoClockActive;
        if (isTwoClock) hasTwoClockAlert = true;

        let modeBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/40">CFS</span>';
        if (c.deliveryMode === 'DPD_DIRECT') {
          modeBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700/40">DPD DIRECT</span>';
        } else if (c.deliveryMode === 'DPD_CFS') {
          modeBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700/40">DPD CFS</span>';
        }

        let twoClockTag = isTwoClock ? '<span class="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-900/80 text-rose-300 border border-rose-600/50">2-CLOCK</span>' : '';

        let riskBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">LOW</span>';
        if (risk.urgency === 'CRITICAL') {
          riskBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-900/80 text-rose-300 border border-rose-600">CRITICAL (' + risk.score + ')</span>';
        } else if (risk.urgency === 'HIGH') {
          riskBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/80 text-amber-300 border border-amber-600">HIGH (' + risk.score + ')</span>';
        } else if (risk.urgency === 'MEDIUM') {
          riskBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-900/80 text-yellow-300">MED (' + risk.score + ')</span>';
        }

        return '<tr class="hover:bg-slate-850/50 transition-colors">' +
          '<td class="px-6 py-4 font-mono font-bold text-white">' + c.containerNumber + '</td>' +
          '<td class="px-6 py-4 text-slate-300">' + c.clientName + '</td>' +
          '<td class="px-6 py-4">' + modeBadge + twoClockTag + '</td>' +
          '<td class="px-6 py-4 text-slate-400">' + c.status + '</td>' +
          '<td class="px-6 py-4">' + riskBadge + '</td>' +
          '<td class="px-6 py-4 font-mono text-indigo-300">₹' + (bd.carrierDemurrage || 0).toLocaleString('en-IN') + '</td>' +
          '<td class="px-6 py-4 font-mono text-cyan-300">₹' + (bd.cfsGroundRent || 0).toLocaleString('en-IN') + '</td>' +
          '<td class="px-6 py-4 font-mono font-bold text-amber-400">₹' + (bd.currentExposure || 0).toLocaleString('en-IN') + '</td>' +
          '<td class="px-6 py-4 text-right"><button onclick="openContainerDetail(\\'' + c.id + '\\')" class="px-3 py-1 bg-slate-700 hover:bg-indigo-600 hover:text-white text-slate-200 rounded text-xs font-medium transition-colors">Inspect</button></td>' +
        '</tr>';
      }).join('');

      const alertBanner = document.getElementById('riskAlertBanner');
      if (hasTwoClockAlert) alertBanner.classList.remove('hidden');
      else alertBanner.classList.add('hidden');
    }

    async function openContainerDetail(id) {
      try {
        const res = await fetch(API + '/api/v1/containers/' + id);
        const data = await res.json();
        if (data.success && data.container) {
          currentContainer = data.container;
          populateModal(data.container, data.documents || []);
          document.getElementById('containerModal').classList.remove('hidden');
        }
      } catch (e) {
        console.error(e);
      }
    }

    function populateModal(c, docs) {
      document.getElementById('modalContainerNumber').innerText = c.containerNumber;
      
      const badge = document.getElementById('modalModeBadge');
      badge.innerText = c.deliveryMode;
      badge.className = 'px-2.5 py-1 text-xs font-bold rounded ' + 
        (c.deliveryMode === 'DPD_DIRECT' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/40' : 
         c.deliveryMode === 'DPD_CFS' ? 'bg-amber-900/60 text-amber-300 border border-amber-700/40' : 'bg-blue-900/60 text-blue-300 border border-blue-700/40');

      const bd = c.chargeBreakdown || {};
      const twoClockTag = document.getElementById('modalTwoClockBadge');
      if (bd.isTwoClockActive) twoClockTag.classList.remove('hidden');
      else twoClockTag.classList.add('hidden');

      // Fallback trigger button visibility
      const btnFallback = document.getElementById('modalFallbackControl');
      if (c.deliveryMode === 'DPD_CFS' && !bd.isTwoClockActive) {
        btnFallback.classList.remove('hidden');
      } else {
        btnFallback.classList.add('hidden');
      }

      // Charges
      document.getElementById('modalCarrierDemurrage').innerText = '₹' + (bd.carrierDemurrage || 0).toLocaleString('en-IN');
      document.getElementById('modalCarrierDays').innerText = (bd.carrierDaysOverdue || 0) + ' days overdue (Free time: 5 days)';
      document.getElementById('modalCfsGroundRent').innerText = '₹' + (bd.cfsGroundRent || 0).toLocaleString('en-IN');
      document.getElementById('modalCfsDays').innerText = (bd.cfsDaysOverdue || 0) + ' days overdue at CFS (Free time: 3 days)';
      document.getElementById('modalShifting').innerText = '₹' + (bd.shiftingCharges || 0).toLocaleString('en-IN');
      document.getElementById('modalTotalExposure').innerText = '₹' + (bd.currentExposure || 0).toLocaleString('en-IN');
      document.getElementById('modalProjectedExposure').innerText = '₹' + (bd.projectedExposure || 0).toLocaleString('en-IN');

      // Risk
      const risk = c.riskAssessment || { score: 0, urgency: 'LOW', reasons: [] };
      const riskBadge = document.getElementById('modalRiskScoreBadge');
      riskBadge.innerText = 'Risk Score: ' + risk.score + ' / 100 (' + risk.urgency + ')';
      riskBadge.className = 'text-xs font-bold px-2.5 py-1 rounded ' + 
        (risk.urgency === 'CRITICAL' ? 'bg-rose-900/80 text-rose-200 border border-rose-600' : 
         risk.urgency === 'HIGH' ? 'bg-amber-900/80 text-amber-200 border border-amber-600' : 'bg-slate-700 text-slate-300');

      const reasonsList = document.getElementById('modalRiskReasons');
      reasonsList.innerHTML = (risk.reasons || []).map(r => 
        '<div class="flex items-start space-x-2 text-xs"><span class="text-rose-400 font-bold">•</span><span class="text-slate-300">' + r + '</span></div>'
      ).join('');

      // Tasks
      renderTaskSection(c);

      // Docs
      renderDocSection(docs);

      // Event Timeline
      const timeline = document.getElementById('modalEventTimeline');
      timeline.innerHTML = (c.events || []).map(ev => 
        '<div class="flex items-center justify-between text-xs py-1.5 border-b border-slate-800 last:border-0">' +
          '<div class="flex items-center space-x-2">' +
            '<span class="font-mono font-semibold text-indigo-400">' + ev.eventType + '</span>' +
            '<span class="text-slate-400">@ ' + ev.location + '</span>' +
          '</div>' +
          '<span class="text-slate-400 font-mono text-[11px]">' + new Date(ev.eventTimestamp).toLocaleString() + '</span>' +
        '</div>'
      ).join('');
    }

    function renderTaskSection(c) {
      const area = document.getElementById('modalTaskStatusArea');
      const tasks = c.tasks || [];
      const pickupTask = tasks.find(t => t.taskType === 'TRUCKER_PICKUP');

      if (pickupTask) {
        let tokenHtml = '';
        if (pickupTask.confirmationToken) {
          const confirmLink = 'http://localhost:3000/tasks/confirm/' + pickupTask.confirmationToken;
          tokenHtml = '<div class="mt-2 p-2.5 bg-slate-900 rounded border border-slate-700 text-xs">' +
            '<div class="text-slate-400 text-[11px] mb-1">Single-Purpose Unauthenticated Driver Dispatch Link (72h Expiry):</div>' +
            '<div class="flex items-center space-x-2">' +
              '<input type="text" readonly value="' + confirmLink + '" class="flex-1 bg-slate-950 font-mono text-emerald-400 text-xs px-2 py-1 rounded border border-slate-800">' +
              '<button onclick="openExternalConfirmByToken(\\'' + pickupTask.confirmationToken + '\\')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold">Test Driver Screen</button>' +
            '</div>' +
          '</div>';
        }

        area.innerHTML = '<div class="p-3 bg-slate-900 rounded-lg border border-slate-700">' +
          '<div class="flex items-center justify-between">' +
            '<div>' +
              '<span class="text-xs font-bold text-white">' + pickupTask.title + '</span>' +
              '<div class="text-xs text-slate-400">Assigned to: ' + pickupTask.assigneeName + ' (' + (pickupTask.assigneeContact || '') + ')</div>' +
            '</div>' +
            '<span class="px-2 py-0.5 rounded text-[10px] font-bold ' + 
              (pickupTask.status === 'CONFIRMED' ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600' : 'bg-amber-900/60 text-amber-300 border border-amber-600') + '">' +
              pickupTask.status +
            '</span>' +
          '</div>' +
          tokenHtml +
        '</div>';
      } else {
        area.innerHTML = '<div class="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">' +
          '<span class="text-xs text-slate-400">No transport task dispatched yet.</span>' +
          '<button onclick="assignTruckerPrompt()" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg">Assign Pickup to Trucker</button>' +
        '</div>';
      }
    }

    function renderDocSection(docs) {
      const area = document.getElementById('modalDocContent');
      if (!docs || docs.length === 0) {
        area.innerHTML = '<div class="text-slate-400">No documents attached.</div>';
        return;
      }
      area.innerHTML = docs.map(d => {
        const ext = d.stagedExtraction;
        if (!ext) return '<div class="p-2 bg-slate-900 rounded">' + d.fileName + ' (Extraction pending)</div>';

        const fields = ext.extractedFields || {};
        return '<div class="p-3 bg-slate-900 rounded-lg border border-slate-700 space-y-2">' +
          '<div class="flex items-center justify-between">' +
            '<span class="font-bold text-white">' + d.fileName + '</span>' +
            '<span class="text-[11px] px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300">Confidence: ' + Math.round(ext.confidenceScore * 100) + '%</span>' +
          '</div>' +
          '<div class="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">' +
            '<div>BL #: ' + (fields.blNumber || '---') + '</div>' +
            '<div>HS Code: ' + (fields.hsCode || '---') + '</div>' +
            '<div>Consignee: ' + (fields.consignee || '---') + '</div>' +
            '<div>Weight: ' + (fields.declaredWeightKg ? fields.declaredWeightKg + ' kg' : '---') + '</div>' +
          '</div>' +
          '<div class="pt-2 flex justify-end">' +
            (ext.humanConfirmed ? 
             '<span class="text-emerald-400 text-xs font-semibold">✓ Human Confirmed into Authoritative Record</span>' :
             '<button onclick="confirmDocExtraction(\\'' + d.id + '\\')" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded">Accept Extraction into System of Record</button>') +
          '</div>' +
        '</div>';
      }).join('');
    }

    async function triggerFallbackCurrent() {
      if (!currentContainer) return;
      try {
        const res = await fetch(API + '/api/v1/containers/' + currentContainer.id + '/trigger-fallback', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          await openContainerDetail(currentContainer.id);
          await loadDashboard();
        }
      } catch (e) {
        console.error(e);
      }
    }

    async function assignTruckerPrompt() {
      if (!currentContainer) return;
      const driverName = prompt('Enter external driver name:', 'Rajesh Sharma (SpeedLine Transporters)') || 'Rajesh Sharma';
      const driverPhone = prompt('Enter driver phone for SMS link dispatch:', '+91 98201 54321') || '+91 98201 54321';

      try {
        const res = await fetch(API + '/api/v1/tasks/assign-external', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            containerId: currentContainer.id,
            assigneeName: driverName,
            assigneeContact: driverPhone
          })
        });
        const data = await res.json();
        if (data.success) {
          await openContainerDetail(currentContainer.id);
          await loadDashboard();
        }
      } catch (e) {
        console.error(e);
      }
    }

    async function confirmDocExtraction(docId) {
      try {
        const res = await fetch(API + '/api/v1/documents/' + docId + '/confirm-extraction', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          if (currentContainer) await openContainerDetail(currentContainer.id);
          await loadDashboard();
        }
      } catch (e) {
        console.error(e);
      }
    }

    function closeModal() {
      document.getElementById('containerModal').classList.add('hidden');
    }

    // EXTERNAL DRIVER CONFIRMATION SCREEN (Unauthenticated Flow)
    async function openExternalConfirmByToken(token) {
      currentToken = token;
      try {
        const res = await fetch(API + '/api/v1/tasks/by-token/' + token);
        const data = await res.json();
        if (data.success) {
          document.getElementById('extConfirmContainer').innerText = data.container ? data.container.containerNumber : '---';
          document.getElementById('extConfirmClient').innerText = data.container ? data.container.clientName : '---';
          document.getElementById('extConfirmDriver').innerText = data.task.assigneeName;
          document.getElementById('extConfirmLocation').innerText = data.container ? (data.container.cfsName || data.container.portOfDischarge) : 'Port Gate';
          
          const btn = document.getElementById('btnSubmitConfirm');
          const msg = document.getElementById('extConfirmSuccessMsg');
          if (data.task.status === 'CONFIRMED') {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            msg.classList.remove('hidden');
            msg.innerText = '✓ Task already confirmed at ' + new Date(data.task.confirmedAt).toLocaleString();
          } else {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            msg.classList.add('hidden');
          }

          document.getElementById('externalConfirmModal').classList.remove('hidden');
        } else {
          alert(data.error || 'Invalid token');
        }
      } catch (e) {
        console.error(e);
      }
    }

    async function submitExternalConfirm() {
      if (!currentToken) return;
      try {
        const res = await fetch(API + '/api/v1/tasks/confirm/' + currentToken, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          document.getElementById('extConfirmSuccessMsg').classList.remove('hidden');
          document.getElementById('btnSubmitConfirm').disabled = true;
          document.getElementById('btnSubmitConfirm').classList.add('opacity-50');
          // Update background dashboard immediately
          loadDashboard();
          if (currentContainer) openContainerDetail(currentContainer.id);
        } else {
          alert('Error: ' + data.error);
        }
      } catch (e) {
        console.error(e);
      }
    }

    function closeExternalConfirmModal() {
      document.getElementById('externalConfirmModal').classList.add('hidden');
    }

    // CSV Ingestion
    function loadSampleCsv() {
      document.getElementById('csvInput').value = 
        "container_number,client_name,delivery_mode,carrier_name,port_of_discharge,size_type\\n" +
        "MSKU9182734,Tata Motors Commercial Vehicles,DPD_CFS,MAERSK,INNSA (Nhava Sheva),40HC\\n" +
        "MEDU1928374,Reliance Retail Logistics,,MSC,INNSA (Nhava Sheva),40HC\\n" +
        "CMAU8273645,Sun Pharma Advanced Logistics,DPD_DIRECT,CMA CGM,INNSA (Nhava Sheva),20GP";
    }

    let stagedBatchId = null;

    async function previewCsv() {
      const text = document.getElementById('csvInput').value;
      if (!text.trim()) return alert('Please enter or paste CSV text.');
      try {
        const res = await fetch(API + '/api/v1/ingestion/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvContent: text })
        });
        const data = await res.json();
        if (data.success && data.report) {
          stagedBatchId = data.report.batchId;
          document.getElementById('stagingPreviewArea').classList.remove('hidden');
          document.getElementById('stagingStats').innerText = 
            data.report.totalRows + ' total rows (' + data.report.validRows + ' valid, ' + data.report.warningRows + ' warnings, ' + data.report.errorRows + ' errors)';

          const tbody = document.getElementById('stagingTableBody');
          tbody.innerHTML = data.report.rows.map(r => {
            let notes = '';
            if (r.errors.length) notes += '<div class="text-rose-400 font-semibold">' + r.errors.join(', ') + '</div>';
            if (r.warnings.length) notes += '<div class="text-amber-400">' + r.warnings.join(', ') + '</div>';
            if (!notes) notes = '<span class="text-emerald-400">Valid</span>';

            return '<tr>' +
              '<td class="px-4 py-2 font-mono">' + r.rowNumber + '</td>' +
              '<td class="px-4 py-2 font-mono font-bold text-white">' + r.containerNumber + '</td>' +
              '<td class="px-4 py-2">' + r.clientIdentifier + '</td>' +
              '<td class="px-4 py-2 font-bold text-indigo-300">' + r.deliveryMode + '</td>' +
              '<td class="px-4 py-2">' + r.carrierName + '</td>' +
              '<td class="px-4 py-2 text-[11px]">' + notes + '</td>' +
            '</tr>';
          }).join('');
        }
      } catch (e) {
        console.error(e);
      }
    }

    async function commitCsv() {
      if (!stagedBatchId) return;
      try {
        const res = await fetch(API + '/api/v1/ingestion/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchId: stagedBatchId })
        });
        const data = await res.json();
        if (data.success) {
          alert('Successfully committed ' + data.createdCount + ' containers to database!');
          document.getElementById('stagingPreviewArea').classList.add('hidden');
          document.getElementById('csvInput').value = '';
          switchTab('dashboard');
          loadDashboard();
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Queues
    async function refreshQueues() {
      try {
        const res = await fetch(API + '/api/v1/queues/history');
        const data = await res.json();
        if (data.success && data.history) {
          const tbody = document.getElementById('queuesTableBody');
          tbody.innerHTML = data.history.slice().reverse().map(j => 
            '<tr>' +
              '<td class="px-4 py-2 font-mono text-slate-400">' + j.id + '</td>' +
              '<td class="px-4 py-2 font-bold text-indigo-300 font-mono">' + j.name + '</td>' +
              '<td class="px-4 py-2 text-slate-400 font-mono text-[11px]">' + new Date(j.timestamp).toLocaleTimeString() + '</td>' +
              '<td class="px-4 py-2 font-mono text-[11px] text-slate-300">' + JSON.stringify(j.data) + '</td>' +
            '</tr>'
          ).join('');
        }
      } catch (e) {
        console.error(e);
      }
    }

    window.onload = init;
  </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // Driver unauthenticated confirmation direct route: /tasks/confirm/:token
  if (pathname.startsWith('/tasks/confirm/')) {
    const token = pathname.split('/')[3] || '';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(renderHtml(token));
    return;
  }

  // Root or any SPA route
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(renderHtml());
});

server.listen(PORT, () => {
  console.log(`DemurrageOS Operational Web Dashboard running at http://localhost:${PORT}`);
});
