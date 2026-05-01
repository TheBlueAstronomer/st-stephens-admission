# F04 — Offer Decision and Registration

## Goal

Allow admissions staff to record offer decisions with appropriate conditions, track applicant acceptance, and progress accepted applicants through registration to confirmed ordinand status.

## Scope

- Offer decision flow (§4.5): admissions staff select offer type (`CONDITIONAL`, `UNCONDITIONAL`, `DECLINED`, `WITHDRAWN`), enter decision date and conditions where required, and save the decision.
- Registration management (§3.6): admissions staff mark registration form received, review completed fields, and confirm the applicant as an ordinand.
- Confirm ordinand flow (§4.7): admissions staff verify registration form received, document checklist complete or waived, and accommodation fields completed where required; system records confirmation date and transitions status to `CONFIRMED_ORDINAND`.
- Business rule enforcement (§14.4–§14.5):
  - Conditional offers must include at least one condition.
  - Applicants cannot be moved to registration without an accepted offer.
  - Applicants cannot be confirmed as ordinands until the registration form is received and mandatory documents are complete or waived.
  - Declined and withdrawn applicants remain visible in reports but are excluded from active registration workflows.
- Record acceptance status and date for offers.
- Record reason for declined or withdrawn outcomes where applicable.

## Acceptance Criteria

- [ ] Admissions staff can record an offer decision; the applicant status updates to the correct status (`CONDITIONAL_OFFER`, `UNCONDITIONAL_OFFER`, `DECLINED`, or `WITHDRAWN`).
- [ ] Saving a conditional offer without at least one condition is blocked with a validation error.
- [ ] Attempting to move an applicant to registration without an accepted offer is blocked server-side.
- [ ] Registration form received timestamp is recorded when marked.
- [ ] Admissions staff can confirm an applicant as ordinand only when registration form is received and mandatory documents are received or waived; the system records the confirmation date.
- [ ] Attempting to confirm an ordinand with outstanding mandatory documents and no waiver is blocked with a clear error.
- [ ] Declined and withdrawn applicants appear in reports but do not appear in active registration workflows.
- [ ] Acceptance date is recorded when an applicant accepts an offer.
- [ ] All offer decisions, acceptances, and ordinand confirmations write entries to the `AuditLog`.
- [ ] Integration tests cover each offer type, the conditional offer validation, the registration gate, and the ordinand confirmation gate.
