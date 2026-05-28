# SSH Admissions Management Web App

A bespoke admissions management system for St Stephen's House, Oxford — managing the full ordinand admissions lifecycle from enquiry through to confirmed ordinand status.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript strict mode)
- **Styling**: Tailwind CSS v4, shadcn/ui (New York style, CSS variables)
- **Icons**: Phosphor Icons
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **ORM**: Prisma v7 (PostgreSQL)
- **Auth**: Auth.js v5 (Microsoft Entra ID) — configured in F01
- **Document Storage**: Microsoft Graph (SharePoint/OneDrive) — configured in F05
- **Testing**: Vitest + Testing Library (unit/integration), Playwright (e2e)
- **Linting**: ESLint + Prettier

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **Docker Compose**

## Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd StephensAdmission

# Install dependencies
pnpm install

# Copy environment variables and fill in values
cp .env.example .env

# Start PostgreSQL
docker compose up -d

# Push the schema to your local database
pnpm db:push

# Seed local development data
pnpm db:seed

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Local Development Notes

- **Database**: `docker compose up -d` starts a local PostgreSQL 15 instance on `localhost:5432` using the credentials already shown in `.env.example`.
- **Authentication**: Local development can use the development login flow. Microsoft Entra ID credentials are only required if you want to exercise the real identity provider integration.
- **Document storage**: Microsoft Graph / SharePoint environment variables are only required for document-storage features.
- **Stopping PostgreSQL**: Run `docker compose down` to stop the local database.
- **Resetting local data**: Run `pnpm db:reset` to recreate the schema and reseed the database.

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Create a production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest unit/integration tests |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:e2e` | Run Playwright end-to-end tests |
| `pnpm db:push` | Push the Prisma schema to the configured database |
| `pnpm db:seed` | Seed the configured database with development data |
| `pnpm db:reset` | Reset the configured database and reseed it |

## Project Structure

```
src/
├── app/
│   ├── (staff)/          # Authenticated staff routes (layout with shell)
│   ├── (public)/         # Unauthenticated applicant-facing routes
│   ├── api/              # API routes (if needed beyond server actions)
│   ├── globals.css       # Tailwind + shadcn design tokens
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Root page
├── components/
│   └── ui/               # shadcn/ui primitives (Button, etc.)
├── generated/
│   └── prisma/           # Prisma generated client (gitignored)
├── lib/
│   ├── business-rules/   # Business rule utilities (gates, guards)
│   ├── constants/        # Enums, config values
│   ├── queries/          # Reusable Prisma queries
│   ├── services/         # External service integrations (Graph, CSV)
│   ├── validations/      # Zod schemas
│   ├── db.ts             # Prisma client singleton
│   └── utils.ts          # shadcn cn() utility
├── test/
│   └── setup.ts          # Vitest setup (jest-dom matchers)
└── __tests__/            # Global test files
prisma/
├── schema.prisma         # Database schema
└── migrations/           # Database migrations
e2e/
└── smoke.spec.ts         # Playwright smoke test
```

## Folder Conventions

- All imports use `@/` path alias mapped to `src/`.
- All server actions live in `actions.ts` files co-located with their route.
- All Zod schemas live in `src/lib/validations/`.
- All business rule utilities live in `src/lib/business-rules/`.

## Contributing

1. Create a feature branch from `main`.
2. Follow the spec-driven + TDD approach described in `features/README.md`.
3. Ensure `pnpm lint`, `pnpm test`, and `pnpm build` all pass.
4. Open a PR for review.
