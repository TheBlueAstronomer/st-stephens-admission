# F02 — Applicant Record Management: User Stories

> Each story is a vertical TDD slice. Stories are ordered by dependency. Depends on F01 (schema, auth, RBAC).

---

## US-01: Create Applicant Record

**As an** admissions staff member  
**I want** to create a new applicant record by entering the required enquiry-stage fields  
**So that** every enquiry is captured in the system with a unique applicant ID and `ENQUIRY` status

### TDD Focus
- **Test**: Call the create-applicant server action with valid enquiry fields; assert a record is created with a unique `applicantId` and status `ENQUIRY`.
- **Test**: Call with missing required fields; assert a validation error is returned.
- **Test**: Call with a duplicate email; assert the duplicate is flagged (warning, not hard block per PRD).

### Acceptance Criteria
- [x] A new applicant record is created with all enquiry-stage required fields.
- [x] The system auto-generates a unique `applicantId`.
- [x] The initial status is set to `ENQUIRY`.
- [x] An `AuditLog` entry is created for the creation event.
- [x] Missing required fields return a clear validation error.

### Implementation Steps
1. **Create a Zod validation schema** — `src/lib/validations/applicant.ts` defining all required enquiry-stage fields (legal name, email, diocese, programme, admissions year).
2. **Create the `createApplicant` server action** — `src/app/(staff)/applicants/actions.ts`. Apply `requireRole('ADMISSIONS_STAFF')`. Validate input with Zod, generate a unique `applicantId` (e.g., `SSH-{year}-{sequential}`), set status to `ENQUIRY`, and insert via Prisma.
3. **Implement duplicate email detection** — query by email before insert; if found, return a warning (soft flag, not hard block per PRD).
4. **Create an `AuditLog` entry** in the same transaction — record `entityType: 'Applicant'`, `action: 'CREATED'`.
5. **Build the Create Applicant UI** — a right-side `Sheet` (480px) triggered by "+ New Applicant" button. Use React Hook Form + Zod resolver, shadcn `Form`, `Input`, `Select`, `Calendar` components. Match wireframe sections (Personal, Address, Ecclesial, BAP, Programme).
6. **Write tests** — valid creation (assert record + audit), missing fields (assert Zod errors), duplicate email (assert warning returned).

> 📎 Refer to `wireframes.md` §"Screen 2 — Create Applicant" for Sheet layout and validation feedback patterns.

---

## US-02: Applicant List Screen — Display and Columns

**As an** admissions staff member  
**I want** to see a paginated list of all applicants with key columns (name, status, programme, diocese, BAP status, interview date, offer status, registration status, document completion)  
**So that** I can quickly scan the admissions pipeline

### TDD Focus
- **Test**: Seed the database with applicants in various states; render the list; assert all required columns are present and data is accurate.
- **Test**: Assert the list links each row to the applicant detail screen.

### Acceptance Criteria
- [x] The list displays all required columns from PRD §5.3.
- [x] Each row links to the applicant detail screen.
- [x] The list is paginated for performance.

### Implementation Steps
1. **Create the applicant list page** — `src/app/(staff)/applicants/page.tsx`.
2. **Build the data-fetching server component** — query `Applicant` with `include: { ecclesialProfile: true, bapStatus: true, programme: true }`. Paginate with `skip`/`take` (20 per page).
3. **Build the data table** — use shadcn `Table` with sortable headers (`Toggle`). Columns: Name, Status (colour-coded `Badge` per wireframe palette), Programme, Diocese, BAP, Interview Date, Offer, Registration, Docs. Each row clickable → `/applicants/[id]`.
4. **Add page header** — eyebrow tag (admissions year), H1 "Applicants", action buttons ("+ New Applicant", "↑ Import").
5. **Add skeleton loading** — shadcn `Skeleton` replacing table rows on initial load.
6. **Add pagination** — shadcn `Pagination` component, server-side cursor/offset.
7. **Write tests** — seed DB, render list, assert all required columns present and data accurate; assert row links to detail screen.

### Playwright E2E Tests
Create `e2e/f02-applicant-list.spec.ts`:
1. **List page loads with columns** — sign in as Alice (ADMISSIONS_STAFF); navigate to `/applicants`; assert the table headers contain: Name, Status, Programme, Diocese. Assert at least one applicant row is visible (from seed data).
2. **Row links to detail** — click the first applicant row; assert the browser navigates to `/applicants/{id}` and the detail page loads.
3. **Pagination** — seed >20 applicants; assert pagination controls are visible; click "Next"; assert the URL updates and a different set of rows appears.
4. **"+ New Applicant" button visible** — assert the "New Applicant" action button is present for ADMISSIONS_STAFF.

> 📎 Refer to `wireframes.md` §"Screen 1 — Applicant List" for layout, status colour palette, and animation.

---

## US-03: Applicant List — Search

**As an** admissions staff member  
**I want** to search applicants by name, email, applicant ID, diocese, or DDO  
**So that** I can quickly find a specific applicant

### TDD Focus
- **Test**: Seed applicants; search by partial name; assert only matching applicants are returned.
- **Test**: Search by email; assert correct match.
- **Test**: Search by applicant ID; assert exact match.

### Acceptance Criteria
- [x] Search by name returns partial matches (case-insensitive).
- [x] Search by email returns matching applicant(s).
- [x] Search by applicant ID returns the exact match.
- [x] Search by diocese or DDO name returns matching applicants.

### Implementation Steps
1. **Add a search `Input`** to the filter bar — Phosphor `MagnifyingGlass` icon, `rounded-full` pill style. Debounce input (300ms).
2. **Implement server-side search** — in the applicant list query, add a `where` clause that matches `OR` across `legalName`, `preferredName`, `email`, `applicantId`, diocese name, and DDO name using `contains` (case-insensitive with Prisma `mode: 'insensitive'`).
3. **Pass search as a URL search param** — `?search=...` so it's shareable and survives page refresh.
4. **Write tests** — seed applicants, search by partial name (assert match), by email (assert match), by applicant ID (assert exact match), by diocese (assert match).

### Playwright E2E Tests
Add to `e2e/f02-applicant-list.spec.ts`:
1. **Search by name** — type a seeded applicant’s partial name into the search input; assert the list narrows to show only matching applicant(s).
2. **Search by email** — type a seeded applicant’s email; assert the matching row appears.
3. **Search clears** — clear the search input; assert the full list is restored.

---

## US-04: Applicant List — Filters

**As an** admissions staff member  
**I want** to filter the applicant list by status, admissions year, programme, accommodation need, and document completion  
**So that** I can focus on specific subsets of applicants

### TDD Focus
- **Test**: Seed applicants across multiple years and statuses; apply each filter; assert only matching applicants are returned.
- **Test**: Combine multiple filters; assert intersection behaviour.

### Acceptance Criteria
- [x] Each filter independently narrows the list correctly.
- [x] Multiple filters combine as an AND operation.
- [x] Filter state is reflected in the UI controls.

### Implementation Steps
1. **Add filter dropdowns** to the sticky filter bar — shadcn `Select` for single-value or `Popover` + `Checkbox` list for multi-value. Filters: Status, Year, Programme, Diocese, Document Completion.
2. **Implement server-side filtering** — compose `where` clauses from URL search params. Multiple filters combine as AND.
3. **Add active filter chips** — shadcn `Badge` with `×` remove button. Animate chip appear: `scale-0 opacity-0` → `scale-100 opacity-100`.
4. **Add CSV export button** — `Button` variant `ghost` with Phosphor `DownloadSimple`, triggers export server action with current filters.
5. **Persist filter state in URL** — use `useSearchParams()` so filters survive page refresh.
6. **Write tests** — seed applicants across statuses/years/programmes; apply each filter independently (assert narrowing); combine filters (assert intersection).

### Playwright E2E Tests
Add to `e2e/f02-applicant-list.spec.ts`:
1. **Filter by status** — select a status filter value (e.g., `ENQUIRY`); assert only applicants with that status are displayed.
2. **Filter by programme** — select a programme; assert the list narrows.
3. **Combine filters** — apply status + programme; assert the intersection is shown.
4. **Clear filters** — click the clear/reset action; assert the full list is restored.
5. **Filter state persists in URL** — apply a filter; reload the page; assert the filter is still active.

> 📎 Refer to `wireframes.md` §"Screen 1" for filter bar layout and sticky scroll behaviour.

---

## US-05: Applicant Detail Screen

**As an** admissions staff member  
**I want** to view the full applicant detail screen with all required sections  
**So that** I have a single view of every aspect of an applicant's record

### TDD Focus
- **Test**: Seed a fully-populated applicant; render the detail screen; assert all sections from PRD §5.4 are present with accurate data.
- **Test**: Seed a minimal applicant (enquiry stage); assert sections for later stages show appropriate empty/placeholder state.

### Acceptance Criteria
- [x] The detail screen renders sections: personal info, ecclesial info, academic programme, BAP status, admissions status, interview summary, offer summary, registration status, accommodation, document checklist, internal notes, audit timeline.
- [x] Data displayed matches the database record accurately.

### Implementation Steps
1. **Create the detail page** — `src/app/(staff)/applicants/[id]/page.tsx`. Fetch the full applicant with all relations.
2. **Build the asymmetrical bento layout** — left column (280px sticky): avatar, name, applicant ID, large status badge, progress stepper, quick actions, SharePoint link, admissions year. Right column: tabbed content.
3. **Implement tabs** — shadcn `Tabs` with underline variant. Tabs: Personal, Ecclesial, BAP, Interview, Offer, Registration, Documents, Notes, Timeline.
4. **Build each tab panel** — render data from the appropriate relation. Personal: key-value `dl > dt + dd` layout with edit icon on hover. BAP: stage statuses, dates, exception toggle.
5. **Build the progress stepper** — custom component with Phosphor `CheckCircle` (filled) for completed stages, `Circle` for pending.
6. **Implement quick actions** — contextually enabled/disabled based on current status. Disabled buttons show `Tooltip` explaining why.
7. **Write tests** — seed a fully-populated applicant (assert all sections present), seed a minimal applicant (assert empty states render).

### Playwright E2E Tests
Create `e2e/f02-applicant-detail.spec.ts`:
1. **Detail page loads** — sign in as Alice; navigate to a seeded applicant’s detail page; assert the applicant’s name, status badge, and applicant ID are visible.
2. **Tabs render** — assert tab navigation is present (Personal, Ecclesial, BAP, Interview, Offer, Registration, Documents, Notes, Timeline). Click each tab; assert the corresponding panel content loads.
3. **Progress stepper** — assert the progress stepper component is visible with the correct stage highlighted.
4. **Quick actions present** — assert contextual quick action buttons are visible (e.g., "Schedule Interview", "Record Offer" depending on applicant status).

> 📎 Refer to `wireframes.md` §"Screen 3 — Applicant Detail" for bento layout, tab content, and animation.

---

## US-06: Edit Applicant Fields

**As an** admissions staff member  
**I want** to edit applicant fields inline or via edit forms  
**So that** I can correct or update applicant information as it becomes available

### TDD Focus
- **Test**: Update an applicant's email via the server action; assert the database is updated and an `AuditLog` entry records the previous and new value.
- **Test**: Attempt an edit as `ACADEMIC_STAFF`; assert it is rejected.

### Acceptance Criteria
- [x] Admissions staff can edit all applicant fields.
- [x] Each edit creates an `AuditLog` entry with `previousValue` and `newValue`.
- [x] Academic staff cannot edit applicant records (403).
- [x] Senior leadership cannot edit applicant records (read-only).

### Implementation Steps
1. **Create the `updateApplicant` server action** — `requireRole('ADMISSIONS_STAFF')`. Accept a partial applicant update, validate with Zod.
2. **Implement audit logging** — for each changed field, create an `AuditLog` entry with `previousValue` and `newValue` (compare before/after).
3. **Build inline edit UI** — each tab section has an "Edit" button that reveals the form (shadcn `Collapsible`). Save and cancel buttons.
4. **Enforce role restrictions** — in the server action, reject calls from `ACADEMIC_STAFF` and `SENIOR_LEADERSHIP`. In the UI, conditionally hide edit buttons based on `session.user.role`.
5. **Write tests** — update a field as `ADMISSIONS_STAFF` (assert DB updated + audit log), attempt update as `ACADEMIC_STAFF` (assert 403), attempt as `SENIOR_LEADERSHIP` (assert 403).

---

## US-07: Status Transition — BAP Gate

**As a** system  
**I want** to block status transitions past `ENQUIRY` when Stage 1 BAP is not `COMPLETED` or `SCHEDULED`  
**So that** the admissions workflow enforces the BAP prerequisite

### TDD Focus
- **Test**: Attempt to transition from `ENQUIRY` to `VISIT_INVITED` with BAP `INCOMPLETE`; assert it is blocked with a clear error.
- **Test**: Same transition with BAP `COMPLETED`; assert it succeeds.
- **Test**: Same transition with BAP `INCOMPLETE` but `hasStageOneBAPException = true` and a reason; assert it succeeds.

### Acceptance Criteria
- [x] Status advancement past `ENQUIRY` is blocked when BAP is not `COMPLETED` or `SCHEDULED`.
- [x] The block message clearly states the reason.
- [x] An exception with a recorded reason bypasses the block.
- [x] The exception is visible in the audit timeline.

### Implementation Steps
1. **Create a `validateBAPGate()` utility** — `src/lib/business-rules/bap-gate.ts`. Accepts the applicant's BAP status and exception flag. Returns `{ allowed: boolean, reason?: string }`.
2. **Integrate into the status-update server action** — before transitioning past `ENQUIRY`, call `validateBAPGate()`. If blocked, return the reason.
3. **Handle the exception path** — if `hasStageOneBAPException === true` and `bapExceptionReason` is non-empty, bypass the gate. Record the exception in the `AuditLog`.
4. **Build UI feedback** — when the BAP gate blocks, show a shadcn `Alert` variant `destructive` with the reason. Show the exception toggle (`Switch` + `Textarea` conditional reveal) in the BAP tab.
5. **Write tests** — attempt transition with BAP `INCOMPLETE` (assert blocked), with BAP `COMPLETED` (assert success), with exception (assert success + audit log).

> 📎 Refer to `spec.md` §"BAP gate" for business rule details.

---

## US-08: Status Transition — Server-Side Guard

**As a** system  
**I want** all status transitions to be validated server-side regardless of UI state  
**So that** business rules cannot be bypassed via direct API calls

### TDD Focus
- **Test**: Call the update-status server action with an invalid transition (e.g., `ENQUIRY` → `CONFIRMED_ORDINAND`); assert it is rejected.
- **Test**: Call with a valid transition; assert it succeeds and creates an `AuditLog` entry.

### Acceptance Criteria
- [x] Only valid status transitions as defined by the workflow are permitted.
- [x] Invalid transitions return a descriptive error.
- [x] All status changes create `AuditLog` entries.

### Implementation Steps
1. **Define a valid transitions map** — `src/lib/business-rules/status-transitions.ts`. e.g., `ENQUIRY → [VISIT_INVITED]`, `VISIT_INVITED → [INTERVIEW_SCHEDULED]`, etc.
2. **Create the `updateApplicantStatus` server action** — `requireRole('ADMISSIONS_STAFF')`. Look up current status, check against the transitions map, reject invalid transitions with a descriptive error.
3. **Run all prerequisite gates** — call `validateBAPGate()`, check interview completion gate (F03), offer gate (F04), etc. based on the target status.
4. **Create `AuditLog` entry** — record `previousValue` (old status), `newValue` (new status), `performedByUserId`.
5. **Build the status advance UI** — "Advance Status" button with `AlertDialog` confirmation: "Are you sure you want to advance to X?". Scale-in animation per wireframe.
6. **Write tests** — invalid transition (assert rejection + descriptive error), valid transition (assert success + audit log).

---

## US-09: Import Applicants from CSV/XLSX

**As an** admissions staff member  
**I want** to import applicant records from a CSV or XLSX file  
**So that** existing spreadsheet data can be migrated into the system

### TDD Focus
- **Test**: Upload a valid CSV with 3 rows; assert 3 applicant records are created with correct data.
- **Test**: Upload a CSV with a duplicate email row; assert the duplicate is flagged in the error report, not silently created.
- **Test**: Upload a CSV with invalid/missing required fields in 1 row; assert valid rows succeed and the invalid row appears in the error summary.

### Acceptance Criteria
- [ ] Valid rows create applicant records with correct field mapping. *(not yet implemented)*
- [ ] Duplicate applicants (by email or applicant ID) are flagged, not created. *(not yet implemented)*
- [ ] Invalid rows produce a per-row error summary. *(not yet implemented)*
- [ ] Both CSV and XLSX formats are supported. *(not yet implemented)*

### Implementation Steps
1. **Create the import server action** — `src/app/(staff)/applicants/actions.ts` → `importApplicants`. Accept a `File` (CSV or XLSX). `requireRole('ADMISSIONS_STAFF')`.
2. **Parse the file** — use a library like `papaparse` (CSV) or `xlsx` (XLSX). Map columns to Prisma model fields.
3. **Validate each row** — run through the same Zod schema as manual creation. Collect per-row errors.
4. **Detect duplicates** — check email and applicant ID against existing records. Flag duplicates in the error report.
5. **Batch insert valid rows** — use `prisma.applicant.createMany()` or a loop with `prisma.$transaction()` for audit logging. Create `AuditLog` entries for each.
6. **Return a summary** — `{ created: N, duplicates: [...], errors: [...] }`.
7. **Build the import dialog UI** — triggered by "↑ Import" button. `Dialog` with file drop zone (`onDragOver`/`onDrop`), `Progress` bar during upload, and a result summary.
8. **Write tests** — valid CSV (assert records created), duplicate row (assert flagged), invalid row (assert error summary), XLSX format (assert same behaviour).

> 📎 Refer to `wireframes.md` §"Screen 1" for import dialog component pattern.

---

## US-10: Export Applicant List as CSV

**As an** admissions staff member  
**I want** to export the currently filtered applicant list as a CSV  
**So that** I can share applicant data with colleagues or use it in external tools

### TDD Focus
- **Test**: Seed applicants; apply a filter; call the export action; assert the CSV contains only filtered applicants and all visible columns.

### Acceptance Criteria
- [x] The exported CSV contains all visible columns.
- [x] The export respects the current filter state.
- [x] The file is named descriptively (e.g., `applicants-2025-enquiry.csv`).

### Implementation Steps
1. **Create the export server action** — `exportApplicants`. Accept current filter params. `requireRole('ADMISSIONS_STAFF')`.
2. **Query the filtered applicant list** — apply the same `where` clauses as the list page.
3. **Generate CSV** — use `papaparse` or manual string building. Include all visible columns.
4. **Return as a downloadable response** — set `Content-Type: text/csv`, `Content-Disposition: attachment; filename="ssh-applicants-{year}-{status}-{date}.csv"`.
5. **Wire to the UI** — "↓ Export CSV" button in the filter bar, `Button` variant `ghost` with Phosphor `DownloadSimple`.
6. **Write tests** — seed + filter + export; assert CSV contains only filtered applicants and all columns.

---

## US-11: Read-Only Access for Academic Staff and Senior Leadership

**As an** academic staff member or senior leader  
**I want** to view the applicant list and detail screen without edit controls  
**So that** I can review applicant information without risk of accidental changes

### TDD Focus
- **Test**: Render the applicant list as `ACADEMIC_STAFF`; assert no create/edit/import/export buttons are present.
- **Test**: Render the detail screen as `SENIOR_LEADERSHIP`; assert no edit actions are available.

### Acceptance Criteria
- [x] Academic staff see the list and detail in read-only mode.
- [x] Senior leadership see the list and detail in read-only mode.
- [x] No create, edit, import, or status-change actions are available to these roles.

### Implementation Steps
1. **Conditionally render action buttons** — in the list and detail pages, check `session.user.role`. For `ACADEMIC_STAFF` and `SENIOR_LEADERSHIP`, hide: "+ New Applicant", "↑ Import", "↓ Export", edit buttons, status change buttons.
2. **Server-side enforcement** — all mutation server actions already use `requireRole('ADMISSIONS_STAFF')`, so direct calls are blocked.
3. **Academic staff specifics** — show the applicant list with read-only rows; on detail screen, show tabs but without edit affordances.
4. **Senior leadership specifics** — same as academic staff but with access to more routes (dashboard, reports).
5. **Write tests** — render list as `ACADEMIC_STAFF` (assert no create/edit/import buttons), render detail as `SENIOR_LEADERSHIP` (assert no edit actions).

### Playwright E2E Tests
Create `e2e/f02-read-only-access.spec.ts`:
1. **ACADEMIC_STAFF list — no mutation controls** — sign in as Bob (ACADEMIC_STAFF); navigate to `/applicants`; assert "+ New Applicant" button is NOT visible; assert "Import" button is NOT visible.
2. **ACADEMIC_STAFF detail — no edit buttons** — navigate to a seeded applicant detail; assert no "Edit" buttons or "Advance Status" buttons are visible.
3. **SENIOR_LEADERSHIP list — no mutation controls** — sign in as Carol (SENIOR_LEADERSHIP); navigate to `/applicants` (or assert redirect if no access); if accessible, assert no create/edit/import actions.
4. **SENIOR_LEADERSHIP detail — read only** — navigate to a seeded applicant detail; assert no edit affordances.
