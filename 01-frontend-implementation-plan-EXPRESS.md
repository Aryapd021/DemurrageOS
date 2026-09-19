# DemurrageOS — Frontend Implementation Plan
*(Part 1 of 4 — companion to 02-backend, 03-data-infrastructure-platform, 04-ai-differentiation-layer)*

Covers everything under `apps/web` in the Turborepo.

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Server components for list/detail views; client components only where interactivity is needed |
| Language | TypeScript (strict) | Types generated from the Express API's OpenAPI schema — never hand-duplicate DTOs |
| Styling | Tailwind + shadcn/ui | Lean on Table, Sheet, Badge, Tabs, Command (the last one reserved for the future NL-query bar) |
| Server state | TanStack Query | Every read/write goes through a query/mutation hook, never a raw `fetch` in a component |
| Charts | Recharts | Exposure trends, root-cause breakdowns |
| Maps | MapLibre | Yard/terminal position, CFS location relative to port |
| Forms | React Hook Form + Zod | Share Zod schemas with the backend's CSV validation layer where shapes overlap |

## 2. Information architecture — the part that changed

The original plan assumed one tenant = one company looking at its own containers. Since the product is now built around a CHA managing many clients, the nav has an extra level:

```
Organization (the CHA firm)
 └─ Client Switcher   ← NEW, sits above everything else
     ├─ Client A dashboard
     ├─ Client B dashboard
     └─ "All clients" rollup view   ← default landing view
```

Every list and dashboard screen needs a `client_id` filter that defaults to "all clients this user can see" and narrows to one. This touches every query hook, every table's column set (add a **Client** column when viewing "all"), and the alerts/tasks inbox, which now needs to show whose container an item belongs to.

## 3. Route structure

```
app/
├─ (auth)/
│   ├─ login/
│   └─ accept-invite/
├─ (app)/
│   ├─ layout.tsx              — client switcher lives in the top nav
│   ├─ dashboard/               — the "27 at risk, ₹18.4L exposure" rollup
│   ├─ clients/
│   │   ├─ page.tsx             — client list (NEW)
│   │   └─ [clientId]/          — single-client dashboard (NEW)
│   ├─ containers/
│   │   ├─ page.tsx             — filterable table, client column when "all"
│   │   └─ [containerId]/
│   │       ├─ page.tsx         — event timeline, charges, risk explainability
│   │       └─ documents/       — parsed DO / BOE / CFS gate-pass, see file 04
│   ├─ alerts/
│   ├─ tasks/
│   │   └─ [taskId]/            — includes the external-handoff state, §4.3
│   ├─ imports/
│   │   └─ new/                 — CSV staging wizard
│   ├─ analytics/               — root-cause, preventable exposure
│   └─ settings/
│       ├─ tariffs/
│       ├─ cfs-directory/       — NEW: CFS entities per port, see file 02
│       └─ users/
```

## 4. Core screens, in the order they matter

### 4.1 Container detail
The screen your original mockup already nailed. Keep the shape, add:
- A **delivery-mode badge**: `DPD_DIRECT` / `DPD_CFS` / `CFS`. If a container falls back from DPD to CFS mid-flow, surface that as a distinct, differently-colored timeline event — this is a demo-worthy moment, show it flip live.
- The risk explainability panel stays exactly as designed ("CRITICAL RISK / Why? / Recommended action"), but the "Customs Delay" bullet now names the specific compliance signal driving it (see file 04) instead of just "pending."

### 4.2 Client-scoped dashboard
Same layout as the org-wide dashboard, scoped down. Switching from "all clients" to one client and watching the numbers change instantly is what makes the CHA pitch real in a demo — "one shared record instead of three inboxes," made visible.

### 4.3 Task detail with external handoff
New UI. A task can be assigned to an internal user (existing pattern) or an **external contact** — a trucker, or a client's own staff with no login. For the external case, show a "Send confirmation link" action instead of an assignee dropdown. Keep it to the smallest possible surface for v1: one button, one status pill (`Sent` / `Confirmed` / `Overdue`). The confirmation page the external party sees is separate and unauthenticated — its contract is defined in file 04, §4.

### 4.4 CSV import wizard
Build exactly as originally specified: staging preview → row-level valid/warning/error counts → confirm → atomic insert. No changes needed — this part was already solid.

### 4.5 Document viewer
New, small: a side panel on the container detail page showing parsed documents (DO, Bill of Entry, CFS gate-pass) with extracted fields shown next to the original PDF, each field editable before acceptance. This is your original doc's Feature #4 human-in-the-loop requirement — don't skip the review step even in a demo.

## 5. Testing (Playwright)

1. Login → CSV ingestion → staging verification → risk detection → task assignment → resolution *(original)*
2. Client switcher: dashboard numbers change and the container list filters correctly *(new)*
3. External task handoff: assign to external contact → open the confirmation link in an incognito context → confirm → verify the task updates in the authenticated view *(new — this is the one to demo)*
4. Delivery-mode fallback: trigger a DPD→CFS event → confirm the timeline, badge, and risk score all update *(new)*

## 6. Build order

Follow the backend module order in file 02 — no point building the client switcher before the `Client` entity and scoped endpoints exist. Rough sequence: auth/shell → container list & detail (read-only) → dashboard → CSV import → alerts/tasks → client switcher → external handoff → document viewer.

## 7. Open decisions for you

- Does an external contact ever get a persistent login, or stay link-only forever? Link-only is far less work and matches v1 scope.
- Does a Client ever get a restricted login to see only their own containers? Good v2 feature — don't build it now, but the `client_id` scoping above means it costs almost nothing to add later.
