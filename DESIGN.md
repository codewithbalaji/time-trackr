---
name: Time Trackr
description: Restrained enterprise light/dark system — near-black surfaces with a single confident blue accent.
colors:
  ink:
    light: "oklch(0.16 0.006 255)"
    dark: "oklch(0.96 0.004 240)"
  surface:
    light: "oklch(1 0 0)"
    dark: "oklch(0.09 0.004 240)"
  surface-raised:
    light: "oklch(1 0 0)"
    dark: "oklch(0.12 0.006 240)"
  blue:
    light: "oklch(0.58 0.18 255)"
    dark: "oklch(0.7 0.16 255)"
  blue-foreground:
    light: "oklch(0.99 0.005 255)"
    dark: "oklch(0.12 0.02 255)"
  blue-wash:
    light: "oklch(0.94 0.03 255)"
    dark: "oklch(0.24 0.04 255)"
  neutral-secondary:
    light: "oklch(0.967 0.003 255)"
    dark: "oklch(0.2 0.008 240)"
  neutral-muted-fg:
    light: "oklch(0.5 0.008 255)"
    dark: "oklch(0.64 0.012 240)"
  border:
    light: "oklch(0.914 0.004 255)"
    dark: "oklch(1 0 0 / 10%)"
  destructive:
    light: "oklch(0.577 0.245 27.325)"
    dark: "oklch(0.704 0.191 22.216)"
typography:
  body:
    fontFamily: "'Geist Variable', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.4
  title:
    fontFamily: "'Geist Variable', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.375
  label:
    fontFamily: "'Geist Variable', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
spacing:
  xs: "0.375rem"
  sm: "0.625rem"
  md: "1rem"
  lg: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.blue-foreground}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-primary-hover:
    backgroundColor: "{colors.blue}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "1rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "2rem"
---

# Design System: Time Trackr

## Overview

**Creative North Star: "The Quiet Ledger"**

Time Trackr replaces a spreadsheet, and the interface earns that trust by behaving like a well-kept one: calm, precise, legible at a glance, nothing decorative competing with the numbers. The system is near-monochrome ink-on-paper (light) or ink-on-near-black (dark) — Geist Variable throughout, flat surfaces separated by hairline borders rather than shadows — with exactly one accent color, a confident blue, spent only on the things that matter: the primary action, the active nav item, focus rings, and links. Blue was chosen deliberately in the same register as established time-tracking tools (Clockify among them) — it reads as familiar and trustworthy for a tool people open every working hour, rather than reaching for novelty. The accent's restraint is what keeps it from feeling generic: an enterprise time-tracking tool used for hours a day should recede, not perform.

Both light and dark themes are first-class tokens. The authenticated app (everything inside `ProtectedLayout`) has a working light/dark toggle — a sun/moon icon button in the sidebar footer, backed by `useTheme` (`src/hooks/use-theme.ts`) / `ThemeProvider` (`src/app/providers/ThemeProvider.tsx`) and persisted to `localStorage` — defaulting to dark on first visit, the same restrained-plus-one-accent strategy, with the blue boosted in lightness and slightly in chroma so it reads as confident against a near-black background rather than muddy. The auth threshold (`AuthLayout`) is unaffected by that toggle and always renders dark — see the Dark Threshold Rule.

**Key Characteristics:**
- Near-neutral grayscale-with-a-cool-cast (a hint of blue undertone, hue ~255) everywhere except the one accent hue (~255, blue) — neutrals and accent now share a hue family since the accent itself is blue.
- Flat by default: no box-shadows anywhere in the system; depth comes from a `ring-1` hairline border and background-tone contrast.
- Blue is reserved for primary buttons, active/selected states, focus rings, and links — never used as a decorative fill or background wash beyond the deliberate `accent`/`sidebar-accent` hover tint.
- Geist Variable is the only typeface, carrying both UI text and headings via `--font-heading: var(--font-sans)`.

## Colors

The palette is Restrained: neutrals carry the interface, one accent carries meaning.

### Primary
- **Ledger Blue** (`oklch(0.58 0.18 255)` light / `oklch(0.7 0.16 255)` dark): primary buttons, focus rings, active sidebar/nav item, links, selected states. This is the only saturated color in the system — used sparingly, never as a large background fill.

### Neutral
- **Ink** (`oklch(0.16 0.006 255)` light / `oklch(0.96 0.004 240)` dark): body text, headings, primary foreground on light surfaces.
- **Paper / Near-black** (`oklch(1 0 0)` light / `oklch(0.09 0.004 240)` dark): page background.
- **Card Surface** (`oklch(1 0 0)` light / `oklch(0.12 0.006 240)` dark): cards and popovers sit one step lighter than the page background in dark mode (`0.12` vs `0.09`) to read as a raised layer without a shadow; in light mode both stay white and separation comes entirely from the border.
- **Secondary / Muted** (`oklch(0.967 0.003 255)` light / `oklch(0.2 0.008 240)` dark): secondary buttons, muted backgrounds, disabled fills.
- **Muted Foreground** (`oklch(0.5 0.008 255)` light / `oklch(0.64 0.012 240)` dark): help text, placeholders, timestamps, secondary labels.
- **Border** (`oklch(0.914 0.004 255)` light / `oklch(1 0 0 / 10%)` dark): the sole depth cue between surfaces — cards, inputs, dividers.

### Named Rules
**The One Accent Rule.** Blue appears only on the primary action, the active/selected state, focus rings, and links. It never fills a card, a full section background, or a large decorative area — its rarity is what makes it legible as "this matters" in a data-dense screen.

**The No-Shadow Rule.** Every elevation cue is a `ring-1`/`border` hairline plus a one-step background-tone shift, never a `box-shadow`. This holds in both themes.

## Typography

**Body/UI Font:** Geist Variable (with `sans-serif` fallback)
**Heading Font:** Geist Variable (`--font-heading` aliases `--font-sans` — no separate display face)

**Character:** A single variable-weight grotesque carries the whole system; hierarchy comes from weight and size steps, not from mixing faces. Appropriate for an Operate-mode tool where scanability outranks expression.

### Hierarchy
- **Title** (500, 1.125rem/18px, leading-snug): card titles, section headers.
- **Body** (400, 0.9375rem/15px, 1.4 line-height): form values, table cells, paragraph copy.
- **Label** (500, 0.9375rem/15px): form labels, field legends.
- **Small / Description** (400, 0.9375rem/15px, muted-foreground): helper text, timestamps, descriptions under titles.

## Layout

`AuthLayout` forces its own `dark` class independent of any toggle, so the auth threshold always renders the dark token set — see the Named Rule below. The authenticated shell (`ProtectedLayout`) defaults to dark but wraps itself in a `ThemeProvider` (`src/app/providers/ThemeProvider.tsx`) and applies `dark` conditionally based on the user's toggle choice, scoped to its own subtree only.

**Auth (`AuthLayout`):** split layout at `lg` and above — a fixed-width (`42%`, capped `max-w-xl`) brand panel on the left (`AuthBrandPanel`), and a right column that centers a `max-w-sm` card. Below `lg` the brand panel is hidden entirely and the right column becomes the full-width page.

**Authenticated shell (`ProtectedLayout`):** a fixed-width (`18rem`/`w-72`) sidebar plus a fluid main content column. At `lg`+ the sidebar is a permanent fixed column; below `lg` it collapses off-canvas behind a hamburger trigger in a slim top bar, sliding in as an overlay drawer (backdrop click or Escape to close).

Spacing inside forms and cards runs on a `gap-4` (1rem) rhythm between fields and a `gap-1.5`–`gap-0.5` rhythm within a single label/input/error group.

### Named Rule
**The Dark Threshold Rule.** `AuthLayout` carries its own `dark` class independent of the light/dark toggle wired up in `ProtectedLayout`, so it stays a fixed dark "threshold" regardless of the user's chosen theme. Do not remove that class or make it toggle-aware — the authenticated app follows the toggle; auth never does.

## Elevation & Depth

Flat by design — no `box-shadow` anywhere in the codebase. Depth is conveyed by two devices only: a `ring-1 ring-foreground/10` hairline around cards, and a one-step background-tone shift between the page and a raised surface (most visible in dark mode, where cards sit at `oklch(0.12 ...)` against a `oklch(0.09 ...)` near-black page; in light mode both are pure white and the ring alone carries the separation).

## Shapes

Corners run on a single `--radius: 0.625rem` base, scaled via Tailwind's radius tokens (`--radius-sm` through `--radius-4xl`, each a multiple of the base). Cards and their first/last images use `rounded-xl`; buttons and inputs use `rounded-lg`; the smallest icon-button sizes clamp to `min(var(--radius-md),10-12px)` so they don't look over-rounded at small scale. No hard corners, no pill shapes — one consistent moderate-radius language throughout.

## Components

### Buttons
- **Shape:** `rounded-lg` (~8px), scales down slightly for `xs`/`sm` sizes.
- **Primary:** Ledger Blue background, blue-foreground text, `hover:bg-primary/80`. Reserved for the one primary action per view (e.g. "Sign in").
- **Outline:** transparent/background fill, `border-border`, hover fills `bg-muted`. Default choice for secondary actions.
- **Secondary:** neutral secondary fill, subtle `color-mix` hover darken — no accent color.
- **Ghost:** no fill or border at rest; `hover:bg-muted`.
- **Destructive:** `bg-destructive/10` at rest (not a solid fill), `text-destructive`, darkens on hover — deliberately quieter than a solid red button so destructive actions don't visually dominate a form.
- **Link:** blue text, underline on hover only.
- **Focus:** `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` — the blue ring is the only focus treatment in the system, shared by buttons and inputs.

### Cards / Containers
- **Corner Style:** `rounded-xl`.
- **Background:** Card Surface token (see Colors).
- **Shadow Strategy:** none — see Elevation & Depth.
- **Border:** `ring-1 ring-foreground/10` in place of a shadow.
- **Internal Padding:** `--card-spacing: 1rem` (0.75rem for the `sm` card size variant).

### Inputs / Fields
- **Style:** `rounded-lg`, `border-input`, transparent background (`bg-input/30` in dark mode), `h-8`.
- **Focus:** same blue ring treatment as buttons (`focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`).
- **Error / Disabled:** invalid fields get `border-destructive` + a destructive-tinted ring via `aria-invalid`; disabled fields drop opacity and gain a faint `bg-input/50` fill.
- **Field labels/errors:** `FieldLabel`/`FormLabel` at label weight; `FieldError`/`FormMessage` in `text-destructive`, deduplicated when multiple Zod errors share a message.

### Navigation (Sidebar)
`ProtectedLayout`'s sidebar (see Layout): `w-72`, `bg-sidebar`, hairline `border-r border-sidebar-border`, no shadow. Top-to-bottom: `BrandMark` (see below) in a `h-14` header row; a nav list where the active route gets `bg-sidebar-accent text-sidebar-accent-foreground` (blue-tinted) and inactive items are `sidebar-foreground/80` with a quieter hover fill; a hairline `Separator`; a footer row with a blue initials avatar, name/email, and a sign-out icon button. Nav items for product areas not built yet (everything except Dashboard, as of Phase 1) render as non-interactive rows at `sidebar-foreground/40` with a small bordered "Soon" pill instead of a working link — the IA is shown honestly without linking to pages that don't exist. Below `lg` the sidebar becomes an off-canvas overlay drawer (`w-72`, black/60 backdrop, closes on backdrop click or Escape) triggered by a hamburger in a slim top bar that carries the same `BrandMark`.

### Brand Mark
`BrandMark` (`src/components/brand-mark.tsx`) — the small, everywhere-else brand expression: the real product logo, not a text wordmark. Used in the sidebar header and the mobile top bar. It ships as two theme-matched raster variants — `src/assets/timetrackr-black.png` (dark wordmark, light theme) and `src/assets/TimeTrackr-white.png` (light wordmark, dark theme) — and `BrandMark` reads `useTheme()` to pick the matching one, so no background chip is needed to keep it legible across themes.

### Auth Brand Panel (signature component)
The left panel on `AuthLayout` (`lg`+ only, part of the dark auth threshold — see Layout). A `justify-between` column over two decorative background layers: a soft blurred blue glow (`~18%` opacity, `124px` blur) for atmosphere, and a full-bleed "ledger rows" motif — thin horizontal ruled hairlines plus a column of pill-shaped bars of varying width at low opacity, two tinted blue to read as selected/active entries. In front, top to bottom: the full glowing product logo at hero size (rendered with `mix-blend-mode: screen` so its black backdrop drops out against the panel and only the glow/wordmark register), then a headline and supporting line pulled from product truth, anchored to the bottom. This is the one place in the system where blue rides inside a large dark field and where the product's own saturated glow logo appears at full size — bounded to this panel, never extended to app content or reused at small size (use `BrandMark` instead). Built as a slot: swap `LedgerRows`/`Glow` for a full-bleed photograph (keep a bottom gradient for legibility) once real imagery exists, per the comment in `AuthBrandPanel.tsx`.

### Charts
Recharts-based (bar, donut) reporting charts, introduced in Phase 9's Dashboard and Reports pages (`src/features/reports/components/HoursBarChart.tsx`, `ProjectDonutChart.tsx`). **The One Accent Rule, extended to series color:** a chart never uses `--chart-2` through `--chart-5` (those remain a reserved, unused rainbow token set) or any other multi-hue series palette — every chart series is Ledger Blue at varying opacity, built with `color-mix(in oklab, var(--color-primary) <percent>%, transparent)` so it tracks the current light/dark theme automatically rather than hard-coding oklch values per slice. The bar chart is single-series (hours per day) and needs no palette at all. Tooltips follow the hairline-ring pattern, not a shadow: `border: 1px solid var(--border)`, `box-shadow: none`, background from `--popover`. Axis lines and tick text use `--border`/`--muted-foreground`, never accent color.

### Empty States
`DashboardPage`'s pattern for a not-yet-populated screen: a dashed-border (`border-dashed border-border`) rounded panel, generous vertical padding, a small icon in an `bg-accent` chip, a one-line label, and an honest one-line explanation of when real content will appear. No fabricated numbers or sample data — an empty state says "not built yet" or "no data yet" plainly rather than simulating activity.

## Do's and Don'ts

### Do:
- **Do** reserve blue for exactly one thing per view: the primary action, the active nav state, a focus ring, or a link — never more than one saturated color on screen at once.
- **Do** use the hairline-ring + tone-shift pattern for any new raised surface (dropdowns, dialogs, popovers) instead of adding a shadow.
- **Do** keep both light and dark themes updated together — every token added to `:root` needs a `.dark` counterpart tuned for contrast, not a straight copy.
- **Do** use `bg-destructive/10` (not a solid destructive fill) for the default destructive button treatment; reserve a solid destructive fill for higher-stakes confirmations only if one is introduced later.

### Don't:
- **Don't** introduce a second accent color (no separate info/success/warning family) without deliberately updating this file — status color scoping for timesheet/approval states (Phase 7-8) should be decided explicitly, not accreted button-by-button.
- **Don't** add `box-shadow` anywhere; it breaks the flat/hairline elevation model this system commits to.
- **Don't** mix in a second typeface for headings or numerals; Geist Variable's weight axis carries the whole hierarchy.
- **Don't** round corners past `rounded-xl` (cards) or below `rounded-lg` (buttons/inputs) without a documented reason — the moderate, consistent radius is part of the "quiet ledger" restraint.
