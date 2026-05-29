# F06 — Wireframes: Applicant-Facing Forms

> These are **public** screens — no sidebar, no staff shell. Standalone layout.
> Must be mobile-first and WCAG 2.1 AA compliant.

---

## Design Overrides for Public Forms

- **Background:** Pure `#FFFFFF` — maximum legibility on all devices
- **Design dials:** Public-form tuned `DESIGN_VARIANCE 5`, `MOTION_INTENSITY 6`, `VISUAL_DENSITY 4`
- **Container:** Form column remains max-width `640px`; desktop uses an asymmetric outer grid with a quiet progress/context rail; mobile collapses to one column with `px-4`
- **Font:** `Geist` for headings, body, and inputs; `Geist Mono` for step numbers and reference metadata
- **No sidebar, no navigation rail**
- **Header:** Minimal — SSH crest + institution name, no links
- **Footer:** "© St Stephen's House, Oxford" + accessibility statement link
- **Progress:** Multi-step `Progress` bar at top for both forms
- **Desktop context rail:** `md+` only, border-left grouping, current step indicated with a brand-ink animated marker; no card shell
- **Motion:** Use Motion for React (`motion/react`) in isolated client leaf components. Step transitions, progress marker movement, submit loading, and confirmation success use transform/opacity only and respect reduced-motion preferences
- **Colors:** Token-only palette for implementation: brand navy, neutral surfaces, `accent-gold`, `success`, and semantic destructive. No raw blue/emerald/gray screen-specific utilities
- **Controls:** Phosphor icons for button arrows, alerts, file upload, checkmarks, and select/checkbox glyphs. Text arrows and emoji are not used in markup

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
│  [progress bar] Step 1 of 6                     │
│                                                  │
│  Applicant ID (if known)  [__________________]   │
│  Legal Name*              [__________________]   │
│  Preferred Name           [__________________]   │
│  Date of Birth*           [date input]           │
│  Email*                   [__________________]   │
│  Phone*                   [__________________]   │
│  Address Line 1*          [__________________]   │
│  Address Line 2           [__________________]   │
│  City*                    [__________________]   │
│  Postcode*                [__________________]   │
│  Country*                 [▾_________________]   │
│                                                  │
│                          [Next: BAP Status][>]   │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Step 2 of 6 — BAP Status

```
│  H2: BAP Status                                  │
│  [progress bar] Step 2 of 6                     │
│                                                  │
│  Diocese*                 [▾_________________]   │
│  Director of Ordinands*   [__________________]   │
│  DDO Email*               [__________________]   │
│                                                  │
│  Stage 1 BAP Status*      [▾_________________]   │
│  Stage 1 BAP Date          [date input]          │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ [Info icon] Stage 1 BAP must be Completed│    │
│  │ Scheduled to proceed to interview.       │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  [< Back]              [Next: Academic History][>]│
```

### Step 3 of 6 — Academic History

```
│  H2: Academic History                            │
│  [progress bar] Step 3 of 6                     │
│                                                  │
│  Programme Interest*      [▾_________________]   │
│  Undergraduate Degree     [__________________]   │
│  University               [__________________]   │
│  Degree Classification    [▾_________________]   │
│  Postgraduate Degree      [__________________]   │
│  Postgraduate University  [__________________]   │
│                                                  │
│  [< Back]              [Next: References][>]     │
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
│  [< Back]         [Next: Supporting Info][>]     │
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
│  [Upload icon] Upload file or drag here          │
│                                                  │
│  A-Level Transcript                              │
│  [Upload icon] Upload file or drag here          │
│                                                  │
│  Undergraduate Transcript                        │
│  [Upload icon] Upload file or drag here          │
│                                                  │
│  [< Back]             [Next: Declaration][>]     │
```

### Step 6 of 6 — Consent and Declaration

```
│  H2: Declaration                                 │
│  [progress bar] Step 6 of 6                     │
│                                                  │
│  [ScrollArea — declaration text]                 │
│  I confirm that the information provided...      │
│                                                  │
│  [ ] I confirm I have read and agree to the      │
│    above declaration.*                           │
│                                                  │
│  [ ] I consent to St Stephen's House processing  │
│    my personal data for admissions purposes.*    │
│                                                  │
│  [< Back]               [Submit Application]     │
```

### Submission Confirmation Screen

```
┌──────────────────────────────────────────────────┐
│  [SSH Crest]                                     │
│                                                  │
│       [Phosphor CheckCircle, success token]      │
│                                                  │
│  H1: Application Submitted                       │
│                                                  │
│  Thank you, James. Your interview application    │
│  has been received by St Stephen's House.        │
│                                                  │
│  Please retain this for your records:            │
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
| Date fields | Native date input | Date of birth, BAP date |
| Country | `Select` (searchable) | Combobox pattern |
| Textarea | `Textarea` | With word-count helper text |
| File upload zones | Custom `div` (drag + click) | Drop area + hidden `<input type="file">`; `Progress` bar per file; file name shown after upload |
| Checkboxes (declaration) | `Checkbox`, `Label` | Required; `FormMessage` if unchecked on submit |
| Nav buttons | `Button` | Back: `variant="ghost"` with Phosphor arrow icon; Next/Submit: navy fill pill with Phosphor arrow or submit loading shimmer |
| Info callout | `Alert` | `accent-gold` tint, Phosphor `Info` icon |
| Desktop context rail | Custom Motion leaf component | `md+` only; asymmetric progress rail with animated current-step marker |
| Success screen checkmark | Motion leaf component + Phosphor `CheckCircle` | 64px, `success` token, scale/fade animation with reduced-motion fallback |

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
