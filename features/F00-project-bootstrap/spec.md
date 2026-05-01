# F00 — Project Bootstrap (Story Zero)

## Goal

Set up the complete Next.js monorepo skeleton with all shared dependencies, folder structure conventions, database connection, dev tooling, and CI — so that F01 onwards can focus purely on feature logic.

## Scope

### Frontend Stack

- Initialise Next.js 14+ (App Router) with TypeScript strict mode.
- Install and configure Tailwind CSS v3 with the project's design tokens.
- Install and configure shadcn/ui (New York style, CSS variables mode).
- Install Phosphor Icons (`@phosphor-icons/react`).
- Install React Hook Form + `@hookform/resolvers`.
- Install Zod for shared validation schemas.
- Install a charting library (`recharts`) for F07 dashboard.
- Set up the `src/` directory with App Router layout:
  - `src/app/(staff)/` — authenticated staff routes (layout with shell).
  - `src/app/(public)/` — unauthenticated applicant-facing routes.
  - `src/app/api/` — API routes (if needed beyond server actions).
  - `src/components/` — shared React components.
  - `src/components/ui/` — shadcn/ui primitives.
  - `src/lib/` — utilities, constants, services.
  - `src/lib/validations/` — Zod schemas.
  - `src/lib/business-rules/` — business rule utilities (gates, guards).
  - `src/lib/queries/` — reusable Prisma queries.
  - `src/lib/services/` — external service integrations (Graph, CSV).

### Backend Stack

- Install Prisma ORM (`prisma` + `@prisma/client`).
- Create the initial `prisma/schema.prisma` with the PostgreSQL datasource and generator.
- Define placeholder models: a minimal `User` model so that `prisma migrate dev` runs cleanly.
- Configure the database connection via `DATABASE_URL` environment variable.
- Install Auth.js v5 (`next-auth@beta`) + `@auth/prisma-adapter` (dependencies only — actual auth config is F01).
- Install `@microsoft/microsoft-graph-client` for future SharePoint integration (F05).

### Dev Tooling

- Configure ESLint (Next.js defaults + `@typescript-eslint`).
- Configure Prettier with consistent formatting rules.
- Install and configure Vitest for unit/integration testing.
- Install `@testing-library/react` and `@testing-library/jest-dom` for component tests.
- Install Playwright for end-to-end tests with a basic config.
- Create a `.env.example` file documenting all required environment variables.
- Create a `.env.local` template (gitignored).

### CI / DX

- Create a GitHub Actions workflow (`.github/workflows/ci.yml`) that:
  - Installs dependencies.
  - Runs `prisma generate`.
  - Runs ESLint.
  - Runs Vitest.
  - Runs `next build` (type-check + build verification).
- Add a `README.md` with:
  - Project overview.
  - Prerequisites (Node.js, pnpm, PostgreSQL).
  - Setup instructions.
  - Available scripts.

### Folder Conventions

- All imports use `@/` path alias mapped to `src/`.
- All server actions live in `actions.ts` files co-located with their route.
- All Zod schemas live in `src/lib/validations/`.
- All business rule utilities live in `src/lib/business-rules/`.

## Out of Scope

- Authentication configuration (F01).
- Any database models beyond the minimal `User` placeholder.
- Any UI beyond the bare Next.js root layout.
- Any feature logic.

## Acceptance Criteria

- [ ] `pnpm install` completes without errors.
- [ ] `pnpm dev` starts the Next.js dev server and renders the root page.
- [ ] `pnpm build` completes without TypeScript or build errors.
- [ ] `pnpm test` runs Vitest with at least one passing placeholder test.
- [ ] `pnpm lint` runs ESLint without errors.
- [ ] `npx prisma migrate dev` applies the initial migration to a local PostgreSQL database.
- [ ] `npx prisma generate` generates the Prisma client without errors.
- [ ] The `.env.example` file documents: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`, `MICROSOFT_GRAPH_CLIENT_ID`, `MICROSOFT_GRAPH_CLIENT_SECRET`, `MICROSOFT_GRAPH_TENANT_ID`, `SHAREPOINT_SITE_ID`.
- [ ] The `src/` directory structure matches the conventions above.
- [ ] The CI workflow runs successfully on push.
- [ ] shadcn/ui is initialised and at least one component (`Button`) is installed.
- [ ] Tailwind CSS utility classes render correctly.
- [ ] The `@/` import alias resolves correctly in both app code and tests.
