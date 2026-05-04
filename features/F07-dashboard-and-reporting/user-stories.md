# F07 — Dashboard and Reporting: User Stories

> Each story is a vertical TDD slice. Stories are ordered by dependency. Depends on F01 (auth, RBAC), F02 (applicants), F03 (interviews), F04 (offers/registration), F05 (documents).

---

## US-01: Admissions Dashboard — Display Totals

**As an** admissions staff member or senior leader  
**I want** the dashboard to display current totals for enquiries, applicants by workflow stage, offers made, registrations received, confirmed ordinands, and accommodation demand  
**So that** I have a real-time overview of the admissions pipeline

### TDD Focus
- **Test**: Seed the database with applicants across all stages; render the dashboard; assert each metric is accurate.
- **Test**: Add a new applicant; re-render; assert totals update.

### Acceptance Criteria
- [x] Dashboard displays all required metrics from PRD §5.2.
- [x] Totals reflect the current state of the database (no stale cache).
- [x] Accommodation demand summary is included.

### Implementation Steps
1. **Create the dashboard page** — `src/app/(staff)/dashboard/page.tsx`. Fetch all aggregate metrics server-side.
2. **Build the KPI cards row** — 4–6 shadcn `Card` components in a responsive grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-6`). Each card: metric label (muted small caps), large number, Phosphor icon, percentage change badge with `TrendUp`/`TrendDown` icons.
3. **Compute metrics** — create `src/lib/queries/dashboard.ts` with queries: total enquiries, applicants per stage, offers made, registrations received, confirmed ordinands, accommodation demand (single + family + total).
4. **Build the pipeline chart** — use a charting library (e.g., `recharts` or `nivo`) for a horizontal bar chart showing applicant counts by status. Colour bars per status palette from wireframes.
5. **Build the accommodation summary** — small card or table showing single rooms, family units, total demand, and term-time vs full-year split.
6. **Ensure real-time data** — no stale cache; queries run on each page load (or use `revalidate: 0`).
7. **Write tests** — seed applicants across all stages, render dashboard, assert each metric matches seeded data; add an applicant, re-render, assert totals update.

### Playwright E2E Tests
Create `e2e/f07-dashboard.spec.ts`:
1. **Dashboard loads with KPI cards** — sign in as Alice (ADMISSIONS_STAFF); navigate to `/dashboard`; assert KPI metric cards are visible showing: Enquiries, Applicants, Offers, Registrations, Confirmed Ordinands, Accommodation Demand.
2. **Pipeline chart renders** — assert a pipeline chart or bar chart element is visible on the page.
3. **Accommodation summary visible** — assert the accommodation demand summary card/table is rendered.
4. **Non-zero metrics from seed data** — assert at least one KPI card shows a non-zero value (from seed data).

> 📎 Refer to `wireframes.md` §"Screen 1 — Admissions Dashboard" for KPI card layout, chart placement, and colour palette.

---

## US-02: Dashboard Filters

**As an** admissions staff member  
**I want** to filter the dashboard by admissions year, programme, status, and diocese  
**So that** I can focus on specific segments of the pipeline

### TDD Focus
- **Test**: Seed applicants across years, programmes, and dioceses; apply each filter independently; assert totals narrow correctly.
- **Test**: Combine multiple filters; assert intersection behaviour.

### Acceptance Criteria
- [x] Each filter independently narrows the displayed data.
- [x] Multiple filters combine as AND.
- [x] Clearing filters restores the full view.

### Implementation Steps
1. **Add a filter bar** — below the KPI cards. Shadcn `Select` dropdowns for: Admissions Year, Programme, Status, Diocese.
2. **Server-side filtering** — pass filter values as URL search params. The dashboard queries accept these params and narrow all metrics accordingly.
3. **Add a "Clear Filters" button** — resets all filters and refreshes the page.
4. **Preserve filter state** — use `useSearchParams()` so filters survive page refresh.
5. **Write tests** — seed applicants across years/programmes/dioceses; apply each filter (assert metrics narrow correctly); combine filters (assert AND intersection); clear filters (assert full totals).

### Playwright E2E Tests
Add to `e2e/f07-dashboard.spec.ts`:
1. **Filter dropdowns present** — assert filter controls are visible: Admissions Year, Programme, Status, Diocese.
2. **Apply a filter** — select a specific admissions year from the dropdown; assert the KPI card values change (or remain if only one year in seed data). Assert the URL updates with the filter param.
3. **Clear filters** — click "Clear Filters"; assert all filter dropdowns reset and KPI values restore to unfiltered totals.
4. **Filter persists on reload** — apply a filter; reload the page; assert the filter is still active in the dropdown and the URL.

---

## US-03: Admissions Pipeline Report

**As an** admissions staff member  
**I want** a report showing applicant counts by status, admissions year, and programme  
**So that** I can see the distribution across the pipeline

### TDD Focus
- **Test**: Seed applicants; render the pipeline report; assert counts match the seeded data grouped by status, year, and programme.

### Acceptance Criteria
- [x] Report shows applicant count by status.
- [x] Report shows applicant count by admissions year.
- [x] Report shows applicant count by programme.

### Implementation Steps
1. **Create the reports page** — `src/app/(staff)/reports/page.tsx` with a sidebar navigation listing all 6 reports.
2. **Build the Pipeline Report** — `src/app/(staff)/reports/pipeline/page.tsx`. Query applicant counts grouped by status, year, and programme.
3. **Display as a table** — shadcn `Table` with grouping rows. Rows: each status. Columns: Status, Count, % of Total. Add a horizontal bar or progress indicator per row.
4. **Add year and programme sub-breakdowns** — expandable sections or tabs showing counts per year and per programme.
5. **Add CSV export** — "Export CSV" button in the report header. Calls a server action that generates and returns the CSV.
6. **Write tests** — seed applicants, render pipeline report, assert counts match grouped by status/year/programme.

> 📎 Refer to `wireframes.md` §"Screen 2 — Reports" for report navigation, table layout, and export button pattern.

---

## US-04: Diocese Distribution Report

**As a** senior leader  
**I want** a report showing applicant count, offer count, and confirmed ordinand count by diocese  
**So that** I can understand geographic distribution

### TDD Focus
- **Test**: Seed applicants across dioceses with varying offer and confirmation states; render the report; assert counts are correct per diocese.

### Acceptance Criteria
- [x] Report shows applicant count by diocese.
- [x] Report shows offer count by diocese.
- [x] Report shows confirmed ordinand count by diocese.

### Implementation Steps
1. **Build the Diocese Distribution Report** — `src/app/(staff)/reports/diocese/page.tsx`. Query applicant, offer, and confirmed ordinand counts grouped by diocese.
2. **Display as a table** — columns: Diocese Name, Applicant Count, Offer Count, Confirmed Ordinands. Sortable by each column.
3. **Add optional bar chart** — horizontal grouped bar chart showing applicants/offers/confirmed by diocese.
4. **Add CSV export** — same pattern as pipeline report.
5. **Write tests** — seed applicants across dioceses with varying states; render report; assert counts correct per diocese.

---

## US-05: BAP Status Report

**As an** admissions staff member  
**I want** a report showing Stage 1 and Stage 2 BAP status distribution and applicants blocked due to missing BAP  
**So that** I can identify bottlenecks in the BAP process

### TDD Focus
- **Test**: Seed applicants with various BAP statuses; render the report; assert distribution counts match.
- **Test**: Seed an applicant blocked by BAP (incomplete, no exception); assert they appear in the "blocked" list.

### Acceptance Criteria
- [x] Report shows Stage 1 BAP status distribution.
- [x] Report shows Stage 2 BAP status distribution.
- [x] Report lists applicants blocked due to missing BAP information.

### Implementation Steps
1. **Build the BAP Status Report** — `src/app/(staff)/reports/bap-status/page.tsx`. Query BAP stage 1 and stage 2 status distribution.
2. **Display distribution table** — rows: each BAP status value (`INCOMPLETE`, `SCHEDULED`, `COMPLETED`). Columns: Stage 1 Count, Stage 2 Count.
3. **Blocked applicants section** — below the distribution, list applicants where BAP is `INCOMPLETE` and they have no exception. Show: Name, Current Status, BAP Stage 1 Status, Days Since Enquiry.
4. **Add CSV export** — export both the distribution and blocked list.
5. **Write tests** — seed applicants with various BAP statuses; render report (assert distribution counts); seed blocked applicant (assert in blocked list).

---

## US-06: Offers versus Registrations Report

**As a** senior leader  
**I want** a report showing conditional offers, unconditional offers, accepted offers, registrations received, and confirmed ordinands  
**So that** I can track conversion through the offer-to-confirmation funnel

### TDD Focus
- **Test**: Seed applicants at each offer/registration stage; render the report; assert counts match.

### Acceptance Criteria
- [x] Report shows counts for: conditional offers, unconditional offers, accepted offers, registrations received, confirmed ordinands.

### Implementation Steps
1. **Build the Offers vs Registrations Report** — `src/app/(staff)/reports/offers-registrations/page.tsx`. Query counts for each stage of the offer-to-confirmation funnel.
2. **Display as a funnel** — table or funnel chart showing: Conditional Offers → Unconditional Offers → Accepted Offers → Registrations Received → Confirmed Ordinands. Include conversion percentages between stages.
3. **Add CSV export** — same pattern.
4. **Write tests** — seed applicants at each stage; render report; assert counts match.

---

## US-07: Accommodation Demand Report

**As a** senior leader  
**I want** a report showing total accommodation demand, single rooms, family units, family unit sizes, and term-time vs full-year split  
**So that** I can plan accommodation provision

### TDD Focus
- **Test**: Seed applicants with various accommodation requests; render the report; assert total demand equals single rooms + family units.
- **Test**: Assert term-time and full-year breakdowns are correct.
- **Test**: Assert total family unit size is summed correctly.

### Acceptance Criteria
- [x] Total accommodation demand = single rooms + family units.
- [x] Single and family unit counts are correct.
- [x] Term-time vs full-year split is shown.
- [x] Total family unit size is displayed.

### Implementation Steps
1. **Build the Accommodation Demand Report** — `src/app/(staff)/reports/accommodation/page.tsx`. Query `AccommodationRequest` records for confirmed/registered applicants.
2. **Compute metrics** — total demand = single rooms + family units. Break down by duration (term-time vs full-year). Sum family sizes.
3. **Display as a summary card + table** — top: KPI cards (Total Demand, Single Rooms, Family Units, Average Family Size). Below: table with per-applicant rows showing name, type, duration, family size.
4. **Add CSV export** — include both summary and per-applicant data.
5. **Write tests** — seed accommodation requests; render report; assert total = singles + families; assert term/full-year split correct; assert family sizes sum correctly.

---

## US-08: Missing Documents Report

**As an** admissions staff member  
**I want** a report showing applicants with outstanding required documents, the specific missing documents per applicant, and documents waived  
**So that** I can follow up on incomplete documentation

### TDD Focus
- **Test**: Seed applicants with varying document completion; render the report; assert only applicants with outstanding (not waived) required documents are listed.
- **Test**: Assert the missing document list per applicant is accurate.
- **Test**: Assert waived documents are shown separately.

### Acceptance Criteria
- [x] Report lists applicants with at least one outstanding required document.
- [x] Missing documents per applicant are listed.
- [x] Waived documents are shown.

### Implementation Steps
1. **Build the Missing Documents Report** — `src/app/(staff)/reports/missing-documents/page.tsx`. Use the `getMissingDocuments()` query from F05-US-07.
2. **Display as a table** — columns: Applicant Name, Applicant ID, Status, Missing Documents (comma-separated list), Waived Documents. Sortable by name and status.
3. **Add colour coding** — missing documents in amber `Badge`, waived in grey `Badge`.
4. **Add CSV export** — same pattern.
5. **Write tests** — seed applicants with varying doc completion; render report (assert only applicants with outstanding non-waived docs listed); assert missing doc names accurate; assert waived docs shown separately.

---

## US-09: CSV Export for All Reports

**As an** admissions staff member  
**I want** to export any report and the filtered applicant list as a CSV  
**So that** I can share data externally or analyse it in a spreadsheet

### TDD Focus
- **Test**: Trigger CSV export for at least 3 reports (Pipeline, Accommodation, Missing Docs); assert each CSV contains all displayed columns and rows.
- **Test**: Assert the CSV file is named descriptively.

### Acceptance Criteria
- [x] Each of the 6 reports can be exported as CSV.
- [x] The filtered applicant list can be exported as CSV.
- [x] CSV files contain all displayed columns and rows.
- [x] Files are named descriptively.

### Implementation Steps
1. **Create a reusable `exportReportCSV()` utility** — `src/lib/services/csv-export.ts`. Accepts a report name, column definitions, and row data. Generates a CSV string.
2. **Create export server actions** — one per report (or a single parameterised action). `requireRole('ADMISSIONS_STAFF', 'SENIOR_LEADERSHIP')`. Query the report data, generate CSV, return as a downloadable response.
3. **Descriptive filenames** — format: `ssh-{report-name}-{date}.csv` (e.g., `ssh-pipeline-report-2025-01-15.csv`).
4. **Wire export buttons** — each report page has a shadcn `Button` variant `outline` with Phosphor `DownloadSimple` icon in the page header. On click, call the export action and trigger browser download.
5. **Write tests** — for at least 3 reports (Pipeline, Accommodation, Missing Docs), trigger export; assert CSV contains all columns and rows; assert filename is descriptive.

---

## US-10: Role-Based Dashboard Access

**As a** system  
**I want** senior leadership to access the dashboard and reports in read-only mode, and applicants/unauthenticated users to be blocked  
**So that** sensitive data is protected while leadership has visibility

### TDD Focus
- **Test**: Access the dashboard as `SENIOR_LEADERSHIP`; assert 200 and no edit controls are rendered.
- **Test**: Access the dashboard as an unauthenticated user; assert redirect to login.
- **Test**: Access the dashboard as an applicant (if applicant auth exists); assert 403.

### Acceptance Criteria
- [x] Senior leadership can access dashboard and reports in read-only mode.
- [x] Unauthenticated requests are redirected to login.
- [x] No applicant-role access to dashboard or reports.

### Implementation Steps
1. **Route-level RBAC** — in `middleware.ts`, the dashboard and report routes should allow `ADMISSIONS_STAFF`, `SENIOR_LEADERSHIP`, and `SYSTEM_ADMINISTRATOR`. Block `ACADEMIC_STAFF` (unless they need dashboard access — check PRD).
2. **Read-only for senior leadership** — in dashboard/report pages, check `session.user.role`. For `SENIOR_LEADERSHIP`, hide any mutation controls (there shouldn't be any on reports, but ensure no edit actions leak).
3. **Unauthenticated redirect** — already handled by F01-US-04 middleware (redirect to login).
4. **Write tests** — access dashboard as `SENIOR_LEADERSHIP` (assert 200, no edit controls), as unauthenticated (assert redirect to login), as `ACADEMIC_STAFF` (assert 403 or redirect per RBAC rules).

### Playwright E2E Tests
Add to `e2e/f07-dashboard.spec.ts`:
1. **SENIOR_LEADERSHIP access** — sign in as Carol (SENIOR_LEADERSHIP); navigate to `/dashboard`; assert the page loads with KPI cards. Assert no edit/mutation controls are visible.
2. **SENIOR_LEADERSHIP reports access** — navigate to `/reports`; assert the reports page loads.
3. **Unauthenticated redirect** — without signing in, navigate to `/dashboard`; assert redirect to `/login`.
4. **ACADEMIC_STAFF dashboard blocked** — sign in as Bob (ACADEMIC_STAFF); navigate to `/dashboard`; assert a 403/forbidden page or "Access Denied" message is shown.
