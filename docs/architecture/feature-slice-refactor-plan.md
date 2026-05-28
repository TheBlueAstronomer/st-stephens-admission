# Hybrid Feature-Slice Refactor Plan

## Summary

Refactor the app from a route-centric layered layout to a hybrid architecture:
Next.js App Router remains responsible for routing, layouts, and compatibility
wrappers, while feature-owned domain code moves under `src/features/*`.

This is a move-only refactor. It must not change route URLs, server-action
signatures, validation behavior, database schema, auth behavior, business rules,
or user-facing UI behavior.

## Target Architecture

```txt
src/
  app/                         # Next.js routes, layouts, thin page/action wrappers only
  components/ui/               # shadcn/ui primitives remain shared
  features/
    applicants/
    interviews/
    documents/
    offers/
    public-forms/
    dashboard/
    reports/
    admin/
    admissions-lifecycle/       # cross-stage admissions status/rule/view-model code
    app-shell/                  # authenticated shell navigation/topbar
    auth/                       # login and development-login UI
  lib/                          # true infrastructure/shared utilities only
  hooks/                        # shared generic hooks only
  generated/
  types/
```

Keep in `src/lib`:

- `auth.ts`, `db.ts`, `rbac.ts`, `require-role.ts`, `action-result.ts`,
  `audit-log.ts`, `utils.ts`, and `formatters/date.ts`.
- Prisma generated code, NextAuth types, root layouts, proxy, and shadcn UI
  primitives remain in their current shared locations.

Move feature-owned code:

- Applicants: applicant list/detail components, applicant queries/filter
  helpers, applicant workflows, applicant validation, applicant ID generation,
  and duplicate matching.
- Interviews: interview list/detail components, scheduling dialog/hook,
  interview queries, interview actions, interview workflows, interview
  validation, and interview access rule.
- Documents: upload/waive dialogs, document queries, document validation,
  document constants, document fulfilment workflow, Microsoft Graph document
  integration, and document gate.
- Offers: record-offer sheet, offer actions, offer workflows, offer validation,
  and offer gate.
- Public forms: public form layout, file upload field, interview application
  form, registration form, public form actions, and public form validations.
- Dashboard: dashboard components, dashboard queries, and dashboard export
  action.
- Reports: report components, report queries, report CSV action, and CSV export
  helper.
- Admin: admin nav/tables/dialogs, admin action modules, user validation, and
  audit-log query.
- Admissions lifecycle: applicant status constants, status transitions, BAP
  gate, applicant progress view model, and cross-stage rules shared by multiple
  features.
- App shell/auth: authenticated navigation, topbar, login card, and development
  login picker.

## Implementation Steps

1. Preserve the dirty worktree. Existing modified and untracked files are user
   work and must be carried through the refactor.
2. Create `src/features/*` directories and move files in dependency order:
   admissions lifecycle and applicants, then documents, interviews, offers,
   public forms, dashboard, reports, and admin.
3. Keep `src/app` route files thin. Pages import feature queries/components.
   Route-level action files stay as compatibility re-export wrappers where
   useful.
4. Update imports to direct feature module paths. Do not add barrel files during
   this refactor.
5. Move focused unit/integration tests beside their owning feature under
   `src/features/<feature>/__tests__`. Keep cross-cutting infrastructure tests
   in `src/__tests__` and Playwright coverage in `e2e/`.
6. Update the README project structure and folder conventions so future work
   follows feature-owned modules instead of global technical folders.

## Public Interfaces

No runtime interface should change.

Preserve:

- server action names and argument/return types,
- route URLs,
- Prisma schema and generated client,
- validation behavior and exported schema names,
- query/workflow function behavior,
- existing UI rendering and user flows.

Compile-time import paths are expected to change from `@/lib/...` and
`@/components/...` to `@/features/...` for feature-owned code.

## Verification

Run:

```bash
pnpm lint
pnpm test
pnpm build
```

Run `pnpm test:e2e` when local database and dev-server prerequisites are
available.

Regression areas:

- applicant create/update/status flows,
- document checklist/upload/waive/clear flows,
- interview scheduling/outcome flows,
- offer and registration flows,
- public interview application and registration forms,
- dashboard/report queries and CSV exports,
- admin user/reference-data/audit-log actions.

## Assumptions

- Refactor depth is move-only: no component decomposition, no behavior changes,
  and no import-boundary enforcement tooling.
- This file is the durable implementation plan.
- Deeper component splitting and boundary checks are follow-up work.
