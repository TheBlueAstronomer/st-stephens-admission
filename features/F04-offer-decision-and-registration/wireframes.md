# F04 — Wireframes: Offer Decision and Registration

> Inherits the global design system defined in `F01/wireframes.md`.

---

## Screen 1 — Record Offer Decision (`Sheet` on Applicant Detail)

**Trigger:** "Record Offer" quick action on Applicant Detail left column  
**Access:** ADMISSIONS_STAFF only

### Layout: Right-side `Sheet` panel

```
┌──────────────────────────────────────────────────────┐
│  [bg-black/40 overlay]                               │
│                              ┌───────────────────────┤
│                              │ SHEET (480px)         │
│                              │                       │
│                              │ Eyebrow: "Outcome"    │
│                              │ H2: Record Offer      │
│                              │                       │
│                              │ Applicant             │
│                              │ James Smith           │
│                              │ SSH-2025-0012         │
│                              │                       │
│                              │ ── Decision ────────  │
│                              │ Offer Type*           │
│                              │ ┌──────────────────┐  │
│                              │ │ ○ Conditional    │  │
│                              │ │ ○ Unconditional  │  │
│                              │ │ ○ Declined       │  │
│                              │ │ ○ Withdrawn      │  │
│                              │ └──────────────────┘  │
│                              │                       │
│                              │ Decision Date*  [📅]  │
│                              │                       │
│                              │ ── Conditions ──────  │
│                              │ (shown when           │
│                              │  Conditional)         │
│                              │ [+ Add condition]     │
│                              │ • Subject to Stage 2  │
│                              │   BAP  [×]            │
│                              │                       │
│                              │ ── Notes ───────────  │
│                              │ [Textarea optional]   │
│                              │                       │
│                              │ ── Declined/Withdrawn │
│                              │ Reason (conditional)  │
│                              │ [Textarea*]           │
│                              │                       │
│                              │ [Cancel] [Save →]     │
│                              └───────────────────────┘
```

### Components
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| Offer type | `RadioGroup`, `RadioGroupItem` | Pill card style; colour accent: green (offers), red (declined), muted (withdrawn) |
| Decision date | `Popover` + `Calendar` | — |
| Conditions list | Dynamic list with `Input` per condition | `Button` variant `ghost` "+ Add condition"; each row has Phosphor `X` remove |
| Conditional validation | `Alert` destructive | "Conditional offers must have at least one condition" — shown on save attempt |
| Reason textarea | `Textarea` | Only shown when Declined or Withdrawn; required |
| Notes textarea | `Textarea` | Optional, always visible |
| Save button | `Button` navy fill pill | Disabled until required fields valid |

### Offer Type Visual Cues
- `CONDITIONAL` selected → conditions section expands with `translate-y-0 opacity-100` (Collapsible)
- `DECLINED` / `WITHDRAWN` selected → reason section expands; conditions section hides
- `UNCONDITIONAL` → all optional sections hidden

---

## Screen 2 — Offer Detail Tab (inside Applicant Detail)

Rendered inside the **Offer** tab of the Applicant Detail screen.

```
┌──────────────────────────────────────────────────────────────┐
│  TAB: Offer Decision                                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Double-Bezel Card                                     │  │
│  │                                                        │  │
│  │  Offer Type    CONDITIONAL_OFFER  [badge]              │  │
│  │  Decision Date  14 Jul 2025                            │  │
│  │                                                        │  │
│  │  Conditions                                            │  │
│  │  • Subject to successful Stage 2 BAP                  │  │
│  │  • Medical clearance required                          │  │
│  │                                                        │  │
│  │  ── Acceptance ──────────────────────────────────────  │  │
│  │  Status:   Pending                                     │  │
│  │  [ Mark as Accepted ]   [ Mark as Declined ]           │  │
│  │                                                        │  │
│  │  Decision Notes  (optional)                            │  │
│  │  —                                                     │  │
│  │                                                        │  │
│  │  [ Edit Offer Decision ]                               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Components
- Offer type: `Badge` (colour-coded)
- Conditions: `ul` styled list with Phosphor `Dot` bullet
- Accept/Decline: `Button` (green fill / outline-destructive) → `AlertDialog` confirmation → records `acceptedAt` / `declinedAt`
- Edit: opens the same `Sheet` pre-populated

---

## Screen 3 — Registration Tab (inside Applicant Detail)

**Access:** ADMISSIONS_STAFF only

```
┌──────────────────────────────────────────────────────────────┐
│  TAB: Registration                                           │
│                                                              │
│  ── Registration Form ──────────────────────────────────     │
│                                                              │
│  Form Received:  [ Mark as Received ]                        │
│                  ↓ (after)                                   │
│  ✓ Received  Thu 14 Aug 2025 · 11:03am                      │
│                                                              │
│  ── Registration Data (from applicant form) ──────────────   │
│                                                              │
│  ┌───────────────────────┐  ┌───────────────────────────┐   │
│  │ Contact Details       │  │ Programme                 │   │
│  │ ✓ Confirmed           │  │ Oxford — MTh Theology     │   │
│  │                       │  │ ✓ Confirmed               │   │
│  └───────────────────────┘  └───────────────────────────┘   │
│  ┌───────────────────────┐  ┌───────────────────────────┐   │
│  │ Supporting Bishop     │  │ Accommodation             │   │
│  │ Rt Rev. J. Taylor     │  │ FAMILY — Full Year        │   │
│  │ ✓ Confirmed           │  │ Family size: 3            │   │
│  └───────────────────────┘  └───────────────────────────┘   │
│                                                              │
│  Electronic Signature:  [View declaration]                   │
│                                                              │
│  ── Ordinand Confirmation ──────────────────────────────     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Checklist before confirming:                        │   │
│  │  ✓ Registration form received                        │   │
│  │  ✓ Mandatory documents complete (or waived)          │   │
│  │  ✓ Accommodation fields completed                    │   │
│  │                                                      │   │
│  │  [ Confirm as Ordinand → ]                           │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Components
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| Registration received | `Button` → static timestamp (same pattern as invitation tracking) | Records `registrationFormReceivedAt` |
| Data summary grid | 2-col grid of `Card` (Double-Bezel, compact) | Each card: label + value + confirmed checkmark |
| Signature view | `Button` variant `ghost` + `Dialog` showing declaration text | — |
| Confirm ordinand checklist | `div` list with Phosphor `CheckCircle` (green) / `XCircle` (red) per item | Dynamically resolved |
| Confirm button | `Button` navy fill pill | Disabled when checklist incomplete; `Tooltip` on each failed item; `AlertDialog` "This cannot be undone" |
| Blocked state `Alert` | `Alert` destructive | e.g. "Cannot confirm: mandatory documents outstanding" |

### Confirm Ordinand AlertDialog
```
┌────────────────────────────────────────────────┐
│  Confirm as Ordinand                           │
│                                                │
│  James Smith will be confirmed as a            │
│  Confirmed Ordinand. This action will be       │
│  recorded with today's date and cannot         │
│  be undone without administrator support.      │
│                                                │
│  [Cancel]         [Confirm — 14 Aug 2025 →]   │
└────────────────────────────────────────────────┘
```
- `AlertDialog`, `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogDescription`
- Confirm button: navy fill with today's date embedded
- On confirm: status → `CONFIRMED_ORDINAND`, `confirmedOrdinandAt` recorded, `Sonner` success toast
