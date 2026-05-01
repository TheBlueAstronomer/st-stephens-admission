# F08 — System Administration

## Goal

Allow system administrators to manage user accounts and role assignments, configure reference data (programmes, dioceses, document types, admissions years), and review audit logs, ensuring the system remains operationally correct over time.

## Scope

- Administration screen (§5.10): user management, role assignment, programme management, diocese management, document type configuration, admissions year configuration, and status configuration where permitted.
- User management: create, deactivate, and reassign roles for staff users; deactivated users are denied access (enforced in F01).
- Programme management: create and deactivate academic programmes (`AcademicProgramme`); active programmes are surfaced in applicant forms and filters.
- Diocese management: maintain the list of dioceses used in applicant records and reports.
- Document type configuration: manage available document types for the checklist.
- Admissions year configuration: create new admissions years; all applicant records belong to an admissions year.
- Audit log viewer: read-only view of `AuditLog` entries, filterable by entity type, action, user, and date range.

## Acceptance Criteria

- [ ] Only users with the `SYSTEM_ADMINISTRATOR` role can access the administration screen; other roles receive an unauthorised response.
- [ ] An administrator can create a new staff user, assign a role, and immediately have the user be able to log in (subject to Entra ID account existence).
- [ ] An administrator can deactivate a user; the deactivated user is denied access on their next request.
- [ ] An administrator can create and deactivate academic programmes; deactivated programmes no longer appear in applicant record dropdowns.
- [ ] An administrator can add and edit dioceses; changes are reflected immediately in applicant list filters and reports.
- [ ] An administrator can configure document types; new types appear in the document checklist for new applicants.
- [ ] An administrator can create a new admissions year; the new year appears in all admissions year filters and dropdowns.
- [ ] The audit log viewer displays all required fields (`entityType`, `entityId`, `action`, `previousValue`, `newValue`, `performedByUserId`, `performedAt`) and supports filtering by entity type, action, and date range.
- [ ] Audit log entries are read-only; no editing or deletion is possible through the UI.
- [ ] Integration tests cover user deactivation access revocation, programme deactivation visibility, and audit log filter queries.
