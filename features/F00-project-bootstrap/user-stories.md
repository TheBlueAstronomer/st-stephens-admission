# F00 — Project Bootstrap: User Stories

> Story Zero — infrastructure-only stories that establish the codebase before any feature work begins.
> These stories have no end-user-facing functionality; their "user" is the development team.

---

## US-01: Initialise Next.js Application

**As a** developer
**I want** a working Next.js 14+ App Router project with TypeScript strict mode
**So that** I have a runnable application skeleton to build features on

### TDD Focus
- **Test**: Run `pnpm dev`; assert the dev server starts and the root page returns HTTP 200.
- **Test**: Run `pnpm build`; assert it completes with zero TypeScript errors.

### Acceptance Criteria
- [ ] Next.js 14+ is initialised with App Router and TypeScript (`strict: true` in `tsconfig.json`).
- [ ] `pnpm dev` starts the dev server and renders a root page.
- [ ] `pnpm build` completes without errors.
- [ ] The `src/` directory is the source root with `@/` path alias configured in `tsconfig.json`.

### Implementation Steps
1. **Run `npx create-next-app@latest`** — select TypeScript, ESLint, Tailwind CSS, `src/` directory, App Router, and `@/` import alias. Use `pnpm` as the package manager.
2. **Enable strict mode** — verify `tsconfig.json` has `"strict": true`.
3. **Create the App Router layout structure**:
   - `src/app/layout.tsx` — root layout with `<html>`, `<body>`, font imports.
   - `src/app/page.tsx` — minimal placeholder page ("SSH Admissions — Setup Complete").
   - `src/app/(staff)/layout.tsx` — empty layout placeholder for authenticated staff routes.
   - `src/app/(public)/layout.tsx` — empty layout placeholder for public applicant routes.
4. **Verify** — `pnpm dev` returns 200 on `localhost:3000`, `pnpm build` exits 0.

---

## US-02: Install and Configure Tailwind CSS and shadcn/ui

**As a** developer
**I want** Tailwind CSS and shadcn/ui installed with the project's design system tokens
**So that** all features can use consistent, pre-built UI components

### TDD Focus
- **Test**: Create a test component using a Tailwind utility class (`bg-primary`); render it; assert the class is applied.
- **Test**: Import and render a shadcn `Button`; assert it renders without errors.

### Acceptance Criteria
- [ ] Tailwind CSS v3 is configured and utility classes render correctly.
- [ ] shadcn/ui is initialised (New York style, CSS variables mode).
- [ ] At least one shadcn component (`Button`) is installed and importable from `@/components/ui/button`.
- [ ] CSS variables for the design system (primary, secondary, muted, etc.) are defined in `globals.css`.

### Implementation Steps
1. **Tailwind should already be installed** by `create-next-app`. Verify `tailwind.config.ts` exists and `content` paths include `src/**/*.{ts,tsx}`.
2. **Initialise shadcn/ui** — run `npx shadcn@latest init`. Select: New York style, CSS variables, `@/components` alias, `@/lib/utils` for `cn()`.
3. **Install the `Button` component** — `npx shadcn@latest add button`.
4. **Verify CSS variables** — check `src/app/globals.css` has `:root` and `.dark` variable blocks.
5. **Write a smoke test** — create `src/components/ui/__tests__/button.test.tsx`, render `<Button>`, assert it's in the document.

---

## US-03: Install Shared Frontend Dependencies

**As a** developer
**I want** all shared frontend libraries installed and importable
**So that** feature development can begin without dependency setup delays

### TDD Focus
- **Test**: Import `useForm` from `react-hook-form`; assert it is defined.
- **Test**: Import `z` from `zod`; assert `z.string()` returns a schema.
- **Test**: Import a Phosphor icon; assert it renders.

### Acceptance Criteria
- [ ] `react-hook-form` and `@hookform/resolvers` are installed.
- [ ] `zod` is installed.
- [ ] `@phosphor-icons/react` is installed.
- [ ] `recharts` is installed.
- [ ] All packages are importable without errors.

### Implementation Steps
1. **Install packages** — `pnpm add react-hook-form @hookform/resolvers zod @phosphor-icons/react recharts`.
2. **Verify imports** — create a temporary test file that imports from each package and asserts they are defined.
3. **Remove temporary test file** after verification (or keep as a dependency smoke test).

---

## US-04: Install and Configure Prisma ORM

**As a** developer
**I want** Prisma ORM initialised with a PostgreSQL datasource and a placeholder migration
**So that** feature stories can define models and run migrations immediately

### TDD Focus
- **Test**: Run `npx prisma generate`; assert it completes without errors.
- **Test**: Run `npx prisma migrate dev`; assert it applies the initial migration to a local PostgreSQL database.

### Acceptance Criteria
- [ ] `prisma` and `@prisma/client` are installed.
- [ ] `prisma/schema.prisma` exists with `provider = "postgresql"` and `DATABASE_URL` from env.
- [ ] A minimal `User` model exists so that the first migration is not empty.
- [ ] `npx prisma migrate dev --name init` creates the initial migration without errors.
- [ ] `npx prisma generate` generates the client.
- [ ] A `src/lib/db.ts` file exports a singleton `PrismaClient` instance (with global caching for dev hot-reload).

### Implementation Steps
1. **Install Prisma** — `pnpm add -D prisma && pnpm add @prisma/client`.
2. **Initialise Prisma** — `npx prisma init --datasource-provider postgresql`.
3. **Define a placeholder `User` model** in `prisma/schema.prisma`:
   ```prisma
   model User {
     id        String   @id @default(cuid())
     name      String
     email     String   @unique
     role      String   @default("ADMISSIONS_STAFF")
     isActive  Boolean  @default(true)
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```
4. **Create `src/lib/db.ts`** — singleton PrismaClient with `globalThis` caching for dev mode.
5. **Add `DATABASE_URL` to `.env.example`** and `.env.local` (gitignored).
6. **Run `npx prisma migrate dev --name init`** — verify migration applies.

---

## US-05: Install Auth.js and Microsoft Graph Dependencies

**As a** developer
**I want** Auth.js v5 and Microsoft Graph client packages installed
**So that** F01 (authentication) and F05 (document storage) can be implemented without additional dependency setup

### TDD Focus
- **Test**: Import `NextAuth` from `next-auth`; assert it is a function.
- **Test**: Import `Client` from `@microsoft/microsoft-graph-client`; assert it is defined.

### Acceptance Criteria
- [ ] `next-auth@beta` (Auth.js v5) is installed.
- [ ] `@auth/prisma-adapter` is installed.
- [ ] `@microsoft/microsoft-graph-client` is installed.
- [ ] All packages are importable.
- [ ] Auth-related env vars are documented in `.env.example`.

### Implementation Steps
1. **Install Auth.js** — `pnpm add next-auth@beta @auth/prisma-adapter`.
2. **Install Graph client** — `pnpm add @microsoft/microsoft-graph-client`.
3. **Add env vars to `.env.example`** — `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`, `MICROSOFT_GRAPH_CLIENT_ID`, `MICROSOFT_GRAPH_CLIENT_SECRET`, `MICROSOFT_GRAPH_TENANT_ID`, `SHAREPOINT_SITE_ID`.
4. **Verify imports** — create a quick import test.

---

## US-06: Configure Dev Tooling — ESLint, Prettier, Testing

**As a** developer
**I want** ESLint, Prettier, Vitest, Testing Library, and Playwright configured
**So that** code quality and testing infrastructure are ready from day one

### TDD Focus
- **Test**: Run `pnpm lint`; assert it completes without errors.
- **Test**: Run `pnpm test`; assert Vitest runs and at least one placeholder test passes.

### Acceptance Criteria
- [ ] ESLint is configured (Next.js defaults + `@typescript-eslint`).
- [ ] Prettier is configured with a `.prettierrc` file.
- [ ] Vitest is installed and configured (`vitest.config.ts`).
- [ ] `@testing-library/react` and `@testing-library/jest-dom` are installed.
- [ ] Playwright is installed with a `playwright.config.ts`.
- [ ] `pnpm lint` runs without errors.
- [ ] `pnpm test` runs Vitest with at least one passing test.
- [ ] `pnpm test:e2e` runs Playwright (with a placeholder spec).

### Implementation Steps
1. **Configure ESLint** — ensure `.eslintrc.json` extends `next/core-web-vitals` and `@typescript-eslint/recommended`.
2. **Install Prettier** — `pnpm add -D prettier eslint-config-prettier`. Create `.prettierrc` with: `{ "semi": true, "singleQuote": true, "trailingComma": "es5", "tabWidth": 2, "printWidth": 100 }`.
3. **Install Vitest** — `pnpm add -D vitest @vitejs/plugin-react jsdom`. Create `vitest.config.ts` with React plugin, jsdom environment, and `@/` alias resolution.
4. **Install Testing Library** — `pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event`.
5. **Create a placeholder test** — `src/__tests__/setup.test.ts` that asserts `1 + 1 === 2`.
6. **Install Playwright** — `pnpm add -D @playwright/test`. Run `npx playwright install`. Create `playwright.config.ts` and a placeholder e2e test at `e2e/smoke.spec.ts`.
7. **Add scripts to `package.json`**:
   - `"test": "vitest run"`
   - `"test:watch": "vitest"`
   - `"test:e2e": "playwright test"`
   - `"lint": "next lint"`
   - `"format": "prettier --write ."`

---

## US-07: Create Source Directory Structure

**As a** developer
**I want** the canonical `src/` folder structure created with placeholder files
**So that** all feature teams follow the same conventions

### TDD Focus
- **Test**: Assert that importing from `@/lib/utils` resolves (the `cn()` function from shadcn).
- **Test**: Assert that importing from `@/lib/db` resolves (the Prisma client singleton).

### Acceptance Criteria
- [ ] `src/app/(staff)/layout.tsx` exists (empty shell placeholder).
- [ ] `src/app/(public)/layout.tsx` exists (empty shell placeholder).
- [ ] `src/components/ui/` exists (shadcn components directory).
- [ ] `src/lib/utils.ts` exists (shadcn `cn()` utility).
- [ ] `src/lib/db.ts` exists (Prisma singleton).
- [ ] `src/lib/validations/` directory exists (empty, for Zod schemas).
- [ ] `src/lib/business-rules/` directory exists (empty, for gate utilities).
- [ ] `src/lib/queries/` directory exists (empty, for Prisma queries).
- [ ] `src/lib/services/` directory exists (empty, for external integrations).
- [ ] `src/lib/constants/` directory exists (empty, for enums and config).

### Implementation Steps
1. **Create all directories** — use `mkdir -p` for each:
   - `src/lib/validations/`
   - `src/lib/business-rules/`
   - `src/lib/queries/`
   - `src/lib/services/`
   - `src/lib/constants/`
2. **Add `.gitkeep` files** to empty directories so Git tracks them.
3. **Create `src/app/(staff)/layout.tsx`** — minimal React layout component that renders `{children}`.
4. **Create `src/app/(public)/layout.tsx`** — minimal React layout component that renders `{children}`.
5. **Verify** — all imports resolve correctly in a test file.

---

## US-08: Create Environment Variable Template

**As a** developer
**I want** a documented `.env.example` file with all required environment variables
**So that** team members can set up their local environment quickly

### TDD Focus
- **Test**: Assert that `.env.example` exists and contains all required variable names.

### Acceptance Criteria
- [ ] `.env.example` exists at the project root.
- [ ] All required variables are listed with descriptive comments.
- [ ] `.env.local` is in `.gitignore`.

### Implementation Steps
1. **Create `.env.example`** with the following variables (comments explaining each):
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/ssh_admissions?schema=public"

   # Auth.js
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"

   # Microsoft Entra ID (Azure AD)
   AZURE_AD_CLIENT_ID=""
   AZURE_AD_CLIENT_SECRET=""
   AZURE_AD_TENANT_ID=""

   # Microsoft Graph (SharePoint/OneDrive)
   MICROSOFT_GRAPH_CLIENT_ID=""
   MICROSOFT_GRAPH_CLIENT_SECRET=""
   MICROSOFT_GRAPH_TENANT_ID=""
   SHAREPOINT_SITE_ID=""
   ```
2. **Ensure `.gitignore`** includes `.env.local` and `.env*.local`.

---

## US-09: Create CI Pipeline

**As a** developer
**I want** a GitHub Actions CI workflow that validates the build on every push
**So that** broken code is caught before merging

### TDD Focus
- **Test**: Push a commit to the repository; assert the CI workflow runs and passes.

### Acceptance Criteria
- [ ] `.github/workflows/ci.yml` exists.
- [ ] The workflow runs on push and pull request events.
- [ ] The workflow installs dependencies, generates Prisma client, runs lint, runs tests, and runs build.
- [ ] The workflow fails if any step fails.

### Implementation Steps
1. **Create `.github/workflows/ci.yml`**:
   ```yaml
   name: CI
   on: [push, pull_request]
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: pnpm/action-setup@v4
           with: { version: 9 }
         - uses: actions/setup-node@v4
           with: { node-version: 20, cache: pnpm }
         - run: pnpm install --frozen-lockfile
         - run: npx prisma generate
         - run: pnpm lint
         - run: pnpm test
         - run: pnpm build
   ```
2. **Verify** — push a commit and confirm the workflow runs green.

---

## US-10: Create Project README

**As a** developer
**I want** a comprehensive README documenting setup, scripts, and architecture
**So that** new team members can onboard quickly

### TDD Focus
- **Test**: Assert `README.md` exists and contains sections for setup, prerequisites, and available scripts.

### Acceptance Criteria
- [ ] `README.md` exists at the project root.
- [ ] It documents: project overview, prerequisites, setup instructions, available scripts, project structure, and tech stack.

### Implementation Steps
1. **Create `README.md`** with sections:
   - **Project Overview** — SSH Admissions Management Web App.
   - **Tech Stack** — Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, Auth.js, Microsoft Graph.
   - **Prerequisites** — Node.js 20+, pnpm 9+, PostgreSQL 15+.
   - **Getting Started** — clone, `pnpm install`, copy `.env.example` to `.env.local`, fill in values, `npx prisma migrate dev`, `pnpm dev`.
   - **Available Scripts** — `dev`, `build`, `start`, `lint`, `format`, `test`, `test:watch`, `test:e2e`.
   - **Project Structure** — tree diagram of `src/` folders with descriptions.
   - **Contributing** — branch naming, commit conventions, PR process.
