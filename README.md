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
- **PostgreSQL** 15+

## Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd app

# Install dependencies
pnpm install

# Copy environment variables and fill in values
cp .env.example .env.local

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build (includes type-check) |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run Vitest unit/integration tests |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:e2e` | Run Playwright end-to-end tests |

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
