# F02 — Wireframes: Applicant Record Management

> Inherits the global design system defined in `F01/wireframes.md`.

---

## Screen 1 — Applicant List (`/applicants`)

**Access:** ADMISSIONS_STAFF (full), SENIOR_LEADERSHIP (read-only), SYSTEM_ADMINISTRATOR

### Layout: Full-width data surface with sticky filter bar

```
┌─────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (from F01 shell)                                            │
│          ┌──────────────────────────────────────────────────────────┤
│          │ PAGE HEADER                                              │
│          │  Eyebrow: "2025–2026 Cohort"                             │
│          │  H1: Applicants              [+ New Applicant] [↑ Import]│
│          ├──────────────────────────────────────────────────────────┤
│          │ FILTER BAR (sticky, Double-Bezel pill)                   │
│          │ [🔍 Search name, email, ID, diocese, DDO...]             │
│          │ [Status ▾] [Year ▾] [Programme ▾] [Diocese ▾] [Docs ▾]  │
│          │                                          [↓ Export CSV]  │
│          ├──────────────────────────────────────────────────────────┤
│          │ DATA TABLE                                               │
│          │  Name ↕  │ Status    │ Programme │ Diocese │ BAP  │ ...  │
│          │ ─────────┼───────────┼───────────┼─────────┼──────┼──── │
│          │ J. Smith  │ [ENQUIRY] │ Common    │ Oxford  │ ✓    │ →   │
│          │ A. Patel  │ [SCHED.]  │ Oxford    │ London  │ ✓    │ →   │
│          │ ...       │ ...       │ ...       │ ...     │ ...  │ ... │
│          ├──────────────────────────────────────────────────────────┤
│          │ PAGINATION                          Showing 1–20 of 47   │
└──────────┴──────────────────────────────────────────────────────────┘
```

### Components
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| Search input | `Input` inside `InputGroup` | Phosphor `MagnifyingGlass` 16px left icon; `rounded-full` pill style |
| Filter dropdowns | `Select` (each filter) | `rounded-xl`; multi-value filters use `Popover` + `Checkbox` list |
| Active filter chips | `Badge` with `×` | `rounded-full bg-[#1A2744]/10 text-[#1A2744]`; click × removes filter |
| New Applicant | `Button` | Navy fill, pill `rounded-full`; opens `Sheet` (right slide-in) |
| Import | `Button` variant `outline` | Pill; opens `Dialog` with file upload zone |
| Export CSV | `Button` variant `ghost` | Phosphor `DownloadSimple` icon left |
| Data table | `Table`, `TableHeader`, `TableRow`, `TableCell` | Sortable headers via `Toggle` |
| Status badge | `Badge` | Colour-coded per status (see Status Palette below) |
| Row → detail | `TableRow` — full row clickable | `cursor-pointer hover:bg-black/3` |
| Pagination | `Pagination`, `PaginationContent`, `PaginationItem` | — |
| Import dialog | `Dialog`, `DialogContent` | File drop zone + `Progress` bar during upload |
| Skeleton loading | `Skeleton` | Replaces table rows on initial load |

### Status Colour Palette (Badge variants)
| Status | Background | Text |
|--------|-----------|------|
| `ENQUIRY` | `#EEF2FF` | `#3730A3` |
| `VISIT_INVITED` | `#FFF7ED` | `#C2410C` |
| `INTERVIEW_SCHEDULED` | `#ECFDF5` | `#065F46` |
| `INTERVIEW_COMPLETED` | `#D1FAE5` | `#064E3B` |
| `CONDITIONAL_OFFER` | `#FFFBEB` | `#92400E` |
| `UNCONDITIONAL_OFFER` | `#F0FDF4` | `#14532D` |
| `DECLINED` | `#FEF2F2` | `#991B1B` |
| `WITHDRAWN` | `#F9FAFB` | `#374151` |
| `CONFIRMED_ORDINAND` | `#1A2744` | `#FFFFFF` |

### Animation
- Filter bar sticky scroll: `position: sticky; top: 0; z-index: 10; backdrop-blur-sm` (fixed element, blur safe)
- Row entry: stagger `translate-y-2 opacity-0` → `translate-y-0 opacity-100` per row with 30ms delay increments
- Filter chip appear: `scale-0 opacity-0` → `scale-100 opacity-100` over 200ms

---

## Screen 2 — Create Applicant (`Sheet` — right slide-in)

**Trigger:** "+ New Applicant" button on Applicant List

```
┌──────────────────────────────────────────────────────┐
│  [Overlay: bg-black/40 backdrop-blur-sm]             │
│                              ┌───────────────────────┤
│                              │ SHEET PANEL (480px)   │
│                              │                       │
│                              │ Eyebrow: "New Record" │
│                              │ H2: Add Applicant     │
│                              │                       │
│                              │ ── Personal ──────── │
│                              │ Legal Name*  [______] │
│                              │ Preferred Name [____] │
│                              │ Date of Birth [____]  │
│                              │ Email*        [______]│
│                              │ Phone         [______]│
│                              │                       │
│                              │ ── Address ────────── │
│                              │ Address Line 1 [____] │
│                              │ City / Postcode [___] │
│                              │ Country        [____] │
│                              │                       │
│                              │ ── Ecclesial ───────  │
│                              │ Diocese        [▾___] │
│                              │ DDO Name       [____] │
│                              │ DDO Email      [____] │
│                              │                       │
│                              │ ── BAP ─────────────  │
│                              │ Stage 1 Status [▾___] │
│                              │ Stage 1 Date   [cal]  │
│                              │                       │
│                              │ ── Programme ──────── │
│                              │ Programme      [▾___] │
│                              │ Admissions Year [▾__] │
│                              │                       │
│                              │ [Cancel]  [Save →]   │
│                              └───────────────────────┘
```

### Components
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| Slide-in panel | `Sheet`, `SheetContent` side `"right"` | 480px wide; `rounded-l-[1.5rem]` |
| Section labels | `Separator` with inline text | `text-xs uppercase tracking-wide text-muted` |
| Text inputs | `Form`, `FormField`, `FormControl`, `Input`, `FormMessage` | React Hook Form + Zod validation |
| Diocese / Programme | `Select`, `SelectTrigger`, `SelectContent` | Populated from reference data |
| BAP date | `Popover` + `Calendar` | Date picker pattern |
| Save button | `Button` navy fill pill | Submitting state: `Spinner` inside button |
| Error toast | `Sonner` toast | On server error |

### Validation Feedback (inline)
- Required field missing: `FormMessage` in `text-destructive` below input, fade-in
- Duplicate email detected: inline `Alert` variant `warning` below email field

---

## Screen 3 — Applicant Detail (`/applicants/[id]`)

**Access:** ADMISSIONS_STAFF (full edit), ACADEMIC_STAFF (interview section only), SENIOR_LEADERSHIP (read-only)

### Layout: Asymmetrical Bento — left status column + right tabbed content

```
┌───────────────────────────────────────────────────────────────────┐
│ Breadcrumb: Applicants / James Smith                              │
├───────────────────────────────────────────────────────────────────┤
│  LEFT COLUMN (280px sticky)      │  RIGHT CONTENT (flex-1)        │
│                                  │                                │
│  [Avatar large initials]         │  TABS:                         │
│  James Smith                     │  [Personal][Ecclesial][BAP]    │
│  SSH-2025-0012                   │  [Interview][Offer][Reg][Docs] │
│                                  │  [Notes][Timeline]             │
│  ┌─────────────────────────────┐ │                                │
│  │ Status Badge (large)        │ │  TAB CONTENT PANEL             │
│  │ INTERVIEW_SCHEDULED         │ │  (Double-Bezel card)           │
│  └─────────────────────────────┘ │                                │
│                                  │  [Editable sections or         │
│  Progress stepper:               │   read-only view per role]     │
│  ● Enquiry                       │                                │
│  ● Visit / Interview  ←current   │                                │
│  ○ Offer Decision                │                                │
│  ○ Registration                  │                                │
│  ○ Confirmed Ordinand            │                                │
│                                  │                                │
│  ── Quick Actions ──             │                                │
│  [Schedule Interview]            │                                │
│  [Record Offer]                  │                                │
│  [Confirm Ordinand]              │                                │
│                                  │                                │
│  ── OneDrive Folder ──           │                                │
│  [↗ Open in SharePoint]          │                                │
│                                  │                                │
│  ── Admissions Year ──           │                                │
│  2025–2026                       │                                │
│                                  │                                │
│  [↓ Export Summary]              │                                │
└──────────────────────────────────┴────────────────────────────────┘
```

### Components
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| Left column | `div` sticky `top-6` inside `ScrollArea` on right | — |
| Large status badge | `Badge` (oversized, pill) | Same colour palette as list screen |
| Progress stepper | Custom: `div` chain with connecting line | Phosphor `CheckCircle` (filled) for complete, `Circle` for pending |
| Quick action buttons | `Button` variants | Contextually enabled/disabled based on current status |
| Tab navigation | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Underline variant; active: `text-[#1A2744] border-b-2 border-[#1A2744]` |
| Edit form sections | `Form`, `FormField` pattern (same as Sheet) | In-place edit; `Button` "Edit" → form revealed; `Collapsible` |
| BAP exception toggle | `Switch` + `Textarea` (conditional reveal) | Collapsible reason field |
| Status advance button | `Button` with `AlertDialog` confirm | "Are you sure you want to advance to X?" |
| Quick action disabled state | `Tooltip` explaining why disabled | e.g. "Stage 1 BAP must be completed first" |
| SharePoint link | `Button` variant `ghost` with Phosphor `FolderOpen` | Opens in new tab |
| Export summary | `Button` variant `ghost` with Phosphor `DownloadSimple` | — |
| Skeleton | `Skeleton` | Detail card loading states |

### Tab: Personal Information
- Fields: Legal Name, Preferred Name, Date of Birth, Email, Phone, Address — all editable via `Form`
- Read-only display: key-value pairs `dl > dt + dd` layout, edit icon on hover

### Tab: Ecclesial Information
- Fields: Diocese (`Select`), DDO Name/Email/Phone, Sponsoring Bishop Name/Email/Phone

### Tab: BAP Status
- Stage 1: status `Select`, date `Calendar`, exception `Switch` + `Textarea`
- Stage 2: status `Select`, date `Calendar`
- Blocked-progress `Alert` if BAP incomplete with no exception

### Tab: Notes
- `Textarea` for internal notes, `Button` "Save Note"
- Previous notes rendered as chronological list with author + timestamp

### Tab: Audit Timeline
- `ScrollArea` chronological feed
- Each entry: timestamp (Geist Mono), actor, action, previous → new value
- Phosphor `ArrowRight` between old/new values

### Animation
- Tab switch: `translate-x-4 opacity-0` → `translate-x-0 opacity-100` over 300ms
- Quick action enable/disable: smooth `opacity-50` ↔ `opacity-100` transition
- Status advance confirm dialog: scale in from `scale-95 opacity-0`
