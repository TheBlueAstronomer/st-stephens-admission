# F05 — Document Management: User Stories

> Each story is a vertical TDD slice. Stories are ordered by dependency. Depends on F01 (auth, RBAC) and F02 (applicant records).

---

## US-01: Display Document Checklist

**As an** admissions staff member  
**I want** to see a document checklist for each applicant showing all required document types with their current status (Required, Received, Outstanding, Waived)  
**So that** I can immediately see what documents are missing

### TDD Focus
- **Test**: Seed an applicant with no documents; render the checklist; assert all PRD document types are listed with status `OUTSTANDING` for required types.
- **Test**: Seed an applicant with one document marked `RECEIVED`; assert the checklist shows `RECEIVED` for that type and `OUTSTANDING` for others.

### Acceptance Criteria
- [ ] All document types from PRD §6.8 are displayed in the checklist.
- [ ] Each document shows required status, received status, waived status, received date, linked file, and notes.
- [ ] Status is clearly displayed as `RECEIVED`, `OUTSTANDING`, or `WAIVED`.

### Implementation Steps
1. **Create the Documents tab** — inside the Applicant Detail page (`src/app/(staff)/applicants/[id]/page.tsx`), add a "Documents" tab panel.
2. **Fetch the checklist data** — query all `DocumentType` records (from admin config) and left-join with the applicant's `ApplicantDocument` records. Compute status for each: `RECEIVED` if `isReceived`, `WAIVED` if `isWaived`, else `OUTSTANDING`.
3. **Build the checklist table** — shadcn `Table` with columns: Document Name, Required (Phosphor `CheckCircle` / `Circle`), Status (`Badge` colour-coded: green for Received, amber for Outstanding, grey for Waived), Received Date, File Link (Phosphor `FileArrowDown`), Notes, Actions (`DropdownMenu`).
4. **Add row-level colour coding** — `OUTSTANDING` rows get `bg-amber-50` left border stripe. `RECEIVED` rows get `bg-green-50/5`. `WAIVED` rows get muted text.
5. **Add a completion summary** — above the table, show a circular `Progress` ring with "X / Y documents received" and a percentage.
6. **Write tests** — seed applicant with no docs (assert all `OUTSTANDING`), seed with one received (assert correct status), seed with one waived (assert `WAIVED`).

### Playwright E2E Tests
Create `e2e/f05-document-checklist.spec.ts`:
1. **Checklist renders on applicant detail** — sign in as Alice (ADMISSIONS_STAFF); navigate to a seeded applicant’s detail page; click the "Documents" tab; assert the document checklist table is visible with columns: Document Name, Required, Status, Received Date, File Link.
2. **Status badges display** — assert at least one document shows a status badge (`OUTSTANDING`, `RECEIVED`, or `WAIVED`). Verify colour coding (green for received, amber for outstanding, grey for waived).
3. **Completion summary** — assert a completion summary (e.g., "X / Y documents received") is displayed above the table.
4. **Row actions menu** — click the actions menu on an `OUTSTANDING` document row; assert options include "Upload & Mark Received" and "Waive Requirement".

> 📎 Refer to `wireframes.md` §"Screen 1 — Document Checklist Tab" for table layout, status badges, and completion ring.

---

## US-02: Mark Document as Received

**As an** admissions staff member  
**I want** to mark a document as received, record the received date, and link the uploaded file  
**So that** the document checklist is up to date

### TDD Focus
- **Test**: Call the mark-received action for a document type; assert `isReceived = true`, `receivedAt` is set, and the file URL is stored.
- **Test**: Assert an `AuditLog` entry is created for the status change.

### Acceptance Criteria
- [ ] Staff can mark a document as received.
- [ ] Received date is recorded.
- [ ] A file link is stored in the record.
- [ ] The checklist updates immediately.
- [ ] An `AuditLog` entry records the change.

### Implementation Steps
1. **Create the `markDocumentReceived` server action** — `requireRole('ADMISSIONS_STAFF')`. Accept `applicantId`, `documentTypeId`, `fileUrl`, `fileName`. Set `isReceived = true`, `receivedAt = new Date()`, store the file URL.
2. **Create `AuditLog` entry** — record `action: 'DOCUMENT_RECEIVED'` with document type name.
3. **Build the Upload Document dialog** — triggered from the row actions `DropdownMenu` → "Upload & Mark Received". Use shadcn `Dialog` with: drag-and-drop zone (`onDragOver`/`onDrop`), accepted file types (`pdf,doc,docx,jpg,png`), file preview thumbnail, upload `Progress` bar, "Upload & Mark Received" button.
4. **Integrate with SharePoint upload** (US-04) — the dialog calls the Graph upload action first, then uses the returned URL to mark received.
5. **Optimistic UI update** — immediately update the checklist row to `RECEIVED` before server confirmation.
6. **Write tests** — call action (assert `isReceived`, `receivedAt`, file URL stored), assert audit log created.

> 📎 Refer to `wireframes.md` §"Screen 2 — Upload Document" for dialog anatomy.

---

## US-03: Waive a Document Requirement

**As an** admissions staff member  
**I want** to waive a document requirement with a mandatory staff note  
**So that** exceptions are documented and the document is no longer blocking confirmation

### TDD Focus
- **Test**: Call the waive-document action with a non-empty note; assert `isWaived = true` and the note is stored.
- **Test**: Call the waive-document action with an empty note; assert it is blocked with a validation error.
- **Test**: Assert an `AuditLog` entry is created.

### Acceptance Criteria
- [ ] Staff can waive a document with a note.
- [ ] Waiving without a note is blocked with a validation error.
- [ ] The document is displayed as `WAIVED` in the checklist.
- [ ] An `AuditLog` entry records the waiver with the note.

### Implementation Steps
1. **Create the `waiveDocument` server action** — `requireRole('ADMISSIONS_STAFF')`. Accept `applicantId`, `documentTypeId`, `waiverNote` (required, non-empty string). Set `isWaived = true`, store the note.
2. **Validate the note** — reject if `waiverNote` is empty or whitespace-only (Zod `.min(1)`).
3. **Create `AuditLog` entry** — record `action: 'DOCUMENT_WAIVED'` with the waiver note.
4. **Build the Waive Document sheet** — triggered from row actions `DropdownMenu` → "Waive Requirement". Right-side `Sheet` (400px) with: document name display, `Textarea` for staff note (label: "Reason for waiver *"), amber `Alert` ("This action will mark the document as not required"), "Confirm Waiver" button.
5. **Write tests** — waive with note (assert `isWaived` + note stored + audit log), waive with empty note (assert Zod error).

> 📎 Refer to `wireframes.md` §"Screen 3 — Waive Document" for Sheet layout.

---

## US-04: Upload File to SharePoint/OneDrive via Microsoft Graph

**As an** admissions staff member  
**I want** to upload a file through the app and have it stored in the applicant's SharePoint/OneDrive folder  
**So that** documents are centrally stored in institutional cloud storage

### TDD Focus
- **Test**: Mock the Microsoft Graph upload API; call the upload action with a file; assert the Graph API is called with the correct folder path and file; assert only the secure URL and metadata are stored in the database.
- **Test**: Assert the file is not stored locally or in the app database.

### Acceptance Criteria
- [ ] Uploaded files are sent to SharePoint/OneDrive via Microsoft Graph.
- [ ] Only the secure URL and metadata (filename, storage provider) are stored in the database.
- [ ] The uploaded file is linked to the correct applicant document record.

### Implementation Steps
1. **Create a Microsoft Graph service** — `src/lib/services/microsoft-graph.ts`. Initialize the Graph client with app-level credentials (client credentials flow).
2. **Implement `uploadToSharePoint()`** — accepts `applicantId`, `fileName`, `fileBuffer`. Uploads to `sites/{siteId}/drive/root:/{applicantFolder}/{fileName}:/content`. Returns the file's web URL and drive item ID.
3. **Create the `uploadDocument` server action** — `requireRole('ADMISSIONS_STAFF')`. Accept a `File` via `FormData`, call `uploadToSharePoint()`, store only the `fileUrl`, `fileName`, and `storageProvider: 'SHAREPOINT'` in the `ApplicantDocument` record. Do NOT store the file blob in the database.
4. **Error handling** — if the Graph API call fails, return a clear error. Show a `Toast` variant `destructive` in the UI.
5. **Write tests** — mock Graph API; call upload action (assert Graph called with correct path, assert DB stores URL only, assert no local file storage).

---

## US-05: Applicant Folder Linking

**As an** admissions staff member  
**I want** each applicant record to display a direct link to their SharePoint/OneDrive folder  
**So that** I can quickly navigate to all their documents

### TDD Focus
- **Test**: Seed an applicant with a folder URL; render the detail screen; assert a clickable link to the folder is displayed.
- **Test**: Create a new applicant with folder auto-creation (mock Graph); assert the folder URL is stored.

### Acceptance Criteria
- [ ] The applicant record displays a direct link to their document folder.
- [ ] The link opens the folder in SharePoint/OneDrive.

### Implementation Steps
1. **Store folder URL on applicant record** — add a `sharePointFolderUrl` field on the `Applicant` model (if not already in schema). When creating an applicant, call Graph API to create the folder and store the URL.
2. **Display folder link** — in the Applicant Detail left column, add a Phosphor `FolderOpen` icon + "SharePoint Folder" link that opens the URL in a new tab.
3. **Auto-create folder on applicant creation** — in the `createApplicant` action, after DB insert, call `createSharePointFolder()` (Graph: create folder at `/{applicantId}/`). Store the returned URL. If Graph call fails, store null and show a `Toast` warning.
4. **Write tests** — seed applicant with folder URL (render detail, assert clickable link), create new applicant (mock Graph, assert folder URL stored).

---

## US-06: Sensitive Document Access Restriction

**As a** system  
**I want** access to sensitive document types (Legal ID, DBS check, references, interview notes) to be restricted to `ADMISSIONS_STAFF` and `SYSTEM_ADMINISTRATOR`  
**So that** sensitive applicant data is protected

### TDD Focus
- **Test**: Request a Legal ID document as `ACADEMIC_STAFF`; assert 403.
- **Test**: Request a Legal ID document as `ADMISSIONS_STAFF`; assert 200.
- **Test**: Request a GCSE transcript (non-sensitive) as `ACADEMIC_STAFF`; assert 200 (if they have applicant access).

### Acceptance Criteria
- [ ] Sensitive document types are only accessible to `ADMISSIONS_STAFF` and `SYSTEM_ADMINISTRATOR`.
- [ ] Non-sensitive documents follow standard role-based access.

### Implementation Steps
1. **Define sensitive document types** — in `src/lib/constants/document-types.ts`, maintain a list of sensitive type slugs: `LEGAL_ID`, `DBS_CHECK`, `REFERENCES`, `INTERVIEW_NOTES`.
2. **Create `isSensitiveDocument()` utility** — accepts a document type slug, returns `boolean`.
3. **Guard in data layer** — in the document checklist query, filter out sensitive documents for `ACADEMIC_STAFF` and `SENIOR_LEADERSHIP`. Only `ADMISSIONS_STAFF` and `SYSTEM_ADMINISTRATOR` see them.
4. **Guard in server actions** — in `markDocumentReceived`, `waiveDocument`, and `uploadDocument`, reject calls for sensitive document types from unauthorised roles.
5. **UI filtering** — the checklist table hides sensitive document rows for non-authorised roles.
6. **Write tests** — request Legal ID as `ACADEMIC_STAFF` (assert 403 / hidden), as `ADMISSIONS_STAFF` (assert 200 / visible), request non-sensitive doc as `ACADEMIC_STAFF` (assert visible).

### Playwright E2E Tests
Add to `e2e/f05-document-checklist.spec.ts`:
1. **ADMISSIONS_STAFF sees sensitive docs** — sign in as Alice; navigate to the Documents tab of a seeded applicant; assert sensitive document types (e.g., "Legal ID", "DBS Check") are visible in the checklist.
2. **ACADEMIC_STAFF cannot see sensitive docs** — sign in as Bob (ACADEMIC_STAFF); navigate to the same applicant’s Documents tab (if accessible); assert sensitive document types are NOT displayed in the checklist.
3. **Non-sensitive docs visible to ACADEMIC_STAFF** — assert non-sensitive document types (e.g., transcripts) are still visible to Bob.

---

## US-07: Missing Documents Query

**As a** system  
**I want** a queryable view of applicants with outstanding required documents  
**So that** the Missing Documents Report (F07) has accurate data

### TDD Focus
- **Test**: Seed applicants with varying document completion states; query for applicants with outstanding required documents; assert only applicants with at least one `OUTSTANDING` required document are returned.
- **Test**: Waive a document; assert the applicant is no longer in the missing docs result (if all other docs are received).

### Acceptance Criteria
- [ ] The query returns applicants with at least one outstanding required document that is not waived.
- [ ] The query includes which specific documents are missing per applicant.
- [ ] Waived documents are excluded from the "missing" count.

### Implementation Steps
1. **Create a `getMissingDocuments()` query** — `src/lib/queries/documents.ts`. Accepts optional filters (admissions year, programme, status). Returns applicants with at least one mandatory document that is `!isReceived && !isWaived`.
2. **Include per-applicant missing list** — for each applicant, return the array of missing document type names.
3. **Exclude waived docs** — the query condition explicitly checks `isWaived === false`.
4. **Expose for F07** — this query powers the Missing Documents Report (F07-US-08). Ensure it accepts filter params and returns data in a format suitable for both the report and CSV export.
5. **Write tests** — seed applicants with varying completion; call query (assert only applicants with outstanding non-waived docs returned); waive a doc, re-query (assert applicant removed if fully complete).
