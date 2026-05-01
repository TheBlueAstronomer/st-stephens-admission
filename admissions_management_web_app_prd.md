# Product Requirements Document: Admissions Management Web App

## 1. Product Overview

### 1.1 Product Name

Admissions Management Web App

### 1.2 Intended Institution

St Stephen’s House, Oxford

### 1.3 Product Purpose

The Admissions Management Web App is a bespoke browser-based system designed to manage the full admissions lifecycle for ordinand applicants, from first enquiry through visit, interview, offer decision, registration, and confirmed ordinand status.

The system will replace the current spreadsheet-based admissions process with a structured, auditable, and easy-to-use application that centralises applicant data, admissions status, documents, interview records, accommodation information, and institutional reporting.

The product is intended for small annual cohorts and should prioritise clarity, reliability, and administrative usability over broad CRM-style configurability.

### 1.4 Primary Goals

- Provide clear visibility of every applicant’s admissions progress.
- Reduce manual tracking currently handled through Excel and SharePoint.
- Centralise applicant records, documentation status, interview details, offers, registration progress, and accommodation needs.
- Allow applicant-submitted forms to populate admissions records automatically.
- Support secure document storage through institutional cloud storage such as SharePoint or OneDrive.
- Provide simple dashboards and reports for admissions staff, academic staff, and senior leadership.
- Support reliable long-term record keeping for small annual cohorts.

### 1.5 Out of Scope

The product is not intended to be a full student information system, learning management system, finance system, or general-purpose CRM.

The following are out of scope for the initial product definition:

- Teaching timetable management.
- Academic assessment tracking.
- Fee billing and payment processing.
- Alumni management.
- Complex marketing automation.
- General recruitment CRM functionality unrelated to ordinand admissions.
- Implementation plan, delivery phases, or engineering task breakdown.

---

## 2. Users and Roles

### 2.1 Admissions Staff

Admissions staff are the primary operational users of the system.

Responsibilities:

- Create and update applicant records.
- Review submitted forms.
- Track applicant stages.
- Manage document checklist completion.
- Schedule and record interviews.
- Record offer decisions.
- Track registration completion.
- Export admissions data and reports.

Required access:

- Full read and write access to applicant records.
- Full access to document status and document links.
- Full access to interview records.
- Full access to accommodation information.
- Ability to export reports.

### 2.2 Academic Staff / Interviewers

Academic staff participate in interviews and may need access to interview-related applicant information.

Responsibilities:

- View relevant applicant details before an interview.
- Add interview notes.
- Record interview outcomes.
- Review supporting documents where permitted.

Required access:

- Read access to assigned applicant records.
- Read and write access to assigned interview records.
- Limited access to documents required for interview preparation.
- No access to unrelated applicants unless explicitly granted.

### 2.3 Senior Leadership

Senior leadership need high-level visibility into the admissions pipeline and accommodation demand.

Responsibilities:

- Monitor admissions pipeline health.
- Review offer and registration numbers.
- Review accommodation demand.
- Review applicant distribution by diocese, programme, and status.

Required access:

- Read-only access to dashboards and reports.
- Optional read-only access to applicant summaries.
- No routine need to edit applicant data.

### 2.4 System Administrator

The system administrator manages users, roles, system configuration, and operational settings.

Responsibilities:

- Manage user accounts and role assignments.
- Configure programmes, statuses, document types, and reference data.
- Manage integration settings.
- Oversee audit and access controls.

Required access:

- Full system configuration access.
- User management access.
- Read access to audit logs.

### 2.5 Applicant

Applicants interact with the system through public or authenticated web forms.

Responsibilities:

- Submit enquiry or admissions information.
- Submit interview application information.
- Submit registration information.
- Upload requested supporting documents.

Required access:

- Access to relevant form pages.
- Ability to submit forms securely.
- Optional ability to return to a saved application if authenticated applicant access is provided.

---

## 3. Core Admissions Workflow

### 3.1 Admissions Stages

The system must support the following core admissions lifecycle:

1. Enquiry
2. Visit or Visit-Interview
3. Offer Decision
4. Registration
5. Confirmed Ordinand

### 3.2 Recommended Applicant Statuses

The system should represent workflow progress using explicit applicant statuses.

Recommended statuses:

- `ENQUIRY`
- `VISIT_INVITED`
- `INTERVIEW_APPLICATION_RECEIVED`
- `INTERVIEW_SCHEDULED`
- `INTERVIEW_COMPLETED`
- `CONDITIONAL_OFFER`
- `UNCONDITIONAL_OFFER`
- `DECLINED`
- `WITHDRAWN`
- `REGISTRATION_FORM_RECEIVED`
- `DOCUMENTS_COMPLETE`
- `CONFIRMED_ORDINAND`

### 3.3 Stage 1: Enquiry

Purpose:

Capture initial applicant interest and establish the applicant record.

The system must record:

- Applicant basic details.
- Diocese.
- Director of Ordinands.
- Stage 1 BAP status.
- Stage 1 BAP date where applicable.
- Initial programme interest where known.

Primary user actions:

- Create applicant record manually.
- Import applicant record from spreadsheet.
- Receive applicant details from an online enquiry form.
- Update Stage 1 BAP status.

Required validations:

- Applicant email should be unique where possible.
- Applicant ID must be unique.
- Stage 1 BAP status must be `COMPLETED` or `SCHEDULED` before an enquiry can progress to visit, visit-interview, interview scheduling, offer decision, registration, or confirmed ordinand status.
- Exceptional manual enquiries without a completed or scheduled Stage 1 BAP must be explicitly marked as exceptions by admissions staff.
- Required fields must be completed before progressing to later workflow stages.

### 3.4 Stage 2: Visit / Visit-Interview

Purpose:

Track invitations, interview applications, interview scheduling, and interview outcomes.

Supported visit types:

- Exploratory Visit
- Visit-Interview

The system must record:

- Whether a visit or interview is required.
- Invitation sent date.
- Invitation sent timestamp and sending user where available.
- Interview application form received status.
- Interview application form received timestamp.
- Interview date and time.
- Assigned interviewer or interview panel.
- Interview notes.
- Interview outcome.

Required validations:

- Interview should not be scheduled before Stage 1 BAP is marked as completed or scheduled.
- Interview scheduling must be blocked when Stage 1 BAP status is incomplete, unknown, or missing, unless an authorised exception is recorded.
- Interview outcome should not be recorded before an interview date has been set.
- Applicant should not move to offer decision without required interview completion, unless explicitly marked as not required.

### 3.5 Stage 3: Offer Decision

Purpose:

Record admissions decisions and track offer status.

Supported outcomes:

- Conditional offer, subject to Stage 2 BAP.
- Unconditional offer.
- Declined.
- Withdrawn.

The system must record:

- Offer decision.
- Offer date.
- Offer conditions.
- Acceptance status.
- Acceptance date.
- Reason for declined or withdrawn applications where applicable.

Required validations:

- Conditional offers should include at least one condition.
- An applicant should not be marked as registered unless an offer has been accepted.

### 3.6 Stage 4: Registration

Purpose:

Collect final registration information and confirm the applicant as an ordinand.

The system must record:

- Registration form received.
- Registration form received timestamp.
- Programme confirmation.
- Contact details confirmation.
- Supporting bishop details.
- Accommodation preferences.
- Passport photograph upload.
- Electronic signature or signed declaration.
- Required supporting documents completion.
- Whether supporting documents have been submitted.

Required validations:

- Applicant cannot be confirmed as an ordinand until registration form is received.
- Applicant cannot be confirmed as an ordinand until mandatory documents are complete or explicitly waived.
- Accommodation reporting fields must be completed if accommodation is required.

### 3.7 Confirmed Ordinand

Purpose:

Represent applicants who have completed admissions and registration.

The system must record:

- Confirmation date.
- Final programme.
- Final accommodation requirement.
- Complete document status.
- Final applicant record state.

---

## 4. User Flows

### 4.1 Create Applicant from Enquiry

Primary actor:

Admissions Staff

Flow:

1. Admissions staff open the applicant list.
2. Admissions staff create a new applicant record.
3. Admissions staff enter personal, ecclesial, and initial programme details.
4. Admissions staff set Stage 1 BAP status.
5. System assigns a unique applicant ID.
6. System saves applicant with status `ENQUIRY`.
7. Applicant appears in the admissions pipeline dashboard.

Success criteria:

- Applicant record is created.
- Applicant is visible in list and dashboard views.
- Required enquiry-stage fields are present.

### 4.2 Submit Interview Application Form

Primary actor:

Applicant

Flow:

1. Applicant opens the interview application form.
2. Applicant enters required personal, academic, BAP, and reference information.
3. Applicant uploads required supporting documents where requested.
4. Applicant submits the form.
5. System validates required fields.
6. System updates an existing applicant record or creates a new applicant record if appropriate.
7. System marks interview application as received.
8. Admissions staff are notified or see the updated applicant status.

Success criteria:

- Form submission is stored.
- Applicant record is populated automatically.
- Uploaded files are linked to the applicant.
- Applicant moves to `INTERVIEW_APPLICATION_RECEIVED` where appropriate.

### 4.3 Schedule Interview

Primary actor:

Admissions Staff

Flow:

1. Admissions staff open an applicant record.
2. Admissions staff confirm Stage 1 BAP is completed or scheduled.
3. Admissions staff select interview type.
4. Admissions staff choose interview date and assigned interviewer or panel.
5. System validates that the interview can be scheduled.
6. System saves interview details.
7. Applicant status changes to `INTERVIEW_SCHEDULED`.

Success criteria:

- Interview is linked to applicant.
- Interview appears in applicant timeline.
- Invalid scheduling is blocked.

### 4.4 Record Interview Outcome

Primary actor:

Academic Staff / Interviewer

Flow:

1. Interviewer opens assigned interview record.
2. Interviewer reviews relevant applicant information.
3. Interviewer enters notes and outcome.
4. Interviewer saves the interview record.
5. System marks interview as completed.
6. Applicant status changes to `INTERVIEW_COMPLETED`.

Success criteria:

- Interview notes and outcome are stored.
- Applicant is eligible for offer decision review.
- Only authorised users can edit interview records.

### 4.5 Record Offer Decision

Primary actor:

Admissions Staff or Admissions Lead

Flow:

1. Admissions staff open applicant record.
2. Admissions staff review interview outcome and document status.
3. Admissions staff select offer decision.
4. If conditional, admissions staff enter offer conditions.
5. Admissions staff save the decision.
6. System updates applicant status.

Success criteria:

- Offer outcome is recorded.
- Conditional offers include conditions.
- Applicant is visible in offer reporting.

### 4.6 Submit Registration Form

Primary actor:

Applicant

Flow:

1. Applicant opens registration form.
2. Applicant confirms personal and programme details.
3. Applicant provides accommodation preferences.
4. Applicant provides supporting bishop details.
5. Applicant uploads passport photograph and remaining documents.
6. Applicant submits electronic signature or declaration.
7. System validates required fields.
8. System updates applicant record.
9. Applicant status changes to `REGISTRATION_FORM_RECEIVED`.

Success criteria:

- Registration details are stored.
- Accommodation fields are available for reporting.
- Submitted documents are linked to checklist items.

### 4.7 Confirm Ordinand

Primary actor:

Admissions Staff

Flow:

1. Admissions staff open applicant record.
2. Admissions staff review registration form status.
3. Admissions staff review document checklist completion.
4. Admissions staff review accommodation information.
5. Admissions staff confirm applicant as ordinand.
6. System records confirmation date.
7. Applicant status changes to `CONFIRMED_ORDINAND`.

Success criteria:

- Applicant is confirmed only when required conditions are complete or waived.
- Confirmed ordinand appears in final admissions reporting.

### 4.8 Review Admissions Dashboard

Primary actor:

Senior Leadership or Admissions Staff

Flow:

1. User opens admissions dashboard.
2. System displays current admissions totals.
3. User filters by year, programme, status, or diocese.
4. User reviews summary charts and counts.
5. User exports report if required.

Success criteria:

- Dashboard reflects current applicant data.
- Accommodation demand is clearly visible.
- Reports are exportable.

---

## 5. Screens and Interface Requirements

### 5.1 Login Screen

Purpose:

Allow authorised staff to access the system securely.

Required elements:

- Microsoft sign-in button.
- Error message for unauthorised accounts.
- Clear institutional branding.

### 5.2 Admissions Dashboard

Purpose:

Provide a high-level overview of the admissions pipeline.

Required elements:

- Total enquiries.
- Applicants by workflow stage.
- Offers made.
- Registrations received.
- Confirmed ordinands.
- Accommodation demand summary.
- Filters for admissions year, programme, status, and diocese.
- Export action for report data.

### 5.3 Applicant List Screen

Purpose:

Allow staff to search, filter, and manage applicants.

Required elements:

- Search by name, email, applicant ID, diocese, or DDO.
- Filters by status, admissions year, programme, accommodation need, and document completion.
- Columns for applicant name, status, programme, diocese, BAP status, interview date, offer status, registration status, and document completion.
- Link to applicant detail screen.
- Export filtered list.

### 5.4 Applicant Detail Screen

Purpose:

Serve as the central record for each applicant.

Required sections:

- Applicant summary.
- Personal information.
- Ecclesial information.
- Academic programme information.
- BAP status.
- Current admissions status.
- Visit and interview details.
- Offer decision.
- Registration status.
- Accommodation requirement.
- Document checklist.
- Linked SharePoint or OneDrive folder.
- Internal notes.
- Audit timeline.

Required actions:

- Edit applicant details.
- Update applicant status.
- Schedule interview.
- Record offer decision.
- Mark registration received.
- Confirm ordinand.
- Upload or link documents.
- Export applicant summary.

### 5.5 Interview Detail Screen

Purpose:

Allow staff and interviewers to manage interview records.

Required elements:

- Linked applicant.
- Interview type.
- Interview date and time.
- Assigned interviewer or panel.
- Interview status.
- Notes.
- Outcome.
- Follow-up actions.

### 5.6 Document Checklist Screen or Section

Purpose:

Show required and received documents for each applicant.

Required document types:

- GCSE transcripts.
- A-level transcripts.
- Undergraduate transcripts.
- Postgraduate transcripts, if applicable.
- Stage 1 BAP report.
- Stage 2 BAP report.
- Two academic references.
- Passport-size photograph.
- Legal ID.
- DBS check, when required.

Required elements:

- Document name.
- Required status.
- Received status.
- Waived status.
- Received date.
- Linked uploaded file.
- Notes.

### 5.7 Public Interview Application Form

Purpose:

Allow applicants to submit interview application information.

Required sections:

- Personal details.
- BAP status.
- Academic history.
- References.
- Supporting information.
- File uploads.
- Consent or declaration.

### 5.8 Public Registration Form

Purpose:

Allow accepted applicants to complete registration.

Required sections:

- Contact details confirmation.
- Programme confirmation.
- Accommodation preferences.
- Supporting bishop details.
- Passport photo upload.
- Additional supporting documents.
- Electronic signature or declaration.

### 5.9 Reports Screen

Purpose:

Allow authorised users to view and export institutional admissions reports.

Required reports:

- Applicants per admissions year.
- Diocese distribution.
- BAP status summary.
- Offers versus registrations.
- Accommodation demand.
- Applicant status pipeline.
- Missing documents report.

### 5.10 Administration Screen

Purpose:

Allow system administrators to manage reference data and access.

Required elements:

- User management.
- Role assignment.
- Programme management.
- Diocese management.
- Document type configuration.
- Admissions year configuration.
- Status configuration, where permitted.

---

## 6. Core Data Structures

### 6.1 Applicant

Purpose:

Represents a person progressing through the admissions lifecycle.

Core fields:

- `id`
- `applicantId`
- `legalName`
- `preferredName`
- `dateOfBirth`
- `email`
- `phone`
- `addressLineOne`
- `addressLineTwo`
- `city`
- `postcode`
- `country`
- `status`
- `admissionsYear`
- `hasStageOneBAPException`
- `stageOneBAPExceptionReason`
- `createdAt`
- `updatedAt`

Relationships:

- Belongs to one Diocese, if known.
- May have one DDO contact.
- May have one sponsoring bishop contact.
- May have many documents.
- May have many interviews.
- May have one offer decision.
- May have one registration record.
- May have one accommodation request.

### 6.2 Ecclesial Profile

Purpose:

Stores church-related applicant information.

Core fields:

- `id`
- `applicantId`
- `dioceseId`
- `directorOfOrdinandsName`
- `directorOfOrdinandsEmail`
- `directorOfOrdinandsPhone`
- `sponsoringBishopName`
- `sponsoringBishopEmail`
- `sponsoringBishopPhone`

### 6.3 Academic Programme

Purpose:

Represents the programme an applicant is applying for.

Core fields:

- `id`
- `awardingFramework`
- `courseTitle`
- `durationOfStudy`
- `modeOfStudy`
- `isActive`

Recommended awarding framework values:

- `COMMON_AWARDS`
- `OXFORD`

Recommended mode of study values:

- `FULL_TIME`
- `PART_TIME`
- `OTHER`

### 6.4 BAP Status

Purpose:

Tracks Stage 1 and Stage 2 BAP information.

Core fields:

- `id`
- `applicantId`
- `stageOneStatus`
- `stageOneDate`
- `hasStageOneBAPException`
- `stageOneBAPExceptionReason`
- `stageTwoStatus`
- `stageTwoDate`

Recommended BAP status values:

- `COMPLETED`
- `SCHEDULED`
- `INCOMPLETE`
- `NOT_APPLICABLE`

### 6.5 Interview

Purpose:

Stores visit and interview records.

Core fields:

- `id`
- `applicantId`
- `interviewType`
- `invitationSentAt`
- `invitationSentByUserId`
- `interviewApplicationReceivedAt`
- `scheduledAt`
- `completedAt`
- `status`
- `outcome`
- `notes`
- `createdByUserId`
- `updatedByUserId`

Recommended interview types:

- `EXPLORATORY_VISIT`
- `VISIT_INTERVIEW`

Recommended interview statuses:

- `REQUIRED`
- `NOT_REQUIRED`
- `SCHEDULED`
- `COMPLETED`
- `CANCELLED`

### 6.6 Offer

Purpose:

Stores admissions decision and offer details.

Core fields:

- `id`
- `applicantId`
- `offerType`
- `decisionDate`
- `conditions`
- `acceptedAt`
- `declinedAt`
- `withdrawnAt`
- `decisionNotes`

Recommended offer type values:

- `CONDITIONAL`
- `UNCONDITIONAL`
- `DECLINED`
- `WITHDRAWN`

### 6.7 Registration

Purpose:

Stores registration form and final confirmation details.

Core fields:

- `id`
- `applicantId`
- `receivedAt`
- `registrationFormReceivedAt`
- `contactDetailsConfirmed`
- `programmeConfirmed`
- `bishopDetailsConfirmed`
- `areSupportingDocumentsSubmitted`
- `electronicSignature`
- `confirmedOrdinandAt`

### 6.8 Applicant Document

Purpose:

Tracks required and optional documents for an applicant.

Core fields:

- `id`
- `applicantId`
- `documentType`
- `isRequired`
- `isReceived`
- `isWaived`
- `receivedAt`
- `storageProvider`
- `storageUrl`
- `fileName`
- `notes`

Recommended document type values:

- `GCSE_TRANSCRIPT`
- `A_LEVEL_TRANSCRIPT`
- `UNDERGRADUATE_TRANSCRIPT`
- `POSTGRADUATE_TRANSCRIPT`
- `STAGE_ONE_BAP_REPORT`
- `STAGE_TWO_BAP_REPORT`
- `ACADEMIC_REFERENCE_ONE`
- `ACADEMIC_REFERENCE_TWO`
- `PASSPORT_PHOTOGRAPH`
- `LEGAL_ID`
- `DBS_CHECK`
- `OTHER`

### 6.9 Accommodation Request

Purpose:

Tracks accommodation requirements for planning.

Core fields:

- `id`
- `applicantId`
- `isAccommodationRequired`
- `accommodationType`
- `duration`
- `familyUnitSize`
- `totalAccommodationDemand`
- `notes`

Recommended accommodation type values:

- `SINGLE`
- `FAMILY`

Recommended duration values:

- `TERM_TIME`
- `FULL_YEAR`

### 6.10 User

Purpose:

Represents an authenticated staff user.

Core fields:

- `id`
- `name`
- `email`
- `role`
- `isActive`
- `createdAt`
- `updatedAt`

Recommended role values:

- `ADMISSIONS_STAFF`
- `ACADEMIC_STAFF`
- `SENIOR_LEADERSHIP`
- `SYSTEM_ADMINISTRATOR`

### 6.11 Audit Log

Purpose:

Records important changes to applicant records.

Core fields:

- `id`
- `entityType`
- `entityId`
- `action`
- `previousValue`
- `newValue`
- `performedByUserId`
- `performedAt`

---

## 7. Reporting Requirements

### 7.1 Admissions Pipeline Report

Must show:

- Number of applicants by status.
- Number of applicants by admissions year.
- Number of applicants by programme.

### 7.2 Diocese Distribution Report

Must show:

- Applicant count by diocese.
- Offer count by diocese.
- Confirmed ordinand count by diocese.

### 7.3 BAP Status Report

Must show:

- Stage 1 BAP status distribution.
- Stage 2 BAP status distribution.
- Applicants blocked due to missing BAP information.

### 7.4 Offers Versus Registrations Report

Must show:

- Conditional offers.
- Unconditional offers.
- Accepted offers.
- Registration forms received.
- Confirmed ordinands.

### 7.5 Accommodation Demand Report

Must show:

- Number of applicants requiring accommodation.
- Number of single rooms required.
- Number of family units required.
- Total accommodation demand, calculated as single rooms required plus family units required.
- Total family unit size.
- Term-time versus full-year demand.

### 7.6 Missing Documents Report

Must show:

- Applicants with incomplete document checklists.
- Missing required documents by applicant.
- Documents waived by staff.

### 7.7 Export Requirements

Reports should be exportable in at least CSV format.

Optional export formats:

- XLSX.
- PDF.

---

## 8. Permissions and Access Control

### 8.1 Role-Based Access

The system must enforce role-based access control.

Admissions Staff:

- Full access to admissions records.

Academic Staff:

- Access to assigned interview records and relevant applicant details.

Senior Leadership:

- Read-only access to dashboards and reports.

System Administrator:

- Full configuration and user management access.

Applicant:

- Form submission access only, unless applicant portal functionality is introduced.

### 8.2 Sensitive Data Handling

The system must protect sensitive applicant data, including:

- Date of birth.
- Address.
- Legal ID documents.
- DBS information.
- References.
- Interview notes.

Access to sensitive documents and notes must be restricted to authorised users.

### 8.3 Auditability

The system should record audit events for:

- Applicant status changes.
- Offer decisions.
- Document received or waived status changes.
- Interview outcome changes.
- Confirmation as ordinand.
- Permission-sensitive data updates.

---

## 9. Document Management Requirements

### 9.1 Storage Model

Applicant documents should be stored in institutional cloud storage, such as SharePoint or OneDrive.

The app should store document metadata and secure file links rather than relying on local server storage.

### 9.2 Applicant Folder

Each applicant should have a dedicated document folder.

The applicant record should include a direct link to this folder.

### 9.3 Document Checklist

The system must show whether each required document is:

- Required.
- Received.
- Outstanding.
- Waived.

### 9.4 Versioning

Document versioning should be handled by the institutional storage provider where possible.

### 9.5 Uploads

The system should support upload or linking of additional applicant files.

---

## 10. Form Requirements

### 10.1 Form Behaviour

Applicant-facing forms should:

- Be accessible via web browser.
- Be simple and mobile-friendly.
- Validate required fields before submission.
- Allow file uploads where required.
- Update applicant records automatically.
- Avoid duplicate applicant creation where an existing record can be matched.

### 10.2 Duplicate Matching

The system should attempt to match form submissions using:

- Applicant ID, when provided.
- Email address.
- Legal name and date of birth.

Potential matches should be reviewed by admissions staff if confidence is low.

### 10.3 Submission Confirmation

After submission, the applicant should see a confirmation message.

Optional email confirmation may be sent to the applicant.

---

## 11. Non-Functional Requirements

### 11.1 Usability

The system must be usable by non-technical administrative staff.

Interface requirements:

- Clear labels.
- Minimal nested navigation.
- Simple status indicators.
- Easy search and filtering.
- Clear error messages.
- No unnecessary CRM-style complexity.

### 11.2 Accessibility

The system should follow WCAG 2.1 AA principles where practical.

Required considerations:

- Keyboard navigability.
- Sufficient colour contrast.
- Accessible form labels.
- Screen-reader friendly validation messages.

### 11.3 Reliability

The system should be reliable for long-term administrative use.

Required considerations:

- Durable data storage.
- Regular backups.
- Safe form submission handling.
- Protection from accidental data loss.

### 11.4 Security

The system must protect applicant data through:

- Secure authentication.
- Role-based access control.
- HTTPS-only access.
- Secure file upload handling.
- Least-privilege access to Microsoft Graph or document storage integrations.

### 11.5 Maintainability

The system should be straightforward to maintain by a small technical team.

Required considerations:

- Clear data model.
- Minimal infrastructure complexity.
- Type-safe application code.
- Version-controlled schema changes.
- Audit-friendly operational behaviour.

### 11.6 Performance

The system only needs to support small annual cohorts, but common screens should load quickly.

Expected scale:

- Small number of staff users.
- Small annual applicant cohorts.
- Long-term records across multiple admissions years.

---

## 12. Architecture and Tech Stack

### 12.1 Recommended Architecture

The recommended architecture is a single bespoke web application with a relational database and institutional document storage integration.

High-level architecture:

```text
Applicant Forms / Staff UI
        |
        v
Next.js Web Application
        |
        v
PostgreSQL Database
        |
        v
SharePoint / OneDrive Document Storage
        |
        v
Microsoft Entra ID Authentication
```

### 12.2 Frontend

Recommended technologies:

- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- React Hook Form.
- Zod.

Frontend responsibilities:

- Applicant-facing forms.
- Staff dashboard.
- Applicant list and detail screens.
- Interview screens.
- Reporting screens.
- Administration screens.

### 12.3 Backend

Recommended technologies:

- Next.js server-side routes or Server Actions.
- TypeScript.
- Prisma ORM.

Backend responsibilities:

- Form submission handling.
- Validation.
- Workflow transitions.
- Role-based access enforcement.
- Report data queries.
- Document metadata persistence.
- Microsoft Graph integration.

### 12.4 Database

Recommended database:

- PostgreSQL.

Recommended managed providers:

- Supabase.
- Neon.
- Azure Database for PostgreSQL.

Database responsibilities:

- Applicant records.
- Workflow statuses.
- Interview records.
- Offer records.
- Registration records.
- Document metadata.
- Accommodation data.
- User roles.
- Audit logs.

### 12.5 Authentication

Recommended authentication provider:

- Microsoft Entra ID.

Recommended implementation options:

- Auth.js with Microsoft provider.
- Supabase Auth with Microsoft provider.

Authentication responsibilities:

- Staff login.
- User identity.
- Role assignment.
- Restricted administrative access.

### 12.6 Document Storage

Recommended storage provider:

- SharePoint or OneDrive through Microsoft Graph.

Storage responsibilities:

- Applicant folders.
- Uploaded documents.
- Version control.
- Secure document access.
- File links stored in the application database.

### 12.7 Hosting

Recommended hosting options:

Option A: Developer-friendly managed hosting

- Vercel for the web app.
- Supabase or Neon for PostgreSQL.
- SharePoint or OneDrive for documents.

Option B: Microsoft-aligned hosting

- Azure App Service for the web app.
- Azure Database for PostgreSQL.
- Microsoft Entra ID.
- SharePoint or OneDrive for documents.

### 12.8 Email Notifications

Recommended email options:

- Microsoft Graph mail API.
- Resend.
- Postmark.
- SendGrid.

Potential notification events:

- Application received.
- Interview application received.
- Interview scheduled.
- Offer recorded.
- Registration form received.
- Missing documents reminder.

---

## 13. Data Migration Requirements

The system must support migration from the existing spreadsheet-based prototype.

Migration requirements:

- Import applicant records from CSV or XLSX.
- Map spreadsheet columns to application fields.
- Preserve applicant status where possible.
- Import document checklist status where available.
- Link existing SharePoint folders where available.
- Identify duplicate applicants during import.
- Produce import error reports for rows that cannot be imported.

---

## 14. Business Rules

### 14.1 Applicant Identity

- Each applicant must have a unique applicant ID.
- Email should be treated as a strong duplicate-detection field but not necessarily as a guaranteed unique identifier.

### 14.2 BAP Rules

- Stage 1 BAP status must be `COMPLETED` or `SCHEDULED` before an applicant can progress beyond enquiry, unless an authorised exception is recorded.
- Stage 2 BAP status must be captured for conditional offers where the condition relates to Stage 2 BAP.

### 14.3 Interview Rules

- Interviews cannot be scheduled before Stage 1 BAP is completed or scheduled.
- Interview outcome cannot be recorded without an interview record.
- Applicants should not progress to offer decision until required interview steps are complete or explicitly marked as not required.

### 14.4 Offer Rules

- Conditional offers must include conditions.
- Applicants cannot be moved to registration unless they have accepted an offer.
- Declined and withdrawn applicants should remain visible in reports but should not appear in active registration workflows.

### 14.5 Registration Rules

- Applicants cannot be confirmed as ordinands until registration form is received.
- Mandatory documents must be received or waived before confirmation.
- Accommodation fields must be completed where accommodation is required.

### 14.6 Document Rules

- Required documents must be displayed clearly as received, outstanding, or waived.
- Waived documents should require a staff note.
- Uploaded documents must be linked to the correct applicant record.

---

## 15. Success Metrics

The product should be considered successful if it achieves the following:

- Admissions staff can determine the current status of every applicant without relying on spreadsheets.
- Applicant forms populate records automatically.
- Staff can see missing documents at a glance.
- Interview scheduling and outcomes are tracked in one place.
- Senior leadership can view admissions and accommodation demand without requesting manual summaries.
- Reports can be exported reliably.
- Existing spreadsheet data can be imported into the system.
- Non-technical staff can use the system with minimal training.

---

## 16. Open Product Questions

The following questions should be resolved before final design:

- Should applicants have authenticated portal access, or should they only use one-time form links?
- Should document upload happen directly in the app, or should staff manually manage files in SharePoint and paste folder links?
- Should academic staff see full applicant records or only interview-specific summaries?
- Should the system generate applicant IDs automatically using an admissions-year prefix?
- Should email notifications be required in the first release or treated as optional?
- Should electronic signature be a typed declaration, uploaded signed form, or formal e-signature integration?
- Should DBS checks be tracked as document metadata only, or should access be further restricted?

