# DemurrageOS — Master Project Plan

> **Purpose:** This document consolidates the four implementation plans into one execution-level master plan. It is intentionally critical: it distinguishes what the four source plans explicitly establish from what must be decided, hardened, or verified before the project can be considered production-ready.
>
> **Source plans consolidated**
> 1. Frontend Implementation Plan
> 2. Backend Implementation Plan
> 3. Data, Infrastructure & Platform Plan
> 4. AI & Differentiation Layer Plan

---

## 0. Executive Summary

DemurrageOS is best understood as a **CHA-centric operational control system for container movement, financial exposure, compliance readiness, and external coordination**, rather than simply a demurrage dashboard.

The four plans converge on one architectural thesis:

- **Express API + PostgreSQL/Prisma is the deterministic system of record.**
- **Next.js is the operational UI.**
- **Redis/BullMQ handles asynchronous and scheduled work.**
- **A Python AI service provides advisory signals and document extraction.**
- **AI must never become the source of truth.**
- **Client-level scoping is central because the primary organization is a CHA managing multiple importer/exporter clients.**
- **DPD/CFS modeling is not cosmetic: delivery mode changes charge calculation, free-time behavior, event history, and operational risk.**
- **The external task-confirmation flow is the key network-effect/demo feature.**
- **Human confirmation is mandatory before extracted document data becomes authoritative.**

The most important architectural principle is therefore:

```text
                 ADVISORY / ASYNC
              ┌────────────────────┐
              │     AI SERVICE      │
              │ extraction/signals  │
              │ NL query (later)   │
              └─────────┬──────────┘
                        │ suggestions
                        ▼
┌───────────────┐   ┌──────────────────────┐
│ Next.js Web   │──▶│ Express API          │
│ operational UI│◀──│ deterministic core   │
└───────────────┘   └──────────┬───────────┘
                               │
                     ┌─────────┴─────────┐
                     ▼                   ▼
                 PostgreSQL           Redis
                 source of truth       queues
                                         │
                                         ▼
                                      Workers
```

### Critical conclusion

The project is technically coherent, but the current four plans are **implementation plans rather than a complete production specification**. Before serious build-out, several cross-cutting contracts need to be made explicit:

1. canonical data model and event semantics;
2. exact organization/client authorization rules;
3. idempotency and concurrency behavior for jobs/imports/events;
4. tariff versioning and effective-date rules;
5. money/currency/rounding policy;
6. document storage and access-control model;
7. external-token lifecycle and revocation;
8. AI extraction evaluation and provenance;
9. notification provider and delivery semantics;
10. deployment/secrets/backups/recovery strategy;
11. audit-log immutability and financial traceability;
12. API error/versioning conventions.

These are not optional polish. Several affect whether the system can safely calculate money or expose multi-tenant data.

---

# 1. Product Thesis

## 1.1 Problem

The system is designed around operational fragmentation:

- container events exist in one place;
- client context in another;
- demurrage/detention/storage exposure in another;
- compliance readiness in documents;
- pickup coordination in messages/inbox workflows.

The product's intended value is to create **one shared operational record** and move from merely reporting exposure to **preventing avoidable exposure**.

## 1.2 Primary user

The architecture now assumes:

```text
Organization = CHA firm
    ├── Client A
    ├── Client B
    ├── Client C
    └── All clients rollup
```

This is a major product decision. The frontend explicitly requires client switching and client-scoped views, while the backend introduces `Client` as a first-class entity.

## 1.3 Product pillars

### Pillar A — Operational visibility

- container list;
- container detail;
- event timeline;
- dashboard;
- alerts;
- tasks;
- analytics.

### Pillar B — Financial exposure

- free-time calculation;
- demurrage;
- detention;
- storage;
- CFS ground rent;
- shifting-charge audit targets;
- current and projected exposure;
- charge-type breakdown.

### Pillar C — Prevention

- documentation completeness;
- HS-code novelty;
- AEO/ACP status;
- valuation consistency;
- risk score;
- explainability.

### Pillar D — Coordination

- internal tasks;
- external task assignment;
- single-purpose confirmation links;
- live status propagation.

### Pillar E — Human-in-the-loop automation

- document extraction;
- confidence;
- review;
- correction;
- acceptance into the source of truth.

---

# 2. System-of-Record Principle

This is the most important architectural constraint.

## 2.1 Deterministic core

The Express application owns:

- authoritative domain state;
- charge calculation;
- free-time calculation;
- deterministic risk aggregation;
- task state;
- client/org scoping;
- API contracts;
- persistence;
- audit behavior.

## 2.2 AI layer

The AI service may:

- derive compliance signals;
- extract document fields;
- calculate confidence;
- support later natural-language query translation.

It must **not** directly write authoritative business state.

## 2.3 Failure behavior

If `ai-service` disappears:

```text
container tracking       -> works
charge calculation       -> works
free-time calculation    -> works
tasks                    -> works
alerts                   -> works
risk engine              -> works
                         ↓
              less predictive intelligence
```

If this property is violated, the architecture has drifted from the project's stated principle.

---

# 3. Target Technology Architecture

| Area | Decision from source plans |
|---|---|
| Web | Next.js 14+ App Router |
| Web language | TypeScript strict |
| UI | Tailwind + shadcn/ui |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Maps | MapLibre |
| API | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma |
| Queue | Redis + BullMQ |
| Validation | Zod |
| Auth | better-auth |
| API contract | REST + OpenAPI |
| AI service | Python |
| AI/RAG reuse | LangChain + Chroma + Google embeddings |
| Testing | Vitest, pytest, Supertest, Playwright |
| Logging | Pino |
| Error monitoring | Sentry |
| Monorepo | Turborepo |
| CI | GitHub Actions |
| Deployment local/dev | Docker Compose |

The frontend explicitly requires generated API types rather than hand-duplicated DTOs, and the backend establishes OpenAPI as the API contract.

---

# 4. Monorepo Structure

```text
demurrageos/
├── apps/
│   ├── web/                    # Next.js
│   ├── api/                    # Express + TypeScript
│   └── ai-service/             # Python
│
├── packages/
│   ├── shared-types/           # generated from OpenAPI
│   └── config/
│
├── prisma/                     # if retained centrally; otherwise under api
├── docker-compose.yml
├── package.json
└── turbo.json
```

### Critical rule

The exact Prisma ownership/location must be decided once. The backend plan shows `apps/api/prisma/`, while the broader monorepo diagram only establishes `packages/`. Do not create duplicate schema locations.

Recommended:

```text
apps/api/prisma/
apps/api/src/
apps/web/
apps/ai-service/
packages/shared-types/
packages/config/
```

---

# 5. Domain Model

## 5.1 Core entities

The plans imply at least:

```text
Organization
User
Client
Shipment
Container
ContainerEvent
Port
CFS
Carrier
Customs
Tariff
Charge
ComplianceSignal
Task
Notification
Document
Import
Alert
Audit
```

## 5.2 Key relationships

```text
Organization
    │
    ├── Users
    │
    └── Clients
          │
          └── Containers
                 │
                 ├── Shipment
                 ├── ContainerEvents
                 ├── Charges
                 ├── ComplianceSignals
                 ├── Documents
                 ├── Alerts
                 └── Tasks

Port
 └── CFS
      └── CFS tariffs
```

## 5.3 Client is not optional

`Container.clientId` is required in the backend plan.

That means the migration strategy must be designed before implementation if any existing/generated data predates the client entity.

A safe migration sequence is:

```text
create Client
      ↓
backfill clients for existing organizations
      ↓
assign every existing container
      ↓
validate no NULL clientId
      ↓
make FK required
```

Do not simply add a required FK and discover the migration problem later.

---

# 6. Delivery Mode Model

The system has three modes:

```text
DPD_DIRECT
DPD_CFS
CFS
```

This is a core domain concept, not a UI badge.

## 6.1 Why it matters

Delivery mode affects:

- charge applicability;
- free-time clocks;
- CFS involvement;
- event semantics;
- fallback;
- risk/exposure;
- UI explainability.

## 6.2 Critical transition

```text
DPD_CFS
   │
   │ DPD_TO_CFS_FALLBACK
   ▼
CFS operational path
```

The system must preserve the historical event instead of simply overwriting delivery mode.

---

# 7. Event Model

Required new events:

- `CFS_GATE_IN`
- `CFS_GATE_OUT`
- `DPD_TO_CFS_FALLBACK`
- `DELIVERY_ORDER_REISSUED`

## 7.1 Event principle

Events should be append-oriented facts.

```text
Event
  ↓
state recalculation
  ↓
risk recalculation
  ↓
alerts/tasks as required
```

### Critical gap

The four plans do not fully specify:

- event uniqueness/idempotency key;
- event ordering;
- late-arriving events;
- correction events;
- source of event;
- timestamp semantics;
- timezone policy;
- whether events are immutable.

These must be specified before integrating real carrier/port data.

---

# 8. Financial Engine

## 8.1 Charge types

```text
DEMURRAGE
DETENTION
STORAGE
GROUND_RENT
SHIFTING_CHARGE
```

`GROUND_RENT` belongs to the CFS operator.

`SHIFTING_CHARGE` is explicitly treated as an audit target.

## 8.2 Calculation

Conceptually:

```text
Container
  │
  ├── deliveryMode
  ├── events
  ├── carrier tariff
  └── CFS tariff
         │
         ▼
ChargeCalculationService
         │
         ▼
┌──────────────────────────────┐
│ freeDaysRemaining            │
│ daysOverdue                  │
│ currentExposure              │
│ projectedExposure            │
│ breakdownByChargeType        │
│ currency                     │
└──────────────────────────────┘
```

## 8.3 DPD/CFS branching

```text
if DPD_DIRECT:
    carrier demurrage/detention

if CFS:
    carrier demurrage/detention
    +
    CFS ground rent from CFS_GATE_IN

if DPD_CFS + fallback:
    carrier clock continues from discharge
    +
    CFS ground-rent clock begins at CFS_GATE_IN
```

The two-clock behavior is explicitly called out as an easy-to-get-wrong money calculation.

## 8.4 Critical financial requirements missing from the four plans

These need explicit decisions:

- currency representation;
- integer minor units vs decimal;
- FX handling;
- tax/GST treatment;
- rounding mode;
- inclusive/exclusive day boundaries;
- timezone;
- tariff effective dates;
- tariff versioning;
- retroactive tariff changes;
- disputed charges;
- manual adjustments;
- negative corrections;
- projected-charge methodology.

Recommended rule:

```text
Never store monetary values as floating-point numbers.
```

Use a decimal-safe representation or integer minor units, with an explicit currency.

---

# 9. Free-Time Engine

The special case is:

```text
Carrier free-time clock
        │
        └── continues from discharge

CFS ground-rent clock
        │
        └── starts from CFS_GATE_IN after fallback
```

This must be tested with scenarios rather than only isolated unit functions.

Minimum scenario suite:

1. DPD container never falls back.
2. DPD container falls back on day 3.
3. Straight CFS container.
4. Late CFS gate-in event.
5. Missing CFS gate-out.
6. Tariff changes during an active period.
7. Boundary at exactly midnight.
8. Boundary at free-time expiry.
9. Event arrives out of order.
10. Replayed duplicate event.

---

# 10. Risk Engine

The deterministic formula remains:

```text
Operational Risk Score =
    Deadline Urgency
  + Customs Delay
  + Pickup Delay
  + Financial Exposure
  + Operational Uncertainty
```

The AI/differentiation layer supplies compliance signals.

## 10.1 Boundary

```text
ComplianceSignalService
        │
        ▼
{ signalType, score }[]
        │
        ▼
RiskEngine
        │
        ▼
deterministic risk score
```

The risk engine must not know how an AI model generated a signal.

## 10.2 Explainability

The UI should explain:

```text
CRITICAL RISK

Why?
- customs/compliance signal
- deadline urgency
- pickup delay
- financial exposure

Recommended action
- concrete operational task
```

The explanation should be generated from stored/structured reasons, not from an opaque LLM paragraph.

---

# 11. Compliance Signal Engine

v1 signals:

| Signal | Source |
|---|---|
| Documentation completeness | extracted/manual |
| HS code novelty | historical internal data |
| AEO/ACP status | Client |
| Valuation consistency | historical internal data |

## 11.1 Implementation sequence

```text
manual signals
      ↓
historical-data-derived signals
      ↓
document extraction
      ↓
future automation
```

This sequencing is explicitly recommended because the manual version creates useful product value without introducing AI reliability risk.

## 11.2 Critical boundary

The system must not claim to reproduce customs authorities' confidential risk-selection logic.

The product should instead present operational/compliance readiness indicators.

---

# 12. Document Pipeline

## 12.1 Supported v1 documents

- Bill of Lading / Delivery Order
- Bill of Entry
- CFS gate-pass
- carrier D&D invoice PDFs

## 12.2 Flow

```text
User uploads document
        ↓
Express documents module
        ↓
queue extraction job
        ↓
Python ai-service
        ↓
extractedFields
confidence
flaggedForReview
        ↓
Express stages output
        ↓
human reviews/corrects
        ↓
accept
        ↓
source of truth
```

## 12.3 Non-negotiable rule

AI output must not directly mutate PostgreSQL authoritative state.

## 12.4 Critical missing details

Define:

- object/file storage provider;
- MIME validation;
- maximum file size;
- malware scanning;
- document retention;
- encryption;
- access-control checks;
- extraction version;
- model version;
- provenance;
- field-level confidence;
- review status;
- correction history.

The current plan defines the extraction contract but not the full document lifecycle.

---

# 13. External Task Handoff

This is the intended network-effect feature.

```text
CHA assigns external task
        ↓
generate high-entropy token
        ↓
persist expiry
        ↓
queue notification
        ↓
email/SMS/WhatsApp
        ↓
external party opens link
        ↓
single-purpose confirmation page
        ↓
confirm
        ↓
Task.confirmedAt
        ↓
same event pipeline
        ↓
container/task state updates
```

## 13.1 v1 scope

Do not build a general external portal.

Only support:

```text
Task assigned
→ pickup scheduled confirmation
→ status update
```

## 13.2 Security

Treat the confirmation token like a password-reset token.

Required:

- high entropy;
- short expiry;
- aggressive rate limiting;
- one-time or carefully controlled use;
- no guessable identifiers;
- revocation strategy;
- no sensitive data beyond what the task requires.

### Critical gap

The four plans mention 72-hour expiry but do not fully define:

- token hashing at rest;
- resend behavior;
- replacement of old tokens;
- revocation;
- replay behavior;
- audit events;
- notification failure;
- link forwarding.

These should be specified before implementation.

---

# 14. Multi-Tenancy and Authorization

There are two scopes:

```text
Organization scope
        +
Client visibility scope
```

Every relevant query must respect both.

## 14.1 Proposed request flow

```text
Request
  ↓
auth middleware
  ↓
organization resolution
  ↓
clientScope middleware
  ↓
typed ClientScope
  ↓
controller
  ↓
service
  ↓
repository
```

The backend plan explicitly rejects scattered ad-hoc `WHERE client_id` clauses.

## 14.2 Critical authorization matrix

Before implementation, write an explicit matrix for:

- organization admin;
- internal CHA user;
- restricted future client user;
- external contact;
- unauthenticated confirmation request.

For each endpoint define:

```text
Who can call?
What organization can they see?
What clients can they see?
What fields can they mutate?
What audit event is created?
```

Do not infer this from UI visibility.

---

# 15. API Architecture

The architectural dependency is:

```text
HTTP
 ↓
middleware
 ↓
controller
 ↓
application/domain service
 ↓
repository
 ↓
PostgreSQL
```

Workers use:

```text
BullMQ worker
 ↓
same application/domain service
 ↓
repository
 ↓
PostgreSQL
```

## 15.1 API contract

OpenAPI is the canonical API contract.

```text
Express
   ↓
OpenAPI
   ↓
generated shared types
   ↓
Next.js
```

This avoids frontend/backend DTO drift.

## 15.2 Critical API requirements to formalize

- standard error envelope;
- pagination;
- filtering;
- sorting;
- cursor vs offset strategy;
- API versioning;
- request IDs;
- idempotency keys;
- optimistic concurrency;
- validation errors;
- authentication errors;
- authorization errors;
- rate-limit responses.

---

# 16. CSV Import Pipeline

The agreed flow:

```text
Upload
 ↓
in-memory parse
 ↓
Zod validation
 ↓
error detection
 ↓
staging preview
 ↓
user confirmation
 ↓
atomic DB insert
 ↓
event ingestion
 ↓
risk recalculation
```

Required additions:

- `client_id` or client lookup/create;
- `delivery_mode`, defaulting to `CFS` if blank.

## 16.1 Critical concern

The phrase "atomic DB insert" needs a precise transaction boundary.

Decide whether:

```text
CSV insert
+
event insert
+
initial risk
```

is one transaction, or whether risk calculation is deliberately asynchronous after an atomic import transaction.

Recommended:

```text
transaction:
    validate staged data
    create authoritative records
    create events/outbox records

commit

async:
    calculate risk
    create alerts
```

This avoids long-running transactions around computational work.

---

# 17. Background Jobs

Defined jobs:

| Job | Trigger |
|---|---|
| calculate-container-risk | event/signal change |
| check-expiring-free-time | every 15 min |
| sync-carrier-data | hourly |
| daily-reconciliation | 00:00 UTC |
| process-document-extraction | document upload |
| send-task-confirmation | external assignment |

## 17.1 Critical worker requirements

Every job should define:

```text
input
idempotency key
retry policy
backoff
max attempts
dead-letter behavior
timeout
observability
side effects
```

The current plan establishes queues but does not fully specify these.

---

# 18. Integration Strategy

Use one normalization interface:

```text
Carrier API
Port EDI
CSV
Future CFS feeds
        ↓
IntegrationAdapter
        ↓
normalized domain events
```

For v1:

```text
CFS data
=
manual entry / CSV
```

Do not build live CFS operator integrations before proving the product thesis.

---

# 19. Frontend Architecture

## 19.1 Route tree

```text
(auth)
├── login
└── accept-invite

(app)
├── dashboard
├── clients
│   ├── page
│   └── [clientId]
├── containers
│   ├── page
│   └── [containerId]
│       └── documents
├── alerts
├── tasks
│   └── [taskId]
├── imports
│   └── new
├── analytics
└── settings
    ├── tariffs
    ├── cfs-directory
    └── users
```

## 19.2 Client switcher

The client switcher sits in the global shell.

Default:

```text
All clients
```

Selection changes:

- dashboard;
- container list;
- alerts;
- tasks;
- analytics.

## 19.3 Critical frontend rule

No raw `fetch` inside components.

Use:

```text
TanStack Query
   ↓
typed API client
   ↓
OpenAPI contract
```

---

# 20. Core User Journeys

## Journey 1 — Daily operational control

```text
Login
 ↓
All-clients dashboard
 ↓
See at-risk containers
 ↓
Switch to client
 ↓
Open container
 ↓
Understand exposure
 ↓
View risk reasons
 ↓
Create/assign task
```

## Journey 2 — External handoff

```text
Container
 ↓
Task
 ↓
External assignee
 ↓
Send confirmation
 ↓
External link
 ↓
Confirm
 ↓
Task updated
 ↓
Authenticated CHA view updates
```

## Journey 3 — Document intelligence

```text
Container
 ↓
Documents
 ↓
Upload PDF
 ↓
Extraction job
 ↓
AI output
 ↓
Confidence / review flags
 ↓
Human correction
 ↓
Accept
 ↓
Compliance signal / authoritative field update
```

## Journey 4 — DPD fallback

```text
DPD container
 ↓
DPD_TO_CFS_FALLBACK
 ↓
CFS_GATE_IN
 ↓
two clocks
 ↓
new exposure
 ↓
risk recalculation
 ↓
timeline + badge + score update
```

---

# 21. Analytics

The frontend plan calls for:

- root-cause analysis;
- preventable exposure.

The backend/data plans establish the underlying charge/risk/event data.

### Critical analytics requirement

Define whether analytics are:

1. live operational queries;
2. materialized aggregates;
3. scheduled warehouse-style computations.

For v1, live queries/materialized summaries are likely sufficient. Do not introduce a separate analytics warehouse unless scale actually requires it.

---

# 22. Security Plan

Minimum layers:

```text
Authentication
 ↓
Organization authorization
 ↓
Client scope
 ↓
Endpoint authorization
 ↓
Repository-level safety
 ↓
Audit
```

Additional controls:

- rate limiting;
- request IDs;
- structured logging;
- secure session handling;
- input validation;
- file validation;
- token security;
- secret management;
- database least privilege;
- backup encryption.

## 22.1 Special attack surface

```text
POST /tasks/confirm/:token
```

This endpoint is intentionally unauthenticated and therefore deserves password-reset-level treatment.

---

# 23. Auditability

Audit is especially important because the product calculates money.

Audit at minimum:

- user;
- organization;
- client;
- action;
- entity;
- before state;
- after state;
- timestamp;
- request ID;
- source;
- relevant calculation/version metadata.

### Critical requirement

A financial number should be reconstructible.

If exposure changes from:

```text
₹43,000 → ₹61,000
```

the system should be able to explain:

```text
which events
which tariffs
which tariff version
which dates
which delivery mode
which calculations
which manual changes
```

produced the result.

---

# 24. Observability

The plans specify Pino + Sentry.

Financial engines should additionally expose structured calculation logs.

Recommended correlation:

```text
request_id
    │
    ├── API request
    ├── job ID
    ├── calculation
    ├── alert
    └── audit record
```

Monitor:

- API errors;
- queue failures;
- job latency;
- extraction confidence;
- human correction rate;
- risk recalculation failures;
- calculation anomalies;
- external notification delivery.

---

# 25. Testing Strategy

## 25.1 Unit tests

Highest priority:

- charge calculation;
- free-time calculation;
- DPD/CFS branching;
- two-clock logic;
- risk aggregation;
- client scope;
- token generation/validation.

## 25.2 Integration tests

Use Supertest and a real test database where practical.

Test:

- authorization;
- API contracts;
- transactions;
- import behavior;
- job-trigger behavior;
- document staging;
- task confirmation.

## 25.3 AI tests

Do not only test "does it crash?"

Measure:

- extraction accuracy;
- field-level accuracy;
- confidence calibration;
- false confidence;
- human correction rate;
- document-type performance.

## 25.4 E2E

Required journeys:

1. login → CSV ingestion → staging → risk → task → resolution;
2. client switcher;
3. external handoff;
4. DPD→CFS fallback.

---

# 26. Seed Data / Demo Data

Target scale from the platform plan:

- 10,000 containers;
- 500 shipments;
- 50,000 events.

Add:

- multiple clients per organization;
- mostly CFS;
- meaningful DPD_DIRECT;
- a few DPD_CFS fallback cases;
- incomplete compliance examples;
- missing docs;
- novel HS codes;
- varying valuation consistency.

The seed dataset should deliberately create visible product stories rather than only random records.

---

# 27. Build Strategy

## Phase 0 — Architecture freeze

Before feature coding:

- repository structure;
- environment configuration;
- OpenAPI conventions;
- Prisma ownership;
- database migration policy;
- error envelope;
- logging/request IDs;
- auth/session design;
- organization/client authorization model.

**Exit:** engineers can build modules without inventing cross-cutting conventions.

## Phase 1 — Monorepo and runtime

Stand up:

```text
web
api
ai-service
postgres
redis
```

The platform plan explicitly recommends bringing up the empty AI service early so Docker networking is solved once.

## Phase 2 — Auth and tenancy

Implement:

- organization;
- users;
- sessions;
- client;
- client scope;
- RBAC foundation.

**Exit:** every protected request has deterministic organization/client visibility.

## Phase 3 — Core entities

Implement:

- Client;
- Container;
- Shipment;
- Port;
- CFS;
- Carrier;
- ContainerEvent.

## Phase 4 — Read-only operational UI

Build:

- shell;
- client switcher;
- container list;
- container detail;
- event timeline;
- dashboard.

Do not build elaborate AI UI before the operational core works.

## Phase 5 — Financial engine

Implement:

- tariffs;
- charge calculation;
- delivery-mode branching;
- ground rent;
- shifting-charge audit;
- two-clock free-time.

**Gate:** scenario tests must pass before demo data is trusted.

## Phase 6 — Risk and alerts

Implement:

- deterministic risk engine;
- compliance signal table;
- manual signals;
- alert deduplication;
- explainability.

## Phase 7 — CSV ingestion

Implement:

```text
upload → staging → validation → confirm → transaction → events → recalculation
```

## Phase 8 — Tasks

Implement internal task workflows first, then external assignment fields and token mechanics.

## Phase 9 — External handoff

Build exactly one end-to-end external flow.

## Phase 10 — Document extraction

Retarget existing RAG/extraction work.

Keep AI isolated.

## Phase 11 — Historical compliance signals

Implement:

- HS-code novelty;
- valuation consistency.

## Phase 12 — Production hardening

- rate limiting;
- audit;
- retries;
- observability;
- backups;
- security;
- failure recovery;
- load testing.

## Phase 13 — Analytics

Implement root-cause and preventable-exposure views.

## Phase 14 — NL querying

Only after the deterministic data/query surface is stable.

---

# 28. Dependency Graph

```text
Architecture freeze
        │
        ▼
Monorepo/runtime
        │
        ├───────────────┐
        ▼               ▼
Auth/tenancy        AI service shell
        │
        ▼
Core entities
        │
        ├───────────────┐
        ▼               ▼
Operational UI      Event ingestion
        │               │
        └──────┬────────┘
               ▼
        Financial engines
               │
               ▼
          Risk engine
               │
       ┌───────┴────────┐
       ▼                ▼
     Alerts           Tasks
       │                │
       │                ▼
       │          External handoff
       │
       ▼
Compliance signals
       │
       ▼
Document extraction
       │
       ▼
Analytics
       │
       ▼
NL query layer
```

---

# 29. Critical Risks

## R1 — Multi-tenant data leak

**Severity:** Critical

A missing `client_id`/organization scope could expose client data.

**Mitigation:** centralized client-scope middleware + authorization tests + repository safeguards.

## R2 — Incorrect financial calculation

**Severity:** Critical

DPD/CFS two-clock logic and tariff boundaries can directly create monetary errors.

**Mitigation:** scenario-driven tests, immutable events, tariff versioning, calculation auditability.

## R3 — AI false confidence

**Severity:** High

Wrong document extraction can corrupt authoritative data.

**Mitigation:** human confirmation, confidence logging, provenance, no direct DB writes.

## R4 — Job duplication

**Severity:** High

Repeated workers can double-create charges, alerts, or notifications.

**Mitigation:** idempotency keys and unique constraints.

## R5 — Token abuse

**Severity:** High

Unauthenticated task confirmation is intentionally exposed.

**Mitigation:** entropy, expiry, hashing, rate limits, revocation, audit.

## R6 — Architecture erosion

**Severity:** High

Express makes it easy to bypass boundaries.

**Mitigation:** code review rules, module public interfaces, no controller→Prisma access.

## R7 — Scope explosion

**Severity:** High

External portals, live CFS integrations, NL querying, and broad AI features can consume the project.

**Mitigation:** enforce v1 boundaries.

---

# 30. What Should NOT Be Built in V1

Explicitly defer:

- persistent client login;
- general external portal;
- live CFS integrations;
- broad autonomous AI actions;
- customs-risk prediction;
- complex NL assistant;
- unnecessary analytics warehouse;
- over-generalized integration platform;
- elaborate notification preference center.

The project is strongest when it proves one complete operational loop.

---

# 31. Definition of Done

A feature is not done because the UI works.

A feature is done when:

```text
UI
 ↓
typed API
 ↓
authorization
 ↓
domain service
 ↓
repository
 ↓
database
 ↓
audit/observability
 ↓
tests
```

all behave correctly.

For financial features add:

```text
scenario tests
+
reproducible calculation
+
currency/rounding policy
+
tariff provenance
```

For AI features add:

```text
confidence
+
human review
+
provenance
+
failure behavior
```

For external features add:

```text
token security
+
expiry
+
rate limiting
+
audit
+
replay behavior
```

---

# 32. Final Critical Assessment

The four plans form a **strong coherent architecture** around a clear differentiator: a CHA operating system that unifies client/container operations while turning compliance and historical data into prevention signals.

The strongest decisions are:

1. client-first information architecture;
2. deterministic financial/risk core;
3. explicit DPD/CFS modeling;
4. two-clock free-time logic;
5. AI as advisory rather than structural;
6. human-in-the-loop document extraction;
7. one narrowly scoped external handoff;
8. shared application services between HTTP and workers.

The weakest areas are not the technology choices; they are **underspecified cross-cutting contracts**. The project should not move into large-scale implementation until tenancy, event semantics, financial precision, idempotency, document storage/security, token lifecycle, and auditability are written down.

If those gaps are closed, the architecture is capable of supporting the intended v1 without prematurely turning into a distributed-system-heavy platform.

---

# Appendix A — Non-Negotiable Engineering Rules

1. No business logic in Express route handlers.
2. Controllers do not call Prisma directly.
3. Workers reuse application/domain services.
4. Every protected domain query respects organization scope.
5. Client visibility is centralized.
6. OpenAPI is the API contract.
7. Frontend types are generated, not hand-copied.
8. AI never writes authoritative source-of-truth state directly.
9. Extracted document fields require human confirmation.
10. Financial calculations use deterministic, testable logic.
11. Delivery-mode transitions are represented by events.
12. Background jobs are idempotent.
13. Unauthenticated task tokens are treated like password-reset tokens.
14. Financial state changes are auditable.
15. v1 scope must remain narrow.

# Appendix B — Primary Demo Story

The strongest single demo sequence is:

```text
All Clients Dashboard
        ↓
Select Client
        ↓
Open At-Risk Container
        ↓
Show DPD/CFS status
        ↓
Trigger/show DPD_TO_CFS_FALLBACK
        ↓
Show two-clock exposure change
        ↓
Show explainable compliance risk
        ↓
Assign pickup task to trucker
        ↓
Send confirmation link
        ↓
Confirm from unauthenticated context
        ↓
CHA view updates
```

That sequence demonstrates the core thesis far better than a generic dashboard tour.
