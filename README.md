# DemurrageOS - Complete Backend Implementation

DemurrageOS is a production-grade container demurrage management platform built with Express, PostgreSQL, and Python. This implementation provides a complete backend system for managing container logistics, financial calculations, compliance tracking, and risk assessment.

## Architecture Overview

The system follows a strict layered architecture:

```
Next.js Frontend
       ↓
Express API (REST/OpenAPI)
       ↓
Authentication & Authorization
       ↓
Controllers
       ↓
Application/Domain Services
       ↓
Repositories
       ↓
Prisma ORM
       ↓
PostgreSQL (Source of Truth)
```

Workers and async processing:
```
Express API
       ↓
BullMQ Job Queues
       ↓
Worker Processes
       ↓
Domain Services (reuse same as HTTP)
       ↓
PostgreSQL
```

## Key Principles

1. **PostgreSQL is the source of truth** - All authoritative state lives in the database
2. **Express is authoritative** - Only the API can modify state, never direct database access from frontend
3. **AI is advisory** - Machine learning provides compliance signals, not authoritative decisions
4. **Services are reusable** - Domain services are called identically from HTTP and workers
5. **Deterministic calculations** - All financial calculations are reproducible and auditable

## Core Features

### 1. Financial Engine

- **Deterministic charge calculation** - Uses Decimal arithmetic, never floating-point
- **Multi-tariff support** - Tariffs are versioned with effective date ranges
- **Two-clock model** - DPD and CFS clocks tracked independently
- **Delivery mode logic**:
  - `DPD_DIRECT`: Calculate from discharge date
  - `CFS`: Calculate from CFS gate-in date
  - `DPD_CFS`: Fallback logic with both clocks
- **Exposure calculation** - Current and projected exposure per container/client

### 2. Risk Engine

Calculates operational risk combining:
- Deadline urgency (days overdue)
- Financial exposure (current charges)
- Compliance signals (AI-derived)
- Operational uncertainty (fallback events)
- Client AEO/ACP status

Result: Risk score and level (LOW/MEDIUM/HIGH/CRITICAL)

### 3. Compliance Signals

Three signal types:
- **HS_CODE_NOVELTY**: Derived from historical client usage
- **VALUATION_CONSISTENCY**: Compared against historical patterns
- **AEO_ACP_STATUS**: Based on client certifications

Signals are advisory to the risk engine, not authoritative.

### 4. Task Management

- **Internal tasks**: Assigned to CHA users
- **External tasks**: Assigned to truckers/logistics partners
  - Generate high-entropy tokens
  - Hash tokens for storage
  - 72-hour expiry
  - Unauthenticated confirmation endpoint
  - Idempotent confirmation

### 5. Alert System

Automatic alert creation with deduplication:
- No duplicate alert for same container/type/severity
- Severity escalation when conditions worsen
- Re-alert only on material changes

### 6. Event System

Immutable append-only event log:
- Event idempotency via unique constraint
- Historical event preservation
- DPD→CFS fallback events remain visible
- Delivery mode transitions tracked

### 7. Worker Infrastructure

BullMQ-based job queue with:
- Idempotent job execution
- Automatic retries with exponential backoff
- Dead-letter handling
- Job state persistence

Worker jobs:
- `calculate-charges` - Recalculate financial charges
- `calculate-risk` - Recompute risk scores
- `derive-signals` - Derive compliance signals
- `check-alerts` - Evaluate alert conditions
- `process-document-extraction` - Process AI extraction results
- `send-notification` - Send task notifications

## Installation & Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Python 3.11+ (for AI service)

### Quick Start

1. **Clone and install**:
   ```bash
   cd demurrageos
   npm install
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Initialize database**:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development**:
   ```bash
   npm run dev  # Runs API, worker, and web concurrently
   ```

5. **Access the system**:
   - API: http://localhost:3000
   - Web: http://localhost:3001
   - Database: localhost:5432

### Docker

```bash
# Start all services
docker-compose up

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Clients
- `GET /api/v1/clients` - List clients
- `POST /api/v1/clients` - Create client
- `GET /api/v1/clients/:id` - Get client
- `PATCH /api/v1/clients/:id` - Update client

### Containers
- `GET /api/v1/containers` - List containers
- `POST /api/v1/containers` - Create container
- `GET /api/v1/containers/:id` - Get container detail
- `GET /api/v1/containers/:id/charges` - Get charges
- `POST /api/v1/containers/:id/charges/recalculate` - Recalculate charges
- `GET /api/v1/containers/:id/exposure` - Get exposure
- `GET /api/v1/containers/:id/risk` - Get risk
- `POST /api/v1/containers/:id/risk/recalculate` - Recalculate risk
- `GET /api/v1/containers/:id/signals` - Get compliance signals
- `POST /api/v1/containers/:id/signals/derive` - Derive signals
- `GET /api/v1/containers/:id/alerts` - Get alerts
- `POST /api/v1/containers/:id/alerts` - Create alert
- `GET /api/v1/containers/:id/tasks` - Get tasks
- `GET /api/v1/containers/:id/documents` - Get documents

### Tasks
- `POST /api/v1/tasks/:id/external-assign` - Assign external task
- `POST /api/v1/tasks/confirm/:token` - Confirm external task (unauthenticated)
- `GET /api/v1/tasks/:id` - Get task
- `PATCH /api/v1/tasks/:id` - Update task

### Masters
- `GET /api/v1/tariffs` - List tariffs
- `POST /api/v1/tariffs` - Create tariff
- `GET /api/v1/ports` - List ports
- `GET /api/v1/cfs` - List CFS

### Alerts
- `GET /api/v1/alerts` - List all alerts
- `PATCH /api/v1/alerts/:id/resolve` - Resolve alert

### Health
- `GET /health` - Service health
- `GET /ready` - Service readiness

## Database Schema

### Core Entities

**Organization** - CHA firm or logistics company
**User** - Team members with roles and permissions
**Client** - Importers/exporters with AEO/ACP status
**Shipment** - Group of containers
**Container** - Physical container with identity and state
**ContainerEvent** - Immutable event log per container
**Port** - Discharge/loading port
**CFS** - Container Freight Station
**Carrier** - Shipping line or DPD operator

### Financial

**Tariff** - Versioned rate card with effective dates
**Charge** - Individual charge calculation with provenance
**ComplianceSignal** - Advisory signals for risk assessment

### Operations

**Alert** - Automatically generated or manual alerts with deduplication
**Task** - Internal or external task assignments
**Notification** - Task notifications (email, SMS, WhatsApp)

### Documents & Audit

**Document** - Uploaded file metadata and storage reference
**DocumentExtraction** - AI extraction result with confidence
**AuditLog** - Immutable audit trail
**OutboxEvent** - Transactional outbox for reliable async work

## Database Migrations

Prisma migrations are version-controlled:

```bash
# Create migration
npx prisma migrate dev --name add_new_feature

# Deploy to production
npx prisma migrate deploy

# Review schema
npx prisma studio
```

## Seeding Demo Data

The seed script creates realistic data:

- 1 organization with 3 users (admin, ops, finance)
- 3 clients with different AEO/ACP status
- 100 containers with mixed delivery modes
- 500+ events with DPD→CFS fallback scenarios
- Charges, alerts, tasks, and compliance signals
- Complete demonstration flow

```bash
npm run db:seed
```

## Testing

### Unit Tests
```bash
npm run test -- services/financial/charge-calculation
```

### Integration Tests
```bash
npm run test -- routes/containers
```

### Watch Mode
```bash
npm run test:watch
```

## Authentication & Authorization

### Session Model

The API uses token-based authentication:

```
Header: Authorization: Bearer {userId}|{organizationId}
```

In production, use JWT with:
- RS256 asymmetric signing
- Short-lived access tokens (15 min)
- Refresh token rotation
- Revocation lists

### RBAC Roles

- **OWNER** - Full access, billing/account management
- **ADMIN** - All operational access
- **OPERATIONS** - Containers, tasks, alerts
- **CHA_USER** - Containers, documents
- **FINANCE** - Charges, analytics
- **VIEWER** - Read-only analytics/containers

### Client Scoping

Every protected query verifies:

1. User belongs to organization
2. Client belongs to organization
3. Container belongs to client

Never trust `clientId` from frontend.

## Financial Calculations

### Charge Types

1. **DEMURRAGE** - Daily charge after free time expires
2. **DETENTION** - Container holding at port/CFS
3. **STORAGE** - Long-term storage beyond free days
4. **GROUND_RENT** - CFS daily rental
5. **SHIFTING_CHARGE** - Container repositioning

### Two-Clock Model

```
DPD_DIRECT:
  Discharge → [Free Time] → Demurrage starts

CFS:
  Discharge → CFS Gate-In → [Free Time] → Ground Rent starts

DPD_CFS (with fallback):
  Discharge → [Day 1-5: Carrier clock] → DPD_TO_CFS_FALLBACK
  Fallback → CFS Gate-In → [CFS clock] → Ground Rent starts
  
  Carrier demurrage calculated from discharge
  CFS ground rent calculated from CFS gate-in
```

### Deterministic Calculation

Every charge includes:
- Calculation version
- Tariff version and effective dates
- Input parameters
- Rounding policy
- Calculation timestamp

This ensures reproducibility for audits and disputes.

## Worker Jobs

### Job Idempotency

Each job is idempotent via:

```typescript
interface Job {
  id: string;              // Deterministic job ID
  containerId: string;     // Primary key for idempotency
  timestamp: number;       // Operation timestamp
}
```

If a job is retried:
- Same calculation produces same result
- Duplicate charges are not created
- Duplicate alerts are not created
- Duplicate events are not created

### Job Failure Handling

- **Transient failures** (network) → Retry with backoff
- **Permanent failures** (validation) → Dead letter queue
- **Timeout** → Move to failed state after max attempts
- **Success** → Acknowledged and removed

## AI Service Integration

The Python AI service provides document extraction:

```
POST /extract
{
  "documentId": "doc-123",
  "fileUrl": "s3://bucket/doc.pdf",
  "documentType": "BOL"
}

Response:
{
  "extractedFields": { ... },
  "confidence": 0.87,
  "flaggedForReview": false,
  "provenance": { ... }
}
```

### Extraction Workflow

1. User uploads document → Document created
2. API queues extraction job
3. Worker calls AI service
4. Result stored in DocumentExtraction (advisory)
5. Human reviews extracted fields
6. Acceptance updates authoritative container state
7. Audit log records correction if needed

AI never modifies authoritative state directly.

## Observability

### Logging

Structured logs with Pino:

```json
{
  "level": "info",
  "requestId": "req-123",
  "userId": "user-456",
  "organizationId": "org-789",
  "action": "CREATE",
  "entityType": "Container",
  "duration": 145,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Monitoring

Track:
- API latency and errors
- Queue job processing time
- Financial calculation accuracy
- Alert creation rate
- Task confirmation rate
- Document extraction confidence

## Deployment

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing key
- `SESSION_SECRET` - Session encryption key

Optional:
- `AI_SERVICE_URL` - Python AI service URL
- `STORAGE_TYPE` - local or s3
- `NOTIFICATION_PROVIDER` - email, sms, mock
- `SENTRY_DSN` - Error tracking

### Production Checklist

- [ ] Use strong JWT secrets (min 32 bytes)
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for frontend domain
- [ ] Set up database backups
- [ ] Configure Redis persistence
- [ ] Enable query logging for audits
- [ ] Set up monitoring and alerts
- [ ] Configure auto-scaling for workers
- [ ] Enable database connection pooling
- [ ] Set up CDN for documents
- [ ] Configure rate limiting per API client
- [ ] Set up API versioning strategy

## Common Tasks

### Add a New Delivery Mode

1. Add to enum in Prisma schema
2. Update FreeTimeEngine calculation logic
3. Add tests for the new mode
4. Update charge calculation tests
5. Document the mode in README

### Add a New Charge Type

1. Add to Charge.chargeType enum
2. Implement calculation in ChargeCalculationService
3. Add alert rules if needed
4. Add test scenarios
5. Update API documentation

### Add a New Alert Type

1. Define AlertType
2. Add to alert creation logic
3. Implement deduplication logic
4. Add to RiskEngine or AlertService
5. Document alert semantics

## Support

For issues or questions:
1. Check existing Prisma schema
2. Review test cases
3. Check service layer documentation
4. Review audit logs for debugging

## License

Proprietary - DemurrageOS
