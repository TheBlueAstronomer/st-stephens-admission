# F03 — Interview Scheduling and Outcomes: User Stories

> Each story is a vertical TDD slice. Stories are ordered by dependency. Depends on F01 (auth, RBAC) and F02 (applicant records).

---

## US-01: Schedule an Interview

**As an** admissions staff member  
**I want** to schedule an interview for an applicant by selecting type (Exploratory Visit or Visit-Interview), date, time, and assigned interviewer  
**So that** the interview is recorded and the applicant status advances to `INTERVIEW_SCHEDULED`

### TDD Focus
- **Test**: Call the schedule-interview server action with valid data (applicant with BAP `COMPLETED`, type, date, interviewer ID); assert an Interview record is created and applicant status is `INTERVIEW_SCHEDULED`.
- **Test**: Assert the Interview record contains the correct `interviewType`, `scheduledAt`, and assigned interviewer.

### Acceptance Criteria
- [ ] An Interview record is created linked to the applicant.
- [ ] The applicant status transitions to `INTERVIEW_SCHEDULED`.
- [ ] The interview type is one of `EXPLORATORY_VISIT` or `VISIT_INTERVIEW`.
- [ ] An `AuditLog` entry is created for the scheduling action.

### Implementation Steps
1. **Create a Zod schema** — `src/lib/validations/interview.ts` requiring `interviewType` (enum), `scheduledAt` (datetime), and `interviewerIds` (array of user IDs).
2. **Create the `scheduleInterview` server action** — `src/app/(staff)/applicants/[id]/actions.ts`. Apply `requireRole('ADMISSIONS_STAFF')`. Validate input, create an `Interview` record linked to the applicant, and transition applicant status to `INTERVIEW_SCHEDULED`.
3. **Assign interviewers** — create join records linking `Interview` to `User` (academic staff). Validate that assigned users have `ACADEMIC_STAFF` role.
4. **Create `AuditLog` entry** — record scheduling event with applicant ID, interview type, date, and assigned interviewers.
5. **Build the Schedule Interview dialog** — triggered by "Schedule Interview" quick action on Applicant Detail. Use shadcn `Dialog` with Double-Bezel shell. Include: applicant name + ID display, `RadioGroup` for interview type (pill toggle cards), `Popover` + `Calendar` for date/time, `Combobox` (Command pattern) for interviewer search, "+ Add panel member" button.
6. **Write tests** — valid scheduling (assert Interview created + status updated), assert Interview record fields are correct.

### Playwright E2E Tests
Create `e2e/f03-interview-scheduling.spec.ts`:
1. **Schedule Interview dialog opens** — sign in as Alice (ADMISSIONS_STAFF); navigate to a seeded applicant detail (BAP `COMPLETED`); click "Schedule Interview" quick action; assert the Schedule Interview dialog is visible with interview type options, date picker, and interviewer selector.
2. **Complete scheduling flow** — select interview type, pick a date, assign an interviewer; click "Schedule →"; assert the dialog closes, the applicant’s status badge updates to `INTERVIEW_SCHEDULED`, and a success toast or confirmation is shown.
3. **Schedule Interview button disabled for wrong status** — navigate to an applicant with status `CONFIRMED_ORDINAND`; assert the "Schedule Interview" button is disabled or hidden.

> 📎 Refer to `wireframes.md` §"Screen 1 — Schedule Interview" for dialog layout and component anatomy.

---

## US-02: BAP Prerequisite Validation for Scheduling

**As a** system  
**I want** to block interview scheduling when Stage 1 BAP is not `COMPLETED` or `SCHEDULED`  
**So that** interviews only proceed for applicants who have met the BAP prerequisite

### TDD Focus
- **Test**: Attempt to schedule an interview for an applicant with BAP `INCOMPLETE`; assert it is blocked with a clear validation message.
- **Test**: Schedule for an applicant with BAP `COMPLETED`; assert it succeeds.
- **Test**: Schedule for an applicant with BAP `INCOMPLETE` but a recorded BAP exception; assert it succeeds.

### Acceptance Criteria
- [ ] Scheduling is blocked when BAP status is incomplete or missing.
- [ ] A clear validation message explains the block.
- [ ] A BAP exception on record bypasses the block.

### Implementation Steps
1. **Integrate `validateBAPGate()`** — at the top of `scheduleInterview`, call the BAP gate utility from `src/lib/business-rules/bap-gate.ts` (built in F02-US-07). If blocked, return the validation message.
2. **Build UI warning** — in the Schedule Interview dialog, show a shadcn `Alert` variant `warning` with Phosphor `Warning` icon when BAP is incomplete. Disable the "Schedule →" button and show a `Tooltip` explaining the gate.
3. **Handle exception bypass** — if the applicant has `hasStageOneBAPException === true`, allow scheduling and hide the warning.
4. **Write tests** — attempt scheduling with BAP `INCOMPLETE` (assert blocked + message), with BAP `COMPLETED` (assert success), with exception on record (assert success).

---

## US-03: Record Interview Outcome

**As an** academic staff member (assigned interviewer)  
**I want** to enter interview notes and record an outcome for my assigned interview  
**So that** the interview is marked completed and the applicant can proceed to offer review

### TDD Focus
- **Test**: Call the record-outcome server action as the assigned interviewer with notes and outcome; assert the interview status is `COMPLETED`, `completedAt` is set, and the applicant status is `INTERVIEW_COMPLETED`.
- **Test**: Call the action as a different academic staff member (not assigned); assert it is rejected (403).

### Acceptance Criteria
- [ ] The assigned interviewer can enter notes and record an outcome.
- [ ] The interview status transitions to `COMPLETED`.
- [ ] The applicant status transitions to `INTERVIEW_COMPLETED`.
- [ ] An `AuditLog` entry is created.

### Implementation Steps
1. **Create the `recordInterviewOutcome` server action** — `src/app/(staff)/interviews/[id]/actions.ts`. Apply `requireRole('ACADEMIC_STAFF', 'ADMISSIONS_STAFF')`. Accept `notes`, `outcome` (enum: `RECOMMEND`, `FURTHER_CONSIDERATION`, `NOT_RECOMMENDED`), and `followUpActions`.
2. **Verify assignment** — before allowing the action, check that the calling user is either an assigned interviewer or has `ADMISSIONS_STAFF` role. Reject unassigned academic staff with 403.
3. **Update the Interview record** — set `outcome`, `notes`, `completedAt`, and transition `interviewStatus` to `COMPLETED`. Transition applicant status to `INTERVIEW_COMPLETED`.
4. **Create `AuditLog` entry** — record outcome, notes, and performing user.
5. **Build the Interview Detail right panel** — notes `Textarea` (`min-h-[200px]`, auto-resize), outcome `RadioGroup` (pill cards), follow-up `Textarea`, "Save Notes" button (outline), "Mark as Completed →" button (navy fill) with `AlertDialog` confirmation.
6. **Write tests** — record outcome as assigned interviewer (assert completed + status), as non-assigned academic staff (assert 403).

> 📎 Refer to `wireframes.md` §"Screen 2 — Interview Detail" for layout and component details.

---

## US-04: Block Outcome Without Scheduled Date

**As a** system  
**I want** to prevent recording an interview outcome when no interview date has been set  
**So that** outcomes are never recorded for unscheduled interviews

### TDD Focus
- **Test**: Create an Interview record without a `scheduledAt` date; attempt to record an outcome; assert it is blocked server-side with a descriptive error.

### Acceptance Criteria
- [ ] Recording an outcome without a scheduled interview date is blocked server-side.
- [ ] The error message clearly states that an interview must be scheduled first.

### Implementation Steps
1. **Add a guard in `recordInterviewOutcome`** — at the top of the action, check that `interview.scheduledAt` is not null. If null, return a descriptive error: "An interview must be scheduled before recording an outcome."
2. **Disable the outcome UI** — in the Interview Detail screen, if `scheduledAt` is null, disable the outcome `RadioGroup` and "Mark as Completed" button with a `Tooltip` message.
3. **Write tests** — create an Interview without `scheduledAt`, attempt to record outcome (assert blocked with descriptive error).

---

## US-05: Interview Access Control — Assigned Interviewers Only

**As a** system  
**I want** academic staff to access only the interview records they are assigned to  
**So that** applicant data is not exposed to unrelated staff

### TDD Focus
- **Test**: Assign interviewer A to an interview; request the interview as interviewer A; assert 200.
- **Test**: Request the same interview as interviewer B (not assigned); assert 403.
- **Test**: Request the interview as `ADMISSIONS_STAFF`; assert 200 (admissions staff have full access).

### Acceptance Criteria
- [ ] Academic staff can only view and edit interviews they are assigned to.
- [ ] Admissions staff can access all interview records.
- [ ] Unassigned academic staff receive a 403 response.

### Implementation Steps
1. **Create an `authorizeInterviewAccess()` utility** — `src/lib/business-rules/interview-access.ts`. Accepts `userId`, `userRole`, and `interviewId`. Returns `allowed: boolean`.
   - `ADMISSIONS_STAFF` / `SYSTEM_ADMINISTRATOR` → always allowed.
   - `ACADEMIC_STAFF` → allowed only if `userId` is in the interview's assigned interviewers.
2. **Apply in the interview detail page** — `src/app/(staff)/interviews/[id]/page.tsx`. Call the utility; if denied, return 403.
3. **Apply in server actions** — `recordInterviewOutcome` and `saveInterviewNotes` must also check.
4. **Write tests** — request as assigned interviewer A (assert 200), as unassigned interviewer B (assert 403), as `ADMISSIONS_STAFF` (assert 200).

### Playwright E2E Tests
Add to `e2e/f03-interview-scheduling.spec.ts`:
1. **Assigned interviewer can access** — sign in as the assigned academic staff member (Bob); navigate to the interview detail page; assert the page loads with the applicant summary, notes area, and outcome controls.
2. **Unassigned academic staff blocked** — sign in as a different academic staff member (not assigned); navigate to the same interview detail; assert a 403/forbidden page is shown.
3. **Admissions staff can access any interview** — sign in as Alice (ADMISSIONS_STAFF); navigate to the interview detail; assert the page loads successfully.

---

## US-06: Assigned Interviewer Sees Applicant Interview-Relevant Details

**As an** academic staff member assigned to an interview  
**I want** to see the applicant's interview-relevant details (name, programme, BAP status, documents) when viewing my assigned interview  
**So that** I can prepare for the interview

### TDD Focus
- **Test**: As an assigned interviewer, request the interview detail; assert the response includes applicant name, programme, and BAP status.
- **Test**: Assert the response does NOT include sensitive fields not required for interview (e.g., full address, DBS details).

### Acceptance Criteria
- [ ] The interview detail screen shows relevant applicant information.
- [ ] Sensitive fields beyond interview scope are not exposed to academic staff.

### Implementation Steps
1. **Build the applicant summary card** — in the Interview Detail right panel, render a read-only `Card` (Double-Bezel) showing: Name, Diocese, Programme, BAP status, DDO name.
2. **Field filtering for academic staff** — when `session.user.role === 'ACADEMIC_STAFF'`, exclude sensitive fields (date of birth, full address, legal ID, DBS details) from the query response.
3. **Server-side data shaping** — in the interview detail data loader, use a `select` clause that omits sensitive applicant fields for academic staff.
4. **Write tests** — as assigned interviewer, request interview detail (assert name, programme, BAP present; assert address, DOB, DBS absent).

> 📎 Refer to `wireframes.md` §"Applicant Summary Card (Interviewer view)" for field visibility rules.

---

## US-07: Invitation Tracking

**As an** admissions staff member  
**I want** the system to record when an interview invitation is sent, including the timestamp and the sending user  
**So that** there is an auditable record of invitation communications

### TDD Focus
- **Test**: Call the send-invitation action; assert `invitationSentAt` and `invitationSentByUserId` are set on the Interview record.
- **Test**: Assert an `AuditLog` entry is created for the invitation.

### Acceptance Criteria
- [ ] `invitationSentAt` timestamp is recorded.
- [ ] `invitationSentByUserId` is recorded as the current user.
- [ ] An `AuditLog` entry records the invitation event.

### Implementation Steps
1. **Create the `markInvitationSent` server action** — `requireRole('ADMISSIONS_STAFF')`. Update `Interview` record: set `invitationSentAt = new Date()` and `invitationSentByUserId = session.user.id`.
2. **Create `AuditLog` entry** — record `action: 'INVITATION_SENT'` with interview ID.
3. **Build the invitation tracking UI** — inside the Interview tab on Applicant Detail, show a `Button` variant `outline` "Mark as sent ✓". On click, record timestamp. After recording, replace button with static text: "Sent {date} · {time} · by {user}" with Phosphor `CheckCircle` green icon.
4. **Also show on Interview Detail left meta** — display invitation status (sent/not sent) with timestamp.
5. **Write tests** — call action (assert `invitationSentAt` and `invitationSentByUserId` set), assert audit log created.

---

## US-08: Interview Application Received Tracking

**As an** admissions staff member  
**I want** to mark that an interview application form has been received and have the timestamp recorded  
**So that** the admissions team knows which applicants have submitted their interview applications

### TDD Focus
- **Test**: Call the mark-application-received action; assert `interviewApplicationReceivedAt` is set on the Interview record.
- **Test**: Assert the applicant status transitions to `INTERVIEW_APPLICATION_RECEIVED` if appropriate.

### Acceptance Criteria
- [ ] `interviewApplicationReceivedAt` timestamp is recorded.
- [ ] Applicant status updates to `INTERVIEW_APPLICATION_RECEIVED` when appropriate.
- [ ] An `AuditLog` entry is created.

### Implementation Steps
1. **Create the `markApplicationReceived` server action** — `requireRole('ADMISSIONS_STAFF')`. Update `Interview` record: set `interviewApplicationReceivedAt = new Date()`. If appropriate, transition applicant status to `INTERVIEW_APPLICATION_RECEIVED`.
2. **Create `AuditLog` entry** — record `action: 'APPLICATION_RECEIVED'`.
3. **Build the UI** — inside the Interview tab on Applicant Detail, show `Button` variant `outline` with Phosphor `FileText` "Mark as received". After click, show `Badge` + timestamp text. Update left column status badge via optimistic UI.
4. **Write tests** — call action (assert `interviewApplicationReceivedAt` set), assert applicant status transitions correctly, assert audit log.

> 📎 Refer to `wireframes.md` §"Screen 3 — Interview Application Received" for the inline pattern.

---

## US-09: Interview Detail Screen

**As an** admissions staff member or assigned interviewer  
**I want** to view a dedicated interview detail screen showing all interview fields  
**So that** I have a complete view of the interview record

### TDD Focus
- **Test**: Seed an interview with all fields populated; render the detail screen; assert all fields are displayed: linked applicant, type, date/time, assigned interviewer, status, notes, outcome, and follow-up actions.

### Acceptance Criteria
- [ ] The interview detail screen displays all fields from PRD §5.5.
- [ ] The interview record is visible in the applicant detail screen's audit timeline.

### Implementation Steps
1. **Create the interview detail page** — `src/app/(staff)/interviews/[id]/page.tsx`. Fetch the interview with related applicant, assigned interviewers, and audit log entries.
2. **Build the two-column layout** — left meta (240px): type badge, interview status badge, date/time, assigned interviewers (avatars + names), invitation status, application received status. Right content: applicant summary card, notes textarea, outcome radio, follow-up textarea, action buttons.
3. **Add breadcrumb** — "Applicants / {Name} / Interview".
4. **Wire save actions** — "Save Notes" saves without completing (partial save). "Mark as Completed →" triggers `AlertDialog` and calls `recordInterviewOutcome`.
5. **Implement auto-save indicator** — faint `Spinner` → Phosphor `CheckCircle` fade-in after 500ms debounce save on notes.
6. **Write tests** — seed a fully populated interview, render detail, assert all fields displayed.

### Playwright E2E Tests
Create `e2e/f03-interview-detail.spec.ts`:
1. **Interview detail page loads** — sign in as Alice; navigate to `/interviews/{id}` for a seeded interview; assert the page displays: interview type badge, date/time, assigned interviewer name(s), and status.
2. **Applicant summary card visible** — assert the applicant’s name, programme, and BAP status are shown in the summary card.
3. **Notes and outcome controls** — assert a notes textarea is present; assert outcome radio buttons are visible (Recommend, Further Consideration, Not Recommended).
4. **Breadcrumb navigation** — assert the breadcrumb shows "Applicants / {Name} / Interview" and clicking the applicant name navigates back to their detail page.

> 📎 Refer to `wireframes.md` §"Screen 2 — Interview Detail" for full layout and animation.

---

## US-10: Prevent Offer Progression Without Interview Completion

**As a** system  
**I want** to block applicant progression to offer decision when required interview steps are incomplete  
**So that** the admissions workflow is enforced

### TDD Focus
- **Test**: Attempt to create an offer for an applicant with interview status `SCHEDULED` (not completed); assert it is blocked.
- **Test**: Mark interview as `NOT_REQUIRED`; attempt to create offer; assert it succeeds.
- **Test**: Complete the interview; attempt to create offer; assert it succeeds.

### Acceptance Criteria
- [ ] Offer decision is blocked when a required interview is not completed.
- [ ] Marking interview as `NOT_REQUIRED` bypasses the gate.
- [ ] Completed interviews allow progression to offer decision.

### Implementation Steps
1. **Create `validateInterviewGate()` utility** — `src/lib/business-rules/interview-gate.ts`. Accepts applicant ID, queries their interview records. Returns `{ allowed: boolean, reason?: string }`.
   - Allowed if at least one interview has status `COMPLETED`, or interview is marked `NOT_REQUIRED`.
   - Blocked if interviews exist but none are completed.
2. **Integrate into the `createOffer` server action** (F04) — before creating an offer, call `validateInterviewGate()`. If blocked, return the reason.
3. **UI gate** — in the Applicant Detail, disable the "Record Offer" quick action with a `Tooltip` when the interview gate fails.
4. **Write tests** — attempt offer with interview `SCHEDULED` (assert blocked), mark interview `NOT_REQUIRED` (assert offer succeeds), complete interview (assert offer succeeds).
