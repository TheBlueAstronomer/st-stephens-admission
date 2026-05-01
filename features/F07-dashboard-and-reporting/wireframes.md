# F07 — Wireframes: Dashboard and Reporting

> Inherits the global design system defined in `F01/wireframes.md`.

---

## Screen 1 — Admissions Dashboard (`/dashboard`)

**Access:** ADMISSIONS_STAFF, SENIOR_LEADERSHIP, SYSTEM_ADMINISTRATOR

### Layout: Asymmetrical Bento Grid

```
┌────────────────────────────────────────────────────────────────────┐
│ SIDEBAR │ PAGE HEADER                                              │
│         │ Eyebrow: "2025–2026"                                     │
│         │ H1: Admissions Dashboard                                 │
│         │ [Year ▾] [Programme ▾] [Diocese ▾] [Status ▾]  [Refresh]│
│         ├────────────────────────────────────────────────────────  │
│         │                                                          │
│         │ BENTO GRID — 12-col CSS Grid                            │
│         │                                                          │
│         │ ┌─ col-span-2 ─┐ ┌─ col-span-2 ─┐ ┌─ col-span-2 ─┐    │
│         │ │ ENQUIRIES    │ │ INTERVIEWS   │ │ OFFERS       │    │
│         │ │    [47]      │ │    [31]      │ │    [24]      │    │
│         │ │ +8 this wk   │ │ 12 scheduled │ │ 18 accepted  │    │
│         │ └──────────────┘ └──────────────┘ └──────────────┘    │
│         │                                                          │
│         │ ┌─ col-span-2 ─┐ ┌─ col-span-2 ─┐ ┌─ col-span-2 ─┐    │
│         │ │ REGISTRATIONS│ │ ORDINANDS    │ │ ACCOMMOD.    │    │
│         │ │    [18]      │ │    [14]      │ │   DEMAND     │    │
│         │ │ forms recv'd │ │ confirmed    │ │   32 rooms   │    │
│         │ └──────────────┘ └──────────────┘ └──────────────┘    │
│         │                                                          │
│         │ ┌─── col-span-8 ────────────────┐ ┌─ col-span-4 ──┐    │
│         │ │ Pipeline Chart                │ │ Accommodation │    │
│         │ │ (Bar chart: applicants by     │ │ Breakdown     │    │
│         │ │  status, colour-coded)        │ │ Donut chart:  │    │
│         │ │                               │ │ Single/Family │    │
│         │ │                               │ │ Term/Year     │    │
│         │ └───────────────────────────────┘ └───────────────┘    │
│         │                                                          │
│         │ ┌─── col-span-6 ────────────────┐ ┌─ col-span-6 ──┐    │
│         │ │ Diocese Distribution          │ │ BAP Status    │    │
│         │ │ Horizontal bar chart          │ │ Summary       │    │
│         │ │ Top 8 dioceses by count       │ │ Stage 1 / 2   │    │
│         │ │                               │ │ Stacked bar   │    │
│         │ └───────────────────────────────┘ └───────────────┘    │
│         │                                                          │
│         │                                 [↓ Export All →]        │
└─────────┴────────────────────────────────────────────────────────  │
```

### KPI Stat Card (Double-Bezel)
```
Outer:  rounded-[1.5rem] p-1.5 bg-black/4 ring-1 ring-black/6
Inner:  rounded-[calc(1.5rem-0.375rem)] bg-white px-6 py-5

Content:
  Eyebrow text  (10px uppercase tracking-[0.2em])
  Number         (Plus Jakarta Sans 700, 2.5rem, text-[#1A2744])
  Sub-label      (Geist 13px, text-muted)
  Trend indicator (Phosphor ArrowUp/ArrowDown + % change, colored)
```

### Components
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| Filter bar | `Select` (×4) + `Button` refresh | `rounded-xl`; filters trigger server re-fetch |
| KPI stat cards (×6) | `Card`, `CardContent` (Double-Bezel custom) | Animate count from `0` to value on mount using `requestAnimationFrame` counter |
| Pipeline bar chart | `Chart` (shadcn, Recharts) — `chart-bar-stacked` | X-axis: stages; Y-axis: count; colour per status |
| Accommodation donut | `Chart` — `chart-pie-donut` | Segments: Single/Family; inner text: total demand |
| Diocese bar | `Chart` — `chart-bar-horizontal` | Y-axis: diocese names; X-axis: count |
| BAP stacked bar | `Chart` — `chart-bar-stacked` | Completed / Scheduled / Incomplete / N/A |
| Export all | `Button` navy outline pill + Phosphor `DownloadSimple` | Triggers CSV export of current filtered view |
| Skeleton loading | `Skeleton` | Replaces each card/chart while data loads |

### Animation
- KPI cards: stagger entry `translate-y-4 opacity-0` → `translate-y-0 opacity-100` with 80ms delay per card
- Charts: Recharts built-in `isAnimationActive` — bars/arcs animate on mount
- Filter change: cards fade `opacity-50` → `opacity-100` during re-fetch

---

## Screen 2 — Reports (`/reports`)

**Access:** ADMISSIONS_STAFF, SENIOR_LEADERSHIP, SYSTEM_ADMINISTRATOR

### Layout: Left report navigator + right report content

```
┌────────────────────────────────────────────────────────────────────┐
│ SIDEBAR │                                                          │
│         │ H1: Reports                                              │
│         │                                                          │
│         │ ┌──────────────────┐  ┌──────────────────────────────┐  │
│         │ │ REPORT NAV       │  │ REPORT CONTENT               │  │
│         │ │                  │  │                              │  │
│         │ │ ● Pipeline       │  │ H2: Admissions Pipeline      │  │
│         │ │ ○ Diocese Dist.  │  │ Eyebrow: Last updated 2m ago │  │
│         │ │ ○ BAP Status     │  │                              │  │
│         │ │ ○ Offers vs Reg  │  │ [Year ▾] [Programme ▾]       │  │
│         │ │ ○ Accommodation  │  │                     [↓ CSV]  │  │
│         │ │ ○ Missing Docs   │  │                              │  │
│         │ │                  │  │ [Chart / Table area]         │  │
│         │ └──────────────────┘  │                              │  │
│         │                       └──────────────────────────────┘  │
└─────────┴────────────────────────────────────────────────────────  │
```

### Report Nav
- `nav` element with `Button` variant `ghost` items; active: `bg-[#1A2744]/8 text-[#1A2744] rounded-xl font-medium`
- Transition: `translate-x-2 opacity-0` → `translate-x-0 opacity-100` on content switch

---

### Report A — Admissions Pipeline Report

```
┌──────────────────────────────────────────────────────────────────┐
│  H2: Admissions Pipeline                                         │
│  [Year ▾]  [Programme ▾]          [↓ Export CSV]                 │
│                                                                  │
│  CHART: Grouped bar — by Status                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  [Recharts BarChart — applicants per status]           │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  TABLE: Breakdown by Programme                                   │
│  Status                │ Common Awards │ Oxford │ Total         │
│  Enquiry               │      12       │   8    │  20           │
│  Interview Scheduled   │       9       │   5    │  14           │
│  ...                   │      ...      │  ...   │  ...          │
└──────────────────────────────────────────────────────────────────┘
```
- `Chart` (shadcn `chart-bar-default`) + `Table` below
- `Button` "Export CSV" — downloads filtered data

---

### Report B — Diocese Distribution Report

```
│  H2: Diocese Distribution                                        │
│  [Year ▾]                         [↓ Export CSV]                │
│                                                                  │
│  CHART: Horizontal grouped bar (Applicants / Offers / Ordinands) │
│                                                                  │
│  TABLE:                                                          │
│  Diocese      │ Applicants │ Offers │ Confirmed Ordinands        │
│  Oxford       │     14     │   11   │     9                     │
│  London       │     10     │    8   │     7                     │
│  ...                                                             │
```
- `Chart` (`chart-bar-horizontal`) + `Table`

---

### Report C — BAP Status Report

```
│  H2: BAP Status                                                  │
│  [Year ▾]                         [↓ Export CSV]                │
│                                                                  │
│  STAGE 1:  Stacked bar / donut breakdown                         │
│  ┌──────────────────────────┐  ┌──────────────────────────┐     │
│  │ Completed: 38            │  │ Scheduled:  6            │     │
│  │ Incomplete: 2            │  │ N/A: 1                   │     │
│  └──────────────────────────┘  └──────────────────────────┘     │
│                                                                  │
│  STAGE 2:  Same layout                                           │
│                                                                  │
│  ⚠ Blocked Applicants (2)                                        │
│  Name · Status · BAP Stage 1: INCOMPLETE [View →]               │
```
- KPI stat cards for each status bucket
- `Alert` warning for blocked applicants with inline table

---

### Report D — Offers vs Registrations

```
│  H2: Offers vs Registrations                                     │
│  [Year ▾]                         [↓ Export CSV]                │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ │
│  │Conditional│ │Uncondit.│ │ Accepted │ │  Reg Rcvd│ │Confrmd│ │
│  │    9     │ │    15   │ │    22    │ │    18    │ │  14   │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └───────┘ │
│                                                                  │
│  FUNNEL CHART (Recharts FunnelChart or horizontal bar cascade)   │
```
- 5 KPI stat cards + funnel/cascade visual
- `Chart` custom with Recharts `BarChart` descending

---

### Report E — Accommodation Demand

```
│  H2: Accommodation Demand                                        │
│  [Year ▾]                         [↓ Export CSV]                │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Total Demand │ │ Single Rooms │ │ Family Units │            │
│  │     32       │ │     21       │ │     11       │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                  │
│  DONUT: Single vs Family                                         │
│  BAR:   Term-time vs Full-year per type                          │
│                                                                  │
│  TABLE:                                                          │
│  Type     │ Term-time │ Full-year │ Family Size                  │
│  Single   │    14     │     7     │  —                          │
│  Family   │     6     │     5     │  avg 2.8                    │
```
- 3 KPI stat cards + `chart-pie-donut` + grouped `chart-bar-default` + `Table`

---

### Report F — Missing Documents Report

```
│  H2: Missing Documents                                           │
│  [Year ▾]  [Status ▾]             [↓ Export CSV]               │
│                                                                  │
│  ⚠ 8 applicants have outstanding required documents             │
│                                                                  │
│  TABLE:                                                          │
│  Applicant    │ Missing Documents                 │ Status       │
│  J. Smith     │ Undergrad Transcript, Ref 2       │ [SCHED.]    │
│  A. Patel     │ DBS Check                         │ [COND.OFF.] │
│  ...                                                             │
│                                                                  │
│  WAIVED DOCUMENTS                                                │
│  Applicant    │ Document          │ Waived By │ Reason          │
│  M. Brown     │ A-Level Transcript│ A. Jones  │ Mature student  │
```
- `Alert` summary count at top
- `Table` with expandable rows per applicant — `Collapsible` per row revealing missing doc list
- Second `Table` for waived docs below `Separator`

### Export CSV Pattern (all reports)
```typescript
// Button triggers server action that returns:
// Content-Type: text/csv
// Content-Disposition: attachment; filename="ssh-pipeline-2025-2026-{date}.csv"
```
- `Button` pill with Phosphor `DownloadSimple`
- Loading state: `Spinner` inside button
- `Sonner` toast on complete: "Export ready — file saved"
