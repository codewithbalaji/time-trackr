# Time Tracker — Visual Design Tokens

## Overview

A calm, confident enterprise dashboard aesthetic: warm off-white canvas, crisp white cards, one disciplined indigo primary, and soft pastel icon chips used to color-code metric categories at a glance. Bold, tight-tracked headline type for "welcome"/summary moments; clean uppercase micro-labels for structure (section eyebrows, table headers, stat labels). High information density (stat rows, tables, charts) balanced by generous card padding and rounded, friendly corners rather than sharp enterprise-gray boxes.

This file defines concrete tokens (colors, type, spacing, components). Behavioral rules (loading/empty/error states, accessibility, when to use which pattern) stay in `docs/design-system.md`, which references this file for the actual values.

---

## Colors

- **Primary** (#4F46E5): CTAs, active nav state, links, focus rings, chart highlight bar — indigo
- **Primary Hover** (#4338CA): Darker indigo for hover/active-press states
- **Primary Soft** (#E0E7FF): Active nav row background, indigo icon-chip background
- **Background** (#F7F5F2): App canvas — warm off-white, sits behind all cards
- **Surface** (#FFFFFF): Sidebar, cards, tables, modals, top bar
- **Border** (#ECEAE6): Card borders, dividers, input borders — subtle and recessive
- **Text Primary** (#111827): Headings, values, primary labels
- **Text Secondary** (#6B7280): Descriptions, supporting copy
- **Text Muted** (#9CA3AF): Uppercase micro-labels, placeholders, table headers, timestamps
- **Success** (#16A34A) / soft bg (#DCFCE7): Positive deltas, "Approved"/"Completed" status
- **Warning** (#F59E0B) / soft bg (#FEF3C7): "Pending" status, caution banners
- **Error** (#EF4444) / soft bg (#FEE2E2): Negative deltas, "Rejected" status, destructive actions

### Icon-chip tints

Used only for the icon square on stat cards, to let a metric category be recognized at a glance. Exactly four tints — do not add a fifth without removing one:

- Lavender chip (bg #E0E7FF, icon #4F46E5) — time/hours-related metrics
- Green chip (bg #DCFCE7, icon #16A34A) — people/team/active metrics
- Red chip (bg #FEE2E2, icon #EF4444) — risk/overdue/at-risk metrics
- Peach chip (bg #FFEDD5, icon #F97316) — utilization/productivity metrics

---

## Typography

Single family: **Geist Variable** (already installed via `@fontsource-variable/geist`) for both display and body — its wide weight range covers everything this theme needs, so no second typeface is introduced.

- Headline / "Welcome back" moments: 32px, bold (700), tight letter-spacing (-0.02em)
- Section heading (card titles like "MRR Trends"): 18–20px, semibold (600)
- Stat value (e.g. "$482,900"): 28–32px, bold (700)
- Body: 14px, regular (400) / medium (500) for emphasis
- Small / table cells: 13px, regular (400)
- Micro-label (eyebrows, table headers, stat labels): 11–12px, medium (500), uppercase, letter-spacing 0.06em, Text Muted color

---

## Elevation

Cards are flat by default: 1px Border, no shadow at rest. On hover (interactive cards/rows only): shadow `0 8px 24px rgba(17,24,39,0.06)` plus a 1–2px lift. The gradient insight card and primary buttons get a tinted glow on hover: `0 4px 14px rgba(79,70,229,0.28)`. Focus states use a 3px indigo ring (`0 0 0 3px rgba(79,70,229,0.15)`), never a shadow. The top bar uses a hairline bottom border rather than a shadow to separate from content.

---

## Spacing

- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
- Card padding: 24px (stat/chart/insight cards), 16px (table rows)
- Section gaps: 24px between dashboard rows
- Sidebar width: 260px fixed
- Content max width: fluid, 24–32px horizontal page padding

---

## Border Radius

- 8px: Buttons, inputs, search bar
- 12px: Table row hover backgrounds, small chips
- 16px: Stat cards, chart card, insight/CTA card
- 9999px: Avatars/initial chips, status pills, active-nav indicator dot, delta badges

---

## Components

- **App shell**: Fixed 260px white sidebar (logo + product name top, nav in the middle, account block pinned to the bottom) + white top bar (search, notification/help icons, page title) + Background-colored content area.
- **Sidebar nav item**: Icon + label, 14px medium. Active item: Primary text color, a 3px Primary vertical bar on the left edge, and a Primary Soft pill background behind the row. Inactive items: Text Secondary, no background, hover shows a faint gray background.
- **Stat card**: Surface, 16px radius, 1px Border, 24px padding. Icon chip (44px, 12px radius, one of the four tints) top-left; colored delta (e.g. "+8.2%") top-right in Success/Error with no background. Micro-label above a bold stat value below.
- **Chart card**: Surface, 16px radius. Header row: title + supporting one-line copy on the left, a segmented pill toggle (e.g. "Weekly / Monthly") on the right — inactive segment transparent, active segment white with a subtle shadow inside a Background-tinted pill track. Bars render in a muted neutral tint by default; the single relevant/current bar renders in solid Primary.
- **Insight / CTA card**: Solid gradient background (135deg, Primary → Primary Hover), white text. Uppercase eyebrow label, bold short headline, one line of supporting copy, and a solid white button with Primary text. Use at most one per screen — it's a highlight, not a layout container.
- **Table**: Surface card wrapper. Header row: Text Muted, uppercase, 12px, no background, bottom border. Body rows: 16px vertical padding, 1px divider between rows, hover shows a faint Background-tinted row highlight. Entity cells pair a circular initials chip (Border-colored background, Text Secondary initials) with a name. Status column uses a pill (Success/Warning/Error soft background + matching text color, 9999px radius). A "View All" link sits top-right of the table header in Primary.
- **Search bar**: Pill-shaped (9999px or 8px, matching the reference), Background-tinted fill, muted search icon, Text Muted placeholder. Lives in the top bar, not the sidebar.
- **Buttons**: Primary — solid Primary fill, white text, 8px radius, medium weight, tinted glow on hover. Secondary — Background/gray fill, Text Primary, 8px radius (e.g. "Export Report"). Ghost — no fill/border, Text Secondary, background darkens slightly on hover. Destructive — Error text and border, no fill until hover.
- **Status/role chips** (e.g. "Pro Admin", "Enterprise" plan tags): small pill, Border-colored background, Text Secondary text, 9999px radius, non-interactive.

---

## Do's and Don'ts

- Do use Primary indigo only for interactive/active elements (buttons, links, active nav, chart highlight) — never as decoration or a static heading color.
- Do keep the four icon-chip tints assigned consistently per metric category across the whole app — don't reassign colors per screen.
- Do keep the Background/Surface contrast (warm off-white canvas, pure white cards) — it's what gives the layered, uncluttered look.
- Do use uppercase micro-labels only for eyebrows, table headers, and stat labels — never for body copy or buttons.
- Do maintain the 4px spacing grid for all padding, margins, and gaps.
- Don't use pure black (#000000) or pure white (#FFFFFF) for text — use Text Primary/Secondary/Muted.
- Don't add more than one gradient insight/CTA card per screen.
- Don't mix the 16px "big card" radius with the 8px "control" radius on the same element type — cards stay large-radius, inputs/buttons stay small-radius.
- Don't use a shadow on a static (non-hover, non-focus) element.
- Don't introduce a second typeface — Geist covers the full weight range this theme needs.

---

## Mapping to Time Tracker screens

This reference dashboard is a SaaS analytics product; translate its patterns rather than copying its content:

- Sidebar nav: Dashboard, Time Tracking, Timesheets, Approvals, Projects, Reports, Settings (roles gate which items render).
- Dashboard stat cards: Hours Logged This Week, Active Projects, Pending Approvals, Team Utilization (in place of Revenue/Subscriptions/Churn/MRR).
- Chart card: Weekly/Monthly hours-logged trend (in place of MRR trend), with the current period's bar in solid Primary.
- Insight/CTA card (optional, manager/admin dashboards only): e.g. "3 timesheets need your review" with a "Review Now" button — not shown to individual contributors with nothing pending.
- Table: Recent Time Entries or Recent Timesheet Submissions, with Approved/Pending/Rejected status pills and initials chips for the employee.
