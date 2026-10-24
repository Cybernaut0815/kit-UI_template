# zha-ui - Spec 2: Primitive-Class Layer (design)

> Status: **approved design**, brainstormed + reviewed (two fresh-Opus adversarial rounds), 2026-06-24.
> Builds on Spec 1 (foundation refinement, `docs/specs/2026-06-23-zha-ui-foundation-refinement-design.md`).
> Source evidence: `docs/research/2026-06-23-ui-foundations-research.md` (§1 cues, §2 patterns, §3 CSS/JS boundary, §4 Digital Archive promote list).
> Next: `superpowers:writing-plans` → SDD.

## 1. Goal

Build the structural primitive layer so ZHA apps stop hand-rolling navigation, tables, tiles, alerts, etc. CSS-only, themed entirely through the existing token cascade (`data-brand × data-theme × data-surface × data-density`). The hard rule: **never ship a CSS primitive that is inaccessible without JS** - anything whose accessible *behaviour* needs JS is deferred to the future React layer.

## 2. Scope

**Ship (CSS-only, fully keyboard/SR-operable as shipped):** app-shell, app-bar (header), sidebar nav (static), breadcrumb, pagination, empty state, stat/KPI tile, badge/pill, accordion (`<details>`), page/section header, divider, form-field grouping, segmented control.

**Ship styling-only (markup+CSS is fully accessible as static; interactive *behaviour* deferred and documented):** data-table (sort behaviour = JS; **no sort affordance rendered until that JS lands**), alert/banner (`role=status|alert` set by the consumer).

**Retrofit:** `.card` → border-first (see §5).

**Digital Archive extras, re-derived against our guidelines (not copy-pasted):** card accent-stripe, progress (native `<progress>`), view-fade transition. (`.scroll-area` was considered and **cut** - the global `* { scrollbar-width: thin }` already covers it; `overflow:auto` is a one-liner consumers write inline.)

**Deferred entirely to React (documented, not shipped even as styling):** tabs widget, dropdown menu, modal, tooltip (a CSS-only tooltip cannot satisfy WCAG 1.4.13 dismiss → would be inaccessible), popover/listbox. The sidebar *collapse-toggle behaviour* is JS; both rail width states ship as CSS.

## 3. Conventions

- **Naming:** bare lowercase-hyphen classes (`.app-shell`, `.data-table`, `.stat`), consistent with the shipped `.card`/`.btn`/`.surface`. `--modifier` for variants, `__part` **only** for sub-parts with no semantic element (`.stat__value`, `.alert__icon`, `.page-header__actions`); style semantic child elements/attributes directly everywhere else.
- **RTL:** CSS **logical properties only** for all directional rules (`border-inline-start`, `margin-inline`, `padding-inline`, `inset-inline`). Arabic fonts are already in the token set; physical `left/right` is prohibited in new primitives.
- **Weight:** ZHA Sans (`--font-secondary`) stays regular + upright - never apply weight to it. `--fw-medium` is **not** a defined token; use `var(--fw-medium, 500)` inside the `font:` shorthand (matches existing `.btn`/`.chip`); never `font-weight: var(--fw-medium)` (resolves to nothing).
- **Disabled state:** standardised to `opacity: .45` across all primitives (matches `.btn`).
- **Focus:** rely on the global `:focus-visible { box-shadow: var(--focus-ring) }`; new primitives must not re-declare it. Each interactive primitive's resting radius should be `--radius-m` (or set the ring radius to match its own) so the ring follows the shape.
- **Closed vocabulary:** primitives reference `var(--…)` tokens for all colour; structural px literals (32px control sizes, blur radius) are allowed, as in the existing primitives.
- **Reduced motion:** rely on the existing global `@media (prefers-reduced-motion)` guard; animated primitives (`view-fade`, accordion chevron, segmented thumb) must not re-emit it.

## 4. File organization

Split `packages/css/src/primitives.css` into concern-grouped partials under `packages/css/src/primitives/`:

- `base.css` - the existing 9 primitives (moved unchanged except the `.card` retrofit) + global focus/scrollbar/print/reduced-motion blocks.
- `layout.css` - app-shell, app-bar, divider.
- `nav.css` - sidebar, breadcrumb, pagination, page-header.
- `content.css` - stat, data-table, accordion, badge, card-accent, form-field, segmented control.
- `feedback.css` - alert, progress, empty-state, view-fade.

`build.mjs` concatenates them via a **fixed, ordered list** (deterministic cascade, reviewable in one place) into `dist/primitives.css`; `index.css` stays `tokens + primitives + es-lockup`. The shipped artifact shape is unchanged (one CSS file). `_shared.css` is **not** created up front - extract only if real duplication emerges during the build (YAGNI).

## 5. The `.card` retrofit (deliberate breaking change)

Per DESIGN.md "Depth & elevation" (passive surfaces = hairline only; shadows for floating layers): `.card` drops its resting `--shadow-low` **and** its default `:hover` lift → hairline only. The lift (`--shadow-mid` + `translateY(-2px)`) becomes opt-in via `.card--interactive` for clickable cards. This is a visual break for any page already using `.card`; accepted because the package is pre-1.0 with no published consumers. `--shadow-high` remains reserved for the React-deferred overlay layer (no Spec-2 consumer).

## 6. Per-primitive spec

All colours via tokens. Contrast figures are from the Round-2 review (computed against the built light/dark/brand values).

### Layout
- **`.app-shell`** - CSS grid, areas `"sidebar header" / "sidebar main"`, cols `var(--sidebar-w,240px) 1fr`, `block-size: 100dvh`. The header occupies a fixed grid row (no `position: sticky` needed inside the shell). `main` is the scroll container and **must** set `min-block-size: 0` (grid items default to `min-height:auto`, which breaks internal scroll). `[data-rail]` sets `--sidebar-w: 56px`; the toggle that sets it is consumer JS. Exposes `--app-bar-h` (56px) for document-scroll pages that pin a sticky bar.
- **`.app-bar`** (on `<header>`) - flex, 56px, bottom hairline, `background: color-mix(in srgb, var(--bg-page) 88%, transparent)` + `backdrop-filter` **and** `-webkit-backdrop-filter: blur(10px)`. Fallback: `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { background: var(--bg-surface-1) }` (covers both blur and a missing `color-mix`). Added to the `@media print` reset (drop blur + any sticky).
- **`.divider`** - `<hr>` / `role=separator`; 1px `--border-subtle`, logical-property margins, no shadow.

### Navigation
- **`.sidebar`** (on `<nav aria-label>`) - 240px; idle links `--text-muted`, hover `--bg-surface-2` + `--text-default`. **Active** (`aria-current="page"` / `.is-active`) = `--accent-subtle` fill + **`--text-strong`** text + a 3px `--accent` inline-start bar (`::before`). *Rationale:* the review rejected the solid `--accent-fill` pill because it reads as a CTA and out-shouts the work surface (cue #7), and `--accent`-on-`--accent-subtle` text fails AA at 3.46:1. `--text-strong` on the 12% tint passes; the bar marks "you are here" without shouting (matches §2's Linear reference).
- **`.breadcrumb`** (on `<nav aria-label="Breadcrumb"><ol>`) - flex, `/` separators via `li:not(:first-child)::before`, last item `aria-current="page"` + non-link `--text-default`, links `--text-muted` + hover underline.
- **`.pagination`** (on `<nav aria-label="Pagination">`) - 32px square controls, `--radius-s`; active `--accent-fill` + `--accent-on` (white-on-fill = 5.07:1, AA; the small mass is fine here unlike the sidebar); disabled `aria-disabled` → `opacity:.45` + `pointer-events:none`, kept visible; truncate with current ±2.
- **`.page-header`** + `__title`/`__actions` - title + actions on a `space-between` row, bottom hairline; title `--fs-display` + `--tracking-display`; composes with breadcrumb above and (future) tabs below.

### Content
- **`.stat`** + `__label`/`__value`/`__delta` - surface-1 + hairline, **no shadow**. Label `--fs-small` muted uppercase; value **`--fs-display` (24px)** + `tabular-nums` (not `--fs-hero` - that is documented brand-surface/marketing-only in DESIGN.md); delta `--intent-success-text`/`--intent-error-text`.
- **`.badge`** (+ `--success/--warning/--error/--info`) - outline pill, **background `transparent` (locked, hard requirement)**, 1px border + text both `currentColor` set to the matching `--intent-*-text`, `--radius-pill`. Ships with a dot/text so status is never colour-alone (WCAG 1.4.1). AA-guaranteed on `--bg-surface-1`/`--bg-page`.
- **`.accordion`** (on `<details>/<summary>`) - hairline container; `summary { list-style: none }` **and** `summary::-webkit-details-marker { display: none }` (Safari); custom chevron via `::after` (logical-property borders) rotating on `[open]` with `--motion-base`.
- **`.data-table`** (on `<table>` + `<caption>` + `<th scope>`) - hairline row separators (`border-block-end`), **no zebra**; cell padding 8 / 12-16; `block-size: var(--row-h)`; sticky opaque `--bg-surface-1` `thead th` (correct only when `main`/the wrapper is the scroll container - document the `--app-bar-h` offset for document-scroll); row hover `--bg-surface-2`; `.num` cells `text-align:end` + `tabular-nums`. **Sort: no visible affordance ships** until the JS lands; `aria-sort` styling is documented but not rendered (a styled-but-inert sort header is an inaccessible affordance).
- **`.field`** (form-field grouping) - wraps `<label>` + `.input`/`.select` + optional `__help` (`--text-muted`, `--fs-small`) + `__error` (`--intent-error-text`, `--fs-small`). Error state sets `aria-invalid` + ties `__error` via `aria-describedby` (consumer wires the id). Uses existing `.input`/`.select`; adds only the label/help/error layout.
- **`.segmented`** - pill track (`--bg-surface-2`) over native `<input type=radio>` labels; the checked thumb is a `--bg-surface-1` block that slides via `transform` + `--ease-spring`, driven by `:has(:checked)` / `:checked` (no JS). Keyboard = native radio arrow-key behaviour. Falls back to plain highlighted segments where `:has()` is unsupported. *(Implementation note: the shipped code uses a static `:has(:checked)` background swap + `--shadow-low` lift rather than an animated spring-slide - the `color` property transitions but no `transform` or `--ease-spring` runs on the thumb. The design intent above describes the target; the static lift is what shipped in Spec 2.)*
- **`.card--accent`** - 3px `border-inline-start: var(--accent)`. Hue is **not** parameterizable - typology hues never enter chrome (color-famine, cue #3).

### Feedback
- **`.alert`** (+ `--success/--warning/--error/--info`) + `__icon`/`__title` - plain `--bg-surface-1` background, body text `--text-default`, **intent carried only by the inline-start 3px border + the icon, both `--intent-*-text`** (the AA-safe variants - raw `--intent-warning` border is 1.75:1, fails non-text 3.0). *Rationale:* a `color-mix` intent tint behind the text failed AA on dark/brand (4.1-4.2:1) and the contrast gate structurally cannot catch text-on-tint. Meaning is never colour-alone (icon + title). `role=status` (polite) / `role=alert` (assertive) set by the consumer; styling-only.
- **`.progress`** (on native `<progress>`) - `accent-color: var(--accent-fill)` (Chromium/Firefox) **and** `::-webkit-progress-bar` (track `--bg-surface-3`) + `::-webkit-progress-value` (fill `--accent-fill`) + `::-moz-progress-bar` - Safari ignores `accent-color` on `<progress>`, so the pseudo-elements are required, not optional. Native element = accessible by default.
- **`.empty-state`** - centered, `--space-12/16` vertical padding, muted icon slot, `--fs-h2` heading, one-line body, optional CTA; **no** container border.
- **`.view-fade`** - `@keyframes` animating `opacity` + `translateY` only, `--motion-slow` + `--ease-out`; relies on the global reduced-motion guard.

## 7. Accessibility contract (binding)

Diagnostic per primitive: *can a keyboard + screen-reader user fully operate it with only the markup/CSS we ship?* Anchors: `aria-current` (nav/breadcrumb/pagination), `<table><caption><th scope>` + `aria-sort` (styling deferred), `role=status|alert`, native `<details>/<summary>` (note the historical NVDA disclosure caveat), native `<progress>`, native radio for segmented, non-colour-alone status (1.4.1), `:focus-visible` ≥3:1 (2.2). No primitive renders an interactive-looking control whose behaviour isn't shipped.

## 8. Verification

- **Demo/gallery:** grow `examples/foundation-reference/index.html` into a primitive gallery - app-shell assembled once, every primitive shown, checked in **light / dark / brand** (the oklch blind-spot rule) and comfortable/compact. A published visual-cues artifact of the approved v3 design already exists for reference.
- **Contrast gate:** `pnpm build` runs it; keep green. The gate already runs every PAIR across light/dark/brand, so `--intent-*-text × --bg-surface-1 @ 4.5` is already covered in all themes (passes 4.72-5.47). The real gap is secondary surfaces: on **dark `--bg-surface-2`** intent text measures ~4.1-4.2 - fine as a **non-text** border/icon (≥3.0) but **failing as body text** (4.5). Resolution baked into the design: intent-coloured **text** (badge text, stat delta) lives only on `--bg-surface-1`/`--bg-page`; intent **colour** on a secondary surface appears only as borders/icons (non-text). **Extend `scripts/contrast-matrix.mjs`** to add `--intent-*-text × --bg-surface-2 @ 3.0` (non-text, passes - documents the border/icon path) and a comment stating intent text is validated on surface-1/page only. The gate validates source-intended values, not the emitted oklch cascade - so still **render-verify dark + brand in a real browser** after building any coloured primitive.
- **Tests:** the css package has 3 smoke tests (class-exists-in-dist). Add one smoke assertion per new primitive class - same lazy style, no framework. CSS isn't meaningfully unit-tested; real verification is render-verify + the gate.
- **SDD:** one task ≈ one primitive (its partial section + gallery entry + smoke assertion). Ledger at `.superpowers/sdd/progress.md`.

## 9. Risks / open items

- **Contrast-gate blind spot** is the dangerous one: it reports green on inaccessible text-on-tint / text-on-surface-2. The §8 gate extension is a prerequisite for any tinted primitive.
- **`color-mix` / `backdrop-filter`** support: the `@supports` fallback must cover both; the codebase already depends on `color-mix` un-guarded in the typology tints, so the baseline target is modern browsers.
- **`.card` break** is intentional (§5) and accepted.
- **Segmented `:has()`** support: ship the documented fallback (highlighted segments, no sliding thumb) for engines without `:has()`.
