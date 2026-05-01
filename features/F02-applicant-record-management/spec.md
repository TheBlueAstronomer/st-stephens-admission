# F02 — Applicant Record Management

## Goal

Allow admissions staff to create, view, edit, and manage the full applicant record through its complete lifecycle, from initial enquiry through confirmed ordinand status. This is the core operational record of the system.

## Scope

- Applicant list screen (§5.3): search by name, email, applicant ID, diocese, and DDO; filters by status, admissions year, programme, accommodation need, and document completion; sortable columns; link to detail screen; export filtered list.
- Applicant detail screen (§5.4): all required sections including personal information, ecclesial information, academic programme, BAP status, current admissions status, visit and interview summary, offer decision summary, registration status, accommodation requirement, document checklist, internal notes, and audit timeline.
- Create applicant record manually with auto-generated unique applicant ID (user flow §4.1).
- Edit applicant fields inline or via edit forms.
- Update applicant status with business rule enforcement (§14.1–§14.5):
  - Stage 1 BAP must be `COMPLETED` or `SCHEDULED` before progressing past enquiry, unless an exception is recorded.
  - Exceptional manual overrides must be explicitly marked with a reason.
  - Status transitions must be guarded server-side.
- Import applicant records from CSV or XLSX (§13).
- Export applicant summary as CSV.

## Acceptance Criteria

- [x] Admissions staff can create a new applicant record with all enquiry-stage required fields; the system assigns a unique `applicantId` and sets status to `ENQUIRY`.
- [x] The applicant list displays all required columns and supports all specified search and filter combinations.
- [x] The applicant detail screen renders all required sections with accurate data.
- [x] Attempting to advance an applicant past `ENQUIRY` without a valid Stage 1 BAP status is blocked with a clear error message, unless an exception is marked.
- [x] Exception marking requires a reason and is visible in the audit timeline.
- [ ] Admissions staff can import a CSV or XLSX file; valid rows create applicant records, duplicate applicants are flagged, and invalid rows are reported in an error summary. *(US-09 — not yet implemented)*
- [x] The filtered applicant list can be exported as a CSV containing all visible columns.
- [x] All create, update, and status-change actions write entries to the `AuditLog`.
- [x] Academic staff cannot create or edit applicant records.
- [x] Senior leadership can view the applicant list and detail screen in read-only mode.
- [x] Unit tests cover all status transition guards; integration tests cover create, edit, and export flows. *(Import tests pending US-09)*
