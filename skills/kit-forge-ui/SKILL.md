---
name: kit-forge-ui
description: Build or restyle a kit-forge web app with the kit-forge-ui design system. Installs the kit-forge-ui CSS from git, sets the html switches, composes pages from the layout classes and uses only kit-forge-ui classes and tokens. Use for any kit-forge module that needs UI, styling, layout, colour, type, a page skeleton or a design check.
compatibility: Claude Code, Codex, Cursor, GitHub Copilot and any agent that reads the Agent Skills format
metadata:
  source: "https://github.com/Cybernaut0815/kit-forge_UI-template/tree/main/skills/kit-forge-ui"
  version: "0.1.0"
---

# kit-forge-ui

You are building a kit-forge web app on kit-forge-ui: sharp corners, Geist type, a warm ramp from orange over red to purple. Attributes on `<html>` resolve colour, type, space and state; you declare them, compose the page from the layout classes and never style by hand. Read [reference.md](reference.md) beside this file before writing markup.

## 1. Install and load once

```jsonc
"dependencies": { "kit-forge-ui": "github:Cybernaut0815/kit-forge_UI-template#v0.1.0" }
```

There is no build: the package is its `css/` folder. Load it once, before the app's own CSS:

- With a bundler (Vite, Next): `import 'kit-forge-ui';` in the entry file.
- Plain HTML: `<link rel="stylesheet" href="./node_modules/kit-forge-ui/css/kit-forge-ui.css">`. Fonts resolve relative to that file.

Pin a tag so an update never silently changes the page. If the project started from a Vite template, delete its element-level `button`, `a` and `input` CSS first: the primitives own control paint. Then add one line to the project's `AGENTS.md` or `CLAUDE.md`: `Use the kit-forge-ui skill for every UI change; never style by hand.`

**Restyling an existing app:** load the CSS before the app's stylesheet, set the switches, delete the scaffold's control paint, replace hand-written colours, fonts and spacing page by page (app bar first), move charts to `--chart-*`, delete the old stylesheet last, then run §7 on every page.

## 2. Declare the identity on `<html>`

```html
<html lang="en" data-theme="light" data-density="compact">
```

| Attribute | Options | Meaning |
|---|---|---|
| `data-theme` | `light` (default) · `dark` | Surfaces, text and fills flip together |
| `data-surface` | `brand` | Black-first presentation surface in both themes; wins over `data-theme` on the same element. Leave it off for work surfaces |
| `data-density` | `compact` | Controls and rows 44 → 36 px for dense tools |
| `data-accent` | `orange` · `purple` | Red is the default when absent |

Set them once; everything inside inherits. An island escapes by carrying its own `data-theme` (a light card on a brand deck: `<div class="card" data-theme="light">`). Put `data-accent` on `<html>`, or on an element that also carries `data-theme`.

## 3. The one hard rule

Use only kit-forge-ui classes and variables. Never invent a custom property, never write a hex, rgb or named colour, never write layout in a `style` attribute. The only inline styles allowed are the seven knobs: `--container-w --grid-min --stack-gap --split-aside --control-h --dialog-w --sidebar-w`. Corners are square by design: never add `border-radius`; to soften a whole app set `--radius` once on `<html>`. Elements carry their defaults: write `h1`-`h4`, `p`, `a`, `strong`, `code`, `pre`, `hr` and `img` without classes.

## 4. Compose a page

Every region has one owner for its gaps, so the markup needs no inline layout.

**App page** (a tool someone operates across views):
```html
<a class="skip-link" href="#main">Skip to content</a>
<div class="app-shell">
  <header class="app-bar">
    <a class="app-bar__brand" href="/">kit-forge<span class="app-bar__app">Parcel generator</span></a>
    <span class="app-bar__spacer"></span>
    <!-- .icon-btn--ghost actions; .app-bar__nav-toggle for the phone drawer; one .btn--primary -->
  </header>
  <nav class="sidebar" aria-label="Main">…<a href="…" aria-current="page">…<span>Runs</span></a>…</nav>
  <main class="app-main stack" id="main">
    <header class="page-header"><h1 class="page-header__title">Runs</h1><div class="page-header__actions">…</div></header>
    <div class="toolbar">…</div>
    <div class="grid" style="--grid-min: 11rem"><div class="stat">…</div></div>
    <div class="table-wrap"><table class="data-table">…</table></div>  <!-- or a .split canvas + panel -->
  </main>
</div>
```

**Tool page** (one form and its results, plain HTML):
```html
<a class="skip-link" href="#main">Skip to content</a>
<main class="container stack" id="main">
  <section class="hero grad-aurora" data-surface="brand"><p class="eyebrow">…</p><h1>…</h1><p>…</p></section>  <!-- optional -->
  <section class="section stack"><h2>New run</h2><form class="form-grid" id="f">…</form>
    <div class="cluster cluster--end"><button class="btn btn--ghost" type="button">Save draft</button><button class="btn btn--primary" form="f">Start run</button></div></section>
  <section class="section stack"><h2>Results</h2><div class="table-wrap"><table class="data-table">…</table></div></section>
</main>
```

**Deck or landing page:** `<html data-theme="dark" data-surface="brand">`, a `.hero.hero--bleed` with one gradient, then `.section`s of `.grid` cards. `examples/deck.html` is the reference deck.

## 5. Rules

Each rule has a slug so a review can cite it.

- `one-primary-action`: one `.btn--primary` per view; everything else secondary or ghost.
- `danger-is-outlined`: destructive actions use `.btn--danger` (outlined); never a filled red button for anything but the primary.
- `skip-link`: the first element in `<body>` is the skip link; `<main>` carries `id="main"`.
- `sharp`: square corners everywhere; no per-component `border-radius`, no pills.
- `hierarchy-without-weight`: hierarchy comes from size, `--text-*` intensity, space and position; headings 600, body 400.
- `card-by-role`: a `.card` is a separate object; group with `.stack`, `.section` and hairlines first; never nest cards.
- `one-bold-element`: one expressive element per page (a hero gradient, one display number); the rest is quiet.
- `gradients-decorate`: gradients only on heroes, decks and identity; work surfaces get `.grad-wash` or `.grad-glow`; never a gradient heading on a work surface or a gradient button.
- `gap-has-one-owner`: spacing comes from `.stack`, `.cluster`, `.grid`, `.section` and the tiers (`--space-section` 48, `--space-block` 24, `--space-inline` 12); never per-element margins.
- `align-to-shared-edges`: a stat row, a table and a form on one page share the container's edges.
- `content-sets-height`: no fixed heights; grids `auto-fit`.
- `measure`: running text inside `.prose` or under `--measure`.
- `heading-ladder`: one `h1` per page; `h2` sections, `h3` cards, `h4` below.
- `numbers`: `tabular-nums` in columns and tiles (`.num`, `.stat__value`); units via `.th-unit`.
- `density-deliberate`: choose `data-density` per app; `.toolbar` is compact by scope; never invent a smaller control.
- `responsive-floor`: no horizontal scroll at 390 px; tables inside `.table-wrap`; the shell collapses.
- `cta-says-what-happens`: "Start run", never "Submit" or "OK"; the toast repeats the verb ("Run started").
- `errors-explain`: cause and fix, no apology; inline under the field with `aria-invalid`.
- `every-view-has-states`: loading (`.skeleton` for a known shape, `.spinner` for an unknown wait), empty, error and success.
- `status-never-colour-alone`: `.badge` with `.dot` and text; alerts carry icon and title.
- `icons-stroke-only`: inline stroke SVGs at 16, 20 or 24 px in `currentColor`, square caps and mitred joins to match the corners; no emoji.
- `charts-use-tokens`: series take `--chart-cat-1..8` in fixed order, magnitudes `--chart-seq-*`, polarity `--chart-div-*`; chart text, grid and axes use `--chart-text`, `--chart-grid`, `--chart-axis`; never a library palette.
- `motion-contract`: transform and opacity only; `--ease-out` for enter and exit; one entrance sequence per page (`.view-fade` on the main region); hover animates only `.card--interactive`; never `transition: all`.

## 6. Anti-patterns

An eyebrow above every heading; identical cards chopping a dashboard; nested cards; everything centred; rounded corners or pills; a gradient on a work-surface heading or as a button fill; a filled red danger button; fade-up on every section; emoji or solid-glyph icons; inline layout styles; shadows for passive depth; a placeholder used as a label; a second primary in view; invented variables or literal colours.

## 7. Before you ship

1. Every class and variable is in reference.md; no colour literal; no inline style beyond the seven knobs.
2. One `h1`; headings descend in order.
3. One primary action per view; danger is outlined.
4. Every gap has an owner.
5. Rendered in light and dark (and brand if used), with the accent the module uses.
6. At 390 px: no horizontal scroll; tables wrapped; the shell collapses.
7. Keyboard: skip link first; the focus ring shows on every control; dialogs and menus are the native primitives.
8. Loading, empty and error states exist for every data region.
9. CTAs say what happens; errors say cause and fix.

## 8. Free with the stylesheet

- `@media print`: any surface prints black on white.
- `prefers-reduced-motion`, `prefers-reduced-transparency` and forced colours are handled.
- Native widgets (scrollbars, checkboxes, range inputs) follow the theme and accent.
