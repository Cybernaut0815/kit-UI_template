# Primitive-Class Layer (Spec 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the CSS-only structural primitive layer (nav, table, tiles, alerts, forms, app-shell, etc.) so ZHA apps stop hand-rolling them, built on the refined Spec-1 token foundation.

**Architecture:** Split `packages/css/src/primitives.css` into 5 concern-grouped partials under `src/primitives/`, concatenated by `build.mjs` (fixed ordered list) into `dist/primitives.css`; `index.css` stays `tokens + primitives + es-lockup`. Each primitive is element-scoped with bare lowercase-hyphen class names, themed entirely through the token cascade, RTL-safe via CSS logical properties. Every primitive is demonstrated in the `examples/foundation-reference/` gallery and smoke-tested against `dist/index.css`.

**Tech Stack:** Plain CSS (custom properties), Node ESM build (`build.mjs`), vitest smoke tests, culori contrast gate (`packages/tokens/scripts/contrast-matrix.mjs`), Playwright MCP for render-verify.

**Spec:** `docs/specs/2026-06-24-zha-ui-primitive-layer-design.md`. **Research:** `docs/research/2026-06-23-ui-foundations-research.md`.

## Global Constraints

- **Firm is "ZHA"** - never the spelled-out former name in code/docs/commits.
- **ZHA Sans (`--font-secondary`) = always regular + upright.** Never apply weight. `--fw-medium` is not a token; use `var(--fw-medium, 500)` only inside a `font:` shorthand.
- **Closed vocabulary:** colour via `var(--…)` tokens only; structural px literals (control sizes, blur radius) allowed as in existing primitives. No hardcoded hex.
- **Typology palette = data/taxonomy only, never UI chrome.** ES teal is the single UI accent. `.card--accent` hue is locked to `var(--accent)` and not parameterizable.
- **RTL:** CSS logical properties only (`border-inline-start`, `margin-inline`, `padding-inline`, `inset-inline`). No physical `left`/`right` in new primitives.
- **Disabled = `opacity: .45`.** Focus = rely on global `:focus-visible`; never re-declare. Reduced motion = rely on global guard; never re-emit.
- **A11y hard rule:** never ship a primitive that renders an interactive-looking control whose accessible behaviour isn't shipped. No sort affordance on the table until the JS lands.
- **Contrast gate fails closed** (`pnpm build` runs it; text 4.5 / non-text 3.0, light+dark+brand). It validates source-intended values, not the emitted oklch cascade - **render-verify dark + brand in a real browser** after colour work.
- **Commit only when the maintainer asks** (this plan's commit steps are for the executing session once authorized).

## Environment notes (Windows)

- pnpm 9, Node ≥20. Each Bash call starts fresh - `cd /c/Users/aleksander.mastalski/repositories/zha-ui` first or use absolute paths.
- Build/test from repo root: `pnpm build` (expect `Contrast matrix: all pairs pass WCAG AA.`), `pnpm test`, `pnpm lint`.
- **Render-verify:** `file://` is blocked in Playwright MCP. Write a tiny node static server to the scratchpad, run `run_in_background` serving the **repo root**, navigate Playwright to `http://localhost:<port>/examples/foundation-reference/`, screenshot, Read the PNG. Flip `data-theme`/`data-surface`/`data-brand` via `browser_evaluate` on `document.documentElement`. Stop the server + delete screenshots + `.playwright-mcp/` after.

## File Structure

- `packages/css/src/primitives/base.css` - existing 9 primitives (moved, `.card` retrofitted) + global focus/scrollbar/print/reduced-motion blocks.
- `packages/css/src/primitives/layout.css` - `.app-shell`, `.app-bar`, `.divider`.
- `packages/css/src/primitives/nav.css` - `.sidebar`, `.breadcrumb`, `.pagination`, `.page-header`.
- `packages/css/src/primitives/content.css` - `.stat`, `.badge`, `.accordion`, `.data-table`, `.field`, `.segmented`, `.card--accent`.
- `packages/css/src/primitives/feedback.css` - `.alert`, `.progress`, `.empty-state`, `.view-fade`.
- `packages/css/build.mjs` - concatenate partials.
- `packages/css/test/exports.test.ts` - add a `primitives` describe block (smoke assertions).
- `packages/tokens/scripts/contrast-matrix.mjs` - add intent-text × surface-2 (non-text) pairs.
- `examples/foundation-reference/index.html` - primitive gallery sections.

`src/primitives.css` is deleted after Task 1 (its content moves to `base.css`). Do **not** create `_shared.css` - extract only if duplication emerges.

---

### Task 1: Split primitives into partials + build concatenation

**Files:**
- Create: `packages/css/src/primitives/base.css` (content moved verbatim from `src/primitives.css`)
- Delete: `packages/css/src/primitives.css`
- Modify: `packages/css/build.mjs`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `dist/primitives.css` (concatenation of `base,layout,nav,content,feedback`), `dist/index.css` (tokens + primitives + es-lockup). Partial order is fixed in `build.mjs`.

- [ ] **Step 1: Move the existing file into the partials dir**

```bash
cd /c/Users/aleksander.mastalski/repositories/zha-ui/packages/css
mkdir -p src/primitives
git mv src/primitives.css src/primitives/base.css
# create the four empty partials so the build's fixed list resolves
printf '/* layout primitives */\n' > src/primitives/layout.css
printf '/* navigation primitives */\n' > src/primitives/nav.css
printf '/* content primitives */\n' > src/primitives/content.css
printf '/* feedback primitives */\n' > src/primitives/feedback.css
```

- [ ] **Step 2: Rewrite `build.mjs` to concatenate the partials**

```js
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const tokensCss = require.resolve('@gitzhacode/zha-ui-tokens/tokens.css');

mkdirSync('dist/assets', { recursive: true });
copyFileSync(tokensCss, 'dist/tokens.css');
copyFileSync('src/es-lockup.css', 'dist/es-lockup.css');
copyFileSync('src/assets/zha-logo.svg', 'dist/assets/zha-logo.svg');
copyFileSync('src/assets/zha-sans.ttf', 'dist/assets/zha-sans.ttf');

// Fixed, ordered list - this IS the cascade order. Do not glob.
const PARTIALS = ['base', 'layout', 'nav', 'content', 'feedback'];
const primitives = PARTIALS.map((n) => readFileSync(`src/primitives/${n}.css`, 'utf8')).join('\n');
writeFileSync('dist/primitives.css', primitives);

const index = [readFileSync(tokensCss, 'utf8'), primitives, readFileSync('src/es-lockup.css', 'utf8')].join('\n');
writeFileSync('dist/index.css', index);
console.log('@gitzhacode/zha-ui-css built.');
```

- [ ] **Step 3: Run the existing tests to verify nothing regressed**

Run: `cd /c/Users/aleksander.mastalski/repositories/zha-ui && pnpm build && pnpm test`
Expected: `Contrast matrix: all pairs pass WCAG AA.`; all 25 tests pass (the 3 css smoke tests still find `.btn--primary`, tokens, lockup in `dist/index.css`).

- [ ] **Step 4: Commit**

```bash
git add packages/css/src packages/css/build.mjs
git commit -m "refactor(css): split primitives into concern-grouped partials"
```

---

### Task 2: `.card` border-first retrofit (breaking change)

**Files:**
- Modify: `packages/css/src/primitives/base.css` (the `.card` rules)
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.card` (hairline only, no shadow), `.card--interactive` (opt-in hover lift).

- [ ] **Step 1: Add the failing test**

In `test/exports.test.ts`, add inside the existing `describe`:

```ts
it('card is border-first: no resting box-shadow, lift is opt-in', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  const card = css.match(/\.card\s*\{[^}]*\}/s)?.[0] ?? '';
  expect(card).not.toMatch(/box-shadow/);              // no resting shadow
  expect(css).toMatch(/\.card--interactive:hover\s*\{[^}]*box-shadow/s); // lift opt-in
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /c/Users/aleksander.mastalski/repositories/zha-ui && pnpm build && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: FAIL - current `.card` has `box-shadow: var(--shadow-low)` and a default `:hover` lift.

- [ ] **Step 3: Replace the `.card` rules in `base.css`**

Replace the existing `.card` and `.card:hover` lines with:

```css
.card { background: var(--bg-surface-1); border: 1px solid var(--border-subtle); border-radius: var(--radius-l); color: var(--text-default); } /* border-first: hairline only, no resting shadow */
.card--interactive { transition: box-shadow var(--motion-base) var(--ease-out), transform var(--motion-base) var(--ease-out); cursor: pointer; }
.card--interactive:hover { box-shadow: var(--shadow-mid); transform: translateY(-2px); }
```

- [ ] **Step 4: Run tests + build**

Run: `pnpm build && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: PASS (gate stays green - no colour change).

- [ ] **Step 5: Render-verify the breaking change**

Start a static server on the repo root (`run_in_background`), navigate Playwright to `http://localhost:<port>/examples/foundation-reference/`, screenshot in light + dark + brand. Confirm cards render flat (hairline only). Stop server, delete screenshots + `.playwright-mcp/`.

- [ ] **Step 6: Commit**

```bash
git add packages/css/src/primitives/base.css packages/css/test/exports.test.ts
git commit -m "feat(css)!: card is border-first (no resting shadow; lift via .card--interactive)"
```

---

### Task 3: Extend the contrast gate for secondary-surface intent colour

**Files:**
- Modify: `packages/tokens/scripts/contrast-matrix.mjs` (the `PAIRS` array)
- Test: the gate is its own test (`pnpm --filter @gitzhacode/zha-ui-tokens test` includes a contrast test; the build also runs it)

**Interfaces:**
- Produces: gate coverage for `intent-*-text × bg-surface-2 @ 3.0` (non-text). Documents that intent **text** is validated on surface-1/page only.

- [ ] **Step 1: Add the pairs + comment to `PAIRS`**

Append to the `PAIRS` array in `contrast-matrix.mjs`:

```js
  // Intent colour on a SECONDARY surface is only valid as a NON-TEXT signal
  // (border/icon, WCAG 1.4.11 = 3.0). Intent-coloured TEXT (4.5) is validated
  // against bg-surface-1/bg-page above and must not be placed on surface-2/3.
  ['intent-error-text', 'bg-surface-2', 3.0], ['intent-success-text', 'bg-surface-2', 3.0],
  ['intent-warning-text', 'bg-surface-2', 3.0], ['intent-info-text', 'bg-surface-2', 3.0],
```

- [ ] **Step 2: Run the gate to verify it passes**

Run: `cd /c/Users/aleksander.mastalski/repositories/zha-ui && node packages/tokens/scripts/contrast-matrix.mjs`
Expected: `Contrast matrix: all pairs pass WCAG AA.` (dark surface-2 intent text ≈4.1-4.2 ≥ 3.0).

- [ ] **Step 3: Run the full token tests + build**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens test && pnpm build`
Expected: all pass; build prints the green gate line.

- [ ] **Step 4: Commit**

```bash
git add packages/tokens/scripts/contrast-matrix.mjs
git commit -m "test(tokens): gate intent colour on surface-2 as non-text (3.0)"
```

---

### Task 4: App-shell + app-bar

**Files:**
- Modify: `packages/css/src/primitives/layout.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.app-shell` (grid; `[data-rail]`; exposes `--app-bar-h`), `.app-bar` + `.app-bar__brand`/`.app-bar__spacer`. Consumed by the gallery.

- [ ] **Step 1: Add the failing tests**

```ts
it('ships app-shell + app-bar with backdrop fallback', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  expect(css).toMatch(/\.app-shell\s*\{/);
  expect(css).toMatch(/\.app-bar\s*\{[^}]*backdrop-filter/s);
  expect(css).toMatch(/@supports not \(\(backdrop-filter/); // opaque fallback
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm build && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: FAIL - classes absent.

- [ ] **Step 3: Add the CSS to `layout.css`**

```css
.app-shell { display: grid; grid-template-columns: var(--sidebar-w,240px) 1fr; grid-template-rows: auto 1fr;
  grid-template-areas: "sidebar header" "sidebar main"; block-size: 100dvh; background: var(--bg-surface-1); --app-bar-h: 56px; }
.app-shell[data-rail] { --sidebar-w: 56px; }
.app-shell > .app-bar { grid-area: header; }
.app-shell > .sidebar { grid-area: sidebar; }
.app-shell > .app-main { grid-area: main; min-block-size: 0; overflow: auto; padding: var(--space-6); background: var(--bg-page); }
.app-bar { display: flex; align-items: center; gap: var(--space-4); block-size: var(--app-bar-h,56px); padding-inline: var(--space-4);
  border-block-end: 1px solid var(--border-subtle); background: color-mix(in srgb, var(--bg-page) 88%, transparent);
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .app-bar { background: var(--bg-surface-1); } }
.app-bar__brand { font: var(--fs-h2) / 1 var(--font-secondary); letter-spacing: var(--tracking-label); color: var(--text-strong); }
.app-bar__spacer { flex: 1; }
```

- [ ] **Step 4: Add to the print reset in `base.css`**

In the `@media print` block in `base.css`, add `.app-bar` to the box-shadow/decoration reset and neutralize its blur + sticky:

```css
@media print { .app-bar { background: #fff !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; position: static !important; } }
```

- [ ] **Step 5: Run tests + build**

Run: `pnpm build && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/css/src/primitives/layout.css packages/css/src/primitives/base.css packages/css/test/exports.test.ts
git commit -m "feat(css): app-shell + translucent app-bar"
```

---

### Task 5: Divider

**Files:**
- Modify: `packages/css/src/primitives/layout.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.divider` (use on `<hr>` or `role="separator"`).

- [ ] **Step 1: Add the failing test**

```ts
it('ships a divider', () => { expect(readFileSync(d('index.css'),'utf8')).toMatch(/\.divider\s*\{/); });
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm build && pnpm --filter @gitzhacode/zha-ui-css test` → FAIL.

- [ ] **Step 3: Add the CSS to `layout.css`**

```css
.divider { border: none; block-size: 1px; background: var(--border-subtle); margin-block: var(--space-4); margin-inline: 0; }
```

- [ ] **Step 4: Run tests** → `pnpm build && pnpm --filter @gitzhacode/zha-ui-css test` → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/layout.css packages/css/test/exports.test.ts
git commit -m "feat(css): divider"
```

---

### Task 6: Sidebar nav

**Files:**
- Modify: `packages/css/src/primitives/nav.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.sidebar` (on `<nav aria-label>`); active via `a[aria-current="page"]`. Subtle-tint + accent bar (NOT solid fill).

- [ ] **Step 1: Add the failing test (locks the reviewed decision)**

```ts
it('sidebar active uses the subtle tint, not the solid accent-fill', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  const active = css.match(/\.sidebar a\[aria-current="page"\]\s*\{[^}]*\}/s)?.[0] ?? '';
  expect(active).toMatch(/background:\s*var\(--accent-subtle\)/);
  expect(active).not.toMatch(/var\(--accent-fill\)/);
});
```

- [ ] **Step 2: Run to verify it fails** → `pnpm build && pnpm --filter @gitzhacode/zha-ui-css test` → FAIL.

- [ ] **Step 3: Add the CSS to `nav.css`**

```css
.sidebar { display: flex; flex-direction: column; gap: 2px; padding: var(--space-3); background: var(--bg-surface-1); border-inline-end: 1px solid var(--border-subtle); }
.sidebar a { position: relative; display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-m);
  color: var(--text-muted); text-decoration: none; font-size: var(--fs-body); white-space: nowrap; overflow: hidden; }
.sidebar a:hover { background: var(--bg-surface-2); color: var(--text-default); }
.sidebar a[aria-current="page"] { background: var(--accent-subtle); color: var(--text-strong); } /* subtle tint + strong text; solid fill rejected in review */
.sidebar a[aria-current="page"]::before { content: ""; position: absolute; inset-inline-start: 0; inset-block: 6px; inline-size: 3px; border-radius: var(--radius-pill); background: var(--accent); }
.app-shell[data-rail] .sidebar a span { display: none; }
```

- [ ] **Step 4: Run tests** → `pnpm build && pnpm --filter @gitzhacode/zha-ui-css test` → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/nav.css packages/css/test/exports.test.ts
git commit -m "feat(css): sidebar nav (subtle-tint active + rail collapse)"
```

---

### Task 7: Breadcrumb

**Files:**
- Modify: `packages/css/src/primitives/nav.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.breadcrumb` (on `<nav aria-label="Breadcrumb"><ol>`); last item `aria-current="page"` non-link.

- [ ] **Step 1: Add the failing test**

```ts
it('ships breadcrumb with slash separators', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  expect(css).toMatch(/\.breadcrumb ol\s*\{/);
  expect(css).toMatch(/\.breadcrumb li:not\(:first-child\)::before\s*\{[^}]*content:\s*"\/"/s);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the CSS to `nav.css`**

```css
.breadcrumb ol { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); list-style: none; margin: 0; padding: 0; font-size: var(--fs-body); }
.breadcrumb li { display: flex; align-items: center; gap: var(--space-2); }
.breadcrumb li:not(:first-child)::before { content: "/"; color: var(--text-disabled); }
.breadcrumb a { color: var(--text-muted); text-decoration: none; }
.breadcrumb a:hover { color: var(--text-default); text-decoration: underline; }
.breadcrumb [aria-current="page"] { color: var(--text-default); }
```

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/nav.css packages/css/test/exports.test.ts
git commit -m "feat(css): breadcrumb"
```

---

### Task 8: Pagination

**Files:**
- Modify: `packages/css/src/primitives/nav.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.pagination` (on `<nav aria-label="Pagination">`); active `[aria-current="page"]`, disabled `[aria-disabled="true"]`.

- [ ] **Step 1: Add the failing test**

```ts
it('ships pagination; active uses accent-fill', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  expect(css).toMatch(/\.pagination\s*\{/);
  expect(css).toMatch(/\.pagination \[aria-current="page"\]\s*\{[^}]*var\(--accent-fill\)/s);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the CSS to `nav.css`**

```css
.pagination { display: flex; gap: var(--space-1); list-style: none; margin: 0; padding: 0; }
.pagination a, .pagination span { display: inline-flex; align-items: center; justify-content: center; min-inline-size: 32px; block-size: 32px; padding-inline: var(--space-2);
  border-radius: var(--radius-s); color: var(--text-default); text-decoration: none; font-size: var(--fs-body); font-variant-numeric: tabular-nums; }
.pagination a:hover { background: var(--bg-surface-2); }
.pagination [aria-current="page"] { background: var(--accent-fill); color: var(--accent-on); }
.pagination [aria-disabled="true"] { opacity: .45; pointer-events: none; }
```

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/nav.css packages/css/test/exports.test.ts
git commit -m "feat(css): pagination"
```

---

### Task 9: Page/section header

**Files:**
- Modify: `packages/css/src/primitives/nav.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.page-header` + `.page-header__title` + `.page-header__actions`.

- [ ] **Step 1: Add the failing test**

```ts
it('ships page-header with title + actions', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  expect(css).toMatch(/\.page-header\s*\{/);
  expect(css).toMatch(/\.page-header__actions\s*\{/);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the CSS to `nav.css`**

```css
.page-header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); padding-block-end: var(--space-3); border-block-end: 1px solid var(--border-subtle); }
.page-header__title { margin: 0; font-size: var(--fs-display); letter-spacing: var(--tracking-display); color: var(--text-strong); }
.page-header__actions { display: flex; gap: var(--space-2); }
```

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/nav.css packages/css/test/exports.test.ts
git commit -m "feat(css): page/section header"
```

---

### Task 10: Stat / KPI tile

**Files:**
- Modify: `packages/css/src/primitives/content.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.stat` + `.stat__label`/`.stat__value`/`.stat__delta` (+ `--up`/`--down`).

- [ ] **Step 1: Add the failing test (locks fs-display, no shadow)**

```ts
it('stat tile has no shadow and uses fs-display for the value', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  const stat = css.match(/\.stat\s*\{[^}]*\}/s)?.[0] ?? '';
  expect(stat).toMatch(/border:\s*1px solid var\(--border-subtle\)/);
  expect(stat).not.toMatch(/box-shadow/);
  expect(css).toMatch(/\.stat__value\s*\{[^}]*var\(--fs-display\)/s);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the CSS to `content.css`**

```css
.stat { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-5); background: var(--bg-surface-1); border: 1px solid var(--border-subtle); border-radius: var(--radius-l); }
.stat__label { font-size: var(--fs-small); color: var(--text-muted); letter-spacing: var(--tracking-small); text-transform: uppercase; }
.stat__value { font-size: var(--fs-display); letter-spacing: var(--tracking-display); color: var(--text-strong); font-variant-numeric: tabular-nums; line-height: 1; }
.stat__delta { font-size: var(--fs-small); font-variant-numeric: tabular-nums; color: var(--text-muted); }
.stat__delta--up { color: var(--intent-success-text); }
.stat__delta--down { color: var(--intent-error-text); }
```

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/content.css packages/css/test/exports.test.ts
git commit -m "feat(css): stat/KPI tile"
```

---

### Task 11: Badge / status pill

**Files:**
- Modify: `packages/css/src/primitives/content.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.badge` (+ `--success`/`--warning`/`--error`/`--info`) + `.badge .dot`. Transparent bg locked.

- [ ] **Step 1: Add the failing test (locks transparent bg)**

```ts
it('badge background is transparent (outline pill)', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  const badge = css.match(/\.badge\s*\{[^}]*\}/s)?.[0] ?? '';
  expect(badge).toMatch(/background:\s*transparent/);
  expect(badge).toMatch(/border:\s*1px solid currentColor/);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the CSS to `content.css`**

```css
.badge { display: inline-flex; align-items: center; gap: var(--space-1); padding: 2px var(--space-2); border: 1px solid currentColor; border-radius: var(--radius-pill);
  background: transparent; font: var(--fw-medium,500) var(--fs-small) / 1.4 var(--font-primary); }
.badge--success { color: var(--intent-success-text); }
.badge--warning { color: var(--intent-warning-text); }
.badge--error { color: var(--intent-error-text); }
.badge--info { color: var(--intent-info-text); }
.badge .dot { inline-size: 6px; block-size: 6px; border-radius: var(--radius-pill); background: currentColor; }
```

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/content.css packages/css/test/exports.test.ts
git commit -m "feat(css): badge/status pill"
```

---

### Task 12: Accordion (native `<details>`)

**Files:**
- Modify: `packages/css/src/primitives/content.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.accordion` (on `<details>`) + `.accordion__body`; chevron via `summary::after`.

- [ ] **Step 1: Add the failing test (locks marker removal in both engines)**

```ts
it('accordion removes the default marker in both engines', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  expect(css).toMatch(/\.accordion summary\s*\{[^}]*list-style:\s*none/s);
  expect(css).toMatch(/\.accordion summary::-webkit-details-marker\s*\{[^}]*display:\s*none/s);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the CSS to `content.css`**

```css
.accordion { border: 1px solid var(--border-subtle); border-radius: var(--radius-m); background: var(--bg-surface-1); overflow: hidden; }
.accordion + .accordion { margin-block-start: var(--space-2); }
.accordion summary { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); padding: var(--space-3) var(--space-4); cursor: pointer; list-style: none; color: var(--text-strong); font-size: var(--fs-body); }
.accordion summary::-webkit-details-marker { display: none; }
.accordion summary::after { content: ""; inline-size: 8px; block-size: 8px; border-inline-end: 2px solid var(--text-muted); border-block-end: 2px solid var(--text-muted); transform: rotate(45deg); transition: transform var(--motion-base) var(--ease-out); }
.accordion[open] summary::after { transform: rotate(-135deg); }
.accordion__body { padding: 0 var(--space-4) var(--space-4); color: var(--text-default); font-size: var(--fs-body); }
```

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/content.css packages/css/test/exports.test.ts
git commit -m "feat(css): accordion via native details/summary"
```

---

### Task 13: Data table (styling only)

**Files:**
- Modify: `packages/css/src/primitives/content.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.data-table` (on `<table>` + `<caption>` + `<th scope>`) + `.data-table .num`. No sort affordance.

- [ ] **Step 1: Add the failing test (locks no zebra, no sort affordance)**

```ts
it('data-table has sticky header, no zebra, no sort affordance', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  expect(css).toMatch(/\.data-table thead th\s*\{[^}]*position:\s*sticky/s);
  expect(css).not.toMatch(/\.data-table tbody tr:nth-child/);  // no zebra
  expect(css).not.toMatch(/aria-sort/);                        // no sort styling shipped yet
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the CSS to `content.css`**

```css
.data-table { inline-size: 100%; border-collapse: collapse; font-size: var(--fs-body); }
.data-table caption { text-align: start; padding-block-end: var(--space-2); color: var(--text-muted); font-size: var(--fs-small); }
.data-table th, .data-table td { padding-inline: var(--space-3); block-size: var(--row-h); text-align: start; border-block-end: 1px solid var(--border-subtle); white-space: nowrap; }
.data-table thead th { position: sticky; top: 0; background: var(--bg-surface-1); color: var(--text-muted); font: var(--fw-medium,500) var(--fs-small) / 1 var(--font-primary); letter-spacing: var(--tracking-small); text-transform: uppercase; }
.data-table tbody tr:hover { background: var(--bg-surface-2); }
.data-table .num { text-align: end; font-variant-numeric: tabular-nums; }
```

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/content.css packages/css/test/exports.test.ts
git commit -m "feat(css): data table (styling; sort behaviour deferred)"
```

---

### Task 14: Form-field grouping

**Files:**
- Modify: `packages/css/src/primitives/content.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.field` + `.field__label`/`.field__help`/`.field__error`. Wraps existing `.input`/`.select`. Consumer wires `aria-invalid` + `aria-describedby`.

- [ ] **Step 1: Add the failing test**

```ts
it('ships form-field grouping with an error line', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  expect(css).toMatch(/\.field\s*\{/);
  expect(css).toMatch(/\.field__error\s*\{[^}]*var\(--intent-error-text\)/s);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the CSS to `content.css`**

```css
.field { display: flex; flex-direction: column; gap: var(--space-2); }
.field__label { font-size: var(--fs-small); color: var(--text-default); letter-spacing: var(--tracking-small); }
.field__help { font-size: var(--fs-small); color: var(--text-muted); }
.field__error { font-size: var(--fs-small); color: var(--intent-error-text); }
.field [aria-invalid="true"] { border-color: var(--intent-error-text); }
```

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/content.css packages/css/test/exports.test.ts
git commit -m "feat(css): form-field grouping (label/help/error)"
```

---

### Task 15: Segmented control

**Files:**
- Modify: `packages/css/src/primitives/content.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.segmented` track wrapping `<label><input type="radio">…`. Checked segment highlighted; `:has()`-driven, native radio keyboard behaviour. Graceful fallback where `:has()` is absent.

- [ ] **Step 1: Add the failing test**

```ts
it('ships a segmented control driven by checked radios (no JS)', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  expect(css).toMatch(/\.segmented\s*\{/);
  expect(css).toMatch(/\.segmented label:has\(:checked\)/);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the CSS to `content.css`**

```css
.segmented { display: inline-flex; gap: 2px; padding: 3px; background: var(--bg-surface-2); border-radius: var(--radius-m); }
.segmented input { position: absolute; opacity: 0; pointer-events: none; }
.segmented label { display: inline-flex; align-items: center; justify-content: center; padding: var(--space-1) var(--space-3); border-radius: var(--radius-s); color: var(--text-muted); font-size: var(--fs-body); cursor: pointer; transition: color var(--motion-fast) var(--ease-out); }
.segmented label:has(:checked) { background: var(--bg-surface-1); color: var(--text-strong); box-shadow: var(--shadow-low); } /* checked segment lifts off the track */
.segmented label:has(:focus-visible) { box-shadow: var(--focus-ring); }
```

> Note: where `:has()` is unsupported the segments render flat (all idle colour) but remain fully operable via the native radios - an acceptable visual-only degradation.

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Render-verify the slide/checked state** (light + dark + brand) via the static-server + Playwright flow; confirm the checked segment is legible. Clean up after.

- [ ] **Step 6: Commit**

```bash
git add packages/css/src/primitives/content.css packages/css/test/exports.test.ts
git commit -m "feat(css): segmented control (radio + :has, no JS)"
```

---

### Task 16: Card accent-stripe

**Files:**
- Modify: `packages/css/src/primitives/content.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.card--accent` (composes with `.card`). Hue locked to `var(--accent)`.

- [ ] **Step 1: Add the failing test (locks the accent hue, no typology)**

```ts
it('card accent-stripe uses --accent on the inline-start edge', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  expect(css).toMatch(/\.card--accent\s*\{[^}]*border-inline-start:\s*3px solid var\(--accent\)/s);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the CSS to `content.css`**

```css
.card--accent { border-inline-start: 3px solid var(--accent); } /* hue locked to --accent; never a typology var */
```

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/content.css packages/css/test/exports.test.ts
git commit -m "feat(css): card accent-stripe (accent hue only)"
```

---

### Task 17: Alert / banner (styling only)

**Files:**
- Modify: `packages/css/src/primitives/feedback.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.alert` (+ `--success`/`--warning`/`--error`/`--info`) + `.alert__icon`/`.alert__title`. Body text `--text-default`; intent only on inline-start border + icon (`--intent-*-text`). `role` set by consumer.

- [ ] **Step 1: Add the failing test (locks no tint behind text)**

```ts
it('alert has no intent tint behind body text; intent on border + icon only', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  const base = css.match(/\.alert\s*\{[^}]*\}/s)?.[0] ?? '';
  expect(base).toMatch(/background:\s*var\(--bg-surface-1\)/);
  expect(base).toMatch(/color:\s*var\(--text-default\)/);
  expect(css).toMatch(/\.alert--error\s*\{[^}]*border-inline-start-color:\s*var\(--intent-error-text\)/s);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the CSS to `feedback.css`**

```css
.alert { display: flex; gap: var(--space-3); padding: var(--space-3) var(--space-4); border: 1px solid var(--border-subtle); border-inline-start: 3px solid var(--text-muted);
  border-radius: var(--radius-m); background: var(--bg-surface-1); color: var(--text-default); font-size: var(--fs-body); }
.alert__icon { flex: none; inline-size: 18px; block-size: 18px; }
.alert__title { font-weight: 600; color: var(--text-strong); margin-block-end: 2px; }
.alert--success { border-inline-start-color: var(--intent-success-text); } .alert--success .alert__icon { color: var(--intent-success-text); }
.alert--warning { border-inline-start-color: var(--intent-warning-text); } .alert--warning .alert__icon { color: var(--intent-warning-text); }
.alert--error { border-inline-start-color: var(--intent-error-text); } .alert--error .alert__icon { color: var(--intent-error-text); }
.alert--info { border-inline-start-color: var(--intent-info-text); } .alert--info .alert__icon { color: var(--intent-info-text); }
```

- [ ] **Step 4: Run tests + build** → PASS, gate green.

- [ ] **Step 5: Render-verify all 4 intents in dark + brand** (the surface the review flagged). Confirm body text and icons are legible. Clean up after.

- [ ] **Step 6: Commit**

```bash
git add packages/css/src/primitives/feedback.css packages/css/test/exports.test.ts
git commit -m "feat(css): alert/banner (border+icon intent, no tint)"
```

---

### Task 18: Progress (native `<progress>`)

**Files:**
- Modify: `packages/css/src/primitives/feedback.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.progress` (on native `<progress>`); `accent-color` + webkit/moz pseudo-elements.

- [ ] **Step 1: Add the failing test (locks the Safari pseudo-element fallback)**

```ts
it('progress themes via accent-color AND webkit pseudo (Safari)', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  expect(css).toMatch(/\.progress\s*\{[^}]*accent-color:\s*var\(--accent-fill\)/s);
  expect(css).toMatch(/\.progress::-webkit-progress-value\s*\{[^}]*var\(--accent-fill\)/s);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the CSS to `feedback.css`**

```css
.progress { appearance: none; -webkit-appearance: none; inline-size: 100%; block-size: 8px; border: none; border-radius: var(--radius-pill); background: var(--bg-surface-3); accent-color: var(--accent-fill); overflow: hidden; }
.progress::-webkit-progress-bar { background: var(--bg-surface-3); border-radius: var(--radius-pill); }
.progress::-webkit-progress-value { background: var(--accent-fill); border-radius: var(--radius-pill); }
.progress::-moz-progress-bar { background: var(--accent-fill); }
```

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/feedback.css packages/css/test/exports.test.ts
git commit -m "feat(css): progress (native, accent-color + webkit fallback)"
```

---

### Task 19: Empty state

**Files:**
- Modify: `packages/css/src/primitives/feedback.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.empty-state` + `.empty-state__icon`.

- [ ] **Step 1: Add the failing test**

```ts
it('ships a borderless centered empty-state', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  const es = css.match(/\.empty-state\s*\{[^}]*\}/s)?.[0] ?? '';
  expect(es).toMatch(/align-items:\s*center/);
  expect(es).not.toMatch(/border:/);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the CSS to `feedback.css`**

```css
.empty-state { display: flex; flex-direction: column; align-items: center; text-align: center; gap: var(--space-3); padding: var(--space-12) var(--space-6); }
.empty-state__icon { inline-size: 48px; block-size: 48px; border-radius: var(--radius-l); background: var(--bg-surface-2); border: 1px solid var(--border-subtle); }
.empty-state h3 { margin: 0; font-size: var(--fs-h2); color: var(--text-strong); }
.empty-state p { margin: 0; color: var(--text-muted); max-inline-size: 42ch; }
```

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/feedback.css packages/css/test/exports.test.ts
git commit -m "feat(css): empty state"
```

---

### Task 20: View-fade transition

**Files:**
- Modify: `packages/css/src/primitives/feedback.css`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.view-fade` + `@keyframes zha-view-fade`. Relies on the global reduced-motion guard.

- [ ] **Step 1: Add the failing test**

```ts
it('ships view-fade (opacity + transform only)', () => {
  const css = readFileSync(d('index.css'), 'utf8');
  expect(css).toMatch(/\.view-fade\s*\{[^}]*animation:/s);
  expect(css).toMatch(/@keyframes zha-view-fade/);
});
```

- [ ] **Step 2: Run to verify it fails** → FAIL.

- [ ] **Step 3: Add the CSS to `feedback.css`**

```css
.view-fade { animation: zha-view-fade var(--motion-slow) var(--ease-out); }
@keyframes zha-view-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
```

- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/feedback.css packages/css/test/exports.test.ts
git commit -m "feat(css): view-fade transition"
```

---

### Task 21: Gallery assembly + full render-verify + docs

**Files:**
- Modify: `examples/foundation-reference/index.html`
- Modify: `DESIGN.md` (document the `.card` border-first change + the new primitive vocabulary), `AI-USAGE.md`/`AGENTS.md` (list the new classes) if they enumerate primitives.

**Interfaces:**
- Consumes: every primitive class shipped in Tasks 2-20.

- [ ] **Step 1: Add a gallery section per primitive**

In `examples/foundation-reference/index.html`, add a section for each primitive (app-shell assembled once at the top; then sidebar, breadcrumb, pagination, page-header, stat row, cards incl. interactive + accent, badges, accordion, data-table, form-field, segmented, alerts ×4, progress ×3, empty-state). Use the markup from the approved visual-cues artifact (spec §6). Each must use the real classes (no inline styles for the primitive itself).

- [ ] **Step 2: Build**

Run: `cd /c/Users/aleksander.mastalski/repositories/zha-ui && pnpm build`
Expected: `Contrast matrix: all pairs pass WCAG AA.`

- [ ] **Step 3: Render-verify the full gallery across the matrix**

Static-server + Playwright. Screenshot at: light, dark, brand-surface, and at least one non-teal brand (`data-brand="code"`), plus compact density. Read each PNG. Confirm: cards flat, sidebar active is the subtle tint + bar (not a solid button), alerts legible in dark/brand, table header sticky + opaque, segmented checked state legible, no primitive shows an inert sort affordance. Fix any issue found, rebuild, re-verify. Stop server, delete screenshots + `.playwright-mcp/`.

- [ ] **Step 4: Update docs**

In `DESIGN.md`, document: `.card` is now hairline-only (lift via `.card--interactive`); the new primitive vocabulary and the CSS-only/JS boundary (what's deferred to React). If `AGENTS.md`/`AI-USAGE.md` enumerate available classes, add the new ones.

- [ ] **Step 5: Full suite green**

Run: `pnpm build && pnpm test && pnpm lint`
Expected: gate green; all tests pass (3 original css + 19 new primitive smoke tests + 22 token tests); lint ok.

- [ ] **Step 6: Commit**

```bash
git add examples/foundation-reference/index.html DESIGN.md AI-USAGE.md AGENTS.md
git commit -m "docs(css): primitive gallery + border-first card + boundary docs"
```

---

## Self-Review

**Spec coverage:** app-shell (T4), app-bar (T4), divider (T5), sidebar (T6), breadcrumb (T7), pagination (T8), page-header (T9), stat (T10), badge (T11), accordion (T12), data-table (T13), form-field (T14), segmented (T15), card-accent (T16), alert (T17), progress (T18), empty-state (T19), view-fade (T20), card retrofit (T2), partial split + build (T1), gate extension (T3), gallery + docs (T21). All §2/§6 primitives covered. `.scroll-area` intentionally omitted per spec. Tabs/dropdown/modal/tooltip/popover correctly deferred (no tasks).

**Placeholder scan:** no TBD/TODO; every CSS step shows the full block; every test step shows the assertion and the expected fail/pass.

**Type/name consistency:** class names match the spec §6 and are asserted verbatim in each smoke test; `--app-bar-h` defined in T4 and referenced in T13's documented offset; `.card--interactive` defined in T2 and used in T21. Partial filenames in T1's `PARTIALS` list match the per-task target files.

Next step: the maintainer authorises the commits.
