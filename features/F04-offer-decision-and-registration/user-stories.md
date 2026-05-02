# F04 — Offer Decision and Registration: User Stories

> Each story is a vertical TDD slice. Stories are ordered by dependency. Depends on F01 (auth, RBAC), F02 (applicant records), F03 (interviews).

---

## US-01: Record Offer Decision

**As an** admissions staff member  
**I want** to record an offer decision for an applicant (Conditional, Unconditional, Declined, or Withdrawn)  
**So that** the admissions decision is captured and the applicant status updates accordingly

### TDD Focus
- **Test**: Call the create-offer server action with offer type `UNCONDITIONAL`; assert an Offer record is created and applicant status is `UNCONDITIONAL_OFFER`.
- **Test**: Call with `CONDITIONAL` and conditions; assert status is `CONDITIONAL_OFFER`.
- **Test**: Call with `DECLINED`; assert status is `DECLINED`.
- **Test**: Call with `WITHDRAWN`; assert status is `WITHDRAWN`.

### Acceptance Criteria
- [x] An Offer record is created with the selected type, decision date, and notes.
- [x] The applicant status updates to the corresponding status.
- [x] An `AuditLog` entry is created for the offer decision.

### Implementation Steps
1. **Create a Zod schema** — `src/lib/validations/offer.ts` requiring `offerType` (enum: `CONDITIONAL`, `UNCONDITIONAL`, `DECLINED`, `WITHDRAWN`), `decisionDate`, and optional `decisionNotes`, `conditions` (array of strings).
2. **Create the `createOffer` server action** — `src/app/(staff)/applicants/[id]/actions.ts`. Apply `requireRole('ADMISSIONS_STAFF')`. Validate input, call `validateInterviewGate()` (F03), create an `Offer` record, and transition applicant status to the matching status (`UNCONDITIONAL_OFFER`, `CONDITIONAL_OFFER`, `DECLINED`, `WITHDRAWN`).
3. **Create `AuditLog` entry** — record `action: 'OFFER_CREATED'` with offer type and applicant ID.
4. **Build the Record Offer Decision sheet** — triggered by "Record Offer" quick action. Right-side `Sheet` (480px) with: `RadioGroup` (four pill cards for offer types), conditions section (conditionally rendered), notes `Textarea`, date picker, "Confirm Offer →" button.
5. **Write tests** — create each offer type (assert status transitions correctly), assert audit log created.

### Playwright E2E Tests
Create `e2e/f04-offer-registration.spec.ts`:
1. **Record Offer sheet opens** — sign in as Alice (ADMISSIONS_STAFF); navigate to a seeded applicant with `INTERVIEW_COMPLETED` status; click "Record Offer" quick action; assert the Record Offer Decision sheet slides in with offer type radio cards (Conditional, Unconditional, Declined, Withdrawn).
2. **Submit unconditional offer** — select "Unconditional"; add notes; click "Confirm Offer →"; assert the sheet closes and the applicant’s status badge updates to `UNCONDITIONAL_OFFER`.
3. **Conditional offer shows conditions section** — select "Conditional"; assert the conditions input section reveals; add at least one condition; confirm; assert status changes to `CONDITIONAL_OFFER`.
4. **Record Offer disabled for wrong status** — navigate to an applicant in `ENQUIRY` status; assert the "Record Offer" button is disabled with a tooltip explaining why.

> 📎 Refer to `wireframes.md` §"Screen 1 — Record Offer Decision" for Sheet layout and offer type cards.

---

## US-02: Conditional Offer Must Include Conditions

**As a** system  
**I want** to reject conditional offers that do not include at least one condition  
**So that** conditional offers always specify what the applicant must fulfil

### TDD Focus
- **Test**: Call create-offer with type `CONDITIONAL` and empty conditions; assert it is blocked with a validation error.
- **Test**: Call with type `CONDITIONAL` and one condition; assert it succeeds.
- **Test**: Call with type `UNCONDITIONAL` and no conditions; assert it succeeds (conditions not required for unconditional).

### Acceptance Criteria
- [x] Saving a conditional offer without at least one condition is blocked.
- [x] The validation error message is clear and specific.
- [x] Unconditional offers do not require conditions.

### Implementation Steps
1. **Add Zod validation** — in the offer schema, use `.refine()` to require `conditions.length >= 1` when `offerType === 'CONDITIONAL'`.
2. **Add server-side guard** — in `createOffer`, after Zod parsing, double-check the constraint programmatically.
3. **Build conditional conditions UI** — when `CONDITIONAL` is selected, slide-reveal (animate-in) the conditions section: `Input` for each condition, "+ Add condition" button with Phosphor `Plus`, delete condition with `X` icon.
4. **Write tests** — conditional offer with no conditions (assert blocked + Zod error), with one condition (assert success), unconditional with no conditions (assert success).

---

## US-03: Record Offer Acceptance

**As an** admissions staff member  
**I want** to record when an applicant accepts their offer, capturing the acceptance date  
**So that** the system knows the applicant has accepted and is eligible for registration

### TDD Focus
- **Test**: Call the accept-offer action on an applicant with a `CONDITIONAL_OFFER`; assert `acceptedAt` is set on the Offer record.
- **Test**: Assert the applicant is now eligible for registration status transitions.

### Acceptance Criteria
- [x] Acceptance date is recorded when an applicant accepts an offer.
- [x] An `AuditLog` entry is created for the acceptance event.

### Implementation Steps
1. **Create the `acceptOffer` server action** — `requireRole('ADMISSIONS_STAFF')`. Update the `Offer` record: set `acceptedAt = new Date()`. Transition applicant to eligible for registration.
2. **Create `AuditLog` entry** — record `action: 'OFFER_ACCEPTED'`.
3. **Build the UI** — in the Offer tab on Applicant Detail, show a `Button` "Record Acceptance" that opens a confirmation `AlertDialog`. After acceptance, display `Badge` variant `success` + timestamp.
4. **Write tests** — accept a conditional offer (assert `acceptedAt` set + audit log), verify applicant is now eligible for registration transitions.

---

## US-04: Record Declined/Withdrawn Reason

**As an** admissions staff member  
**I want** to record a reason when an applicant is declined or withdraws  
**So that** there is an institutional record of why the application did not proceed

### TDD Focus
- **Test**: Call create-offer with type `DECLINED` and a reason in `decisionNotes`; assert the notes are stored.
- **Test**: Call with `WITHDRAWN` and a reason; assert the notes are stored.

### Acceptance Criteria
- [x] Declined and withdrawn offers can include a reason in `decisionNotes`.
- [x] The reason is visible on the applicant detail screen.

### Implementation Steps
1. **Ensure `decisionNotes` is stored** — the `createOffer` action already persists `decisionNotes`. No additional action needed if the Zod schema includes it.
2. **Build UI for declined/withdrawn** — when `DECLINED` or `WITHDRAWN` is selected in the Record Offer sheet, expand the notes `Textarea` with a label "Reason" and increase prominence. Make notes optional but encouraged.
3. **Display reason on Applicant Detail** — in the Offer tab, show `decisionNotes` in a read-only `Card` below the offer type badge.
4. **Write tests** — create declined offer with reason (assert notes stored), create withdrawn with reason (assert notes stored and visible on detail).

---

## US-05: Registration Gate — Require Accepted Offer

**As a** system  
**I want** to block moving an applicant to registration without an accepted offer  
**So that** only accepted applicants proceed to the registration phase

### TDD Focus
- **Test**: Attempt to mark registration received for an applicant without an accepted offer; assert it is blocked server-side.
- **Test**: Accept the offer first, then mark registration received; assert it succeeds.

### Acceptance Criteria
- [x] Moving to registration without an accepted offer is blocked server-side.
- [x] The error message clearly states an accepted offer is required.

### Implementation Steps
1. **Create `validateOfferGate()` utility** — `src/lib/business-rules/offer-gate.ts`. Accepts applicant ID, queries their offer. Returns `{ allowed: boolean, reason?: string }`.
   - Allowed if an offer exists with `acceptedAt` set.
   - Blocked otherwise.
2. **Integrate into `markRegistrationReceived`** — call `validateOfferGate()` before proceeding. If blocked, return the reason.
3. **UI gate** — in the Applicant Detail, disable the "Mark Registration Received" action with `Tooltip` when no accepted offer exists.
4. **Write tests** — attempt registration without accepted offer (assert blocked + descriptive error), accept offer then attempt (assert success).

---

## US-06: Mark Registration Form Received

**As an** admissions staff member  
**I want** to mark that a registration form has been received and have the timestamp recorded  
**So that** I can track registration progress

### TDD Focus
- **Test**: Call the mark-registration-received action for an applicant with an accepted offer; assert `registrationFormReceivedAt` is set and applicant status transitions to `REGISTRATION_FORM_RECEIVED`.

### Acceptance Criteria
- [x] Registration form received timestamp is recorded.
- [x] Applicant status transitions to `REGISTRATION_FORM_RECEIVED`.
- [x] An `AuditLog` entry is created.

### Implementation Steps
1. **Create the `markRegistrationReceived` server action** — `requireRole('ADMISSIONS_STAFF')`. Call `validateOfferGate()`, then update applicant: set `registrationFormReceivedAt = new Date()`, transition status to `REGISTRATION_FORM_RECEIVED`.
2. **Create `AuditLog` entry** — record `action: 'REGISTRATION_RECEIVED'`.
3. **Build the UI** — in the Registration tab on Applicant Detail, show `Button` "Mark Registration Received" with Phosphor `ClipboardCheck`. After marking, display `Badge` variant `success` + timestamp.
4. **Write tests** — call with accepted offer (assert timestamp set + status transition + audit log), call without accepted offer (assert blocked).

### Playwright E2E Tests
Add to `e2e/f04-offer-registration.spec.ts`:
1. **Mark Registration Received** — navigate to a seeded applicant with an accepted offer; go to the Registration tab; click "Mark Registration Received"; assert a success badge with timestamp appears and the applicant status updates to `REGISTRATION_FORM_RECEIVED`.
2. **Registration blocked without accepted offer** — navigate to an applicant with an unaccepted offer; assert the "Mark Registration Received" button is disabled with a tooltip explaining the requirement.

> 📎 Refer to `wireframes.md` §"Screen 3 — Registration Tab" for layout and component patterns.

---

## US-07: Confirm Ordinand — All Gates Pass

**As an** admissions staff member  
**I want** to confirm an applicant as an ordinand when all prerequisites are met (registration form received, mandatory documents complete or waived, accommodation fields complete)  
**So that** the applicant is officially confirmed

### TDD Focus
- **Test**: Seed an applicant with registration received, all mandatory docs received, accommodation fields complete; call confirm-ordinand; assert status is `CONFIRMED_ORDINAND` and `confirmedOrdinandAt` is set.
- **Test**: Assert the `AuditLog` records the confirmation.

### Acceptance Criteria
- [x] Applicant status transitions to `CONFIRMED_ORDINAND`.
- [x] Confirmation date is recorded.
- [x] An `AuditLog` entry is created.

### Implementation Steps
1. **Create the `confirmOrdinand` server action** — `requireRole('ADMISSIONS_STAFF')`. Run all prerequisite checks:
   - `registrationFormReceivedAt` is set.
   - All mandatory documents are received or waived (query `ApplicantDocument` where `isRequired && !isReceived && !isWaived`).
   - Accommodation fields are complete (if applicable).
2. **If all gates pass** — transition applicant status to `CONFIRMED_ORDINAND`, set `confirmedOrdinandAt = new Date()`.
3. **Create `AuditLog` entry** — record `action: 'CONFIRMED_ORDINAND'`.
4. **Build the UI** — in the Registration tab, show "Confirm Ordinand →" button (navy fill, Phosphor `Seal`). Triggers an `AlertDialog` listing all prerequisite statuses (green check or red X). Only enable confirm when all green.
5. **Write tests** — seed applicant with all prerequisites met (assert confirmation succeeds + timestamp + audit log).

> 📎 Refer to `wireframes.md` §"Screen 3 — Registration Tab" for confirmation dialog pattern.

---

## US-08: Confirm Ordinand — Block on Outstanding Documents

**As a** system  
**I want** to block ordinand confirmation when mandatory documents are outstanding and not waived  
**So that** no applicant is confirmed without complete documentation

### TDD Focus
- **Test**: Seed an applicant with one mandatory document `OUTSTANDING` (not waived); attempt confirmation; assert it is blocked with a clear error listing the missing documents.
- **Test**: Waive the document; attempt confirmation; assert it succeeds.

### Acceptance Criteria
- [x] Confirmation is blocked when mandatory documents are outstanding.
- [x] The error message lists the specific missing documents.
- [x] Waived documents satisfy the requirement.

### Implementation Steps
1. **Create `validateDocumentGate()` utility** — `src/lib/business-rules/document-gate.ts`. Accepts applicant ID, queries mandatory `ApplicantDocument` records. Returns `{ allowed: boolean, missingDocuments: string[] }`.
   - A document is "satisfied" if `isReceived === true` OR `isWaived === true`.
   - Blocked if any mandatory document is unsatisfied.
2. **Integrate into `confirmOrdinand`** — call `validateDocumentGate()`. If blocked, return the list of missing document names.
3. **Build UI feedback** — in the confirmation `AlertDialog`, list each mandatory document with a green check (received/waived) or red X (outstanding). Show the specific missing document names.
4. **Write tests** — one mandatory doc outstanding (assert blocked + list), waive it (assert success), all docs received (assert success).

---

## US-09: Confirm Ordinand — Block Without Registration Form

**As a** system  
**I want** to block ordinand confirmation when the registration form has not been received  
**So that** confirmation only proceeds after registration is complete

### TDD Focus
- **Test**: Attempt confirmation for an applicant without `registrationFormReceivedAt`; assert it is blocked.
- **Test**: Mark registration received, then attempt confirmation; assert it succeeds (assuming other gates pass).

### Acceptance Criteria
- [x] Confirmation is blocked without a received registration form.
- [x] The error message clearly states the registration form is required.

### Implementation Steps
1. **Add registration form check** in `confirmOrdinand` — at the top of the action, check `applicant.registrationFormReceivedAt`. If null, return error: "Registration form must be received before confirming as ordinand."
2. **UI gate** — in the confirmation `AlertDialog`, include a registration form line item with green check or red X.
3. **Write tests** — attempt confirmation without `registrationFormReceivedAt` (assert blocked), mark received then attempt (assert success assuming other gates pass).

---

## US-10: Declined/Withdrawn Applicants in Reports but Not Active Registration

**As an** admissions staff member  
**I want** declined and withdrawn applicants to remain visible in reports but not appear in active registration workflows  
**So that** reporting is accurate while the active pipeline stays clean

### TDD Focus
- **Test**: Seed applicants with `DECLINED` and `WITHDRAWN` statuses; query the active registration list; assert they are excluded.
- **Test**: Query a report (e.g., pipeline report); assert they are included.

### Acceptance Criteria
- [x] Declined and withdrawn applicants appear in reports.
- [x] Declined and withdrawn applicants do not appear in active registration workflows.

### Implementation Steps
1. **Filter active registration queries** — in all registration-related queries (registration list, confirmation candidates), add `where: { status: { notIn: ['DECLINED', 'WITHDRAWN'] } }`.
2. **Include in report queries** — ensure report queries (F07) do NOT filter out declined/withdrawn applicants. These should appear in pipeline and diocese reports.
3. **Visual treatment** — on the applicant list, declined/withdrawn rows appear with muted text (`text-muted-foreground`) and a strikethrough-style status `Badge`.
4. **Write tests** — seed declined + withdrawn applicants; query active registration list (assert excluded); query pipeline report (assert included).
