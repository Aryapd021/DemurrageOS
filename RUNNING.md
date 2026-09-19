# Running DemurrageOS

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Python 3.11+ (optional, for AI service)

## Local Development Setup

### 1. Clone and Install

```bash
cd demurrageos
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:

```env
NODE_ENV=development
DATABASE_URL="postgresql://demurrage:password@localhost:5432/demurrageos"
REDIS_URL="redis://localhost:6379"
PORT=3000
JWT_SECRET="dev-secret-change-in-production"
SESSION_SECRET="dev-session-secret-change-in-production"
AI_SERVICE_URL="http://localhost:5000"
NOTIFICATION_PROVIDER="mock"
LOG_LEVEL="info"
```

### 3. Database Setup

```bash
# Create database
createdb -U postgres -h localhost demurrageos

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

### 4. Start Services

**Option A: Using Docker Compose (Recommended)**

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on 5432
- Redis on 6379
- API on 3000
- Worker process
- AI service on 5000

Check status:
```bash
docker-compose logs -f api
docker-compose ps
```

**Option B: Manual Local Start**

Terminal 1 - API Server:
```bash
npm run dev
# API runs on http://localhost:3000
```

Terminal 2 - Worker Process:
```bash
npm run -w @demurrageos/api worker
```

Terminal 3 - AI Service (Python):
```bash
cd apps/ai-service
pip install -r requirements.txt
python -m app.main
# Runs on http://localhost:5000
```

## API Access

### Health Check

```bash
curl http://localhost:3000/health
# Response: { "status": "ok" }

curl http://localhost:3000/ready
# Response: { "status": "ready" }
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@demurrageos.local"}'

# Response includes token
{
  "data": {
    "user": { "id": "...", "email": "admin@demurrageos.local", ... },
    "token": "user-id|org-id"
  }
}
```

### Use Token

All authenticated requests need the token:

```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:3000/api/v1/clients
```

## Database

### Access PostgreSQL

```bash
psql -U demurrage -h localhost demurrageos

# Common queries:
SELECT * FROM organizations;
SELECT * FROM clients;
SELECT * FROM containers;
SELECT * FROM charges;
SELECT * FROM alerts;
```

### Prisma Studio

```bash
npm run -w @demurrageos/api db:studio
# Opens web UI at http://localhost:5555
```

### Reset Database

```bash
npm run db:reset
# Deletes all data and re-runs migrations and seed
```

## Testing

### Run Tests

```bash
npm run test
```

### Run Specific Test Suite

```bash
npm run test -- api.test
npm run test -- financial.test
```

### Watch Mode

```bash
npm run test:watch
```

## Common Workflows

### Create a Container

```bash
# 1. Get auth token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@demurrageos.local"}' | jq -r '.data.token')

# 2. Get a client ID
CLIENT_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/clients | jq -r '.data[0].id')

# 3. Create container
curl -X POST http://localhost:3000/api/v1/containers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "'$CLIENT_ID'",
    "containerNo": "CONT12345678",
    "containerType": "20FT",
    "deliveryMode": "CFS",
    "dischargeDate": "2025-01-15T00:00:00Z"
  }'
```

### Calculate Charges

```bash
CONTAINER_ID="..."
curl -X POST http://localhost:3000/api/v1/containers/$CONTAINER_ID/charges/recalculate \
  -H "Authorization: Bearer $TOKEN"
```

### Get Container Risk

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/containers/$CONTAINER_ID/risk
```

### Assign External Task

```bash
curl -X POST http://localhost:3000/api/v1/tasks/$TASK_ID/external-assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "externalName": "Transport Provider",
    "externalEmail": "trucker@example.com",
    "externalPhone": "+91-9876543210"
  }'

# Response includes confirmationUrl with token
# External party can confirm without login:
curl -X POST http://localhost:3000/api/v1/tasks/confirm/{token}
```

## Troubleshooting

### Database Connection Failed

Check:
1. PostgreSQL is running: `psql -U postgres`
2. Database exists: `psql -U postgres -l | grep demurrageos`
3. Connection string in `.env`: `DATABASE_URL`

### Redis Connection Failed

Check:
1. Redis is running: `redis-cli ping`
2. Redis URL in `.env`: `REDIS_URL`

### Port Already in Use

Change port in `.env`:
```env
PORT=3001
```

Then restart API.

### Migration Failed

Reset and re-run:
```bash
npm run db:reset
```

### Tests Failing

1. Ensure database is clean: `npm run db:reset`
2. Run tests in isolation: `npm run test -- specific.test`
3. Check logs: `npm run test -- --reporter=verbose`

## Logs

### View API Logs

```bash
# Docker
docker-compose logs -f api

# Local
npm run dev  # logs to console
```

### View Worker Logs

```bash
docker-compose logs -f worker
```

### View Request ID

All logs include `requestId` for request tracing:
```json
{
  "requestId": "req-abc123",
  "action": "CREATE",
  "entityType": "Container",
  ...
}
```

Use this to trace a request through API and worker.

## Next Steps

1. **Access the API**: http://localhost:3000
2. **View database**: `npm run db:studio`
3. **Run tests**: `npm run test`
4. **Check logs**: `docker-compose logs -f`
5. **Create containers**: Use API endpoints above
6. **View dashboard**: See `GET /api/v1/dashboard` endpoint

## Production Deployment

For production:

1. Update `.env` with real secrets
2. Use strong JWT secrets (min 32 bytes)
3. Enable HTTPS/TLS
4. Configure database backups
5. Set up monitoring (Sentry, DataDog, etc.)
6. Configure auto-scaling
7. Use connection pooling
8. Enable query logging
9. Set up CDN for documents

See README.md for more details.
