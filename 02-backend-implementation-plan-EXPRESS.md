# DemurrageOS — Backend Implementation Plan
*(Part 2 of 4 — companion to 01-frontend, 03-data-infrastructure-platform, 04-ai-differentiation-layer)*

Covers `apps/api` — the Node.js + Express + TypeScript modular monolith.

## 1. Stack — Express migration

Node.js + Express + TypeScript, PostgreSQL via Prisma, Redis + BullMQ for queues/scheduling, Zod for request/CSV validation, better-auth for sessions, REST + OpenAPI.

### 1.1 Architecture rule

Express is the HTTP framework, **not the architecture**. Keep the modular-monolith boundary that the original Express plan was trying to enforce.

```text
HTTP route
  → middleware/auth/scope validation
  → controller
  → application/domain service
  → repository (Prisma)
  → PostgreSQL

Background job
  → worker handler
  → same application/domain service
  → repository (Prisma)
```

Do not put business logic in route handlers, do not let controllers call Prisma directly, and do not duplicate domain logic between HTTP handlers and BullMQ workers.

### 1.2 Recommended `apps/api` structure

```text
apps/api/src/
├── app.ts
├── server.ts
├── config/
├── middleware/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   ├── request-id.middleware.ts
│   └── rate-limit.middleware.ts
├── common/
│   ├── errors/
│   ├── http/
│   ├── logging/
│   └── validation/
├── modules/
│   ├── auth/
│   ├── organizations/
│   ├── clients/
│   ├── users/
│   ├── containers/
│   ├── shipments/
│   ├── ports/
│   ├── cfs/
│   ├── carriers/
│   ├── customs/
│   ├── tariffs/
│   ├── charges/
│   ├── risk/
│   ├── alerts/
│   ├── tasks/
│   ├── notifications/
│   ├── documents/
│   ├── imports/
│   ├── analytics/
│   └── audit/
├── jobs/
│   ├── queues.ts
│   └── workers/
├── prisma/
└── openapi/
```

Each module should own its routes/controllers, schemas, services/use-cases, and repository access. Shared infrastructure belongs in `common/` or `config/`; domain rules must not become a dumping ground in `common/`.


### 1.3 Express-specific guardrails

Express gives you fewer architectural constraints than NestJS, so enforce these rules in code review:

- Routes only map HTTP input/output; no business calculations in route files.
- Controllers translate HTTP concerns into application-service calls.
- Services contain domain/application rules and are reusable by workers.
- Prisma access is isolated behind repositories/data-access functions.
- Middleware handles cross-cutting concerns such as authentication, request IDs, rate limiting, and client scope.
- BullMQ workers must call the same services used by HTTP requests; never duplicate charge, free-time, or risk logic inside workers.
- Keep module ownership explicit. A module may depend on another module's public service/interface, not reach into its private repository implementation.
- Avoid a giant `utils/` or `helpers/` directory containing domain logic.
- Use typed request augmentation for authenticated user and client scope instead of `any`.
- Validate external input at the boundary with Zod before it reaches domain services.
- Keep OpenAPI as the API contract and generate frontend/shared types from it.

**Critical trade-off:** this Express architecture is intentionally more disciplined than a typical small Express project. That is necessary because DemurrageOS contains financial calculations, multi-tenant data, background jobs, and an unauthenticated task-confirmation endpoint. Express is acceptable here only if these boundaries are actively enforced.

## 2. Module structure — additions from the USP work marked NEW

```
backend/
├── auth/
├── organizations/
├── clients/              ← NEW — the CHA's book of importer/exporter clients
├── users/
├── containers/
├── shipments/
├── ports/
├── cfs/                  ← NEW — Container Freight Station directory
├── carriers/
├── customs/              ← status enum remapped, see §3
├── tariffs/               ← charge_type extended, see §3
├── charges/
├── risk/                 ← formula extended, calls into the AI layer's signal service (file 04)
├── alerts/
├── tasks/                ← external assignee support, see §4.5
├── notifications/
├── documents/            ← now receives structured output from the AI layer's extraction service
├── imports/
├── analytics/
└── audit/
```

## 3. Domain model changes — concrete diffs from your original schema

```prisma
model Client {
  id             String   @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  name           String
  iecCode        String?   // Importer Exporter Code
  gstin          String?
  contactName    String?
  contactEmail   String?
  contactPhone   String?
  aeoStatus      Boolean  @default(false)  // used by the compliance-signal engine, file 04
  acpStatus      Boolean  @default(false)
  createdAt      DateTime @default(now())
  containers     Container[]
}

model Container {
  // ...existing fields from your original plan
  clientId       String
  client         Client   @relation(fields: [clientId], references: [id])
  deliveryMode   DeliveryMode  @default(CFS)
  cfsId          String?
  cfs            CFS?     @relation(fields: [cfsId], references: [id])
}

enum DeliveryMode {
  DPD_DIRECT
  DPD_CFS
  CFS
}

model CFS {
  id     String @id @default(uuid())
  name   String
  portId String
  port   Port   @relation(fields: [portId], references: [id])
  code   String?
}

enum ChargeType {
  DEMURRAGE
  DETENTION
  STORAGE
  GROUND_RENT       // NEW — billed by the CFS operator, not the carrier
  SHIFTING_CHARGE   // NEW — flagged as an audit target
}

enum CustomsStatus {
  NOT_FILED
  FILED
  ASSESSED_RMS_SELECTED
  DUTY_PAID
  UNDER_EXAMINATION
  OUT_OF_CHARGE
  HOLD
  REJECTED
}
```

New `ContainerEvent` types: `CFS_GATE_IN`, `CFS_GATE_OUT`, `DPD_TO_CFS_FALLBACK`, `DELIVERY_ORDER_REISSUED`.

`Tariff` gets an optional `cfsId` alongside the existing `carrierId` — `GROUND_RENT` and `SHIFTING_CHARGE` tariffs are set by the CFS operator, not the carrier, so don't force both FKs to be required on the same row.

## 4. Core engines

### 4.1 Charge Calculation Engine — extended
Same `Controller → ContainerService → ChargeCalculationService → TariffEngine` shape as your original plan. It now branches on `deliveryMode` before picking which `Tariff` rows apply:

```
calculateCharges({ container, tariffs, cfsTariffs, events, currentDate }):
  if container.deliveryMode == CFS or (DPD_CFS and fallback occurred):
    include carrier demurrage/detention tariff slabs (as before)
    include CFS ground-rent tariff slabs, clocked from CFS_GATE_IN, not discharge
    flag any charge line not matching a known tariff slab as SHIFTING_CHARGE for audit
  else: // DPD_DIRECT
    include carrier demurrage/detention only
  return { freeDaysRemaining, daysOverdue, currentExposure, projectedExposure, breakdownByChargeType, currency }
```

`breakdownByChargeType` is new and matters — it's what lets the frontend show "₹25,000 carrier demurrage + ₹18,000 CFS ground rent" instead of one lump sum, which is the whole point of modeling `GROUND_RENT` separately.

### 4.2 Free-Time Engine — extended
Unchanged core logic, plus: a `DPD_TO_CFS_FALLBACK` event resets the free-time clock against the CFS ground-rent tariff (which typically starts from CFS gate-in) while the carrier demurrage clock keeps running from the original discharge timestamp. Two clocks, not one — the detail that's easy to get wrong.

### 4.3 Risk Engine — where it hands off to the AI layer
Keep the original formula's shape:

```
Operational Risk Score = Deadline Urgency + Customs Delay + Pickup Delay + Financial Exposure + Operational Uncertainty
```

`Customs Delay` and `Operational Uncertainty` are now populated by calling `ComplianceSignalService.getSignals(containerId)`, implemented in the AI/differentiation layer (file 04) — not here. This module should only know it receives a `{ signalType, score }[]` array and folds it into the weighted sum; zero knowledge of how signals are derived. That boundary keeps this module deterministic and unit-testable without mocking an AI call for every test — the "AI is peripheral, never structural" principle your original doc already committed to.

### 4.4 Alert Deduplication — unchanged
Your original rule holds: no duplicate alert for the same container/condition/severity; re-alert only on escalation, mutation, or prior resolution.

### 4.5 Tasks — external assignee support
```prisma
enum AssigneeType { INTERNAL_USER, EXTERNAL_CONTACT }

model Task {
  // ...existing fields
  assigneeType      AssigneeType @default(INTERNAL_USER)
  externalName      String?
  externalPhone     String?
  externalEmail     String?
  confirmationToken String?  @unique
  confirmedAt       DateTime?
}
```
The confirmation-link flow (token generation, the unauthenticated confirm page, expiry) is specified in file 04, since it's the mechanism behind the CHA↔trucker handoff, not generic task CRUD.

## 5. Multi-tenancy & RBAC


Every query still scopes to `organization_id`, unchanged. Add a second scoping dimension: a guard that resolves the current user's visible `client_id`s (all, for v1 — no per-client user restriction yet) and injects it into every containers/shipments/alerts/tasks query. Build this as one Express `clientScope` middleware that resolves visible client IDs and attaches a typed `ClientScope` object to the request, not ad hoc `WHERE` clauses scattered across services — you'll want that discipline the moment client-restricted logins arrive in v2.

## 6. API surface (additions to your original `/api/v1/...` list)

```
GET    /api/v1/clients
POST   /api/v1/clients
GET    /api/v1/clients/:id/containers
GET    /api/v1/cfs?portId=
POST   /api/v1/tasks/:id/external-assign
POST   /api/v1/tasks/confirm/:token        — unauthenticated
GET    /api/v1/containers/:id/documents
POST   /api/v1/containers/:id/documents    — triggers extraction job, see files 03/04
```

## 7. Testing

Vitest unit tests for §4.1–4.3 are the highest-value tests in the codebase — the DPD/CFS branching and two-clock free-time logic are exactly the kind of thing that's easy to get subtly wrong and expensive to get wrong in production, since it's literally the money. Write cases from real scenarios: a DPD container that never falls back, one that falls back on day 3, and a straight CFS container from day one.

## 8. Build order (delta from your original 15-phase roadmap)

Phases 0–2 unchanged at the product level; the API bootstrap uses Express instead of Express. Phase 3 ("Core Entities") now includes `Client` and `CFS` alongside Containers/Shipments/Ports/Events — build these together, since `Container.clientId` is required, not nullable. Phases 5–6 (Free-Time/Tariff engines) include the `deliveryMode` branch and `GROUND_RENT`/`SHIFTING_CHARGE` types from day one — retrofitting after Phase 6 means re-touching every calculation test you've already written. Phase 9 (Tasks) includes the external-assignee fields even before the confirmation UI is built, so the schema doesn't need a later migration.
