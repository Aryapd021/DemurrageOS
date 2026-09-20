# DemurrageOS — Master Team Roles & API Keys Guide
> **Monorepo:** DemurrageOS  
> **Team:** Ansh (Frontend), Arya (Backend), Dhyan (Data & Infra), Hari (AI Engine)  
> **Date:** September 2024

---

## 👥 Master Team Responsibilities & Ownership

```
                                TEAM ARCHITECTURE ROLES
                                =======================

 ┌───────────────────────────────────────┐         ┌───────────────────────────────────────┐
 │          ANSH (Frontend Lead)         │         │          ARYA (Backend Lead)          │
 ├───────────────────────────────────────┤         ├───────────────────────────────────────┤
 │ • Directory: apps/web                 │         │ • Directory: apps/api                 │
 │ • Tech: Next.js 14, Tailwind, Query   │         │ • Tech: Node.js, Express, TypeScript  │
 │ • Domain: UI, Auth Forms, Terms Modal,│         │ • Domain: REST API, Auth Endpoints,   │
 │   Trucker Link, Client State          │         │   JWT Middleware, Org Scoping         │
 │ • Guide: ANSH-FRONTEND-TASKS.md       │         │ • Guide: ARYA-BACKEND-TASKS.md        │
 └───────────────────────────────────────┘         └───────────────────────────────────────┘
                     ▲                                                 ▲
                     │ (HTTP / Session Cookie)                         │ (Prisma Client)
                     ▼                                                 ▼
 ┌───────────────────────────────────────┐         ┌───────────────────────────────────────┐
 │       HARI (AI Engine Lead)           │         │     DHYAN (Data & Infra Lead)         │
 ├───────────────────────────────────────┤         ├───────────────────────────────────────┤
 │ • Directory: apps/ai-service          │         │ • Directory: prisma/, docker-compose  │
 │ • Tech: Python, FastAPI, Gemini API,  │         │ • Tech: PostgreSQL, Supabase, Redis,  │
 │   LangChain, ChromaDB                 │         │   BullMQ, Docker Compose              │
 │ • Domain: Document OCR (BoE / e-DO),  │         │ • Domain: Database Provisioning,      │
 │   Risk Scoring Engine, Vector Tariffs │         │   Prisma Schema, Migrations, Queues   │
 │ • Guide: HARI-AI-ENGINE-TASKS.md      │         │ • Guide: DHYAN-DATA-AND-INFRA-TASKS.md│
 └───────────────────────────────────────┘         └───────────────────────────────────────┘
```

---

## 🔑 Accounts to Create & API Keys Assignment

| Member | Service / Account to Make | Key / Variable Name | Where Key Goes |
|---|---|---|---|
| **Dhyan** *(Data & Infra)* | **[Supabase](https://supabase.com)** (Free PostgreSQL Database) | `DATABASE_URL` | `apps/api/.env` *(Share with Arya)* |
| **Arya** *(Backend)* | **[Resend](https://resend.com)** (Free Transactional Email API) | `RESEND_API_KEY`<br>`BETTER_AUTH_SECRET` | `apps/api/.env` |
| **Hari** *(AI Engine)* | **[Google AI Studio](https://aistudio.google.com)** (Free Gemini 1.5 Flash API) | `GEMINI_API_KEY` | `apps/ai-service/.env` |
| **Ansh** *(Frontend)* | **None needed for auth!** *(Optional Vercel for hosting)* | `NEXT_PUBLIC_API_URL` | `apps/web/.env.local` |

---

## 📋 Individual Documentation Files Created

Each teammate has their own comprehensive, dedicated guide in the repository root:

1. 📄 **[`ARYA-BACKEND-TASKS.md`](file:///c:/Users/anshv/OneDrive/Desktop/Demmurage/ARYA-BACKEND-TASKS.md)**
   * Express API setup
   * `/api/auth/*` endpoints (sign-up, sign-in, sign-out, session)
   * Multi-tenant `orgId` security middleware
   * Public route exceptions for truck drivers (`/api/confirm/:token`)

2. 📄 **[`DHYAN-DATA-AND-INFRA-TASKS.md`](file:///c:/Users/anshv/OneDrive/Desktop/Demmurage/DHYAN-DATA-AND-INFRA-TASKS.md)**
   * Supabase PostgreSQL setup
   * Authoritative multi-tenant Prisma schema (`Organization`, `User`, `Invite`, `Container`, `Client`)
   * Database migration workflow (`prisma migrate dev`)
   * Docker Compose and Redis / BullMQ queue infrastructure

3. 📄 **[`HARI-AI-ENGINE-TASKS.md`](file:///c:/Users/anshv/OneDrive/Desktop/Demmurage/HARI-AI-ENGINE-TASKS.md)**
   * Python FastAPI service setup
   * Google AI Studio Gemini API integration
   * Document OCR field extraction (e-DO & BoE) with confidence scores
   * Predictive Risk Calculation (0-100 score & DPD fallback probability)
   * Multi-tenant ChromaDB tariff vector search (`where={"org_id": org_id}`)

4. 📄 **[`ANSH-FRONTEND-TASKS.md`](file:///c:/Users/anshv/OneDrive/Desktop/Demmurage/ANSH-FRONTEND-TASKS.md)**
   * Completed status of all 20+ routes
   * Interactive Terms & Privacy modal viewer
   * Route protection middleware and instant demo access
   * Integration contracts with Arya, Dhyan, and Hari
