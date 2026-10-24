# zha-ui reference - every class and variable

> The vocabulary for the zha-ui skill. SKILL.md beside this file carries setup, skeletons and rules; this file is the lookup.
>
> **Setup**
> - Load the stylesheet once: `import '@gitzhacode/zha-ui-css/index.css'` in a bundled app, or `<link rel="stylesheet" href="./node_modules/@gitzhacode/zha-ui-css/dist/index.css">` in plain HTML.
> - On `<html>` set `data-brand="zha-app"` (the firm default; a team app sets `data-brand="es"` or another team) `data-theme="light|dark"` `data-surface="brand|work"` (`brand` goes with `data-theme="dark"`, or on a nested island; beside `data-theme="light"` on the same element, light wins).
>
> **Classes - use only these; do not invent colours or hardcode hex:**
>
> *Spec 1 (base):*
> `.surface .card .btn .btn--primary .btn--secondary .btn--ghost .btn--danger .btn.is-active .input .select .chip .icon-btn .icon-btn--ghost .skeleton .sr-only`
> `.chip__remove .chip--purple .chip--ultramarine .chip--blue .chip--teal .chip--dark-green .chip--light-green .chip--lime .chip--yellow .chip--apricot .chip--orange .chip--cool-red .chip--magenta`
>
> *Spec 2 (primitives):*
> `.app-shell .app-main .app-bar .app-bar__brand .app-bar__app .app-bar__spacer .divider`
> `.sidebar .breadcrumb .pagination .tabs .tabs__tab .page-header .page-header__title .page-header__actions`
> `.stat .stat__label .stat__value .stat__delta .stat__delta--up .stat__delta--down`
> `.badge .badge--success .badge--warning .badge--error .badge--info .badge--neutral .dot`
> `.accordion .accordion__body .data-table .num .th-unit .field .field__label .field__help .field__error`
> `.slider-row .slider-row__value .segmented .card--interactive .card--accent .accent-grad .accent-grad-text .accent-grad-subtle .accent-grad-aurora .accent-grad-conic .accent-grad-duo`
> `.grad-hero-ember .grad-hero-ocean .grad-hero-violet .grad-hero-dusk .grad-spectrum .grad-wash .grad-glow`
> `.grad-pair-polar .grad-pair-blaze .grad-pair-reef .grad-pair-nova .grad-pair-orchid .grad-pair-beacon .grad-pair-sundial .grad-pair-prism .grad-pair-verdigris .grad-pair-borealis .grad-pair-nebula .grad-pair-abyss .grad-pair-furnace .grad-pair-signal .grad-pair-terra .grad-pair-regatta`
> `.alert .alert--success .alert--warning .alert--error .alert--info .alert__icon .alert__title`
> `.progress .empty-state .empty-state__icon .view-fade .tooltip`
> `.dialog .dialog--sm .dialog--md .dialog--lg .dialog--full .dialog__header .dialog__title .dialog__close .dialog__body .dialog__footer`
> `.menu .menu__search .menu__list .menu__section .menu__item .menu__check .menu__caret .menu__separator .menu__footer`
>
> *Spec 3 (composition + states):*
> `.container .stack .stack--tight .stack--loose .cluster .cluster--between .cluster--end .grid .section .split .split--aside-start .toolbar .divider--vertical .form-grid .field--span .table-wrap .data-table--wrap .eyebrow .hero .hero--bleed .prose .text-muted .card--flush .toast .spinner .app-bar__nav-toggle .skip-link`
> Knobs (the ONLY inline styles allowed): `--container-w --grid-min --stack-gap --split-aside --control-h --dialog-w --sidebar-w --zha-logo-h --zha-lockup-size`
> Elements carry defaults - write `h1`-`h4`, `p`, `a`, `pre`, `hr` without classes.
>
> **CSS variables - use only these for colour / space / type:**
>
> `llms.txt` lists every token with its value; colour, shadow and gradient tokens by name only (their values change per theme and brand).
>
> *Backgrounds:* `--bg-page --bg-surface-1 --bg-surface-2 --bg-surface-3`
>
> *Text:* `--text-strong --text-default --text-muted --text-muted-strong --text-disabled`
>
> *Borders:* `--border-subtle --border-default --border-strong`
>
> *Accent:* `--accent --accent-fill --accent-on --accent-subtle` and `--accent-hover` (the primary button's hover fill; never set it yourself) - plus the **secondary** (expressive only - gradient/tints, never interactive): `--accent-2 --accent-2-subtle --accent-2-fill`, the brand gradient `--brand-grad` and its subtle wash `--brand-grad-subtle`, plus the team wardrobe `--brand-grad-aurora --brand-grad-conic --brand-grad-duo` (apply via the `.accent-grad-aurora` / `-conic` / `-duo` classes, never the raw vars)
>
> *Intent:* `--intent-error --intent-success --intent-warning --intent-info`
> and their readable-text variants `--intent-error-text --intent-success-text --intent-warning-text --intent-info-text`
> and their on-colour variants `--intent-on-error --intent-on-success --intent-on-warning --intent-on-info`
>
> *Typology tints (12 hues × 4 opacities):* `--typology-<name>-100 --typology-<name>-75 --typology-<name>-50 --typology-<name>-25`
> plus the per-theme AA-safe text form `--typology-<name>-text` (use it whenever a typology hue must be READ - chip text, chart labels; never bare `--color-typology-*` as text)
> where `<name>` is one of: `purple ultramarine blue teal dark-green light-green lime yellow apricot orange cool-red magenta`
>
> *Charts:* generic data series wear `--chart-cat-1 … --chart-cat-8` in fixed slot order (never cycled, never re-ordered per theme; 9th+ series → `--chart-cat-other` "Other" or facet). Magnitude ramps: `--chart-seq-1 … --chart-seq-6` (one hue; "more" = more contrast vs the surface in both themes). Polarity: `--chart-div-neg-3 … --chart-div-neg-1 --chart-div-mid --chart-div-pos-1 … --chart-div-pos-3` (mid is neutral, never a hue). Data keyed BY building typology uses `--typology-*` (+ `--typology-*-text`) instead. Chart text/grid: `--chart-text --chart-text-strong --chart-grid --chart-axis` - text never wears a series colour; one axis only; legend always present for ≥ 2 series.
>
> *Gradient library (decorative only - never a work-surface heading fill):* `--grad-hero-ember --grad-hero-ocean --grad-hero-violet --grad-hero-dusk` (frozen black-first hero meshes; white text) `--grad-spectrum` (12-hue sweep) `--grad-wash --grad-glow` (subtle accent washes; on a work surface use only these two and `.accent-grad-subtle`, nothing else from this library) - plus the 16-entry **signature-form pool**, applied ONLY via its `.grad-pair-<name>` classes (the classes own the aurora floors and oklch upgrades - never use the raw vars): journeys `polar blaze reef nova orchid` · conics `beacon sundial prism verdigris` · auroras `borealis nebula abyss furnace` (dark glow panels - text via `--text-*` only) · fields `signal terra regatta`. The pool is **un-assigned**: anyone may invoke an entry as decoration, and a team adopts one (pair + form) only at confirmation
>
> *Space:* `--space-1 --space-2 --space-3 --space-4 --space-5 --space-6 --space-8 --space-10 --space-12 --space-16` (4 px steps; note: no --space-7 or --space-9), plus the rhythm tiers and the page gutter `--space-section --space-block --space-inline --gutter`; the three tiers remap under `data-density="compact"`
>
> *Radii:* `--radius-s --radius-m --radius-l --radius-pill`
>
> *Typography:* `--font-primary --font-secondary --font-mono --fs-hero-xl --fs-hero --fs-display --fs-h1 --fs-h2 --fs-h3 --fs-reading --fs-body --fs-small --fs-label --leading-heading --leading-prose --measure` (the `--fs-*` names are sizes, not elements: `--fs-h1` is the `h2` size; [DESIGN.md](https://github.com/GitZHACODE/zha-ui/blob/main/DESIGN.md) has the ladder)
>
> *Motion:* `--motion-fast --motion-base --motion-slow --ease-out --ease-in --ease-spring`
>
> *Layers:* `--z-sticky --z-toast`
>
> *Other:* `--shadow-low --shadow-mid --shadow-high --scrim --tracking-display --tracking-body --tracking-label --tracking-small --leading-display --leading-body --row-h`, and `--focus-ring` (deprecated: the package paints focus as an outline; kept for consumers who referenced it)
>
> **Brand rules:**
> - The firm is "ZHA" - always; never write out its former spelled-out name.
> - Sentence case for headings and body copy; UPPERCASE only for chip labels (e.g. `<span class="chip">ES</span>`) and `.eyebrow`.
> - For a primary button use `.btn--primary` (it uses the AA-safe `--accent-fill`). Never put white text on bare `--accent`.
> - Lockup markup, two forms (both ZHA Sans, baseline-aligned). Firm form, `ZHA` alone and the default: `<span class="zha-lockup"><span class="zha-lockup__zha">ZHA</span></span>`. Team form, paired ZHA + team: `<span class="zha-lockup"><span class="zha-lockup__zha">ZHA</span><span class="zha-lockup__team">ES</span></span>`. Standalone wordmark (big, on its own): `<span class="zha-logo" role="img" aria-label="ZHA"></span>`.
> - In the app bar the lockup is the home link (firm form: `<a class="zha-lockup" href="/" aria-label="ZHA, home"><span class="zha-lockup__zha">ZHA</span></a>`; team form: the same with the team span added and `aria-label="ZHA ES, home"`) inside `.app-bar__brand`, followed by `<span class="app-bar__app">App Name</span>` (`--font-primary`, natural case). Never inline-colour the team letters; no app icon in the bar.
>
> **Brand tokens - `data-brand` values and their accent pairs:**
> | `data-brand` | Team | Primary accent |
> |---|---|---|
> | `zha-app` | ZHA (firm default) | Black-first neutral: ink on light, white on dark; no team letters |
> | `es` | Environmental Systems | Teal |
> | `code` | CODE | Purple |
> | `bim` | BIM | Dark green |
> | `analytics` | Analytics | Blue |
> | `abps` | ABPS | Orange |
> | `meta` | META | Ultramarine |
> | `zh-cluster` | ZH Cluster | Magenta |
>
> *(`zha-app` is the firm default and what `:root` renders with no `data-brand`. ES is the one confirmed team **pair** - teal primary → magenta secondary, blended as `--brand-grad` and the wardrobe forms. Non-ES teams show a provisional primary only; each adopts a catalog entry - pair + signature form - later. The pool ships as the 16 `--grad-pair-*` signature forms / `.grad-pair-*` classes - browse them in the [gradient showcase](https://github.com/GitZHACODE/zha-ui/blob/main/examples/gradient-showcase/index.html) and invoke them freely as decoration; none is a team identity until confirmed.)*

## Class cheat-sheet

| Class | What it is |
|---|---|
| `.btn` | Base button - always pair with a modifier. A link styled as a button that is unavailable carries `aria-disabled="true"` and no `href`: it takes the disabled look and stops answering the pointer |
| `.btn--primary` | Filled accent button (AA-safe; use for the main CTA) |
| `.btn--secondary` | Outlined button |
| `.btn--ghost` | Text-only button |
| `.btn--danger` | Destructive action button |
| `.card` | Border-first content container - 1 px hairline, no resting shadow, default padding `--space-5`. Add `.card--flush` for media/table cards, `.card--interactive` for hover lift, `.card--accent` for a leading accent stripe |
| `.surface` | Flat bordered container (no shadow) |
| `.input` | Full-width text input |
| `.select` | Full-width `<select>` |
| `.chip` | Tag / pill (add `aria-pressed="true"` or `.is-active` for selected state) |
| `.chip--<hue>` | Typology-tinted chip (`purple ultramarine blue teal dark-green light-green lime yellow apricot orange cool-red magenta`) - hue tint bg + the same hue's AA text; keep on surface-1/page |
| `.chip__remove` | Remove button inside a chip (`<button class="chip__remove" aria-label="Remove …">` + inline stroke ×); hover wash follows the chip colour. Only inside non-interactive `<span class="chip">` - never inside `button.chip` / toggle chips (nested interactive controls are invalid HTML and unreachable). Disabled, it takes the shared disabled value and no hover wash |
| `.btn.is-active` | Quiet persistent toggle on any `.btn` (accent-subtle wash + accent border, text stays strong); also via `aria-pressed="true"` |
| `.icon-btn` | 44 × 44 px icon-only button (muted icon - utility, not brand decoration) |
| `.icon-btn--ghost` | Chromeless icon button (transparent bg + border, same hit target) - toolbars, chat rails |
| `.skeleton` | Animated loading placeholder |
| `.sr-only` | Screen-reader-only text (visually hidden) |
| `.zha-logo` | Standalone ZHA wordmark (theme-aware masked SVG; size via `--zha-logo-h`) |
| `.zha-lockup` | ZHA lockup (ZHA Sans, baseline-aligned): `ZHA` alone is the firm form, ZHA + team name the team form |
| `.zha-lockup__zha` | "ZHA" text inside the lockup (neutral, `--text-strong`) |
| `.zha-lockup__team` | Team name inside the lockup (brand gradient) |
| `.zha-lockup--solid` | Solid-colour (non-gradient) team-name variant |
| `.accent-grad` | Area fill painted with the team gradient (`--brand-grad`). Identity/hero only |
| `.accent-grad-text` | Gradient-clipped headline/number; solid `--accent-fill` fallback. Hero sizes only, never work-surface headings |
| `.accent-grad-subtle` | Low-opacity team-gradient wash (`--brand-grad-subtle`) for panel/section backgrounds |
| `.accent-grad-aurora` | Team aurora - live accent glow pair over an ink floor (`--brand-grad-aurora`). Identity/hero only; text via `--text-*` |
| `.accent-grad-conic` | Team conic - off-centre angular sweep (`--brand-grad-conic`), live per team. Identity/hero only |
| `.accent-grad-duo` | Team duotone - plateaued two-field blend (`--brand-grad-duo`), live per team. Identity/hero only |
| `.grad-hero-ember` | Frozen ZHA hero mesh (ember/terracotta) - full-bleed black-first marketing hero; text via `--text-*`, never literal `#fff` |
| `.grad-hero-ocean` | Frozen ZHA hero mesh (deep ocean/cobalt) - full-bleed black-first marketing hero; text via `--text-*`, never literal `#fff` |
| `.grad-hero-violet` | Frozen ZHA hero mesh (violet sphere/amber flare) - full-bleed black-first marketing hero; text via `--text-*`, never literal `#fff` |
| `.grad-hero-dusk` | Frozen ZHA hero mesh (indigo→gold dusk; most brand-core) - full-bleed black-first marketing hero; text via `--text-*`, never literal `#fff` |
| `.grad-spectrum` | 12-hue typology spectrum band (oklch-vivid where supported) - wayfinding / hero decoration |
| `.grad-wash` | Top-down accent tint wash for section backgrounds (work-surface safe) |
| `.grad-glow` | Overhead radial accent glow for section backgrounds (work-surface safe) |
| `.grad-pair-<name>` | One of the 16 signature-form pool entries - journeys (`polar blaze reef nova orchid`), conics (`beacon sundial prism verdigris`), auroras (`borealis nebula abyss furnace` - dark glow panels, text via `--text-*` only), fields (`signal terra regatta`). Un-assigned pool, decorative use only; a team adopts an entry (pair + form) at confirmation |
| `.app-shell` | CSS grid shell (`sidebar / header + main`). `[data-rail]` collapses sidebar to 56px icon rail; at 768px and below the sidebar hides; consumer JS toggles `data-nav-open` on the shell to show it as a fixed drawer (`var(--sidebar-w, 240px)` wide), the same contract as `data-rail` |
| `.app-main` | The app-shell's main content slot - `grid-area: main`, internal scroll container (`overflow: auto`), `min-block-size: 0`, content padding. Must be a direct child of `.app-shell` |
| `.app-bar` | `<header>` - flex 56px bar, translucent chrome, bottom hairline. Use `__brand` and `__spacer` inside |
| `.app-bar__brand` | Baseline brand group for `a.zha-lockup` + `.app-bar__app`; carries a regular-ZHA-Sans fallback so bare-text brands stay on-brand (lockup + app name each override with their own font) |
| `.app-bar__app` | App name next to the lockup (`--font-primary`, fs-h2, muted; ellipsizes, hidden ≤640px). Scoped to `.app-bar` |
| `.app-bar__spacer` | `flex: 1` gap between brand and right-side controls |
| `.app-bar__nav-toggle` | The phone drawer's button: an `.icon-btn.icon-btn--ghost` with `aria-controls` on the sidebar, hidden while the sidebar is in the grid and shown at 768px and below; its click toggles `data-nav-open` on `.app-shell` |
| `.divider` | `<hr>` 1px `--border-subtle` hairline with `--space-4` block margins |
| `.divider--vertical` | Add to `.divider` for a 20px vertical hairline between groups inside `.toolbar` and `.cluster` |
| `.skip-link` | The page's first element: `<a class="skip-link" href="#main">Skip to content</a>`, hidden until the keyboard reaches it; `<main>` carries `id="main"` |
| `.container` | Centred page column, `--container-w` wide (72rem by default) with the `--gutter` on both sides. Knob `--container-w` (64rem for app pages, `var(--measure)` for reading pages) |
| `.stack` | Vertical flow: flex column, children spaced by `--space-block`. Knob `--stack-gap`; knob and modifiers apply to that stack only; nested stacks set their own |
| `.stack--tight` | `.stack` at `--space-2`: label and value, card title and body |
| `.stack--loose` | `.stack` at `--space-section`: between page regions |
| `.cluster` | Wrapping row of controls or chips, vertically centred, spaced by `--space-inline` |
| `.cluster--between` | `.cluster` pushed to both ends (footer row, card header) |
| `.cluster--end` | `.cluster` aligned to the end (form actions) |
| `.grid` | Auto-fit grid of equal columns no narrower than `--grid-min` (16rem), spaced by `--space-block`. Knob `--grid-min`; nested grids set their own |
| `.section` | Page region: `--space-section` padding above and below; a hairline separates adjacent sections. Pair with `.stack` for its children |
| `.split` | Main column plus an aside between 16rem and `--split-aside` (22rem), gap `--space-6`; stacks at 1024px. Knob `--split-aside` |
| `.split--aside-start` | Puts the `.split` aside first (an analysis panel left of a canvas) |
| `.toolbar` | Wrapping row at `--space-2` with compact 36px controls (sets `--control-h` for you) |
| `.form-grid` | Auto-fit grid of `.field`s (16rem minimum), gaps `--space-4` by `--space-5` |
| `.table-wrap` | Scroll container for a wide `.data-table`: the table scrolls sideways, the page does not |
| `.eyebrow` | Mono uppercase label above a hero or brand-panel heading, muted; takes `--accent` inside a brand-surface `.hero`. Never above every heading |
| `.hero` | Display panel: `h1` in ZHA Sans at `--fs-hero-xl`, a lead `p`, one gradient. Blessed: `<section class="hero grad-hero-dusk" data-surface="brand">` |
| `.hero--bleed` | Full-width landing hero outside the container (radius 0); its side padding equals the `.container` margin, so the text lines up with the column below. A page that narrows its column sets the same `--container-w` on the hero |
| `.prose` | Running text: `--fs-reading`, `--leading-prose`, at most `--measure` wide, spaced paragraphs, links as everywhere |
| `.text-muted` | The one text utility: a secondary line in `--text-muted` |
| `.sidebar` | `<nav>` flex column of `<a>` links. Active = `a[aria-current="page"]` (subtle tint + 3px accent bar) |
| `.breadcrumb` | `<nav><ol>` - `/` separators injected; last item `aria-current="page"` plain text |
| `.pagination` | `<nav><ol>` - 32px controls, anchors **or** buttons; active = `aria-current="page"` (accent-fill); disabled = `aria-disabled="true"`/`:disabled` |
| `.tabs` | Content-switching tab row (≠ `.segmented`); hairline base, one blessed selected treatment |
| `.tabs__tab` | Tab button/link: selected via `aria-current="page"` (valid on both, no role=tab needed) → strong text + 2px accent underline |
| `.page-header` | Flex row: `__title` (fs-display) on start, `__actions` flex row on end; bottom hairline |
| `.page-header__title` | Display-size heading inside `.page-header` |
| `.page-header__actions` | Flex row of buttons inside `.page-header` |
| `.stat` | Hairline-bordered KPI tile - `__label` + `__value` (fs-display, tabular-nums) + `__delta` |
| `.stat__label` | Muted uppercase label in a `.stat` tile |
| `.stat__value` | Large numeric value in a `.stat` tile |
| `.stat__delta` | Trend label; add `stat__delta--up` (green) or `stat__delta--down` (red) |
| `.badge` | Outline pill: transparent bg, 1px border + text both `currentColor` via intent modifier |
| `.badge--success` | Green intent badge |
| `.badge--warning` | Amber intent badge |
| `.badge--error` | Red intent badge |
| `.badge--info` | Blue intent badge |
| `.badge--neutral` | Intent-less badge (muted) for queued/unknown states |
| `.dot` | 6px filled circle inside `.badge` - ensures status is never colour-alone |
| `.accordion` | `<details>` - rotating chevron on `[open]`; wrap content in `__body` |
| `.accordion__body` | Body padding block inside `.accordion` |
| `.data-table` | `<table>` - sticky opaque thead, hairline row separators, row hover. A `<button>`/`.btn` inside `<th>` auto-adopts header typography (sort headers); `aria-sort="ascending"` or `"descending"` on the `<th>` shows the direction chevron, `"none"` and `"other"` show none; `aria-selected="true"` on a `<tr>` marks a selected row |
| `.data-table--wrap` | Lets `.data-table` cells wrap (`white-space: normal`); use inside `.table-wrap` for long text columns |
| `.num` | Right-aligned tabular-nums cell inside `.data-table` |
| `.th-unit` | Span inside `<th>` that escapes the uppercase transform (unit strings like "Wh/m²") |
| `.field` | Flex column wrapping label + `.input`/`.select` + help/error text |
| `.field__label` | Label above the input |
| `.field__help` | Muted hint text below the input |
| `.field__error` | Error text (intent-error-text); pair with `aria-invalid="true"` on the input |
| `fieldset.field` | Choice group: `<fieldset class="field">` + `<legend>` styled like `.field` (UA border box removed) |
| `.field--span` | A `.field` that spans the full `.form-grid` row (notes, long text) |
| `.slider-row` | Grid row: label + `<input type="range">` + `__value` readout - the analysis-panel staple |
| `.slider-row__value` | Tabular-nums value slot at the row end (muted, right-aligned) |
| `.segmented` | Pill-shaped radio group track. Checked segment lifts via `:has(:checked)` - no JS |
| `.card--interactive` | Adds hover lift (shadow-mid + translateY) to `.card`. Use only on clickable cards |
| `.card--accent` | Adds a 3px `--accent` inline-start stripe to `.card` |
| `.card--flush` | Removes `.card`'s default padding, for media and table cards |
| `.alert` | Flex row - intent via 3px inline-start border + icon colour (not a tinted background) |
| `.alert--success` | Success intent alert |
| `.alert--warning` | Warning intent alert |
| `.alert--error` | Error intent alert |
| `.alert--info` | Info intent alert |
| `.alert__icon` | 16×16 icon slot inside `.alert` (the inline icon step); inherits intent colour |
| `.alert__title` | Bold title line inside `.alert` |
| `.progress` | Native `<progress>` - accent-fill track + cross-browser pseudo-element support |
| `.empty-state` | Centered flex column - `__icon` + `<h3>` + `<p>` + optional CTA. No border |
| `.empty-state__icon` | 48×48 rounded bg-surface-2 container for the illustration/SVG |
| `.view-fade` | Entrance animation: opacity 0→1 + translateY 8px→0 over `--motion-slow`. Apply at DOM entry |
| `.toast` | Fixed bottom-end wrapper for one status alert: `<div class="toast"><div class="alert alert--success" role="status">…</div></div>`. Consumer JS inserts and removes it |
| `.spinner` | Inline indeterminate spinner for an unknown wait (`.skeleton` is for a known shape); slows to 1.5s under reduced motion |
| `.tooltip` | Paint-only tooltip box (inverse surface, fs-small, 36ch max) - you own positioning |
| `.dialog` | Native `<dialog>` styled as a centered modal; size with `--sm/--md/--lg/--full` |
| `.dialog__header` | Flex title bar with bottom hairline; holds `__title` + `__close` |
| `.dialog__title` | `<h2>`-style heading inside `__header` |
| `.dialog__close` | Close-button slot; compose with `.icon-btn` |
| `.dialog__body` | Scrollable content region (`flex:1`, `overflow:auto`) |
| `.dialog__footer` | Right-aligned action row with top hairline |
| `.menu` | Native `[popover]` styled as an anchored dropdown; JS positions + keyboards it |
| `.menu__search` | Sticky filter input at the top of a long menu |
| `.menu__list` | `role=group` column of checkbox rows |
| `.menu__item` | `<label>` row wrapping a native checkbox (`.menu__check`) + text |
| `.menu__check` | Native `<input type=checkbox>`, themed via `accent-color` |
| `.menu__section` | Muted caps group header |
| `.menu__caret` | Rotating chevron for expandable sections - right when collapsed, down when `aria-expanded="true"` |
| `.menu__separator` | 1px divider |
| `.menu__footer` | Sticky bottom row (e.g. Clear) |

## Where the rest lives

The zha-ui skill ([SKILL.md](SKILL.md) beside this file) carries setup, the page skeletons and the rules. The generated, always-current lists are `node_modules/@gitzhacode/zha-ui-css/dist/classes.txt` and `node_modules/@gitzhacode/zha-ui-tokens/dist/llms.txt`.
