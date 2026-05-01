# F06 — Wireframes: Applicant-Facing Forms

> These are **public** screens — no sidebar, no staff shell. Standalone layout.
> Must be mobile-first and WCAG 2.1 AA compliant.

---

## Design Overrides for Public Forms

- **Background:** Pure `#FFFFFF` — maximum legibility on all devices
- **Container:** Max-width `640px` centred, `px-4` on mobile
- **Font:** `Plus Jakarta Sans` for headings, `Geist` for body/inputs
- **No sidebar, no navigation rail**
- **Header:** Minimal — SSH crest + institution name, no links
- **Footer:** "© St Stephen's House, Oxford" + accessibility statement link
- **Progress:** Multi-step `Progress` bar at top for both forms
- **Animations:** Entry only on step transition — `translate-x-8 opacity-0` → `translate-x-0 opacity-100`; never on scroll (mobile performance)

---

## Screen 1 — Interview Application Form (`/forms/interview-application`)

**Access:** Public (no authentication)

### Step 1 of 6 — Personal Details

```
┌──────────────────────────────────────────────────┐
│  [SSH Crest]  St Stephen's House, Oxford         │
├──────────────────────────────────────────────────┤
│                                                  │
│  Eyebrow: "Interview Application"                │
│  H1: Personal Details                            │
│                                                  │
│  [██████░░░░░░░░░░░░░] Step 1 of 6              │
│                                                  │
│  Applicant ID (if known)  [__________________]   │
│  Legal Name*              [__________________]   │
│  Preferred Name           [__________________]   │
│  Date of Birth*           [📅________________]   │
│  Email*                   [__________________]   │
│  Phone*                   [__________________]   │
│  Address Line 1*          [__________________]   │
│  Address Line 2           [__________________]   │
│  City*                    [__________________]   │
│  Postcode*                [__________________]   │
│  Country*                 [▾_________________]   │
│                                                  │
│                          [Next: BAP Status →]    │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Step 2 of 6 — BAP Status

```
│  H2: BAP Status                                  │
│  [████████░░░░░░░░░░] Step 2 of 6               │
│                                                  │
│  Diocese*                 [▾_________________]   │
│  Director of Ordinands*   [__________________]   │
│  DDO Email*               [__________________]   │
│                                                  │
│  Stage 1 BAP Status*      [▾_________________]   │
│  Stage 1 BAP Date          [📅________________]  │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ ℹ️ Stage 1 BAP must be Completed or      │    │
│  │ Scheduled to proceed to interview.       │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  [← Back]              [Next: Academic History →]│
```

### Step 3 of 6 — Academic History

```
│  H2: Academic History                            │
│  [████████████░░░░░░] Step 3 of 6               │
│                                                  │
│  Programme Interest*      [▾_________________]   │
│  Undergraduate Degree     [__________________]   │
│  University               [__________________]   │
│  Degree Classification    [▾_________________]   │
│  Postgraduate Degree      [__________________]   │
│  Postgraduate University  [__________________]   │
│                                                  │
│  [← Back]              [Next: References →]      │
```

### Step 4 of 6 — References

```
│  H2: References                                  │
│                                                  │
│  Academic Reference 1                            │
│  Name*    [___________]  Email* [___________]    │
│  Institution* [_______]                          │
│                                                  │
│  Academic Reference 2                            │
│  Name*    [___________]  Email* [___________]    │
│  Institution* [_______]                          │
│                                                  │
│  [← Back]         [Next: Supporting Info →]      │
```

### Step 5 of 6 — Supporting Information & Uploads

```
│  H2: Supporting Information                      │
│                                                  │
│  Personal Statement*                             │
│  [Textarea — min 200 words]                      │
│  Word count: 0 / 200 minimum                     │
│                                                  │
│  ── Document Uploads ─────────────────────────   │
│                                                  │
│  GCSE Transcript                                 │
│  [↑ Upload file]  or  drag here                  │
│                                                  │
│  A-Level Transcript                              │
│  [↑ Upload file]  or  drag here                  │
│                                                  │
│  Undergraduate Transcript                        │
│  [↑ Upload file]  or  drag here                  │
│                                                  │
│  [← Back]             [Next: Declaration →]      │
```

### Step 6 of 6 — Consent and Declaration

```
│  H2: Declaration                                 │
│  [████████████████████] Step 6 of 6             │
│                                                  │
│  [ScrollArea — declaration text]                 │
│  I confirm that the information provided...      │
│                                                  │
│  ☐ I confirm I have read and agree to the        │
│    above declaration.*                           │
│                                                  │
│  ☐ I consent to St Stephen's House processing    │
│    my personal data for admissions purposes.*    │
│                                                  │
│  [← Back]               [Submit Application →]  │
```

### Submission Confirmation Screen

```
┌──────────────────────────────────────────────────┐
│  [SSH Crest]                                     │
│                                                  │
│       ✓  (large Phosphor CheckCircle, green)     │
│                                                  │
│  H1: Application Submitted                       │
│                                                  │
│  Thank you, James. Your interview application    │
│  has been received by St Stephen's House.        │
│                                                  │
│  The admissions team will be in touch with       │
│  next steps. Please retain this for your         │
│  records:                                        │
│                                                  │
│  Reference: SSH-2025-0012                        │
│  Submitted: Mon 14 Jul 2025 at 10:32am           │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Components (all steps)
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| Step progress | `Progress` | Animated fill per step |
| All text inputs | `Form`, `FormField`, `FormControl`, `Input`, `Label`, `FormMessage` | React Hook Form + Zod; `FormMessage` for inline errors |
| Select fields | `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` | Diocese, Programme, BAP status |
| Date fields | `Popover` + `Calendar` | Date of birth, BAP date |
| Country | `Select` (searchable) | Combobox pattern |
| Textarea | `Textarea` | With word-count helper text |
| File upload zones | Custom `div` (drag + click) | Drop area + hidden `<input type="file">`; `Progress` bar per file; file name shown after upload |
| Checkboxes (declaration) | `Checkbox`, `Label` | Required; `FormMessage` if unchecked on submit |
| Nav buttons | `Button` | Back: `variant="ghost"` pill; Next/Submit: navy fill pill |
| Info callout | `Alert` | Blue-tint, Phosphor `Info` icon |
| Success screen checkmark | Phosphor `CheckCircle` | 64px, `text-[#1A6B3A]`; scale-in animation `scale-0` → `scale-100` |

---

## Screen 2 — Registration Form (`/forms/registration`)

**Access:** Public (no authentication)

### Step 1 of 5 — Contact Details Confirmation

```
┌──────────────────────────────────────────────────┐
│  [SSH Crest]  St Stephen's House, Oxford         │
├──────────────────────────────────────────────────┤
│                                                  │
│  Eyebrow: "Registration"                         │
│  H1: Confirm Your Details                        │
│                                                  │
│  [████░░░░░░░░░░░░░░░] Step 1 of 5              │
│                                                  │
│  Applicant ID*            [__________________]   │
│                                                  │
│  Please confirm your contact details:            │
│  Legal Name*              [__________________]   │
│  Email*                   [__________________]   │
│  Phone*                   [__________________]   │
│  Address Line 1*          [__________________]   │
│  City / Postcode*         [__________________]   │
│                                                  │
│                      [Next: Programme →]         │
└──────────────────────────────────────────────────┘
```

### Step 2 of 5 — Programme Confirmation

```
│  H2: Programme                                   │
│                                                  │
│  Confirm your programme:                         │
│  Programme*               [▾_________________]   │
│  Mode of Study*           [▾_________________]   │
│  Admissions Year          2025–2026              │
│                                                  │
│  [← Back]          [Next: Accommodation →]       │
```

### Step 3 of 5 — Accommodation Preferences

```
│  H2: Accommodation                               │
│                                                  │
│  Do you require accommodation?*                  │
│  ○ Yes   ○ No                                    │
│                                                  │
│  (shown when Yes selected)                       │
│  Accommodation Type*      [▾_________________]   │
│  Duration*                [▾_________________]   │
│  Family Unit Size         [____ number ______]   │
│                                                  │
│  Additional notes         [Textarea optional]    │
│                                                  │
│  [← Back]        [Next: Supporting Bishop →]     │
```

### Step 4 of 5 — Supporting Bishop & Documents

```
│  H2: Supporting Bishop                           │
│                                                  │
│  Bishop Name*             [__________________]   │
│  Bishop Email             [__________________]   │
│  Bishop Phone             [__________________]   │
│                                                  │
│  ── Document Uploads ─────────────────────────   │
│  Passport Photograph*     [↑ Upload]             │
│  Any remaining documents  [↑ Upload]             │
│                                                  │
│  [← Back]          [Next: Declaration →]         │
```

### Step 5 of 5 — Electronic Signature & Declaration

```
│  H2: Declaration & Signature                     │
│  [████████████████████] Step 5 of 5             │
│                                                  │
│  [ScrollArea — registration declaration text]    │
│                                                  │
│  Type your full name as your signature*          │
│  [__________________]                            │
│                                                  │
│  ☐ I confirm all information provided is true.*  │
│                                                  │
│  [← Back]          [Submit Registration →]       │
```

### Submission Confirmation Screen
Same pattern as Interview Application form — reference number, timestamp, thank-you message.

### Low-Confidence Match Banner (staff side — F02 Applicant List)
When a form submission cannot be auto-matched, admissions staff see a banner in the Applicant List:

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚠ 1 unmatched form submission requires review   [Review →]      │
└──────────────────────────────────────────────────────────────────┘
```
- `Alert` variant `warning` pinned at top of Applicant List
- "Review →" opens a `Sheet` with the raw submission and a "Match to applicant" `Combobox` search
- Components: `Alert`, `AlertDescription`, `Button`, `Sheet`, `Combobox`
