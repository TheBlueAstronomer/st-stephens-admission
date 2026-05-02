# Code Quality Remediation Checklist

## Purpose

This document turns the code audit into a ranked, file-oriented remediation checklist that you can use to track implementation.

## How to Use

- Mark each item complete as you implement it.
- Treat `Priority 1` items as blockers for future feature scale-up.
- `Effort` is a rough engineering estimate for one developer already familiar with the codebase.
- `Impact` reflects expected benefit to correctness, maintainability, scalability, and developer velocity.

## Effort Scale

- `XS`: under 1 hour
- `S`: 1 to 4 hours
- `M`: 0.5 to 1.5 days
- `L`: 2 to 4 days
- `XL`: 1 week+

## Impact Scale

- `Low`: mostly cleanup or polish
- `Medium`: meaningful maintainability or UX improvement
- `High`: important structural improvement or risk reduction
- `Very High`: foundational improvement with broad codebase effect

---

# Ranked Remediation Checklist

## 1) Fix Audit Log Data Model Inconsistency

- **Priority**: P1
- **Rank**: 1
- **Primary files**:
  - `prisma/schema.prisma`
  - `src/app/(staff)/applicants/actions.ts`
  - `src/app/(staff)/interviews/actions.ts`
  - `src/lib/queries/applicants.ts`
  - Any future reporting/audit consumers
- **Problem**:
  - `AuditLog` currently mixes generic polymorphic fields (`entityType`, `entityId`) with a hard Prisma relation that treats `entityId` like an `Applicant.id`.
  - Audit payloads are also inconsistently stored as raw strings, status strings, and JSON strings.
- **Why it matters**:
  - This is the most significant schema-level design smell in the current codebase.
  - It creates ambiguity around referential integrity, cascade behavior, and future audit reporting.
- **Recommended remediation**:
  - Redesign `AuditLog` so it is either:
    - fully polymorphic with no misleading hard relation, or
    - explicitly relational per entity type.
  - Standardize payload shape for `previousValue` / `newValue`.
  - Prefer structured JSON fields or a predictable serialized schema.
- **Effort**: L
- **Impact**: Very High
- **Checklist**:
  - [x] Decide target audit log model design
  - [x] Update Prisma schema
  - [x] Create/apply migration
  - [x] Update audit log writes in applicant actions
  - [x] Update audit log writes in interview actions
  - [x] Update audit log reads/rendering if needed
  - [x] Add regression tests for audit behavior

---

## 2) Extract Application-Service Layer from Server Action God Files

- **Priority**: P1
- **Rank**: 2
- **Primary files**:
  - `src/app/(staff)/applicants/actions.ts`
  - `src/app/(staff)/interviews/actions.ts`
  - New likely targets under `src/lib/services/` or `src/lib/use-cases/`
- **Problem**:
  - Current server action files mix authorization, validation, transaction orchestration, business rules, audit logging, and cache invalidation.
- **Why it matters**:
  - This is manageable today, but it will become a bottleneck as F04-F08 land.
  - It reduces testability and increases duplication.
- **Recommended remediation**:
  - Keep actions thin and move orchestration into application services/use-cases.
  - Suggested split:
    - action = auth + validate + invoke use-case + revalidate
    - use-case = transaction + domain orchestration + audit logging
- **Effort**: XL
- **Impact**: Very High
- **Checklist**:
  - [x] Define service/use-case folder convention
  - [x] Extract applicant creation workflow
  - [x] Extract applicant status transition workflow
  - [x] Extract applicant update workflow
  - [x] Extract applicant export workflow if appropriate
  - [x] Extract interview scheduling workflow
  - [x] Extract interview outcome workflow
  - [x] Extract interview notes/invitation/application workflows
  - [x] Reduce actions to thin wrappers
  - [x] Add unit tests around extracted services

---

## 3) Replace Generic Applicant Update Mutation with Validated Typed Inputs

- **Priority**: P1
- **Rank**: 3
- **Primary files**:
  - `src/app/(staff)/applicants/actions.ts`
  - `src/lib/validations/applicant.ts`
  - Relevant calling components/pages
- **Problem**:
  - `updateApplicant(id, updates: Record<string, unknown>)` is effectively a free-form patch API.
- **Why it matters**:
  - It weakens type safety and domain guarantees.
  - It makes accidental or invalid writes easier.
- **Recommended remediation**:
  - Replace generic updates with explicit input schemas by domain slice.
  - Example slices:
    - personal details
    - ecclesial profile
    - BAP fields
    - registration fields
- **Effort**: L
- **Impact**: High
- **Checklist**:
  - [x] Inventory all current `updateApplicant` callers
  - [x] Define explicit update schemas in `validations/applicant.ts`
  - [x] Replace generic update signature(s)
  - [x] Restrict Prisma update payload creation to whitelisted fields
  - [x] Update callers
  - [x] Add validation and authorization regression tests

---

## 4) Split Oversized Client Detail Components

- **Priority**: P1
- **Rank**: 4
- **Primary files**:
  - `src/components/applicant-detail-view.tsx`
  - `src/components/interview-detail-view.tsx`
  - `src/components/schedule-interview-dialog.tsx`
- **Problem**:
  - Several client components are large and combine rendering, local state, domain branching, formatting, and mutation orchestration.
- **Why it matters**:
  - This increases cognitive load and slows safe refactoring.
  - These components are likely to accumulate more responsibilities over time.
- **Recommended remediation**:
  - Split into smaller feature-specific subcomponents and helper hooks/utilities.
  - Pull data formatting and action orchestration out of render-heavy files.
- **Effort**: XL
- **Impact**: High
- **Checklist**:
  - [x] Split `ApplicantDetailView` tabs into separate files
  - [x] Extract `InterviewTab` into its own component
  - [x] Extract audit timeline formatting helpers
  - [x] Split `InterviewDetailView` sections into separate components
  - [x] Extract dialog state/submit logic from `ScheduleInterviewDialog`
  - [x] Add targeted component tests around extracted units

---

## 5) Standardize Audit Event Payload Structure

- **Priority**: P2
- **Rank**: 5
- **Primary files**:
  - `src/app/(staff)/applicants/actions.ts`
  - `src/app/(staff)/interviews/actions.ts`
  - `src/components/applicant-detail-view.tsx`
- **Problem**:
  - Audit values are stored in multiple incompatible formats.
- **Why it matters**:
  - Makes reporting, filtering, and diffing much harder.
- **Recommended remediation**:
  - Define a consistent event payload convention.
  - Ensure timeline rendering uses the same structure everywhere.
- **Effort**: M
- **Impact**: High
- **Checklist**:
  - [x] Define canonical audit payload structure
  - [x] Update writes for CREATE/UPDATE/STATUS_CHANGE/interview events
  - [x] Update timeline formatter/rendering logic
  - [x] Add tests for serialization/deserialization rules

---

## 6) Introduce Shared Action Result / Error Handling Pattern

- **Priority**: P2
- **Rank**: 6
- **Primary files**:
  - `src/app/(staff)/applicants/actions.ts`
  - `src/app/(staff)/interviews/actions.ts`
  - New shared file under `src/lib/` or `src/types/`
- **Problem**:
  - `ActionResult` is duplicated and server-action result handling is repetitive.
- **Why it matters**:
  - Leads to drift in error shapes and repetitive client handling.
- **Recommended remediation**:
  - Create one shared action result type and possibly helper builders.
  - Standardize validation/auth/domain error mapping.
- **Effort**: M
- **Impact**: Medium
- **Checklist**:
  - [x] Create shared action result type
  - [x] Normalize success/error/warning shape
  - [x] Refactor applicant actions to use shared type
  - [x] Refactor interview actions to use shared type
  - [x] Ensure callers rely on one response contract

---

## 7) Replace Runtime Shape Checks with Stronger View Models

- **Priority**: P2
- **Rank**: 7
- **Primary files**:
  - `src/components/applicant-detail-view.tsx`
  - `src/lib/queries/applicants.ts`
  - `src/lib/queries/interviews.ts`
- **Problem**:
  - Some UI code compensates for uncertain data shape with runtime checks and casts.
- **Why it matters**:
  - This is a type-system smell in a TS-first codebase.
- **Recommended remediation**:
  - Define explicit view models or query return aliases for UI consumers.
  - Remove `Record<string, unknown>` style access from authored UI code.
- **Effort**: M
- **Impact**: High
- **Checklist**:
  - [x] Identify all runtime shape checks/casts in components
  - [x] Introduce explicit query result types or mappers
  - [x] Update `ApplicantDetailView` to use typed panel members directly
  - [x] Tighten prop types across interview/applicant detail UIs

---

## 8) Extract Shared Client Mutation Execution Patterns

- **Priority**: P2
- **Rank**: 8
- **Primary files**:
  - `src/components/applicant-detail-view.tsx`
  - `src/components/interview-detail-view.tsx`
  - `src/components/schedule-interview-dialog.tsx`
  - Potential new helper under `src/hooks/` or `src/lib/`
- **Problem**:
  - Many components repeat the same `useTransition` + action + toast + refresh pattern.
- **Why it matters**:
  - Repetition increases inconsistency and maintenance cost.
- **Recommended remediation**:
  - Create a small helper/hook for server action execution lifecycle.
- **Effort**: M
- **Impact**: Medium
- **Checklist**:
  - [x] Identify repeated mutation orchestration patterns
  - [x] Define shared helper/hook API
  - [x] Refactor one component as pilot
  - [x] Roll out to remaining components

---

## 9) Replace Hard-Coded Hex Colors with Semantic Tokens

- **Priority**: P2
- **Rank**: 9
- **Primary files**:
  - `src/app/(staff)/layout.tsx`
  - `src/components/create-applicant-sheet.tsx`
  - `src/components/applicant-detail-view.tsx`
  - `src/components/interview-detail-view.tsx`
  - `src/components/schedule-interview-dialog.tsx`
  - `src/components/app-sidebar.tsx`
  - `src/components/app-topbar.tsx`
  - `src/app/globals.css`
- **Problem**:
  - Components frequently use raw hex values instead of semantic theme tokens.
- **Why it matters**:
  - Makes theming, visual consistency, and design iteration harder.
- **Recommended remediation**:
  - Promote common colors to semantic token names and consume those tokens consistently.
- **Effort**: L
- **Impact**: High
- **Checklist**:
  - [x] Inventory repeated hard-coded colors
  - [x] Define semantic tokens in `globals.css`
  - [x] Replace raw color usage in shell components
  - [x] Replace raw color usage in applicant/interview components
  - [x] Verify contrast and dark-mode implications

---

## 10) Move UI-Level Domain Formatting Out of Large Component Files

- **Priority**: P2
- **Rank**: 10
- **Primary files**:
  - `src/components/applicant-detail-view.tsx`
  - `src/lib/constants/applicant-status.ts`
  - Potential new helper files under `src/lib/formatters/` or `src/lib/view-models/`
- **Problem**:
  - Domain formatting and mapping logic lives inside render-heavy components.
- **Why it matters**:
  - Makes files harder to scan and reuse logic elsewhere.
- **Recommended remediation**:
  - Extract formatters for audit actions, display labels, date rendering, and status timeline helpers.
- **Effort**: M
- **Impact**: Medium
- **Checklist**:
  - [x] Extract `formatAction`
  - [x] Extract repeated date formatting helpers
  - [x] Extract progress/timeline mapping helpers where appropriate
  - [x] Update component imports and tests

---

## 11) Replace Native `confirm()` with App-Native Confirmation UI

- **Priority**: P3
- **Rank**: 11
- **Primary files**:
  - `src/components/applicant-detail-view.tsx`
  - Reusable dialog location under `src/components/ui/` or feature component area
- **Problem**:
  - Native browser confirm is blocking and inconsistent with app UX.
- **Why it matters**:
  - Not structurally dangerous, but noticeably below production UX standards.
- **Recommended remediation**:
  - Replace with modal/dialog confirmation flow using the existing component system.
- **Effort**: S
- **Impact**: Medium
- **Checklist**:
  - [x] Build or reuse confirmation dialog component
  - [x] Replace native confirm in applicant status change flow
  - [x] Ensure loading/error states are preserved

---

## 12) Reduce Zod Resolver Type Escape Hatch

- **Priority**: P3
- **Rank**: 12
- **Primary files**:
  - `src/components/create-applicant-sheet.tsx`
  - Potentially other form components using the same pattern
- **Problem**:
  - The form currently uses `as any` and an ESLint suppression for the resolver.
- **Why it matters**:
  - This is a manageable temporary workaround, but still technical debt.
- **Recommended remediation**:
  - Revisit compatibility path for Zod v4 + resolver typing.
  - Reduce or isolate the type escape if a clean upstream-compatible pattern exists.
- **Effort**: S to M
- **Impact**: Medium
- **Checklist**:
  - [x] Confirm whether current resolver version supports a cleaner typed approach
  - [x] Remove local `as any` if possible
  - [x] Remove local eslint suppression if possible
  - [x] Add note if workaround must remain intentionally

---

## 13) Tighten TypeScript Config Where Safe

- **Priority**: P3
- **Rank**: 13
- **Primary files**:
  - `tsconfig.json`
- **Problem**:
  - `allowJs: true` is permissive for a TypeScript-first app.
- **Why it matters**:
  - Not urgent, but tightening config improves long-term consistency.
- **Recommended remediation**:
  - Verify whether any authored JS files are required.
  - Disable permissive flags if they are no longer needed.
  - In this repo, authored `.mjs` config files still cause `next build` to restore `allowJs: true`, so full removal should wait for a broader config migration.
- **Effort**: XS to S
- **Impact**: Low to Medium
- **Checklist**:
  - [x] Check whether project intentionally supports authored JS files
  - [x] Confirm `allowJs` should remain enabled until authored `.mjs` config files are migrated
  - [x] Run tests/build/lint after config tightening

---

## 14) Harden E2E Execution Strategy for CI and Reproducibility

- **Priority**: P3
- **Rank**: 14
- **Primary files**:
  - `playwright.config.ts`
  - `.github/workflows/ci.yml`
- **Problem**:
  - E2E currently targets `pnpm dev`, which is sometimes less deterministic than production-mode runs.
- **Why it matters**:
  - This is more of an operational quality improvement than a code smell.
- **Recommended remediation**:
  - Evaluate running Playwright against `next build && next start` in CI.
  - Keep a fast local-dev path if desired.
  - Current implementation keeps local Playwright on `pnpm dev` and switches CI Playwright to `pnpm start` with explicit test-auth enablement plus database/browser setup in CI.
- **Effort**: M
- **Impact**: Medium
- **Checklist**:
  - [x] Decide local vs CI E2E execution strategy
  - [x] Update Playwright config if needed
  - [x] Update CI workflow if needed
  - [x] Validate test stability in CI mode

---

## 15) Improve Project Hardening / Scaffolding Polish

- **Priority**: P4
- **Rank**: 15
- **Primary files**:
  - `package.json`
  - `next.config.ts`
- **Problem**:
  - Some scaffolding still looks default/starter-level.
- **Why it matters**:
  - Low urgency, but worth cleaning up as the project matures.
- **Recommended remediation**:
  - Give the package a real project name.
  - Revisit `next.config.ts` when you need security headers, bundle analysis, or image settings.
  - Current implementation renames the package and replaces the starter placeholder config with lightweight production headers and `poweredByHeader: false`.
- **Effort**: XS to S
- **Impact**: Low
- **Checklist**:
  - [x] Rename package from generic starter value if desired
  - [x] Revisit `next.config.ts` for production hardening needs

---

# Quick Wins

These items are relatively cheap and can be completed early to build momentum.

- [x] Replace native `confirm()` with app-native confirmation dialog
- [x] Extract `formatAction` and repeated date formatters from `applicant-detail-view.tsx`
- [x] Standardize shared `ActionResult` type
- [x] Tighten runtime casts in `applicant-detail-view.tsx`
- [x] Review whether `allowJs` can be removed

---

# Suggested Implementation Order

## Phase 1: Foundational correctness

- [x] Rank 1: Audit log data model
- [x] Rank 3: Typed validated applicant update APIs
- [x] Rank 5: Standardized audit payload shape

## Phase 2: Structural maintainability

- [x] Rank 2: Extract application-service layer
- [x] Rank 4: Split oversized components
- [x] Rank 7: Strengthen view-model typing
- [x] Rank 8: Shared client mutation helpers

## Phase 3: UX and design system consistency

- [x] Rank 9: Semantic tokens over hard-coded hex colors
- [x] Rank 10: Extract formatting helpers
- [x] Rank 11: Replace native confirm
- [x] Rank 12: Remove resolver type escape hatch where possible

## Phase 4: Tooling and polish

- [x] Rank 13: Tighten TypeScript config
- [x] Rank 14: Harden Playwright strategy
- [x] Rank 15: Scaffolding polish

---

# Notes

- The codebase already has a **good architectural base**. Most of this work is about preventing the current design from becoming harder to evolve as upcoming features are added.
- If time is limited, prioritize **Ranks 1 through 4** before adding major new feature surface area.
