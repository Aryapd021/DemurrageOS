# DemurrageOS — AI & Differentiation Layer Plan
*(Part 4 of 4 — companion to 01-frontend, 02-backend, 03-data-infrastructure-platform)*

This file is the actual USP: everything here is what makes DemurrageOS "prevention + unification" instead of another container dashboard. It's the last file, not because it's least important, but because your architecture correctly requires the other three to exist first.

## 0. The one rule this file follows

Every feature below is advisory input into a deterministic system, never a system of record. If the AI service is down, wrong, or removed entirely, the risk engine, the charge calculations, and the task system all keep working correctly — just with less foresight. That's the test for every decision here: does the deterministic core still work if this fails? If not, it's built wrong.

## 1. Compliance Signal Engine — the "prevention" half of the pitch

### 1.1 Signals, v1

| Signal | What it captures | Source |
|---|---|---|
| Documentation completeness | Are DO, invoice, packing list, and any license/certificate present and internally consistent? | From the document extraction pipeline (§2) once it exists; manually entered by the CHA before then |
| HS code novelty | Has this org filed this HS code before, and how recently? | Derived from your own historical `Container`/`Shipment` data — no external lookup needed |
| AEO / ACP status | Is this specific client accredited? | The `aeoStatus`/`acpStatus` fields on `Client` (file 02, §3) — set once per client, not per shipment |
| Valuation consistency | Is the declared value in line with this client's historical filings for similar goods? | Derived from historical data, same as HS code novelty |

Two of the four need nothing new at all — they're queries against data you already have once `Client` and historical `Container` records exist. Build those two first; they cost almost nothing and already make the risk score noticeably smarter.

### 1.2 The line you should not cross

Build every signal from publicly documented import/export compliance practice — complete paperwork, consistent classification, consistent valuation, accreditation status — never from an attempt to infer or replicate the customs authority's actual, confidential risk-selection logic. The goal and the target look identical from outside (fewer containers flagged for examination), but the method has to stay "give the CHA a checklist of what customs cares about," not "guess how the government's internal system decides." That distinction should hold up if you ever have to explain it to a customs professional, a judge at a pitch, or a professor.

### 1.3 Wiring

```prisma
model ComplianceSignal {
  id          String   @id @default(uuid())
  containerId String
  container   Container @relation(fields: [containerId], references: [id])
  signalType  ComplianceSignalType
  score       Int       // 0-100, same convention as the overall risk score
  source      SignalSource  // MANUAL | DERIVED
  createdAt   DateTime  @default(now())
}
enum ComplianceSignalType { DOC_COMPLETENESS, HS_CODE_NOVELTY, AEO_ACP_STATUS, VALUATION_CONSISTENCY }
enum SignalSource { MANUAL, DERIVED }
```

`RiskEngine.getSignals(containerId)` (file 02, §4.3) reads from this table. Nothing about the risk engine's own code needs to know whether a signal was typed in by a human or derived by a job — that's the point of the boundary.

## 2. Document extraction — reusing what you've already built

You've already got a working RAG ingestion pipeline (LangChain + Chroma, Google embeddings) from other work, already debugged through the usual import-path and embedding-model-deprecation issues. Don't rebuild this from scratch — retarget it.

**What it parses, v1:** Bill of Lading / Delivery Order, Bill of Entry, CFS gate-pass, carrier D&D invoice PDFs.

**Service contract:**
```
POST /extract  (internal, called by the process-document-extraction job in file 03)
  in:  { documentId, fileUrl, documentType }
  out: { extractedFields: {...}, confidence: 0-1, flaggedForReview: boolean }
```

This service **never writes to Postgres directly**. It returns structured output; the Express `documents` module stages it; a human confirms or corrects each field in the UI (file 01, §4.5) before it becomes part of the source of truth. This is your own doc's Feature #4 requirement, and it's worth keeping even once extraction is reliable — the one time it silently gets a container number wrong is the time it costs someone real money.

**Practical note:** pin whichever embedding model is current and stable rather than assuming the one you used before stays supported — you've already had to migrate off a deprecated one once. Make the swap a config change this time, not a code change.

## 3. Natural-language querying — later, and small

Once §1 and §2 exist, "show me containers likely to cost more than ₹50,000 this week" is a thin layer converting text into a filtered query against data that already exists — genuinely a Phase-15-style feature. Don't start this before §1 and §2 are working.

## 4. The network effect — CHA ↔ trucker ↔ importer

### 4.1 Scope for v1: one working handoff, not a platform

Build exactly one external-confirmation flow end to end — task assigned to a trucker → confirmation link sent → trucker confirms pickup scheduled → task and container status update live. Resist building a general "external portal" for v1; one working handoff proves the mechanism and is what you demo.

### 4.2 Token flow

1. CHA assigns a task with `assigneeType: EXTERNAL_CONTACT` (file 02, §4.5)
2. Backend generates a high-entropy `confirmationToken`, sets a 72-hour expiry
3. `send-task-confirmation` job (file 03, §3) dispatches it via SMS/email/WhatsApp
4. External party opens an unauthenticated single-purpose page: task summary, one confirm button, nothing else
5. Confirmation updates `Task.confirmedAt`, fires the same event pipeline as an internal status change

### 4.3 Architecture boundary, restated

```
        ┌───────────────┐
        │ AI Assistant  │   compliance signals, document extraction,
        │ (ai-service)  │   NL queries — advisory only
        └───────┬───────┘
                │  reads/suggests, never writes source of truth directly
                ▼
        ┌───────────────┐
        │ Express API    │   deterministic risk/charge/free-time engines
        │ (source of    │   remain fully correct with ai-service offline
        │  truth)       │
        └───────────────┘
```

Same shape as the diagram in your original plan — this file just fills in what's actually inside the box.

## 5. Testing AI output specifically

Standard unit/integration tests don't cover this well because the interesting failure mode is "confidently wrong," not "crashes." Two extra practices:
- Log every extraction's confidence score and whether a human corrected it — you want this data to know if the pipeline is actually improving or you're just getting used to correcting it
- Never let `flaggedForReview: true` items skip the manual confirmation step, even in a demo — "look, it flags what it's unsure about" is a better story than "look, it's always right"

## 6. Build order

Do the manual version of everything before the automated version:
1. `ComplianceSignal` table + manual entry UI, wired into the risk score — the biggest score improvement for the least engineering
2. Historical-data-derived signals (HS code novelty, valuation consistency) — free once #1's schema exists
3. External task handoff (§4) — the demo-able network moment
4. Document extraction (§2) — retarget the existing pipeline once the above are stable
5. NL querying (§3) — last, only if time allows

This order means that if you run out of time before a deadline, you still have a complete, demoable story at every stopping point — which a straight top-to-bottom build of the original 15 phases does not guarantee.
