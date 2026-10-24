# zha-ui - UI Foundations & Primitive-Layer Research

A fan-out research pass on 2026-06-23 (the real ZHA app and a survey of Geist, Linear, Radix Themes, GitHub Primer,
Stripe, Shopify Polaris, Atlassian, Tailwind/shadcn) plus a CSS-only / accessibility-boundary review produced this
note. It backs `docs/specs/2026-06-23-zha-ui-foundation-refinement-design.md` and the primitive-layer expansion that
follows it, and later token and primitive decisions cite it.

---

## 1. The seven cues that read as "modern & premium" in 2025-26

Every system surveyed converged on the same structural choices. Each of these maps to a token value.

1. **Borders over shadows for passive depth.** Cards/surfaces are separated by a 1px hairline (~8% foreground opacity); shadows are reserved for floating layers (popovers, modals), and even then max ~6% alpha per layer. Linear and Geist both draw card "borders" with a zero-blur `box-shadow` inset ring; Atlassian's rule: "a border is the default for scrolled content; shadows only where a border would be missed."
2. **Tight radius scale.** The architectural register reads sharp. Stripe locks everything at 4px; Linear uses 6px controls / 12px cards; Geist 6/12/16. Avoid friendly 12-16px rounding on form controls.
3. **Restrained colour.** One accent + four intent hues; everything else neutral. The multi-hue/typology palette belongs to *data/taxonomy*, never to UI chrome. Linear's 2024→26 shift went *more* monochrome.
4. **Translucent chrome.** App headers use `backdrop-filter: blur(8-12px)` over an ~88% surface so content ghosts through - membrane-thin, not a solid bar.
5. **Fast, purposeful motion.** ~150ms for state/hover, ~200ms popovers, ~300ms modal entries; spring easing `cubic-bezier(0.175,0.885,0.32,1.1)` only for *positional* moves (sliding thumb/panel), never colour fades. Animate only `transform`/`opacity`.
6. **Typography that earns its tracking.** Negative tracking at display sizes, ~0 at body, slightly *positive* at label/caption. Linear's signature is Inter Variable weight 510 + tight negative tracking; their display goes to ~-0.022em.
7. **Dimmed chrome, bright content.** Sidebar/nav sits at secondary-text intensity until active; the work surface is the brightest thing in frame. Linear: "Don't compete for attention you haven't earned" / "structure should be felt, not seen."

---

## 2. Per-primitive concrete patterns (the reference for the primitive layer)

Values are the cross-system consensus; adapt to zha-ui tokens (no hardcoded literals in our output).

- **App header / top bar** - sticky, 48-56px, page-surface bg at ~88% + blur, separated by a bottom hairline (never a heavy shadow). `<header>` + `<nav aria-label>`; active link `aria-current="page"`.
- **Sidebar nav** - 240px (collapsible to ~56px icon-only). Active state = subtle filled pill (`accent` at ~12% opacity, 6px radius), idle text at secondary intensity, inset with side margin so the pill floats inside the rail (Linear). Left-edge accent bar is the alternative (Polaris).
- **Data table** - row separators (1px hairline), **not** zebra; cell padding ~8px vertical / 12-16px horizontal; opaque sticky header; hover = ~4% foreground tint; right-align numerics with tabular-nums. Sortable = `aria-sort` + JS (defer behaviour).
- **Stat / KPI tile** - surface one step above page + hairline, **no shadow**; label 12px muted, value 28-32px tabular, optional delta (success/danger). Padding 20-24px, radius 8-12px.
- **Alert / banner** - 4 intents; refined approach is intent-hue border at ~40% alpha over a subtle tint (Primer), or a left-border accent for inline notices. `role="status"` (polite) / `role="alert"` (assertive) fire on DOM insertion - dismiss/insert is JS (defer).
- **Badge / status pill** - outline pill (transparent bg, 1px intent border, 9999px) for categorisation; soft-filled chip (4-8px radius) for state. Never status-by-colour-alone (pair text/icon).
- **Toolbar / segmented control** - pill track (`fg` at ~8%) with a filled thumb that slides via `transform` + spring easing; CSS-only feasible with native `<input type=radio>` + `:has()`.
- **Tabs** - underline (2px bottom indicator, active fg full / idle secondary) for page-level; boxed (active surface within a track) for in-panel. **APG-conformant tab behaviour needs JS - defer the widget; ship styling only.**
- **Breadcrumb** - `<nav aria-label="Breadcrumb"><ol>`; slash separator (architectural), last item `aria-current="page"` and non-link; body-size, idle secondary + hover underline. Fully CSS.
- **Empty state** - centered, generous vertical padding (48-80px), muted 40-64px icon, 16px heading, one-line body, optional CTA. No container border. Fully CSS.
- **Pagination** - `<nav aria-label="Pagination">`; 32px square buttons, active = solid fill, disabled kept visible at 0.4 opacity, truncate with current ±2. Fully CSS.
- **Page / section header** - title + actions on one `space-between` row (primary action rightmost, ≤2 actions), bottom hairline, optional breadcrumb above + tabs below.

---

## 3. CSS-only vs JS boundary (defines what the primitive layer ships)

The system ships CSS only; anything whose accessible behaviour needs JS is deferred to the future React layer so we never ship a CSS primitive that's inaccessible without JS.

| Ship now (fully CSS) | Ship styling only (behaviour deferred) | Defer entirely to React |
|---|---|---|
| App header, sidebar nav (static), breadcrumb, pagination, empty state, stat/KPI tile, badge/pill, **accordion via native `<details>/<summary>`**, page/section header | data table (sort = JS), alert/banner (`role` fires on insertion → JS), tooltip (Esc-dismiss per WCAG 1.4.13 → JS), sidebar collapse toggle | **tabs** (APG roving focus + `aria-selected`), **dropdown menu** (focus-managed `role=menu`), **modal** (`<dialog>.showModal()`) |

**Diagnostic:** can a keyboard + screen-reader user fully operate it with only the markup/CSS we ship? Yes → ship. Needs a JS listener in the interaction → defer or ship styling-only and document the gap.

Key a11y anchors: `aria-current` (nav/breadcrumb/pagination), `<table>`+`<caption>`+`<th scope>`+`aria-sort`, `role=status|alert`, `<details>/<summary>` (native disclosure - note historical NVDA caveat), non-colour-alone status (WCAG 1.4.1), focus-visible 2px ≥3:1 (WCAG 2.2). Sources: W3C WAI-ARIA APG, MDN.

---

## 4. Evidence from the real app (Digital Archive)

`repositories/digital-archive` (branch `feature/claude-setup-and-cleanup`) - React 19 + Vite, hand-rolled token system (no Tailwind), three style layers (`tokens.css`, `primitives.css`, `styles.css`). It is **ahead of zha-ui** in places and duplicates itself in others; the ranked promote list below follows from that.

- **Already has, not in zha-ui:** `.kpi-tile`, `.view-fade` (+keyframe & reduced-motion guard), a fuller warm-paper palette, a light→dark accent swap. These are back-port candidates.
- **Copy-pasted / duplicated (promote to shared primitives):** modal backdrop literal in **5 files**; two separate popover/dropdown implementations; a tooltip pattern pasted across filter bar / stats / cards / header; tabs done inline two different ways; progress bar hand-rolled twice; pill search bar built twice; left-accent-stripe card; empty/error states duplicated across two files; thin-scrollbar block duplicated.
- **Off-brand bespoke (fix via tokens):** KPI band colours hardcoded to Tailwind greens/ambers/reds (`#34d399`, `#fbbf24`, `#f87171`) and gauge zone rgba - should map to `--intent-*` or named band tokens. A couple of raw `border-radius:16` that should be `--radius-l`.
- **Ranked promote list** (promote in this order): modal/backdrop+panel shell · popover/listbox · tooltip · tabs (styling) · progress bar · kpi-tile · pill search input · card accent-stripe · empty/error state · view-fade · scrollbar utility.

---

## 5. How this maps to the zha-ui foundation decisions

Current foundation (`packages/tokens/src/primitive/scale.tokens.json`, `…/semantic/core.tokens.json`, `…/typography.tokens.json`):
- radius `s8/m10/l14/pill999` → **tighten** to `s4/m8/l12/pill` (cue #2).
- shadow `low/mid` → **add `high`**, document border-first elevation (cue #1).
- motion `fast150/base220/slow360` → **`base→200`, `slow→300`, add `--ease-spring`** (cue #5).
- tracking `display -0.03 / body -0.01` only → **add `label/small +0.01`, display→-0.04**; optional `--fs-hero ~32px` (cue #6).
- space `1-6,8` (4-32) → **add `10/12/16` (40/48/64)**; add `--row-h` density token for tables.
- **Locked, do not touch:** ES teal, the 12-hue typology palette, ZHA Sans regular-weight/upright. Re-run the contrast gate after any colour/border/shadow change (text 4.5 / non-text 3.0).

---

## 6. References

**Design systems**
- Vercel Geist - https://vercel.com/geist/introduction · tokens https://vercel.com/design.md · https://vercel.com/design.dark.md · materials https://vercel.com/geist/materials · colors https://vercel.com/geist/colors · typography https://vercel.com/geist/typography
- Linear - https://linear.app/now/how-we-redesigned-the-linear-ui · https://linear.app/now/behind-the-latest-design-refresh · https://linear.app/brand · reverse-eng tokens https://styles.refero.design/style/90ce5883-bb24-4466-93f7-801cd617b0d1 · Radix case study https://www.radix-ui.com/primitives/case-studies/linear
- Radix Themes - https://www.radix-ui.com/themes/docs/theme/typography · /spacing · /radius · /color · source https://github.com/radix-ui/themes
- GitHub Primer - https://primer.style/components/data-table · https://primer.style/product/components/banner · https://primer.style/foundations/primitives/size · tokens https://github.com/primer/primitives
- Stripe - https://docs.stripe.com/elements/appearance-api · https://www.designmd.run/blog/stripe-design-system-breakdown
- Shopify Polaris - https://polaris-react.shopify.com/tokens/spacing · /border · depth https://polaris-react.shopify.com/design/depth/creating-depth
- Atlassian - https://atlassian.design/foundations/elevation · /radius · banner https://atlassian.design/components/banner
- shadcn/ui - https://ui.shadcn.com/docs/theming · components https://github.com/shadcn-ui/ui
- Carbon - empty states https://carbondesignsystem.com/patterns/empty-states-pattern/ · breadcrumb · pagination
- Setproduct guides - data-table / pagination / breadcrumbs / dashboard at https://www.setproduct.com/blog

**Accessibility (the CSS/JS boundary)**
- W3C WAI-ARIA APG patterns - tabs / accordion / toolbar / tooltip / menu / dialog-modal / breadcrumb: https://www.w3.org/WAI/ARIA/apg/patterns/
- MDN - `<dialog>`, `<details>`, `role=tooltip`, `aria-current`, `aria-sort`: https://developer.mozilla.org/
- `<details>`/`<summary>` accordion a11y - https://www.hassellinclusion.com/blog/accessible-accordions-part-2-using-details-summary/ · https://webaim.org/techniques/disclosures/
- Focus rings - https://piccalil.li/blog/taking-a-shot-at-the-double-focus-ring-problem-using-modern-css/

**Trend grounding**
- Flat vs elevated / "purposeful depth" - Material 3 tone-based surfaces https://m3.material.io/blog/tone-based-surface-color-m3 · Apple Liquid Glass (WWDC25) · Fluent 2 elevation https://fluent2.microsoft.design/elevation · Carbon layer https://v9.carbondesignsystem.com/guidelines/layer/
- Neumorphism is effectively dead in production (structural a11y failure: shadow-edge contrast ~1.4:1 vs WCAG 3:1) - https://www.superdesign.dev/styles/neumorphism · https://webflow.com/blog/neumorphism

> Note: Linear and Geist publish no official token file; their concrete values above are reverse-engineered (Refero, community DESIGN.md mirrors) and cross-checked across ≥2 sources - treat as directional, not authoritative APIs.
