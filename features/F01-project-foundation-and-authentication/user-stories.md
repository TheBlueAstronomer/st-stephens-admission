# F01 — Project Foundation and Authentication: User Stories

> Each story is a vertical TDD slice: write one test for the described behaviour, make it pass, then move to the next story. Stories are ordered by dependency — earlier stories establish infrastructure that later stories build on.

---

## US-01: Prisma Schema — Core Entities

**As a** developer  
**I want** the Prisma schema to define all core domain entities (`User`, `Applicant`, `EcclesialProfile`, `BAPStatus`, `AcademicProgramme`, `Interview`, `Offer`, `Registration`, `AccommodationRequest`, `ApplicantDocument`, `AuditLog`) with correct field types, enums, and relationships  
**So that** `prisma migrate dev` applies cleanly to a PostgreSQL database and all downstream features have a stable data foundation

### TDD Focus
- **Test**: Run `prisma migrate dev` and assert zero errors; introspect the database and verify every table, column, enum, and foreign key exists with the expected type.
- **Behaviour under test**: Schema correctness — the public interface is the Prisma Client generated from the schema.

### Acceptance Criteria
- [x] `prisma migrate dev` applies without errors on a clean PostgreSQL database.
- [x] All entities from PRD §6 exist as Prisma models with correct field types.
- [x] All enums (applicant status, BAP status, interview type, offer type, accommodation type, document type, user role, etc.) are defined.
- [x] Relationships match the PRD: Applicant has many Documents, Interviews, one Offer, one Registration, one AccommodationRequest, one EcclesialProfile, one BAPStatus.

### Implementation Steps
1. **Install Prisma and initialise** — `npm install prisma @prisma/client`, run `npx prisma init`, configure `DATABASE_URL` for PostgreSQL in `.env`.
2. **Define all enums** in `prisma/schema.prisma`: `UserRole`, `ApplicantStatus`, `BAPStageStatus`, `InterviewType`, `InterviewOutcome`, `OfferType`, `AccommodationType`, `AccommodationDuration`, `DocumentStatus`, `AuditAction`.
3. **Define models** — `User`, `Applicant`, `EcclesialProfile`, `BAPStatus`, `AcademicProgramme`, `Interview`, `Offer`, `Registration`, `AccommodationRequest`, `ApplicantDocument`, `AuditLog`, `Diocese`, `DocumentType`, `AdmissionsYear`. Follow PRD §6 for field types and nullability.
4. **Define relationships** — one-to-one (`Applicant` ↔ `EcclesialProfile`, `BAPStatus`, `Offer`, `Registration`, `AccommodationRequest`), one-to-many (`Applicant` → `ApplicantDocument`, `Interview`, `AuditLog`).
5. **Add `@@map` annotations** if table naming conventions differ from model names.
6. **Run `npx prisma migrate dev --name init`** — verify zero errors on a clean PostgreSQL database.
7. **Write an integration test** that runs the migration, introspects the DB, and asserts every table, column, enum, and FK exists with expected types.

> 📎 Refer to `spec.md` for full acceptance criteria and PRD §6 for data structures.

---

## US-02: Auth.js Integration with Microsoft Entra ID

**As a** staff user  
**I want** to authenticate via my institutional Microsoft account  
**So that** I can securely access the admissions system without a separate password

### TDD Focus
- **Test**: Simulate the Auth.js callback with a valid Microsoft token; assert that a session is created and the user is found/created in the `User` table.
- **Test**: Simulate a callback with an account that has no `User` record and `isActive = false`; assert the session is denied.

### Acceptance Criteria
- [x] A staff user authenticating via Microsoft Entra ID is created or updated in the `User` table with their assigned role.
- [x] An account not present in the `User` table is rejected with a clear error message.
- [x] An account with `isActive = false` is rejected with a clear error message.
- [x] The session contains the user's `id`, `role`, `name`, and `email`.

### Implementation Steps
1. **Install Auth.js and the Azure AD provider** — `npm install next-auth @auth/prisma-adapter`. Add the `AzureADProvider` (Microsoft Entra ID) in `src/lib/auth.ts`.
2. **Configure environment variables** — `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.
3. **Wire the Prisma adapter** — use `@auth/prisma-adapter` so sessions and accounts are stored in the DB.
4. **Implement the `signIn` callback** — look up the user by email in the `User` table. If not found or `isActive === false`, return `false` with an error code.
5. **Implement the `session` callback** — attach `user.id`, `user.role`, `user.name`, `user.email` to the session token.
6. **Create the API route** — `src/app/api/auth/[...nextauth]/route.ts` exporting the handler.
7. **Write tests** — simulate Auth.js callback with a valid token (assert session created), with an unknown email (assert denied), with `isActive = false` (assert denied).

> 📎 Refer to `spec.md` §"Auth.js + Microsoft Entra ID" and `wireframes.md` for login error states.

---

## US-03: Session-Based Role Resolution

**As a** system  
**I want** each authenticated session to include the user's role resolved from the `User` table  
**So that** downstream proxy checks can enforce role-based access without additional database lookups per request

### TDD Focus
- **Test**: Create users with each role; authenticate each; assert the session object contains the correct `role` value.
- **Behaviour under test**: The session augmentation logic (Auth.js callbacks).

### Acceptance Criteria
- [x] The session for a user with role `ADMISSIONS_STAFF` contains `role: "ADMISSIONS_STAFF"`.
- [x] The session for a user with role `ACADEMIC_STAFF` contains `role: "ACADEMIC_STAFF"`.
- [x] The session for a user with role `SENIOR_LEADERSHIP` contains `role: "SENIOR_LEADERSHIP"`.
- [x] The session for a user with role `SYSTEM_ADMINISTRATOR` contains `role: "SYSTEM_ADMINISTRATOR"`.

### Implementation Steps
1. **Extend the Auth.js `jwt` callback** — after initial sign-in, query `User.role` from the DB and embed it in the JWT token.
2. **Extend the `session` callback** — copy `token.role` into `session.user.role`.
3. **Extend NextAuth TypeScript types** — augment `Session`, `JWT`, and `User` types in `src/types/next-auth.d.ts` to include `role: UserRole`.
4. **Write tests** — create users with each of the 4 roles, authenticate each, assert `session.user.role` matches.

---

## US-04: Unauthenticated Route Protection

**As a** system  
**I want** all staff routes to redirect unauthenticated requests to the login screen  
**So that** applicant data is never exposed to unauthenticated visitors

### TDD Focus
- **Test**: Make an unauthenticated request to each protected route group; assert a redirect to the login page (HTTP 302 or 307 to `/login`).
- **Behaviour under test**: Next.js proxy that checks for a valid session.

### Acceptance Criteria
- [x] An unauthenticated request to any staff route redirects to the login screen.
- [x] The redirect preserves the originally requested URL as a callback parameter.

### Implementation Steps
1. **Create Next.js proxy** — `src/proxy.ts` that runs on every request.
2. **Define public routes** — `/login`, `/forms/*`, `/api/auth/*`, static assets. All other routes are protected.
3. **Check for a valid session** — use `getToken()` from `next-auth/jwt`. If no token, redirect to `/login?callbackUrl=<original-url>`.
4. **Write tests** — make unauthenticated requests to `/dashboard`, `/applicants`, `/admin`; assert 302/307 redirect to `/login` with `callbackUrl` preserved.

### Playwright E2E Tests
Create `e2e/f01-route-protection.spec.ts`:
1. **Unauthenticated → redirect** — visit `/dashboard` without signing in; assert the browser is redirected to `/login` and the URL contains `callbackUrl=%2Fdashboard`.
2. **Unauthenticated → /applicants** — visit `/applicants`; assert redirect to `/login?callbackUrl=%2Fapplicants`.
3. **Unauthenticated → /admin** — visit `/admin`; assert redirect to `/login?callbackUrl=%2Fadmin`.
4. **Public routes pass through** — visit `/forms/interview-application`; assert HTTP 200 (no redirect).

---

## US-05: Role-Based Route Access Control

**As a** system  
**I want** each route to enforce allowed roles so that users only access what their role permits  
**So that** academic staff cannot reach admin pages and senior leadership sees only dashboards and reports

### TDD Focus
- **Test**: For each role, request each route group; assert 200 for permitted routes and 403 for denied routes.
- **Behaviour under test**: RBAC proxy at the route level.

### Acceptance Criteria
- [x] `ACADEMIC_STAFF` cannot access routes designated for `ADMISSIONS_STAFF` or `SYSTEM_ADMINISTRATOR` (receives 403).
- [x] `SENIOR_LEADERSHIP` can only access dashboard and report routes; other routes return 403.
- [x] `ADMISSIONS_STAFF` can access applicant management routes.
- [x] `SYSTEM_ADMINISTRATOR` can access administration routes.

### Implementation Steps
1. **Define a route-to-role permission map** — e.g., `{ '/admin/*': ['SYSTEM_ADMINISTRATOR'], '/applicants/*': ['ADMISSIONS_STAFF', 'SYSTEM_ADMINISTRATOR', ...] }` in `src/lib/rbac.ts`.
2. **Extend `src/proxy.ts`** — after validating the session, check `token.role` against the permission map for the matched route. If denied, return a `NextResponse` with status 403.
3. **Create a `ForbiddenPage`** — `src/app/(staff)/forbidden/page.tsx` showing a "You do not have access" message.
4. **Write tests** — for each role, request each route group; assert 200 for permitted, 403 for denied.

### Playwright E2E Tests
Create `e2e/f01-rbac.spec.ts` (uses dev-login to authenticate as each role):
1. **ADMISSIONS_STAFF → /dashboard** — sign in as Alice; visit `/dashboard`; assert page loads (no "Access Denied").
2. **ADMISSIONS_STAFF → /applicants** — assert page loads.
3. **ACADEMIC_STAFF → /dashboard** — sign in as Bob; visit `/dashboard`; assert "Access Denied" or redirect to `/forbidden`.
4. **ACADEMIC_STAFF → /applicants** — assert page loads (ACADEMIC_STAFF has read access).
5. **ACADEMIC_STAFF → /admin** — assert forbidden.
6. **SENIOR_LEADERSHIP → /dashboard** — sign in as Carol; assert page loads.
7. **SENIOR_LEADERSHIP → /applicants** — assert forbidden or redirect.
8. **SENIOR_LEADERSHIP → /admin** — assert forbidden.
9. **SYSTEM_ADMINISTRATOR → /admin** — sign in as Dave; assert page loads.

> 📎 Refer to `spec.md` §"RBAC middleware" and `wireframes.md` §"Role-Aware Navigation Visibility" table.

---

## US-06: Server Action Role Guard

**As a** system  
**I want** server actions to verify the caller's role before executing mutations  
**So that** role enforcement cannot be bypassed by calling server actions directly

### TDD Focus
- **Test**: Call a server action (e.g., create applicant) with a session having `ACADEMIC_STAFF` role; assert it throws an authorisation error.
- **Test**: Call the same action with `ADMISSIONS_STAFF`; assert it succeeds.
- **Behaviour under test**: A reusable `requireRole()` guard used at the top of server actions.

### Acceptance Criteria
- [x] Server actions that mutate data reject calls from unauthorised roles with a clear error.
- [x] The guard is reusable and applied consistently across all mutation server actions.

### Implementation Steps
1. **Create a `requireRole()` utility** — `src/lib/require-role.ts` that takes `...allowedRoles: UserRole[]`, calls `getServerSession()`, and throws `AuthorizationError` if the session role is not in the allowed list.
2. **Create a custom error class** — `AuthorizationError` extending `Error` with a `statusCode: 403`.
3. **Apply the guard** at the top of every mutation server action (e.g., `createApplicant`, `updateStatus`, etc.).
4. **Write tests** — call a server action with an unauthorised role (assert rejection), call with authorised role (assert success).

---

## US-07: Login Screen

**As a** staff user  
**I want** a login screen with the Microsoft sign-in button, institutional branding, and clear error messaging  
**So that** I can sign in easily and understand why access is denied if my account is not authorised

### TDD Focus
- **Test**: Render the login page; assert the Microsoft sign-in button is present.
- **Test**: Render the login page with an `error` query parameter; assert the error message is displayed.
- **Behaviour under test**: Login page component rendering.

### Acceptance Criteria
- [x] The login screen displays the Microsoft sign-in button.
- [x] The login screen shows institutional branding (St Stephen's House).
- [x] When an `error` query parameter is present, the screen displays a clear error message (e.g., "Your account is not authorised").

### Implementation Steps
1. **Create the login page** — `src/app/(public)/login/page.tsx`.
2. **Build the editorial split layout** — left half with institutional branding (SSH crest SVG, title, subtitle), right half with Double-Bezel login card. Use `Plus Jakarta Sans` for headings, `Geist` for body.
3. **Add the Microsoft sign-in button** — call `signIn('azure-ad')` from `next-auth/react`. Style as a navy pill button with MS logo SVG and inner arrow circle per wireframe.
4. **Handle error query params** — read `searchParams.error`, render a shadcn `Alert` variant `destructive` with the appropriate message ("unauthorised account" or "session expired").
5. **Implement mobile collapse** — single column below `768px`, branding stacks above card.
6. **Write tests** — render login page (assert MS button present), render with `?error=unauthorized` (assert error alert displayed).

### Playwright E2E Tests
Create `e2e/f01-login.spec.ts`:
1. **Login page renders** — visit `/login`; assert the page contains the Microsoft sign-in button text and institutional branding ("St Stephen's House").
2. **Error display — unauthorized** — visit `/login?error=unauthorized`; assert an error alert is visible with text containing "not authorised" or "unauthorized".
3. **Error display — inactive** — visit `/login?error=inactive`; assert an error alert about inactive account is displayed.
4. **Dev login flow** — visit `/dev/login`; click the Alice (ADMISSIONS_STAFF) card; assert redirect to `/dashboard` and the dashboard page loads.
5. **Sign out** — after signing in via dev login, click the user avatar and sign out; assert redirect back to `/login`.

> 📎 Refer to `wireframes.md` §"Screen 1 — Login Screen" for exact layout, colours, and component anatomy.

---

## US-08: Protected Application Shell with Role-Aware Navigation

**As a** staff user  
**I want** a consistent application shell with top navigation and a sidebar that shows only the links appropriate to my role  
**So that** I can navigate efficiently without seeing features I cannot access

### TDD Focus
- **Test**: Render the shell with an `ADMISSIONS_STAFF` session; assert nav items include Applicants, Interviews, Offers, Documents, Dashboard.
- **Test**: Render the shell with a `SENIOR_LEADERSHIP` session; assert nav items include only Dashboard and Reports.
- **Test**: Render the shell with `ACADEMIC_STAFF`; assert nav items include only Interviews.
- **Test**: Render the shell with `SYSTEM_ADMINISTRATOR`; assert nav items include Administration.

### Acceptance Criteria
- [x] The shell renders the correct navigation items for `ADMISSIONS_STAFF`.
- [x] The shell renders the correct navigation items for `ACADEMIC_STAFF`.
- [x] The shell renders the correct navigation items for `SENIOR_LEADERSHIP`.
- [x] The shell renders the correct navigation items for `SYSTEM_ADMINISTRATOR`.
- [x] The shell includes a sign-out action.

### Implementation Steps
1. **Create the staff layout** — `src/app/(staff)/layout.tsx` wrapping all authenticated routes.
2. **Build the sidebar** — use shadcn `Sidebar` (sidebar-07 pattern) with icon rail collapse. Icons from Phosphor Light (`phosphor-react`). Active state: `bg-[#1A2744] text-white rounded-xl`.
3. **Implement role-aware nav rendering** — read `session.user.role` and conditionally include/exclude nav items per the wireframe visibility table (Dashboard, Applicants, Interviews, Reports, Admin).
4. **Build the top bar** — breadcrumb (`Breadcrumb`), global applicant search (`Command` cmd+k), user avatar (`Avatar` with `DropdownMenu` containing "Sign out").
5. **Add sign-out** — `signOut()` from `next-auth/react` in the avatar dropdown.
6. **Add role badge in sidebar footer** — `Badge` colour-coded per role per wireframe.
7. **Implement sidebar collapse animation** — `transition-[width] duration-300` with label fade and tooltip on icon-rail hover.
8. **Write tests** — render shell with each role's session; assert correct nav items present/absent for each.

### Playwright E2E Tests
Create `e2e/f01-app-shell.spec.ts` (uses dev-login for each role):
1. **ADMISSIONS_STAFF nav** — sign in as Alice; assert sidebar contains: Dashboard, Applicants, Interviews, Reports. Assert Admin is NOT visible.
2. **ACADEMIC_STAFF nav** — sign in as Bob; assert sidebar contains: Applicants, Interviews. Assert Dashboard, Reports, Admin are NOT visible.
3. **SENIOR_LEADERSHIP nav** — sign in as Carol; assert sidebar contains: Dashboard, Reports. Assert Applicants, Interviews, Admin are NOT visible.
4. **SYSTEM_ADMINISTRATOR nav** — sign in as Dave; assert sidebar contains: Dashboard, Applicants, Interviews, Reports, Admin.
5. **Sign-out action present** — for any logged-in role, assert a sign-out button or menu item is present in the user avatar dropdown.

> 📎 Refer to `wireframes.md` §"Screen 2 — Application Shell" for layout, components, and role visibility table.
