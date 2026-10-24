# Dual-Accent Colour Pairs - Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the system mechanism for per-team accent *pairs* + a gradient, fully wired for ES (teal→magenta), without assigning pairs to the other six teams.

**Architecture:** Add a parallel `--accent-2*` token family and define `--brand-grad` once in `:root` as `linear-gradient(105deg, var(--accent) 0%, var(--accent-2) 100%)`, so it resolves live through the existing `data-brand × data-theme × data-surface` cascade. The secondary is expressive-only (gradient + tints); the primary stays the sole interactive accent. No build-logic change - Style Dictionary Build 4 already emits whatever a brand file defines.

**Tech Stack:** DTCG JSON → Style Dictionary v4 (`packages/tokens`) → CSS custom properties; culori contrast gate; CSS-only primitives (`packages/css`); vitest; pnpm workspace.

**Spec:** `docs/specs/2026-06-26-zha-ui-dual-accent-pairs-design.md` (Phase A only; Phase B = other teams, out of scope).

## Global Constraints

- The firm is **"ZHA"** - always; never write its former spelled-out name in code, docs, or commits.
- ZHA Sans (`--font-secondary`) is always **regular weight + upright** - never bold, never italic.
- **Secondary is expressive-only:** `--accent-2*` drives the gradient, tints, and identity/hero accents. The **primary** (`--accent`/`--accent-fill`) stays the sole interactive accent (buttons, focus, links, active states). The secondary is never a status/interactive colour.
- **Gradients are identity/hero only** - never a default work-surface heading style. `.accent-grad-text` solid fallback uses **`--accent-fill`**, never bare `--accent` (bare `--accent` as text fails AA on light).
- **Pairs are un-assigned** except ES (teal→magenta, confirmed). Do **not** add `accent-2` to any brand file other than ES in Phase A.
- **Built `dist/` is gitignored** - commit **source** files only (`*.tokens.json`, `src/**`, `test/**`, docs). Never `git add` anything under `dist/`.
- Gradient value uses **sRGB stops** (no `in oklch`) and angle **105deg** (matches the existing ES grad convention).
- Commit messages: `type(scope): subject` (e.g. `feat(tokens): …`).
- Run package scripts via `pnpm --filter <pkg> <script>` from the repo root (no `cd`).

---

### Task 1: Token sources - secondary family + var-based `--brand-grad`

Add `--accent-2*` + the gradient token to core (default = ES magenta), add ES's confirmed secondary, and drop ES's obsolete teal→green gradient (now inherited from core).

**Files:**
- Modify: `packages/tokens/src/semantic/core.tokens.json`
- Modify: `packages/tokens/src/brand/es.tokens.json`
- Test: `packages/tokens/test/brand-axis.test.ts`

**Interfaces:**
- Produces (CSS custom properties, consumed by Tasks 2-4): `--accent-2` (= `var(--color-accent-magenta)` by default), `--accent-2-fill` (= magenta), `--accent-2-subtle` (= `rgba(203,0,146,0.12)`), and `--brand-grad` (= `linear-gradient(105deg, var(--accent) 0%, var(--accent-2) 100%)`) in `:root`. `[data-brand="es"]` additionally re-emits `--accent-2` + `--accent-2-subtle`.

- [ ] **Step 1: Update the ES brand-axis test to assert the new shape (write it failing)**

In `packages/tokens/test/brand-axis.test.ts`, replace the first `it(...)` block (currently titled `emits the ES brand overriding --accent + its teal→green gradient`, lines 10-18) with:

```ts
  it('emits the ES brand pair (--accent teal + --accent-2 magenta) and a var-based --brand-grad in :root', () => {
    // ES overrides the SEMANTIC --accent/--accent-2 vars (not a namespaced
    // --brand-accent), so data-brand="es" actually recolours primitive-driven components.
    expect(css()).toMatch(
      /\[data-brand="es"\][^{]*\{[^}]*--accent:\s*var\(--color-accent-teal\)/s,
    );
    expect(css()).toMatch(
      /\[data-brand="es"\][^{]*\{[^}]*--accent-2:\s*var\(--color-accent-magenta\)/s,
    );
    // The gradient is defined ONCE in :root from the live --accent/--accent-2 vars.
    expect(css()).toMatch(
      /:root[^{]*\{[^}]*--brand-grad:\s*linear-gradient\(105deg, var\(--accent\) 0%, var\(--accent-2\) 100%\)/s,
    );
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens test`
Expected: FAIL on the new `--accent-2` / `:root … --brand-grad` assertions (the built `dist/tokens.css` is still the old shape).

- [ ] **Step 3: Add the secondary family + gradient token to core**

In `packages/tokens/src/semantic/core.tokens.json`, replace the `"accent"` block:

```json
  "accent": {
    "DEFAULT": { "$type": "color", "$value": "{color.accent.teal}" },
    "fill":    { "$type": "color", "$value": "{color.accent.teal-fill}" },
    "on":      { "$type": "color", "$value": "{color.neutral.white}" }
  },
```

with (adds `accent.2.*`):

```json
  "accent": {
    "DEFAULT": { "$type": "color", "$value": "{color.accent.teal}" },
    "fill":    { "$type": "color", "$value": "{color.accent.teal-fill}" },
    "on":      { "$type": "color", "$value": "{color.neutral.white}" },
    "2": {
      "DEFAULT": { "$type": "color", "$value": "{color.accent.magenta}", "$description": "Secondary accent (default = ES magenta) - gradient endpoint + tint. Expressive only; never an interactive/UI colour." },
      "fill":    { "$type": "color", "$value": "{color.accent.magenta}" },
      "subtle":  { "$type": "color", "$value": "rgba(203,0,146,0.12)" }
    }
  },
```

Then add a top-level `"brand"` block. Insert it immediately after the closing `}` of the `"accent"` block (before `"control"`):

```json
  "brand": {
    "grad": { "$type": "other", "$value": "linear-gradient(105deg, var(--accent) 0%, var(--accent-2) 100%)", "$description": "Brand gradient = primary→secondary, resolved live from --accent/--accent-2. Identity/hero use only." }
  },
```

- [ ] **Step 4: Add ES's confirmed secondary and remove its obsolete gradient**

Replace the entire contents of `packages/tokens/src/brand/es.tokens.json` with:

```json
{
  "accent": {
    "DEFAULT": { "$type": "color", "$value": "{color.accent.teal}", "$description": "Confirmed ES brand accent (teal)." },
    "fill":    { "$type": "color", "$value": "{color.accent.teal-fill}" },
    "subtle":  { "$type": "color", "$value": "rgba(4,140,156,0.12)" },
    "2": {
      "DEFAULT": { "$type": "color", "$value": "{color.accent.magenta}", "$description": "Confirmed ES secondary accent (magenta) - gradient endpoint + tint." },
      "subtle":  { "$type": "color", "$value": "rgba(203,0,146,0.12)" }
    }
  },
  "brand": {
    "name": { "$type": "other", "$value": "ES" }
  }
}
```

(ES inherits `--accent-2-fill` = magenta from core; it does not need its own.)

- [ ] **Step 5: Rebuild tokens (also runs the contrast gate) and verify the test passes**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens build`
Expected: `Contrast matrix: all pairs pass WCAG AA.` + `tokens.css written ✓` (no gate failure - `--accent` is unchanged and the new `--accent-2*` is not yet gated).

Run: `pnpm --filter @gitzhacode/zha-ui-tokens test`
Expected: PASS (all brand-axis tests, including the two unchanged `:root`/stub-brand tests).

- [ ] **Step 6: Commit (sources only - dist is gitignored)**

```bash
git add packages/tokens/src/semantic/core.tokens.json packages/tokens/src/brand/es.tokens.json packages/tokens/test/brand-axis.test.ts
git commit -m "feat(tokens): add --accent-2 family + var-based --brand-grad (ES teal→magenta)"
```

---

### Task 2: Contrast gate - secondary-fill AA + no-partial-secondary

Add the only two checks that are universally valid in Phase A: validate the secondary fill's contrast, and forbid a partial secondary (a tint/fill without its hue).

**Files:**
- Modify: `packages/tokens/scripts/contrast-matrix.mjs`
- Test: `packages/tokens/test/brand-axis.test.ts`

**Interfaces:**
- Consumes: the built `dist/tokens.css` from Task 1 (must contain `--accent-2-fill`).
- Produces: an exported helper `partialSecondaryFailure(brand, brandVars)` returning `{ brand, note } | null`, used by `checkContrast` and unit-tested.

- [ ] **Step 1: Write the failing unit test for the new helper**

In `packages/tokens/test/brand-axis.test.ts`, add `partialSecondaryFailure` to the import on line 3:

```ts
import { checkContrast, partialSecondaryFailure } from '../scripts/contrast-matrix.mjs';
```

Add this block inside the `describe('brand axis', …)`:

```ts
  it('flags a secondary tint/fill declared without its --accent-2 hue', () => {
    // partial secondary → failure
    expect(partialSecondaryFailure('x', { 'accent-2-subtle': 'rgba(0,0,0,.1)' })).not.toBeNull();
    expect(partialSecondaryFailure('x', { 'accent-2-fill': '#000' })).not.toBeNull();
    // complete secondary → ok
    expect(partialSecondaryFailure('x', { 'accent-2': '#000', 'accent-2-subtle': 'rgba(0,0,0,.1)' })).toBeNull();
    // no secondary at all → ok (unconfirmed teams inherit core)
    expect(partialSecondaryFailure('x', { accent: '#000' })).toBeNull();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens test`
Expected: FAIL - `partialSecondaryFailure is not a function` (not yet exported).

- [ ] **Step 3: Implement the helper, the PAIRS row, and wire the check into the brand loop**

In `packages/tokens/scripts/contrast-matrix.mjs`:

(a) Add the secondary-fill row to the `PAIRS` array (after the `['accent-fill', 'bg-surface-1', 3.0], ['accent-on', 'accent-fill', 4.5],` line):

```js
  // Secondary accent fill is non-text only (expressive) → WCAG 1.4.11 = 3.0.
  ['accent-2-fill', 'bg-surface-1', 3.0],
```

(b) Add the exported helper near the top (after the `ratio` function, before `const PAIRS`):

```js
// A brand that declares a secondary tint/fill MUST declare its --accent-2 hue;
// otherwise the gradient/tint silently falls back to core's default magenta.
// (A brand with NO secondary tokens is fine - it inherits core's default.)
export function partialSecondaryFailure(brand, brandVars) {
  const hasDetail = 'accent-2-subtle' in brandVars || 'accent-2-fill' in brandVars;
  return hasDetail && !('accent-2' in brandVars)
    ? { brand, fg: 'accent-2', bg: '(missing)', ratio: 0, need: 0, note: 'declares a secondary tint/fill without --accent-2' }
    : null;
}
```

(c) Call it inside the existing `for (const brand of BRANDS)` loop. After the line `const merged = { ...base, ...brandVars };` add:

```js
    const partial = partialSecondaryFailure(brand, brandVars);
    if (partial) failures.push(partial);
```

- [ ] **Step 4: Run the unit test and the gate to verify both pass**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens test`
Expected: PASS (the new helper test + all existing, incl. `checkContrast().failures` is `[]`).

Run: `pnpm --filter @gitzhacode/zha-ui-tokens contrast`
Expected: `Contrast matrix: all pairs pass WCAG AA.` (the new `accent-2-fill` row passes: magenta is 5.31 on white, ≥3.0 on dark/brand; ES's complete secondary passes the no-partial check; the six untouched teams declare no secondary tokens → vacuously pass).

- [ ] **Step 5: Commit**

```bash
git add packages/tokens/scripts/contrast-matrix.mjs packages/tokens/test/brand-axis.test.ts
git commit -m "feat(tokens): gate secondary-fill AA + forbid partial secondary"
```

---

### Task 3: CSS - generic lockup fallback + `.accent-grad` utilities

Make the lockup gradient generic per team, harden its solid fallback to `--accent-fill`, and ship the two opt-in gradient utilities.

**Files:**
- Modify: `packages/css/src/es-lockup.css`
- Modify: `packages/css/src/primitives/base.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Consumes: `--brand-grad`, `--accent`, `--accent-2`, `--accent-fill` (from Tasks 1).
- Produces (classes): `.accent-grad` (area fill), `.accent-grad-text` (gradient headline + `--accent-fill` fallback).

- [ ] **Step 1: Write the failing CSS-export tests**

In `packages/css/test/exports.test.ts`, add these three `it(...)` blocks inside the `describe`:

```ts
  it('ships brand-gradient utilities (.accent-grad fill + .accent-grad-text with --accent-fill fallback)', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.accent-grad\s*\{[^}]*background-image:\s*var\(--brand-grad\)/s);
    expect(css).toMatch(/\.accent-grad-text\s*\{[^}]*background-clip:\s*text/s);
    expect(css).toMatch(/@supports not \(\(-webkit-background-clip: text\) or \(background-clip: text\)\)\s*\{\s*\.accent-grad-text\s*\{[^}]*color:\s*var\(--accent-fill\)/s);
  });
  it('lockup solid/fallback degrades to the AA-safe --accent-fill, never bare --accent', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.zha-lockup--solid \.zha-lockup__team\s*\{[^}]*color:\s*var\(--accent-fill\)/s);
  });
  it('--brand-grad is defined once in :root from the live accent vars', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/:root[^{]*\{[^}]*--brand-grad:\s*linear-gradient\(105deg, var\(--accent\) 0%, var\(--accent-2\) 100%\)/s);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @gitzhacode/zha-ui-css test`
Expected: FAIL (utilities absent; lockup fallback still bare `--accent`; index.css not yet rebuilt with the new gradient).

- [ ] **Step 3: Genericize the lockup gradient + fallbacks**

In `packages/css/src/es-lockup.css`:

Replace lines 38-39:

```css
.zha-lockup__team {                                   /* team name - brand gradient (teal→dark-green for ES) */
  background: var(--brand-grad, linear-gradient(105deg, var(--color-typology-teal), var(--color-typology-dark-green)));
```

with:

```css
.zha-lockup__team {                                   /* team name - brand gradient (primary→secondary) */
  background: var(--brand-grad, linear-gradient(105deg, var(--accent) 0%, var(--accent-2) 100%));
```

Replace line 49:

```css
  .zha-lockup__team { background: none; color: var(--accent); }
```

with:

```css
  .zha-lockup__team { background: none; color: var(--accent-fill); }
```

Replace line 52:

```css
.zha-lockup--solid .zha-lockup__team { background: none; color: var(--accent); }
```

with:

```css
.zha-lockup--solid .zha-lockup__team { background: none; color: var(--accent-fill); }
```

- [ ] **Step 4: Add the gradient utilities to base.css**

In `packages/css/src/primitives/base.css`, insert after the `.sr-only { … }` line (line 39), before the `@media (prefers-reduced-motion: reduce)` block:

```css

/* Brand gradient utilities - identity/hero use only (never work-surface headings).
   .accent-grad = area fill; .accent-grad-text = gradient headline with a solid --accent-fill fallback. */
.accent-grad { background-image: var(--brand-grad); }
.accent-grad-text { background-image: var(--brand-grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
@supports not ((-webkit-background-clip: text) or (background-clip: text)) {
  .accent-grad-text { background: none; color: var(--accent-fill); }
}
@media (forced-colors: active) { .accent-grad-text { background: none; color: CanvasText; } }
```

- [ ] **Step 5: Rebuild tokens + css and verify the tests pass**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens build && pnpm --filter @gitzhacode/zha-ui-css build`
Expected: both succeed (`tokens.css written ✓`, `@gitzhacode/zha-ui-css built.`).

Run: `pnpm --filter @gitzhacode/zha-ui-css test`
Expected: PASS (the three new tests + all existing export tests).

- [ ] **Step 6: Commit**

```bash
git add packages/css/src/es-lockup.css packages/css/src/primitives/base.css packages/css/test/exports.test.ts
git commit -m "feat(css): generic lockup gradient + .accent-grad/.accent-grad-text utilities"
```

---

### Task 4: Docs - "one accent per team" → accent pair

Update the human + AI docs so the contract reads as a pair + gradient, add the utilities, and reframe ES's two hues as a confirmed pair. Pure text; no build.

**Files:**
- Modify: `AI-USAGE.md`, `AGENTS.md`, `README.md`, `DESIGN.md`, `docs/zha-brand-reference.md`

- [ ] **Step 1: AI-USAGE.md - accent var list, utilities, brand table**

Replace line 32:

```markdown
> *Accent:* `--accent --accent-fill --accent-on --accent-subtle`
```

with:

```markdown
> *Accent:* `--accent --accent-fill --accent-on --accent-subtle` - plus the **secondary** (expressive only - gradient/tints, never interactive): `--accent-2 --accent-2-subtle --accent-2-fill`, and the brand gradient `--brand-grad`
```

In the Spec 2 class list, replace:

```markdown
> `.segmented .card--interactive .card--accent`
```

with:

```markdown
> `.segmented .card--interactive .card--accent .accent-grad .accent-grad-text`
```

Replace the brand-table heading + note (lines 57 and 68):

```markdown
> **Brand tokens - `data-brand` values and their accent colours:**
```

with:

```markdown
> **Brand tokens - `data-brand` values and their accent pairs:**
```

and

```markdown
> *(Non-ES team accents are provisional placeholders - each team confirms its own colour later.)*
```

with:

```markdown
> *(ES is a confirmed **pair** - teal primary → magenta secondary, blended as `--brand-grad`. Non-ES teams show a provisional primary only; each confirms its full pair from the vetted pool later.)*
```

In the class cheat-sheet table, add after the `.zha-lockup--solid` row:

```markdown
| `.accent-grad` | Area fill painted with the team gradient (`--brand-grad`). Identity/hero only |
| `.accent-grad-text` | Gradient-clipped headline/number; solid `--accent-fill` fallback. Hero sizes only, never work-surface headings |
```

- [ ] **Step 2: AGENTS.md - data-brand row**

Replace line 40:

```markdown
| `data-brand` | `es` (teal, confirmed) · `code` · `analytics` · `bim` · `abps` · `meta` · `zh-cluster` | your team's accent |
```

with:

```markdown
| `data-brand` | `es` (teal→magenta, confirmed) · `code` · `analytics` · `bim` · `abps` · `meta` · `zh-cluster` | your team's accent pair (others provisional) |
```

- [ ] **Step 3: README.md - prism line + provisional note**

Replace lines 18-19:

```markdown
  "refracted light on architecture" - cool→warm, large-scale→intimate. Your team's
  accent is your slice of that prism (ES = teal).
```

with:

```markdown
  "refracted light on architecture" - cool→warm, large-scale→intimate. Your team's
  identity is a *pair* sliced from that prism - a primary + a secondary that blend
  into a gradient (ES = teal→magenta).
```

Replace lines 45-46:

```markdown
Set them once; everything inside inherits. Non-ES team accents are provisional
placeholders today - each team confirms its own colour later.
```

with:

```markdown
Set them once; everything inside inherits. Non-ES team accents are provisional
placeholders today - each team confirms its own *pair* later (picking a secondary
from the vetted pool).
```

- [ ] **Step 4: DESIGN.md - data-brand row + convention**

Replace line 20:

```markdown
| `data-brand` | which team | `es` (teal, confirmed) · `code` · `analytics` · `bim` · `abps` · `meta` · `zh-cluster` |
```

with:

```markdown
| `data-brand` | which team | `es` (teal→magenta, confirmed) · `code` · `analytics` · `bim` · `abps` · `meta` · `zh-cluster` |
```

Replace the last convention bullet (lines 171-172):

```markdown
- For a primary button use `.btn--primary` (AA-safe `--accent-fill`). Never put white
  text on bare `--accent`.
```

with:

```markdown
- For a primary button use `.btn--primary` (AA-safe `--accent-fill`). Never put white
  text on bare `--accent`.
- Each team has an accent **pair**: a primary (`--accent`/`--accent-fill`, the only
  interactive colour) and an expressive secondary (`--accent-2`, gradient/tints only -
  never interactive). The team gradient is `--brand-grad`; apply it via `.accent-grad`
  / `.accent-grad-text` on hero/identity surfaces only, never on work-surface headings.
```

- [ ] **Step 5: docs/zha-brand-reference.md - ES accents as a pair**

Replace line 52:

```markdown
Accents: **Teal `#048C9C`** (light/primary), **Magenta `#CB0092`** (used in dark contexts). All 12 hues match our vendored tokens except the Lime ambiguity above.
```

with:

```markdown
ES accent **pair**: **Teal `#048C9C`** (primary) → **Magenta `#CB0092`** (secondary), blended as the team gradient `--brand-grad` (earlier framed as light/dark variants - they are the two stops of the one pair). All 12 hues match our vendored tokens except the Lime ambiguity above.
```

- [ ] **Step 6: Verify no stale "single accent" language or firm-name slips remain**

Run: `git grep -nE "your team.s accent\b|accent is your slice|their accent colours" -- '*.md'`
Expected: no matches (all updated to "pair").

Run: `git grep -niE "zaha[ -]?hadid" -- '*.md' ':!*.json'`
Expected: only pre-existing author-email/URL lines if any in tracked md - confirm no new spelled-out firm name was introduced in the edited prose. (The firm is "ZHA".)

- [ ] **Step 7: Commit**

```bash
git add AI-USAGE.md AGENTS.md README.md DESIGN.md docs/zha-brand-reference.md
git commit -m "docs: accent pair + gradient (supersede single-accent-per-team)"
```

---

### Task 5: Render-verify ES across light / dark / brand (manual)

The gate validates source values, not the emitted oklch `@supports` cascade, so the gradient must be eyeballed. Only ES ships a pair, so there are three states to check: light, dark and brand.

**Files:**
- Create (throwaway, not committed): a verify page in the scratchpad.

- [ ] **Step 1: Build the shipped artifact**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens build && pnpm --filter @gitzhacode/zha-ui-css build`
Expected: `dist/index.css` exists and contains `--brand-grad: linear-gradient(105deg, var(--accent) 0%, var(--accent-2) 100%)`.

- [ ] **Step 2: Write the verify page at the repo root** (so a static server can serve it AND the CSS's relative `./assets/*` resolve)

`file://` is blocked in Playwright MCP (proven last session) - must serve over http. Create `_verify-pairs.html` at the repo root, linking the built CSS by **relative** path:

```html
<!doctype html><html data-brand="es" data-theme="light" data-surface="work"><head>
<link rel="stylesheet" href="packages/css/dist/index.css">
<style>body{padding:32px;background:var(--bg-page);color:var(--text-default);font-family:var(--font-primary)}h1{font-size:var(--fs-hero)}.bar{height:48px;border-radius:8px;margin:16px 0}</style>
</head><body>
  <span class="zha-lockup"><span class="zha-lockup__zha">ZHA</span><span class="zha-lockup__team">ES</span></span>
  <h1 class="accent-grad-text">Forever advancing</h1>
  <div class="bar accent-grad"></div>
</body></html>
```

- [ ] **Step 3: Serve the repo root and verify the three ES states**

Write a tiny node static server to the scratchpad serving the **repo root**, start it with `run_in_background`, then Playwright MCP `browser_navigate` to `http://localhost:<port>/_verify-pairs.html`. For each of `data-theme/data-surface` = **light/work**, **dark/work**, **light/brand**, set the attributes via `browser_evaluate` on `document.documentElement`, screenshot, and Read the PNG. Confirm:
- The lockup team name "ES" renders a **teal→magenta** sweep (NOT teal→green).
- `.accent-grad` bar and `.accent-grad-text` heading both render the **teal→magenta** gradient.
- On the brand surface (near-black), the sweep is still legible (endpoints teal 4.85 / magenta 3.66 ≥ 3.0).

Pass criteria: gradient is teal→magenta and consistent across all three states; no teal→green anywhere.

- [ ] **Step 4: Clean up**

Delete `_verify-pairs.html`, stop the static server, and remove any screenshots + `.playwright-mcp/`. No commit (verification only). If a defect is found, fix it in the owning task's files, rebuild, re-verify, and commit the fix with a `fix(...)` message.

---

## Self-Review

**Spec coverage** (Phase A items in §6 - §10):
- core `--accent-2` + var-based `--brand-grad` → Task 1 ✓
- ES `accent-2`, drop teal→green grad → Task 1 ✓
- dark/brand-surface: no accent-2 override → honored (untouched) ✓
- gate secondary-fill AA + no-partial-secondary → Task 2 ✓
- `.accent-grad*` utilities + restraint + `--accent-fill` fallback → Task 3 ✓
- es-lockup generic fallback → Task 3 ✓
- brand-axis test update → Task 1 ✓
- docs (5 files) → Task 4 ✓
- render-verify ES light/dark/brand → Task 5 ✓
- Phase B (other teams) → explicitly out of scope ✓

**Placeholder scan:** none - every code/edit step shows exact content and commands.

**Type/name consistency:** token names `--accent-2`, `--accent-2-fill`, `--accent-2-subtle`, `--brand-grad` used identically across Tasks 1-4; gradient string `linear-gradient(105deg, var(--accent) 0%, var(--accent-2) 100%)` identical in core token value, the test regex, and the lockup fallback; helper `partialSecondaryFailure` defined (Task 2 Step 3) and consumed (test + brand loop) with matching signature.

Next step: Phase B, the other six teams, is separate work outside this plan.
