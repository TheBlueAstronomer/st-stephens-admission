# F06 — Applicant-Facing Forms: User Stories

> Each story is a vertical TDD slice. Stories are ordered by dependency. Depends on F01 (auth), F02 (applicant records), F05 (document storage).

---

## US-01: Interview Application Form — Rendering

**As an** applicant  
**I want** to access a public interview application form without authentication that works on both mobile and desktop  
**So that** I can submit my interview application information easily

### TDD Focus
- **Test**: Request the interview application form URL without authentication; assert HTTP 200.
- **Test**: Render the form; assert all required sections are present: personal details, BAP status, academic history, references, supporting information, file uploads, and consent/declaration.
- **Test**: Render the form at a mobile viewport; assert the layout is responsive (no horizontal overflow).

### Acceptance Criteria
- [x] The form is accessible at a public URL without authentication.
- [x] All sections from PRD §5.7 are present.
- [x] The form renders correctly on mobile and desktop viewports.

### Implementation Steps
1. **Create the form route** — `src/app/(public)/forms/interview-application/page.tsx`. This route is public (no auth required).
2. **Build the multi-step form layout** — use a stepped `Card` container with a horizontal progress stepper at the top. Steps: 1 Personal Details, 2 BAP & Ecclesial, 3 Academic History, 4 References, 5 Supporting Info, 6 File Uploads, 7 Consent & Declaration.
3. **Use React Hook Form** with `useForm()` persisting state across steps (single form instance, reveal/hide step panels).
4. **Build the institutional header** — SSH crest + title bar above the card. Footer with institution info.
5. **Implement responsive layout** — single-column below `768px`, all fields stack vertically. Desktop: two-column grid for short fields (name, email, phone).
6. **Write tests** — request form URL without auth (assert 200), render form (assert all sections present), render at mobile viewport (assert no horizontal overflow).

### Playwright E2E Tests
Create `e2e/f06-interview-application-form.spec.ts`:
1. **Form accessible without auth** — navigate to `/forms/interview-application` without signing in; assert the page loads (HTTP 200) and the form is visible.
2. **All steps present** — assert the progress stepper shows all 7 steps. Navigate through each step ("Next" button); assert each step’s section title is visible (Personal Details, BAP & Ecclesial, Academic History, References, Supporting Info, File Uploads, Consent & Declaration).
3. **Institutional header** — assert the SSH crest / title bar is visible at the top of the form.
4. **Mobile responsive** — set viewport to 375×812 (iPhone); assert no horizontal scrollbar and the form fields stack vertically.

> 📎 Refer to `wireframes.md` §"Screen 1 — Interview Application Form" for multi-step layout, header, and component anatomy.

---

## US-02: Interview Application Form — Validation

**As a** system  
**I want** the interview application form to validate required fields both client-side and server-side  
**So that** incomplete submissions are rejected with clear feedback

### TDD Focus
- **Test**: Submit the form with all required fields empty; assert validation messages appear for each required field.
- **Test**: Submit the form server-side with missing required fields; assert a 400 response with field-level errors.
- **Test**: Submit with all required fields filled; assert the submission is accepted.

### Acceptance Criteria
- [x] Client-side validation prevents submission with missing required fields.
- [x] Server-side validation rejects incomplete submissions with clear error messages.
- [x] Validation messages are accessible (WCAG 2.1 AA).

### Implementation Steps
1. **Create a Zod validation schema** — `src/lib/validations/interview-application-form.ts` with all required fields per step (legalName, email, phone, diocese, DDO, BAP status, programme, etc.).
2. **Wire client-side validation** — use `zodResolver` with React Hook Form. On step advance, validate only the current step's fields. Show inline `FormMessage` errors below each field.
3. **Wire server-side validation** — in the form submission server action, re-validate the full payload with the same Zod schema. Return field-level errors as a `400` response.
4. **Accessible error messages** — use `aria-describedby` linking inputs to error messages. Announce errors with `role="alert"` on the message container.
5. **Block step advancement** — if the current step has validation errors, disable the "Next" button and scroll to the first error.
6. **Write tests** — submit with all empty (assert validation messages per required field), submit server-side with missing fields (assert 400 + field errors), submit with all filled (assert accepted).

### Playwright E2E Tests
Add to `e2e/f06-interview-application-form.spec.ts`:
1. **Required field validation** — on step 1, leave all fields empty; click "Next"; assert inline validation messages appear below required fields (e.g., "Legal name is required").
2. **Step blocked on errors** — assert the form does NOT advance to step 2 while step 1 has validation errors.
3. **Valid step advances** — fill in all required fields on step 1; click "Next"; assert the form advances to step 2.
4. **Accessible errors** — assert validation error messages have `role="alert"` attribute (accessible to screen readers).

---

## US-03: Interview Application Form — Successful Submission

**As an** applicant  
**I want** my interview application submission to update my applicant record and show a confirmation message  
**So that** I know my application has been received

### TDD Focus
- **Test**: Seed an existing applicant; submit the form with matching email; assert the existing applicant record is updated with form data and status is `INTERVIEW_APPLICATION_RECEIVED`.
- **Test**: Submit the form with no existing match; assert a new applicant record is created.
- **Test**: Assert a confirmation message is returned/displayed after successful submission.
- **Test**: Assert an `AuditLog` entry is created.

### Acceptance Criteria
- [x] A matched existing applicant record is updated with form data.
- [x] If no match, a new applicant record is created.
- [x] Status transitions to `INTERVIEW_APPLICATION_RECEIVED`.
- [x] The applicant sees a confirmation message.
- [x] An `AuditLog` entry is created.

### Implementation Steps
1. **Create the `submitInterviewApplication` server action** — `src/app/(public)/forms/interview-application/actions.ts`. No auth required (public form).
2. **Run duplicate matching** (US-06) — check for existing applicant by email or applicant ID (high confidence). If matched, update the existing record. If no match, create a new applicant with status `ENQUIRY`.
3. **Update the applicant record** — fill in form data fields on the matched/created applicant. Transition status to `INTERVIEW_APPLICATION_RECEIVED`.
4. **Upload any attached files** — call the SharePoint upload service (F05-US-04) for each file. Store URLs on the applicant's document records.
5. **Create `AuditLog` entry** — record `action: 'INTERVIEW_APPLICATION_SUBMITTED'`.
6. **Return confirmation** — redirect to `/forms/interview-application/confirmation` with a success message. Display reference number (applicant ID).
7. **Build the confirmation page** — large Phosphor `CheckCircle` icon (green), "Application Received" heading, reference number, next steps text.
8. **Write tests** — submit with matching email (assert existing record updated + status), submit with no match (assert new record created), assert confirmation displayed, assert audit log.

### Playwright E2E Tests
Add to `e2e/f06-interview-application-form.spec.ts`:
1. **Full submission flow** — fill in all required fields across all steps; complete the consent/declaration step; click "Submit"; assert redirect to `/forms/interview-application/confirmation`.
2. **Confirmation page displays** — on the confirmation page, assert the green checkmark icon, "Application Received" heading, and a reference number are visible.
3. **Cannot resubmit from confirmation** — assert no "Submit Again" button is present on the confirmation page; navigating back does not re-show the form (or shows a "already submitted" message).

> 📎 Refer to `wireframes.md` §"Screen 3 — Submission Confirmation" for confirmation layout.

---

## US-04: Registration Form — Rendering

**As an** applicant  
**I want** to access a public registration form without authentication that works on both mobile and desktop  
**So that** I can complete my registration information

### TDD Focus
- **Test**: Request the registration form URL; assert HTTP 200 without authentication.
- **Test**: Render the form; assert all required sections: contact confirmation, programme confirmation, accommodation preferences, supporting bishop details, passport photo upload, additional documents, and e-signature/declaration.

### Acceptance Criteria
- [x] The form is accessible at a public URL without authentication.
- [x] All sections from PRD §5.8 are present.
- [x] The form renders correctly on mobile and desktop viewports.

### Implementation Steps
1. **Create the form route** — `src/app/(public)/forms/registration/page.tsx`. Public, no auth.
2. **Build the multi-step form** — similar stepped `Card` layout as interview application. Steps: 1 Contact Confirmation, 2 Programme Confirmation, 3 Accommodation Preferences, 4 Supporting Bishop, 5 Passport Photo Upload, 6 Additional Documents, 7 E-Signature & Declaration.
3. **Accommodation step** — `RadioGroup` for type (Single, Family), conditional `Input` for family size, `RadioGroup` for duration (Term-time, Full-year), `Textarea` for special requirements.
4. **Passport photo upload** — drag-and-drop zone with live preview thumbnail. Accepted formats: `jpg, png` (max 5MB).
5. **E-signature** — `Checkbox` + typed name `Input` for declaration consent.
6. **Write tests** — request URL without auth (assert 200), render (assert all sections present), mobile viewport (assert responsive).

### Playwright E2E Tests
Create `e2e/f06-registration-form.spec.ts`:
1. **Form accessible without auth** — navigate to `/forms/registration` without signing in; assert the page loads (HTTP 200) and the form is visible.
2. **All steps present** — assert the progress stepper shows all 7 steps. Navigate through each step; assert section titles are visible (Contact Confirmation, Programme Confirmation, Accommodation Preferences, Supporting Bishop, Passport Photo Upload, Additional Documents, E-Signature & Declaration).
3. **Accommodation conditional fields** — on the Accommodation step, select "Family"; assert the family size input is revealed. Select "Single"; assert family size is hidden.
4. **Mobile responsive** — set viewport to 375×812; assert no horizontal scrollbar.

> 📎 Refer to `wireframes.md` §"Screen 2 — Registration Form" for layout, accommodation fields, and passport upload.

---

## US-05: Registration Form — Successful Submission

**As an** applicant  
**I want** my registration form submission to update my applicant record and record the submission timestamp  
**So that** admissions staff know I have completed registration

### TDD Focus
- **Test**: Seed an applicant with an accepted offer; submit the registration form with matching data; assert `registrationFormReceivedAt` is set and status is `REGISTRATION_FORM_RECEIVED`.
- **Test**: Assert a confirmation message is displayed.
- **Test**: Assert an `AuditLog` entry is created.

### Acceptance Criteria
- [x] The matched applicant record is updated with registration data.
- [x] `registrationFormReceivedAt` is recorded.
- [x] Status transitions to `REGISTRATION_FORM_RECEIVED`.
- [x] The applicant sees a confirmation message.

### Implementation Steps
1. **Create the `submitRegistration` server action** — `src/app/(public)/forms/registration/actions.ts`. No auth.
2. **Match applicant** — run duplicate matching (US-06). The registration form should almost always match an existing applicant (they should have an accepted offer). If no match, flag for staff review.
3. **Validate offer status** — if matched, check that the applicant has an accepted offer. If not, reject with a user-friendly error.
4. **Update applicant record** — fill in registration data, set `registrationFormReceivedAt = new Date()`, transition status to `REGISTRATION_FORM_RECEIVED`.
5. **Upload files** — passport photo and additional documents to SharePoint via Graph.
6. **Create `AuditLog` entry** — `action: 'REGISTRATION_SUBMITTED'`.
7. **Redirect to confirmation** — `/forms/registration/confirmation`.
8. **Write tests** — submit with matched applicant with accepted offer (assert `registrationFormReceivedAt` set + status), assert confirmation, assert audit log.

---

## US-06: Duplicate Matching — High Confidence (Applicant ID or Email)

**As a** system  
**I want** to automatically match form submissions to existing applicants using applicant ID or email  
**So that** duplicate records are not created for known applicants

### TDD Focus
- **Test**: Seed an applicant with email `jane@example.com`; submit a form with the same email; assert the existing record is updated, not a new one created.
- **Test**: Seed an applicant with ID `APP-2025-001`; submit a form with the same applicant ID; assert the existing record is updated.

### Acceptance Criteria
- [x] Exact match via applicant ID updates the existing record.
- [x] Exact match via email updates the existing record.
- [x] No duplicate record is created for a high-confidence match.

### Implementation Steps
1. **Create a `findMatchingApplicant()` utility** — `src/lib/services/duplicate-matching.ts`. Accepts form data (email, applicantId, legalName, dateOfBirth). Returns `{ match: Applicant | null, confidence: 'HIGH' | 'LOW' | 'NONE' }`.
2. **High-confidence matching** — query by `email` (exact, case-insensitive) or `applicantId` (exact). If found, return `confidence: 'HIGH'`.
3. **Integrate into form submission actions** — in `submitInterviewApplication` and `submitRegistration`, call `findMatchingApplicant()` first. If high confidence, update the existing record directly. If no match, create new.
4. **Write tests** — seed applicant with email, submit with same email (assert existing updated, no new created); seed with applicant ID, submit with same ID (assert updated).

---

## US-07: Duplicate Matching — Low Confidence (Name + DOB)

**As a** system  
**I want** low-confidence matches (name + date of birth only) to be flagged for admissions staff review rather than auto-applied  
**So that** ambiguous matches are resolved by a human

### TDD Focus
- **Test**: Seed an applicant with legal name "Jane Smith" and DOB "1995-03-15"; submit a form with the same name and DOB but a different email; assert the submission is flagged for staff review.
- **Test**: Assert the submission is NOT automatically merged.
- **Test**: Assert the flagged submission appears in the admissions staff review queue.

### Acceptance Criteria
- [x] Low-confidence matches are flagged for staff review.
- [x] The submission is not automatically applied to the existing record.
- [x] Admissions staff can review and resolve the match in their interface.

### Implementation Steps
1. **Extend `findMatchingApplicant()`** — if no high-confidence match found, attempt low-confidence match by `legalName` + `dateOfBirth`. If matched, return `confidence: 'LOW'`.
2. **Flag for staff review** — when `confidence === 'LOW'`, do NOT auto-merge. Instead, create a `PendingSubmission` record (or flag on the submission) with `needsReview = true`, the submitted data, and the potential match's `applicantId`.
3. **Build staff review queue** — in the Applicant list, add a `Badge` count indicator ("X pending reviews"). Link to a review page showing the submitted data side-by-side with the potential match.
4. **Resolve actions** — staff can "Merge" (apply submitted data to existing), "Create New" (create a separate applicant), or "Dismiss".
5. **Write tests** — submit with same name + DOB but different email (assert flagged for review, NOT merged); assert submission appears in staff review queue.

---

## US-08: File Uploads on Forms

**As an** applicant  
**I want** to upload files (documents, passport photo) through the form  
**So that** my supporting documents are submitted alongside my application

### TDD Focus
- **Test**: Mock Microsoft Graph; submit a form with a file attachment; assert the Graph API is called to upload to the applicant's folder; assert only the secure URL is stored in the database.

### Acceptance Criteria
- [ ] File uploads are stored in the applicant's SharePoint/OneDrive folder via Microsoft Graph.
- [ ] Only metadata and secure URL are persisted in the database.
- [ ] Uploaded files are linked to the correct applicant document record.

### Implementation Steps
1. **Build the file upload component** — `src/components/forms/FileUploadField.tsx`. Drag-and-drop zone with `onDragOver`, `onDragLeave`, `onDrop`. Click to browse fallback. Accept file type props.
2. **Client-side validation** — check file size (max 10MB default), file type (configurable). Show error `Toast` for invalid files.
3. **Upload to SharePoint** — on form submission, for each file, call the Graph upload service (F05-US-04). Store only the returned URL in the form data payload.
4. **Show upload progress** — per-file `Progress` bar during upload. Phosphor `File` icon with filename after success.
5. **Multiple file support** — for "Additional Documents" section, allow multiple files with an "+ Add another file" button.
6. **Write tests** — mock Graph; submit form with file (assert Graph API called with correct folder path, assert URL stored in DB, assert no local storage).

---

## US-09: Form Accessibility (WCAG 2.1 AA)

**As an** applicant with accessibility needs  
**I want** both forms to follow WCAG 2.1 AA standards  
**So that** I can complete my application regardless of ability

### TDD Focus
- **Test**: Run an automated accessibility audit (e.g., axe-core) against each form; assert zero critical or serious violations.
- **Test**: Assert all form inputs have associated labels.
- **Test**: Assert validation messages are announced to screen readers.

### Acceptance Criteria
- [x] Both forms meet WCAG 2.1 AA criteria.
- [x] All form inputs have accessible labels.
- [x] Validation messages are screen-reader friendly.
- [x] Forms are keyboard navigable.
- [x] Colour contrast is sufficient.

### Implementation Steps
1. **Ensure semantic HTML** — use `<form>`, `<fieldset>`, `<legend>`, `<label>` elements throughout. Every `Input` must have an associated `<label>` (via `htmlFor` or wrapping).
2. **Implement accessible validation** — error messages use `role="alert"` and `aria-live="assertive"`. Inputs with errors set `aria-invalid="true"` and `aria-describedby` pointing to the error message ID.
3. **Keyboard navigation** — ensure tab order follows visual order. Focus trap within modals/dialogs. Step navigation ("Next"/"Back") is keyboard-accessible.
4. **Colour contrast** — verify all text meets WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large text). Use a contrast checker tool during development.
5. **Focus indicators** — visible focus ring (`ring-2 ring-offset-2`) on all interactive elements. Do not remove browser default focus styles without replacing them.
6. **Write tests** — run axe-core audit against both forms (assert zero critical/serious violations), assert all inputs have labels, assert validation messages have `role="alert"`.

### Playwright E2E Tests
Create `e2e/f06-form-accessibility.spec.ts` (uses `@axe-core/playwright`):
1. **Interview application form — axe audit** — navigate to `/forms/interview-application`; run axe-core audit; assert zero critical or serious violations.
2. **Registration form — axe audit** — navigate to `/forms/registration`; run axe-core audit; assert zero critical or serious violations.
3. **Keyboard navigation** — on the interview application form, tab through all fields and buttons; assert focus moves in visual order and all interactive elements are reachable.
4. **Form labels** — assert every visible input has an associated `<label>` (via `htmlFor` or wrapping).
