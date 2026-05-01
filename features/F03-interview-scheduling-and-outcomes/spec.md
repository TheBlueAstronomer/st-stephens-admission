# F03 — Interview Scheduling and Outcomes

## Goal

Enable admissions staff to schedule interviews and assign interviewers, and enable academic staff to record interview notes and outcomes, covering both Exploratory Visit and Visit-Interview types.

## Scope

- Interview detail screen (§5.5): linked applicant, interview type, date and time, assigned interviewer or panel, interview status, notes, outcome, and follow-up actions.
- Schedule interview flow (§4.3): admissions staff select interview type, date, time, and assigned interviewer; system validates Stage 1 BAP prerequisite before allowing scheduling.
- Record interview outcome flow (§4.4): academic staff enter notes and outcome; system marks interview completed and advances applicant status to `INTERVIEW_COMPLETED`.
- Business rule enforcement (§14.3):
  - Interviews cannot be scheduled before Stage 1 BAP is `COMPLETED` or `SCHEDULED`, unless an authorised exception exists.
  - Outcome cannot be recorded without a scheduled interview date.
  - Applicant cannot progress to offer decision until required interview steps are complete or explicitly marked as not required.
- Invitation tracking: record invitation sent date, timestamp, and sending user.
- Interview application form received tracking: timestamp on receipt.

## Acceptance Criteria

- [x] Admissions staff can schedule an interview by selecting type, date, time, and assigned interviewer; the applicant status transitions to `INTERVIEW_SCHEDULED`.
- [x] Scheduling is blocked when Stage 1 BAP status is incomplete or missing, and the block is surfaced with a clear validation message, unless a BAP exception is on record.
- [x] Assigning an academic staff member to an interview grants that user access to the interview record and the applicant's interview-relevant details.
- [x] Academic staff can open their assigned interview, enter notes, and record an outcome; the applicant status transitions to `INTERVIEW_COMPLETED`.
- [x] Academic staff cannot access interview records they are not assigned to.
- [x] Recording an outcome without a scheduled interview date is blocked server-side.
- [x] Invitation sent date, timestamp, and sending user are recorded when an invitation action is performed.
- [x] Interview application received timestamp is recorded when the form receipt is marked.
- [x] The interview record is visible in the applicant detail screen audit timeline.
- [x] All interview state changes write entries to the `AuditLog`.
- [x] Unit tests cover scheduling validation rules; integration tests cover the full schedule → outcome flow for each interview type.
