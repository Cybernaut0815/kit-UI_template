# ZHA UI Examples Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every example in `examples/` fully represent ZHA UI - consume the published package (no local design tokens, no hardcoded brand colour), demonstrate the current system (dual-accent pairs + gradient library + real primitives), be framed as "ZHA UI" (ES as the demo brand), and add a dedicated gradient showcase.

**Architecture:** A per-example `check.mjs` drift-guard is the machine proof of "consumes the system." Consumer pages (showcase, vanilla) use ONLY bundle classes → their guard checks classes + vars + colour. Decks keep bespoke layout classes → their guard checks vars + colour only (no class check; render-verify backstops class spelling). Decks are black-first → `data-brand="es" data-surface="brand"`, sourcing every colour/space/type/gradient from zha-ui tokens per the token map; embedded light-UI mockups paint from the theme-invariant `--color-*` primitives, because there is no `[data-theme="light"]` override block to nest against - a nested light subtree would just inherit the deck's dark values.

**Tech Stack:** ZHA UI CSS package (`@gitzhacode/zha-ui-css`), plain HTML/CSS Ring-1 pages + React/Vite Ring-2, Node `check.mjs` drift-guards, pnpm workspace (`examples/*`) + turbo (`build` = `node check.mjs`).

**Spec:** `docs/specs/2026-07-09-zha-ui-examples-refresh-design.md`.

## Global Constraints

- The firm is **"ZHA"** - always; never its spelled-out former name.
- ZHA Sans (`--font-secondary`) is always **regular + upright** - never bold, never italic.
- **Consume the package:** zero locally-defined design-system custom properties (colour/type/space/radius/motion/gradient); zero chromatic colour literals. Neutral `rgba(0,0,0,α)`/`rgba(255,255,255,α)` (shadows/scrims/overlays) are the ONLY permitted colour literals. Layout scaffolding (slide widths, `clamp()` display sizes above the 32px scale, canvas sizing, z-indices) may be raw values but **not** as `--custom-properties`.
- **Guard variants:** consumer pages (showcase, vanilla) check classes + vars + colour; decks check vars + colour only (no class check).
- **Deck config:** `<html data-brand="es" data-surface="brand" data-theme="dark">`. Accent resolves to base teal `#048C9C` (ES brand block wins). Use `--accent` for accent text, `--accent-fill` for buttons/non-text only.
- **Canvas/JS colour:** read from tokens via `getComputedStyle(...).getPropertyValue('--accent')` with NO literal fallback.
- **Titling:** `<title>` + top-level framing say "ZHA UI"; ES is the demo brand in content only.
- **Deck token map (deck-local → zha-ui):** `--ground`→`--bg-page`; `--s1/2/3`(`--surface-1..`)→`--bg-surface-1/2/3`; `--tx/txs/txm/txms`→`--text-default/strong/muted/muted-strong`; `--bd/bd2/bd3`→`--border-subtle/default/strong`; `--teal/teal-fill`→`--accent/accent-fill`; `--magenta/magenta-fill`→`--accent-2/accent-2-fill`; `--duo`→`--brand-grad`; `--team-<t>`→`--typology-<hue>-100/75/50/25` (es→teal, code→purple, analytics→blue, bim→dark-green, abps→orange, meta→ultramarine, zh-cluster→magenta - use this table, NOT the decks' stale hex); `--focus`→`--focus-ring`; `--ease`→`--ease-out`; `--fp/fb/fm`→`--font-primary/secondary/mono`; `--r-s/m/l`,`--pill`→`--radius-s/m/l`,`--radius-pill`; `--space-*`→same. Spacing-shaped local vars (e.g. `var(--sp,20px)` = 20px) → the matching `--space-*` (20px = `--space-5`).
- **Deck narrative north-star:** Teams get the ZHA brand as code from ZHA UI, so every app is on-brand and accessible by default; each team is an accent **pair** (primary + expressive secondary → gradient); ES is confirmed (teal→magenta) and shown here; contrast is enforced on every build. Replace all "single accent = teal / single-accent discipline" framing.
- **Built `dist/` is gitignored** - commit sources only. Commit messages `type(scope): subject`. Confirm before the FIRST commit; do not push.

## File Structure

- `examples/gradient-showcase/{index.html,check.mjs,package.json}` - NEW canonical gradient reference (consumer guard).
- `examples/foundation-reference/index.html` - MODIFY: pointer to the showcase (+ confirm "ZHA UI" title).
- `examples/zha-app-vanilla/index.html` - MODIFY: retitle, `.stat`, `.alert`, gradient strip.
- `examples/zha-app-react/{index.html,src/App.jsx}` - MODIFY: retitle, `.stat`/`.alert`, gradient strip.
- `examples/brand-deck/{index.html,check.mjs,package.json}` - MODIFY html + ADD guard/pkg.
- `examples/brand-deck-editorial/{index.html,check.mjs,package.json}` - same (+ embedded mockup).
- `examples/brand-deck-product/{index.html,check.mjs,package.json}` - same (+ embedded mockup).
- `examples/brand-deck-specimen/{index.html,check.mjs,package.json}` - same.

---

### Task 1: Gradient showcase (new) + foundation-reference pointer

**Files:**
- Create: `examples/gradient-showcase/index.html`, `examples/gradient-showcase/check.mjs`, `examples/gradient-showcase/package.json`
- Modify: `examples/foundation-reference/index.html`

**Interfaces:**
- Consumes: the built bundle at `../../packages/css/dist/index.css`; classes `.zha-logo .zha-lockup .card .grad-hero-ember/-ocean/-violet/-dusk .grad-spectrum .accent-grad .accent-grad-text .accent-grad-subtle .grad-wash .grad-glow`; tokens `--bg-* --text-* --border-* --space-* --radius-* --fs-* --font-* --leading-* --tracking-*`.
- Produces: the canonical `check.mjs` drift-guard (consumer variant) reused/adapted by later tasks.

- [ ] **Step 1: Create the drift-guard (consumer variant)**

Create `examples/gradient-showcase/check.mjs`:

```js
// Drift guard: every primitive class and var(--…) used in index.html must exist in the
// built zha-ui bundle, and no BRAND colour may be hardcoded. Proves this example consumes
// the design system rather than reinventing it. Neutral shadow/scrim alphas
// (rgba(0,0,0,α)/rgba(255,255,255,α)) are allowed - a drop-shadow is not a brand colour.
// ponytail: regex existence check, not a full parser - fails closed on fabrication.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const bundle = readFileSync(require.resolve('@gitzhacode/zha-ui-css/index.css'), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');

const classes = new Set();
for (const m of html.matchAll(/class=["']([^"']+)["']/g))
  for (const c of (m[1] ?? '').split(/\s+/)) if (c) classes.add(c);

const vars = new Set();
for (const m of html.matchAll(/var\((--[\w-]+)/g)) vars.add(m[1]);

const defined = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])').test(bundle);

const missing = [];
for (const c of classes) if (!defined('.' + c)) missing.push('.' + c);
for (const v of vars) if (!defined(v)) missing.push(v);

const NEUTRAL = /^rgba?\(\s*(?:0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*(?:,[^)]*)?\)$/i;
const colors = (html.match(/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\([^)]*\)/g) ?? [])
  .filter((c) => !NEUTRAL.test(c));

if (missing.length || colors.length) {
  if (missing.length) console.error('drift: unknown zha-ui vocabulary:', missing);
  if (colors.length) console.error('drift: hardcoded brand-colour literals (use var(--…)):', [...new Set(colors)]);
  process.exit(1);
}
console.log(`drift guard: ${classes.size} classes + ${vars.size} vars - all in the bundle, no hardcoded brand colour ✓`);
```

- [ ] **Step 2: Create package.json**

Create `examples/gradient-showcase/package.json`:

```json
{
  "name": "zha-ui-gradient-showcase",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": { "build": "node check.mjs" },
  "dependencies": { "@gitzhacode/zha-ui-css": "workspace:*" }
}
```

- [ ] **Step 3: Create index.html**

Create `examples/gradient-showcase/index.html`:

```html
<!doctype html>
<html lang="en" data-brand="es" data-theme="light" data-surface="work" data-density="comfortable">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ZHA UI - gradient library</title>
  <link rel="stylesheet" href="../../packages/css/dist/index.css">
</head>
<body style="margin: 0; background: var(--bg-page); color: var(--text-default); font-family: var(--font-primary); line-height: var(--leading-body)">

  <header style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--border-subtle); background: var(--bg-surface-1)">
    <span class="zha-logo" role="img" aria-label="ZHA"></span>
    <span style="font-family: var(--font-mono); font-size: var(--fs-label); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted)">Gradient library</span>
  </header>

  <main style="max-width: 64rem; margin: 0 auto; padding: var(--space-6)">
    <h1 style="margin: 0 0 var(--space-3); font: var(--fs-hero)/var(--leading-display) var(--font-secondary); letter-spacing: var(--tracking-display); color: var(--text-strong)">The ZHA UI gradient library</h1>
    <p style="max-width: 52rem; margin: 0 0 var(--space-8); color: var(--text-muted-strong)">Gradients are decorative. The hero meshes and the spectrum are identity / hero only; the three washes are the only gradients safe on work surfaces. Never a work-surface heading fill.</p>

    <section data-surface="brand" style="border-radius: var(--radius-l); padding: var(--space-6); margin-bottom: var(--space-8); background: var(--bg-page)">
      <p style="margin: 0 0 var(--space-4); font-family: var(--font-mono); font-size: var(--fs-label); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted)">Hero meshes - marketing surfaces only · text via --text-*</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: var(--space-4)">
        <div class="grad-hero-ember" style="min-height: 9rem; border-radius: var(--radius-m); padding: var(--space-5); display: flex; align-items: flex-end; color: var(--text-strong)">Ember</div>
        <div class="grad-hero-ocean" style="min-height: 9rem; border-radius: var(--radius-m); padding: var(--space-5); display: flex; align-items: flex-end; color: var(--text-strong)">Ocean</div>
        <div class="grad-hero-violet" style="min-height: 9rem; border-radius: var(--radius-m); padding: var(--space-5); display: flex; align-items: flex-end; color: var(--text-strong)">Violet</div>
        <div class="grad-hero-dusk" style="min-height: 9rem; border-radius: var(--radius-m); padding: var(--space-5); display: flex; align-items: flex-end; color: var(--text-strong)">Dusk</div>
      </div>
    </section>

    <section style="margin-bottom: var(--space-8)">
      <p style="margin: 0 0 var(--space-3); font-family: var(--font-mono); font-size: var(--fs-label); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted)">Spectrum - oklch-vivid where supported, clean sRGB otherwise</p>
      <div class="grad-spectrum" style="height: 3rem; border-radius: var(--radius-m)"></div>
    </section>

    <section style="margin-bottom: var(--space-8)">
      <p style="margin: 0 0 var(--space-3); font-family: var(--font-mono); font-size: var(--fs-label); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted)">Team gradient (ES) - identity / hero</p>
      <h2 class="accent-grad-text" style="margin: 0 0 var(--space-4); font: var(--fs-display)/var(--leading-display) var(--font-secondary); letter-spacing: var(--tracking-display)">Forever advancing</h2>
      <div class="accent-grad" style="height: 4rem; border-radius: var(--radius-m)"></div>
    </section>

    <section>
      <p style="margin: 0 0 var(--space-3); font-family: var(--font-mono); font-size: var(--fs-label); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted)">Washes - safe on work surfaces</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: var(--space-4)">
        <div class="card grad-wash" style="min-height: 6rem; padding: var(--space-5)">.grad-wash</div>
        <div class="card grad-glow" style="min-height: 6rem; padding: var(--space-5)">.grad-glow</div>
        <div class="card accent-grad-subtle" style="min-height: 6rem; padding: var(--space-5)">.accent-grad-subtle</div>
      </div>
    </section>
  </main>

  <footer style="max-width: 64rem; margin: 0 auto; padding: var(--space-6); border-top: 1px solid var(--border-subtle); color: var(--text-muted); font-size: var(--fs-small)">Built on ZHA UI. Full rules in DESIGN.md.</footer>
</body>
</html>
```

- [ ] **Step 4: Install + run the guard (RED then GREEN)**

Run: `pnpm install` (registers the new workspace package).
Run: `pnpm --filter zha-ui-gradient-showcase build`
Expected: PASS - `drift guard: N classes + M vars - all in the bundle, no hardcoded brand colour ✓`. (If it fails, a class/var is misspelled or a literal slipped in - fix until green. This is the test.)

- [ ] **Step 5: Add the foundation-reference pointer**

In `examples/foundation-reference/index.html`, confirm the `<title>` reads as ZHA UI (adjust to `ZHA UI - foundation reference` if it says otherwise), and add one pointer line near the top of `<body>` (after the opening header/intro) - use only existing tokens, no hardcoded colour:

```html
  <p style="margin: 0 0 var(--space-4); font-size: var(--fs-small); color: var(--text-muted)">Looking for gradients? See the <a href="../gradient-showcase/" style="color: var(--accent)">ZHA UI gradient library</a>.</p>
```

- [ ] **Step 6: Commit**

```bash
git add examples/gradient-showcase examples/foundation-reference/index.html
git commit -m "feat(examples): dedicated ZHA UI gradient showcase + foundation-reference pointer"
```

---

### Task 2: Starter refresh (vanilla + React)

Retitle to "ZHA UI"; replace hand-rolled stat tiles with `.stat` and hand-rolled banners with `.alert`; add a compact gradient strip linking to the showcase. ES stays the demo content.

**Files:**
- Modify: `examples/zha-app-vanilla/index.html`
- Modify: `examples/zha-app-react/index.html`, `examples/zha-app-react/src/App.jsx`

**Interfaces:**
- Consumes: `.stat`/`.stat__label`/`.stat__value`, `.alert`/`.alert--*`/`.alert__icon`/`.alert__title`, `.grad-hero-dusk`, `.accent-grad-text` (all in the bundle).

- [ ] **Step 1: Vanilla - retitle**

In `examples/zha-app-vanilla/index.html` line 6, replace `<title>ZHA app - vanilla starter</title>` with `<title>ZHA UI - vanilla starter</title>`.

- [ ] **Step 2: Vanilla - stat tiles → `.stat`**

Replace the four stat-tile `<div class="surface" …>` blocks (the stat-row `<section>` children) with `.stat` markup. The whole stat-row section becomes:

```html
    <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: var(--space-4); margin-top: var(--space-6)">
      <div class="stat"><span class="stat__label">kWh today</span><span class="stat__value">847</span></div>
      <div class="stat"><span class="stat__label">Carbon intensity</span><span class="stat__value">0.42</span></div>
      <div class="stat"><span class="stat__label">Mean comfort</span><span class="stat__value">23.1°</span></div>
      <div class="stat"><span class="stat__label">Sensor uptime</span><span class="stat__value">94%</span></div>
    </section>
```

- [ ] **Step 3: Vanilla - intent banners → `.alert`**

Replace the four `<div class="surface" … border-left …>` intent banners (the column beside the form card) with:

```html
      <div style="display: flex; flex-direction: column; gap: var(--space-3)">
        <div class="alert alert--success" role="status"><span class="alert__icon" aria-hidden="true">✓</span><div><span class="alert__title">Simulation complete</span>NEOM Bay Terminal A processed in 4m 32s.</div></div>
        <div class="alert alert--warning" role="alert"><span class="alert__icon" aria-hidden="true">⚠</span><div><span class="alert__title">Sensors offline</span>3 sensors in Zone B are offline. Comfort metrics may be incomplete.</div></div>
        <div class="alert alert--error" role="alert"><span class="alert__icon" aria-hidden="true">✕</span><div><span class="alert__title">Carbon budget exceeded</span>Review the energy model or occupancy schedule.</div></div>
        <div class="alert alert--info" role="status"><span class="alert__icon" aria-hidden="true">ℹ</span><div><span class="alert__title">Climate data updated</span>Dubai 2026 climate data updated. Re-run models to reflect new values.</div></div>
      </div>
```

- [ ] **Step 4: Vanilla - add gradient strip**

In the "Brand" showcase `<section>` (the one with the `.accent-grad`/typology cards), add one more card at the end of its grid:

```html
        <div class="card" style="padding: var(--space-5)">
          <div class="grad-hero-dusk" style="height: 4.5rem; border-radius: var(--radius-m)"></div>
          <p style="margin: var(--space-4) 0 0; font-size: var(--fs-small); color: var(--text-muted)">Gradient library - hero meshes, spectrum, washes. <a href="../gradient-showcase/" style="color: var(--accent)">See the full library →</a></p>
        </div>
```

- [ ] **Step 5: Vanilla - run the guard**

Run: `pnpm --filter zha-app-vanilla build`
Expected: PASS - `zha-app-vanilla: N classes + M vars - all in the bundle, no hardcoded colour ✓` (the new `.stat`/`.alert`/`.grad-hero-dusk` classes all resolve).

- [ ] **Step 6: React - retitle**

In `examples/zha-app-react/index.html` line 6, replace `<title>ZHA app - React starter</title>` with `<title>ZHA UI - React starter</title>`.

- [ ] **Step 7: React - Stat + Alert components**

In `examples/zha-app-react/src/App.jsx`, replace the `Stat` component with:

```jsx
function Stat({ value, label }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
    </div>
  );
}
```

Replace the `Banner` component (and its usages) with an `Alert`:

```jsx
const ALERT_ICON = { success: '✓', warning: '⚠', error: '✕', info: 'ℹ' };
function Alert({ intent, title, children }) {
  const role = intent === 'error' || intent === 'warning' ? 'alert' : 'status';
  return (
    <div className={`alert alert--${intent}`} role={role}>
      <span className="alert__icon" aria-hidden="true">{ALERT_ICON[intent]}</span>
      <div><span className="alert__title">{title}</span>{children}</div>
    </div>
  );
}
```

Update the four banner usages to pass a `title`:

```jsx
            <Alert intent="success" title="Simulation complete">NEOM Bay Terminal A processed in 4m 32s.</Alert>
            <Alert intent="warning" title="Sensors offline">3 sensors in Zone B are offline. Comfort metrics may be incomplete.</Alert>
            <Alert intent="error" title="Carbon budget exceeded">Review the energy model or occupancy schedule.</Alert>
            <Alert intent="info" title="Climate data updated">Dubai 2026 climate data updated. Re-run models to reflect new values.</Alert>
```

- [ ] **Step 8: React - gradient strip in GradientShowcase**

In `App.jsx`, add one card at the end of the `GradientShowcase` grid:

```jsx
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div className="grad-hero-dusk" style={{ height: '4.5rem', borderRadius: 'var(--radius-m)' }} />
          <p style={{ margin: 'var(--space-4) 0 0', fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>Gradient library - hero meshes, spectrum, washes. <a href="../gradient-showcase/" style={{ color: 'var(--accent)' }}>See the full library →</a></p>
        </div>
```

- [ ] **Step 9: React - build**

Run: `pnpm --filter zha-app-react build`
Expected: `vite build` succeeds (no unresolved import; JSX valid).

- [ ] **Step 10: Commit**

```bash
git add examples/zha-app-vanilla/index.html examples/zha-app-react/index.html examples/zha-app-react/src/App.jsx
git commit -m "feat(examples): starters use real .stat/.alert primitives + gradient strip, retitled ZHA UI"
```

---

### Task 3: Convert `brand-deck` (deck guard + token swap + team typology + canvas + reframe)

**Files:**
- Modify: `examples/brand-deck/index.html`
- Create: `examples/brand-deck/check.mjs`, `examples/brand-deck/package.json`

**Interfaces:**
- Produces the **deck guard** (vars + colour only) reused by Tasks 4-6.

- [ ] **Step 1: Create the deck guard**

Create `examples/brand-deck/check.mjs` (variant of the consumer guard - NO class check, since decks have bespoke layout classes):

```js
// Deck drift guard: every var(--…) must resolve to a real zha-ui token, and no BRAND colour
// may be hardcoded. Decks keep their own LAYOUT classes (.slide/.chrome/…), so classes are not
// checked here - render-verify backstops zha-ui class spelling. Neutral shadow/scrim alphas allowed.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const bundle = readFileSync(require.resolve('@gitzhacode/zha-ui-css/index.css'), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');

const vars = new Set();
for (const m of html.matchAll(/var\((--[\w-]+)/g)) vars.add(m[1]);
const defined = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])').test(bundle);

const missing = [];
for (const v of vars) if (!defined(v)) missing.push(v);

const NEUTRAL = /^rgba?\(\s*(?:0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*(?:,[^)]*)?\)$/i;
const colors = (html.match(/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\([^)]*\)/g) ?? [])
  .filter((c) => !NEUTRAL.test(c));

if (missing.length || colors.length) {
  if (missing.length) console.error('deck drift: local/unknown vars (must be zha-ui tokens):', missing);
  if (colors.length) console.error('deck drift: hardcoded brand-colour literals:', [...new Set(colors)]);
  process.exit(1);
}
console.log(`deck drift guard: ${vars.size} vars all zha-ui tokens, no hardcoded brand colour ✓`);
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "zha-ui-brand-deck",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": { "build": "node check.mjs" },
  "dependencies": { "@gitzhacode/zha-ui-css": "workspace:*" }
}
```

- [ ] **Step 3: Run the guard to see it RED**

Run: `pnpm install` then `pnpm --filter zha-ui-brand-deck build`
Expected: FAIL - a long list of local vars (`--ground`, `--tx`, `--teal`, `--duo`, `--team-*`, …) and hardcoded hex (`#048C9C`, `#0D0D0C`, `#7633E2`, …). This is the conversion checklist.

- [ ] **Step 4: Convert `<head>` - link bundle, drop local tokens, set axes**

- Set the root element: `<html lang="en" data-brand="es" data-surface="brand" data-theme="dark">`.
- In `<head>`, add before the `<style>`: `<link rel="stylesheet" href="../../packages/css/dist/index.css">`.
- In the `<style>`, DELETE the entire `:root { … }` block (all local token definitions, lines ~15-31). Keep the deck's layout/component CSS rules. Retitle `<title>` to `ZHA UI - brand deck`.

- [ ] **Step 5: Apply the token map across all remaining CSS + HTML**

Read the file and replace every `var(--localname)` per the Global-Constraints deck token map (e.g. `var(--tx)`→`var(--text-default)`, `var(--teal)`→`var(--accent)`, `var(--duo)`→`var(--brand-grad)`, `var(--fp)`→`var(--font-primary)`, `var(--r-s)`→`var(--radius-s)`, `var(--sp,20px)`→`var(--space-5)`). Replace the 7 team-accent swatches (`--team-es … --team-cluster`, lines ~24-25 and their usages) with `--typology-<hue>-100` per the map (es→teal, code→purple, analytics→blue, bim→dark-green, abps→orange, meta→ultramarine, zh-cluster→magenta). Remove any remaining hardcoded hex by pointing at the right token.

- [ ] **Step 6: Canvas reads tokens**

In the hero-canvas script, set the stroke gradient stops from tokens with no literal fallback:

```js
  var cs = getComputedStyle(document.documentElement);
  var teal = cs.getPropertyValue('--accent').trim();
  var magenta = cs.getPropertyValue('--accent-2').trim();
  // …later, in draw():
  grad.addColorStop(0.00, teal); grad.addColorStop(0.55, teal); grad.addColorStop(1.00, magenta);
```

(Replace the current hardcoded `rgba(4,140,156,…)` / `rgba(203,0,146,…)` stops. `strokeStyle`/`addColorStop` accept the computed oklch-or-hex token value.)

- [ ] **Step 7: Run the guard to GREEN**

Run: `pnpm --filter zha-ui-brand-deck build`
Expected: PASS - `deck drift guard: N vars all zha-ui tokens, no hardcoded brand colour ✓`. Iterate Steps 5-6 until green.

- [ ] **Step 8: Reframe the narrative (reviewed, not guarded)**

Rewrite ES-brand-story framing to the ZHA-UI-system north-star, preserving the deck's structure/lens. Specific stale anchors to replace: the comment at ~line 127 ("Single-accent discipline…"), the body at ~line 235 ("ES leads, in teal…"), and ~line 336 ("ES is ready, in teal."). Example rewrite for the lead: *"ES leads, in teal→magenta. Each team's accent pair is set in ZHA UI, so every app is on-brand and accessible by default."* Retitle any on-slide "brand deck" heading to present ZHA UI (the system). Keep sentence case; ZHA Sans (`--font-secondary`) regular + upright; the firm is "ZHA".

- [ ] **Step 9: Commit**

```bash
git add examples/brand-deck/index.html examples/brand-deck/check.mjs examples/brand-deck/package.json
git commit -m "feat(examples): brand-deck consumes ZHA UI (token swap, typology teams, reframed to system deck)"
```

---

### Task 4: Convert `brand-deck-editorial` (+ embedded mockup, decorative shadow)

**Files:**
- Modify: `examples/brand-deck-editorial/index.html`
- Create: `examples/brand-deck-editorial/check.mjs`, `examples/brand-deck-editorial/package.json`

- [ ] **Step 1: Add guard + package.json**

Copy `examples/brand-deck/check.mjs` to `examples/brand-deck-editorial/check.mjs` (identical). Create `package.json` as in Task 3 Step 2 with `"name": "zha-ui-brand-deck-editorial"`.

- [ ] **Step 2: Run guard RED**

Run: `pnpm install` then `pnpm --filter zha-ui-brand-deck-editorial build` → FAIL (local vars + hex list).

- [ ] **Step 3: Convert head + token map**

Same as Task 3 Steps 4-5: `<html data-brand="es" data-surface="brand" data-theme="dark">`, add the `<link>`, delete the `:root` token block, apply the token map across all `var()` refs, retitle `<title>` to `ZHA UI - editorial`.

- [ ] **Step 4: Convert the embedded light-UI mockup (via theme-invariant `--color-*` primitives)**

The `.win`/browser-chrome mockup renders a light app inside the dark deck. **Do NOT rely on nesting `data-surface="work" data-theme="light"`** - the token build has NO `[data-theme="light"]`/`[data-surface="work"]` override block (light/work is the `:root` default), so a nested light subtree just inherits the deck's dark values (verified in Task 3). Instead, paint the light mockup from the **theme-invariant primitive tokens**, which resolve to absolute light values regardless of ancestor surface/theme:

| Mockup light colour | Primitive token |
|---|---|
| page bg `#F4F2F0` | `--color-paper-page` |
| card/surface `#fff` / `#ECEAE8` / `#DDDCDB` | `--color-paper-surface-1` / `-2` / `-3` |
| body text `#312E2B`, muted `#6A6764` | `--color-neutral-ink` / (muted → `--color-neutral-gray-77` or `--color-neutral-gray-99`) |
| hairline `rgba(29,29,27,.08)` | keep a neutral literal only if no token fits; prefer `--color-neutral-*` |
| accent teal / fill / magenta | `--color-accent-teal` / `--color-accent-teal-fill` / `--color-accent-magenta` |

Replace the mockup's local `--a/--a2/--m/--bg/--c1..` definitions and inline hex with these primitives. For the large decorative window shadow (`box-shadow: 0 30px 70px rgba(0,0,0,.55)`): keep it (neutral-alpha is allowed) or use `--shadow-high` if close enough. (Known system limitation raised for follow-up: no light counter-scope block; the `--color-*` primitives are the sanctioned way to render an always-light region.)

- [ ] **Step 5: `.duoword` / gradient-clipped headline → token**

Ensure the editorial headline gradient uses `var(--brand-grad)` (or the `.accent-grad-text` class), not local hex stops.

- [ ] **Step 6: Guard GREEN**

Run: `pnpm --filter zha-ui-brand-deck-editorial build` → PASS. Iterate until green.

- [ ] **Step 7: Reframe narrative**

Reframe to the ZHA-UI-system north-star through the editorial/typographic lens; keep existing dual-accent lines ("teal for structure, magenta for what matters" is already on-message). Sentence case; ZHA Sans regular+upright; firm is "ZHA".

- [ ] **Step 8: Commit**

```bash
git add examples/brand-deck-editorial/index.html examples/brand-deck-editorial/check.mjs examples/brand-deck-editorial/package.json
git commit -m "feat(examples): editorial deck consumes ZHA UI (token swap, nested-surface mockup, reframe)"
```

---

### Task 5: Convert `brand-deck-product` (+ embedded mockup)

**Files:**
- Modify: `examples/brand-deck-product/index.html`
- Create: `examples/brand-deck-product/check.mjs`, `examples/brand-deck-product/package.json`

- [ ] **Step 1: Add guard + package.json**

Copy the deck guard to `examples/brand-deck-product/check.mjs`. Create `package.json` with `"name": "zha-ui-brand-deck-product"`.

- [ ] **Step 2: Guard RED**

`pnpm install` then `pnpm --filter zha-ui-brand-deck-product build` → FAIL.

- [ ] **Step 3: Convert head + token map**

Same as Task 3 Steps 4-5; retitle `<title>` to `ZHA UI - product`.

- [ ] **Step 4: Convert the embedded product-UI mockup (via theme-invariant `--color-*` primitives)**

The `.ui{--a:#037A88;--a2:#048C9C;--m:#CB0092;--bg:#F4F2F0;--c1:#fff;--c2:#ECEAE8;--c3:#DDDCDB;--t:#312E2B;--t2:#6A6764;--ln:rgba(29,29,27,.10)}` block is a full light-mode app mock. **Do NOT use nested `data-surface="work" data-theme="light"`** - there is no light/work override block, so a nested subtree inherits the deck's dark values (verified in Task 3). Instead delete the local `--a/--a2/--m/--bg/--c1/--c2/--c3/--t/--t2/--ln` definitions and repoint their usages to the theme-invariant **primitive** tokens (absolute light values regardless of ancestor): `--a`→`--color-accent-teal-fill`, `--a2`→`--color-accent-teal`, `--m`→`--color-accent-magenta`, `--bg`→`--color-paper-page`, `--c1`→`--color-paper-surface-1`, `--c2`→`--color-paper-surface-2`, `--c3`→`--color-paper-surface-3`, `--t`→`--color-neutral-ink`, `--t2`→`--color-neutral-gray-77`, `--ln`→a neutral hairline (prefer a `--color-neutral-*`; a neutral `rgba(0,0,0,α)` is guard-allowed if none fits). Replace inline hex in the mock (`#1d1d1b`→`--color-neutral-ink`, `#fff`→`--color-paper-surface-1`, `#6A6764`→`--color-neutral-gray-77`). Keep the custom `.m-*` layout classes. (Same system-limitation note as Task 4.)

- [ ] **Step 5: `.duoword` + `--duo` usages → `--brand-grad`**

The 7+ `--duo` usages become `var(--brand-grad)` (mapped in Step 3); ensure the gradient-clipped `.duoword` headline uses it and no local hex stops remain.

- [ ] **Step 6: Guard GREEN**

Run: `pnpm --filter zha-ui-brand-deck-product build` → PASS. Iterate until green.

- [ ] **Step 7: Reframe narrative**

Reframe to the ZHA-UI-system north-star through the product lens (the mock shows a real ZHA UI app; the copy says the system gives you this on-brand by default). Sentence case; firm "ZHA".

- [ ] **Step 8: Commit**

```bash
git add examples/brand-deck-product/index.html examples/brand-deck-product/check.mjs examples/brand-deck-product/package.json
git commit -m "feat(examples): product deck consumes ZHA UI (token swap, nested-surface mockup, reframe)"
```

---

### Task 6: Convert `brand-deck-specimen`

**Files:**
- Modify: `examples/brand-deck-specimen/index.html`
- Create: `examples/brand-deck-specimen/check.mjs`, `examples/brand-deck-specimen/package.json`

- [ ] **Step 1: Add guard + package.json**

Copy the deck guard to `examples/brand-deck-specimen/check.mjs`. Create `package.json` with `"name": "zha-ui-brand-deck-specimen"`.

- [ ] **Step 2: Guard RED**

`pnpm install` then `pnpm --filter zha-ui-brand-deck-specimen build` → FAIL.

- [ ] **Step 3: Convert head + token map**

Same as Task 3 Steps 4-5; retitle `<title>` to `ZHA UI - specimen`. If the specimen shows swatches of the palette/typology (its purpose), source each swatch from the corresponding `--typology-<hue>-*` or `--accent*` token - never hardcoded hex.

- [ ] **Step 4: Guard GREEN**

Run: `pnpm --filter zha-ui-brand-deck-specimen build` → PASS. Iterate until green.

- [ ] **Step 5: Reframe narrative**

Reframe to present the ZHA UI token/type/colour system (the specimen IS the system's specimen), dual-accent pair language. Sentence case; ZHA Sans regular+upright; firm "ZHA".

- [ ] **Step 6: Commit**

```bash
git add examples/brand-deck-specimen/index.html examples/brand-deck-specimen/check.mjs examples/brand-deck-specimen/package.json
git commit -m "feat(examples): specimen deck consumes ZHA UI (token swap, reframe)"
```

---

### Task 7: Render-verify everything (manual, no commit)

Guards prove token/colour discipline; they cannot see layout, legibility, the nested-surface mockups, or the reframed copy. Verify visually.

**Files:** throwaway static server in the scratchpad; no repo files created.

- [ ] **Step 1: Build**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens build && pnpm --filter @gitzhacode/zha-ui-css build && pnpm -r --filter "./examples/*" build`
Expected: all example drift-guards pass.

- [ ] **Step 2: Serve + verify**

Start a static server (node, `run_in_background`) at the repo root; Playwright MCP `browser_navigate` to each page (`file://` is blocked - use `http://localhost:<port>/examples/<name>/`). For each, screenshot and confirm:
- **gradient-showcase:** 4 hero meshes render over near-black with legible white labels; spectrum is a vivid even sweep; team gradient + washes render; washes are subtle on the work surface.
- **vanilla + react:** `.stat` tiles and `.alert` banners render correctly (light + dark via the toggle); gradient strip links to the showcase.
- **each deck:** the token swap preserved the layout/look; base teal accent (~4.8:1) + teal→magenta gradient read legibly on near-black; the canvas hero (brand-deck) animates teal→magenta; the embedded mockups (editorial/product) render as a **light** UI inside the dark deck; the reframed copy names ZHA UI as the system and shows each team as an accent pair, and has no spelled-out firm name.

- [ ] **Step 3: Clean up**

Stop the server; delete screenshots + `.playwright-mcp/`. No commit. Any defect → fix in the owning task's file, rebuild, re-verify, commit the fix with a `fix(...)` message.

---

## Self-Review

**Spec coverage:**
- C1 consume-the-package + drift-guard → guards in Tasks 1,2,3-6 (consumer variant vs deck variant split, per the guard-variants constraint) ✓
- C2 titling → Tasks 1,2,3-6 retitles ✓
- C3 deck token map (incl. team→typology, font map, spacing-var→space) → Global Constraints + Tasks 3-6 Step 5 ✓
- C4 voice/naming → reframe steps (8/7/7/5) ✓
- Artifact 1 gradient showcase → Task 1 ✓
- Artifact 2 starter refresh (.stat/.alert + strip) → Task 2 ✓
- Artifact 3 deck conversion + reframe → Tasks 3-6 ✓
- Artifact 3b embedded mockups token-swap on nested work surface → Tasks 4 Step 4, 5 Step 4 ✓
- Artifact 4 foundation-reference pointer → Task 1 Step 5 ✓
- Verification (guards + render-verify incl. copy review) → per-task guards + Task 7 ✓
- Canvas reads tokens; neutral-alpha allowance; oversized clamp type stays literal → Global Constraints + Task 3 Step 6 ✓

**Placeholder scan:** none - full file contents for net-new files (showcase, both guards, all package.json); exact edit blocks for starters; explicit token map + per-deck mockup mappings + stale-line anchors for decks. Prose reframes give the north-star + concrete anchor lines + a sample rewrite (copy is generative; reviewer gates it against the north-star).

**Type/name consistency:** package names `zha-ui-gradient-showcase` / `zha-ui-brand-deck[-editorial|-product|-specimen]` used identically in package.json + `pnpm --filter` commands; token-map targets match the AI-USAGE var list; guard filenames `check.mjs` + `build` script consistent; `data-brand="es" data-surface="brand"` identical across deck tasks.
