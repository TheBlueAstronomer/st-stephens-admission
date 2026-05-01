# F08 — Wireframes: System Administration

> Inherits the global design system defined in `F01/wireframes.md`.
> Access: `SYSTEM_ADMINISTRATOR` only.

---

## Screen 1 — Administration Hub (`/admin`)

### Layout: Left sub-nav + right content panel

```
┌────────────────────────────────────────────────────────────────────┐
│ SIDEBAR │                                                          │
│         │ Eyebrow: "System"                                        │
│         │ H1: Administration                                       │
│         │                                                          │
│         │ ┌──────────────────┐  ┌──────────────────────────────┐  │
│         │ │ ADMIN SUB-NAV    │  │ ADMIN CONTENT AREA           │  │
│         │ │                  │  │ (route-rendered)             │  │
│         │ │ ● Users          │  │                              │  │
│         │ │ ○ Programmes     │  │                              │  │
│         │ │ ○ Dioceses       │  │                              │  │
│         │ │ ○ Document Types │  │                              │  │
│         │ │ ○ Admissions Yrs │  │                              │  │
│         │ │ ○ Audit Log      │  │                              │  │
│         │ │                  │  │                              │  │
│         │ └──────────────────┘  └──────────────────────────────┘  │
└─────────┴────────────────────────────────────────────────────────  │
```

### Components
- Sub-nav: `nav` with `Button` variant `ghost` items; active: `bg-[#1A2744]/8 text-[#1A2744] rounded-xl font-medium`
- Content: each section is a child route or tab panel using `Tabs`

---

## Screen 2 — User Management (`/admin/users`)

```
┌──────────────────────────────────────────────────────────────────┐
│  H2: Users                              [+ Invite User]          │
│                                                                  │
│  [🔍 Search name or email…]   [Role ▾]  [Status ▾]              │
│                                                                  │
│  TABLE:                                                          │
│  Name         │ Email              │ Role           │ Status     │
│  Anna Jones   │ a.jones@ssh.ox.ac  │ ADMISSIONS_STAFF│ Active    │
│  Rev. M.Clark │ m.clark@ssh.ox.ac  │ ACADEMIC_STAFF  │ Active    │
│  J. Taylor    │ j.taylor@ssh.ox.ac │ SENIOR_LEAD     │ Active    │
│  B. Williams  │ b.w@ssh.ox.ac      │ ADMISSIONS_STAFF│ Inactive  │
│               │                    │                 │           │
│  (each row has ⋮ menu: Edit Role · Deactivate · Reactivate)     │
└──────────────────────────────────────────────────────────────────┘
```

### Invite User Dialog

```
┌────────────────────────────────────────────────┐
│  Double-Bezel Dialog                           │
│                                                │
│  H2: Invite Staff User                         │
│                                                │
│  Name*              [______________________]   │
│  Microsoft Email*   [______________________]   │
│  Role*              [▾ Select role…]           │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ ℹ The user must have an existing         │  │
│  │ Microsoft account on the SSH tenant.     │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  [Cancel]               [Create User →]        │
└────────────────────────────────────────────────┘
```

### Components
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| Search | `Input` with `InputGroup` | Phosphor `MagnifyingGlass` left |
| Role filter | `Select` | — |
| Status filter | `Select` | Active / Inactive |
| User table | `Table` | — |
| Status indicator | `Badge` | Active: green; Inactive: muted gray with `opacity-60` on row |
| Row menu | `DropdownMenu` (Phosphor `DotsThree` trigger) | Edit Role → `Sheet`; Deactivate → `AlertDialog`; Reactivate → instant |
| Invite dialog | `Dialog`, `DialogContent` | `Form` with React Hook Form + Zod |
| Role select | `Select` | `ADMISSIONS_STAFF`, `ACADEMIC_STAFF`, `SENIOR_LEADERSHIP`, `SYSTEM_ADMINISTRATOR` |
| Deactivate confirm | `AlertDialog` | "This user will immediately lose access" |

---

## Screen 3 — Programme Management (`/admin/programmes`)

```
┌──────────────────────────────────────────────────────────────────┐
│  H2: Academic Programmes              [+ New Programme]          │
│                                                                  │
│  TABLE:                                                          │
│  Course Title             │ Framework      │ Mode     │ Status   │
│  BTh Theology             │ COMMON_AWARDS  │ FULL_TIME│ Active   │
│  MTh Ministry             │ COMMON_AWARDS  │ PART_TIME│ Active   │
│  DPhil Theology           │ OXFORD         │ FULL_TIME│ Inactive │
│                           │                │          │          │
│  (each row has ⋮ menu: Edit · Deactivate · Reactivate)          │
└──────────────────────────────────────────────────────────────────┘
```

### New/Edit Programme Sheet (right side)

```
┌──────────────────────────────────────────────────────┐
│                              ┌───────────────────────┤
│                              │ SHEET                 │
│                              │                       │
│                              │ H2: Programme         │
│                              │                       │
│                              │ Course Title*  [____] │
│                              │ Framework*     [▾___] │
│                              │ Mode*          [▾___] │
│                              │ Duration       [____] │
│                              │ Active         [●]    │
│                              │                       │
│                              │ [Cancel]  [Save →]    │
│                              └───────────────────────┘
```
- `Sheet`, `SheetContent` right
- `Input` (title), `Select` (framework, mode), `Input` (duration), `Switch` (active)
- Deactivating in-use programmes: `Alert` warning "This programme is assigned to X applicants. Deactivating will hide it from new records but not remove it from existing ones."

---

## Screen 4 — Diocese Management (`/admin/dioceses`)

```
┌──────────────────────────────────────────────────────────────────┐
│  H2: Dioceses                                [+ Add Diocese]     │
│                                                                  │
│  [🔍 Search…]                                                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Name              │ Region (optional)  │  Actions        │   │
│  │ Oxford            │ Southern Province  │  [Edit] [×]     │   │
│  │ London            │ Southern Province  │  [Edit] [×]     │   │
│  │ Durham            │ Northern Province  │  [Edit] [×]     │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```
- Compact inline-edit pattern: clicking "Edit" turns row into `Input` fields with `Button` save/cancel
- Delete: `AlertDialog` "Removing this diocese will unlink it from applicant records. Proceed?"
- `Button` "+ Add Diocese" → appends blank editable row at top of list

---

## Screen 5 — Document Types (`/admin/document-types`)

Same pattern as Diocese Management — `Table` with inline edit.

```
│  Document Type Label      │ Internal Key              │ Sensitive │
│  GCSE Transcript          │ GCSE_TRANSCRIPT            │ No        │
│  Legal ID                 │ LEGAL_ID                   │ Yes [🔒]  │
│  DBS Check                │ DBS_CHECK                  │ Yes [🔒]  │
```
- `Switch` per row for "Required by default" toggle
- `Switch` per row for "Sensitive" toggle (restricts to ADMISSIONS_STAFF)
- Add new: `Button` → appends blank row

---

## Screen 6 — Admissions Years (`/admin/admissions-years`)

```
┌──────────────────────────────────────────────────────────────────┐
│  H2: Admissions Years                      [+ New Year]          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Year        │ Label        │ Active  │ Applicants         │   │
│  │ 2025-2026   │ 2025–2026    │ ✓ Yes   │ 47                │   │
│  │ 2024-2025   │ 2024–2025    │ —       │ 39                │   │
│  │ 2023-2024   │ 2023–2024    │ —       │ 31                │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```
- New year: `Dialog` with year input + label + "Set as active" `Switch`
- Only one year can be "active" (default in filters and new applicant creation)
- Active year badge: `Badge` green

---

## Screen 7 — Audit Log (`/admin/audit-log`)

**Access:** SYSTEM_ADMINISTRATOR — read-only

```
┌──────────────────────────────────────────────────────────────────┐
│  H2: Audit Log                                                   │
│                                                                  │
│  [Entity Type ▾] [Action ▾] [User ▾] [Date From 📅] [Date To 📅]│
│                                                   [↓ Export CSV] │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Timestamp     │ User       │ Entity      │ Action  │ Δ     │  │
│  │ 14 Jul 10:32  │ A. Jones   │ Applicant   │ STATUS  │ →     │  │
│  │               │            │ #SSH-0012   │ CHANGE  │       │  │
│  │               │            │             │ ENQUIRY │ SCHED │  │
│  │ ─────────────────────────────────────────────────────────  │  │
│  │ 14 Jul 09:41  │ A. Jones   │ Interview   │ INVITE  │ sent  │  │
│  │               │            │ #INT-0043   │ SENT    │       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  PAGINATION                             Showing 1–50 of 1,247   │
└──────────────────────────────────────────────────────────────────┘
```

### Row Expand (Collapsible)
Clicking a row expands inline detail:

```
┌──────────────────────────────────────────────────────────────┐
│  ▸ [collapsed row]                                           │
│  ▾ [expanded]                                                │
│     Previous value:  ENQUIRY                                 │
│     New value:       INTERVIEW_SCHEDULED                     │
│     Entity ID:       SSH-2025-0012                           │
│     Performed by:    anna.jones@ssh.ox.ac.uk                 │
│     Timestamp:       2025-07-14T10:32:04.218Z (Geist Mono)   │
└──────────────────────────────────────────────────────────────┘
```

### Components
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| Entity type filter | `Select` | Applicant, Interview, Offer, Document, User, Registration |
| Action filter | `Select` | STATUS_CHANGE, DOCUMENT_RECEIVED, WAIVED, OFFER_RECORDED, etc. |
| User filter | `Select` (or `Combobox`) | Lists all staff users |
| Date range | Two `Popover` + `Calendar` instances | From / To |
| Log table | `Table` | No edit controls — all cells read-only |
| Row expand | `Collapsible` per row | `ChevronDown` / `ChevronUp` toggle (Phosphor) |
| Previous/New value | `Badge` with Phosphor `ArrowRight` between | Monospaced values |
| Pagination | `Pagination` | Server-side, 50 per page |
| Export | `Button` ghost pill + Phosphor `DownloadSimple` | CSV of filtered log |
| No edit affordance | Zero edit buttons, no hover highlights on cells | Visually communicates read-only |

### Animation
- Row expand: `max-h-0 overflow-hidden` → `max-h-[200px]` with `transition-[max-height] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]`
- Filter change: table fades `opacity-50` → `opacity-100` during re-fetch (same as dashboard)
