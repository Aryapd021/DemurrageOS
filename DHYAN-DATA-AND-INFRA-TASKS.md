# DemurrageOS — Data, Infrastructure & Platform Guide
> **Assigned to:** Dhyan (Data & Infrastructure Lead)  
> **Service:** `prisma/`, `docker-compose.yml`, Database & Asynchronous Queues (Redis / BullMQ)  
> **Date:** September 2024  
> **Reference Plan:** `Data, Infrastructure & Platform Plan` in Master Plan

---

## 📌 Executive Summary
Dhyan, you own the **Data Platform, Database, and Infrastructure**. Your mission is to provision the PostgreSQL database on Supabase, maintain the authoritative Prisma schema, execute database migrations, configure Redis & BullMQ for asynchronous queue jobs (like notification alerts and document parsing queues), and manage the Docker setup.

---

## 1. Account You Need to Create & Credentials

### Supabase (Hosted PostgreSQL Database — Free Tier)
1. Go to **[https://supabase.com](https://supabase.com)** and sign in with GitHub.
2. Click **"New Project"**.
   - Project Name: `demurrageos-db`
   - Database Password: *(Save this password securely)*
   - Region: `ap-south-1` (Mumbai) or closest available.
3. Once the database is ready:
   - Go to **Project Settings** (gear icon) -> **Database**.
   - Under **Connection string**, select **URI**.
   - Replace `[YOUR-PASSWORD]` with your actual password.
4. Copy the connection string (`postgresql://postgres...:5432/postgres`).
5. **Share this `DATABASE_URL` with Arya** so she can run the Express API.

---

## 2. Environment Configuration (`apps/api/.env`)

You and Arya maintain `apps/api/.env`. Ensure your database credentials are added:

```env
# Database Connection (from your Supabase dashboard)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# Redis Queue Connection (Local Docker or Upstash)
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
```

---

## 3. Authoritative Multi-Tenant Prisma Schema (`apps/api/prisma/schema.prisma`)

You own this file. Ensure it includes the multi-tenant Organization, User, and Invite models alongside the Container and Tariff entities:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  OWNER
  ADMIN
  OPERATOR
  VIEWER
}

enum DeliveryMode {
  DPD_DIRECT
  DPD_CFS
  CFS
}

enum ContainerStatus {
  ON_TRACK
  WARNING
  CRITICAL
  RESOLVED
}

model Organization {
  id         String      @id @default(cuid())
  name       String
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  users      User[]
  clients    Client[]
  containers Container[]
  invites    Invite[]
}

model User {
  id            String       @id @default(cuid())
  email         String       @unique
  name          String
  passwordHash  String
  role          UserRole     @default(OPERATOR)
  emailVerified Boolean      @default(false)
  orgId         String
  organization  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([orgId])
  @@index([email])
}

model Invite {
  id           String       @id @default(cuid())
  email        String
  orgId        String
  role         UserRole     @default(OPERATOR)
  token        String       @unique
  expiresAt    DateTime
  createdAt    DateTime     @default(now())
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId])
}

model Client {
  id           String       @id @default(cuid())
  name         String
  iecNumber    String
  contactEmail String
  orgId        String
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  containers   Container[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  @@index([orgId])
}

model Container {
  id                 String          @id @default(cuid())
  containerNumber    String
  blNumber           String
  shippingLine       String
  portCode           String
  deliveryMode       DeliveryMode    @default(DPD_DIRECT)
  status             ContainerStatus @default(ON_TRACK)
  dischargeDate      DateTime
  freeDaysAllowed    Int
  demurrageRatePerDay Float
  cfsName            String?
  cfsRatePerDay      Float?
  orgId              String
  clientId           String
  organization       Organization    @relation(fields: [orgId], references: [id], onDelete: Cascade)
  client             Client          @relation(fields: [clientId], references: [id], onDelete: Cascade)
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  @@index([orgId])
  @@index([clientId])
  @@index([containerNumber])
}
```

---

## 4. Database Migrations Workflow

Whenever you change the schema, run:

```bash
# Apply migrations to your Supabase PostgreSQL instance
pnpm --filter @demurrageos/api exec prisma migrate dev --name update-models

# Generate typed Prisma client
pnpm --filter @demurrageos/api exec prisma generate
```

---

## 5. Local Infrastructure (`docker-compose.yml`)

You manage `docker-compose.yml` for local dependencies (Redis for queues):

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: demurrageos-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: always

volumes:
  redis_data:
```

Start local Redis via:
```bash
docker compose up -d redis
```

---

## 6. BullMQ Queue Infrastructure (`apps/api/src/queues/`)

Set up the queue connection so Arya and Hari can enqueue jobs (e.g. document extraction, notification alerts):

```typescript
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

export const documentQueue = new Queue('document-extraction', { connection });
export const alertQueue = new Queue('demurrage-alerts', { connection });
```

---

## 7. Dhyan's Checklist
- [ ] Create Supabase project & extract `DATABASE_URL`.
- [ ] Send `DATABASE_URL` to Arya.
- [ ] Apply initial Prisma migrations with `prisma migrate dev`.
- [ ] Spin up Redis on Docker (`docker compose up -d redis`).
- [ ] Verify database indexes (`orgId`, `clientId`, `containerNumber`).
