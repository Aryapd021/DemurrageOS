# DemurrageOS — Container Demurrage & Ground Rent Prevention Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14%2F15-black.svg)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2-yellow.svg)](https://vitest.dev/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-Supported-2496ED.svg)](https://docs.docker.com/compose/)

---

## 1. Executive Summary

**DemurrageOS** is an intelligent, high-reliability logistics intelligence and operational automation platform engineered for **Customs House Agents (CHAs)**, freight forwarders, and institutional importers/exporters. 

In maritime container logistics, delays incur compounding, punitive charges:
1. **Shipping Line Demurrage & Detention**: Carrier charges for keeping equipment past allowable free-time days.
2. **CFS (Container Freight Station) Ground Rent**: Terminal holding charges accumulating once a container is evacuated to a CFS.
3. **Customs Clearance Delays**: Regulatory bottlenecks stemming from first-time HS code classifications, valuation queries, missing documentation, or accreditation gaps (AEO/ACP).

DemurrageOS is architected not simply as a passive tracking dashboard, but as an active **prevention and operational unification system**. It synthesizes compliance signals, predicts deadline exposure, calculates two-clock financials, automates external transporter handoffs, and leverages advisory AI extraction with human-in-the-loop review.

---

## 2. Core Architectural Philosophy & Invariants

DemurrageOS strictly adheres to mission-critical design invariants to ensure regulatory compliance, financial auditability, and zero system fragility:

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 Advisory AI Service                     │
                  │             (Python FastAPI / OCR / NLP)                │
                  │      Suggests structured extractions; advisory only     │
                  └───────────────────────────┬─────────────────────────────┘
                                              │ POST /extract
                                              ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                           Authoritative Express Monolith                                  │
│             Route -> Middleware -> Controller -> Domain Service -> Repository             │
│   • Staging & Human Review: AI values NEVER touch authoritative tables without approval   │
│   • Deterministic Risk Engine: AI never calculates or overwrites the final risk score     │
│   • Two-Clock Financial Engine: Carrier clock + CFS ground-rent clock                     │
│   • Multi-Tenant Scoping: Strict organizationId and visibleClientIds enforcement          │
│   • 256-Bit Hashed Tokens: 72-hour lifetime, replay-protected external handoffs          │
└─────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
        ┌───────────────────────────┐                   ┌───────────────────────────┐
        │   PostgreSQL (Prisma)     │                   │       Redis / BullMQ      │
        │    Source of Truth        │                   │   Asynchronous Execution  │
        └───────────────────────────┘                   └───────────────────────────┘
```

### Invariant Principles

1. **Advisory AI vs. Authoritative Core**:
   - The Python AI microservice is strictly **advisory**. It extracts document text, performs ISO 6346 check-digit verification, and suggests field values alongside confidence scores.
   - AI outputs are staged in `originalExtractedFields` and **never** mutate authoritative container records (`containerNumber`, `billOfLading`, `declaredValue`, etc.) without explicit human verification (`ACCEPT` or `CORRECT`).
2. **Deterministic Risk & Financial Calculation**:
   - Large Language Models (LLMs) and probabilistic models are **strictly prohibited** from computing or modifying the final operational risk score (`0–100`) or financial charges.
   - Risk and charges are computed via deterministic, reproducible domain engines with complete audit explainability.
3. **Graceful Degradation & Decoupling**:
   - If the Python AI service or Redis goes offline, all core functions (container lifecycle tracking, risk evaluation, two-clock tariff computation, manual compliance overrides, external trucker handoffs, and multi-tenant authorization) continue operating with 100% integrity.
4. **Zero Internal Data Leakage for External Parties**:
   - Transporters access tasks via unauthenticated, cryptographically random 256-bit entropy tokens.
   - The public projection exposes only the minimal operational attributes required for pickup (container number, pickup location, scheduled window). Zero internal financial, tenant, or client intelligence is leaked.

---

## 3. Monorepo Structure

The repository is organized as an npm workspaces monorepo:

```
demmug/
├── apps/
│   ├── ai-service/             # Advisory AI Microservice (FastAPI, Python 3.12)
│   │   ├── app/
│   │   │   ├── config.py       # Pydantic environment configuration
│   │   │   ├── main.py         # FastAPI entrypoint (/health, /extract)
│   │   │   ├── extraction/     # Domain document extractors & ISO 6346 validator
│   │   │   │   ├── base.py
│   │   │   │   ├── bill_of_entry.py
│   │   │   │   ├── bill_of_lading.py
│   │   │   │   ├── carrier_invoice.py
│   │   │   │   ├── cfs_gate_pass.py
│   │   │   │   ├── delivery_order.py
│   │   │   │   └── pipeline.py
│   │   │   ├── schemas/        # Pydantic request/response schemas
│   │   │   └── tests/          # Pytest suite
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── run_tests.py        # Standalone Python test runner
│   │
│   ├── api/                    # Authoritative Core API (Node.js, Express, TypeScript)
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # PostgreSQL 14-model relational schema
│   │   │   └── seed.ts         # Realistic synthetic seed data (Tata, Reliance, Pinnacle)
│   │   ├── src/
│   │   │   ├── app.ts          # Express application factory & route mounts
│   │   │   ├── server.ts       # HTTP server listener
│   │   │   ├── common/         # Standardized AppError and Winston/JSON logging
│   │   │   ├── config/         # Strongly typed environment configuration
│   │   │   ├── jobs/           # BullMQ queues & background workers
│   │   │   ├── lib/            # Prisma client & Redis client singletons
│   │   │   ├── middleware/     # Auth, Scoping, Request ID, and Error handlers
│   │   │   ├── modules/        # Modular domain feature packages
│   │   │   │   ├── audit/      # Immutable audit logging service
│   │   │   │   ├── charges/    # Two-clock demurrage/ground rent calculation engine
│   │   │   │   ├── compliance/ # Compliance signal derivation & manual overrides
│   │   │   │   ├── containers/ # Container lifecycle controller, repo, and routes
│   │   │   │   ├── documents/  # Document upload, staging, review, & provenance
│   │   │   │   ├── external/   # Unauthenticated 256-bit trucker confirmation routes
│   │   │   │   ├── notifications/ # Notification provider interface & console impl
│   │   │   │   ├── risk/       # Deterministic risk engine & explainability service
│   │   │   │   └── tasks/      # Internal & external task management
│   │   │   └── tests/          # Vitest unit & integration test suites
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                    # Next.js 14/15 Operational Web Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx  # Navigation shell, header, and global styles
│       │   │   ├── page.tsx    # Container exposure dashboard with client filters
│       │   │   ├── containers/[id]/page.tsx # Container cockpit (Risk, Signals, Clocks, Docs, Tasks)
│       │   │   └── external/task-confirmations/[token]/page.tsx # Mobile trucker landing page
│       │   └── lib/            # Typed API fetcher client & TanStack Query provider
│       ├── Dockerfile
│       ├── tailwind.config.ts
│       └── package.json
│
├── packages/
│   ├── config/                 # Base tsconfig and shared build configs
│   └── shared-types/           # Cross-service TypeScript interfaces & Zod schemas
│       ├── src/
│       │   ├── compliance.ts
│       │   ├── documents.ts
│       │   ├── risk.ts
│       │   ├── tasks.ts
│       │   └── index.ts
│       └── package.json
│
├── docker-compose.yml          # Multi-container orchestration (Postgres, Redis, API, AI, Web)
├── .env.example                # Canonical environment variable specification
└── package.json                # Workspace root script runner
```

---

## 4. Key Subsystems & Technical Implementation

### 4.1. Compliance Signal Engine (`apps/api/src/modules/compliance`)

Customs delays are the primary contributor to demurrage. DemurrageOS evaluates container readiness using 4 deterministic compliance signals:

```
                       ┌──────────────────────────────────────────────┐
                       │           Compliance Signal Engine           │
                       └──────────────────────┬───────────────────────┘
                                              │
         ┌──────────────────┬─────────────────┴───────────────┬──────────────────┐
         ▼                  ▼                                 ▼                  ▼
┌──────────────────┐ ┌──────────────────┐             ┌──────────────────┐ ┌──────────────────┐
│  HS Code Novelty │ │  Valuation Check │             │  AEO/ACP Status  │ │ Doc Completeness │
│ Frequency/Recency│ │   Z-Score Stat   │             │   Accreditation  │ │  BL + DO + BOE   │
│  Score: 20 - 95  │ │  Score: 30 - 95  │             │  Score: 50 - 100 │ │  Score: 0 - 100  │
└──────────────────┘ └──────────────────┘             └──────────────────┘ └──────────────────┘
```

1. **HS Code Novelty (`HS_CODE_NOVELTY`)**:
   - Assesses the importer's historical experience with the declared HS code to predict customs scrutiny.
   - **First-time classification**: Score `20` (novelty penalty).
   - **Stale history (>180 days)**: Score `40`.
   - **Infrequent history (90–180 days)**: Score `60`.
   - **Regular filings (30–90 days)**: Score `80`.
   - **Frequent/routine (<=30 days or >=5 prior shipments)**: Score `95`.
2. **Historical Valuation Consistency (`VALUATION_CONSISTENCY`)**:
   - Calculates sample mean (\(\mu\)) and standard deviation (\(\sigma\)) of declared values under the identical HS code for the client.
   - Computes statistical Z-score: \(Z = \frac{|x - \mu|}{\sigma}\).
   - **Normal Range (\(Z \le 1.5\sigma\))**: Score `95`.
   - **Moderate Outlier (\(1.5\sigma < Z \le 2.5\sigma\))**: Score `65`.
   - **Extreme Outlier (\(Z > 2.5\sigma\))**: Score `30`.
   - **Insufficient Data (\(<2\) historical records)**: Returns neutral score `50` with explicit `{ status: "INSUFFICIENT_HISTORICAL_DATA" }` metadata rather than false confidence.
3. **AEO / ACP Accreditation Status (`AEO_ACP_STATUS`)**:
   - Deterministically derived from Indian Customs accreditation programs.
   - **Dual-accredited (AEO + ACP)**: Score `100` (Eligible for green-channel clearance).
   - **AEO Certified only**: Score `85`.
   - **ACP Enrolled only**: Score `80`.
   - **Unaccredited / Standard**: Score `50`.
4. **Document Completeness (`DOC_COMPLETENESS`)**:
   - Assesses presence and review status of the mandatory document triad: `BILL_OF_LADING`, `DELIVERY_ORDER`, and `BILL_OF_ENTRY`.
   - Verified (`ACCEPTED`/`CORRECTED`) = 100 points, `PENDING_REVIEW` = 70 points, `MISSING` = 0 points.
5. **Manual Overrides**:
   - Authorized CHAs can override or input manual signals via `POST /api/v1/containers/:id/compliance-signals` with user attribution and reason logged to `AuditLog`.

---

### 4.2. Deterministic Risk Engine & Explainability (`apps/api/src/modules/risk`)

The Risk Engine synthesizes multiple operational dimensions into an actionable risk assessment:

$$\text{RiskScore} = \text{Baseline}(15) + \Delta_{\text{Deadline}} + \sum \text{Penalties}_{\text{Compliance}} + \text{Bonus}_{\text{Compliance}} + \Delta_{\text{Mode}} + \Delta_{\text{Hold}}$$

- **Deadline Countdown**:
  - Expiry in $<0$ hours (already in demurrage): $+50$ points.
  - Expiry in $\le 24$ hours: $+35$ points.
  - Expiry in $\le 72$ hours: $+20$ points.
- **Compliance Factor**:
  - Signals with score $<50$ penalize by: $\text{round}((50 - \text{score}) \times 0.4)$.
  - Signals with score $\ge 85$ apply a $-5$ bonus.
- **Delivery Mode & Status**:
  - `DPD_CFS` mode exposure: $+10$ points.
  - `CUSTOMS_HOLD` active: $+30$ points.
- **Severity Tiers**:
  - `CRITICAL`: $\ge 75$
  - `HIGH`: $50 - 74$
  - `MEDIUM`: $30 - 49$
  - `LOW`: $<30$
- **Explainability Output**:
  Every risk evaluation generates structured `RiskReason` items (with category, percentage point contribution, and explanation) and deduplicated `recommendedActions`.

---

### 4.3. Two-Clock Financial Engine (`apps/api/src/modules/charges`)

Calculates carrier demurrage and terminal ground rent across independent clocks:

```
Container Discharge @ Port Terminal
       │
       ├───────────────────────────────────────────────┐
       ▼                                               ▼
[ Clock 1: Carrier Demurrage ]               [ Delivery Mode Route ]
Starts: dischargeDate                                  │
Ends: gateOutDate (or today)               ┌───────────┴───────────┐
Applied against: Shipping Line Slabs       ▼                       ▼
                                      [DPD_DIRECT]               [CFS / DPD_CFS Fallback]
                                    No CFS Ground Rent            Container evacuates to CFS
                                                                           │
                                                                           ▼
                                                             [ Clock 2: CFS Ground Rent ]
                                                             Starts: gateInDate @ CFS
                                                             Ends: gateOutDate (or today)
                                                             Applied against: CFS Slabs
```

- **Progressive Slab Tariff Calculation**:
  Tariffs are evaluated against non-overlapping day tiers. For a 40ft container:
  - Days 1–3: Free (Rate: ₹0/day).
  - Days 4–7: Tier 1 (Rate: ₹5,000/day).
  - Days 8+: Tier 2 (Rate: ₹10,000/day).
- Both calculations run concurrently for `DPD_CFS` and `CFS` modes, delivering granular cost transparency.

---

### 4.4. Advisory AI Extraction & Human-in-the-Loop Review (`apps/ai-service` + `apps/api/src/modules/documents`)

The document pipeline combines automated extraction with human governance:

```
1. Document Upload (PDF/Image, max 10MB)
   │
   ▼
2. BullMQ Job Enqueued: `process-document-extraction`
   │
   ▼
3. Advisory AI Service (`POST /extract` @ Python FastAPI)
   ├── Extractor Pipeline: BL, DO, BOE, CFS Gate Pass, Carrier Invoice
   ├── ISO 6346 Container Number Check Digit Validation
   ├── Field-level confidence scores (0.00 - 1.00)
   └── Flag for review if confidence < 0.80 or container number missing
   │
   ▼
4. Express Staging: Stored in `Document.originalExtractedFields`
   │
   ▼
5. CHA Human Review via Next.js Side Drawer
   ├── Inspect extracted values alongside confidence indicators
   ├── Make corrections directly in UI
   └── Submit: ACCEPT | CORRECT | REJECT
   │
   ▼
6. Authoritative Update & Audit Provenance
   ├── Container record updated with approved fields
   └── Immutable snapshot logged to `DocumentExtractionProvenance`
```

#### ISO 6346 Check Digit Algorithm
Implemented in `apps/ai-service/app/extraction/base.py`:
- 4 letter owner prefix + 6 digit serial number + 1 check digit.
- Letters mapped to numeric codes: \(A=10, B=12, \dots, Z=38\) (multiples of 11 skipped).
- Weighted sum: \(\sum_{i=0}^9 \text{val}_i \times 2^i \pmod{11} \pmod{10}\).

---

### 4.5. Cryptographic External Task Handoff (`apps/api/src/modules/tasks` & `external`)

Enables frictionless trucker coordination without requiring account registration:

```
CHA creates PICKUP task with transporter phone/email
  │
  ├─► Generates 256-bit entropy token: crypto.randomBytes(32).toString('hex')
  ├─► Computes SHA-256 hash: Task.confirmationTokenHash (Plaintext NEVER stored)
  ├─► Sets 72-hour hard expiration: Task.tokenExpiresAt
  └─► Dispatches dispatch link via NotificationProvider

Transporter receives: https://app.demurrageos.com/external/task-confirmations/{token}
  │
  ├─► GET /api/v1/external/task-confirmations/:token
  │   └── Returns MINIMAL public payload: containerNumber, pickupLocation, scheduledDate
  │       (Zero internal financial or client data leaked)
  │
  └─► POST /api/v1/external/task-confirmations/:token/confirm
      ├── Verifies hash match & expiration window
      ├── Enforces one-time confirmation (prevents replay)
      ├── Sets Task.confirmedAt
      ├── Records ContainerEvent (PICKUP_SCHEDULED_BY_EXTERNAL_PARTY)
      ├── Automatically triggers Risk Engine recalculation
      └── Logs ExternalTaskConfirmationAudit with IP address and User Agent
```

---

### 4.6. Advisory Deterministic Predictor (`apps/ai-service/app/risk/advisory_predictor.py`)

Provides proactive operational forecasts without encroaching upon the authoritative `DeterministicRiskEngine`:
- **DPD 48-Hour Fallback Window**: For containers in `DPD_DIRECT` mode, Indian port terminals enforce strict 48-hour gate-out rules post-discharge. If unevacuated, containers are forcibly diverted to off-dock CFS terminals, triggering punitive ground-rent tariffs.
- **Dynamic Probability Calculation**:
  - Automatically assesses hours elapsed since vessel discharge.
  - Mitigates probability when a confirmed transporter task exists (`is_trucker_confirmed = true`).
  - Escalates probability to 1.0 when active customs holds are flagged.
- **Preventable Exposure (INR)**: Computes estimated carrier demurrage and CFS handling costs avoidable if immediate operational intervention occurs.
- **Plain-English Reasons**: Structured explainability factors detailing whether trucker confirmation is pending, time remaining before forced CFS evacuation, and recommended priority actions.
- **Architectural Invariant**: This model is explicitly an **advisory deterministic predictor**. It does NOT claim to be unexplainable deep ML, and it **never** alters the authoritative 0–100 risk score or financial records.

---

### 4.7. ChromaDB Multi-Tenant Regulatory & Tariff Intelligence (`apps/ai-service/app/knowledge`)

Empowers operators and importers with instant, semantic search across complex maritime tariffs, port terminal SOPs, and regulatory notices:
- **Strict Multi-Tenant Isolation**: Enforces tenant security boundaries in vector space using query filters:
  ```python
  where = {"$or": [{"org_id": "GLOBAL_PUBLIC"}, {"org_id": org_id}]}
  ```
- **Dual Knowledge Tiers**:
  - `GLOBAL_PUBLIC`: Port guidelines (JNPT, Mundra, Chennai), public carrier free-time circulars, customs clearance public notices.
  - `Org-Private`: Proprietary negotiated shipping line volume contracts, confidential CFS ground-rent concession schedules.
- **Isolated Demo Datasets**: Sample/demonstration tariffs are flagged with `is_demo=True` and isolated from production query collections.
- **Native ChromaDB Engine**: Uses native ChromaDB persistent storage (`./chroma_db`) with metadata-enriched vector indexing.

---

### 4.8. Next.js Operational Cockpit (`apps/web`)

The frontend delivers a unified control plane for logistics operations:

1. **Active Container Dashboard (`/`)**:
   - High-level metric counters: Total Active Containers, Expiring Free-Time, Critical Demurrage Risk.
   - Client filter tabs (Tata Electronics, Reliance Retail, Pinnacle Auto).
   - Real-time container cards displaying discharge dates, countdown timers, delivery mode badges, and risk severity indicators.
2. **Container Cockpit (`/containers/[id]`)**:
   - **Compliance Signals Card**: Visual score gauges for all 4 signals, source indicators (`MANUAL` vs `DERIVED`), explanations, and manual override modal.
   - **Deterministic Risk Card**: Circular score meter, severity badge, structured reasons breakdown, and recommended action steps.
   - **Advisory Predictive Insights Card**: Proactive DPD fallback probability, estimated preventable exposure (INR), operational status badges, and plain-English explanatory drivers.
   - **ChromaDB Regulatory & Tariff Search Card**: In-context knowledge query interface allowing operators to search JNPT, Mundra, and custom tariff circulars with tenant-isolation indicators.
   - **Two-Clock Financial Breakdown**: Side-by-side Carrier Demurrage and CFS Ground Rent calculators with slab rate breakdown.
   - **Document Intelligence Drawer**: Side-by-side document viewer, ISO 6346 check-digit verification status badges, AI confidence indicators, and human-in-the-loop field correction/acceptance.
   - **Task Dispatch Panel**: Transporter assignment, token link generator with one-click clipboard copy, and real-time confirmation status.
3. **External Transporter Portal (`/external/task-confirmations/[token]`)**:
   - Single-purpose, mobile-first responsive landing page.
   - High-contrast pickup instructions, location pins, and a single "Confirm Pickup Scheduled" button.
   - Instant visual confirmation feedback and graceful handling of expired or revoked links.

---

## 5. Database Schema & Data Models

PostgreSQL schema managed via Prisma (`apps/api/prisma/schema.prisma`):

| Model | Description | Key Relationships |
| :--- | :--- | :--- |
| `Organization` | Multi-tenant root isolation boundary | Has many `User`, `Client`, `Container`, `Tariff`, `CFS` |
| `User` | Internal operator with role (`ADMIN`, `CHA`, `CLIENT`, `EXTERNAL`) | Belongs to `Organization`, has many `Task` |
| `Client` | Importer/exporter company with IEC, GSTIN, and AEO/ACP flags | Belongs to `Organization`, has many `Container`, `Document` |
| `CFS` | Container Freight Station with free ground-rent days configuration | Belongs to `Organization`, has many `Container`, `Tariff` |
| `Container` | Core tracking entity with delivery mode, timestamps, and status | Belongs to `Organization`, `Client`, `CFS`; has events, charges, signals |
| `ContainerEvent` | Append-only milestone audit trail (`DISCHARGE`, `FALLBACK`, `PICKUP`) | Belongs to `Container` |
| `Tariff` | Carrier and CFS slab tariff pricing matrices | Belongs to `Organization`, optional `CFS` |
| `Charge` | Authoritative calculated demurrage and ground-rent charge records | Belongs to `Container` |
| `ComplianceSignal` | Readiness scores (0–100) per container and signal type | Unique constraint `[containerId, signalType]` |
| `Document` | Staged shipping documents with AI confidence and review status | Belongs to `Organization`, `Client`, optional `Container` |
| `DocumentExtractionProvenance` | Immutable audit log of AI suggestions vs human corrections | Belongs to `Document` |
| `Task` | Internal assignments or external trucker handoffs | Belongs to `Organization`, optional `Container`, `User` |
| `ExternalTaskConfirmationAudit` | Tamper-proof log of external token confirmations (IP, User Agent) | Belongs to `Task` |
| `Alert` | High-priority operational alerts triggered by risk escalation | Belongs to `Organization`, optional `Container` |
| `AuditLog` | Enterprise-wide immutable audit trail for governance | Belongs to `Organization` |

---

## 6. Authoritative API Reference

All protected endpoints require Bearer JWT authentication: `Authorization: Bearer <token>`.

### Container Management
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/containers` | CHA / Client | List containers scoped to tenant and client visibility |
| `GET` | `/api/v1/containers/:id` | CHA / Client | Retrieve container details, events, charges, and CFS status |
| `POST` | `/api/v1/containers/:id/fallback-cfs` | CHA | Trigger DPD-to-CFS fallback milestone and record event |

### Compliance Signals
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/containers/:id/compliance-signals` | CHA / Client | Retrieve all compliance signals and calculated scores |
| `POST` | `/api/v1/containers/:id/compliance-signals` | CHA | Set or override manual compliance signal with audited reason |

### Regulatory & Tariff Knowledge Intelligence
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/knowledge/query` | CHA / Client | Vector similarity search across port tariffs and circulars with tenant isolation |

### Risk Assessment
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/containers/:id/risk` | CHA / Client | Evaluate deterministic risk score (0-100), severity, and advisory predictive forecast |

### Document Intelligence & Human Review
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/documents/upload` | CHA | Upload document (multipart), stage record, trigger AI extraction |
| `GET` | `/api/v1/documents/container/:containerId` | CHA / Client | List documents and review status for a container |
| `POST` | `/api/v1/documents/:id/review` | CHA | Human review: `ACCEPT`, `CORRECT`, or `REJECT` staged fields |

### Tasks & Transporter Coordination
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/tasks` | CHA | Create task; if external, generates 256-bit token & notifies |
| `GET` | `/api/v1/tasks/container/:containerId` | CHA / Client | List tasks associated with container |
| `POST` | `/api/v1/tasks/:id/revoke` | CHA | Revoke active external confirmation link |

### External Unauthenticated Endpoints (Transporters)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/external/task-confirmations/:token` | Public | Minimal non-sensitive pickup summary for external trucker |
| `POST` | `/api/v1/external/task-confirmations/:token/confirm` | Public | Confirm pickup; records event, recalculates risk, logs audit |

### Advisory AI Service Endpoints (`apps/ai-service`)
| Method | Endpoint | Status | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Canonical | Liveness check, loaded models, and extraction engine status |
| `POST` | `/extract` | Canonical | Advisory document parsing, confidence scoring & ISO 6346 check |
| `POST` | `/api/ai/extract/document` | Alias | Lightweight alias routing directly to canonical `/extract` |
| `POST` | `/api/ai/risk/evaluate` | Canonical | Advisory deterministic predictor for DPD fallback & preventable exposure |
| `POST` | `/api/ai/knowledge/query` | Canonical | ChromaDB multi-tenant semantic search across tariffs & circulars |

---

## 7. Verification & Test Suite

The codebase is fortified with comprehensive automated test suites across all service tiers:

### 7.1. API Vitest Suite (`apps/api`)
```powershell
npm run test --workspace=apps/api
```
- **External Task Security (`external-task.test.ts`)**:
  - Validates 256-bit cryptographic token entropy.
  - Verifies SHA-256 deterministic token hashing (plaintext never stored).
  - Validates 72-hour expiration boundary.
  - Verifies one-time confirmation and replay protection.
  - Verifies zero leakage of internal tenant, financial, or client data.
- **Multi-Tenancy & Scoping (`multi-tenancy.test.ts`)**:
  - Enforces strict `organizationId` matching across all queries.
  - Confirms cross-tenant access is rejected with `ForbiddenError`.
  - Enforces `visibleClientIds` boundary for client-restricted users.
  - Validates admin access overrides.
- **Compliance Signal Derivation (`compliance.test.ts`)**:
  - Validates manual compliance signal score boundaries (0–100).
  - Tests HS code novelty algorithm (20 novel, 95 routine, 60 infrequent, 40 stale).
  - Tests valuation consistency Z-score statistics (normal, outlier, insufficient data fallback).
  - Tests AEO/ACP deterministic client accreditation derivation (100 dual, 85 AEO, 50 neutral).
- **Two-Clock Financial Regression (`financial-regression.test.ts`)**:
  - Validates `DPD_DIRECT` applies carrier demurrage only and zero CFS ground rent.
  - Validates `DPD_CFS` with fallback independently calculates both Carrier and CFS ground rent.
- **Deterministic Risk Engine (`risk.test.ts`)**:
  - Verifies free-time expiration in $<24$h elevates risk to `HIGH`.
  - Verifies compliance signal penalties are applied when score $<50$.
  - Confirms explainability output structure and action recommendations.
  - Confirms final score is clamped strictly between 0 and 100.
- **AI Service Integration & Non-Blocking Fallback (`ai-integration.test.ts`)**:
  - Validates graceful handling when AI service is offline or times out.
  - Confirms deterministic risk calculation proceeds without degradation.
  - Validates `PredictiveRiskAdvisorySchema` with nullable `preventableExposureInr`.
  - Enforces client exclusion from injecting `org_id` into knowledge query requests.

**Results: 6 test files passed, 34 tests passed (100%).**

### 7.2. Python Advisory AI Test Suite (`apps/ai-service`)
```powershell
python apps/ai-service/run_tests.py
```
- Validates FastAPI `/health` endpoint.
- Validates ISO 6346 check digit algorithm against valid and corrupt container numbers.
- Tests document extraction across all 5 document types (BL, DO, BOE, CFS Gate Pass, Carrier Invoice).
- Tests missing container number review flagging logic and empty document handling.
- Tests canonical `/extract` and alias `/api/ai/extract/document` parity.
- Tests invalid ISO 6346 check digit triggering human review flag (`needs_human_review=True`).
- Tests `AdvisoryDeterministicPredictor` DPD critical fallback window, boundaries, and determinism.
- Tests zero financial calculation in AI service: returns authoritative financial exposure or `null` (no fabricated money).
- Tests `ChromaKnowledgeService` multi-tenant vector isolation and collection-level separation (`knowledge_production` vs `knowledge_demo`).
- Tests configurable Google Gemini client (`gemini-3.8-flash`) graceful fallback when offline, unconfigured, or malformed.

**Results: 19 tests passed, 0 failed (100%).**

### 7.3. Type Safety Verification
```powershell
npm run typecheck
```
- `@demurrageos/shared-types`: Clean build.
- `@demurrageos/api`: Clean build.
- `@demurrageos/web`: Clean `tsc --noEmit` build.

---

## 8. Getting Started & Setup Guide

### Prerequisites
- **Node.js**: `v18.18+` or `v20+`
- **npm**: `v9+` or `v10+`
- **Python**: `v3.10+` or `v3.12+`
- **Docker & Docker Compose**: Recommended for local dependencies

---

### Option A: Local Development (Quick Start)

#### 1. Start Database & Redis via Docker
```powershell
docker compose up -d postgres redis
```

#### 2. Configure Environment Variables
Create `.env` files based on `.env.example`:
```powershell
Copy-Item .env.example .env
Copy-Item .env.example apps/api/.env
```

#### 3. Install Monorepo Dependencies
```powershell
npm install
```

#### 4. Prepare Database & Seed CHA Data
```powershell
npm run db:generate --workspace=apps/api
npm run db:push --workspace=apps/api
npm run db:seed --workspace=apps/api
```

#### 5. Start Advisory AI Service (Python)
In a separate terminal:
```powershell
cd apps/ai-service
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

#### 6. Start Authoritative API & Web Dashboard
In the workspace root:
```powershell
npm run dev
```

The services will be available at:
- **Next.js Operational Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Authoritative Express API**: [http://localhost:4000](http://localhost:4000)
- **Advisory AI Service**: [http://localhost:8000](http://localhost:8000)
- **Demo Container Cockpit**: [http://localhost:3000/containers/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa](http://localhost:3000/containers/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)
- **Demo Trucker Handoff Page**: [http://localhost:3000/external/task-confirmations/7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a](http://localhost:3000/external/task-confirmations/7f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a)

---

### Option B: Full Docker Compose Environment

To run the complete stack inside container boundaries:
```powershell
docker compose up --build
```
This orchestrates all 5 services:
- `demurrageos-postgres` (PostgreSQL 16 on port `5432`)
- `demurrageos-redis` (Redis 7 on port `6379`)
- `demurrageos-ai-service` (Python FastAPI on port `8000`)
- `demurrageos-api` (Express Node.js on port `4000`)
- `demurrageos-web` (Next.js 14 on port `3000`)

---

## 9. Next Planned Milestones (Data & Infrastructure Layer)

As detailed in the architecture roadmap, the upcoming phase expands the ingestion and operational boundary:
1. **CSV Ingestion Pipeline**: In-memory RFC-4180 parsing, Zod validation preserving 1-indexed row numbers, 1-hour Redis staging TTL, and atomic multi-entity Prisma `$transaction` commits.
2. **Delivery Mode Fallback Rule**: Enforcing default `delivery_mode = CFS` for blank entries (never `DPD_DIRECT`).
3. **Dedicated Background Worker (`apps/api/src/worker.ts`)**: Standalone process running BullMQ workers (`calculate-container-risk`, `check-expiring-free-time`, `sync-carrier-data`, `daily-reconciliation`).
4. **Integration Adapters**: Standardized `IntegrationAdapter` interface supporting Carrier feeds (Maersk, MSC), Port Terminal/ICEGATE EDI feeds, and CSV batches.
5. **Rate Limiting & Threat Mitigation**: Rate-limiting token confirmation attempts to 5 requests per 15-minute window per IP/token to protect against brute-force attacks.
6. **Continuous Integration Pipeline (`.github/workflows/ci.yml`)**: Automated multi-job CI workflow running lint, typecheck, Vitest, pytest, and Next.js production builds.

---

## 10. License & Maintenance

DemurrageOS is an enterprise-grade platform developed for logistics efficiency and demurrage prevention. Maintained by the DemurrageOS Core Engineering Team.
