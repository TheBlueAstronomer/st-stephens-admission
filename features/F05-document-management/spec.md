# F05 — Document Management

## Goal

Track the required document checklist for each applicant, support linking documents to SharePoint or OneDrive via Microsoft Graph, and allow staff to mark documents as received or waived with appropriate notes.

## Scope

- Document checklist section within the applicant detail screen (§5.6): all 14 document types are always pre-populated as rows — the checklist is never empty. Each row shows required status, received status, waived status, received date, linked file, and notes. Statuses default to `OUTSTANDING` until staff act on them.
- Link applicant to a dedicated SharePoint or OneDrive folder via Microsoft Graph; store the folder link in the applicant record.
- Allow staff to upload files via the app; files are stored in the applicant's SharePoint or OneDrive folder via Microsoft Graph; only document metadata and the secure file URL are persisted in the application database.
- Allow staff to mark a document as received, enter received date, and link the stored file.
- Allow staff to waive a document requirement; a staff note is mandatory for waived documents (§14.6).
- Display document completion status clearly as `RECEIVED`, `OUTSTANDING`, or `WAIVED` for each required document.
- Prevent ordinand confirmation when mandatory documents are outstanding and not waived (enforced in F04 but the checklist is managed here).

## Acceptance Criteria

- [ ] The document checklist always displays all 14 document types as rows regardless of whether any have been acted on; statuses default to `OUTSTANDING`.
- [ ] Staff can mark a document as received, record the received date, and link a file; the checklist updates immediately.
- [ ] Staff can waive a document; the system requires a non-empty waiver note before saving; the document is shown as `WAIVED` in the checklist.
- [ ] Waiving a document without a note is blocked with a validation error.
- [ ] Uploading a file sends it to the applicant's SharePoint or OneDrive folder via Microsoft Graph; only the secure URL and metadata are stored in the database.
- [ ] Each applicant record displays a direct link to their SharePoint or OneDrive folder.
- [ ] A missing documents view (used by F07 reports) can query applicants with outstanding required documents.
- [ ] Document received and waived status changes write entries to the `AuditLog`.
- [ ] Access to sensitive document types (Legal ID, DBS Check, Medical Declaration) is restricted to `ADMISSIONS_STAFF` and `SYSTEM_ADMINISTRATOR`. The lock icon (🔒) is displayed only for these three types.
- [ ] Unit tests cover waiver note validation and document status transitions; integration tests cover file upload, folder linking, and checklist state queries.
