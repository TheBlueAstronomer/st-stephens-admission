# F07 — Dashboard and Reporting

## Goal

Provide an admissions pipeline dashboard and a set of institutional reports that give admissions staff, academic staff, and senior leadership clear, real-time visibility into applicant numbers, offer outcomes, accommodation demand, and document completeness, with CSV export on all reports.

## Scope

- Admissions dashboard (§5.2, §4.8): total enquiries, applicants by workflow stage, offers made, registrations received, confirmed ordinands, accommodation demand summary, and filters for admissions year, programme, status, and diocese.
- Reports screen (§5.9) with the following reports (§7):
  - **Admissions Pipeline Report** (§7.1): applicant count by status, admissions year, and programme.
  - **Diocese Distribution Report** (§7.2): applicant count, offer count, and confirmed ordinand count by diocese.
  - **BAP Status Report** (§7.3): Stage 1 and Stage 2 BAP status distribution; applicants blocked due to missing BAP.
  - **Offers versus Registrations Report** (§7.4): conditional offers, unconditional offers, accepted offers, registrations received, and confirmed ordinands.
  - **Accommodation Demand Report** (§7.5): total accommodation demand, single rooms, family units, family unit sizes, term-time versus full-year breakdown.
  - **Missing Documents Report** (§7.6): applicants with outstanding required documents; missing documents per applicant; documents waived.
- Export all reports and the filtered applicant list as CSV (§7.7); XLSX export is a stretch goal.
- All dashboard data must reflect the current state of the database without stale caching.

## Acceptance Criteria

- [ ] The admissions dashboard loads and displays accurate totals for all required metrics, updating when underlying applicant data changes.
- [ ] Dashboard filters (admissions year, programme, status, diocese) correctly narrow the displayed data.
- [ ] Each of the six reports renders accurate data matching the live database state.
- [ ] The Accommodation Demand Report correctly calculates total accommodation demand as single rooms plus family units and shows the term-time versus full-year split.
- [ ] The Missing Documents Report correctly identifies applicants with at least one outstanding required document that is not waived.
- [ ] Each report can be exported as a CSV containing all displayed columns and rows; the exported file is named descriptively.
- [ ] Senior leadership users can access the dashboard and all reports in read-only mode without seeing applicant-edit controls.
- [ ] Applicants users and unauthenticated requests cannot access the dashboard or reports.
- [ ] Unit tests cover report query logic for each report type; integration tests cover dashboard rendering, filter application, and CSV export for at least three report types.
