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
│  Completion:  [████████░░]  3 / 12 documents complete            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Document              Required  Status       Received   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  GCSE Transcript         ✓       [RECEIVED]  12 Jun 25   │   │
│  │  A-Level Transcript      ✓       [RECEIVED]  12 Jun 25   │   │
│  │  Undergraduate Transcript✓       [OUTSTANDING]    —  [+] │   │
│  │  Postgraduate Transcript  —      [OUTSTANDING]    —  [+] │   │
│  │  Stage 1 BAP Report      ✓       [OUTSTANDING]    —  [+] │   │
│  │  Stage 2 BAP Report      ✓       [OUTSTANDING]    —  [+] │   │
│  │  Academic Reference 1    ✓       [OUTSTANDING]    —  [+] │   │
│  │  Academic Reference 2    ✓       [OUTSTANDING]    —  [+] │   │
│  │  Pastoral Reference      ✓       [OUTSTANDING]    —  [+] │   │
│  │  Passport Photo          ✓       [OUTSTANDING]    —  [+] │   │
│  │  Legal ID          🔒    ✓       [OUTSTANDING]    —  [+] │   │
│  │  DBS Check         🔒    ✓       [OUTSTANDING]    —  [+] │   │
│  │  Interview Notes          —      [OUTSTANDING]    —  [+] │   │
│  │  Medical Declaration 🔒  ✓       [WAIVED]         —      │   │
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
| Document table | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` | — |
| Status badge | `Badge` | Colour per status above |
| Received date | `TableCell` | Geist Mono `text-sm`; `—` when not received |
| File link [↗] | `Button` variant `ghost` size `sm` + Phosphor `ArrowSquareOut` | Opens SharePoint file URL |
| Row action [+] | `Button` variant `ghost` size `sm` + Phosphor `Plus` | Opens document action `Sheet` (Screen 3) |
| Sensitive lock 🔒 | Phosphor `Lock` 14px | Only shown for Legal ID, DBS Check, and Medical Declaration; row hidden for non-admissions roles |

---

## Screen 2 — Upload Document (`Dialog`)

**Trigger:** [+] quick-add button or row actions menu ("Mark as Received" / "Upload File") on any checklist row

```
┌────────────────────────────────────────────────────┐
│  Double-Bezel Dialog                               │
│  ┌──────────────────────────────────────────────┐  │
│  │                                              │  │
│  │  Eyebrow: "Documents"                        │  │
│  │  H2: Upload Document                         │  │
│  │                                              │  │
│  │  Document: [Pre-selected name from checklist row]    │  │
│  │  (type selector hidden when opened from a row)      │  │
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
| Browse button | Native `<label>` linked to `<input type="file">` | Uses label/input pairing to preserve trusted click context; opens file picker reliably |
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
