# Designing with zha-ui

Declare your team and surface on `<html>`, and the system resolves colour, type, space and
state. This guide is for people; for the agent rules see [`skills/zha-ui/SKILL.md`](./skills/zha-ui/SKILL.md); for the
exhaustive token/class list see [`skills/zha-ui/reference.md`](./skills/zha-ui/reference.md) and the canonical
`llms.txt` shipped in `@gitzhacode/zha-ui-tokens`.

## The mental model

You never hand-style. You declare **who you are** and **what kind of surface** you
are building, and the system resolves every colour, type size, space, and state -
on brand, with colour contrast enforced on every build.

## The four switches

Set on your `<html>` tag; everything inside inherits.

| Attribute | Says | Options |
|---|---|---|
| `data-brand` | firm default or team | `zha-app` (firm default: black-first neutral, no team letters) · `es` (teal→magenta, the one confirmed team pair) · `code` · `analytics` · `bim` · `abps` · `meta` · `zh-cluster` (provisional) |
| `data-theme` | light or dark | `light` · `dark` |
| `data-surface` | marketing vs. working app | `brand` (black-first) · `work` (light default) |
| `data-density` | how tight | `comfortable` (default) · `compact` |

### `data-surface`: when "brand" vs "work"

- **`work`** - the light default. Use for dashboards, forms, data tables, internal
  tools - anything someone *operates*. Layered light panels tuned for legibility.
- **`brand`** - a **distinct black-first "Black Steel" marketing surface** (not a
  recolour of dark mode). Near-pure-black surfaces, crisp white headlines. Use for
  landing pages, hero sections, marketing/launch screens - anything someone *reads*
  and should feel the ZHA identity. Don't build dense working UI on it. On one element `data-theme="light"`
  beats `brand` (the tokens emit light last), so pair `brand` with `data-theme="dark"`, or put it on the
  hero island alone.

### `data-density`: when "compact"

`compact` drops control height via `--control-h`
from 44px (comfortable) to 36px, with tighter vertical padding. Use it for
information-dense screens (data tables, admin panels, side-by-side editors) where
44px targets waste vertical space. 36px stays at/above the WCAG 2.5.8 target-size
floor. Leave it at `comfortable` for touch-first or public-facing pages.

Tables get a parallel knob: `--row-h` (44px comfortable / 36px compact) sets row
height through the density axis, so a data table densifies with the page instead of
hardcoding heights.

## Oklch fallback and print legibility

The bundle gives you two things without any page CSS:

- **oklch with an sRGB hex fallback.** Colours ship as `oklch()` wrapped in
  `@supports`, with a hex base underneath. On engines without oklch - Citrix,
  kiosks, BIM/CAD webviews, headless-Chrome PDF export - colour degrades cleanly to
  sRGB hex instead of vanishing. You write nothing; it's in the bundle.
- **Print legibility.** A `@media print` block forces any surface (light, dark, or
  brand) to black-on-white, so a dark or brand page never prints ghosted or blank.
  No per-page print CSS is needed.

## Depth & elevation

Depth is **border-first**. Passive surfaces - `.surface`, `.card`, stat tiles, table
rows - are separated by a 1px hairline (`--border-subtle`), not a shadow. Shadows are
reserved for layers that float above the page:

- `--shadow-low` - a subtle raise (use sparingly).
- `--shadow-mid` - popovers, menus, dropdowns.
- `--shadow-high` - modals and full overlays.

The reasoning (and the wider system survey behind it) is in
`docs/research/2026-06-23-ui-foundations-research.md`. Stacked shadows make a page read as a
consumer app, so use the 1px hairline when in doubt.

The focus ring is a 2 px outline in `--accent-fill`, offset 2 px, never a shadow, so it is never
confused with elevation and is never clipped by `overflow: hidden`. That holds for the element's own
overflow; an ancestor that clips still cuts the ring off, so `.accordion summary` insets its ring
(`outline-offset: -2px`) because the accordion clips its overflow for the rounded hover.

### `.card` is hairline-only (Spec 2 breaking change)

`.card` is now **border-first**: 1px hairline, no resting shadow, no default hover
lift. The lift (`--shadow-mid` + `translateY(-2px)`) is opt-in via `.card--interactive`,
reserved for cards that are clickable/navigable targets. Spec 2 (2026-06-24) records the reason: the
package was pre-1.0 and had no published consumers.

```html
<!-- Passive card - just a hairline -->
<div class="card">…</div>

<!-- Clickable card - hover lifts it -->
<div class="card card--interactive">…</div>

<!-- Card with an accent stripe on the leading edge -->
<div class="card card--accent">…</div>
```

## Primitive vocabulary (Spec 2)

All Spec-2 primitives are **CSS-only** - they are fully keyboard and screen-reader
operable as shipped, without any JavaScript.

| Primitive | Element / pattern |
|---|---|
| `.app-shell` | CSS grid shell (`sidebar / header + main`). `[data-rail]` → 56px icon rail. |
| `.app-bar` | `<header>` - flex 56px bar, translucent chrome, bottom hairline. `__brand` / `__spacer`. |
| `.divider` | `<hr>` or `role=separator` - 1px `--border-subtle`, logical margins. |
| `.sidebar` | `<nav>` - flex column of `<a>`. Active = `a[aria-current="page"]` (subtle tint + 3px bar). |
| `.breadcrumb` | `<nav aria-label="Breadcrumb"><ol>` - `/` separators via `::before`; last item plain text. |
| `.pagination` | `<nav aria-label="Pagination"><ol>` - 32px controls; active = `aria-current="page"`; disabled = `aria-disabled`. |
| `.page-header` | Flex row - `__title` (fs-display) + `__actions` flex row; bottom hairline. |
| `.stat` | Hairline tile - `__label` (muted caps) + `__value` (fs-display, tabular-nums) + `__delta` (+ `--up` / `--down`). |
| `.badge` | Outline pill - transparent bg; border + text both `currentColor` set by intent modifier; `.dot` for colour-blind status. |
| `.accordion` | `<details>` - chevron rotates on `[open]`; `__body` for content. |
| `.data-table` | `<table>` - sticky opaque thead, row hover, `.num` for right-aligned tabular columns. Sortable headers: a `<button>` in the `th` plus `aria-sort="ascending"` or `"descending"` paints the chevron; `none`/`other` paint nothing; the sort itself is consumer JS. |
| `.field` | Flex column - `__label` / `__help` / `__error`; error state via `aria-invalid="true"` on the input. |
| `.segmented` | Pill track over native `<input type=radio>` labels; checked thumb via `:has(:checked)`. No JS. |
| `.card--interactive` | Opt-in hover lift for `.card`; use only on clickable cards. |
| `.card--accent` | 3px `--accent` inline-start stripe on `.card`. |
| `.alert` | Flex row - intent via 3px border + icon (not tinted background). `__icon` + `__title`. Set `role` on the consumer. |
| `.progress` | Native `<progress>` - `accent-color` + pseudo-element fallbacks for Safari. |
| `.empty-state` | Centered column - `__icon` slot, `<h3>`, `<p>`, optional CTA. No container border. |
| `.view-fade` | `@keyframes` on opacity + translateY. Apply at DOM entry; plays once. |
| `.dialog` | Native `<dialog>` (`showModal()`, top-layer) + `::backdrop`. Sizes `--sm/--md/--lg/--full`; `__header`/`__title`/`__close`/`__body`/`__footer`. Scroll-locks via `html:has(dialog.dialog[open])`. JS owns open/close + labelling. |
| `.menu` | Native `[popover]` (top layer, light-dismiss). `__search` (sticky), `__list` (`role=group`), `__item` (a `<label>` + `__check` native checkbox), `__section`, `__separator`, `__footer`. JS owns positioning; Tab/Space are native. |

## The gradient library

Gradients come in two provenance classes - treat them differently:

- **Frozen brand art** - `.grad-hero-ember` / `-ocean` / `-violet` / `-dusk`: the four sanctioned
  mesh hero masters, verbatim sRGB recreations of the downloadable assets. Black-first marketing
  heroes only (`data-surface="brand"`); set hero text via the `--text-*` vars - white on
  screen, flipped to black by the print block (literal `#fff` prints invisible on the white
  print floor); never re-tune the colours.
- **Palette-derived** - everything else resolves live from the palette/accent vars:
  `.grad-spectrum` (the 12-hue typology sweep; oklch-vivid where the engine supports in-oklch
  gradients, clean sRGB everywhere else), `.accent-grad-subtle` (low-opacity team wash), and
  `.grad-wash` / `.grad-glow` (accent tints). The three washes - `.grad-wash`, `.grad-glow`,
  `.accent-grad-subtle` - are the only gradients safe on work surfaces; everything else is
  hero/identity.

The **signature-form pool** is its own palette-derived family - 16 vetted, un-assigned entries
in four form families (`docs/specs/2026-07-23-zha-ui-gradient-pool-redesign-design.md`):
**journeys** `.grad-pair-polar` `-blaze` `-reef` `-nova` `-orchid` (multi-stop linears through a
third hue), **conics** `.grad-pair-beacon` `-sundial` `-prism` `-verdigris` (off-canvas angular
sweeps, wrap-held to 360°), **auroras** `.grad-pair-borealis` `-nebula` `-abyss` `-furnace`
(layered accent glows over a near-black floor - dark-first panels, text via `--text-*` only; the
floor is a `background-color`, so weak engines degrade to a solid dark panel), and **fields**
`.grad-pair-signal` `-terra` `-regatta` (plateaued blends whose transition band interpolates in
oklch where supported). Each entry's two anchor hues are its adoptable team pair; through-hues
and hazes are decorative. Entries are deliberately **un-assigned**: anyone may invoke one as
hero/identity decoration today, but at confirmation a team adopts an ENTRY - its anchors become
`--accent`/`--accent-2` and its form the team signature (the entry then leaves the pool). Apply
pool entries via their classes, never the raw vars - the aurora floors and the linear- and
conic-specific in-oklch feature tests live in the classes. Browse them in
`examples/gradient-showcase`.

Every confirmed team also inherits the **signature wardrobe** - `.accent-grad-aurora`,
`.accent-grad-conic`, `.accent-grad-duo` (plus the kept `.accent-grad` flat sweep) - rendered
live from `--accent`/`--accent-2`.

All gradients are **decorative**: never the sole carrier of meaning, never a work-surface heading
fill. Print drops every gradient to white automatically (and gradient-clipped text prints as solid
`--accent-fill`); forced-colors mode removes them. The contrast gate cannot check text-over-gradient -
the hero meshes' amber zones need a scrim if white text sits directly on them (render-verified).

## Typography ladder

The package styles the heading elements at zero specificity, so a page writes `h1` to `h4` and never
picks a size. Each element maps to one size token:

| Element | Size token | Face | Weight | Leading | Tracking | Where ZHA Sans is allowed |
|---|---|---|---|---|---|---|
| `h1` | `--fs-display` (24 px) | `--font-primary` | 500 | `--leading-heading` | `--tracking-display` | No |
| `h2` | `--fs-h1` (20 px) | `--font-primary` | 500 | `--leading-heading` | `--tracking-body` | No |
| `h3` | `--fs-h2` (16 px) | `--font-primary` | 500 | `--leading-heading` | `--tracking-body` | No |
| `h4` | `--fs-h3` (14 px) | `--font-primary` | 500 | `--leading-heading` | `--tracking-body` | No |
| body | `--fs-body` (13 px) | `--font-primary` | 400 | `--leading-body` (1.2) | `--tracking-body` | No |
| `.prose` | `--fs-reading` (16 px), at most `--measure` (65ch) wide | `--font-primary` | 400 | `--leading-prose` (1.5) | `--tracking-body` | No |
| `.hero > h1` | `--fs-hero-xl` (fluid, 40 to 72 px) | `--font-secondary` (ZHA Sans) | 400 | `--leading-display` | `--tracking-display` | Yes, the one heading that takes it |

In-app headings are `--font-primary` at weight 500, the brand book's type-in-use rule. ZHA Sans
appears only in the lockup and logo, in `.hero > h1` at display size (32 px and up) and in the decks;
it is never set below 24 px and never bold or italic. Aleksander locked this on 2026-09-30, reading the
brand book's "never on the same surface as Neue Haas Unica" as "never mixed within one heading system":
a ZHA Sans display line above a Neue Haas Unica paragraph is the lockup pattern and stays allowed,
while ZHA Sans on a card heading beside Neue Haas Unica section headings is what the rule forbids.
The ladder stops at `h4`; a page that needs a fifth heading level is nested too deeply.

The `--fs-h*` token names are sizes, not elements. They predate the ladder, so `--fs-h1` (20 px) sets
the element `h2` and `--fs-h2` (16 px) sets `h3`. Write the element and let the package choose the
size; reach for a size token only outside a heading, as `.hero > p` does with `--fs-h1`.

## Composition primitives

Layout comes from a small set of classes with one job and one knob each, so a page is composed from
markup and never from inline styles. Each gap has one owner: the parent primitive spaces its children,
so no element carries its own margin and nothing double-spaces when a component moves. Content sets
height: grids `auto-fit` and stretch, so no panel needs a fixed height and nothing clips when the copy
grows.

| Class | Rule | Knob or modifiers |
|---|---|---|
| `.container` | Centres the page column at `--container-w` (72rem by default), keeping the `--gutter` on both sides | `--container-w` (64rem for app pages, `var(--measure)` for reading pages) |
| `.stack` | Vertical flex column; children spaced by `--space-block` | `--stack-gap`; `.stack--tight` (`--space-2`), `.stack--loose` (`--space-section`) |
| `.cluster` | Wrapping row, vertically centred, children spaced by `--space-inline` | `.cluster--between` (space-between), `.cluster--end` (flex-end) |
| `.grid` | Auto-fit columns no narrower than `--grid-min` (16rem), spaced by `--space-block` | `--grid-min` |
| `.section` | Pads `--space-section` above and below; a hairline separates adjacent sections | none; pair it with `.stack` for its children |
| `.split` | Main column plus an aside between 16rem and `--split-aside` (22rem), gap `--space-6` | `--split-aside`; `.split--aside-start` puts the aside first (an analysis panel left of a canvas) |
| `.toolbar` | Wrapping row at `--space-2` with compact 36 px controls | the `--control-h` knob, applied for you |
| `.divider--vertical` | A 20 px vertical hairline, added to `.divider` | inside `.toolbar` and `.cluster` |
| `.form-grid` | Auto-fit grid of `.field`s (16rem minimum), gaps `--space-4` by `--space-5` | `.field--span` for a full-width field |
| `.table-wrap` | Scrolls a wide table sideways inside its own box, so the page never scrolls | pairs with `.data-table--wrap`, which lets cells wrap |
| `.eyebrow` | Mono uppercase label at `--fs-label`, muted | takes `--accent` inside a brand-surface `.hero` |
| `.hero` | Display panel: a ZHA Sans `h1`, a lead `p` and one gradient | `.hero--bleed` (radius 0, sides padded to the container edge; for the full-width landing hero; a page that narrows its column sets the same `--container-w` on the hero) |

Each knob applies to its own primitive only: a nested `.stack` does not inherit its parent's gap or
modifier and sets its own, and the same holds for `--grid-min` on `.grid` and `--split-aside` on
`.split`. Inline `style=` may set only the nine documented knobs: `--container-w`, `--grid-min`,
`--stack-gap`, `--split-aside`, `--control-h`, `--dialog-w`, `--sidebar-w`, `--zha-logo-h` and `--zha-lockup-size`. The
examples' drift guard rejects any other declaration.

`.hero` brings the decks' look to app and landing pages: ZHA Sans at display size, one
gradient, a black field. The blessed markup is `<section class="hero grad-hero-dusk" data-surface="brand">`,
a brand-surface island inside a light page, or `<section class="hero accent-grad-aurora" data-surface="brand">`
for the team wardrobe. Add `.hero--bleed` for the full-width landing hero outside the container; it
pads its sides to the `.container` edge, so the hero text lines up with the column below, and it
drops the panel radius, because a full-bleed panel with rounded corners reads as a mistake. Without a
gradient class on a light work page, `.hero` is a quiet light panel. The eyebrow takes `--accent` only
inside the brand-surface hero, where the token resolves to the render-verified light teal; bare
`--accent` at 11 px on a light surface fails AA, so the eyebrow stays muted everywhere else.

## Rhythm

Vertical rhythm has three tiers, and `data-density="compact"` tightens all three with the same switch
that shrinks the controls:

| Tier | Token | Comfortable | Compact | Owned by |
|---|---|---|---|---|
| Section | `--space-section` | 48 px | 32 px | `.section`, `.stack--loose` |
| Block | `--space-block` | 24 px | 16 px | `.stack`, `.grid` |
| Inline | `--space-inline` | 12 px | 8 px | `.cluster` |

The three tiers alias the numeric scale, so the 4 px grid still holds. `--gutter` sets the page's side
padding at 24 px; `.container` drops it to 16 px (`--space-4`) at 640 px and below, the app bar's
existing breakpoint.

The layout changes at two widths:

- **1024 px and below:** `.split` stacks into one column.
- **768 px and below:** the app shell collapses to one column and the sidebar hides. Setting
  `data-nav-open` on `.app-shell` brings it back as a fixed drawer, `--sidebar-w` wide (240 px, or the
  56 px rail with `data-rail`). Consumer JS toggles the attribute, as it toggles `data-rail`.
  The toggle button carries `.app-bar__nav-toggle`, which the bundle hides while the sidebar is in the
  grid and shows at 768 px and below, so the button is only visible where the drawer exists. At the
  same width `.app-main` padding drops to `--space-4`, `.page-header` wraps and `.hero` tightens its
  padding.

Breakpoints are not tokens because custom properties cannot drive media queries (a `var()` inside
`@media` is invalid CSS), so the two widths are fixed in the stylesheet and recorded here.

## Motion contract

Only the primitives below animate, and anything else that moves on a ZHA page is drift.

| Primitive | Property | Duration | Easing |
|---|---|---|---|
| `.btn` | background, transform (the 1 px press) | `--motion-fast` | `--ease-out` |
| `a.zha-lockup` | team-letter gradient sweep (background-position) on hover and focus | `--motion-base` | `--ease-out` |
| `.card--interactive` | box-shadow, transform (the hover lift) | `--motion-base` | `--ease-out` |
| `.accordion`, `.menu__caret` | chevron rotation | `--motion-base` | `--ease-out` |
| `.dialog` | opacity, with its backdrop | `--motion-base` | `--ease-out` |
| `.menu` | opacity | `--motion-fast` | `--ease-out` |
| `.toast` | entrance (opacity and transform) | `--motion-base` | `--ease-out` |
| `.view-fade` | entrance (opacity and transform), once per view | `--motion-slow` | `--ease-out` |
| `.segmented` | label colour; the checked thumb swaps in place | `--motion-fast` | `--ease-out` |
| `.skeleton` | shimmer (transform), looping | 1.4 s | the browser default |
| `.spinner` | rotation, looping | 0.8 s, 1.5 s under reduced motion | linear |

`--ease-spring` is reserved for the segmented thumb, the one positional move the system allows to
overshoot; the shipped thumb swaps without travel, so no primitive uses the spring today. The rules
behind the table:

- Movement uses `transform` and `opacity` only; colour and shadow may cross-fade on a state change, as
  the button and the interactive card do. Never write `transition: all`.
- Never use `--ease-in` on a state change: it starts slowly, so the interface feels late.
- Run at most one entrance sequence per page: `.view-fade` on the main region, never per card.
- Hover moves only `.card--interactive`; every other hover is a colour change.
- Exits are shorter than enters in consumer sequences; the bundle's own `.dialog` and `.menu` cross-fade
  symmetrically, each on one token.
- Reduced motion is honoured by the bundle: `base.css` cuts every animation and transition to near
  zero, and only the spinner keeps turning, slower, because an indeterminate wait still needs a signal.
  Do not re-add animation under reduced motion.

## Copy

Interface copy names the action, the cause and the next step. The copy rules from
[`skills/zha-ui/SKILL.md`](./skills/zha-ui/SKILL.md) §6 follow, each shown as a before and after:

| Rule | Before | After |
|---|---|---|
| `cta-says-what-happens` | "Submit" | "Save changes", confirmed by a toast that repeats the verb: "Changes saved" |
| `errors-explain` | "Something went wrong" | "The climate file is missing its header row. Re-export it from the Weather tool and upload again." |
| `empty-state-invites` | "No data" | "Models you run appear here with their energy and carbon results." and one "Run model" button |
| `labels-specific` | "Home", "Items" | "Projects", "Reports" |
| `confirm-only-destructive` | A dialog asking "Are you sure?" before every save | Save at once and offer "Undo" in the toast; confirm only "Delete project", naming what is lost |

## States

Every data region has designed loading, empty, error and success states, and each kind of feedback has
one primitive:

| Kind | Primitive | When |
|---|---|---|
| Status | `.badge` with `.dot` and a text label, by intent | the state of one item in a row or tile: running, complete, queued |
| Completion | `.toast` holding an `.alert--success` with `role="status"` | the result of an action someone just took, repeating its verb |
| Warning | `.alert--warning` (or `.alert--info` for a neutral notice), with icon and title | a condition on the page to know before acting |
| Error | `.field__error` with `aria-invalid="true"` on the input; `.alert--error` when a whole region fails | a field that needs a fix, or a load that did not complete |

Loading is `.skeleton` when the shape of the content is known and `.spinner` for an unknown wait.
Empty is `.empty-state`: what the area is for and the one action that fills it. Status never relies on
colour alone, so badges carry text and alerts carry an icon and a title.

Interaction states ship on every control: hover, a 1 px press, the focus ring and a disabled look at
reduced opacity. A selected table row is `aria-selected="true"`, and a sortable header shows its chevron
only for `aria-sort="ascending"` or `"descending"`; `"none"` and `"other"` show none.

## Charts

Chart colour is token-driven, per theme, validated by the contrast gate - never a chart
library's default palette (spec: `docs/specs/2026-07-22-zha-ui-viz-chart-tokens-design.md`).
There are **two categorical jobs; don't conflate them**:

1. **Typology-keyed data** (a bar per building typology, a map coloured by typology): the
   *entity* fixes the hue - use `--typology-<hue>-100/-75/-50/-25` for marks and
   `--typology-<hue>-text` for readable text; direct labels or a table view are mandatory
   (12 fixed hues can't pairwise-clear CVD floors).
2. **Generic series** (sensors, scenarios, cohorts): `--chart-cat-1 … --chart-cat-8`, fixed
   order, assigned in sequence, never cycled, never re-painted when filters change the series
   count. A 9th series folds into `--chart-cat-other` ("Other") or the chart facets. Scatter /
   bubble / choropleth / small multiples carry at most the first 3 slots.

Magnitude wears the sequential ramp `--chart-seq-1..6` (one hue; "more" always reads as more
contrast against the surface, in both themes). Polarity wears the diverging ramp
`--chart-div-neg-3..pos-3` with the neutral `--chart-div-mid` (never a hue at the midpoint).
Status-loaded series (pass/fail, error rates) wear intent tokens, not categorical slots -
never both in one chart. Chart text is always `--chart-text` / `--chart-text-strong` and grid
`--chart-grid` / `--chart-axis`: recessive, ink-coloured, never the series colour. One y-axis
only; a legend is always present for ≥ 2 series (a single series is named by the title);
≤ 4 series may also carry selective direct labels.

## CSS-only / JS boundary

The primitives above are fully operable with CSS + semantic HTML only. The following
interactions require JavaScript and are **intentionally deferred to a future React layer**:

- **Tabs widget** - keyboard management (arrow keys, roving tabindex) cannot be done in CSS alone without accessibility trade-offs.
- **Modal / dialog** - the `.dialog` primitive styles the native `<dialog>`; the element provides focus trapping, `inert` background, Esc, and focus-return for free. The consumer still owns `showModal()`/`close()`, backdrop-click dismissal, and `aria-labelledby` (the labelling JS that cannot be expressed in CSS).
- **Tooltip** - WCAG 1.4.13 requires dismiss on hover-out/focus-out; a CSS-only tooltip cannot satisfy this.
- **Dropdown / popover menu** - the `.menu` primitive styles the native `[popover]` element; the platform provides top-layer rendering, light-dismiss, Esc, and (for native form controls inside) Tab/Space. The consumer still owns anchored positioning and the trigger's `aria-expanded`/`aria-controls`.
- **Sidebar collapse toggle** - the `[data-rail]` attribute ships, but the button that toggles it is consumer JS.

## The token + class vocabulary

Use **only** the published CSS variables and primitive classes. Never invent a
custom property (e.g. `--color-primary`) and never hard-code a hex value in your
app - that is the one rule that keeps output on brand. The complete list lives in:

- [`skills/zha-ui/reference.md`](./skills/zha-ui/reference.md) - the class cheat-sheet and grouped variable list.
- `@gitzhacode/zha-ui-tokens/llms.txt` (the package's `llms.txt` export; on disk at
  `node_modules/@gitzhacode/zha-ui-tokens/dist/llms.txt`) - the canonical
  machine-readable token list (paste into an AI assistant).

Primitive classes: `.surface .card .btn` (+ `--primary/--secondary/--ghost/--danger`)
`.input .select .chip .icon-btn .skeleton .sr-only`, plus the logo/lockup
(`.zha-logo`, `.zha-lockup`).

Spec 2 adds: `.app-shell` (+ `[data-rail]`) `.app-bar` (+ `__brand` / `__spacer`)
`.divider` `.sidebar` `.breadcrumb` `.pagination` `.page-header` (+ `__title` / `__actions`)
`.stat` (+ `__label` / `__value` / `__delta` / `stat__delta--up` / `stat__delta--down`)
`.badge` (+ `--success` / `--warning` / `--error` / `--info` / `.dot`)
`.accordion` (+ `__body`) `.data-table` (+ `.num`) `.field` (+ `__label` / `__help` / `__error`)
`.segmented` `.card--interactive` `.card--accent`
`.alert` (+ `--success` / `--warning` / `--error` / `--info` / `__icon` / `__title`)
`.progress` `.empty-state` (+ `__icon`) `.view-fade`.

Spec 3 adds the composition layer: `.container` `.stack` (+ `--tight` / `--loose`) `.cluster`
(+ `--between` / `--end`) `.grid` `.section` `.split` (+ `--aside-start`) `.toolbar` `.divider--vertical`
`.form-grid` `.field--span` `.table-wrap` `.data-table--wrap` `.eyebrow` `.hero` (+ `--bleed`) `.prose`
`.text-muted` `.card--flush` `.app-bar__nav-toggle`, and the feedback pair `.toast` `.spinner`.

The gradient library adds: `.accent-grad-subtle` `.grad-hero-ember` `.grad-hero-ocean`
`.grad-hero-violet` `.grad-hero-dusk` `.grad-spectrum` `.grad-wash` `.grad-glow`, the team
wardrobe `.accent-grad-aurora` `.accent-grad-conic` `.accent-grad-duo`, plus the 16-entry
signature-form pool `.grad-pair-polar` `-blaze` `-reef` `-nova` `-orchid` `-beacon` `-sundial`
`-prism` `-verdigris` `-borealis` `-nebula` `-abyss` `-furnace` `-signal` `-terra` `-regatta`.

> Type scale tops out at `--fs-display` (24px) for in-app headings. `--fs-hero-xl` (fluid, 40-72px)
> exists for `.hero > h1` only, and `--fs-hero` (32px) is the display step between them, for a display line or
> number outside the heading ladder.

## Which ring are you in?

- **Ring 1 - plain HTML, no build.** `<link>` the hosted `index.css`, set the four
  switches, use the classes. Start here. See `examples/zha-app-vanilla`.
- **Ring 2 - React + Vite.** Move here only when an app needs multiple views/routing
  or shared components. `import '@gitzhacode/zha-ui-css/index.css'`. Same brand, same
  classes - graduating rings never means restyling. See `examples/zha-app-react`.

## Conventions

- The firm is **"ZHA"** - always; never spell out its former name.
- Headings are `--font-primary` at weight 500 (the brand book's rule). ZHA Sans (`--font-secondary`)
  is always regular weight and upright - never bold or italic - and appears only in the lockup and
  logo, in `.hero > h1` (display size, 32 px and up) and in the decks; never below 24 px, never on a
  card or section heading. In the app bar it belongs to the lockup alone.
- Sentence case for headings and body; UPPERCASE only for chip labels and `.eyebrow`.
- For a primary button use `.btn--primary` (AA-safe `--accent-fill`). Never put white
  text on bare `--accent`.
- Each team has an accent **pair**: a primary (`--accent`/`--accent-fill`, the only
  interactive colour) and an expressive secondary (`--accent-2`, gradient/tints only -
  never interactive). The team gradient is `--brand-grad`; apply it via `.accent-grad`
  / `.accent-grad-text` on hero/identity surfaces only, never on work-surface headings.
