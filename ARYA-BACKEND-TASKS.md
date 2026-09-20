# DemurrageOS — Backend Implementation Guide
> **Assigned to:** Arya (Backend Lead)  
> **Service:** `apps/api` (Express + TypeScript + REST Endpoints + Multi-Tenant Auth)  
> **Date:** September 2024  
> **Reference Plan:** `Backend Implementation Plan` in Master Plan

---

## 📌 Executive Summary
Arya, you own the **Express API Application**. You write the application routes, controllers, auth middleware, and business logic. The frontend (Ansh) has already built the auth UI and client requests (`/api/auth/*`). Dhyan is setting up the PostgreSQL database (Supabase) and Prisma migrations, and Hari is building the Python AI engine.

Your job is to wire the incoming requests to Dhyan's database models, enforce JWT sessions via cookies, and make sure every query is strictly isolated by `orgId`.

---

## 1. Accounts You Need to Create & API Keys

### Resend (Transactional Email Delivery)
1. Go to **[https://resend.com](https://resend.com)** and sign in (GitHub or Google).
2. Go to **API Keys** -> click **"Create API Key"**.
   - Name: `demurrageos-backend`
   - Permissions: Full access
3. Copy the key (starts with `re_...`).
4. Put it in `apps/api/.env` as `RESEND_API_KEY`.
*(Note: In dev mode, Resend lets you send emails directly to your own registered email address with zero domain verification).*

---

## 2. Environment Configuration (`apps/api/.env`)

You share this file with Dhyan (who provides the `DATABASE_URL`):

```env
# Server Configuration
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3005

# Database (Provided by Dhyan from Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# JWT Auth Secret (Generate via: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
BETTER_AUTH_SECRET="f4d89a71b3e5c7a91280f3e6d19a4b2c8901e7654a32b10987654321fedcba09"
BETTER_AUTH_URL="http://localhost:3005"

# Resend Email Key (From Arya's Resend Account)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="onboarding@resend.dev"

# Internal Shared Key (For Hari's Python AI Service communication)
INTERNAL_SERVICE_KEY="demurrageos_internal_ai_token_secret_key_991"
```

---

## 3. Package Dependencies

In `apps/api`, install:

```bash
pnpm --filter @demurrageos/api add better-auth @prisma/client resend bcryptjs jsonwebtoken cookie-parser cors
pnpm --filter @demurrageos/api add -D @types/bcryptjs @types/jsonwebtoken @types/cookie-parser @types/cors
```

---

## 4. Endpoints You Must Implement (`apps/api/src/routes/auth.ts`)

The frontend (`apps/web/src/lib/auth/auth-client.ts`) connects to `http://localhost:8000/api/auth`:

### 1. `POST /api/auth/sign-up/email`
* **Input Payload:**
  ```json
  {
    "name": "Ansh Verma",
    "email": "ansh@mehtaoverseas.in",
    "password": "SecurePassword123",
    "orgName": "Mehta Overseas Pvt Ltd"
  }
  ```
* **Logic:**
  1. Hash password with bcrypt (10 rounds).
  2. Use Prisma transaction (models provided by Dhyan):
     - Create `Organization` with `name = orgName`.
     - Create `User` with `role = "OWNER"`, `orgId = org.id`, `passwordHash`.
  3. Send verification email via Resend with a 6-digit OTP or link.
  4. Generate signed JWT token containing `{ userId, orgId, role }`.
  5. Set HTTP-only cookie `better-auth.session_token` on the response (`httpOnly: true`, `sameSite: 'lax'`, `path: '/'`).
* **Response:**
  ```json
  {
    "user": {
      "id": "usr_...",
      "name": "Ansh Verma",
      "email": "ansh@mehtaoverseas.in",
      "role": "OWNER",
      "orgId": "org_...",
      "orgName": "Mehta Overseas Pvt Ltd",
      "emailVerified": false
    },
    "expiresAt": "2024-09-27T12:00:00.000Z"
  }
  ```

---

### 2. `POST /api/auth/sign-in/email`
* **Input Payload:**
  ```json
  {
    "email": "ansh@mehtaoverseas.in",
    "password": "SecurePassword123"
  }
  ```
* **Logic:**
  1. Find user by `email` including `organization`.
  2. Verify password with `bcrypt.compare`.
  3. Sign JWT session token.
  4. Set `better-auth.session_token` cookie.
* **Response:** Return same session object as sign-up.

---

### 3. `POST /api/auth/sign-out`
* **Logic:** Clear `better-auth.session_token` cookie.
* **Response:** `{ "success": true }`

---

### 4. `GET /api/auth/get-session`
* **Logic:** Read `better-auth.session_token` cookie, verify JWT, query user & org from DB.
* **Response:** Active session or 401 if invalid/expired.

---

## 5. Security & Authorization Middleware (`apps/api/src/middleware/auth.ts`)

Every operational route must verify the JWT and inject `req.user`:

```typescript
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    orgId: string;
    role: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies["better-auth.session_token"] || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, process.env.BETTER_AUTH_SECRET!) as any;
    req.user = {
      id: payload.userId,
      orgId: payload.orgId,
      role: payload.role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}
```

### 🔒 Enforce Multi-Tenant Isolation:
```typescript
// Always query with orgId scoping:
router.get("/containers", requireAuth, async (req: AuthenticatedRequest, res) => {
  const containers = await prisma.container.findMany({
    where: { orgId: req.user!.orgId }, // 👈 No CHA ever sees another CHA's shipments
  });
  res.json(containers);
});
```

---

## 6. Public Route Exception (Truck Drivers)
The truck driver pickup confirmation page must **NOT** use `requireAuth`:
* `GET /api/confirm/:token` -> **Public**
* `POST /api/confirm/:token` -> **Public**

---

## 7. Arya's Checklist
- [ ] Create Resend account & get `RESEND_API_KEY`.
- [ ] Obtain `DATABASE_URL` from Dhyan and add to `apps/api/.env`.
- [ ] Implement `/api/auth/sign-up/email`, `/sign-in/email`, `/sign-out`, `/get-session`.
- [ ] Apply `requireAuth` middleware with `orgId` filtering across containers, clients, and alerts.
- [ ] Run server with `pnpm --filter @demurrageos/api dev` on Port 8000.
