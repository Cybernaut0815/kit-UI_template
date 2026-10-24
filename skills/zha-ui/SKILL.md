---
name: zha-ui
description: Build or restyle a ZHA web app with the zha-ui design system. Installs @gitzhacode/zha-ui-css from the private GitZHACODE/zha-ui repo, sets the four html switches, composes pages from the layout classes and uses only zha-ui classes and tokens. Use for any ZHA project that needs UI, styling, layout, colour, type, a page skeleton or a brand check.
license: Internal to ZHA; not for redistribution
compatibility: Claude Code, Codex, Cursor, GitHub Copilot, Antigravity and any agent that reads the Agent Skills format
metadata:
  source: "https://github.com/GitZHACODE/zha-ui/tree/main/skills/zha-ui"
  version: "0.2.0"
---

# ZHA UI

You are building a ZHA web app on the zha-ui design system. Four attributes on `<html>` resolve colour, type, space and state; you declare them, compose the page from the layout classes and never style by hand. The vocabulary is in [reference.md](reference.md) beside this file: read it before writing markup.

## 1. Install and load once

The package installs straight from git with the developer's existing GitHub access (the repo is private to the ZHA org; a workstation needs no token and no `.npmrc`). First, before you touch `package.json`, check that this machine's git can read the repo, and report its exact output to the user:

```sh
git ls-remote https://github.com/GitZHACODE/zha-ui refs/heads/release/css
```

The output decides the next step:

- A sha followed by `refs/heads/release/css`: the install will work; carry on.
- "could not read Username", "terminal prompts disabled" or "Authentication failed": git has no GitHub credential on this machine. The developer runs `gh auth login`, or clones any private GitZHACODE repository once so Git Credential Manager stores one. If Git Credential Manager opens a browser sign-in instead, signing in there is the same fix.
- "Repository not found": the developer's GitHub account cannot read GitZHACODE/zha-ui, and they need to ask the zha-ui maintainers for access.

On either failure, stop and wait for the developer to fix it; the install cannot succeed before the check prints the sha line. Once it does, add to `package.json` and run the installer:

```jsonc
"dependencies": { "@gitzhacode/zha-ui-css": "github:GitZHACODE/zha-ui#release/css" }
```

Then load the bundle once:

- With a bundler (Vite, Next, CRA): `import '@gitzhacode/zha-ui-css/index.css';` in the entry file.
- Plain HTML with no build step: `<link rel="stylesheet" href="./node_modules/@gitzhacode/zha-ui-css/dist/index.css">` in `<head>`; the fonts and the logo resolve relative to that file.

To pin a version, use the tag form `#css-v0.2.0`. A CI pipeline needs a repo-read token rewritten into git before `npm ci`; the "For developers" section of the [repo README](https://github.com/GitZHACODE/zha-ui/blob/main/README.md) has the one-line `git config`.

This skill describes `@gitzhacode/zha-ui-css` 0.2.0 or later (the zha-app default and `--accent-hover` arrived in 0.2.0); check `"version"` in `node_modules/@gitzhacode/zha-ui-css/package.json` and pin `#css-v0.2.0` if the default route still serves an older release.

If the project started from a Vite or CRA template, delete its element-level `button` and `a` CSS first: the primitives own control paint.

Last, add one line to the project's agent instructions file (`AGENTS.md`, `CLAUDE.md` or the tool's equivalent; create one if absent) so later sessions keep using this skill: `Use the zha-ui skill for every UI change; never style by hand.`

## Restyle an existing app

An app built before zha-ui moves over in this order:

1. Load `index.css` before the app's own stylesheet, so the app's rules still apply while its pages move over.
2. Set the switches on `<html>` as §2 shows.
3. Delete the scaffold's element-level `button`, `a` and `input` paint; the primitives own control paint (§1).
4. Replace hand-written colours, fonts and spacing with zha-ui classes and tokens page by page, starting with the app bar (§4) and the first page.
5. Move charts to the `--chart-*` tokens instead of the chart library's palette.
6. Delete the old stylesheet last, once no page uses it.
7. Run the "Before you ship" checklist (§8) on every page.

## 2. Declare who you are

```html
<html data-brand="zha-app" data-theme="light" data-surface="work" data-density="comfortable">
```

A team app sets its own brand instead, for example `<html data-brand="es" data-theme="light" data-surface="work" data-density="comfortable">`.

| Attribute | Options | Meaning |
|---|---|---|
| `data-brand` | `zha-app` (firm default: black-first neutral, no team letters) · `es` (teal→magenta, the one confirmed team pair) · `code` · `analytics` · `bim` · `abps` · `meta` · `zh-cluster` (provisional) | `zha-app` is the firm identity and the default when the attribute is absent; a team sets its accent pair (ES confirmed, others provisional) |
| `data-theme` | `light` · `dark` | light or dark |
| `data-surface` | `work` · `brand` | `work` = light default for dashboards/forms; `brand` = black-first marketing surface. Beside `data-theme="light"` on the same element light wins (the tokens emit light last): a brand page sets `data-theme="dark" data-surface="brand"`, or puts `brand` on the island (the `.hero`) only |
| `data-density` | `comfortable` · `compact` | `compact` shrinks controls 44px→36px for dense screens |

Set them once; everything inside inherits.

## 3. The one hard rule

Use only the published zha-ui classes and CSS variables. Never invent a custom property (no `--color-primary`), never hard-code a hex, rgb or named colour, never write layout in a `style` attribute. The only inline styles allowed are the nine knobs: `--container-w --grid-min --stack-gap --split-aside --control-h --dialog-w --sidebar-w --zha-logo-h --zha-lockup-size`. Elements carry their defaults: write `h1` to `h4`, `p`, `a`, `strong`, `code`, `pre`, `hr` and `img` without classes.

[reference.md](reference.md) has a one-line role for every class and the grouped variables. The generated, always-current lists are in the installed packages: `node_modules/@gitzhacode/zha-ui-css/dist/classes.txt` and `node_modules/@gitzhacode/zha-ui-tokens/dist/llms.txt` (the latter marks `--focus-ring` deprecated; the package paints focus as an outline).

## 4. Use the primitives

The complete class vocabulary, with roles and markup, is in [reference.md](reference.md); the
generated list is `@gitzhacode/zha-ui-css/classes.txt`. In short: controls (`.btn` + variants,
`.input`, `.select`, `.field`, `.chip`, `.segmented`, `.icon-btn`), content (`.card`, `.stat`,
`.data-table`, `.badge`, `.accordion`), feedback (`.alert`, `.toast`, `.progress`, `.spinner`,
`.skeleton`, `.empty-state`), navigation (`.app-shell`, `.app-bar`, `.sidebar`, `.tabs`, `.breadcrumb`,
`.pagination`, `.page-header`), overlays (`.dialog`, `.menu`), the composition layer (`.container`,
`.stack`, `.cluster`, `.grid`, `.section`, `.split`, `.toolbar`, `.form-grid`, `.table-wrap`, `.hero`,
`.eyebrow`, `.prose`) and the gradient library (`.grad-*`, `.accent-grad-*`; decorative only, never a
work-surface heading fill). Charts use the `--chart-*` tokens, never a library palette ([DESIGN.md §Charts](https://github.com/GitZHACODE/zha-ui/blob/main/DESIGN.md)).

Elements need no classes: `h1`-`h4`, `p`, `a`, `strong`, `code`, `pre`, `hr`, `img` carry on-brand
defaults from the package at zero specificity, so write the element and do not set its size yourself.

**The app bar** - exactly one blessed composition (do not improvise the mark):

```html
<header class="app-bar">
  <span class="app-bar__brand">
    <a class="zha-lockup" href="/" aria-label="ZHA, home"><span class="zha-lockup__zha">ZHA</span></a>
    <span class="app-bar__app">Your App Name</span>
  </span>
  <span class="app-bar__spacer"></span>
  <!-- actions: .btn--primary, .btn--ghost, .icon-btn--ghost; the phone nav toggle is an .icon-btn--ghost with .app-bar__nav-toggle (shown at 768 px and below only) -->
</header>
```

- The lockup is the home link; give it an `aria-label` (its text reads as run-together
  "ZHAES" to a screen reader). The default is the firm form, `ZHA` alone. A team app appends
  `<span class="zha-lockup__team">ES</span>` after the `ZHA` span and labels the link `ZHA ES, home`.
  The team letters are the gradient (never inline-colour them,
  never `.accent-grad-text` an app name - gradients are hero/expressive-only).
- The app name is `--font-primary` (in the bar, ZHA Sans belongs to the lockup alone) in
  natural product case; it ellipsizes when space is tight and hides at 640px and below.
  Team letters never drop and never shrink below the lockup's default size.
- No app icon in the bar - product icons live in the favicon, login, and empty states
  (≥48px, tokens/`currentColor` only).

`.card` is hairline-only (no resting shadow) and carries default padding
(`--space-5`); add `.card--flush` for media or table cards and `.card--interactive` only on clickable
cards that need the hover lift. Inline `style=` attributes may set only the nine knobs listed in §3;
nothing else belongs in a style attribute. Spacing comes from `.stack`,
`.cluster`, `.grid` and `.section`, never from per-element margins.

## 5. Compose a page

Start every page from one of these three skeletons. Each region has one owner for its gaps, so the
markup needs no inline layout.

**App page** (a bundled app):
```html
<a class="skip-link" href="#main">Skip to content</a>
<div class="app-shell">
  <header class="app-bar">…the canonical bar above…</header>
  <nav class="sidebar" aria-label="Main">…</nav>
  <main class="app-main stack" id="main">
    <div class="page-header"><h1 class="page-header__title">Projects</h1>
      <div class="page-header__actions"><button class="btn btn--secondary">Export</button><button class="btn btn--primary">New project</button></div></div>
    <div class="tabs">…</div>  <!-- optional; or a .toolbar -->
    <div class="stack">
      <div class="grid"><div class="stat">…</div><div class="stat">…</div></div>  <!-- when the numbers are the point -->
      <div class="table-wrap"><table class="data-table">…</table></div>  <!-- or a .split canvas and panel -->
    </div>
  </main>
</div>
```
Use it for a dashboard someone operates across several views; the page header carries the `h1` and at
most two actions, one of them primary.

**Tool page** (a plain HTML page):
```html
<a class="skip-link" href="#main">Skip to content</a>
<main class="container stack" id="main">
  <section class="hero grad-hero-dusk" data-surface="brand"><p class="eyebrow">…</p><h1>…</h1><p>…</p></section>  <!-- optional hero island; without it, the first section heading is the page's h1 -->
  <section class="section stack"><h2>New model</h2>
    <form class="form-grid" id="new-model"><div class="field">…</div><div class="field field--span">…</div></form>
    <div class="cluster cluster--end"><button class="btn btn--ghost" type="button" form="new-model">Save draft</button><button class="btn btn--primary" type="submit" form="new-model">Run model</button></div>
  </section>
  <section class="section stack"><h2>Results</h2>
    <div class="table-wrap"><table class="data-table">…</table></div>  <!-- or a .grid of .stat tiles -->
  </section>
</main>
<footer class="container"><hr class="divider">  <!-- outside main: a real contentinfo landmark -->
  <div class="cluster cluster--between"><span class="zha-lockup">…</span><span>…</span></div></footer>
```
Use it for a single-purpose tool in plain HTML: one form, its results and a footer with the lockup.

**Landing page** (a front door page):
```html
<a class="skip-link" href="#main">Skip to content</a>
<section class="hero hero--bleed grad-hero-dusk" data-surface="brand">
  <p class="eyebrow">…</p><h1>…</h1><p>…</p>
  <div class="cluster"><a class="btn btn--primary" href="…">…</a><a class="btn btn--secondary" href="…">…</a></div>
</section>
<main class="container" id="main">
  <section class="section stack"><h2>Decks</h2>
    <p class="prose">…</p>  <!-- optional -->
    <div class="grid"><a class="card card--interactive" href="…">…</a><div class="card">…</div></div>
  </section>
</main>
```
Use it for a front door or launch page that people read rather than operate; the full-width hero is
the page's one bold element.

## 6. Rules

Each rule has a slug so a review can cite it; they apply to every page.

- `one-primary-action`: one `.btn--primary` per view; every other action is secondary or ghost.
- `skip-link`: the first element in `<body>` is `<a class="skip-link" href="#main">Skip to content</a>` and the page's `<main>` carries `id="main"`; the link is invisible until the keyboard reaches it.
- `hierarchy-without-weight`: hierarchy comes from size, `--text-*` intensity, space and position; weight only on `--font-primary` (500 headings, 600 strong); ZHA Sans never bold, never below 24 px.
- `card-by-role`: a `.card` marks a separate object (selectable, navigable, or truly detached). Group with `.stack`, `.section` and hairlines first; never nest cards; never chop a page into identical cards.
- `one-bold-element`: each page has one expressive element (a hero mesh, a wardrobe gradient, one display-size number); everything else is quiet.
- `structure-is-information`: eyebrows, dividers, accent stripes, badges and numbering each state a fact; no eyebrow above every heading; no 01/02/03 unless the content is a sequence.
- `gap-has-one-owner`: spacing comes from `.stack`, `.cluster`, `.grid`, `.section` and the three tiers (`--space-section` 48, `--space-block` 24, `--space-inline` 12); never per-element margins; inline `style=` only to set a documented knob (the allowlist in §3, mirrored in [DESIGN.md](https://github.com/GitZHACODE/zha-ui/blob/main/DESIGN.md)).
- `align-to-shared-edges`: everything sits on the container's edges; a stat row, a table and a form on the same page are the same width.
- `content-sets-height`: no fixed heights; grids `auto-fit` and fill; pick a column count the items fill.
- `measure`: running text inside `.prose` or under `--measure`; hero titles under 18 characters a line.
- `heading-ladder`: one `h1` per page (24 px, `--font-primary`), `h2` sections (20), `h3` cards (16), `h4` (14). ZHA Sans only in `.hero > h1`, the lockup, the logo and the decks (the brand presentation decks, not app pages). Never `.accent-grad-text` on a work surface.
- `numbers`: `tabular-nums` in columns and tiles (`.num`, `.stat__value`), units via `.th-unit`.
- `left-aligned`: text is left-aligned; centre only `.empty-state` and a hero by choice.
- `density-deliberate`: choose `data-density` per app; `.toolbar` is compact by scope; never invent a smaller control.
- `responsive-floor`: internal apps: no horizontal scroll at 390 px, tables inside `.table-wrap`, shell collapses; public pages: the full 390 px check.
- `cta-says-what-happens`: "Save changes", "Run model", never "Submit" or "OK"; the same verb through the flow; the result confirmed in a toast that repeats it ("Model saved").
- `errors-explain`: cause and fix, no apology; inline under the field (`.field__error` + `aria-invalid`), validated on blur, the first invalid field focused on submit.
- `empty-state-invites`: what this area is for and the one action that fills it.
- `labels-specific`: navigation names the thing ("Projects", "Reports"), not "Home".
- `confirm-only-destructive`: a confirmation dialog only for irreversible actions; prefer undo.
- `every-view-has-states`: loading (`.skeleton` for a known shape, `.spinner` for an unknown wait), empty, error and success are designed, not left to chance.
- `status-never-colour-alone`: `.badge` with `.dot` and text; alerts carry icon and title.
- `icons-stroke-only`: inline stroke SVGs at 16, 20 or 24 px in `currentColor`; no emoji, no solid glyphs.
- `motion-contract`: transform and opacity only; `--ease-out` for enters and exits, `--ease-spring` only for the segmented thumb, never `--ease-in` on a state change; at most one entrance sequence per page (`.view-fade` on the main region, never per card); hover animates only `.card--interactive`; never `transition: all`; never `scale(0)`; exits shorter than enters; reduced motion is honoured by the bundle, do not re-add animation under it.

## 7. Not ZHA

Generic anti-pattern lists would strip the brand's own devices, so this one names what to keep first.

**Blessed, do not remove:** black-first surfaces, hairline dividers, mono eyebrows on hero and brand panels, the
gradient wardrobe on hero and identity surfaces, one aurora panel per page.

**Banned:** an eyebrow above every heading; identical rounded cards chopping a dashboard; nested cards; everything
centred; an arrow appended to link or button text; middle-dot meta strings; 01/02/03 without a sequence; a gradient
on a work-surface heading or as a button fill; fade-up on every section or lift on every card; emoji or solid-glyph
icons; bold or italic ZHA Sans, or ZHA Sans under 24 px; inline layout styles; shadows for passive depth; a
placeholder used as a label; a second `.btn--primary` in view; invented variables or literal hex (the existing
hard rule).

## 8. Before you ship

Run these checks before you report a page as done:

1. No invented classes or variables (every name is in classes.txt or llms.txt), no hex, no inline style beyond the nine knobs.
2. One `h1`; headings descend in order; ZHA Sans only where allowed.
3. One primary action per view.
4. Every gap has an owner (`.stack`, `.cluster`, `.grid`, `.section`).
5. Rendered in light and dark (and brand if used).
6. At 390 px: no horizontal scroll; tables wrapped; the shell collapses.
7. Keyboard: the skip link comes first, the focus ring is visible on every control; dialogs and menus are the native primitives.
8. Loading, empty and error states exist for every data region.
9. CTAs say what happens; errors say cause and fix.
10. At most one entrance sequence; nothing else animates on load.

## 9. You get these for free

- **oklch with sRGB hex fallback** via `@supports` - colour still works on Citrix,
  kiosks, BIM/CAD webviews, and PDF/headless engines.
- **`@media print`** - any surface prints black-on-white automatically.

## 10. Naming and type rules

- The firm is **"ZHA"** - always. Never spell out its former name.
- Headings are `--font-primary` at weight 500 (the brand book's rule). ZHA Sans (`--font-secondary`)
  is always regular weight and upright - never bold or italic - and appears only in the lockup and
  logo, in `.hero > h1` (display size, 32 px and up) and in the decks; never below 24 px, never on a
  card or section heading. In the app bar it belongs to the lockup alone.
- Sentence case for headings/body; UPPERCASE only for chip labels and `.eyebrow`.
- Icons are inline **stroke (line) SVGs** using `currentColor` - never colour emoji, never solid glyph fonts.
- Density floor is 36px (`data-density="compact"`); below that, scope `--control-h` per zone - that is the
  sanctioned knob; don't invent smaller buttons. `.toolbar` already sets `--control-h: 36px` for everything inside
  it; elsewhere set the knob inline (`style="--control-h: 36px"`) on the zone or the single control that needs it,
  so a 44px `.icon-btn` never sits beside a compact toolbar.
- Links in body copy are underlined, in `--accent-fill`; components that are links (buttons, cards, the
  lockup, navigation) remove the underline themselves (WCAG 1.4.1). Never derive hover colours (no
  `color-mix` darkening - dark surfaces need *lighter*, not darker).
- Floating panels use the primitives: `.menu` (a native `[popover]`) for anchored panels, `.dialog` for
  modal ones and `.card` for a panel that stays in the page flow. Do not compose `var(--radius-l)` +
  `var(--shadow-high)` by hand; in markup that means an inline style. There is no `.panel` primitive (yet).
- When you start from a Vite or CRA template, delete the template's element-level `button` and `a` CSS
  first, as §1 says: scaffold hovers (e.g. `button:hover { border-color: … }`) beat single-class
  primitives on specificity.
