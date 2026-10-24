# zha-ui Phase-0 Merge-Blocker Fixes - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the four audit merge-blockers plus the two adversarial-review additions so `phase-0-foundation` can merge to `main` with every audit blocker closed: verified accessible, no inert advertised features, no false claims.

**Architecture:** The work is almost entirely in `packages/tokens` (the Style Dictionary build + the contrast gate + token JSON) and `packages/css` (primitives + print). The contrast gate (`scripts/contrast-matrix.mjs`) is the test harness: most tasks add a check to the gate first (RED), then change tokens until it passes (GREEN). No re-architecture; no new dependencies.

**Tech Stack:** Node ≥20 (ESM), Style Dictionary v4 (multi-instance build), culori v4 (oklch + WCAG contrast), pnpm 9 + Turborepo, W3C DTCG `*.tokens.json`.

## Global Constraints

These apply to **every** task. Exact values copied from the repo/spec.

- **Firm name:** the firm is **"ZHA"**. Never write out its former spelled-out name anywhere in code, comments, docs, or commit messages.
- **ZHA Sans (`--font-secondary`)** is always regular weight and upright - never bold, never italic.
- **Contrast thresholds (WCAG AA):** text = **4.5**, non-text / UI (1.4.11) = **3.0**. The gate enforces these; do not lower them.
- **Confirmed brand:** **ES = teal** is locked by the brand book. Do **not** change any ES / teal value. The other six brands are provisional placeholders and may be tuned.
- **Closed-vocabulary rule:** never invent a CSS custom property or hard-code a hex value in consuming CSS - primitives reference `var(--…)` tokens only.
- **Versions:** `style-dictionary ^4.0.0`, `culori ^4.0.0`, `pnpm@9.0.0`, Node `>=20`. Do not add new dependencies.
- **Build/test commands** (run from repo root unless noted):
  - Full build (both packages, dep order): `pnpm build`
  - Tokens only: `pnpm --filter @gitzhacode/zha-ui-tokens build` (runs Style Dictionary **then** the gate)
  - Gate only (no rebuild): `pnpm --filter @gitzhacode/zha-ui-tokens contrast`
  - Tests: `pnpm test` · Types: `pnpm lint`
- **Commits:** the maintainer commits/pushes; each task ends with a *prepared* `git commit` you may run, but do not push.

**Before you start:** run `pnpm install` then `pnpm build` once to confirm a green baseline (build succeeds, gate prints `Contrast matrix: all pairs pass WCAG AA.`). If it is not green to begin with, stop and report.

---

## File map

| File | Change |
|---|---|
| `packages/tokens/scripts/contrast-matrix.mjs` | Add dark-surface brand-fill check (T1); add brand-surface theme row + generalize sentinel (T3) |
| `packages/tokens/src/brand/code.tokens.json` | Lift `accent.fill` to dark-safe `#874af7` (T1) |
| `packages/tokens/src/brand/meta.tokens.json` | Lift `accent.fill` to dark-safe `#3f61ff` (T1) |
| `packages/tokens/build.mjs` | Hex base + `@supports` oklch overlay via helper (T2); split brand surface + add its build (T3); wire density (T4); silence collision warnings (T7) |
| `packages/tokens/src/semantic/brand-surface.tokens.json` | **New** - distinct black-first brand surface (T3) |
| `packages/tokens/src/semantic/core.tokens.json` | Add `control.h` / `control.pad-y` comfortable defaults (T4) |
| `packages/tokens/src/semantic/density.tokens.json` | Replace with consumed `control.*` compact values (T4) |
| `packages/css/src/primitives.css` | Consume `--control-h` / `--control-pad-y` (T4); add `@media print` (T5) |
| `README.md` | Soften the false a11y absolute; fix Tailwind label; add PAT/.npmrc note (T6) |

> **Note on the build file:** `packages/tokens/package.json` runs `node style-dictionary.config.mjs`. That file *is* the build script (it contains Builds 1-7 and the concat). References to "`build.mjs`" in this plan mean **`packages/tokens/style-dictionary.config.mjs`**. (`packages/css/build.mjs` is a separate, simple copy script - only touched if noted.)

---

### Task 1: Dark-aware contrast gate + lift the two failing brand fills

**Blocker 1.** The gate checks each brand's `accent-fill` only against the **light** surface, so `code` (purple) and `meta` (ultramarine) pass on white but fail on the dark/brand surface where the brand block's fill wins. Verified with the repo's culori: `code` = 2.69, `meta` = 2.25 on dark ink `#1d1d1b` - both below the 3.0 the gate enforces elsewhere. Fix: teach the gate the dark case (RED), then lift the two **provisional** fills to dark-safe values (GREEN). Single lifted fills suffice - no per-surface variants - and ES/teal is untouched because the threshold stays at the real WCAG 1.4.11 figure of 3.0 (at 3.0, only `code` and `meta` fail; `es` 3.33, `zh-cluster` 3.18, `analytics`, `bim`, `abps` already pass).

**Files:**
- Modify: `packages/tokens/scripts/contrast-matrix.mjs` (brand-axis loop, ~lines 96-118)
- Modify: `packages/tokens/src/brand/code.tokens.json:4`
- Modify: `packages/tokens/src/brand/meta.tokens.json:4`

**Interfaces:**
- Consumes: the built `dist/tokens.css` (existing baseline build).
- Produces: the gate now reports a `bg-surface-1 (dark)` failure shape `{ brand, fg:'accent-fill', bg:'bg-surface-1 (dark)', ratio, need:3.0 }`; lifted fills `code=#874af7`, `meta=#3f61ff`.

- [ ] **Step 1: Add the dark-surface brand-fill check (the failing test)**

In `packages/tokens/scripts/contrast-matrix.mjs`, inside `checkContrast`, locate the brand-axis section that starts `const base = readVars(css, ':root');` (≈line 97). Immediately **after** that line, add the dark base:

```js
  // Resolve the dark surface once: on a dark OR brand surface the brand block's
  // accent-fill wins over the dark block (equal specificity; brand emitted
  // later), so the fill sits on the dark surface. The gate must test that too.
  const darkBase = { ...base, ...readVars(css, '[data-theme="dark"]') };
```

Then, inside the `for (const brand of BRANDS)` loop, **after** the existing `fillSurface` block (the `if (!(fillSurface >= 3.0)) {...}` ending ≈line 117), add:

```js
    // Dark-surface non-text contrast (WCAG 1.4.11 = 3.0) - the gap the gate missed.
    const darkSurface = resolve(darkBase, darkBase['bg-surface-1']);
    const fillOnDark = ratio(fill, darkSurface);
    if (!(fillOnDark >= 3.0)) {
      failures.push({ brand, fg: 'accent-fill', bg: 'bg-surface-1 (dark)', ratio: Math.round(fillOnDark * 100) / 100, need: 3.0 });
    }
```

- [ ] **Step 2: Run the gate to verify it fails**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens contrast`
Expected: **FAIL** (exit 1), `Contrast failures:` listing `{ brand: 'code', … bg: 'bg-surface-1 (dark)', ratio: 2.69, need: 3 }` and `{ brand: 'meta', … ratio: 2.25, need: 3 }`. (Runs against the existing `dist/tokens.css`; no rebuild needed because token values have not changed yet.)

- [ ] **Step 3: Lift the two provisional fills to dark-safe values**

`packages/tokens/src/brand/code.tokens.json` - change the `fill` line:

```json
    "fill":    { "$type": "color", "$value": "#874af7", "$description": "Provisional; lifted from raw purple so it clears AA non-text contrast on the dark/brand surface (3.5) while keeping white-on-fill ≥4.5." },
```

`packages/tokens/src/brand/meta.tokens.json` - change the `fill` line:

```json
    "fill":    { "$type": "color", "$value": "#3f61ff", "$description": "Provisional; lifted from raw ultramarine so it clears AA non-text contrast on the dark/brand surface (3.5) while keeping white-on-fill ≥4.5." },
```

- [ ] **Step 4: Rebuild + run the gate to verify it passes**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens build`
Expected: build succeeds and prints `Contrast matrix: all pairs pass WCAG AA.` (exit 0). The lifted fills now read `oklch(...)` of `#874af7` / `#3f61ff` in `dist/tokens.css` and clear 3.5 on dark ink, 4.0+ on the brand surface.

- [ ] **Step 5: Commit**

```bash
git add packages/tokens/scripts/contrast-matrix.mjs packages/tokens/src/brand/code.tokens.json packages/tokens/src/brand/meta.tokens.json
git commit -m "fix(tokens): gate brand fills on dark surface; lift code/meta to AA-safe fills"
```

---

### Task 2: oklch hex fallback via `@supports`

**Adversarial addition (now required).** 42 colours ship as bare `oklch()` with no sRGB/hex fallback, so colour silently breaks on locked-down/embedded/PDF engines (Citrix, kiosks, BIM/CAD webviews, headless-Chrome PDF). Fix: emit **hex** as the base (the universally-supported fallback) and override with `oklch()` inside `@supports (color: oklch(0 0 0))`. Custom properties are *not* parse-time validated, so the two-declaration trick fails for them - `@supports` is the correct mechanism. A small helper builds each colour block twice (hex base + oklch overlay) so we don't duplicate five Style Dictionary instances by hand.

**Files:**
- Modify: `packages/tokens/build.mjs` (i.e. `style-dictionary.config.mjs`) - Builds 1, 2, 4, and the final concat.

**Interfaces:**
- Consumes: the existing `name/no-default` and `color/oklch` transforms.
- Produces: helper `buildColorBlock({ name, source, selector, outputFilter }) → Promise<{ hex: string, oklch: string }>`. Constants `HEX_TRANSFORMS = ['name/no-default']`, `OKLCH_TRANSFORMS = ['name/no-default', 'color/oklch']`. `dist/tokens.css` = hex blocks + tints, then one `@supports (color: oklch(0 0 0)) { … }` wrapping the oklch overlays. **Task 3 and Task 7 call/extend this helper.**

- [ ] **Step 1: Add the transforms split + helper**

In `packages/tokens/style-dictionary.config.mjs`, **replace** the single line `const TRANSFORMS = ['name/no-default', 'color/oklch'];` (≈line 95) with:

```js
const HEX_TRANSFORMS = ['name/no-default'];
const OKLCH_TRANSFORMS = ['name/no-default', 'color/oklch'];

// Build one colour-bearing selector block twice: a hex base (the universal
// fallback) and an oklch overlay containing ONLY raw colour values (reference
// vars are identical in both passes and stay in the base). The caller wraps the
// overlays in a single @supports (color: oklch()) block.
async function buildColorBlock({ name, source, selector, outputFilter }) {
  const make = (transforms, suffix, extra) =>
    new StyleDictionary({
      source,
      platforms: {
        css: {
          transforms,
          buildPath: 'dist/',
          options: { outputReferences: true },
          files: [{
            destination: `tokens-${name}${suffix}.css`,
            format: 'css/variables',
            filter: extra ? (t) => outputFilter(t) && extra(t) : outputFilter,
            options: { outputReferences: true, selector },
          }],
        },
      },
    });
  await make(HEX_TRANSFORMS, '').buildAllPlatforms();
  await make(OKLCH_TRANSFORMS, '-oklch', (t) =>
    t.$type === 'color' && !String(t.original?.$value ?? '').startsWith('{'),
  ).buildAllPlatforms();
  return {
    hex: readFileSync(`dist/tokens-${name}.css`, 'utf8'),
    oklch: readFileSync(`dist/tokens-${name}-oklch.css`, 'utf8'),
  };
}
```

- [ ] **Step 2: Route Builds 1, 2, 4 through the helper**

**Replace Build 1** (`const sdBase = new StyleDictionary({…}); await sdBase.buildAllPlatforms();`, ≈lines 99-124) with:

```js
// ── Build 1: Base - primitives + core semantic + light defaults → :root ───────
const base = await buildColorBlock({
  name: 'base',
  source: [
    'src/primitive/*.tokens.json',
    'src/semantic/core.tokens.json',
    'src/semantic/light.tokens.json',
    'src/semantic/typography.tokens.json',
  ],
  selector: ':root',
  outputFilter: (t) => !t.filePath.includes('/density.') && !t.filePath.includes('/brand/'),
});
```

**Replace Build 2** (`const sdDark = …; await sdDark.buildAllPlatforms();`, ≈lines 128-154) with:

```js
// ── Build 2: Dark overrides ──────────────────────────────────────────────────
const dark = await buildColorBlock({
  name: 'dark',
  source: [
    'src/primitive/*.tokens.json',
    'src/semantic/core.tokens.json',
    'src/semantic/light.tokens.json',
    'src/semantic/dark.tokens.json',
  ],
  selector: '[data-theme="dark"], [data-surface="brand"]',
  outputFilter: (t) => t.filePath.includes('/dark.'),
});
```

**Replace the Build 4 brand loop** (the `for (const brand of brandFiles) { … }`, ≈lines 192-215) with:

```js
const brandBlocks = [];
for (const brand of brandFiles) {
  brandBlocks.push(await buildColorBlock({
    name: `brand-${brand}`,
    source: ['src/primitive/*.tokens.json', `src/brand/${brand}.tokens.json`],
    selector: `[data-brand="${brand}"]`,
    outputFilter: (t) => t.filePath.includes(`/brand/${brand}.`),
  }));
}
```

(Remove the now-unused `const brandCssFiles = [];` declaration and `brandCssFiles.push(dest);` line; `brandBlocks` replaces them. Builds 3, 5, 6, 7 are unchanged.)

- [ ] **Step 3: Rewrite the final concat to emit hex + `@supports`**

**Replace** the concat block at the end (≈lines 297-305, from `const base = readFileSync('dist/tokens-base.css', …)` through the final `writeFileSync(... tokens.css ...)`) with:

```js
// ── Concatenate: hex base (fallback) + @supports oklch overlay (enhancement) ──
const density = readFileSync('dist/tokens-density.css', 'utf8');
const tints = readFileSync('dist/tokens-tints.css', 'utf8');

const hexParts = [base.hex, dark.hex, density, ...brandBlocks.map((b) => b.hex), tints];
const oklchParts = [base.oklch, dark.oklch, ...brandBlocks.map((b) => b.oklch)]
  .filter((s) => s.includes('--')); // drop empty overlays (blocks with no raw colours)

const supports = `@supports (color: oklch(0 0 0)) {\n${oklchParts.join('\n')}\n}\n`;
writeFileSync('dist/tokens.css', [...hexParts, supports].join('\n'));

console.log('tokens.css written ✓');
```

- [ ] **Step 4: Build and verify the fallback is present and the gate still passes**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens build`
Expected: `tokens.css written ✓` then `Contrast matrix: all pairs pass WCAG AA.`

Run: `node -e "const c=require('fs').readFileSync('packages/tokens/dist/tokens.css','utf8'); const sup=c.includes('@supports (color: oklch'); const hex=/--color-typology-purple:\s*#/i.test(c); const okl=c.includes('oklch('); console.log({sup,hex,okl}); process.exit(sup&&hex&&okl?0:1)"`
Expected: `{ sup: true, hex: true, okl: true }` (exit 0) - `@supports` block present, a primitive declared as hex in the base, oklch present in the overlay.

- [ ] **Step 5: Commit**

```bash
git add packages/tokens/style-dictionary.config.mjs
git commit -m "feat(tokens): hex sRGB fallback with @supports oklch overlay for embedded/print engines"
```

---

### Task 3: Split + design a distinct black-first brand surface

**Blocker 2b.** `data-surface="brand"` shares one selector with `data-theme="dark"`, so the advertised black-first marketing surface is byte-identical to a dark dashboard. Give it its own selector and a distinct, contrast-verified palette: a flatter/darker "Black Steel" ramp (surfaces nearer pure black than the dashboard's lifted ink panels) with crisper white text - the marketing canvas, vs. the dashboard's layered-panel legibility. Values below are pre-verified against the gate (all pass).

**Files:**
- Create: `packages/tokens/src/semantic/brand-surface.tokens.json`
- Modify: `packages/tokens/build.mjs` (split dark selector; add brand-surface block; add to concat)
- Modify: `packages/tokens/scripts/contrast-matrix.mjs` (add brand row; generalize the sentinel)

**Interfaces:**
- Consumes: `buildColorBlock` from Task 2; primitive colour refs (`{color.neutral.*}`, `{color.accent.*}`, `{color.typology.*}`).
- Produces: a `[data-surface="brand"]` block in `dist/tokens.css` (hex + oklch overlay), emitted **after** dark and **before** the brand-accent blocks so brand accents still win; the gate's theme loop now includes `['[data-surface="brand"]', 'brand']`.

- [ ] **Step 1: Create the brand-surface token file**

Create `packages/tokens/src/semantic/brand-surface.tokens.json`:

```json
{
  "bg":   { "page": { "$type": "color", "$value": "{color.neutral.black}" },
            "surface-1": { "$type": "color", "$value": "#0D0D0C" },
            "surface-2": { "$type": "color", "$value": "#161614" },
            "surface-3": { "$type": "color", "$value": "#21211E" } },
  "text": { "strong": { "$type": "color", "$value": "{color.neutral.white}" },
            "default": { "$type": "color", "$value": "#E8E6E3" },
            "muted": { "$type": "color", "$value": "#9A9794" },
            "muted-strong": { "$type": "color", "$value": "#C9C7C4" },
            "disabled": { "$type": "color", "$value": "#5A5754" } },
  "border": { "subtle": { "$type": "color", "$value": "rgba(255,255,255,0.10)" },
              "default": { "$type": "color", "$value": "rgba(255,255,255,0.18)" },
              "strong": { "$type": "color", "$value": "rgba(255,255,255,0.30)" } },
  "accent": { "DEFAULT": { "$type": "color", "$value": "{color.accent.teal-light}" },
              "fill": { "$type": "color", "$value": "{color.accent.teal-fill}" },
              "subtle": { "$type": "color", "$value": "rgba(63,185,199,0.16)" } },
  "scrim": { "$type": "color", "$value": "rgba(0,0,0,0.7)" },
  "intent": {
    "error-text":   { "$type": "color", "$value": "#F44375" },
    "success-text": { "$type": "color", "$value": "{color.typology.dark-green}" },
    "warning-text": { "$type": "color", "$value": "{color.typology.yellow}" },
    "info-text":    { "$type": "color", "$value": "#2988F0" }
  }
}
```

- [ ] **Step 2: Split the dark selector and add the brand-surface build**

In `packages/tokens/style-dictionary.config.mjs`, change the Build 2 (`dark`) `selector` from `'[data-theme="dark"], [data-surface="brand"]'` back to **just** `'[data-theme="dark"]'`.

Then, immediately **after** the Build 2 `dark` block, add:

```js
// ── Build 2b: Brand surface - distinct black-first marketing palette ──────────
const brandSurface = await buildColorBlock({
  name: 'brand-surface',
  source: ['src/primitive/*.tokens.json', 'src/semantic/brand-surface.tokens.json'],
  selector: '[data-surface="brand"]',
  outputFilter: (t) => t.filePath.includes('/brand-surface.'),
});
```

In the final concat (Task 2, Step 3), insert `brandSurface` after `dark` in both arrays:

```js
const hexParts = [base.hex, dark.hex, brandSurface.hex, density, ...brandBlocks.map((b) => b.hex), tints];
const oklchParts = [base.oklch, dark.oklch, brandSurface.oklch, ...brandBlocks.map((b) => b.oklch)]
  .filter((s) => s.includes('--'));
```

- [ ] **Step 3: Add the brand surface to the gate + generalize the sentinel**

In `packages/tokens/scripts/contrast-matrix.mjs`, add the brand row to the theme loop (≈line 50):

```js
  for (const [selector, label] of [
    [':root', 'light'],
    ['[data-theme="dark"]', 'dark'],
    ['[data-surface="brand"]', 'brand'],
  ]) {
```

Generalize the sentinel guard so it protects every non-light surface. Change `if (label === 'dark') {` (≈line 63) to `if (label !== 'light') {`, and update the two error strings inside it to interpolate the selector, e.g.:

```js
      if (Object.keys(darkVars).length === 0) {
        throw new Error(
          `readVars returned no vars for selector "${selector}" - block was not matched. ` +
          'Check the CSS selector format vs. the regex in readVars.'
        );
      }
      if (!darkBgPage || darkBgPageResolved === lightBgPage) {
        throw new Error(
          `Sentinel failed for "${selector}": --bg-page ("${darkBgPageResolved}") ` +
          `matches the light value ("${lightBgPage}") or is absent - block was not genuinely read.`
        );
      }
```

(The local variable names `darkVars` / `darkBgPage` stay as-is; they now hold whichever non-light block is under test.)

- [ ] **Step 4: Build + run the gate**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens build`
Expected: build + `Contrast matrix: all pairs pass WCAG AA.` (the gate now silently exercises a third surface - `light`, `dark`, `brand`).

Run: `node -e "const c=require('fs').readFileSync('packages/tokens/dist/tokens.css','utf8'); const m=c.match(/\[data-surface=\x22brand\x22\]\s*\{[^}]*--bg-surface-1:\s*([^;]+);/); console.log(m&&m[1]); process.exit(/0d0d0c|oklch/i.test(m?m[1]:'')?0:1)"`
Expected: prints the brand surface-1 value (hex `#0D0D0C`), which differs from dark's `#1d1d1b`.

- [ ] **Step 5: Commit**

```bash
git add packages/tokens/src/semantic/brand-surface.tokens.json packages/tokens/style-dictionary.config.mjs packages/tokens/scripts/contrast-matrix.mjs
git commit -m "feat(tokens): distinct black-first data-surface=brand, split from dark + gated"
```

---

### Task 4: Wire `data-density="compact"` so it takes effect

**Blocker 2a.** Compact density is advertised but inert - its tokens (`row.h`, `control.pad-y`) are never consumed and don't even map to the button height; primitives hardcode `min-height: 44px`. Introduce a `--control-h` semantic (44px comfortable default in `:root`, 36px in the compact block) and a `--control-pad-y`, and make the primitives consume them. 36px stays ≥24px (WCAG 2.5.8 AA target size).

**Files:**
- Modify: `packages/tokens/src/semantic/core.tokens.json` (add `control` defaults)
- Modify: `packages/tokens/src/semantic/density.tokens.json` (replace with consumed values)
- Modify: `packages/css/src/primitives.css` (`.btn`, `.input`/`.select`, `.icon-btn`)

**Interfaces:**
- Consumes: nothing new.
- Produces: `--control-h` (`:root` = 44px, `[data-density="compact"]` = 36px) and `--control-pad-y` (8px / 6px); primitives reference `var(--control-h)` / `var(--control-pad-y)`.

- [ ] **Step 1: Add comfortable defaults to core semantic tokens**

In `packages/tokens/src/semantic/core.tokens.json`, add a `control` group (place it after the `accent` block, before `intent`):

```json
  "control": {
    "h":     { "$type": "dimension", "$value": "44px", "$description": "Comfortable control height (buttons, inputs, icon buttons). Compact density overrides to 36px." },
    "pad-y": { "$type": "dimension", "$value": "8px" }
  },
```

(Remember to add the trailing comma after the preceding block so the JSON stays valid.)

- [ ] **Step 2: Replace the inert density tokens with consumed ones**

Replace the entire contents of `packages/tokens/src/semantic/density.tokens.json` with:

```json
{
  "control": {
    "h":     { "$type": "dimension", "$value": "36px" },
    "pad-y": { "$type": "dimension", "$value": "6px" }
  }
}
```

(`row.h` is dropped - nothing consumes it; re-add a `row` group when the Phase-3 data-table component needs it.)

- [ ] **Step 3: Make the primitives consume the control tokens**

In `packages/css/src/primitives.css`:

- `.btn` (line 8): change `min-height: 44px;` → `min-height: var(--control-h, 44px);`
- `.input, .select` (line 20): change `min-height: 44px; padding: 9px 12px;` → `min-height: var(--control-h, 44px); padding: var(--control-pad-y, 9px) 12px;`
- `.icon-btn` (line 28): change `width: 44px; height: 44px;` → `width: var(--control-h, 44px); height: var(--control-h, 44px);`

- [ ] **Step 4: Build + verify compact is real**

Run: `pnpm build` (builds tokens then css)
Expected: both packages build; gate passes.

Run: `node -e "const fs=require('fs'); const t=fs.readFileSync('packages/tokens/dist/tokens.css','utf8'); const p=fs.readFileSync('packages/css/dist/index.css','utf8'); const compact=/\[data-density=\x22compact\x22\]\s*\{[^}]*--control-h:\s*36px/.test(t); const consumed=p.includes('var(--control-h'); console.log({compact,consumed}); process.exit(compact&&consumed?0:1)"`
Expected: `{ compact: true, consumed: true }` (exit 0) - compact overrides `--control-h` to 36px and the shipped CSS consumes it.

- [ ] **Step 5: Commit**

```bash
git add packages/tokens/src/semantic/core.tokens.json packages/tokens/src/semantic/density.tokens.json packages/css/src/primitives.css
git commit -m "feat(css): wire data-density=compact via --control-h (44px/36px)"
```

---

### Task 5: Print fallback so dark/brand pages don't print ghosted

**Adversarial addition (now required).** Zero print styles in a firm that prints constantly - a dark or brand page prints as ghosted/ink-heavy or blank. Add a minimal `@media print` block that forces surfaces to white and text to black so any page prints legibly.

**Files:**
- Modify: `packages/css/src/primitives.css` (append at end)

**Interfaces:**
- Consumes: the semantic surface/text custom properties.
- Produces: a print block that re-points `--bg-*` / `--text-*` / `--border-*` to print-safe values for all three surfaces.

- [ ] **Step 1: Append the print block**

Add to the end of `packages/css/src/primitives.css`:

```css
/* ponytail: baseline print legibility - force any surface (light/dark/brand) to
   black-on-white so pages don't print ghosted. Richer print styling can come later. */
@media print {
  :root, [data-theme="dark"], [data-surface="brand"] {
    --bg-page: #fff; --bg-surface-1: #fff; --bg-surface-2: #fff; --bg-surface-3: #fff;
    --text-strong: #000; --text-default: #000; --text-muted: #333;
    --border-subtle: #ccc; --border-default: #999; --border-strong: #666;
  }
  body { background: #fff; }
  .card, .surface, .input, .select, .icon-btn { box-shadow: none; }
}
```

- [ ] **Step 2: Build + verify the print block ships**

Run: `pnpm --filter @gitzhacode/zha-ui-css build`
Expected: `@gitzhacode/zha-ui-css built.`

Run: `node -e "process.exit(require('fs').readFileSync('packages/css/dist/index.css','utf8').includes('@media print')?0:1)"`
Expected: exit 0 (the print block is in the shipped `index.css`).

- [ ] **Step 3: Commit**

```bash
git add packages/css/src/primitives.css
git commit -m "feat(css): minimal @media print fallback (black-on-white for all surfaces)"
```

---

### Task 6: Correct the README over-claims, Tailwind label, and install docs

**Blocker 3.** The README states accessibility is "guaranteed by construction" and you "can't ship an inaccessible default" - verified false (the gate covers colour contrast, not full WCAG). It also calls the colours-only preset a "Tailwind v4 preset" (it emits v3-style colours), and `pnpm add @gitzhacode/...` 401s with no PAT/`.npmrc` note. Fix the copy; no behaviour change.

**Files:**
- Modify: `README.md`

**Interfaces:** docs only.

- [ ] **Step 1: Soften the false accessibility absolute**

In `README.md`, replace the bullet (lines 20-22):

```markdown
- **Brand _and_ accessibility guaranteed by construction.** Every colour pairing is
  checked against WCAG AA on each build - fail a contrast, fail the build. You can't
  ship an off-brand or inaccessible default.
```

with:

```markdown
- **Brand and colour-contrast, enforced on every build.** Every brand's text and
  button colours are checked against their surfaces - light, dark, and brand - on each
  build; fail the gate, fail the build. This guarantees _colour contrast_, not full
  accessibility: focus order, keyboard operation and component-level WCAG remain the
  app author's responsibility (and are in scope for public-facing apps).
```

- [ ] **Step 2: Fix the Tailwind label**

In `README.md`, change the import comment (line 117) from:

```ts
import preset from '@gitzhacode/zha-ui-tokens/tailwind'; // Tailwind v4 preset
```

to:

```ts
import preset from '@gitzhacode/zha-ui-tokens/tailwind'; // Tailwind colour preset (v3-style; not a v4 @theme config)
```

- [ ] **Step 3: Add the GitHub Packages auth note**

In `README.md`, immediately **after** the `## For developers` install fence (after line 104, the `pnpm add @gitzhacode/zha-ui-css` block), add:

```markdown
> **First time?** These packages live on GitHub Packages, so npm/pnpm needs a one-time
> auth line. Add to your project `.npmrc`:
> ```
> @gitzhacode:registry=https://npm.pkg.github.com
> //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
> ```
> and set `GITHUB_TOKEN` to a personal access token with the `read:packages` scope.
> (Ring-1 plain-HTML apps don't need this - they link the published CSS URL instead.)
```

- [ ] **Step 4: Verify**

Run: `node -e "const r=require('fs').readFileSync('README.md','utf8'); const bad=r.includes('guaranteed by construction')||r.includes('Tailwind v4 preset'); const good=r.includes('read:packages'); console.log({bad,good}); process.exit(!bad&&good?0:1)"`
Expected: `{ bad: false, good: true }` (exit 0).

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: correct a11y over-claim, Tailwind preset label, add GitHub Packages auth note"
```

---

### Task 7: Silence the collision warnings + final full-build verification

**Blocker 4 (lowest priority).** The build prints "Token collisions detected (80)" plus filtered-reference warnings. The audit verified two clean rebuilds are byte-identical, so the collision warnings are log noise and a latent fragility. Disable Style Dictionary's *warnings* (errors still throw), then run the full build + tests once to confirm everything is green together.

**Files:**
- Modify: `packages/tokens/style-dictionary.config.mjs` (add `log` to each SD instance)

**Interfaces:** build-time logging only; output bytes unchanged.

- [ ] **Step 1: Add `log: { warnings: 'disabled' }` to every Style Dictionary instance**

In `packages/tokens/style-dictionary.config.mjs`:

- In the `buildColorBlock` helper, add `log: { warnings: 'disabled' },` as the first key of the `new StyleDictionary({ … })` config (covers base, dark, brand-surface, and all brand blocks).
- Add the same `log: { warnings: 'disabled' },` line to the remaining standalone instances: `sdDensity` (Build 3), `sdTints` (Build 5), `sdJs` (Build 6), and `sdKebab` (Build 7).

```js
// ponytail: collisions are byte-reproducible log noise (audit-verified); errors
// still throw. Re-enable warnings if a new source file changes resolved values.
new StyleDictionary({ log: { warnings: 'disabled' }, source: /* … */ });
```

- [ ] **Step 2: Full build - verify no collision warnings, gate green**

Run: `pnpm build 2>&1 | tee /tmp/zha-build.log` (Bash) - or just `pnpm build` and read the output.
Expected: no `Token collisions detected` / `filtered` warning lines; `Contrast matrix: all pairs pass WCAG AA.`; both packages build.

Run: `node -e "process.exit(require('fs').readFileSync('/tmp/zha-build.log','utf8').includes('collisions')?1:0)"` (skip if you didn't capture the log)
Expected: exit 0.

- [ ] **Step 3: Tests + types + package validation**

Run: `pnpm test && pnpm lint`
Expected: pass. (If `pnpm test` reports "no test files", that is the current baseline - acceptable; the contrast gate is the functional guard.)

Optionally: `pnpm --filter @gitzhacode/zha-ui-tokens exec attw --pack . --profile esm-only --exclude-entrypoints tokens.css llms.txt` - expected: no type-resolution errors.

- [ ] **Step 4: Commit**

```bash
git add packages/tokens/style-dictionary.config.mjs
git commit -m "chore(tokens): disable Style Dictionary collision warnings (byte-reproducible noise)"
```

---

## Self-review

- **Spec/blocker coverage:** Blocker 1 → T1. Blocker 2a (density) → T4. Blocker 2b (brand surface) → T3. Blocker 3 (README/Tailwind/PAT) → T6. Blocker 4 (collisions) → T7. Adversarial: oklch fallback → T2; print → T5. The false "guaranteed by construction" line (the one non-negotiable) → T6 Step 1. ✅
- **Sequencing:** T2 introduces `buildColorBlock`; T3 calls it and edits the same concat T2 wrote - T2 **must** precede T3. T1 touches only the gate + two token files (independent). T4/T5/T6 are independent; T5 and T4 both edit `primitives.css` (different lines / append). T7 edits `build.mjs` last (after T2/T3/T4 have settled it). Order T1→T7 as written. ✅
- **Type/name consistency:** `buildColorBlock({ name, source, selector, outputFilter }) → { hex, oklch }` is defined in T2 and used identically in T2/T3. `--control-h` / `--control-pad-y` names match across T4 token files and primitives. Gate failure shape `bg:'bg-surface-1 (dark)'` is internal to T1. ✅
- **Values pre-verified:** lifted fills (`#874af7`, `#3f61ff`) and the full brand-surface palette were checked with the repo's culori against the exact gate thresholds before being written here - all pass. ✅
- **ES untouched:** no task changes any teal/ES value; the 3.0 threshold keeps ES (3.33) and zh-cluster (3.18) out of scope. ✅

## Not in this plan (deliberately)

- **HANDOFF.md** stays untracked - it's intentional scratch (recent commit `chore: stop tracking SDD scratch`); the audit's "git add HANDOFF.md" is superseded.
- **13px body / type-scale** nit - noted by review but not a blocker; revisit with Phase-3 typography.
- **The stack-standard rollout** (publish CSS to Pages, `AGENTS.md`, starter templates) is a **separate plan** that depends on these fixes landing - see `docs/specs/2026-06-21-zha-ui-app-stack-standard-design.md`.
