# zha-ui - Composition layer (Spec 3) design

**Status:** Implemented 2026-10-01 on feat/composition-layer; render-verified per §9 · **Date:** 2026-09-30 · **Author:** Aleksander Mastalski
**Research base:** [`docs/research/2026-09-30-ui-ux-quality-research.md`](../research/2026-09-30-ui-ux-quality-research.md)
**Builds on:** Spec 1 (tokens, 2026-06-23) and Spec 2 (primitive layer, 2026-06-24). Direction A from the research note, approved 2026-09-30.
**Preview:** rendered 2026-10-01 in `preview/composition/` (the spec's rendering source of truth, per the 2026-07-23 precedent; deleted after the implementation is render-verified). Fourteen findings from that render are folded into sections 5 and 8 below and marked "(preview)".

---

## 1. Purpose

An agent given zha-ui today can colour a page on brand and cannot compose one. This spec adds the
three layers the research identified: a **composition layer** in the CSS package (element typography,
layout primitives, interaction states, phone-width behaviour), a **taste layer** in the guidance
(page anatomy, slugged rules, a ZHA-adapted anti-pattern list, a pre-delivery checklist), and a
**gate** (the drift guard extended to forbid inline layout, plus the render-verify matrix). The three
starters are rebuilt on the new layer so the examples teach composition instead of inline styles.

The measure of success is the same one the stack spec set in June: a designer opens the vanilla
starter, describes an app to an AI editor, and gets a page that reads as ZHA without hand-styling.
Today that page reads as a generic dashboard. After this spec it should read like the brand deck's
sibling: black-first where it is expressive, hairline-quiet where it is working, one bold element,
ZHA Sans only at display size.

## 2. Decisions locked

Aleksander approved direction A on 2026-09-30 with the research note's recommended defaults:

1. **Heading face.** In-app headings (h1-h4) are `--font-primary` (Neue Haas Unica, Inter fallback)
   at weight 500, per the brand book's type-in-use rules. ZHA Sans appears only in the lockup and
   logo, in `.hero > h1` at display sizes (32 px and above), in large display numerals, and in the
   decks. It is never set below 24 px and never bold or italic. I read the brand book's "never on the
   same surface as Neue Haas Unica" as "never mixed within one heading system": a ZHA Sans display
   line above a Neue Haas Unica paragraph is the lockup pattern and stays allowed; ZHA Sans on a
   card heading beside Neue Haas Unica section headings is what it forbids.
2. **Element defaults ship.** `body`, `h1-h6`, `p`, `a`, `strong`, `code`, `hr`, `img` get defaults
   from the package. Every element rule is wrapped in `:where()` so it has zero specificity: any
   consumer rule, including a Vite scaffold's `h1 { … }`, wins without `!important`. That is the opt-out:
   both dogfood apps keep their own element rules unchanged.
3. **Body leading stays 1.2.** It is the brand book's value and the right one for controls, tables and
   labels. A new `--leading-prose: 1.5` and `--measure: 65ch` serve paragraphs, through `.prose`.
4. **Mobile policy.** Internal tools degrade gracefully: no horizontal scroll at 390 px, the app shell
   collapses to a single column with an off-canvas sidebar, tables scroll inside `.table-wrap`.
   Public-facing pages must pass the full 390 px check in the pre-delivery checklist. The stack spec
   already separates the two audiences.
5. **Layout utilities live in the CSS package**, so Ring 1 (plain HTML) gets them. They are the same
   in every ring.

## 3. Scope and non-goals

In scope: ten tokens; one new CSS partial (`type.css`) and additions to `layout.css`, `base.css`,
`content.css`, `feedback.css`, `nav.css`; the drift guard's inline-style rule; the guidance rewrite
across AGENTS.md, DESIGN.md, AI-USAGE.md, README.md and `llms.txt`; the three starters and the
foundation reference; tests for all of it; a changeset per package.

Out of scope, with the trigger that would reopen each: a React component layer (Phase 3, unchanged);
an impeccable-style detector lint over rendered pages (next spec, once the composition classes exist
to detect against); retuning `--fs-body` from 13 px (a separate owner decision; the scale addition
below removes the immediate pressure); hover gating on `(hover: hover)` (touch-first ZHA apps do not
exist yet); animated theme switching (no consumer has asked); ZHA Sans for `.stat__value` (needs a
check that the face has tabular figures); the Neue Haas Unica webfont licence (procurement).

## 4. Tokens (`packages/tokens`)

Ten tokens, all in the existing files, all consumed by the CSS below. None is a colour, so the
contrast gate is untouched.

| Token | Value | File | Role |
|---|---|---|---|
| `--fs-h1` | `20px` | `primitive/scale.tokens.json` (`fs.h1`) | fills the 16 to 24 px gap; the element `h2` size |
| `--fs-hero-xl` | `clamp(2.5rem, 1.5rem + 4vw, 4.5rem)` | `fs.hero-xl` (`$type: other`) | fluid 40 to 72 px display for `.hero > h1` on landing and brand pages |
| `--fs-reading` | `16px` | `fs.reading` | paragraph size for `.prose`; an alias by role, so no one writes `--fs-h2` for body copy |
| `--leading-prose` | `1.5` | `semantic/typography.tokens.json` (`leading.prose`) | paragraph leading; `--leading-body` 1.2 stays for controls and tables |
| `--leading-heading` | `1.15` | `leading.heading` | wrapping headings at 14 to 24 px; `--leading-display` 1.0 stays for hero and stat values |
| `--measure` | `65ch` | `typography.tokens.json` (`measure.DEFAULT`) | maximum line length for text blocks |
| `--space-section` | `48px` comfortable / `32px` compact | `semantic/core.tokens.json` + `density.tokens.json` | vertical rhythm between sections |
| `--space-block` | `24px` / `16px` | same | gap between components in a stack |
| `--space-inline` | `12px` / `8px` | same | gap inside a row of controls or chips |
| `--gutter` | `24px` | `core.tokens.json` (`gutter.DEFAULT`, top level so the name emits as `--gutter`, not `--space-gutter`) | page side padding; the CSS drops it to `--space-4` at 640 px |

The three semantic space tokens alias the numeric scale (`{space.12}`, `{space.6}`, `{space.3}`) so the
4 px grid still holds. Compact density remaps them the way it already remaps `--control-h`, so a
dense tool tightens its rhythm with the same switch that shrinks its controls.

`--focus-ring` stays defined and unchanged for consumers who use it, marked deprecated in `llms.txt`
and AI-USAGE.md; the package's own focus rule stops using it (section 5.4).

Two more small entries: `z.sticky: 10` and `z.toast: 100` (`--z-sticky`, `--z-toast`). Dialogs and
menus are top-layer elements and need no z-index; these two cover the off-canvas sidebar and the
toast, which are the only stacked things the package paints.

**`llms.txt` changes** (`style-dictionary.config.mjs`, format `zha/llms`): emit `--name: value` for
every listed token instead of the bare name, include the `space` and `radius` groups (currently
filtered out, so an agent reading llms.txt alone has never seen `--space-4`), and replace the stale
nine-class line with a pointer: "Primitive classes: see `@gitzhacode/zha-ui-css/classes.txt`
(generated) and AI-USAGE.md (roles)". The CSS build writes `dist/classes.txt` by extracting every
`.class` selector from `primitives.css` and `es-lockup.css`, sorted and de-duplicated. Colour tokens
keep name-only output (their values differ per theme and brand; the roles live in AI-USAGE.md).

## 5. CSS (`packages/css`)

### 5.1 Element defaults - new partial `type.css`

Inserted in `build.mjs` `PARTIALS` directly after `base` (order: base, type, gradient, layout, nav,
content, feedback, overlay, menu). Every element selector is `:where()`-wrapped; the box-sizing rule is bare because pseudo-elements cannot sit inside `:where()`.

```css
*, *::before, *::after { box-sizing: border-box; } /* bare: pseudo-elements cannot sit inside :where(); (preview) a width:100% input plus padding overran its column at 390 px */
:where(html) { font-synthesis-weight: none; -webkit-text-size-adjust: 100%; }
[hidden] { display: none !important; } /* (preview) .stack/.grid display rules defeated the hidden attribute and leaked a hidden view */
:where(body) { margin: 0; min-block-size: 100dvh; background: var(--bg-page); color: var(--text-default);
  font: var(--fs-body) / var(--leading-body) var(--font-primary); letter-spacing: var(--tracking-body);
  -webkit-font-smoothing: antialiased; }
:where(h1, h2, h3, h4, h5, h6, p, figure, blockquote, ul, ol, dl, pre) { margin: 0; } /* layout owns spacing */
:where(h1, h2, h3, h4) { color: var(--text-strong); font-weight: 500; line-height: var(--leading-heading); text-wrap: balance; }
:where(h1) { font-size: var(--fs-display); letter-spacing: var(--tracking-display); }
:where(h2) { font-size: var(--fs-h1); }
:where(h3) { font-size: var(--fs-h2); }
:where(h4) { font-size: var(--fs-h3); }
:where(a) { color: var(--accent-fill); text-decoration: none; }
:where(a:hover) { text-decoration: underline; }
:where(strong, b) { font-weight: 600; }
:where(small) { font-size: var(--fs-small); }
:where(code, kbd, samp, pre) { font-family: var(--font-mono); font-size: 0.92em; }
:where(pre) { overflow-x: auto; } /* (preview) a 68-character install line broke a 16rem grid cell */
:where(hr) { border: 0; block-size: 1px; background: var(--border-subtle); }
:where(img, video, canvas) { max-inline-size: 100%; block-size: auto; }
:where(button, input, select, textarea) { font: inherit; color: inherit; }
:where(table) { border-collapse: collapse; }
```

`font-synthesis-weight: none` is the mechanical enforcement of "ZHA Sans is never bold": a stray
`<strong>` inside the lockup can no longer synthesise a faux-bold. Inter's real weights are
unaffected. Style synthesis stays on because the bundle ships no Inter italic and the base.css comment
already accepts synthesised oblique for rare italics.

`svg` is deliberately absent from the media rule: `block-size: auto` would override the `height`
attribute on inline icon SVGs.

The heading ladder maps elements to the existing size tokens, whose names are historical (`--fs-h2` is
16 px, used by the element `h3`). `h5` and `h6` keep the body size and take only the shared colour
and weight, because a page that needs a fifth heading level needs restructuring. DESIGN.md carries the table; agents write `h1` to `h4` and the package sets the size.

### 5.2 `.prose` (in `type.css`)

```css
.prose { max-inline-size: var(--measure); font-size: var(--fs-reading); line-height: var(--leading-prose); }
.prose > * + * { margin-block-start: var(--space-4); }
.prose > :where(h2, h3) { margin-block-start: var(--space-8); }
.prose :where(ul, ol) { padding-inline-start: 1.25em; }
.prose a { text-decoration: underline; }
.text-muted { color: var(--text-muted); } /* (preview) the one text utility: a secondary line without a hand-rolled style */
```

Links inside running text are always underlined (WCAG 1.4.1: colour alone is not a link cue in a
paragraph); links in navigation and controls keep the hover-underline default.

### 5.3 Composition primitives (`layout.css`)

Each one has a single job and one knob, in the `--control-h` tradition. The knob is the only inline
style an agent may write (section 7).

| Class | Rule | Knob / modifiers |
|---|---|---|
| `.container` | `inline-size: min(100% - 2 * var(--gutter), var(--container-w)); margin-inline: auto;` default `--container-w: 72rem` | `--container-w` (64rem for app pages, `var(--measure)` for reading pages) |
| `.stack` | `display: flex; flex-direction: column; gap: var(--stack-gap, var(--space-block));` | `.stack--tight` (`--space-2`), `.stack--loose` (`--space-section`) |
| `.cluster` | `display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-inline);` | `.cluster--between` (space-between), `.cluster--end` (flex-end) |
| `.grid` | `display: grid; gap: var(--space-block); grid-template-columns: repeat(auto-fit, minmax(min(var(--grid-min, 16rem), 100%), 1fr));` | `--grid-min` |
| `.section` | `padding-block: var(--space-section);` and `.section + .section { border-block-start: 1px solid var(--border-subtle); }` | none; a section is a `.stack` inside |
| `.split` | `display: grid; grid-template-columns: minmax(0, 1fr) minmax(16rem, var(--split-aside, 22rem)); gap: var(--space-6);` | `--split-aside`; `.split--aside-start` puts the aside first (analysis panel left of a canvas) |
| `.toolbar` | `display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2); --control-h: 36px;` | scoped compact controls, the sanctioned knob applied for you |
| `.divider--vertical` | `inline-size: 1px; block-size: 20px; margin: 0 var(--space-1);` | inside `.toolbar` and `.cluster` |
| `.form-grid` | `display: grid; gap: var(--space-4) var(--space-5); grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));` | `.field--span` (`grid-column: 1 / -1`) for full-width fields |
| `.table-wrap` | `overflow-x: auto; max-inline-size: 100%;` | pairs with `.data-table--wrap` (`white-space: normal` on cells); (preview) that rule lives in `content.css` directly after the `nowrap` rule it overrides, since equal specificity makes source order decide |
| `.eyebrow` | `font: 500 var(--fs-label) / 1 var(--font-mono); letter-spacing: .12em; text-transform: uppercase; color: var(--text-muted);` | inside a brand-surface `.hero` it takes `color: var(--accent)` |
| `.hero` | see below | `.hero--bleed` (radius 0, for the full-width landing hero outside the container) |

```css
.hero { display: flex; flex-direction: column; gap: var(--space-5); padding: var(--space-16) var(--space-8);
  border-radius: var(--radius-l); background-color: var(--bg-surface-1); color: var(--text-default); }
  /* (preview) background-COLOR, not the shorthand: the gradient classes set background-image in an earlier partial, and the shorthand would reset it to none */
.hero--bleed { border-radius: 0; } /* (preview) a full-bleed panel with rounded corners reads as a mistake */
.hero > h1 { font: 400 var(--fs-hero-xl) / var(--leading-display) var(--font-secondary); letter-spacing: var(--tracking-display);
  color: var(--text-strong); max-inline-size: 18ch; text-wrap: balance; }
.hero > p:where(:not(.eyebrow)) { font-size: var(--fs-h1); color: var(--text-muted); max-inline-size: var(--measure); }
.hero .eyebrow:where([data-surface="brand"] *) { color: var(--accent); }
  /* (preview) the brand attribute sits ON the hero in the blessed markup; a descendant combinator never matched it */
```

`.hero` brings the decks' visual language into app and landing pages: ZHA Sans at real display size, one
gradient, black field. The blessed markup is `<section class="hero grad-hero-dusk" data-surface="brand">`
(a brand-surface island inside a light page; the token cascade already scopes on the element) or
`<section class="hero accent-grad-aurora" data-surface="brand">` for the team wardrobe. On a light
work page without a gradient class it is a quiet light panel. The eyebrow's accent colour is the
deck's render-verified teal-on-black; on the brand surface `--accent` resolves to the light teal
variant, and on a light surface bare `--accent` at 11 px would fail AA, which is why the rule is
scoped to the brand-surface hero and the eyebrow stays muted everywhere else.

### 5.4 Focus ring (`base.css`)

Replace the global rule with an outline: it is not clipped by `overflow: hidden`, it follows the
element's own radius, it survives forced-colours mode, and it no longer overrides the segmented thumb
or the card lift while focused.

```css
:focus-visible { outline: 2px solid var(--accent-fill); outline-offset: 2px; }
.input:focus-visible, .select:focus-visible { outline-offset: 0; border-color: var(--accent-fill); }
.segmented label:has(:focus-visible) { outline: 2px solid var(--accent-fill); outline-offset: 2px; }
```

`--accent-fill` is already gate-checked at 3.0 against every surface, so the ring clears WCAG 2.2
non-text contrast on light, dark and brand by construction.

### 5.5 Interaction states

Hover on the two filled buttons lightens on dark and darkens on light with one rule, because
`--text-strong` is white on dark surfaces and near-black on light:

```css
.btn { white-space: nowrap; transition: background var(--motion-fast) var(--ease-out), transform var(--motion-fast) var(--ease-out); } /* (preview) "New model" wrapped to two lines in a 390 px bar */
.card { padding: var(--space-5); } .card--flush { padding: 0; } /* (preview) with inline styles banned, nothing else can pad a card; flush is for media and table cards */
.btn--primary:hover { background: color-mix(in srgb, var(--accent-fill) 88%, var(--text-strong)); }
.btn--danger:hover  { background: color-mix(in srgb, var(--intent-error) 88%, var(--text-strong)); }
.btn:active, .icon-btn:active, button.chip:active, .tabs__tab:active, .pagination button:active { transform: translateY(1px); }
.btn:disabled, .icon-btn:disabled, button.chip:disabled, .tabs__tab:disabled, .input:disabled, .select:disabled { opacity: .45; cursor: default; }
.input:hover, .select:hover { border-color: var(--border-strong); }
button.chip:not([aria-pressed="true"]):not(.is-active):hover { border-color: var(--border-default); } /* (preview) the bare hover outranked the pressed state and stripped its accent border */
.accordion summary:hover { background: var(--bg-surface-2); }
.data-table tbody tr[aria-selected="true"] { background: var(--accent-subtle); }
.data-table th[aria-sort] button::after { content: ""; inline-size: 6px; block-size: 6px; margin-inline-start: var(--space-1);
  border-inline-end: 2px solid currentColor; border-block-end: 2px solid currentColor; transform: rotate(45deg); } /* same chevron construction as .accordion summary::after */
.data-table th[aria-sort="ascending"] button::after { transform: rotate(-135deg); }
.menu__item:disabled, .menu__item:has(:disabled) { opacity: .45; cursor: not-allowed; } /* was .4; one disabled value across the package; (preview) the shipped rule is the :has() label form */
```

The consumer-facing rule "never derive hover colours" stands: the package derives them once, per
theme, and the render-verify matrix checks the result because the gate cannot.

### 5.6 Responsive behaviour

Two breakpoints, documented in DESIGN.md because custom properties cannot drive media queries:
**1024 px** (narrow: `.split` stacks) and **768 px** (phone: the shell collapses). `.container` drops
its gutter at 640 px, matching the app bar's existing breakpoint.

```css
@media (max-width: 1024px) { .split { grid-template-columns: 1fr; } }
@media (max-width: 768px) {
  .app-shell { grid-template-columns: minmax(0, 1fr); grid-template-areas: "header" "main"; } /* (preview) a bare 1fr took the bar's min-content width and pushed the shell to 405 px */
  .app-shell > .sidebar { display: none; }
  .app-shell[data-nav-open] > .sidebar { display: flex; position: fixed; inset-block: var(--app-bar-h) 0; inset-inline-start: 0;
    inline-size: var(--sidebar-w); z-index: var(--z-sticky); box-shadow: var(--shadow-high); }
  .app-shell > .app-main { padding: var(--space-4); }
  .page-header { flex-wrap: wrap; }
  .hero { padding: var(--space-10) var(--space-5); }
}
@media (max-width: 640px) { .container { --gutter: var(--space-4); } .app-bar { gap: var(--space-2); } } /* (preview) lockup + three icon buttons + the primary fit a 390 px bar only at the tighter gap */
```

`data-nav-open` follows the `data-rail` precedent: the attribute is the contract, the toggle button is
consumer JS. The React starter ships the toggle so there is a worked example.

### 5.7 Feedback additions (`feedback.css`)

```css
.alert__title { display: block; } /* was inline: the title ran into the body text */
.toast { position: fixed; inset-block-end: var(--space-6); inset-inline-end: var(--space-6); z-index: var(--z-toast);
  inline-size: min(100% - 2 * var(--space-4), 24rem); animation: zha-view-fade var(--motion-base) var(--ease-out); }
.toast > .alert { box-shadow: var(--shadow-high); }
.spinner { display: inline-block; inline-size: 1.25em; block-size: 1.25em; border: 2px solid var(--border-subtle);
  border-block-start-color: var(--accent-fill); border-radius: var(--radius-pill); animation: zha-spin .8s linear infinite; }
@keyframes zha-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 1.5s !important; animation-iteration-count: infinite !important; } } /* slower, not frozen; (preview) base.css also forces iteration-count 1, so it must be restated */
```

A toast is `<div class="toast"><div class="alert alert--success" role="status">…</div></div>`; the JS
that inserts and removes it is the consumer's, the same boundary as `.dialog`. The spinner exemption
sits after base.css's global reduced-motion rule and wins on specificity.

### 5.8 Tidy, folded in

`.app-bar__app` line-height goes from `1` to `1.3` (preview, reported by Aleksander: with
`overflow: hidden` for the ellipsis, a line box of exactly 1em clips the descenders of "Energy
Studio"; baseline alignment with the lockup is unchanged, verified at 39.27 px for both). Merge the
two `@media print` blocks in `base.css`; `.dialog__title` tracking `--tracking-label` becomes
`--tracking-body` (it is a 16 px heading, not a label); the literal `8px`/`16px`/`12px` in `.btn` and
`.input` become `--space-2`/`--space-4`/`--space-3` (identical values, so no visual change; `.chip`'s
6 px and 10 px have no token and stay). `.app-bar__brand`'s regular ZHA Sans fallback stays: the
2026-07-17 code review restored it on purpose after a consumer's bare-text `h1` went extrabold.

## 6. Guidance

The guidance splits by job, the two-file pattern the landscape survey (research note §5.2) found:
AGENTS.md says **how** to build a page (rules, recipes, checklist), AI-USAGE.md says **what** exists
(the vocabulary), DESIGN.md says **why** (the human rationale). AGENTS.md's current class dump moves
to AI-USAGE.md, which already holds it, so AGENTS.md ends near its present length.

### 6.1 AGENTS.md - new sections

**Compose a page.** Page anatomy, then three recipes as blessed markup skeletons:

- *App page* (Ring 2 dashboard, the React starter): `.app-shell` > `.app-bar` (canonical) + `.sidebar`
  + `.app-main` > `.page-header` (h1 + at most two actions, one primary) > optional `.tabs` or
  `.toolbar` > `.stack` of content: a `.grid` of `.stat` tiles when the numbers are the point, then the
  `.table-wrap > .data-table` or the `.split` canvas-and-panel.
- *Tool page* (Ring 1, the vanilla starter): `.container.stack` > optional `.hero` island >
  `.section` with `.form-grid` of `.field`s and a `.cluster--end` of actions > `.section` with results
  (`.table-wrap` or `.grid` of `.stat`) > `.divider` + footer `.cluster--between` with the lockup.
- *Landing page* (the examples hub): `.hero` full width, then `.container` > `.section`s each a
  `.stack` with an `h2`, an optional `p.prose`, and a `.grid` of `.card`s or `.card--interactive`s.

**Rules**, one line each, slugged so a review can cite them.

The layout and hierarchy rules:

- `one-primary-action`: one `.btn--primary` per view; every other action is secondary or ghost.
- `hierarchy-without-weight`: hierarchy comes from size, `--text-*` intensity, space and position;
  weight only on `--font-primary` (500 headings, 600 strong); ZHA Sans never bold, never below 24 px.
- `card-by-role`: a `.card` marks a separate object (selectable, navigable, or truly detached). Group
  with `.stack`, `.section` and hairlines first; never nest cards; never chop a page into identical cards.
- `one-bold-element`: each page has one expressive element (a hero mesh, a wardrobe gradient, one
  display-size number); everything else is quiet.
- `structure-is-information`: eyebrows, dividers, accent stripes, badges and numbering each state a
  fact; no eyebrow above every heading; no 01/02/03 unless the content is a sequence.
- `gap-has-one-owner`: spacing comes from `.stack`, `.cluster`, `.grid`, `.section` and the three
  tiers (`--space-section` 48, `--space-block` 24, `--space-inline` 12); never per-element margins;
  inline `style=` only to set a documented knob (the allowlist in section 7, mirrored in DESIGN.md).
- `align-to-shared-edges`: everything sits on the container's edges; a stat row, a table and a form on
  the same page are the same width.
- `content-sets-height`: no fixed heights; grids `auto-fit` and fill; pick a column count the items fill.
- `measure`: running text inside `.prose` or under `--measure`; hero titles under 18 characters a line.
- `heading-ladder`: one `h1` per page (24 px, `--font-primary`), `h2` sections (20), `h3` cards (16),
  `h4` (14). ZHA Sans only in `.hero > h1`, the lockup and logo. Never `.accent-grad-text` on a work surface.
- `numbers`: `tabular-nums` in columns and tiles (`.num`, `.stat__value`), units via `.th-unit`.
- `left-aligned`: text is left-aligned; centre only `.empty-state` and a hero by choice.
- `density-deliberate`: choose `data-density` per app; `.toolbar` is compact by scope; never invent a
  smaller control.
- `responsive-floor`: internal apps: no horizontal scroll at 390 px, tables inside `.table-wrap`,
  shell collapses; public pages: the full 390 px check.

The copy and label rules:

- `cta-says-what-happens`: "Save changes", "Run model", never "Submit" or "OK"; the same verb through
  the flow; the result confirmed in a toast that repeats it ("Model saved").
- `errors-explain`: cause and fix, no apology; inline under the field (`.field__error` +
  `aria-invalid`), validated on blur, the first invalid field focused on submit.
- `empty-state-invites`: what this area is for and the one action that fills it.
- `labels-specific`: navigation names the thing ("Projects", "Reports"), not "Home".
- `confirm-only-destructive`: a confirmation dialog only for irreversible actions; prefer undo.

The state, icon and motion rules:

- `every-view-has-states`: loading (`.skeleton` for a known shape, `.spinner` for an unknown wait),
  empty, error and success are designed, not left to chance.
- `status-never-colour-alone`: `.badge` with `.dot` and text; alerts carry icon and title.
- `icons-stroke-only`: inline stroke SVGs at 16, 20 or 24 px in `currentColor`; no emoji, no solid glyphs.
- `motion-contract`: transform and opacity only; `--ease-out` for enters and exits, `--ease-spring`
  only for the segmented thumb, never `--ease-in` on a state change; at most one entrance sequence per
  page (`.view-fade` on the main region, never per card); hover animates only `.card--interactive`;
  never `transition: all`; never `scale(0)`; exits shorter than enters; reduced motion is honoured by
  the bundle, do not re-add animation under it.

**Not ZHA** (the anti-pattern list, adapted so the agent does not over-correct):

Blessed, do not remove: black-first surfaces, hairline dividers, mono eyebrows on hero and brand
panels, the gradient wardrobe on hero and identity surfaces, one aurora panel per page.
Banned: an eyebrow above every heading; identical rounded cards chopping a dashboard; nested cards;
everything centred; an arrow appended to link or button text; middle-dot meta strings; 01/02/03
without a sequence; a gradient on a work-surface heading or as a button fill; fade-up on every
section or lift on every card; emoji or solid-glyph icons; bold or italic ZHA Sans, or ZHA Sans under
24 px; inline layout styles; shadows for passive depth; a placeholder used as a label; a second
`.btn--primary` in view; invented variables or literal hex (the existing hard rule).

**Before you ship**, ten lines the agent runs before reporting done:

1. Drift guard passes: no invented classes or variables, no hex, no inline style beyond knobs.
2. One `h1`; headings descend in order; ZHA Sans only where allowed.
3. One primary action per view.
4. Every gap has an owner (`.stack`, `.cluster`, `.grid`, `.section`).
5. Rendered in light and dark (and brand if used).
6. At 390 px: no horizontal scroll; tables wrapped; the shell collapses.
7. Keyboard: the focus ring is visible on every control; dialogs and menus are the native primitives.
8. Loading, empty and error states exist for every data region.
9. CTAs say what happens; errors say cause and fix.
10. At most one entrance sequence; nothing else animates on load.

### 6.2 DESIGN.md - new sections

Typography ladder (element, size token, face, leading, tracking, where ZHA Sans is allowed);
Composition primitives (the 5.3 table with the reasoning: one owner per gap, content sets height);
Rhythm (the three space tiers, the gutter, the two breakpoints and why they are not tokens); Motion
contract (a table per primitive: property, duration token, easing token); Copy (the five copy rules
with a before/after each); States (the four feedback kinds mapped to `.alert`, `.badge`, `.toast`,
`.field__error`). The "Naming and type rules" paragraph is corrected to the locked heading-face
decision, and the "Depth" section gains one line: the focus ring is an outline, not a shadow, so it
is never confused with elevation.

### 6.3 AI-USAGE.md, README.md, `llms.txt`

AI-USAGE.md gains the new classes and variables in its lists and cheat-sheet, marks `--focus-ring`
deprecated, and receives the class dump removed from AGENTS.md. README's "What you get" adds
composition and states. `llms.txt` changes per section 4.

## 7. Gate: the drift guard

`examples/_drift-guard.mjs` gains one rule: an inline `style` attribute may contain only custom
property declarations (`--name: value;`), each name from the knob allowlist (`--container-w`,
`--grid-min`, `--stack-gap`, `--split-aside`, `--control-h`, `--dialog-w`, `--sidebar-w`,
`--zha-logo-h`, `--zha-lockup-size`). Any other declaration fails with the file, line and the offending property. This is
the mechanical form of `gap-has-one-owner` and the reason the rebuilt examples cannot regress to
inline layout. The hub and the foundation reference join the guard's coverage through
`drift-guard.test.mjs`, which is what would have caught the `--fs-h1` bug.

## 8. Examples

- **`zha-app-vanilla`** becomes the *tool page* recipe: `.container.stack`, a `.hero` island on
  `.grad-hero-dusk` with eyebrow, h1, p and a `.cluster` of two actions; a `.section` with a
  `.form-grid` of real `.field`s (labels, help, one `aria-invalid` error) and a `.cluster--end` of
  actions; a `.section` with a `.grid` of `.stat`s and a `.table-wrap > .data-table` of results with
  `.badge` statuses; four alerts with inline stroke SVG icons; `.divider` and a footer
  `.cluster--between`. Zero `style=` outside knobs. The stray back link leaves the app bar and goes
  into the footer, which fixes the 390 px collision.
- **`zha-app-react`** becomes the *app page* recipe: `.app-shell` with `.sidebar` (stroke icons,
  `aria-current`), the canonical `.app-bar` with a phone-width nav toggle driving `data-nav-open`,
  `.app-main` > `.page-header` (h1, one `.btn--primary` that opens a `.dialog` form) > `.tabs`
  switching two views by state (no router dependency): Overview with a `.grid` of `.stat`s and a
  sortable, selectable `.data-table` with `.pagination` and a `.menu` filter; Projects with a
  `.skeleton` load, then an `.empty-state`. Saving from the dialog shows a `.toast`. Components stay
  small and named (`Stat`, `DataTable`, `ProjectDialog`), so the file teaches boundaries.
- **`examples/index.html`** (hub) becomes the *landing page* recipe: `.hero` on `.grad-hero-dusk`
  with a giant `.zha-lockup` (the 2026-07-16 hero-hybrid fix), `.section`s of `.grid`s; the
  `--fs-h1` hack and the `<style>` layout block go.
- **`foundation-reference`** adds section 26, Composition: every element default and the heading
  ladder, each composition primitive with its knob, the state matrix (rest, hover, active, focus,
  disabled) for every control, the toast and spinner, and a 390 px note. Small ZHA Sans headings in
  the reference move to the primary face.
- The four decks are untouched; they are presentation surfaces with their own clamp scale.
- (preview) The three preview pages (`preview/composition/tool-page.html`, `landing-page.html`,
  `app-page.html`) are the starting material for the three rebuilds above: the implementation moves
  their markup into the examples (the app page becomes JSX) and deletes the folder.

## 9. Tests and gates

- `packages/tokens/test/build-output.test.ts`: the ten tokens and two z-index tokens emit with the
  expected values; compact density remaps the three space tiers; `llms.txt` carries values and the
  `space`/`radius` groups.
- `packages/css/test/exports.test.ts`: one regex test per new class and state, plus: `:where(body)`
  present, no element selector outside `:where()` in `type.css`, `:focus-visible` uses `outline` and
  not `box-shadow`, `.btn--primary:hover` exists, an `:active` rule exists, `.alert__title` is
  `display: block`, the 768 px query collapses `.app-shell`, `dist/classes.txt` exists and contains
  `.stack`; (preview) `box-sizing: border-box` and `[hidden]` rules present, `.card` has padding and
  `.card--flush` resets it, `.hero` uses `background-color` and never the shorthand.
- `examples/drift-guard.test.mjs`: the inline-style rule accepts a knob and rejects `style="padding:…"`;
  the hub and the foundation reference pass the guard.
- `pnpm build` (contrast gate unchanged, must stay green), `pnpm test`, `pnpm lint`.
- **Render-verify matrix**, the gate the tokens cannot run: the three starters at 1440 and 390 px in
  light, dark and brand (vanilla and hub), plus the foundation reference section 26 at 1440 in light
  and dark. Twenty screenshots, checked by eye for: focus ring on every control, hover on the filled
  buttons in both themes, the hero on the dark floor, the shell collapse with `data-nav-open`, no
  horizontal scroll.

## 10. Versioning and consumer impact

Both packages bump to **0.1.3**, a patch number although the release changes defaults. Visible changes for the two dogfood
apps: the focus ring becomes an outline; `.alert__title` becomes a block; `.card` gains default
padding (apps that pad cards themselves get double padding until they delete theirs, or add
`.card--flush`); `box-sizing: border-box` becomes the default; element defaults apply
wherever their own CSS does not cover an element (zero specificity, so anything they style already
wins); `--focus-ring` is deprecated but still defined. Consumer notes go in
`docs/tickets/2026-09-30-consumer-notes-0.1.3.md`, with the three things each app can delete
(hand-rolled container, stack margins, focus overrides) and the one thing each should add
(`.table-wrap` around wide tables).

## 11. Sequencing for the plan

1. Tokens and `llms.txt` (section 4) with tests.
2. `type.css`, `.prose`, build order (5.1, 5.2) with tests.
3. Composition primitives and responsive rules (5.3, 5.6) with tests.
4. Focus, states, feedback, tidy (5.4, 5.5, 5.7, 5.8) with tests; `classes.txt` in the build.
5. Drift guard rule and coverage (7).
6. Guidance rewrite (6).
7. Examples: vanilla, hub, foundation reference, React (8).
8. Changesets, consumer notes, PLAN.md; render-verify matrix; final whole-branch review.

Steps 1 to 5 are independent of 6 and 7 except that the examples need the CSS. The React starter is
the largest single task and the one that needs a design judgement per screen; it goes last.

## 12. Amendments (2026-10-02, fix-later pass)

The whole-branch review of 2026-10-01 deferred nineteen minor findings, and
`docs/plans/2026-10-02-composition-layer-fix-later.md` applies them on the same branch. Where the CSS now
differs from the blocks above, the CSS is authoritative:

- §5.2: `.prose > * + :where(h2, h3)` carries the heading gap, so a heading that opens the block has no space
  above it.
- §5.3: `.hero`'s `background-color` moved to `:where(.hero)`, so an aurora class's own ink floor wins;
  `.app-bar__nav-toggle` is added (hidden, then `inline-flex` at 768 px and below) for the phone drawer's button.
- §5.5: every control hover carries `:where(:not(:disabled))`; the sort chevron rule exempts `.icon-btn` and
  `[class*="btn--"]` through `:where()`.
- §5.6: the `.page-header { flex-wrap: wrap }` phone rule lives in `nav.css` beside its base rule.
- §5.7: `.alert__icon` is 16 px, the inline step of the icon rule (it was 18); the print block hides `.toast`.
- §7: the `style=` attribute match has a word boundary and accepts spaces around `=`; the JS-built prefix skip
  applies inside `<script>` only.
- §10: its pointer and counts are superseded. The consumer notes are
  `docs/tickets/2026-10-01-consumer-notes-0.1.3.md` (not 2026-09-30), and they list four deletions and three additions.
- §5.1: the block shows the colour and weight rule for `h1` to `h4` only. `type.css` gives `h1` to `h6` the shared
  colour and weight and sets `h5` and `h6` to `font-size: 1em` (2026-10-01 ruling R14).

## 13. Amendments (2026-10-06, agent-first pass)

`docs/specs/2026-10-06-zha-ui-agent-first-pass-design.md` and its plan change the layer as follows; where the CSS now differs from the blocks above, the CSS is authoritative:

- §5.3: `.hero--bleed` declares `--container-w: 72rem` and pads to `max(var(--gutter), (100% - var(--container-w)) / 2)`, the `.container` edge; the 768 px hero padding applies its inline part to `.hero:where(:not(.hero--bleed))` only, and the 640 px gutter drop reaches `.hero--bleed`.
- §5.5: `.btn[aria-disabled="true"]` and `.icon-btn[aria-disabled="true"]` take the disabled value with `pointer-events: none`; `.chip__remove` joins the disabled list and its hover carries the guard.
- §5.6: `.skip-link` ships in `nav.css` (sr-only until `:focus-visible`); the app bar is opaque under `prefers-reduced-transparency`; the sidebar current-page bar and the badge dot keep system colours under `forced-colors`.
- §6: the guidance moved: skeletons, rules, anti-patterns, checklist and type rules live in `skills/zha-ui/SKILL.md`, the vocabulary in `skills/zha-ui/reference.md` (the former AI-USAGE.md); AGENTS.md keeps the repo-specific part and points at the skill. Ring 1 links the installed package's `dist/index.css`; the `<pages-host>` placeholder is gone.
- §7: the React starter runs the guard through `jsxToMarkup()`; negative CSS tests fail when their block is missing.
- §4: `llms.txt` marks `--focus-ring` deprecated.
- §12: the consumer notes now list four additions, the skip link joining the three recorded there.

## 14. Amendment (2026-10-06, release number; text updated 2026-10-07)

The branch shipped as 0.1.3, a patch on the 0.1 line, at the maintainer's decision on 6 October; this spec had first planned a minor release. On 7 October the version numbers in this spec, the 2026-10-06 agent-first spec and the three plans of this branch were updated to 0.1.3, and the consumer notes moved to `docs/tickets/2026-10-01-consumer-notes-0.1.3.md`.
