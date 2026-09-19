# DemurrageOS — Data, Infrastructure & Platform Plan
*(Part 3 of 4 — companion to 01-frontend, 02-backend, 04-ai-differentiation-layer)*

Covers everything that isn't a page (file 01) or a domain module (file 02): the pipes, the queues, the deployment, and the seed data.

## 1. Why this is its own file

Your original 15-phase roadmap spread this across Phases 1, 4, 11, 12, and 14. Splitting it out means whoever's building the backend modules isn't context-switching into Docker networking and cron schedules — and this is the one part of the stack that has to be right before a demo, not just before production.

## 2. CSV ingestion pipeline

Unchanged shape: upload → in-memory parse → Zod schema validation → error detection → staging preview → user confirmation → atomic DB insert → event ingestion → risk recalculation.

Two column additions to the expected CSV schema, both required now the domain model includes them:
- `client_id` (or `client_name` with a lookup/create-on-import step — friendlier for a CHA importing a client's shipment list for the first time)
- `delivery_mode` (defaults to `CFS` if blank — the conservative assumption. Never default to `DPD_DIRECT`, which would understate risk)

## 3. Redis + BullMQ jobs

| Job | Schedule/Trigger | Changed? |
|---|---|---|
| `calculate-container-risk` | On event ingestion | Unchanged trigger; now also fires when a `ComplianceSignal` updates (file 04) |
| `check-expiring-free-time` | Every 15 min | Unchanged |
| `sync-carrier-data` | Hourly | Unchanged |
| `daily-reconciliation` | 00:00 UTC | Unchanged |
| `process-document-extraction` | On document upload | **NEW** — queues the parse job. Input: a file reference. Output: structured fields + confidence score. Writes nothing to the source of truth directly — that happens only after human confirmation in the UI |
| `send-task-confirmation` | On external task assignment | **NEW** — dispatches the confirmation link via email/SMS. Token rules are file 04's concern; this job just sends it |

## 4. Integration adapters

Keep the `IntegrationAdapter` interface exactly as originally specified — carrier APIs, port EDI, CSV, all behind one normalization layer. For v1, treat CFS data (ground-rent tariffs, gate-in/out timestamps) as **manually entered or CSV-imported**, not a live adapter. A live feed to CFS operators is a real integration project on its own and isn't needed to prove the product's thesis.

## 5. DevOps


### 5.1 API runtime boundary

The `api` container runs the Express application and BullMQ workers as separate processes (or separate container commands) while sharing the same application/domain modules.

```text
                    ┌─────────────────────┐
                    │ Next.js web          │
                    └──────────┬──────────┘
                               │ REST/OpenAPI
                               ▼
                    ┌─────────────────────┐
                    │ Express API          │
                    │ routes/controllers   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Domain/application   │
                    │ services             │
                    └──────┬─────────┬────┘
                           │         │
                     Prisma│         │BullMQ
                           ▼         ▼
                       Postgres     Redis
                                     ▲
                                     │
                              ┌──────┴──────┐
                              │ Worker      │
                              │ process     │
                              └─────────────┘
```

Do not put worker-only business logic in the Express process just because both currently live in one repository. They share code, not responsibilities.

### Docker Compose services
```yaml
services:
  postgres:
  redis:
  api:          # Node.js + Express + TypeScript
  web:          # Next.js
  ai-service:   # NEW — the Python document-extraction/compliance-signal service, see file 04
```

### Monorepo layout (Turborepo)
```
apps/
├── web/           # Next.js — file 01
├── api/           # Node.js + Express + TypeScript — file 02
└── ai-service/    # Python — file 04
packages/
├── shared-types/  # generated from Express API OpenAPI, consumed by web
└── config/
```

### CI (GitHub Actions)
Lint → typecheck → unit test (Vitest for `web`/`api`, pytest for `ai-service`) → integration test (Supertest) → build. Run the Playwright E2E suite on a separate, slower workflow (nightly or on merge to main) rather than every PR — it's the most valuable suite but also the slowest.

## 6. Observability

Pino + Sentry as specified. One addition: every call to `ChargeCalculationService` and `RiskEngine` should log its full input and output at INFO level, not just errors. These are financial calculations — when a client disputes a number six months from now, you want the exact inputs that produced it, not just the final stored value. Cheap to add now, painful to reconstruct later.

## 7. Security

Standard multi-tenant scoping and audit logging as originally specified, plus one new concern: `POST /api/v1/tasks/confirm/:token` (file 02, §6) is unauthenticated by design — the person clicking it has no account. Rate-limit it aggressively per token, expire tokens after a short window (72 hours is reasonable for a pickup/customs task), and make the token a high-entropy random value, never a guessable ID. This is the one part of the differentiation-layer work that's also a genuine attack surface — treat it like a password-reset link, because it functionally is one.

## 8. Synthetic seed data

Extend your original generator (10,000 containers / 500 shipments / 50,000 events) to include:
- A spread of `Client` records per `Organization`, so the client-switcher demo has something to switch between
- A realistic DPD/CFS mix — mostly `CFS`, a meaningful minority `DPD_DIRECT`, and a deliberate few `DPD_CFS` that fall back partway through, so the fallback event and two-clock exposure calculation have something to show
- A few containers with intentionally incomplete compliance signals (missing docs, novel HS code) so the enriched risk score has visibly different "why" reasons across containers, not the same three bullets every time

## 9. Build order

Phase 1 (monorepo setup) should stand up all three app shells — including the empty `ai-service` container — even before it does anything, so Docker Compose networking is solved once, early, rather than bolted on later. Everything else here slots into your original Phase 4 (ingestion), 11 (workers), 12 (security/audit), and 14 (deployment) — just with the additions above folded in.
