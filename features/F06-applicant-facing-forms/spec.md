# F06 — Applicant-Facing Forms

## Goal

Provide publicly accessible, mobile-friendly web forms that allow applicants to submit their interview application and registration information, with automatic population of the corresponding applicant records and duplicate detection.

## Scope

- Public interview application form (§5.7, §4.2): sections for personal details, BAP status, academic history, references, supporting information, file uploads, and consent or declaration.
- Public registration form (§5.8, §4.6): sections for contact details confirmation, programme confirmation, accommodation preferences, supporting bishop details, passport photo upload, additional supporting documents, and electronic signature or declaration.
- On submission, the system attempts to match the submission to an existing applicant record using applicant ID (where provided), email address, or legal name and date of birth (§10.2).
- If a confident match is found, the existing applicant record is updated.
- If confidence is low, the submission is flagged for admissions staff review before the record is updated.
- If no match is found and the form type warrants it, a new applicant record is created.
- On successful submission, the applicant sees a confirmation message (§10.3).
- All forms must validate required fields client-side and server-side before processing.
- File uploads on forms are forwarded to the applicant's document folder in SharePoint or OneDrive via Microsoft Graph.
- Forms must be accessible (WCAG 2.1 AA, §11.2) and mobile-friendly (§11.1).

## Acceptance Criteria

- [ ] The interview application form is accessible at a public URL without authentication and renders correctly on mobile and desktop viewports.
- [ ] The registration form is accessible at a public URL without authentication and renders correctly on mobile and desktop viewports.
- [ ] Submitting the interview application form with all required fields updates the matched applicant record and sets status to `INTERVIEW_APPLICATION_RECEIVED`; if no match is found, a new record is created.
- [ ] Submitting the registration form with all required fields updates the matched applicant record and sets status to `REGISTRATION_FORM_RECEIVED`; the registration received timestamp is recorded.
- [ ] Submitting either form with missing required fields shows clear, accessible validation messages and does not process the submission.
- [ ] A low-confidence duplicate match is surfaced in the admissions staff interface for review and is not applied automatically.
- [ ] An exact match via applicant ID or email does not create a duplicate applicant record.
- [ ] File uploads on both forms are stored in the applicant's SharePoint or OneDrive folder; only metadata is persisted in the database.
- [ ] After a successful submission, the applicant sees a confirmation message.
- [ ] All form submission events write entries to the `AuditLog`.
- [ ] End-to-end tests cover successful submission, required field validation, duplicate detection (high confidence and low confidence), and file upload for both forms.
