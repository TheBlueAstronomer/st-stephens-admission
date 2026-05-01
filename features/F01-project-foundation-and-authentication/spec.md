# F01 — Project Foundation and Authentication

## Goal

Establish the full Next.js application skeleton with database schema, Prisma ORM, Microsoft Entra ID authentication via Auth.js, and route-level role-based access control via Next.js proxy. This is the prerequisite that all other features depend on.

## Scope

- Initialise Next.js project with TypeScript, Tailwind CSS, and shadcn/ui.
- Define the complete Prisma schema covering all entities from the PRD: `User`, `Applicant`, `EcclesialProfile`, `BAPStatus`, `AcademicProgramme`, `Interview`, `Offer`, `Registration`, `AccommodationRequest`, `ApplicantDocument`, and `AuditLog`.
- Integrate Auth.js with Microsoft Entra ID provider.
- Implement session-based role resolution that maps authenticated users to one of: `ADMISSIONS_STAFF`, `ACADEMIC_STAFF`, `SENIOR_LEADERSHIP`, `SYSTEM_ADMINISTRATOR`.
- Implement route-level access control via Next.js proxy and server-action-level guards that enforce role-based access control.
- Create the login screen (§5.1) with Microsoft sign-in button, error messaging for unauthorised accounts, and institutional branding.
- Implement a protected application shell with top navigation and role-aware sidebar.

## Acceptance Criteria

- [x] Running `prisma migrate dev` applies the full schema to a PostgreSQL database without errors.
- [x] All domain entities, enums, and relationships from §6 of the PRD exist in the schema with correct types and constraints.
- [x] A staff user authenticating via Microsoft Entra ID is created or updated in the `User` table with their assigned role.
- [x] An unauthenticated request to any staff route redirects to the login screen.
- [x] An authenticated user with `ACADEMIC_STAFF` role cannot access routes designated for `ADMISSIONS_STAFF` or `SYSTEM_ADMINISTRATOR`.
- [x] An authenticated user with `SENIOR_LEADERSHIP` role can only access dashboard and report routes.
- [x] An account not present in the `User` table or marked `isActive = false` is rejected with a clear error message on the login screen.
- [x] The application shell renders the correct navigation items for each role.
- [x] All routes and server actions are covered by at least one integration test asserting correct access control behaviour per role.
