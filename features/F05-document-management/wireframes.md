# F05 — Wireframes: Document Management

> Inherits the global design system defined in `F01/wireframes.md`.

---

## Screen 1 — Document Checklist Tab (inside Applicant Detail)

**Access:** ADMISSIONS_STAFF (full), SYSTEM_ADMINISTRATOR (full); sensitive documents restricted

### Layout: Full-width checklist table inside tab panel

```
┌──────────────────────────────────────────────────────────────────┐
│  TAB: Documents                                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ SharePoint Folder                                          │  │
│  │ [↗ Open applicant folder in SharePoint]  [Copy link]      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Completion:  [████████░░]  7 / 10 documents complete            │
│                                                                  │
│  [Upload document ↑]                                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Document          Required  Status      Received   File  │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  GCSE Transcript     ✓       [RECEIVED]  12 Jun 25  [↗]  │   │
│  │  A-Level Transcript  ✓       [RECEIVED]  12 Jun 25  [↗]  │   │
│  │  Undergrad Transcript✓       [OUTSTANDING]     —    [+]  │   │
│  │  Postgrad Transcript  —      [RECEIVED]  14 Jun 25  [↗]  │   │
│  │  Stage 1 BAP Report  ✓       [RECEIVED]  01 Jul 25  [↗]  │   │
│  │  Stage 2 BAP Report  ✓       [OUTSTANDING]     —    [+]  │   │
│  │  Academic Ref 1      ✓       [RECEIVED]  10 Jun 25  [↗]  │   │
│  │  Academic Ref 2      ✓       [OUTSTANDING]     —    [+]  │   │
│  │  Passport Photo      ✓       [RECEIVED]  12 Jun 25  [↗]  │   │
│  │  Legal ID         🔒 ✓       [RECEIVED]  12 Jun 25  [↗]  │   │
│  │  DBS Check        🔒 ✓       [OUTSTANDING]     —    [+]  │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Status Badge Styles
| Status | Style |
|--------|-------|
| `RECEIVED` | `bg-[#D1FAE5] text-[#064E3B]` — green pill |
| `OUTSTANDING` | `bg-[#FEF2F2] text-[#991B1B]` — red pill |
| `WAIVED` | `bg-[#F9FAFB] text-[#374151] line-through` — muted pill |

### Components
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| SharePoint folder link | `Button` variant `outline` + Phosphor `FolderOpen` | Opens `_blank`; copy icon uses `Tooltip` "Copied!" on click |
| Completion progress bar | `Progress` | Animated fill on load: `0` → actual value over 600ms |
| Upload button | `Button` navy outline pill + Phosphor `UploadSimple` | Opens `Dialog` (Screen 2) |
| Document table | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` | — |
| Status badge | `Badge` | Colour per status above |
| Received date | `TableCell` | Geist Mono `text-sm`; `—` when not received |
| File link [↗] | `Button` variant `ghost` size `sm` + Phosphor `ArrowSquareOut` | Opens SharePoint file URL |
| Row action [+] | `Button` variant `ghost` size `sm` + Phosphor `Plus` | Opens document action `Sheet` (Screen 3) |
| Sensitive lock 🔒 | Phosphor `Lock` 14px | Only shown for Legal ID, DBS, References; row blurred for non-admissions roles |

---

## Screen 2 — Upload Document (`Dialog`)

**Trigger:** "Upload document" button or [+] on an outstanding row

```
┌────────────────────────────────────────────────────┐
│  Double-Bezel Dialog                               │
│  ┌──────────────────────────────────────────────┐  │
│  │                                              │  │
│  │  Eyebrow: "Documents"                        │  │
│  │  H2: Upload Document                         │  │
│  │                                              │  │
│  │  Document Type*      [▾ Select type…]        │  │
│  │  (pre-selected if opened from row [+])       │  │
│  │                                              │  │
│  │  ┌──────────────────────────────────────┐   │  │
│  │  │                                      │   │  │
│  │  │   Drag & drop file here, or          │   │  │
│  │  │   [ Browse files ]                   │   │  │
│  │  │                                      │   │  │
│  │  │   Accepted: PDF, JPG, PNG, DOCX      │   │  │
│  │  │   Max size: 20MB                     │   │  │
│  │  └──────────────────────────────────────┘   │  │
│  │                                              │  │
│  │  [████████████░░░░]  Uploading... 72%        │  │
│  │  → Sending to SharePoint folder…            │  │
│  │                                              │  │
│  │  Received Date*       [📅 Calendar]          │  │
│  │                                              │  │
│  │  Notes (optional)     [Textarea]             │  │
│  │                                              │  │
│  │  [Cancel]             [Save →]              │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### Components
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| Document type | `Select`, `SelectTrigger`, `SelectContent` | Lists all document types from reference data |
| Drop zone | Custom `div` with `onDragOver`/`onDrop` handlers | `border-dashed border-2 border-black/15 rounded-[1.5rem]`; drag-over: `border-[#1A2744] bg-[#1A2744]/5` |
| Browse button | `Button` variant `outline` | Triggers hidden `<input type="file">` |
| Upload progress | `Progress` | Shown during Graph API upload; disappears on complete |
| Status message | `p` text | Animated: "Uploading…" → "Saved to SharePoint ✓" |
| Received date | `Popover` + `Calendar` | — |
| Notes | `Textarea` | Optional |
| Save | `Button` navy fill pill | Disabled during upload |

---

## Screen 3 — Waive Document (`Sheet`)

**Trigger:** "Waive" action in document row dropdown (`DropdownMenu`)

```
┌──────────────────────────────────────────────────────┐
│                              ┌───────────────────────┤
│                              │ SHEET (400px)         │
│                              │                       │
│                              │ Eyebrow: "Documents"  │
│                              │ H2: Waive Requirement │
│                              │                       │
│                              │ Document:             │
│                              │ A-Level Transcript    │
│                              │                       │
│                              │ ┌─────────────────┐   │
│                              │ │ ⚠ Warning       │   │
│                              │ │ This document   │   │
│                              │ │ is marked as    │   │
│                              │ │ required. A     │   │
│                              │ │ staff note is   │   │
│                              │ │ mandatory.      │   │
│                              │ └─────────────────┘   │
│                              │                       │
│                              │ Waiver Reason*        │
│                              │ [Textarea min 20ch]   │
│                              │                       │
│                              │ [Cancel]  [Waive →]   │
└──────────────────────────────┴───────────────────────┘
```

### Components
- `Sheet`, `SheetContent` side `"right"` (400px)
- `Alert` variant `warning` — Phosphor `Warning` icon
- `Textarea` — required; `FormMessage` "Waiver note is required" if empty on submit
- `Button` — waive button `variant="destructive"` outline pill
- On save: document status → `WAIVED`, `AuditLog` entry, `Sonner` toast "Document waived — reason recorded"

### Row Actions `DropdownMenu`
Each document row has a `DropdownMenu` (Phosphor `DotsThree` trigger):
```
┌──────────────────────┐
│  Mark as Received    │
│  Upload File         │
│  Waive               │
│  ──────              │
│  Clear Status        │
└──────────────────────┘
```
- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`
- "Waive" → opens Sheet above
- "Mark as Received" → opens compact `Dialog` for date only
- Sensitive rows: "Waive" and "Upload" disabled for non-`ADMISSIONS_STAFF` roles with `Tooltip`
