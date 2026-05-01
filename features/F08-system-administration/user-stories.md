# F08 — System Administration: User Stories

> Each story is a vertical TDD slice. Stories are ordered by dependency. Depends on F01 (auth, RBAC).

---

## US-01: Admin Screen Access Control

**As a** system  
**I want** only users with the `SYSTEM_ADMINISTRATOR` role to access the administration screen  
**So that** system configuration is restricted to authorised personnel

### TDD Focus
- **Test**: Request the admin screen as `SYSTEM_ADMINISTRATOR`; assert HTTP 200.
- **Test**: Request the admin screen as `ADMISSIONS_STAFF`; assert 403.
- **Test**: Request the admin screen as `ACADEMIC_STAFF`; assert 403.
- **Test**: Request the admin screen as `SENIOR_LEADERSHIP`; assert 403.

### Acceptance Criteria
- [ ] Only `SYSTEM_ADMINISTRATOR` can access the administration screen.
- [ ] All other roles receive an unauthorised (403) response.

### Implementation Steps
1. **Route-level RBAC** — in `middleware.ts`, the `/admin/*` routes should only allow `SYSTEM_ADMINISTRATOR`. All other roles receive 403.
2. **Create the admin layout** — `src/app/(staff)/admin/layout.tsx`. Add a server-side session check as an extra safety layer: if `session.user.role !== 'SYSTEM_ADMINISTRATOR'`, redirect to `/forbidden`.
3. **Write tests** — request `/admin` as each role: `SYSTEM_ADMINISTRATOR` (assert 200), `ADMISSIONS_STAFF` (assert 403), `ACADEMIC_STAFF` (assert 403), `SENIOR_LEADERSHIP` (assert 403).

### Playwright E2E Tests
Create `e2e/f08-admin.spec.ts`:
1. **SYSTEM_ADMINISTRATOR can access /admin** — sign in as Dave (SYSTEM_ADMINISTRATOR); navigate to `/admin`; assert the admin page loads with management tabs visible (Users, Programmes, Dioceses, Document Types, Years, Audit Log).
2. **ADMISSIONS_STAFF blocked from /admin** — sign in as Alice (ADMISSIONS_STAFF); navigate to `/admin`; assert a 403/forbidden page is shown.
3. **ACADEMIC_STAFF blocked from /admin** — sign in as Bob (ACADEMIC_STAFF); navigate to `/admin`; assert a 403/forbidden page is shown.
4. **SENIOR_LEADERSHIP blocked from /admin** — sign in as Carol (SENIOR_LEADERSHIP); navigate to `/admin`; assert a 403/forbidden page is shown.

---

## US-02: Create Staff User

**As a** system administrator  
**I want** to create a new staff user with a name, email, and assigned role  
**So that** new staff can immediately access the system

### TDD Focus
- **Test**: Call the create-user server action with valid data; assert a User record is created with `isActive = true` and the assigned role.
- **Test**: Assert the new user can authenticate and access role-appropriate routes.

### Acceptance Criteria
- [ ] A new User record is created with the correct role.
- [ ] The user is active and can log in immediately (subject to Entra ID account).
- [ ] An `AuditLog` entry is created for the user creation.

### Implementation Steps
1. **Create a Zod schema** — `src/lib/validations/user.ts` requiring `name`, `email`, and `role` (enum of `UserRole`).
2. **Create the `createUser` server action** — `src/app/(staff)/admin/users/actions.ts`. Apply `requireRole('SYSTEM_ADMINISTRATOR')`. Validate input, create a `User` record with `isActive = true`.
3. **Create `AuditLog` entry** — record `action: 'USER_CREATED'` with user email and role.
4. **Build the Invite User dialog** — triggered by "+ Invite User" button. Shadcn `Dialog` with: `Input` for name, `Input` for email, `Select` for role (4 options), info `Alert` explaining the user must have an Entra ID account, "Send Invite →" button.
5. **Write tests** — create user with valid data (assert record created with `isActive = true` + correct role + audit log), assert new user can authenticate (integration test).

> 📎 Refer to `wireframes.md` §"Screen 2 — Invite User" for dialog layout.

---

## US-03: Deactivate Staff User

**As a** system administrator  
**I want** to deactivate a staff user so they are denied access on their next request  
**So that** departed staff are locked out promptly

### TDD Focus
- **Test**: Create an active user; deactivate them; attempt to access a protected route with that user's session; assert they are denied access.
- **Test**: Assert `isActive = false` on the User record.
- **Test**: Assert an `AuditLog` entry records the deactivation.

### Acceptance Criteria
- [ ] Deactivated users are denied access on their next request.
- [ ] `isActive` is set to `false`.
- [ ] An `AuditLog` entry records the deactivation.

### Implementation Steps
1. **Create the `deactivateUser` server action** — `requireRole('SYSTEM_ADMINISTRATOR')`. Set `isActive = false` on the `User` record.
2. **Session invalidation** — on the user's next request, the Auth.js `signIn` callback (F01-US-02) will reject them because `isActive === false`.
3. **Create `AuditLog` entry** — record `action: 'USER_DEACTIVATED'` with user ID.
4. **Build the UI** — in the user management table, each row has a `DropdownMenu` with "Deactivate" action. Triggers an `AlertDialog` confirmation: "This will immediately revoke access for {name}."
5. **Visual treatment** — deactivated users appear with muted text and a `Badge` variant `secondary` "Inactive".
6. **Write tests** — deactivate a user (assert `isActive = false` + audit log), attempt to access a protected route with that user's session (assert denied).

---

## US-04: Reassign User Role

**As a** system administrator  
**I want** to change a staff user's role  
**So that** users can be promoted, moved between roles, or have their access adjusted

### TDD Focus
- **Test**: Change a user's role from `ACADEMIC_STAFF` to `ADMISSIONS_STAFF`; assert the User record has the new role; assert the user's next session reflects the new role.
- **Test**: Assert an `AuditLog` entry records the old and new role.

### Acceptance Criteria
- [ ] The user's role is updated in the database.
- [ ] The change takes effect on the user's next session.
- [ ] An `AuditLog` entry records the change with previous and new values.

### Implementation Steps
1. **Create the `updateUserRole` server action** — `requireRole('SYSTEM_ADMINISTRATOR')`. Accept `userId` and `newRole`. Update the `User` record.
2. **Create `AuditLog` entry** — record `action: 'ROLE_CHANGED'` with `previousValue` (old role) and `newValue` (new role).
3. **Build the UI** — in the user management table, the role column shows the current role in a `Select` dropdown. Changing the value triggers a confirmation `AlertDialog`, then calls the action.
4. **Session effect** — the new role takes effect on the user's next session (when the JWT is refreshed or on next sign-in).
5. **Write tests** — change role from `ACADEMIC_STAFF` to `ADMISSIONS_STAFF` (assert DB updated + audit log), assert next session has new role.

---

## US-05: Manage Academic Programmes

**As a** system administrator  
**I want** to create and deactivate academic programmes  
**So that** the system reflects the institution's current programme offerings

### TDD Focus
- **Test**: Create a new programme; assert it appears in the applicant form programme dropdown.
- **Test**: Deactivate a programme; assert it no longer appears in dropdowns for new applicants.
- **Test**: Assert existing applicants on the deactivated programme are not affected.

### Acceptance Criteria
- [ ] New programmes appear in applicant record dropdowns and filters.
- [ ] Deactivated programmes do not appear in dropdowns for new records.
- [ ] Existing applicants linked to deactivated programmes retain their data.

### Implementation Steps
1. **Create `createProgramme` and `deactivateProgramme` server actions** — `requireRole('SYSTEM_ADMINISTRATOR')`. `createProgramme` accepts `name`, `code`, `isActive = true`. `deactivateProgramme` sets `isActive = false`.
2. **Build the Programmes management tab** — inside the Admin page, a "Programmes" tab with a shadcn `Table` listing all programmes (name, code, status badge, action dropdown). "+ Add Programme" button opens an inline form or `Dialog`.
3. **Filter deactivated from dropdowns** — in applicant creation and edit forms, only show programmes where `isActive === true`.
4. **Preserve existing data** — do NOT delete deactivated programmes; just hide from selection. Existing applicants retain their programme link.
5. **Write tests** — create programme (assert appears in dropdowns), deactivate (assert hidden from new applicant form), assert existing applicant on deactivated programme retains data.

> 📎 Refer to `wireframes.md` §"Tab 3 — Programmes" for table layout and inline add pattern.

---

## US-06: Manage Dioceses

**As a** system administrator  
**I want** to add and edit dioceses  
**So that** the diocese list reflects current ecclesiastical geography

### TDD Focus
- **Test**: Add a new diocese; assert it appears in applicant list filters and reports.
- **Test**: Edit a diocese name; assert the change is reflected in filters and applicant records.

### Acceptance Criteria
- [ ] New dioceses appear in applicant list filters and report groupings.
- [ ] Edited diocese names are reflected throughout the system.

### Implementation Steps
1. **Create `createDiocese` and `updateDiocese` server actions** — `requireRole('SYSTEM_ADMINISTRATOR')`. `createDiocese` accepts `name`. `updateDiocese` accepts `id` and `name`.
2. **Build the Dioceses management tab** — inside the Admin page, a "Dioceses" tab with a `Table` listing all dioceses (name, applicant count, edit action). Inline edit: click diocese name to reveal an `Input`, save with Enter or blur.
3. **Propagate name changes** — since dioceses are referenced by ID (foreign key), renaming the diocese automatically reflects in all filters, reports, and applicant records.
4. **Write tests** — add a diocese (assert appears in applicant list filters and reports), edit name (assert change reflected in filters and applicant records).

> 📎 Refer to `wireframes.md` §"Tab 4 — Dioceses" for table and inline edit pattern.

---

## US-07: Configure Document Types

**As a** system administrator  
**I want** to manage the list of available document types for the document checklist  
**So that** the institution can adapt the required documents over time

### TDD Focus
- **Test**: Add a new document type; create a new applicant; assert the new type appears in their document checklist.
- **Test**: Assert existing applicants retain their current checklist (not retroactively modified).

### Acceptance Criteria
- [ ] New document types appear in the checklist for new applicants.
- [ ] Existing applicants are not retroactively affected.

### Implementation Steps
1. **Create `createDocumentType` and `updateDocumentType` server actions** — `requireRole('SYSTEM_ADMINISTRATOR')`. `createDocumentType` accepts `name`, `isRequired`, `isSensitive`.
2. **Build the Document Types management tab** — inside the Admin page, a "Document Types" tab with a `Table` listing all document types (name, required badge, sensitive badge, action dropdown). "+ Add Type" button.
3. **New types apply to new applicants only** — when a new applicant is created, their document checklist is populated from the current active `DocumentType` records. Existing applicants are not retroactively modified.
4. **Write tests** — add a document type, create a new applicant (assert new type in their checklist), check existing applicant (assert unchanged).

> 📎 Refer to `wireframes.md` §"Tab 5 — Document Types" for table layout.

---

## US-08: Manage Admissions Years

**As a** system administrator  
**I want** to create new admissions years  
**So that** the system can track applicants across multiple intake cycles

### TDD Focus
- **Test**: Create a new admissions year; assert it appears in all admissions year filters and dropdowns.
- **Test**: Create an applicant for the new year; assert the applicant is linked to it.

### Acceptance Criteria
- [ ] New admissions years appear in all year-based filters and dropdowns.
- [ ] Applicants can be created for the new admissions year.

### Implementation Steps
1. **Create `createAdmissionsYear` server action** — `requireRole('SYSTEM_ADMINISTRATOR')`. Accept `label` (e.g., "2025/26"), `startDate`, `endDate`.
2. **Build the Admissions Years management tab** — inside the Admin page, a "Years" tab with a `Table` listing all years (label, date range, applicant count, active badge). "+ Add Year" button opens a `Dialog` with label and date inputs.
3. **Wire to dropdowns and filters** — the new year immediately appears in all admissions year `Select` dropdowns and filter controls across the app.
4. **Write tests** — create a year (assert appears in all year filters/dropdowns), create an applicant for the new year (assert linked correctly).

> 📎 Refer to `wireframes.md` §"Tab 6 — Admissions Years" for table layout.

---

## US-09: Audit Log Viewer

**As a** system administrator  
**I want** to view a read-only audit log filterable by entity type, action, user, and date range  
**So that** I can review all changes to the system for compliance and troubleshooting

### TDD Focus
- **Test**: Seed multiple audit log entries; render the viewer; assert all entries display: `entityType`, `entityId`, `action`, `previousValue`, `newValue`, `performedByUserId`, `performedAt`.
- **Test**: Apply a filter by entity type; assert only matching entries are shown.
- **Test**: Apply a date range filter; assert only entries within the range are shown.

### Acceptance Criteria
- [ ] The viewer displays all required fields.
- [ ] Filtering by entity type, action, user, and date range works correctly.
- [ ] Entries are read-only — no edit or delete actions are available.

### Implementation Steps
1. **Build the Audit Log tab** — inside the Admin page, an "Audit Log" tab with a `Table` showing all audit entries.
2. **Display columns** — `performedAt` (formatted datetime), `entityType`, `entityId` (linkable to the entity detail page), `action`, `previousValue`, `newValue`, `performedByUserId` (show user name via join).
3. **Add filters** — filter bar with: Entity Type (`Select`), Action (`Select`), User (`Combobox`), Date Range (`DatePickerWithRange`). Filters apply server-side via URL search params.
4. **Pagination** — server-side pagination (50 per page). Display total count.
5. **Read-only enforcement** — no edit or delete buttons in the UI. No action column.
6. **Write tests** — seed audit entries, render viewer (assert all fields displayed), apply entity type filter (assert narrowing), apply date range (assert only matching entries shown).

### Playwright E2E Tests
Add to `e2e/f08-admin.spec.ts`:
1. **Audit log tab renders** — sign in as Dave; navigate to `/admin`; click the "Audit Log" tab; assert a table of audit entries is displayed with columns: Date, Entity Type, Entity ID, Action, Previous Value, New Value, Performed By.
2. **Filter by entity type** — select an entity type filter (e.g., "Applicant"); assert the table narrows to show only matching entries.
3. **Filter by date range** — select a date range; assert only entries within the range are displayed.
4. **Read-only — no edit/delete controls** — assert no edit or delete buttons are rendered in any table row. Assert no bulk action checkboxes are present.
5. **Pagination** — if there are >50 seeded entries, assert pagination controls are visible; click "Next"; assert new entries are displayed.

> 📎 Refer to `wireframes.md` §"Tab 7 — Audit Log" for table layout, filter bar, and read-only styling.

---

## US-10: Audit Log Immutability

**As a** system  
**I want** audit log entries to be immutable — no editing or deletion through the UI or server actions  
**So that** the audit trail is trustworthy

### TDD Focus
- **Test**: Attempt to call an update or delete action on an audit log entry; assert it is rejected.
- **Test**: Assert no edit or delete buttons are rendered in the viewer UI.

### Acceptance Criteria
- [ ] No edit or delete endpoints exist for audit log entries.
- [ ] The viewer UI does not render edit or delete controls.

### Implementation Steps
1. **No update/delete server actions** — do NOT create any server actions for updating or deleting `AuditLog` records. The Prisma model should have no exposed mutation methods beyond `create`.
2. **No API routes for mutation** — ensure no API route accepts `PUT`, `PATCH`, or `DELETE` for audit log entries.
3. **UI enforcement** — the audit log viewer renders no edit or delete buttons. No row actions dropdown. No bulk actions.
4. **Database-level protection** (optional) — consider a PostgreSQL trigger or policy that prevents `UPDATE` and `DELETE` on the `AuditLog` table for additional security.
5. **Write tests** — attempt to call a hypothetical update/delete action on an audit log entry (assert rejected / no such action exists); render the viewer UI (assert no edit or delete controls rendered).
