# F01 — Wireframes: Project Foundation and Authentication

---

## Design System (Global — applies to all screens)

### Vibe Archetype: Soft Structuralism
- **Background:** `#F8F7F5` warm off-white; `#FFFFFF` card surfaces
- **Primary accent:** Deep Oxford navy `#1A2744`
- **Secondary accent:** Warm stone `#C4A882`
- **Destructive / alert:** `#C0392B`
- **Success:** `#1A6B3A`
- **Muted text:** `#6B7280`
- **Hairline borders:** `border border-black/8` — never a generic 1px solid gray

### Typography
- **Heading font:** `Plus Jakarta Sans` — variable weight 600–800
- **Body / UI font:** `Geist` — variable weight 400–500
- **Monospace (IDs, codes):** `Geist Mono`
- **Eyebrow tags:** `text-[10px] uppercase tracking-[0.2em] font-medium` in a pill `rounded-full px-3 py-1 bg-black/5`

### Iconography
- **Library:** Phosphor Light (`phosphor-react`) — stroke-weight 1.2, never thick Lucide defaults
- **Size:** 18px inline, 20px in nav, 16px in dense tables

### Motion
- All transitions: `transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]`
- Hover state scale: `hover:scale-[1.01] active:scale-[0.98]`
- Page entry: `translate-y-4 opacity-0` → `translate-y-0 opacity-100` over 600ms, staggered per section
- Sidebar collapse: width interpolated via `transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]`

### Double-Bezel Card Pattern
```
Outer shell:  rounded-[1.5rem] p-1.5 bg-black/4 ring-1 ring-black/6
Inner core:   rounded-[calc(1.5rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]
```

---

## Screen 1 — Login Screen (`/login`)

**Feature:** F01 | **Route:** `/login` | **Access:** Public

### Layout: Editorial Split (centred variant)

```
┌─────────────────────────────────────────────────────────┐
│  [Fixed background: warm #F8F7F5 with subtle noise]     │
│                                                         │
│   LEFT HALF                  RIGHT HALF                 │
│   ┌─────────────────┐        ┌────────────────────┐     │
│   │ Institutional   │        │  [Double-Bezel     │     │
│   │ branding block  │        │   Login Card]      │     │
│   │                 │        │                    │     │
│   │ [SSH crest SVG] │        │  Eyebrow tag:      │     │
│   │                 │        │  "Staff Portal"    │     │
│   │ St Stephen's    │        │                    │     │
│   │ House, Oxford   │        │  H2: Sign in to    │     │
│   │                 │        │  Admissions        │     │
│   │ "Admissions     │        │                    │     │
│   │  Management"    │        │  [Microsoft SSO    │     │
│   │                 │        │   Button]          │     │
│   │ Muted:          │        │                    │     │
│   │ "Manage the     │        │  ────────────────  │     │
│   │  full ordinand  │        │                    │     │
│   │  admissions     │        │  [Alert: error     │     │
│   │  lifecycle."    │        │   message zone]    │     │
│   │                 │        │                    │     │
│   └─────────────────┘        └────────────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Components
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| Login card outer shell | `div` (Double-Bezel) | `rounded-[2rem] p-2 bg-black/4 ring-1 ring-black/6` |
| Login card inner | `Card`, `CardHeader`, `CardContent` | `rounded-[calc(2rem-0.5rem)] bg-white` |
| Eyebrow tag | `Badge` variant `secondary` | `rounded-full text-[10px] uppercase tracking-[0.2em]` |
| Microsoft sign-in button | `Button` | Full-width pill `rounded-full px-6 py-3`; MS logo SVG left; arrow icon nested in inner circle right |
| Error message | `Alert` variant `destructive` | Entry animation: fade-down from `opacity-0 -translate-y-2` |
| Institutional logo | SVG / `Image` (Next.js) | — |

### Microsoft Button Anatomy
```
┌──────────────────────────────────────────────────────┐
│  [MS Logo 20px]   Sign in with Microsoft   [↗ circle]│
└──────────────────────────────────────────────────────┘
rounded-full  bg-[#1A2744]  text-white  px-6 py-3
hover: bg-[#233360]  active:scale-[0.98]
Inner arrow circle: w-8 h-8 rounded-full bg-white/10 flex items-center justify-center
group-hover: translate-x-0.5 -translate-y-0.5 scale-105
```

### Error Alert States
- **Unauthorised account:** "This Microsoft account is not authorised to access the admissions system. Contact your system administrator."
- **Session expired:** "Your session has expired. Please sign in again."
- Both rendered via shadcn `Alert` with `AlertCircle` (Phosphor Light) icon

### Mobile Collapse (`< 768px`)
- Single column, `min-h-[100dvh]`, branding block stacks above card
- Card becomes `mx-4` full-width, `rounded-[1.5rem]`

---

## Screen 2 — Application Shell (Staff Layout)

**Feature:** F01 | **Route:** All authenticated staff routes | **Access:** Role-dependent

### Layout: Sidebar-07 pattern (collapses to icon rail)

```
┌────────────────────────────────────────────────────────────────┐
│ SIDEBAR (240px expanded / 64px icon rail collapsed)            │
│ ┌──────────────────┐ ┌────────────────────────────────────────┐│
│ │ [SSH crest]      │ │ TOP BAR                                ││
│ │ St Stephen's     │ │ [Breadcrumb]        [Search] [Avatar]  ││
│ │ House            │ ├────────────────────────────────────────┤│
│ ├──────────────────┤ │                                        ││
│ │ ◉ Dashboard      │ │  PAGE CONTENT AREA                     ││
│ │ ○ Applicants     │ │  (rendered by child route)             ││
│ │ ○ Interviews     │ │                                        ││
│ │ ○ Reports        │ │                                        ││
│ │ ─────────────    │ │                                        ││
│ │ ○ Admin          │ │                                        ││
│ │   (admin only)   │ │                                        ││
│ ├──────────────────┤ │                                        ││
│ │ [User avatar]    │ │                                        ││
│ │ Name · Role pill │ │                                        ││
│ │ Sign out         │ │                                        ││
│ └──────────────────┘ └────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

### Components
| Zone | shadcn/ui Component | Notes |
|------|---------------------|-------|
| Sidebar shell | `Sidebar` (`sidebar-07` block) | Collapses to icon rail on toggle |
| Sidebar menu items | `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton` | Active state: `bg-[#1A2744] text-white rounded-xl` |
| Nav icons | Phosphor Light: `House`, `Users`, `CalendarBlank`, `ChartBar`, `Gear` | 20px |
| Role pill in footer | `Badge` | `ADMISSIONS_STAFF` → navy, `ACADEMIC_STAFF` → stone, `SENIOR_LEADERSHIP` → muted, `SYSTEM_ADMINISTRATOR` → slate |
| Top bar search | `Command` (cmd+k) | Opens `CommandDialog` for global applicant search |
| User avatar | `Avatar`, `AvatarFallback`, `AvatarImage` | Initials fallback |
| Top bar breadcrumb | `Breadcrumb`, `BreadcrumbItem`, `BreadcrumbSeparator` | — |
| Sign out | `DropdownMenu` on avatar | `DropdownMenuItem` "Sign out" |
| Toast notifications | `Sonner` | Bottom-right, `rounded-[1rem]` |

### Role-Aware Navigation Visibility
| Nav Item | ADMISSIONS_STAFF | ACADEMIC_STAFF | SENIOR_LEADERSHIP | SYSTEM_ADMIN |
|----------|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | — | ✓ | ✓ |
| Applicants | ✓ | read-only | — | ✓ |
| Interviews | ✓ | assigned only | — | ✓ |
| Reports | ✓ | — | ✓ | ✓ |
| Admin | — | — | — | ✓ |

### Sidebar Animation
- Expand/collapse: `transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]`
- Label fade: `opacity-0 w-0` → `opacity-100 w-auto` with `overflow-hidden`
- Tooltip on icon-rail hover: shadcn `Tooltip` showing nav label
