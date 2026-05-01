# F03 — Wireframes: Interview Scheduling and Outcomes

> Inherits the global design system defined in `F01/wireframes.md`.

---

## Screen 1 — Schedule Interview (`Dialog` on Applicant Detail)

**Trigger:** "Schedule Interview" quick action on Applicant Detail left column  
**Access:** ADMISSIONS_STAFF only

### Layout: Centred `Dialog` with form

```
┌───────────────────────────────────────────────────────────┐
│  [bg-black/40 overlay]                                    │
│                                                           │
│    ┌─────────────────────────────────────────────────┐    │
│    │  Double-Bezel Dialog Shell                      │    │
│    │  ┌─────────────────────────────────────────┐   │    │
│    │  │                                         │   │    │
│    │  │  Eyebrow: "Interview Management"        │   │    │
│    │  │  H2: Schedule Interview                 │   │    │
│    │  │                                         │   │    │
│    │  │  Applicant: James Smith  SSH-2025-0012  │   │    │
│    │  │  BAP Status: ✓ COMPLETED                │   │    │
│    │  │                                         │   │    │
│    │  │  Interview Type*                        │   │    │
│    │  │  ○ Exploratory Visit                    │   │    │
│    │  │  ● Visit-Interview                      │   │    │
│    │  │                                         │   │    │
│    │  │  Date & Time*         [📅 Calendar]     │   │    │
│    │  │  Mon 14 Jul 2025 · 10:00am              │   │    │
│    │  │                                         │   │    │
│    │  │  Assigned Interviewer*  [Search…  ▾]    │   │    │
│    │  │  [+ Add panel member]                   │   │    │
│    │  │                                         │   │    │
│    │  │  ┌─────────────────────────────────┐    │   │    │
│    │  │  │ ⚠ BAP Warning (conditional)     │    │   │    │
│    │  │  │ Stage 1 BAP incomplete. An      │    │   │    │
│    │  │  │ exception must be on record     │    │   │    │
│    │  │  │ before scheduling.              │    │   │    │
│    │  │  └─────────────────────────────────┘    │   │    │
│    │  │                                         │   │    │
│    │  │  [Cancel]             [Schedule →]      │   │    │
│    │  │                                         │   │    │
│    │  └─────────────────────────────────────────┘   │    │
│    └─────────────────────────────────────────────────┘    │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### Components
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| Dialog shell | `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` | `rounded-[2rem]`; Double-Bezel outer wrapper |
| Interview type | `RadioGroup`, `RadioGroupItem` | Styled as pill toggle cards |
| Date/time picker | `Popover` + `Calendar` | Time via `Select` (hour/minute); combined display |
| Interviewer search | `Combobox` (Command pattern) | Searches `ACADEMIC_STAFF` users; shows avatar + name |
| Add panel member | `Button` variant `ghost` with Phosphor `Plus` | Adds another `Combobox` row |
| BAP warning | `Alert` variant `warning` | Phosphor `Warning` icon; only shown when BAP incomplete |
| Schedule button | `Button` navy fill pill | Disabled + `Tooltip` if BAP gate fails; submitting: `Spinner` |
| Success toast | `Sonner` | "Interview scheduled for 14 Jul 2025" |

### Invitation Tracking (inline below scheduled state)
Once scheduled, inside the Interview tab on Applicant Detail:

```
Invitation Sent:  [Mark as sent ✓]  →  Sent 12 Jul · 9:41am · by A. Jones
```
- `Button` variant `outline` → on click, records timestamp + current user → renders static text + Phosphor `CheckCircle` green

---

## Screen 2 — Interview Detail (`/interviews/[id]`)

**Access:** ADMISSIONS_STAFF (full), ACADEMIC_STAFF (assigned only — notes + outcome edit)

### Layout: Two-column — meta left, working area right

```
┌───────────────────────────────────────────────────────────────┐
│ Breadcrumb: Applicants / James Smith / Interview              │
├───────────────────────────────────────────────────────────────┤
│  LEFT META (240px)               │  RIGHT CONTENT (flex-1)   │
│                                  │                           │
│  [Type badge]                    │  ── Applicant Summary ──  │
│  Visit-Interview                 │  (read-only card for      │
│                                  │   interviewers)           │
│  Interview Status                │  Name · Diocese · BAP     │
│  [SCHEDULED badge]               │  Programme · DDO          │
│                                  │                           │
│  Date & Time                     │  ── Notes ─────────────── │
│  Mon 14 Jul 2025                 │                           │
│  10:00am                         │  [Textarea: large,        │
│                                  │   min-h-[200px]]          │
│  Assigned To                     │                           │
│  [Avatar] Dr. A. Jones           │  ── Outcome ────────────  │
│  [Avatar] Rev. M. Clark          │                           │
│                                  │  Outcome*                 │
│  ── Invitation ─────             │  ○ Recommend              │
│  ✓ Sent 12 Jul · 9:41am          │  ○ Further consideration  │
│    by A. Jones                   │  ○ Not recommended        │
│                                  │                           │
│  ── Application ────             │  Follow-up actions        │
│  ✓ Received 10 Jul · 2:12pm      │  [Textarea small]         │
│                                  │                           │
│                                  │  [Save Notes]             │
│                                  │  [Mark as Completed →]    │
└──────────────────────────────────┴───────────────────────────┘
```

### Components
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| Interview status badge | `Badge` | Same palette as applicant statuses |
| Applicant summary card | `Card`, `CardContent` | Double-Bezel; read-only for academic staff; hides sensitive fields |
| Notes textarea | `Textarea` | `min-h-[200px]`; auto-resize via CSS `field-sizing: content` |
| Outcome radio | `RadioGroup`, `RadioGroupItem` | Styled as pill cards with colour accent on selected |
| Follow-up textarea | `Textarea` | Small, optional |
| Save Notes | `Button` variant `outline` pill | Saves without completing |
| Mark Complete | `Button` navy fill pill | Triggers `AlertDialog` confirmation; advances status |
| Invitation / App received marks | `Button` → static text pattern | Same as Screen 1 invitation tracking |

### Applicant Summary Card (Interviewer view)
Academic staff see **only**: Name, Diocese, Programme, BAP status, DDO name.  
Sensitive fields (date of birth, address, legal ID, DBS) are hidden.

### Animation
- Notes auto-save indicator: faint `Spinner` → Phosphor `CheckCircle` fade-in after 500ms debounce save
- Mark Complete dialog: scale-in `scale-95 opacity-0` → `scale-100 opacity-100`

---

## Screen 3 — Interview Application Received (inline on Applicant Detail)

This is not a separate screen but a tracked action within the **Interview tab** of Applicant Detail:

```
┌──────────────────────────────────────────────────────────┐
│  Interview Application Form                              │
│                                                          │
│  Received:  [ Mark as received ]                         │
│             ↓ (after click)                              │
│  ✓ Received  Thu 10 Jul 2025 · 2:12pm                   │
│                                                          │
│  Status transitions to: INTERVIEW_APPLICATION_RECEIVED   │
└──────────────────────────────────────────────────────────┘
```
- `Button` variant `outline` with Phosphor `FileText` → on click records timestamp, renders `Badge` + timestamp text
- Status badge on left column updates via optimistic UI
