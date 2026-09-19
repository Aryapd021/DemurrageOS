# File Structure

```
demurrageos/
├── apps/
│   ├── api/                          # Express backend
│   │   ├── src/
│   │   │   ├── app.ts               # Express app factory
│   │   │   ├── server.ts            # Server entry point
│   │   │   ├── worker.ts            # Worker entry point
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── env.ts           # Environment validation
│   │   │   │   ├── logger.ts        # Pino logger
│   │   │   │   ├── database.ts      # Prisma client
│   │   │   │   └── redis.ts         # Redis client
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts          # Auth & org scope middleware
│   │   │   │   ├── request-context.ts # Request ID & logging
│   │   │   │   └── validation.ts    # Input validation
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── errors.ts        # Custom error types
│   │   │   │   ├── http.ts          # HTTP response helpers
│   │   │   │   └── money.ts         # Money arithmetic utilities
│   │   │   │
│   │   │   ├── repositories/        # Database access layer
│   │   │   │   └── index.ts         # All repositories
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── auth/           # Authentication service
│   │   │   │   ├── financial/      # Charge & tariff services
│   │   │   │   │   └── charge-calculation.ts
│   │   │   │   ├── risk/           # Risk & compliance
│   │   │   │   │   └── risk-engine.ts
│   │   │   │   ├── alert/          # Alert service
│   │   │   │   └── task/           # Task service
│   │   │   │
│   │   │   ├── routes/             # API endpoints
│   │   │   │   ├── index.ts        # Auth & health
│   │   │   │   ├── clients.ts      # Client CRUD
│   │   │   │   ├── containers.ts   # Container CRUD
│   │   │   │   ├── charges.ts      # Charge calculation
│   │   │   │   ├── tasks.ts        # Task management
│   │   │   │   ├── risk.ts         # Risk & signals
│   │   │   │   ├── masters.ts      # Master data
│   │   │   │   └── alerts.ts       # Alert management
│   │   │   │
│   │   │   └── jobs/               # Worker infrastructure
│   │   │       └── queues.ts       # BullMQ setup
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Database schema
│   │   │   ├── seed.ts             # Seed script
│   │   │   └── migrations/         # Version-controlled migrations
│   │   │
│   │   ├── tests/                  # Test files
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ai-service/                 # Python Flask service
│   │   ├── app/
│   │   │   └── main.py            # Flask app
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── .gitignore
│   │
│   └── web/                        # Next.js frontend (existing)
│
├── packages/
│   ├── shared-types/               # Shared TypeScript types
│   └── config/                     # Shared config
│
├── docker-compose.yml              # Local development stack
├── .env.example                    # Environment template
├── .eslintrc.json                  # Linting rules
├── .prettierrc                     # Code formatting
├── .gitignore
├── turbo.json                      # Turbo configuration
├── tsconfig.json                   # Root TypeScript config
├── package.json                    # Root workspace
└── README.md                       # This file
```

## Key Files

- **apps/api/src/app.ts** - Express app with all routes and middleware
- **apps/api/src/services/financial/charge-calculation.ts** - Financial engine
- **apps/api/src/services/risk/risk-engine.ts** - Risk calculation
- **apps/api/src/repositories/index.ts** - All data access
- **apps/api/src/jobs/queues.ts** - Worker configuration
- **apps/api/prisma/schema.prisma** - Complete database schema
- **apps/api/prisma/seed.ts** - Demo data generation
