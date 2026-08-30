# ADR-0004: Clockify-inspired blue/near-black palette and app-wide type/spacing scale

## Status

Accepted

## Context

The original "Quiet Ledger" design system (`DESIGN.md`) deliberately chose a deep teal accent over blue, arguing that teal reads as more precise and technical than "the indigo/violet that most AI-generated SaaS tools default to." After seeing the app next to Clockify (an established time-tracking product) side by side, the user asked for the palette to actually match Clockify's visual language — a blue accent and near-black dark surfaces — rather than iterate within the teal/ink system. They also asked for the whole app to read at the same density/scale it appears to have when the browser is zoomed to ~150%, applied consistently everywhere rather than hand-tuned on a couple of pages.

This directly reverses the teal-over-blue rationale documented in `DESIGN.md`, so it's recorded here rather than silently overwritten.

## Decision

1. **Palette:** replace the teal accent (`hue 195`) with a blue accent (`hue 255`) across every color token in `src/index.css` (`:root` and `.dark`), the five hardcoded literal color values outside `index.css` (`brand-mark.tsx`, `AuthBrandPanel.tsx`), and `DESIGN.md`'s frontmatter/prose. Dark-theme neutral surfaces move from ink-slate (`oklch(0.15/0.18/0.195 ... 235)`) to near-black (`oklch(0.07/0.09/0.12 ... 240)`) to match Clockify's dark canvas. Data-viz chart tokens (`--chart-2` through `--chart-5`) and the destructive/red tokens are unaffected — this is an accent-hue change, not a full repaint.
2. **Scale:** rather than hand-editing spacing/font-size classes per component (as a first pass on just the sidebar/Dashboard did), override Tailwind v4's built-in `--spacing` (`0.25rem`→`0.28rem`) and `--text-xs`/`--text-sm`/`--text-base`/`--text-lg`/`--text-xl`/`--text-2xl` tokens once in `src/index.css`'s `@theme` block. Every `p-*`/`gap-*`/`h-*`/`w-*`/`size-*` and `text-*` utility across the whole app reads off these tokens, so this scales every built page and shared `ui/` primitive by the same ~12% in one place. `--radius` is untouched.

## Consequences

- `DESIGN.md` now documents blue as the one accent color; any future reference to "Ledger Teal" in code comments or docs is stale and should be corrected on sight.
- `.impeccable/design.json` (an apparently auto-generated snapshot of `DESIGN.md` from an external "Impeccable" integration) was **not** hand-edited to match — it will read stale until whatever process regenerates it runs again.
- Because the scale change is centralized in theme tokens, any future page or component automatically inherits the same spacing/type scale without needing its own tuning — but a handful of arbitrary bracket values (e.g. `AuthBrandPanel.tsx`'s glow blur/size, `button.tsx`'s `sm` size text, the icon-button radius clamps) don't read off these tokens and were adjusted by hand or left as documented exceptions.
- Reversing the teal-vs-blue rationale means this decision should be treated as final for now — bouncing between accent hues again would leave `DESIGN.md`'s "Do not introduce a second accent color without updating this file" rule looking unstable.
