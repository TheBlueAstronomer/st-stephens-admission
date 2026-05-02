# F05 — Document Management: User Stories

> Each story is a vertical TDD slice. Stories are ordered by dependency. Depends on F01 (auth, RBAC) and F02 (applicant records).

---

## US-01: Display Document Checklist

**As an** admissions staff member  
**I want** to see a document checklist for each applicant showing all required document types with their current status (Required, Received, Outstanding, Waived)  
**So that** I can immediately see what documents are missing

### TDD Focus
- **Test**: Seed an applicant with no `ApplicantDocument` records; call `getDocumentChecklist`; assert all 14 document types are returned, all with status `OUTSTANDING`.
- **Test**: Seed an applicant with one document marked `RECEIVED`; assert the checklist shows `RECEIVED` for that type and `OUTSTANDING` for all others.
- **Test**: The checklist is never empty — even for a brand-new applicant with zero document records, all 14 rows appear.

### Acceptance Criteria
- [x] All 14 document types are always displayed as rows in the checklist, regardless of whether any `ApplicantDocument` records exist.
- [x] Each row shows: document name, sensitive lock icon (if applicable), required indicator, status badge, received date, file link, and row actions menu.
- [x] Status is clearly displayed as `RECEIVED`, `OUTSTANDING`, or `WAIVED`.
- [x] The completion progress bar counts satisfied (RECEIVED + WAIVED) against total required types.

### Implementation Steps
1. **Create the Documents tab** — inside the Applicant Detail page (`src/app/(staff)/applicants/[id]/page.tsx`), add a "Documents" tab panel.
2. **Fetch the checklist via `getDocumentChecklist`** — server-side query that fetches all active `DocumentType` records and left-joins with `ApplicantDocument` records for this applicant. Returns `DocumentChecklistItem[]` with status computed as `RECEIVED` / `WAIVED` / `OUTSTANDING`. Sensitive rows are filtered out for non-privileged roles.
3. **Pass checklist to `DocumentsTab`** — page RSC calls `getDocumentChecklist(applicant.id, role)` in parallel with other data fetches and passes the result as a `documentChecklist` prop through `ApplicantDetailView`.
4. **Render from `documentChecklist` not `applicant.documents`** — the table always maps over all checklist rows, never `applicant.documents` (which may be empty).
5. **Add a completion summary** — above the table, show a progress bar with "Completion: X / Y documents complete" and a percentage. Counts `RECEIVED + WAIVED` against required-type rows.
6. **Write tests** — call `getDocumentChecklist` with no docs (assert all 14 rows returned, all `OUTSTANDING`), with one received (assert correct status), with one waived (assert `WAIVED`).

### Playwright E2E Tests
Create `e2e/f05-document-checklist.spec.ts`:
1. **Checklist always renders all rows** — sign in as Alice (ADMISSIONS_STAFF); navigate to Sophie Turner’s detail page; click the "Documents" tab; assert all 14 document rows are visible.
2. **Status badges display** — assert at least one document shows a status badge (`OUTSTANDING`, `RECEIVED`, or `WAIVED`). Verify colour coding (green for received, red for outstanding, muted for waived).
3. **Completion summary** — assert a completion summary (e.g., "Completion: X / Y documents complete") is displayed above the table.
4. **Row actions menu** — click the three-dot actions menu on an `OUTSTANDING` document row; assert options include "Mark as Received", "Upload File", and "Waive".

> 📎 Refer to `wireframes.md` §"Screen 1 — Document Checklist Tab" for table layout, status badges, and completion progress bar.

---

## US-02: Mark Document as Received

**As an** admissions staff member  
**I want** to mark a document as received, record the received date, and link the uploaded file  
**So that** the document checklist is up to date

### TDD Focus
- **Test**: Call the mark-received action for a document type; assert `isReceived = true`, `receivedAt` is set, and the file URL is stored.
- **Test**: Assert an `AuditLog` entry is created for the status change.

### Acceptance Criteria
- [x] Staff can mark a document as received.
- [x] Received date is recorded.
- [x] A file link is stored in the record.
- [x] The checklist updates immediately.
- [x] An `AuditLog` entry records the change.

### Implementation Steps
1. **Create the `markDocumentReceived` server action** — `requireRole('ADMISSIONS_STAFF')`. Accept `applicantId`, `documentTypeId`, `fileUrl`, `fileName`. Set `isReceived = true`, `receivedAt = new Date()`, store the file URL.
2. **Create `AuditLog` entry** — record `action: 'DOCUMENT_RECEIVED'` with document type name.
3. **Build the Upload Document dialog** — triggered from the row actions `DropdownMenu` → "Mark as Received" or "Upload File". The dialog opens pre-labelled with the document name from the checklist row (no type selector shown when opened from a row). Includes: drag-and-drop zone, accepted file types (`pdf,doc,docx,jpg,png`), file size display, Browse files `<label>` (not `<button>`) to preserve trusted click context, upload `Progress` bar, received date field, optional notes.
4. **Integrate with SharePoint upload** (US-04) — the dialog calls the Graph upload action first, then uses the returned URL to mark received.
5. **Write tests** — call action (assert `isReceived`, `receivedAt`, file URL stored), assert audit log created.

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
- [x] Staff can waive a document with a note.
- [x] Waiving without a note is blocked with a validation error.
- [x] The document is displayed as `WAIVED` in the checklist.
- [x] An `AuditLog` entry records the waiver with the note.

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
- [x] Uploaded files are sent to SharePoint/OneDrive via Microsoft Graph.
- [x] Only the secure URL and metadata (filename, storage provider) are stored in the database.
- [x] The uploaded file is linked to the correct applicant document record.

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
- [x] The applicant record displays a direct link to their document folder.
- [x] The link opens the folder in SharePoint/OneDrive.

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
- [x] Sensitive document types are only accessible to `ADMISSIONS_STAFF` and `SYSTEM_ADMINISTRATOR`.
- [x] Non-sensitive documents follow standard role-based access.

### Implementation Steps
1. **Define sensitive document types** — in `src/lib/constants/document-types.ts`, maintain a list of sensitive type slugs: `LEGAL_ID`, `DBS_CHECK`, `MEDICAL_DECLARATION` only. Academic references, pastoral reference, and interview notes are not sensitive.
2. **Create `isSensitiveDocument()` utility** — accepts a document type slug, returns `boolean`.
3. **Guard in data layer** — in the document checklist query, filter out sensitive documents for `ACADEMIC_STAFF` and `SENIOR_LEADERSHIP`. Only `ADMISSIONS_STAFF` and `SYSTEM_ADMINISTRATOR` see them.
4. **Guard in server actions** — in `markDocumentReceived`, `waiveDocument`, and `uploadDocument`, reject calls for sensitive document types from unauthorised roles.
5. **UI filtering** — the checklist table hides sensitive document rows for non-authorised roles.
6. **Write tests** — request Legal ID as `ACADEMIC_STAFF` (assert 403 / hidden), as `ADMISSIONS_STAFF` (assert 200 / visible), request non-sensitive doc as `ACADEMIC_STAFF` (assert visible).

### Playwright E2E Tests
Add to `e2e/f05-document-checklist.spec.ts`:
1. **ADMISSIONS_STAFF sees all rows including sensitive** — sign in as Alice; navigate to Sophie Turner’s Documents tab; assert "Legal ID", "DBS Check", and "Medical Declaration" rows are visible with a lock icon; assert all 14 rows are present.
2. **ACADEMIC_STAFF cannot see sensitive docs** — sign in as Bob (ACADEMIC_STAFF); navigate to the same applicant’s Documents tab (if accessible); assert "Legal ID", "DBS Check", and "Medical Declaration" rows are NOT visible; assert other rows (e.g., transcripts) are visible.
3. **Lock icon only on sensitive rows** — as Alice, assert the lock icon is visible on exactly the Legal ID, DBS Check, and Medical Declaration rows, and not on non-sensitive rows (e.g., GCSE Transcript).

---

## US-07: Missing Documents Query

**As a** system  
**I want** a queryable view of applicants with outstanding required documents  
**So that** the Missing Documents Report (F07) has accurate data

### TDD Focus
- **Test**: Seed applicants with varying document completion states; query for applicants with outstanding required documents; assert only applicants with at least one `OUTSTANDING` required document are returned.
- **Test**: Waive a document; assert the applicant is no longer in the missing docs result (if all other docs are received).

### Acceptance Criteria
- [x] The query returns applicants with at least one outstanding required document that is not waived.
- [x] The query includes which specific documents are missing per applicant.
- [x] Waived documents are excluded from the "missing" count.

### Implementation Steps
1. **Create a `getMissingDocuments()` query** — `src/lib/queries/documents.ts`. Accepts optional filters (admissions year, programme, status). Returns applicants with at least one mandatory document that is `!isReceived && !isWaived`.
2. **Include per-applicant missing list** — for each applicant, return the array of missing document type names.
3. **Exclude waived docs** — the query condition explicitly checks `isWaived === false`.
4. **Expose for F07** — this query powers the Missing Documents Report (F07-US-08). Ensure it accepts filter params and returns data in a format suitable for both the report and CSV export.
5. **Write tests** — seed applicants with varying completion; call query (assert only applicants with outstanding non-waived docs returned); waive a doc, re-query (assert applicant removed if fully complete).
