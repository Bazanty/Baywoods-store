# Design System: Baywoods Store

## 1. Visual Theme & Atmosphere

Restrained, editorial streetwear retail. The dominant mood is **quiet confidence** — warm natural surfaces (cream, beige) against near-black ink text, punctuated by a single forest-green accent that reads as premium but grounded. The hero inverts this: deep charcoal-black canvas with white type, acting as a high-contrast stage for product imagery before the rest of the store returns to its light, airy base.

Density is deliberately low. Generous whitespace signals quality without ostentation. Typography does the heavy lifting — a large serif logotype and section titles carry weight, while compact sans-serif metadata (10px, wide-tracked uppercase) creates rhythm without noise. The overall impression is a Nairobi-grown edit with the visual restraint of a European boutique.

Dark mode inverts the palette to near-black backgrounds with reversed cream/ink roles — the forest accent shifts to its lighter sage variant for readability.

---

## 2. Color Palette & Roles

| Name | Hex | Role |
|---|---|---|
| Warm Parchment White | `#FCFCF8` | Primary surface — body, pages, mega menu panels, inputs |
| Aged Linen | `#F4F4EF` | Secondary surface — section backgrounds, mobile search insets |
| Pressed Linen | `#E8ECE6` | Product image placeholder wells, deep beige fills |
| Near-Black Ink | `#111827` | Primary text, logo, footer background, btn-outline hover fill |
| Deep Forest Green | `#2D6A4F` | Brand primary — CTAs, "New" badges, cart counter dot, text selection |
| Dark Forest | `#1B4332` | Forest hover / pressed state |
| Pale Sage | `#52B788` | Light forest — hero kickers on dark, dark-mode forest default |
| Whisper Green | `#D8F3DC` | Forest background wash — subtle highlight tints |
| Cool Slate Border | `#E1E4E8` | UI chrome — borders, dividers, scrollbar track |
| Pale Slate | `#EEF1F3` | Lighter border contexts, nested container fills |
| Slate Grey | `#64748B` | Metadata, labels, secondary text, placeholder copy |
| Worn Red | `#C0392B` | Sale pricing, danger states, error messages, "Sale" badges |
| Cobalt Blue | `#2563EB` | Payment/Stripe accent only — not part of general UI palette |

**Dark mode overrides (`.dark`):**
Cream → `#0E0E0C`, Ink → `#EDE3E5`, Beige → `#161614`, Forest → `#52B788`, Stone → `#2A2927`.

---

## 3. Typography Rules

**Display face — Cormorant Garamond (serif)**
Used exclusively for brand identity moments: the `BAYWOODS` wordmark, section titles, hero `<h1>`, and the footer newsletter headline. Applied at compressed leading (0.95–1.1) for editorial density. Weights loaded: 300, 400, 500, 600, 700.

- Hero brand name: 5–7rem, `leading-[0.95]`, white on dark
- Section titles (`section-title` class): 2.75–4rem, ink on cream
- Footer brand / newsletter: 2rem, white

**Body face — Inter (sans-serif)**
All UI controls, product names, descriptions, nav links, labels, badges, and buttons. Weights:
- `font-medium` (500): navigation, product names, buttons
- `font-semibold` (600): prices, stat numbers, submit actions
- `font-normal` (400): body paragraphs, description copy

**Custom size scale:**
- `display-2xl`: 5rem / 1.0 lh
- `display-xl`: 4rem / 1.05 lh
- `display-lg`: 2.75rem / 1.1 lh — standard section title ceiling

**Label / kicker convention**
Repeating pattern throughout: `10px`, `font-semibold`, `uppercase`, `tracking-[0.18em]–[0.22em]`. Used for section kickers (in Forest Pine), column headers (Slate Grey), and meta labels above headings. This handles information hierarchy without increasing type size.

---

## 4. Component Stylings

**Buttons**
Sharp, squared-off edges everywhere — zero border-radius on all variants without exception. Three variants:
- **Primary** (`btn-primary`): Forest Pine fill (`#2D6A4F`), white text, darkens to `#1B4332` on hover. `text-sm px-6 py-3 tracking-wide`. Scales to `0.98` on active press.
- **Outline** (`btn-outline`): 1px ink border, ink text, fills to ink on hover inverting text to white. Same sizing.
- **Ghost** (`btn-ghost`): No border, Slate Stone tint (`stone/50`) on hover. Reduced padding `px-4 py-2`.
- **Danger**: Worn Red (`#C0392B`) fill, white text.

On dark backgrounds (hero): white fill with near-black text + a ghost variant with `border-white/30`, becomes `bg-white/10` on hover.

**Product Cards**
No border, no shadow. Square image well (`aspect-square`) using Pressed Linen (`#E8ECE6`) as the placeholder. On hover: secondary image crossfades in at `opacity-0 scale-[1.04]` → full via `ease-out-expo` over 500ms. Primary image exits with the same scale-down.

Overlays on hover:
- Wishlist button: `bg-white/90 backdrop-blur-sm`, 32×32px, zero radius, top-right corner
- Quick-add bar: slides up from `y: 100%` over 250ms, `bg-neutral-900` → Forest on hover, zero radius
- Stock warning: amber-500 background, fixed `bottom-10 left-3`

Info below image: 10px uppercase muted category → 14px medium ink product name → 14px semibold price → 12px circular color swatches (`rounded-full` — the only circular element outside of the cart badge).

**Inputs / Forms**
Zero border-radius. `input-base`: cream background, `border-stone`, ink text. Border transitions to full ink on focus. No outline ring. Placeholder in Slate Grey. Padding `px-4 py-3`. Labels use the 10px uppercase tracking convention above.

On dark surfaces (footer newsletter): `bg-white/10 border-white/20`, white text, `placeholder:text-white/40`.

**Badges**
Completely sharp-cornered inline labels. `text-[10px] font-semibold tracking-[0.12em] uppercase px-2 py-0.5`. Variants: `bg-forest text-white` (New), `bg-danger text-white` (Sale), `bg-ink text-white` (Hot), `bg-amber-500 text-white` (Low Stock), `bg-stone text-muted` (Sold Out).

**Navigation**
Fixed header, transparent at scroll-top. On scroll: transitions to `bg-beige/95 backdrop-blur-sm` with a single-pixel stone hairline shadow (`shadow-[0_1px_0_0_rgb(var(--c-stone))]`). Logo: Cormorant Garamond, `text-xl lg:text-2xl`, semibold, wider tracking. Nav links: Inter medium, ink/80, hover to full ink.

Mega menu: cream panel with stone border, `shadow-xl`, 3-column grid, muted uppercase headers. Zero border-radius. Fades and rises on hover (`y: 8→0, opacity: 0→1`).

Cart badge: Forest Pine `rounded-full` circle, `w-4 h-4`, `text-[10px]`, spring-animates (`scale: 0.6→1`) on count change. Only circular badge in the system.

---

## 5. Layout Principles

**Container system**
`.container-px`: `px-4 → px-6 → px-10 → px-16` across sm/lg/xl. No max-width cap — sections stretch to viewport width and self-limit through internal grid logic.

**Asymmetry by default**
Section headers left-align with a kicker above and "View all" floated right. The hero uses an intentionally imbalanced two-column split (`grid-cols-[0.9fr_1.1fr]`) — copy panel narrower, image grid wider. Avoid centered symmetrical layouts.

**Section rhythm**
Sections breathe with `mt-16 lg:mt-20` between them. Interior product grids use `gap-3` (12px). Mega menu columns use `gap-8`. The hero and ticker treat full viewport width as canvas before contained sections begin below.

**Hero treatment**
Full-bleed `bg-neutral-950` breaks the warm palette to stage product photography in maximum contrast. A ticker bar (`border-t border-white/10 bg-beige text-ink`) bridges back to the warm canvas below.

**Dark footer inversion**
Footer is full-bleed Deep Ink (`#111827`) with `text-white/50` secondary text, a Forest Pine subscribe CTA, and payment method chips at `text-white/40 border-white/10` — very low contrast, decorative only.

**Motion cadence**
The custom easing `cubic-bezier(0.22, 1, 0.36, 1)` (registered as `ease-out-expo`) governs all primary transitions — image swaps, overlay reveals, entrance fades. Entrance animations combine `opacity: 0→1` with `y: 12–18px → 0`, duration 0.45–0.65s with staggered delays of 0.05–0.24s.

Special cases: mobile drawer uses a spring (`damping: 30, stiffness: 300`); the hero ticker runs 30s linear infinite and pauses on hover; mega menu uses a faster 0.2s fade. Animate only meaningful elements — not every element on the page.
