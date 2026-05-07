# Design System: Baywoods Store

## 1. Visual Theme & Atmosphere

Editorial restraint with a streetwear edge. The brand sits between a luxury fashion house and a Nairobi youth label — sparse, unhurried, confident. Surfaces are warm off-white (never pure white), text is near-black ink rather than true black. The forest green accent reads as premium but grounded. Dark sections use `neutral-950` charcoal (not black) so images breathe. The overall density is low — generous whitespace, precise type, very few decorative elements.

Mood keywords: **Editorial · Sparse · Warm · Precise · Streetwear-luxury**

---

## 2. Color Palette & Roles

| Name | Hex | Role |
|---|---|---|
| Warm Cream | `#FCFCF8` | Page background, card surfaces, input backgrounds |
| Charcoal Ink | `#111827` | Primary text, borders, button fills, dark UI elements |
| Warm Beige | `#F4F4EF` | Section backgrounds, alternating rows, ticker strip |
| Forest Green | `#2D6A4F` | Primary accent — CTAs, active states, kicker text, links |
| Deep Forest | `#1B4332` | Hover state for green CTAs, dark accent moments |
| Sage Light | `#52B788` | Light accent — hero kicker text on dark bg, success states |
| Washed Sage | `#D8F3DC` | Tinted green surfaces — info banners, discount badges |
| Pebble Stone | `#E1E4E8` | Borders, dividers, input strokes, filter chips |
| Slate Muted | `#64748B` | Secondary text, metadata, labels |
| Alert Red | `#C0392B` | Destructive actions, sale badges, error states |
| Near-Black Hero | `#0A0A0A` | Hero section background (`neutral-950`) |

---

## 3. Typography Rules

**Display / Headlines:** Cormorant Garamond (serif) — used exclusively for section titles, hero headings, and editorial moments. Always in regular weight (400–500), tight leading (`0.95`–`1.1`). Never bold. Sizes: `5rem` on mobile up to `7rem` on desktop for hero.

**UI / Body:** Inter (sans-serif) — used for all functional text: navigation, buttons, labels, body copy, metadata. Sizes range from `10px` tracking-heavy uppercase labels to `1.125rem` body prose.

**Kicker text:** `10px`, `font-semibold`, `tracking-[0.22em]`, all caps. Forest green on light backgrounds, `forest-light` (`#52B788`) on dark backgrounds. Used to introduce sections.

**Labels:** `12px`, `font-medium`, `tracking-widest`, uppercase, muted color. Used above form inputs and section sub-labels.

**Letter spacing philosophy:** UI elements push tracking wide (`0.15em`–`0.25em`) for small caps. Display type uses no extra tracking. The contrast between tight display serifs and wide-tracked UI sans is the brand's typographic signature.

---

## 4. Component Stylings

**Buttons:** Sharp, squared-off edges — no border radius on any button. Primary fills with Forest Green (`#2D6A4F`) text-white, hover to Deep Forest (`#1B4332`). Outline variant: `1px` Ink border, ink text, hover fills solid ink with white text. Ghost variant: no border, hover shows a stone/50 background wash. Height is consistent: `h-12` for large CTAs, `h-9`–`h-10` for medium controls. Active state scales to `0.98`.

**Cards / Containers:** No border radius on product cards. Image containers use `overflow-hidden` with no rounding — sharp crop edges. Container backgrounds use Warm Cream (`#FCFCF8`) with a `1px` Pebble Stone (`#E1E4E8`) border. No drop shadows — elevation is communicated through background contrast, not shadows.

**Inputs / Forms:** Full-width, sharp corners (no border radius). `1px` Pebble Stone border at rest, transitions to Ink on focus. Background is Warm Cream. Placeholder text in Slate Muted. Font size `14px` Inter. No shadow, no glow on focus.

**Tags / Badges:** `10px`, Inter, `font-semibold`, `tracking-[0.15em]`, uppercase. Sharp corners. Sale badge in Alert Red with white text.

---

## 5. Layout Principles

**Grid philosophy:** Asymmetric where possible. Hero uses `[0.9fr 1.1fr]` — the image column intentionally wider than the text column. Section grids mix `3-col` and `4-col` depending on content type. Avoid pure 50/50 splits.

**Spacing scale:** Section padding `pt-24`/`pb-24` at minimum. Inner section padding `py-8`. Component gap default `gap-10` on desktop, `gap-6` on tablet. Tight inner spacing within cards: `gap-3`–`gap-4`.

**Container:** Responsive horizontal padding — `px-4 → px-6 → px-10 → px-16` across breakpoints (`sm`, `lg`, `xl`). No fixed max-width class — content breathes to the viewport edge.

**Whitespace intent:** Empty space is load-bearing. A section with one headline and a single CTA is not sparse, it's deliberate. Resist adding visual noise to fill gaps.

**Ticker / marquee:** Appears at section transitions — always `bg-beige` on dark-to-light transitions. Forest green bullet dots as separators. `10px` uppercase tracking. Animation: `30s linear infinite`.

**Motion:** Stagger-in on page load: elements enter with `opacity: 0 → 1` + `y: 12–18px → 0`, delays in `0.05s` increments. Duration `0.45s`–`0.65s`. Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (out-expo). Image crossfade: `0.45s` with subtle `scale: 1.02 → 1` zoom. No bounce, no spring on page-level transitions.
