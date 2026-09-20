# DemurrageOS — Architecture & System Flow Specification

> This document turns the four implementation plans into one architecture reference. It focuses on boundaries, data flow, runtime flow, event flow, asynchronous processing, security boundaries, and failure behavior.
>
> The diagrams use Mermaid where possible so the document can serve as an engineering design reference.

---

# 1. Architecture at a Glance

```mermaid
flowchart TB
    U[CHA User] --> WEB[Next.js Web App]
    EXT[External Trucker / Contact] --> CONF[Unauthenticated Confirmation Page]

    WEB --> API[Express API]
    CONF --> API

    API --> AUTH[Auth + Scope Middleware]
    AUTH --> CTRL[Controllers]
    CTRL --> SVC[Application / Domain Services]
    SVC --> REPO[Repositories]
    REPO --> DB[(PostgreSQL)]

    SVC --> REDIS[(Redis)]
    REDIS --> WORKER[BullMQ Worker Processes]
    WORKER --> SVC

    WORKER --> AI[Python AI Service]
    AI --> WORKER

    SVC --> AUDIT[Audit / Observability]
    WORKER --> AUDIT
    API --> AUDIT
```

## Core rule

```text
AI is advisory.
Express is authoritative.
PostgreSQL is the source of truth.
Redis/BullMQ is execution infrastructure.
Next.js is the operational interface.
```

---

# 2. Logical Architecture

```mermaid
flowchart LR
    subgraph Presentation
        WEB[Next.js]
        EXT[External confirmation page]
    end

    subgraph API["Express Modular Monolith"]
        AUTH[Auth / Scope]
        CONT[Controllers]
        DOMAIN[Domain Services]
        RISK[Risk Engine]
        CHARGE[Charge Engine]
        FREE[Free-Time Engine]
        TASK[Task Service]
        DOC[Documents Module]
        IMPORT[Import Module]
    end

    subgraph Data
        PG[(PostgreSQL)]
        REDIS[(Redis)]
    end

    subgraph Async
        BULL[BullMQ]
        WORKERS[Workers]
    end

    subgraph AI["Python AI Service"]
        SIGNAL[Compliance Signals]
        EXTRACT[Document Extraction]
        NL[NL Query - Later]
    end

    WEB --> AUTH
    EXT --> AUTH
    AUTH --> CONT
    CONT --> DOMAIN

    DOMAIN --> RISK
    DOMAIN --> CHARGE
    DOMAIN --> FREE
    DOMAIN --> TASK
    DOMAIN --> DOC
    DOMAIN --> IMPORT

    DOMAIN --> PG
    DOMAIN --> REDIS
    REDIS --> BULL
    BULL --> WORKERS
    WORKERS --> DOMAIN
    WORKERS --> SIGNAL
    WORKERS --> EXTRACT
    WORKERS --> NL
```

---

# 3. Runtime Deployment Architecture

```mermaid
flowchart TB
    subgraph DockerCompose
        WEB[web container<br/>Next.js]
        API[api container<br/>Express]
        WORKER[worker process/container<br/>BullMQ]
        AI[ai-service container<br/>Python]
        PG[(postgres)]
        REDIS[(redis)]
    end

    WEB -->|REST / OpenAPI| API
    API --> PG
    API --> REDIS
    WORKER --> REDIS
    WORKER --> PG
    WORKER --> AI
    AI --> WORKER
```

The platform plan specifies the API and worker as separate processes/commands while sharing application/domain code. They share code, but not responsibilities.

---

# 4. Backend Request Flow

```mermaid
sequenceDiagram
    participant Browser
    participant API as Express API
    participant Auth as Auth/Scope Middleware
    participant Controller
    participant Service as Domain/Application Service
    participant Repo as Repository
    participant DB as PostgreSQL

    Browser->>API: HTTP request
    API->>Auth: Authenticate + resolve org/client scope
    Auth->>Controller: Typed authenticated request
    Controller->>Service: Use-case input
    Service->>Repo: Domain persistence/read
    Repo->>DB: SQL via Prisma
    DB-->>Repo: Data
    Repo-->>Service: Domain data
    Service-->>Controller: Result
    Controller-->>Browser: HTTP response
```

## Boundary rule

Never:

```text
route → Prisma
controller → Prisma
worker → duplicated business logic
```

Always:

```text
route
→ middleware
→ controller
→ service
→ repository
→ database
```

---

# 5. Worker Flow

```mermaid
sequenceDiagram
    participant Trigger
    participant Redis
    participant Worker
    participant Service
    participant DB
    participant AI

    Trigger->>Redis: Enqueue job
    Redis->>Worker: Deliver job
    Worker->>Service: Invoke same application service
    Service->>DB: Read/write authoritative state
    Service-->>Worker: Result
    Worker-->>Redis: Complete/retry

    opt AI-dependent job
        Worker->>AI: Request advisory/extraction
        AI-->>Worker: Structured output
        Worker->>Service: Stage/process result
        Service->>DB: Persist approved/staged state
    end
```

---

# 6. Event-Driven Operational Flow

```mermaid
flowchart TD
    SOURCE[Carrier / Port / CSV / Manual Input]
        --> NORMALIZE[Integration Adapter / Normalization]

    NORMALIZE --> EVENT[ContainerEvent]
    EVENT --> PERSIST[Persist event]
    PERSIST --> RISK[Recalculate Risk]
    PERSIST --> FREE[Recalculate Free-Time]
    PERSIST --> CHARGE[Recalculate Charges]

    RISK --> ALERT[Alert Deduplication]
    FREE --> ALERT
    CHARGE --> ALERT

    ALERT --> TASK[Create / Update Operational Task]
    TASK --> NOTIFY[Notification Job]
```

The exact transaction/outbox semantics need to be finalized before production. The architecture should not assume that an external event can simply be inserted twice without consequence.

---

# 7. Container State / Event Flow

```mermaid
stateDiagram-v2
    [*] --> CFS
    [*] --> DPD_DIRECT
    [*] --> DPD_CFS

    DPD_CFS --> DPD_CFS: normal DPD flow
    DPD_CFS --> CFS: DPD_TO_CFS_FALLBACK

    CFS --> CFS: CFS_GATE_IN
    CFS --> CFS: CFS_GATE_OUT

    DPD_DIRECT --> DPD_DIRECT: carrier events
    CFS --> CFS: delivery-order changes
    DPD_CFS --> CFS: fallback recorded
```

Important: `DPD_TO_CFS_FALLBACK` should be preserved as a historical event. It should not be represented only as a current enum value.

---

# 8. Financial Calculation Flow

```mermaid
flowchart TD
    C[Container]
    C --> MODE{Delivery Mode}
    C --> EVENTS[Container Events]
    C --> CT[Carrier Tariffs]
    C --> CFT[CFS Tariffs]

    MODE -->|DPD_DIRECT| DIRECT[Carrier Charges]
    MODE -->|CFS| CFSFLOW[Carrier + CFS Charges]
    MODE -->|DPD_CFS| CHECK{Fallback occurred?}

    CHECK -->|No| DIRECT
    CHECK -->|Yes| CFSFLOW

    EVENTS --> CLOCK1[Carrier Clock]
    EVENTS --> CLOCK2[CFS Clock]

    CFSFLOW --> CLOCK1
    CFSFLOW --> CLOCK2

    DIRECT --> CALC[ChargeCalculationService]
    CFSFLOW --> CALC
    CLOCK1 --> CALC
    CLOCK2 --> CALC
    CT --> CALC
    CFT --> CALC

    CALC --> OUTPUT[Exposure + Breakdown + Currency]
```

## Two-clock model

```text
Carrier demurrage/detention
    starts from original discharge basis

CFS ground rent
    starts from CFS_GATE_IN after CFS involvement
```

This is a critical domain invariant.

---

# 9. Charge Breakdown

```mermaid
flowchart LR
    CALC[Charge Calculation]
        --> DEM[Carrier Demurrage]
    CALC --> DET[Carrier Detention]
    CALC --> ST[Storage]
    CALC --> GR[Ground Rent]
    CALC --> SHIFT[Shifting Charge Audit Target]

    DEM --> TOTAL[Exposure]
    DET --> TOTAL
    ST --> TOTAL
    GR --> TOTAL
    SHIFT --> TOTAL
```

The UI should preserve the breakdown rather than showing only a total.

Example conceptual output:

```text
Carrier demurrage      ₹25,000
CFS ground rent        ₹18,000
Other                  ₹...
-------------------------------
Current exposure       ₹...
Projected exposure     ₹...
```

---

# 10. Risk Architecture

```mermaid
flowchart TD
    DEAD[Deadline Urgency]
    CUSTOMS[Customs Delay]
    PICKUP[Pickup Delay]
    FIN[Financial Exposure]
    UNC[Operational Uncertainty]

    SIGNALS[ComplianceSignalService]
    SIGNALS --> CUSTOMS
    SIGNALS --> UNC

    DEAD --> RISK[Risk Engine]
    CUSTOMS --> RISK
    PICKUP --> RISK
    FIN --> RISK
    UNC --> RISK

    RISK --> SCORE[Deterministic Risk Score]
    SCORE --> ALERT[Alert]
    SCORE --> UI[Explainability UI]
```

The AI layer does not own the final risk score.

---

# 11. Compliance Signal Flow

```mermaid
flowchart TD
    subgraph Sources
        MANUAL[Manual CHA Input]
        HIST[Historical Container/Shipment Data]
        DOCS[Document Extraction]
        CLIENT[Client AEO/ACP]
    end

    MANUAL --> SIGNALS[ComplianceSignal]
    HIST --> SIGNALS
    DOCS --> SIGNALS
    CLIENT --> SIGNALS

    SIGNALS --> DB[(PostgreSQL)]
    DB --> RISK[Risk Engine]
```

v1 signals:

```text
DOC_COMPLETENESS
HS_CODE_NOVELTY
AEO_ACP_STATUS
VALUATION_CONSISTENCY
```

---

# 12. AI Service Boundary

```mermaid
flowchart LR
    API[Express API]
    JOB[Extraction Job]
    AI[Python AI Service]
    STAGE[Document Staging]
    HUMAN[Human Review]
    DB[(PostgreSQL)]

    API --> JOB
    JOB --> AI
    AI -->|fields + confidence + review flag| STAGE
    STAGE --> HUMAN
    HUMAN -->|accept/correct| DB
```

## Forbidden flow

```text
AI
 ↓
PostgreSQL authoritative record
```

## Correct flow

```text
AI
 ↓
structured suggestion
 ↓
Express staging
 ↓
human confirmation
 ↓
authoritative record
```

---

# 13. Document Extraction Sequence

```mermaid
sequenceDiagram
    participant User
    participant Web
    participant API
    participant Redis
    participant Worker
    participant AI
    participant DB

    User->>Web: Upload document
    Web->>API: POST document
    API->>DB: Store document metadata
    API->>Redis: Enqueue extraction
    API-->>Web: Upload accepted

    Redis->>Worker: process-document-extraction
    Worker->>AI: /extract
    AI-->>Worker: fields + confidence + review flag
    Worker->>DB: Store staged extraction

    User->>Web: Review fields
    Web->>API: Accept/correct
    API->>DB: Commit authoritative values
```

---

# 14. External Task Confirmation Flow

```mermaid
sequenceDiagram
    participant CHA
    participant Web
    participant API
    participant DB
    participant Queue
    participant Notify
    participant External

    CHA->>Web: Assign task externally
    Web->>API: external-assign
    API->>DB: Create/update task + token metadata
    API->>Queue: send-task-confirmation
    Queue->>Notify: Dispatch email/SMS/WhatsApp
    Notify-->>External: Confirmation link

    External->>API: POST confirm/:token
    API->>DB: Validate token + expiry
    API->>DB: Set confirmedAt
    API->>DB: Record event/audit
    API-->>External: Confirmation result

    Web->>API: Refresh task/container
    API-->>Web: Updated state
```

---

# 15. External Token Security Flow

```mermaid
flowchart TD
    ASSIGN[External assignment]
        --> TOKEN[Generate high-entropy token]
    TOKEN --> EXPIRY[Set 72h expiry]
    EXPIRY --> SEND[Send notification]
    SEND --> LINK[External link]

    LINK --> VALIDATE{Token valid?}

    VALIDATE -->|No| DENY[Reject]
    VALIDATE -->|Expired| DENY
    VALIDATE -->|Rate limit exceeded| DENY

    VALIDATE -->|Yes| CONFIRM[Confirm task]
    CONFIRM --> AUDIT[Audit]
    CONFIRM --> EVENT[Event pipeline]
```

The exact token storage strategy should be finalized. Prefer storing a hash of the token rather than a reusable plaintext token where practical.

---

# 16. Client Scoping Flow

```mermaid
flowchart TD
    REQ[Authenticated Request]
        --> ORG[Resolve Organization]
    ORG --> CLIENTS[Resolve visible client IDs]
    CLIENTS --> SCOPE[Typed ClientScope]
    SCOPE --> CONTROLLER[Controller]
    CONTROLLER --> SERVICE[Service]
    SERVICE --> REPO[Repository]
    REPO --> DB[(PostgreSQL)]
```

## Required invariant

A user cannot retrieve a container merely because they know its UUID.

The request must satisfy:

```text
container.organizationId == user.organizationId
AND
container.clientId ∈ user.visibleClientIds
```

---

# 17. CSV Import Flow

```mermaid
flowchart TD
    FILE[CSV Upload]
        --> PARSE[Parse]
    PARSE --> ZOD[Zod Validation]
    ZOD --> STAGE[Staging]
    STAGE --> REPORT[Valid / Warning / Error Counts]
    REPORT --> REVIEW[User Review]
    REVIEW --> CONFIRM{Confirm?}

    CONFIRM -->|No| DISCARD[Discard]
    CONFIRM -->|Yes| TX[Atomic Authoritative Transaction]

    TX --> CONTAINERS[Create/update containers]
    TX --> EVENTS[Create events]
    TX --> OUTBOX[Create async work/outbox records]

    TX --> COMMIT[Commit]
    COMMIT --> RISK[Async Risk Recalculation]
    RISK --> ALERTS[Alert Processing]
```

Recommended architectural interpretation:

```text
Database transaction
    authoritative data only

After commit
    asynchronous recalculation
```

This keeps database transactions short.

---

# 18. Data Flow from Import to Risk

```mermaid
flowchart LR
    CSV[CSV]
    CSV --> VALIDATE[Validate]
    VALIDATE --> DB[(PostgreSQL)]
    DB --> EVENTS[Container Events]
    EVENTS --> RISK[Risk Engine]
    DB --> SIGNAL[Compliance Signals]
    SIGNAL --> RISK
    RISK --> ALERT[Alerts]
    ALERT --> TASK[Tasks]
```

---

# 19. API Contract Flow

```mermaid
flowchart LR
    DOMAIN[Express API]
        --> OPENAPI[OpenAPI Specification]
    OPENAPI --> TYPES[Generated Shared Types]
    TYPES --> WEB[Next.js]
```

The API contract should be the single source for frontend DTO typing.

---

# 20. Frontend State Flow

```mermaid
flowchart TD
    PAGE[Next.js Page]
        --> QUERY[TanStack Query Hook]
    QUERY --> CLIENT[Typed API Client]
    CLIENT --> API[Express]
    API --> DATA[JSON Response]
    DATA --> QUERY
    QUERY --> UI[Component]
```

No component-level raw `fetch`.

---

# 21. Frontend Information Architecture

```mermaid
flowchart TD
    APP[CHA Organization]
    APP --> SWITCHER[Client Switcher]

    SWITCHER --> ALL[All Clients]
    SWITCHER --> A[Client A]
    SWITCHER --> B[Client B]
    SWITCHER --> C[Client C]

    ALL --> DASH[Dashboard]
    A --> DASH
    B --> DASH
    C --> DASH

    DASH --> CONTAINERS[Containers]
    DASH --> ALERTS[Alerts]
    DASH --> TASKS[Tasks]
    DASH --> ANALYTICS[Analytics]
```

---

# 22. Container Detail Architecture

```mermaid
flowchart TD
    DETAIL[Container Detail]
    DETAIL --> SUMMARY[Container Summary]
    DETAIL --> MODE[Delivery Mode Badge]
    DETAIL --> TIMELINE[Event Timeline]
    DETAIL --> CHARGES[Charge Breakdown]
    DETAIL --> RISK[Risk Explainability]
    DETAIL --> DOCS[Document Panel]
    DETAIL --> TASKS[Tasks]

    TIMELINE --> FALLBACK{Fallback?}
    FALLBACK -->|Yes| MODE
    FALLBACK -->|Yes| CHARGES
    FALLBACK -->|Yes| RISK
```

---

# 23. Full End-to-End Operational Flow

```mermaid
flowchart TB
    INPUT[Carrier / Port / CSV / Manual Input]
        --> EVENT[Normalized Event]
    EVENT --> DB[(PostgreSQL)]

    DB --> FREE[Free-Time Engine]
    DB --> CHARGE[Charge Engine]
    DB --> SIGNAL[Compliance Signals]
    SIGNAL --> RISK[Risk Engine]
    FREE --> RISK
    CHARGE --> RISK

    RISK --> ALERT[Alert Deduplication]
    ALERT --> TASK[Operational Task]

    TASK --> INTERNAL[Internal Assignee]
    TASK --> EXTERNAL[External Contact]

    EXTERNAL --> TOKEN[Confirmation Token]
    TOKEN --> CONFIRM[External Confirmation]
    CONFIRM --> EVENT2[Status Event]

    EVENT2 --> DB

    DOC[Uploaded Document] --> EXTRACT[AI Extraction]
    EXTRACT --> REVIEW[Human Review]
    REVIEW --> DB
    DB --> SIGNAL
```

---

# 24. Failure Architecture

## AI unavailable

```text
Document upload
 ↓
job queued
 ↓
AI unavailable
 ↓
retry/backoff
 ↓
document remains unprocessed
```

The deterministic system continues operating.

## Redis unavailable

Expected behavior must be explicitly decided.

Recommended:

```text
synchronous CRUD remains available where possible
async work becomes delayed
alerts/jobs do not silently disappear
```

This implies durable enqueue/outbox semantics should be considered.

## Database unavailable

```text
API request
 ↓
DB failure
 ↓
structured 5xx
 ↓
request ID
 ↓
Sentry/log
```

Do not partially report a successful financial mutation.

## Worker failure

```text
job
 ↓
worker crash
 ↓
retry
 ↓
backoff
 ↓
dead-letter/failed state
 ↓
operator visibility
```

---

# 25. Idempotency Architecture

This is a major missing cross-cutting contract in the source plans.

The following should be idempotent:

- event ingestion;
- CSV import confirmation;
- risk recalculation;
- charge recalculation;
- notifications;
- document extraction jobs;
- external confirmation.

Conceptually:

```mermaid
flowchart LR
    JOB[Job/Event]
        --> KEY[Idempotency Key]
    KEY --> CHECK{Already processed?}
    CHECK -->|Yes| RETURN[Return existing result]
    CHECK -->|No| EXEC[Execute]
    EXEC --> RECORD[Record completion]
```

Without this, retries can become duplicate financial or operational actions.

---

# 26. Transaction Boundary Architecture

Recommended pattern:

```text
BEGIN
  authoritative domain writes
  event/outbox record
COMMIT

then:

queue asynchronous processing
```

Avoid:

```text
BEGIN
  database writes
  call AI
  call external notification provider
  calculate everything
COMMIT
```

That would create long, fragile transactions.

---

# 27. Suggested Outbox Pattern

The four plans mention Redis/BullMQ but do not define a durable handoff between PostgreSQL transactions and queue publication.

A robust production pattern is:

```mermaid
flowchart TD
    TX[DB Transaction]
        --> DATA[Domain Data]
    TX --> OUTBOX[Outbox Event]
    TX --> COMMIT[Commit]

    COMMIT --> PUBLISH[Outbox Publisher]
    PUBLISH --> REDIS[Redis/BullMQ]
    REDIS --> WORKER[Worker]
```

This prevents the classic failure:

```text
DB commit succeeds
queue publish fails
→ event exists but async work never runs
```

Whether this is needed for v1 depends on reliability requirements, but it should be an explicit decision rather than an accidental omission.

---

# 28. Security Boundary Map

```mermaid
flowchart TB
    USER[Authenticated CHA User]
    USER --> SESSION[Session/Auth]
    SESSION --> ORG[Organization Scope]
    ORG --> CLIENT[Client Scope]
    CLIENT --> RESOURCE[Domain Resource]

    EXT[External Contact]
    EXT --> TOKEN[High Entropy Token]
    TOKEN --> LIMITED[Single-purpose task endpoint]
    LIMITED --> TASK[Only permitted task action]
```

External users must not inherit authenticated internal API capabilities.

---

# 29. Document Security Boundary

```mermaid
flowchart LR
    USER[Authorized User]
        --> API[Express]
    API --> AUTHZ[Org/Client Authorization]
    AUTHZ --> FILE[Private Document Storage]
    FILE --> AI[Controlled Extraction]
    AI --> STAGE[Staged Output]
    STAGE --> HUMAN[Human Review]
```

Do not expose raw document URLs broadly if documents contain sensitive trade/commercial data.

---

# 30. Observability Flow

```mermaid
flowchart LR
    REQUEST[HTTP Request]
        --> RID[Request ID]
    RID --> LOG[Pino Logs]
    RID --> SENTRY[Sentry]
    RID --> AUDIT[Audit Log]

    JOB[Background Job]
        --> JID[Job ID]
    JID --> LOG
    JID --> SENTRY
    JID --> AUDIT

    CALC[Charge/Risk Calculation]
        --> LOG
        --> AUDIT
```

For financial calculations, log enough structured metadata to reconstruct why a number was produced without logging secrets or unnecessary sensitive document contents.

---

# 31. Financial Traceability Flow

```mermaid
flowchart TD
    EXPOSURE[Exposure Number]
        --> EVENTS[Input Events]
    EXPOSURE --> TARIFF[Tariff Version]
    EXPOSURE --> MODE[Delivery Mode]
    EXPOSURE --> CLOCKS[Free-Time Clocks]
    EXPOSURE --> ADJUST[Manual Adjustments]
    EXPOSURE --> CALCVER[Calculation Version]

    EVENTS --> RECON[Reproducible Calculation]
    TARIFF --> RECON
    MODE --> RECON
    CLOCKS --> RECON
    ADJUST --> RECON
    CALCVER --> RECON
```

This is necessary if the product is ever used to dispute or reconcile a charge.

---

# 32. Module Dependency Architecture

```mermaid
flowchart TD
    AUTH[Auth]
    ORG[Organizations]
    CLIENT[Clients]
    CONTAINER[Containers]
    SHIPMENT[Shipments]
    PORT[Ports]
    CFS[CFS]
    CARRIER[Carriers]
    CUSTOMS[Customs]
    TARIFF[Tariffs]
    CHARGE[Charges]
    FREE[Free-Time]
    RISK[Risk]
    SIGNAL[Compliance Signals]
    ALERT[Alerts]
    TASK[Tasks]
    DOC[Documents]
    IMPORT[Imports]
    ANALYTICS[Analytics]
    AUDIT[Audit]

    AUTH --> ORG
    ORG --> CLIENT
    CLIENT --> CONTAINER
    SHIPMENT --> CONTAINER
    PORT --> CFS
    CFS --> TARIFF
    CARRIER --> TARIFF
    CONTAINER --> CHARGE
    TARIFF --> CHARGE
    CONTAINER --> FREE
    CFS --> FREE
    SIGNAL --> RISK
    CONTAINER --> RISK
    CHARGE --> RISK
    FREE --> RISK
    RISK --> ALERT
    ALERT --> TASK
    CONTAINER --> DOC
    CONTAINER --> IMPORT
    CONTAINER --> ANALYTICS
    CONTAINER --> AUDIT
```

The actual implementation should preserve public module interfaces and prevent direct access to private repositories across modules.

---

# 33. Recommended Build Dependency Graph

```mermaid
flowchart TD
    A[Architecture Freeze]
    B[Monorepo + Docker]
    C[Auth + Organization]
    D[Client + Scope]
    E[Core Entities]
    F[Events]
    G[Read-only UI]
    H[Tariffs]
    I[Charge Engine]
    J[Free-Time Engine]
    K[Risk Engine]
    L[Alerts]
    M[CSV Import]
    N[Internal Tasks]
    O[External Handoff]
    P[Manual Compliance Signals]
    Q[Historical Signals]
    R[Document Extraction]
    S[Analytics]
    T[NL Query]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    F --> H
    H --> I
    F --> J
    I --> K
    J --> K
    P --> K
    K --> L
    L --> N
    N --> O
    M --> F
    Q --> P
    R --> P
    S --> K
    T --> S
```

---

# 34. Critical Architecture Decisions Still Required

These should become ADRs (Architecture Decision Records).

## ADR-001 — Money representation

Decide:

```text
Decimal
or
integer minor units
```

and define rounding.

## ADR-002 — Tariff versioning

Decide:

```text
effective_from
effective_to
version
```

and behavior when historical calculations are reopened.

## ADR-003 — Event idempotency

Define a unique event identity.

## ADR-004 — Queue durability

Decide whether BullMQ alone is enough or whether PostgreSQL outbox is required.

## ADR-005 — File storage

Specify the object store and authorization mechanism.

## ADR-006 — Token storage

Define hashing, expiration, resend, revocation, replay.

## ADR-007 — RBAC

Define the exact roles and permissions.

## ADR-008 — Timezone

Define whether operational timestamps are:

```text
UTC in storage
+
explicit location timezone for business calculations
```

## ADR-009 — API pagination

Define list endpoint pagination before data volume grows.

## ADR-010 — AI provenance

Store:

```text
model/version
prompt/extraction schema version
confidence
timestamp
human correction
```

where appropriate.

---

# 35. Architecture Anti-Patterns

## Anti-pattern 1

```text
Express route
 ↓
Prisma
```

Reject.

## Anti-pattern 2

```text
BullMQ worker
 ↓
own charge calculation
```

Reject.

## Anti-pattern 3

```text
AI
 ↓
UPDATE containers
```

Reject.

## Anti-pattern 4

```text
Frontend
 ↓
client_id filter
 ↓
backend trusts it
```

Reject. The server must determine authorized scope.

## Anti-pattern 5

```text
DPD fallback
 ↓
overwrite mode
 ↓
lose transition history
```

Reject.

## Anti-pattern 6

```text
retry notification
 ↓
send duplicate confirmations
```

Reject unless explicitly deduplicated.

## Anti-pattern 7

```text
random float money calculations
```

Reject.

---

# 36. Final Architecture

The intended system should ultimately behave like this:

```text
                        ┌─────────────────────────┐
                        │       CHA USER          │
                        └────────────┬────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │       NEXT.JS WEB       │
                        │ client switcher         │
                        │ dashboard               │
                        │ containers              │
                        │ alerts/tasks             │
                        │ documents               │
                        └────────────┬────────────┘
                                     │
                              REST / OpenAPI
                                     │
                                     ▼
             ┌──────────────────────────────────────────┐
             │              EXPRESS API                  │
             │                                          │
             │ auth → scope → controller → service      │
             │                         │                 │
             │        ┌────────────────┼──────────────┐  │
             │        │                │              │  │
             │      Risk            Charges        Tasks │
             │        │                │              │  │
             │      Free-time       Tariffs       Handoff│
             │        │                │              │  │
             └────────┼────────────────┼──────────────┼──┘
                      │                │              │
                      └────────────────┼──────────────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │  PostgreSQL    │
                              │ SOURCE OF TRUTH│
                              └───────┬────────┘
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                         ▼                         ▼
                     Redis/BullMQ              Audit/Logs
                         │
                         ▼
                      Workers
                         │
             ┌───────────┴─────────────┐
             │                         │
             ▼                         ▼
        Python AI Service        External Notify
             │
       ┌─────┴──────────┐
       │                │
  Compliance        Extraction
    Signals
       │                │
       └───────┬────────┘
               ▼
       Advisory/staged output
               │
               ▼
        Express + Human Review
               │
               ▼
        PostgreSQL truth
```

# 37. Architectural Success Criteria

The architecture is successful when all of the following are true:

- a CHA can operate multiple clients from one organization;
- every tenant/client access is enforced server-side;
- container events are normalized and auditable;
- DPD/CFS transitions are historically represented;
- carrier and CFS charges can be calculated independently;
- two clocks can coexist correctly;
- risk remains deterministic;
- AI can improve signals without becoming mandatory;
- document extraction cannot silently corrupt authoritative state;
- an external trucker can complete one task without creating an account;
- retries do not create duplicate financial or operational side effects;
- every important financial number can be reconstructed;
- the system remains operational if the AI service is unavailable;
- v1 does not become a collection of disconnected AI demos.

