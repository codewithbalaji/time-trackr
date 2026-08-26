---
name: Time Trackr
description: Restrained enterprise light/dark system — near-neutral ink surfaces with a single confident teal accent.
colors:
  ink:
    light: "oklch(0.16 0.006 235)"
    dark: "oklch(0.96 0.004 235)"
  surface:
    light: "oklch(1 0 0)"
    dark: "oklch(0.15 0.008 235)"
  surface-raised:
    light: "oklch(1 0 0)"
    dark: "oklch(0.195 0.008 235)"
  teal:
    light: "oklch(0.5 0.1 195)"
    dark: "oklch(0.72 0.12 195)"
  teal-foreground:
    light: "oklch(0.99 0.005 195)"
    dark: "oklch(0.15 0.02 195)"
  teal-wash:
    light: "oklch(0.945 0.02 195)"
    dark: "oklch(0.28 0.035 195)"
  neutral-secondary:
    light: "oklch(0.967 0.003 235)"
    dark: "oklch(0.26 0.01 235)"
  neutral-muted-fg:
    light: "oklch(0.5 0.008 235)"
    dark: "oklch(0.66 0.012 235)"
  border:
    light: "oklch(0.914 0.004 235)"
    dark: "oklch(1 0 0 / 10%)"
  destructive:
    light: "oklch(0.577 0.245 27.325)"
    dark: "oklch(0.704 0.191 22.216)"
typography:
  body:
    fontFamily: "'Geist Variable', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  title:
    fontFamily: "'Geist Variable', sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.375
  label:
    fontFamily: "'Geist Variable', sans-serif"
    fontSize: "0.875rem"
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
    backgroundColor: "{colors.teal}"
    textColor: "{colors.teal-foreground}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-primary-hover:
    backgroundColor: "{colors.teal}"
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

Time Trackr replaces a spreadsheet, and the interface earns that trust by behaving like a well-kept one: calm, precise, legible at a glance, nothing decorative competing with the numbers. The system is near-monochrome ink-on-paper (light) or ink-on-slate (dark) — Geist Variable throughout, flat surfaces separated by hairline borders rather than shadows — with exactly one accent color, a deep teal, spent only on the things that matter: the primary action, the active nav item, focus rings, and links. Teal was chosen over the indigo/violet that most AI-generated SaaS tools default to; it reads precise and slightly technical (closer to a stopwatch bezel or a ledger stamp than a marketing gradient) without competing with data density. The accent's restraint is deliberate: an enterprise time-tracking tool used for hours a day should recede, not perform.

Both light and dark themes are first-class tokens. The authenticated app (everything inside `ProtectedLayout`) has a working light/dark toggle — a sun/moon icon button in the sidebar footer, backed by `useTheme` (`src/hooks/use-theme.ts`) / `ThemeProvider` (`src/app/providers/ThemeProvider.tsx`) and persisted to `localStorage` — defaulting to dark on first visit, the same restrained-plus-one-accent strategy, with the teal boosted in lightness and slightly in chroma so it reads as confident against a dark ink background rather than muddy. The auth threshold (`AuthLayout`) is unaffected by that toggle and always renders dark — see the Dark Threshold Rule.

**Key Characteristics:**
- Near-neutral grayscale-with-a-cool-cast (a hint of blue undertone, hue ~235) everywhere except the one accent hue (~195, teal).
- Flat by default: no box-shadows anywhere in the system; depth comes from a `ring-1` hairline border and background-tone contrast.
- Teal is reserved for primary buttons, active/selected states, focus rings, and links — never used as a decorative fill or background wash beyond the deliberate `accent`/`sidebar-accent` hover tint.
- Geist Variable is the only typeface, carrying both UI text and headings via `--font-heading: var(--font-sans)`.

## Colors

The palette is Restrained: neutrals carry the interface, one accent carries meaning.

### Primary
- **Ledger Teal** (`oklch(0.5 0.1 195)` light / `oklch(0.72 0.12 195)` dark): primary buttons, focus rings, active sidebar/nav item, links, selected states. This is the only saturated color in the system — used sparingly, never as a large background fill.

### Neutral
- **Ink** (`oklch(0.16 0.006 235)` light / `oklch(0.96 0.004 235)` dark): body text, headings, primary foreground on light surfaces.
- **Paper / Slate** (`oklch(1 0 0)` light / `oklch(0.15 0.008 235)` dark): page background.
- **Card Surface** (`oklch(1 0 0)` light / `oklch(0.195 0.008 235)` dark): cards and popovers sit one step lighter than the page background in dark mode (`0.195` vs `0.15`) to read as a raised layer without a shadow; in light mode both stay white and separation comes entirely from the border.
- **Secondary / Muted** (`oklch(0.967 0.003 235)` light / `oklch(0.26 0.01 235)` dark): secondary buttons, muted backgrounds, disabled fills.
- **Muted Foreground** (`oklch(0.5 0.008 235)` light / `oklch(0.66 0.012 235)` dark): help text, placeholders, timestamps, secondary labels.
- **Border** (`oklch(0.914 0.004 235)` light / `oklch(1 0 0 / 10%)` dark): the sole depth cue between surfaces — cards, inputs, dividers.

### Named Rules
**The One Accent Rule.** Teal appears only on the primary action, the active/selected state, focus rings, and links. It never fills a card, a full section background, or a large decorative area — its rarity is what makes it legible as "this matters" in a data-dense screen.

**The No-Shadow Rule.** Every elevation cue is a `ring-1`/`border` hairline plus a one-step background-tone shift, never a `box-shadow`. This holds in both themes.

## Typography

**Body/UI Font:** Geist Variable (with `sans-serif` fallback)
**Heading Font:** Geist Variable (`--font-heading` aliases `--font-sans` — no separate display face)

**Character:** A single variable-weight grotesque carries the whole system; hierarchy comes from weight and size steps, not from mixing faces. Appropriate for an Operate-mode tool where scanability outranks expression.

### Hierarchy
- **Title** (500, 1rem/16px, leading-snug): card titles, section headers.
- **Body** (400, 0.875rem/14px, 1.4 line-height): form values, table cells, paragraph copy.
- **Label** (500, 0.875rem/14px): form labels, field legends.
- **Small / Description** (400, 0.875rem/14px, muted-foreground): helper text, timestamps, descriptions under titles.

## Layout

`AuthLayout` forces its own `dark` class independent of any toggle, so the auth threshold always renders the dark token set — see the Named Rule below. The authenticated shell (`ProtectedLayout`) defaults to dark but wraps itself in a `ThemeProvider` (`src/app/providers/ThemeProvider.tsx`) and applies `dark` conditionally based on the user's toggle choice, scoped to its own subtree only.

**Auth (`AuthLayout`):** split layout at `lg` and above — a fixed-width (`42%`, capped `max-w-xl`) brand panel on the left (`AuthBrandPanel`), and a right column that centers a `max-w-sm` card. Below `lg` the brand panel is hidden entirely and the right column becomes the full-width page.

**Authenticated shell (`ProtectedLayout`):** a fixed-width (`18rem`/`w-72`) sidebar plus a fluid main content column. At `lg`+ the sidebar is a permanent fixed column; below `lg` it collapses off-canvas behind a hamburger trigger in a slim top bar, sliding in as an overlay drawer (backdrop click or Escape to close).

Spacing inside forms and cards runs on a `gap-4` (1rem) rhythm between fields and a `gap-1.5`–`gap-0.5` rhythm within a single label/input/error group.

### Named Rule
**The Dark Threshold Rule.** `AuthLayout` carries its own `dark` class independent of the light/dark toggle wired up in `ProtectedLayout`, so it stays a fixed dark "threshold" regardless of the user's chosen theme. Do not remove that class or make it toggle-aware — the authenticated app follows the toggle; auth never does.

## Elevation & Depth

Flat by design — no `box-shadow` anywhere in the codebase. Depth is conveyed by two devices only: a `ring-1 ring-foreground/10` hairline around cards, and a one-step background-tone shift between the page and a raised surface (most visible in dark mode, where cards sit at `oklch(0.195 ...)` against a `oklch(0.15 ...)` page; in light mode both are pure white and the ring alone carries the separation).

## Shapes

Corners run on a single `--radius: 0.625rem` base, scaled via Tailwind's radius tokens (`--radius-sm` through `--radius-4xl`, each a multiple of the base). Cards and their first/last images use `rounded-xl`; buttons and inputs use `rounded-lg`; the smallest icon-button sizes clamp to `min(var(--radius-md),10-12px)` so they don't look over-rounded at small scale. No hard corners, no pill shapes — one consistent moderate-radius language throughout.

## Components

### Buttons
- **Shape:** `rounded-lg` (~8px), scales down slightly for `xs`/`sm` sizes.
- **Primary:** Ledger Teal background, teal-foreground text, `hover:bg-primary/80`. Reserved for the one primary action per view (e.g. "Sign in").
- **Outline:** transparent/background fill, `border-border`, hover fills `bg-muted`. Default choice for secondary actions.
- **Secondary:** neutral secondary fill, subtle `color-mix` hover darken — no accent color.
- **Ghost:** no fill or border at rest; `hover:bg-muted`.
- **Destructive:** `bg-destructive/10` at rest (not a solid fill), `text-destructive`, darkens on hover — deliberately quieter than a solid red button so destructive actions don't visually dominate a form.
- **Link:** teal text, underline on hover only.
- **Focus:** `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` — the teal ring is the only focus treatment in the system, shared by buttons and inputs.

### Cards / Containers
- **Corner Style:** `rounded-xl`.
- **Background:** Card Surface token (see Colors).
- **Shadow Strategy:** none — see Elevation & Depth.
- **Border:** `ring-1 ring-foreground/10` in place of a shadow.
- **Internal Padding:** `--card-spacing: 1rem` (0.75rem for the `sm` card size variant).

### Inputs / Fields
- **Style:** `rounded-lg`, `border-input`, transparent background (`bg-input/30` in dark mode), `h-8`.
- **Focus:** same teal ring treatment as buttons (`focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50`).
- **Error / Disabled:** invalid fields get `border-destructive` + a destructive-tinted ring via `aria-invalid`; disabled fields drop opacity and gain a faint `bg-input/50` fill.
- **Field labels/errors:** `FieldLabel`/`FormLabel` at label weight; `FieldError`/`FormMessage` in `text-destructive`, deduplicated when multiple Zod errors share a message.

### Navigation (Sidebar)
`ProtectedLayout`'s sidebar (see Layout): `w-72`, `bg-sidebar`, hairline `border-r border-sidebar-border`, no shadow. Top-to-bottom: `BrandMark` (see below) in a `h-14` header row; a nav list where the active route gets `bg-sidebar-accent text-sidebar-accent-foreground` (teal-tinted) and inactive items are `sidebar-foreground/80` with a quieter hover fill; a hairline `Separator`; a footer row with a teal initials avatar, name/email, and a sign-out icon button. Nav items for product areas not built yet (everything except Dashboard, as of Phase 1) render as non-interactive rows at `sidebar-foreground/40` with a small bordered "Soon" pill instead of a working link — the IA is shown honestly without linking to pages that don't exist. Below `lg` the sidebar becomes an off-canvas overlay drawer (`w-72`, black/60 backdrop, closes on backdrop click or Escape) triggered by a hamburger in a slim top bar that carries the same `BrandMark`.

### Brand Mark
`BrandMark` (`src/components/brand-mark.tsx`) — the small, legible, everywhere-else brand expression: a crisp custom-drawn clock glyph (single-stroke SVG, `currentColor` in the primary teal) plus "Time Trackr" set in Geist. Used in the sidebar header and the mobile top bar. Deliberately not the glowing logo image — at small sizes the image's internal letterboxing makes it unreadable (see Auth Brand Panel).

### Auth Brand Panel (signature component)
The left panel on `AuthLayout` (`lg`+ only, part of the dark auth threshold — see Layout). A `justify-between` column over two decorative background layers: a soft blurred teal glow (`~18%` opacity, `110px` blur) for atmosphere, and a full-bleed "ledger rows" motif — thin horizontal ruled hairlines plus a column of pill-shaped bars of varying width at low opacity, two tinted teal to read as selected/active entries. In front, top to bottom: the full glowing product logo at hero size (rendered with `mix-blend-mode: screen` so its black backdrop drops out against the panel and only the glow/wordmark register), then a headline and supporting line pulled from product truth, anchored to the bottom. This is the one place in the system where teal rides inside a large dark field and where the product's own saturated glow logo appears at full size — bounded to this panel, never extended to app content or reused at small size (use `BrandMark` instead). Built as a slot: swap `LedgerRows`/`Glow` for a full-bleed photograph (keep a bottom gradient for legibility) once real imagery exists, per the comment in `AuthBrandPanel.tsx`.

### Empty States
`DashboardPage`'s pattern for a not-yet-populated screen: a dashed-border (`border-dashed border-border`) rounded panel, generous vertical padding, a small icon in an `bg-accent` chip, a one-line label, and an honest one-line explanation of when real content will appear. No fabricated numbers or sample data — an empty state says "not built yet" or "no data yet" plainly rather than simulating activity.

## Do's and Don'ts

### Do:
- **Do** reserve teal for exactly one thing per view: the primary action, the active nav state, a focus ring, or a link — never more than one saturated color on screen at once.
- **Do** use the hairline-ring + tone-shift pattern for any new raised surface (dropdowns, dialogs, popovers) instead of adding a shadow.
- **Do** keep both light and dark themes updated together — every token added to `:root` needs a `.dark` counterpart tuned for contrast, not a straight copy.
- **Do** use `bg-destructive/10` (not a solid destructive fill) for the default destructive button treatment; reserve a solid destructive fill for higher-stakes confirmations only if one is introduced later.

### Don't:
- **Don't** introduce a second accent color (no blue-for-info, green-for-success, orange-for-warning family) without deliberately updating this file — status color scoping for timesheet/approval states (Phase 7-8) should be decided explicitly, not accreted button-by-button.
- **Don't** add `box-shadow` anywhere; it breaks the flat/hairline elevation model this system commits to.
- **Don't** mix in a second typeface for headings or numerals; Geist Variable's weight axis carries the whole hierarchy.
- **Don't** round corners past `rounded-xl` (cards) or below `rounded-lg` (buttons/inputs) without a documented reason — the moderate, consistent radius is part of the "quiet ledger" restraint.
