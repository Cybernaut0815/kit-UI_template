# zha-ui Composition Layer (Spec 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the composition layer (element typography, layout primitives, interaction states, phone-width behaviour), the taste layer in the guidance, and the drift-guard gate, then rebuild the three starters on it, as `@gitzhacode/zha-ui-tokens` and `@gitzhacode/zha-ui-css` 0.1.3.

**Architecture:** Twelve tokens land in the existing Style Dictionary sources and emit through the existing builds. One new CSS partial (`type.css`) carries zero-specificity element defaults; the composition primitives extend `layout.css`; states, focus and feedback edits land in the partials that own them. The drift guard gains an inline-style rule and covers two more pages. Each guidance file has one job: AGENTS.md explains how to compose, AI-USAGE.md lists what exists, DESIGN.md gives the reasons. The rendered preview in `preview/composition/` is the source of truth for every CSS value and for the three rebuilt pages; it is deleted in the last task.

**Tech Stack:** pnpm 9 workspace, turbo, Style Dictionary 4 (`packages/tokens`), plain CSS partials concatenated by `packages/css/build.mjs`, vitest (regex tests over `dist/`), node:test for the drift guard, Vite 5 + React 18 for the React starter, Playwright for the render-verify.

**Spec:** [`docs/specs/2026-09-30-zha-ui-composition-layer-design.md`](../specs/2026-09-30-zha-ui-composition-layer-design.md). Research: [`docs/research/2026-09-30-ui-ux-quality-research.md`](../research/2026-09-30-ui-ux-quality-research.md). Preview (rendering source of truth): `preview/composition/`.

## Global Constraints

This section copies the constraints from AGENTS.md, AGENTS_FABLE.md and the spec. Every task's requirements include this section.

- **The one hard rule (AGENTS.md):** "Use only the published zha-ui CSS variables and primitive classes. Never invent a CSS custom property (e.g. `--color-primary`). Never hard-code a hex value." The CSS package itself may define new variables only where this plan lists them.
- **The firm is "ZHA"** - always. Never spell out its former name.
- **ZHA Sans (`--font-secondary`) is always regular weight and upright** - never bold or italic, never below 24 px, only in the lockup, the logo, `.hero > h1` and the decks.
- Sentence case for headings and body; UPPERCASE only for chip labels and `.eyebrow`.
- Icons are inline stroke SVGs in `currentColor` - never emoji, never solid glyph fonts.
- `[data-brand]` beating `[data-theme="dark"]` on branded pages is intended - do not "fix" it.
- `.app-bar__brand` keeps its regular ZHA Sans fallback (the 2026-07-17 review put it back on purpose).
- The cascade order is the fixed `PARTIALS` list in `packages/css/build.mjs` - never glob. Equal-specificity rules are ordered by that list and by position inside a partial.
- `dist/` is generated and gitignored - never `git add` under it. Stage `*.tokens.json`, `src/**`, `test/**`, docs and examples.
- **Never `git push`, never merge.** Work on branch `feat/composition-layer`; commit per task; the maintainer opens the PR.
- No new dependencies in any package.
- Gates for "done" on every task: `pnpm build` green (it runs the contrast gate, which fails closed), `pnpm test` green, `pnpm lint` clean. The contrast gate validates source-intended token values and cannot see hover colours, gradients or the oklch overlay; Task 13 is the browser render-verify that covers what the gate cannot.
- New prose in AGENTS.md, DESIGN.md, AI-USAGE.md, README.md and the consumer notes is semi-formal British English with ASCII hyphens only (no em or en dashes), per the vault's report register. Existing lines are left as they are.
- Inline `style=` attributes in the rebuilt examples may set only the knob allowlist: `--container-w`, `--grid-min`, `--stack-gap`, `--split-aside`, `--control-h`, `--dialog-w`, `--sidebar-w`, `--zha-logo-h`. The React starter's menu positioning (`style.top`/`style.left` set from JS) is the one sanctioned exception.
- Every task's **Model** line follows the per-task tag rule: `implementer=<haiku|sonnet|opus|fable>, reviewer=<sonnet|opus|fable>`; the reviewer is never below sonnet.

## Review Focus

These input classes are implied by the spec but were not originally pinned by a test; each is now pinned in the task named.

1. A consumer page that styles `h1 { … }` itself (the Vite scaffold case) must win over the package's element defaults without `!important` - pinned in Task 2 (no bare element selector in `type.css`).
2. `<section class="hero grad-hero-dusk">` must still paint the gradient - the hero sets `background-color`, never the `background` shorthand - pinned in Task 3.
3. A `.stack` or `.grid` with the `hidden` attribute must disappear, although its class sets `display: flex`/`grid` - pinned in Task 2 (`[hidden] { display: none !important }`).
4. Under `prefers-reduced-motion: reduce` the spinner must keep turning (slower), although base.css forces every animation to one iteration - pinned in Task 4.
5. The drift guard must reject an inline style that sets an unknown custom property (`style="--foo: 1"`) as well as a layout declaration, and must accept a listed knob - pinned in Task 6.
6. The merged print block must still neutralise tinted chips and the translucent app bar - pinned in Task 4.

---

### Task 1: Tokens and `llms.txt`

**Files:**
- Modify: `packages/tokens/src/primitive/scale.tokens.json` (the `fs` group)
- Modify: `packages/tokens/src/semantic/typography.tokens.json`
- Modify: `packages/tokens/src/semantic/core.tokens.json`
- Modify: `packages/tokens/src/semantic/density.tokens.json`
- Modify: `packages/tokens/style-dictionary.config.mjs` (the `zha/llms` format, lines 28-50)
- Test: `packages/tokens/test/build-output.test.ts`

**Model:** implementer=sonnet, reviewer=opus - six files, token names are a wire contract

**Interfaces:**
- Produces the CSS variables every later task consumes: `--fs-h1`, `--fs-hero-xl`, `--fs-reading`, `--leading-prose`, `--leading-heading`, `--measure`, `--space-section`, `--space-block`, `--space-inline`, `--gutter`, `--z-sticky`, `--z-toast`; compact density overrides for the three space tiers.
- Produces `dist/llms.txt` with `--name: value` lines for every non-colour token, including the `space` and `radius` groups.

- [ ] **Step 1: Create the branch**

```bash
git checkout -b feat/composition-layer
```

- [ ] **Step 2: Write the failing tests**

Append inside the `describe('token build', …)` block of `packages/tokens/test/build-output.test.ts`, before its closing `});`:

```ts
  // Spec 3 §4 - the composition-layer tokens. Base build emits aliases as var() references
  // (outputReferences: true); the density build emits literals (its source has no primitives).
  it('ships the composition-layer tokens in :root', () => {
    const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
    const root = css.slice(css.indexOf(':root {'), css.indexOf('[data-theme="dark"]'));
    expect(root).toMatch(/--fs-h1:\s*20px/);
    expect(root).toMatch(/--fs-hero-xl:\s*clamp\(2\.5rem, 1\.5rem \+ 4vw, 4\.5rem\)/);
    expect(root).toMatch(/--fs-reading:\s*16px/);
    expect(root).toMatch(/--leading-prose:\s*1\.5/);
    expect(root).toMatch(/--leading-heading:\s*1\.15/);
    expect(root).toMatch(/--measure:\s*65ch/);
    expect(root).toMatch(/--space-section:\s*var\(--space-12\)/);
    expect(root).toMatch(/--space-block:\s*var\(--space-6\)/);
    expect(root).toMatch(/--space-inline:\s*var\(--space-3\)/);
    expect(root).toMatch(/--gutter:\s*var\(--space-6\)/);     // top-level token: --gutter, not --space-gutter
    expect(root).toMatch(/--z-sticky:\s*10/);
    expect(root).toMatch(/--z-toast:\s*100/);
  });

  it('compact density remaps the three rhythm tiers', () => {
    const css = readFileSync(new URL('../dist/tokens-density.css', import.meta.url), 'utf8');
    expect(css).toMatch(/--space-section:\s*32px/);
    expect(css).toMatch(/--space-block:\s*16px/);
    expect(css).toMatch(/--space-inline:\s*8px/);
  });

  it('llms.txt carries values, the space/radius groups, and points at classes.txt', () => {
    const txt = readFileSync(new URL('../dist/llms.txt', import.meta.url), 'utf8');
    expect(txt).toMatch(/^--space-4: 16px$/m);
    expect(txt).toMatch(/^--radius-m: 8px$/m);
    expect(txt).toMatch(/^--fs-h1: 20px$/m);
    expect(txt).toMatch(/^--accent$/m);                        // colour tokens stay name-only (per-theme values)
    expect(txt).toMatch(/classes\.txt/);
    expect(txt).not.toMatch(/\.skeleton \.sr-only$/m);         // the stale nine-class line is gone
  });
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens build && pnpm --filter @gitzhacode/zha-ui-tokens test`
Expected: the three new tests FAIL (`--fs-h1` not found, `--space-section` not found, `--space-4: 16px` not found); all earlier tests pass.

- [ ] **Step 4: Add the type-scale tokens**

In `packages/tokens/src/primitive/scale.tokens.json`, replace the `"fs"` group with:

```json
  "fs": {
    "hero": { "$type": "dimension", "$value": "32px" },
    "hero-xl": { "$type": "other", "$value": "clamp(2.5rem, 1.5rem + 4vw, 4.5rem)", "$description": "Fluid 40-72px display for .hero > h1 on landing and brand pages." },
    "display": { "$type": "dimension", "$value": "24px" },
    "h1": { "$type": "dimension", "$value": "20px", "$description": "Element h2 size; fills the 16→24 gap. (fs-* names are sizes, not elements - see DESIGN.md ladder.)" },
    "h2": { "$type": "dimension", "$value": "16px" },
    "h3": { "$type": "dimension", "$value": "14px" },
    "body": { "$type": "dimension", "$value": "13px" },
    "reading": { "$type": "dimension", "$value": "16px", "$description": "Paragraph size inside .prose - an alias by role so nobody writes --fs-h2 for body copy." },
    "small": { "$type": "dimension", "$value": "12px" },
    "label": { "$type": "dimension", "$value": "11px" }
  }
```

- [ ] **Step 5: Add the leading and measure tokens**

Replace the whole of `packages/tokens/src/semantic/typography.tokens.json` with:

```json
{
  "tracking": { "display": { "$type": "dimension", "$value": "-0.04em" },
                "body": { "$type": "dimension", "$value": "-0.01em" },
                "label": { "$type": "dimension", "$value": "0.01em" },
                "small": { "$type": "dimension", "$value": "0.01em" } },
  "leading":  { "display": { "$type": "number", "$value": 1.0 },
                "heading": { "$type": "number", "$value": 1.15, "$description": "Wrapping headings at 14-24px. --leading-display stays for hero and stat values." },
                "body": { "$type": "number", "$value": 1.2 },
                "prose": { "$type": "number", "$value": 1.5, "$description": "Paragraph leading (.prose). --leading-body 1.2 is the brand-book value and stays for controls, tables, labels." } },
  "measure":  { "DEFAULT": { "$type": "dimension", "$value": "65ch", "$description": "Maximum line length for text blocks (.prose, hero copy)." } }
}
```

- [ ] **Step 6: Add the rhythm, gutter and z-index tokens**

In `packages/tokens/src/semantic/core.tokens.json`, insert these three top-level groups directly before the `"control"` group (after the closing `}` of `"grad"` and its comma):

```json
  "space": {
    "section": { "$type": "dimension", "$value": "{space.12}", "$description": "Vertical rhythm between sections (48px comfortable; compact remaps to 32px)." },
    "block":   { "$type": "dimension", "$value": "{space.6}",  "$description": "Gap between components in a .stack (24px; compact 16px)." },
    "inline":  { "$type": "dimension", "$value": "{space.3}",  "$description": "Gap inside a row of controls or chips (12px; compact 8px)." }
  },
  "gutter": {
    "DEFAULT": { "$type": "dimension", "$value": "{space.6}", "$description": "Page side padding (.container). The CSS drops it to --space-4 at 640px." }
  },
  "z": {
    "sticky": { "$type": "number", "$value": 10,  "$description": "Sticky table header, off-canvas sidebar. Dialogs and menus are top-layer and need no z-index." },
    "toast":  { "$type": "number", "$value": 100, "$description": ".toast" }
  },
```

- [ ] **Step 7: Add the compact remaps**

Replace the whole of `packages/tokens/src/semantic/density.tokens.json` with (literals, not references: the density build's source has no primitives to resolve against):

```json
{
  "control": {
    "h":     { "$type": "dimension", "$value": "36px" },
    "pad-y": { "$type": "dimension", "$value": "6px" }
  },
  "row": {
    "h":     { "$type": "dimension", "$value": "36px" }
  },
  "space": {
    "section": { "$type": "dimension", "$value": "32px" },
    "block":   { "$type": "dimension", "$value": "16px" },
    "inline":  { "$type": "dimension", "$value": "8px" }
  }
}
```

- [ ] **Step 8: Emit values and the space/radius groups in `llms.txt`, and replace the class line**

In `packages/tokens/style-dictionary.config.mjs`, inside the `zha/llms` format, replace

```js
    const semantic = dictionary.allTokens.filter(
      (t) => t.path[0] !== 'color' && t.path[0] !== 'space' && t.path[0] !== 'radius',
    );
```

with

```js
    // Every non-colour token, with its value (space/radius included - an agent reading llms.txt
    // alone had never seen --space-4). Colour tokens stay name-only: their values differ per theme.
    const semantic = dictionary.allTokens.filter((t) => t.path[0] !== 'color');
    const line = (t) => (t.$type === 'color' ? `--${t.name}` : `--${t.name}: ${t.$value}`);
```

and replace `...semantic.map((t) => \`--${t.name}\`),` with `...semantic.map(line),`.

Replace the last array entry (the line starting `'Primitive classes (from @gitzhacode/zha-ui-css): .surface .card .btn`) with:

```js
      'Primitive classes (from @gitzhacode/zha-ui-css): the generated, always-current list is that package\'s dist/classes.txt (export "./classes.txt"); roles, markup and knobs are in AI-USAGE.md and AGENTS.md.',
```

- [ ] **Step 9: Build and run the tests**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens build && pnpm --filter @gitzhacode/zha-ui-tokens test && pnpm --filter @gitzhacode/zha-ui-tokens lint`
Expected: build prints the contrast gate summary with all pairs passing (no colour changed); all tests PASS including the three new ones; `tsc` clean.

- [ ] **Step 10: Commit**

```bash
git add packages/tokens/src packages/tokens/style-dictionary.config.mjs packages/tokens/test/build-output.test.ts
git commit -m "feat(tokens): composition-layer tokens (type ladder, rhythm tiers, gutter, z) + llms.txt values

Refs Spec 3 §4"
```

---

### Task 2: Element defaults (`type.css`) and `.prose`

**Files:**
- Create: `packages/css/src/primitives/type.css`
- Modify: `packages/css/build.mjs:15` (the `PARTIALS` list)
- Test: `packages/css/test/exports.test.ts`

**Model:** implementer=haiku, reviewer=sonnet - full code in plan, three files

**Interfaces:**
- Consumes the Task 1 tokens `--fs-h1`, `--fs-reading`, `--leading-heading`, `--leading-prose`, `--measure`.
- Produces: element defaults (all `:where()`), `[hidden]`, `.prose`, `.text-muted`. Later tasks' markup relies on `h1`-`h4`, `p`, `a`, `pre` needing no classes.

- [ ] **Step 1: Write the failing tests**

Append inside the `describe('@gitzhacode/zha-ui-css', …)` block of `packages/css/test/exports.test.ts`, before its closing `});`:

```ts
  // Spec 3 §5.1 - element defaults ship at zero specificity: any consumer rule wins without !important.
  it('ships element defaults in type.css, every element selector :where()-wrapped', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/:where\(\*, \*::before, \*::after\)\s*\{\s*box-sizing:\s*border-box/);
    expect(css).toMatch(/\[hidden\]\s*\{\s*display:\s*none !important/);
    expect(css).toMatch(/:where\(html\)\s*\{[^}]*font-synthesis-weight:\s*none/s);
    expect(css).toMatch(/:where\(body\)\s*\{[^}]*font:\s*var\(--fs-body\) \/ var\(--leading-body\) var\(--font-primary\)/s);
    expect(css).toMatch(/:where\(h1, h2, h3, h4\)\s*\{[^}]*line-height:\s*var\(--leading-heading\)/s);
    expect(css).toMatch(/:where\(h1\)\s*\{[^}]*font-size:\s*var\(--fs-display\)/s);
    expect(css).toMatch(/:where\(h2\)\s*\{[^}]*font-size:\s*var\(--fs-h1\)/s);
    expect(css).toMatch(/:where\(h3\)\s*\{[^}]*font-size:\s*var\(--fs-h2\)/s);
    expect(css).toMatch(/:where\(a\)\s*\{[^}]*color:\s*var\(--accent-fill\)/s);
    expect(css).toMatch(/:where\(pre\)\s*\{\s*overflow-x:\s*auto/);
    // Review Focus 1: no bare element selector in the partial (comments start with /*, rules with :where, . or [)
    const type = readFileSync(new URL('../src/primitives/type.css', import.meta.url), 'utf8');
    expect(type.split('\n').filter((l) => /^[a-z]/.test(l))).toEqual([]);
  });
  it('ships .prose and the one text utility', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.prose\s*\{[^}]*max-inline-size:\s*var\(--measure\)[^}]*font-size:\s*var\(--fs-reading\)[^}]*line-height:\s*var\(--leading-prose\)/s);
    expect(css).toMatch(/\.prose > \* \+ \*\s*\{\s*margin-block-start:\s*var\(--space-4\)/);
    expect(css).toMatch(/\.prose a\s*\{\s*text-decoration:\s*underline/);
    expect(css).toMatch(/\.text-muted\s*\{\s*color:\s*var\(--text-muted\)/);
  });
  it('type partial sits directly after base in the cascade', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css.indexOf(':where(body)')).toBeGreaterThan(css.indexOf('.sr-only'));        // after base
    expect(css.indexOf(':where(body)')).toBeLessThan(css.indexOf('.grad-hero-ember'));   // before gradient
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @gitzhacode/zha-ui-css build && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: the three new tests FAIL (`:where(body)` not found; `type.css` ENOENT); the existing 37 pass.

- [ ] **Step 3: Create the partial**

Create `packages/css/src/primitives/type.css` with exactly:

```css
/* type - element defaults (Spec 3 §5.1). Every selector is :where()-wrapped (zero specificity):
   any consumer rule wins without !important; that is the opt-out. Only [hidden] carries weight,
   because .stack/.grid display rules must never defeat the hidden attribute. */
:where(*, *::before, *::after) { box-sizing: border-box; } /* width:100% + padding must not overrun its column */
:where(html) { font-synthesis-weight: none; -webkit-text-size-adjust: 100%; } /* no faux-bold: ZHA Sans has no bold face */
[hidden] { display: none !important; }
:where(body) { margin: 0; min-block-size: 100dvh; background: var(--bg-page); color: var(--text-default);
  font: var(--fs-body) / var(--leading-body) var(--font-primary); letter-spacing: var(--tracking-body);
  -webkit-font-smoothing: antialiased; }
:where(h1, h2, h3, h4, h5, h6, p, figure, blockquote, ul, ol, dl, pre) { margin: 0; } /* layout owns spacing (.stack/.prose) */
:where(h1, h2, h3, h4) { color: var(--text-strong); font-weight: 500; line-height: var(--leading-heading); text-wrap: balance; }
:where(h1) { font-size: var(--fs-display); letter-spacing: var(--tracking-display); }
:where(h2) { font-size: var(--fs-h1); }   /* fs-* names are sizes, not elements - ladder in DESIGN.md */
:where(h3) { font-size: var(--fs-h2); }
:where(h4) { font-size: var(--fs-h3); }
:where(a) { color: var(--accent-fill); text-decoration: none; }
:where(a:hover) { text-decoration: underline; }
:where(strong, b) { font-weight: 600; }
:where(small) { font-size: var(--fs-small); }
:where(code, kbd, samp, pre) { font-family: var(--font-mono); font-size: 0.92em; }
:where(pre) { overflow-x: auto; } /* long code lines scroll instead of breaking a grid cell */
:where(hr) { border: 0; block-size: 1px; background: var(--border-subtle); }
:where(img, video, canvas) { max-inline-size: 100%; block-size: auto; } /* not svg: block-size:auto would override icon height attributes */
:where(button, input, select, textarea) { font: inherit; color: inherit; }
:where(table) { border-collapse: collapse; }

/* .prose - running text (Spec 3 §5.2). Links underlined always: colour alone is not a link cue in a paragraph (WCAG 1.4.1). */
.prose { max-inline-size: var(--measure); font-size: var(--fs-reading); line-height: var(--leading-prose); }
.prose > * + * { margin-block-start: var(--space-4); }
.prose > :where(h2, h3) { margin-block-start: var(--space-8); }
.prose :where(ul, ol) { padding-inline-start: 1.25em; }
.prose a { text-decoration: underline; }
.text-muted { color: var(--text-muted); } /* the one text utility: a secondary line without a hand-rolled style */
```

- [ ] **Step 4: Add the partial to the cascade**

In `packages/css/build.mjs`, change

```js
const PARTIALS = ['base', 'gradient', 'layout', 'nav', 'content', 'feedback', 'overlay', 'menu'];
```

to

```js
const PARTIALS = ['base', 'type', 'gradient', 'layout', 'nav', 'content', 'feedback', 'overlay', 'menu'];
```

- [ ] **Step 5: Build and run the tests**

Run: `pnpm --filter @gitzhacode/zha-ui-css build && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: all tests PASS (40).

- [ ] **Step 6: Commit**

```bash
git add packages/css/src/primitives/type.css packages/css/build.mjs packages/css/test/exports.test.ts
git commit -m "feat(css): type.css element defaults at zero specificity + .prose + .text-muted

Refs Spec 3 §5.1-5.2"
```

---

### Task 3: Composition primitives and phone-width behaviour (`layout.css`)

**Files:**
- Modify: `packages/css/src/primitives/layout.css` (append after the `.divider` rule on line 23)
- Test: `packages/css/test/exports.test.ts`

**Model:** implementer=haiku, reviewer=opus - full code in plan; `data-nav-open` is a wire contract

**Interfaces:**
- Consumes `--space-section`, `--space-block`, `--space-inline`, `--gutter`, `--z-sticky`, `--fs-hero-xl`, `--fs-h1`, `--measure` from Task 1.
- Produces the classes the examples (Tasks 8-11) and the guidance (Task 7) use: `.container` (knob `--container-w`), `.stack` (+`--tight`/`--loose`, knob `--stack-gap`), `.cluster` (+`--between`/`--end`), `.grid` (knob `--grid-min`), `.section`, `.split` (+`--aside-start`, knob `--split-aside`), `.toolbar`, `.divider--vertical`, `.form-grid` + `.field--span`, `.table-wrap`, `.eyebrow`, `.hero` (+`--bleed`); the `data-nav-open` attribute on `.app-shell`.

- [ ] **Step 1: Write the failing tests**

Append inside the describe block of `packages/css/test/exports.test.ts`:

```ts
  // Spec 3 §5.3 - composition primitives: one job, one knob each.
  it('ships the composition primitives with their knobs', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const c of ['.container', '.stack', '.stack--tight', '.stack--loose', '.cluster', '.cluster--between', '.cluster--end',
      '.grid', '.section', '.split', '.split--aside-start', '.toolbar', '.divider--vertical', '.form-grid', '.field--span',
      '.table-wrap', '.eyebrow', '.hero', '.hero--bleed']) {
      expect(css, `${c} ships`).toMatch(new RegExp(esc(c) + '\\s*\\{'));
    }
    expect(css).toMatch(/\.container\s*\{\s*--container-w:\s*72rem;\s*inline-size:\s*min\(100% - 2 \* var\(--gutter\), var\(--container-w\)\)/);
    expect(css).toMatch(/\.stack\s*\{[^}]*gap:\s*var\(--stack-gap, var\(--space-block\)\)/s);
    expect(css).toMatch(/\.grid\s*\{[^}]*minmax\(min\(var\(--grid-min, 16rem\), 100%\), 1fr\)/s);
    expect(css).toMatch(/\.section \+ \.section\s*\{\s*border-block-start:\s*1px solid var\(--border-subtle\)/);
    expect(css).toMatch(/\.toolbar\s*\{[^}]*--control-h:\s*36px/s);
    expect(css).toMatch(/\.field--span\s*\{\s*grid-column:\s*1 \/ -1/);
  });
  // Review Focus 2: the hero sets background-COLOR so .grad-hero-* / .accent-grad-* (background-image, earlier partial) still paint.
  it('hero keeps gradient classes paintable, ZHA Sans at display size only, brand-scoped eyebrow', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const hero = css.match(/\.hero\s*\{[^}]*\}/s)?.[0] ?? '';
    expect(hero).toMatch(/background-color:\s*var\(--bg-surface-1\)/);
    expect(hero).not.toMatch(/background:/);
    expect(css).toMatch(/\.hero--bleed\s*\{\s*border-radius:\s*0/);
    expect(css).toMatch(/\.hero > h1\s*\{[^}]*font:\s*400 var\(--fs-hero-xl\) \/ var\(--leading-display\) var\(--font-secondary\)/s);
    expect(css).toMatch(/\.hero \.eyebrow:where\(\[data-surface="brand"\] \*\)\s*\{\s*color:\s*var\(--accent\)/);
    expect(css).toMatch(/\.eyebrow\s*\{[^}]*var\(--font-mono\)[^}]*text-transform:\s*uppercase[^}]*color:\s*var\(--text-muted\)/s);
  });
  // Spec 3 §5.6 - two breakpoints the docs name (1024 narrow, 768 phone) plus the 640 gutter drop.
  it('collapses the app shell at phone width behind data-nav-open', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const phone = css.match(/@media \(max-width: 768px\)\s*\{[\s\S]*?\n\}/)?.[0] ?? '';
    expect(phone).toMatch(/\.app-shell\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)[^}]*grid-template-areas:\s*"header" "main"/s);
    expect(phone).toMatch(/\.app-shell > \.sidebar\s*\{\s*display:\s*none/);
    expect(phone).toMatch(/\.app-shell\[data-nav-open\] > \.sidebar\s*\{[^}]*position:\s*fixed[^}]*z-index:\s*var\(--z-sticky\)/s);
    expect(phone).toMatch(/\.page-header\s*\{\s*flex-wrap:\s*wrap/);
    expect(css).toMatch(/@media \(max-width: 1024px\)\s*\{\s*\.split\s*\{\s*grid-template-columns:\s*1fr/);
    expect(css).toMatch(/@media \(max-width: 640px\)\s*\{\s*\.container\s*\{\s*--gutter:\s*var\(--space-4\);\s*\}\s*\.app-bar\s*\{\s*gap:\s*var\(--space-2\)/);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @gitzhacode/zha-ui-css build && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: the three new tests FAIL (`.container` not found); 40 earlier tests pass.

- [ ] **Step 3: Append the primitives and the media queries**

Append to the end of `packages/css/src/primitives/layout.css` (after the `.divider` line):

```css
.divider--vertical { inline-size: 1px; block-size: 20px; margin: 0 var(--space-1); } /* inside .toolbar and .cluster */

/* composition primitives (Spec 3 §5.3) - one job, one knob each; the knob is the only inline style an agent may write */
.container { --container-w: 72rem; inline-size: min(100% - 2 * var(--gutter), var(--container-w)); margin-inline: auto; }
.stack { display: flex; flex-direction: column; gap: var(--stack-gap, var(--space-block)); }
.stack--tight { --stack-gap: var(--space-2); }
.stack--loose { --stack-gap: var(--space-section); }
.cluster { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-inline); }
.cluster--between { justify-content: space-between; }
.cluster--end { justify-content: flex-end; }
.grid { display: grid; gap: var(--space-block); grid-template-columns: repeat(auto-fit, minmax(min(var(--grid-min, 16rem), 100%), 1fr)); }
.section { padding-block: var(--space-section); }
.section + .section { border-block-start: 1px solid var(--border-subtle); }
.split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(16rem, var(--split-aside, 22rem)); gap: var(--space-6); }
.split--aside-start { grid-template-columns: minmax(16rem, var(--split-aside, 22rem)) minmax(0, 1fr); } /* aside first: analysis panel left of a canvas */
.toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2); --control-h: 36px; } /* compact controls by scope - the sanctioned knob, applied for you */
.form-grid { display: grid; gap: var(--space-4) var(--space-5); grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr)); }
.field--span { grid-column: 1 / -1; }
.table-wrap { overflow-x: auto; max-inline-size: 100%; } /* pairs with .data-table--wrap (content.css: cells wrap) */
.eyebrow { font: 500 var(--fs-label) / 1 var(--font-mono); letter-spacing: .12em; text-transform: uppercase; color: var(--text-muted); }

/* .hero - where the deck's language enters app and landing pages: ZHA Sans at real display size, one gradient, black field.
   background-COLOR, not the shorthand: the gradient classes (.grad-hero-*, .accent-grad-*) set background-image earlier
   in the cascade and the shorthand would reset it to none on <section class="hero grad-hero-dusk">. */
.hero { display: flex; flex-direction: column; gap: var(--space-5); padding: var(--space-16) var(--space-8);
  border-radius: var(--radius-l); background-color: var(--bg-surface-1); color: var(--text-default); }
.hero--bleed { border-radius: 0; } /* full-width hero outside the container drops the panel radius */
.hero > h1 { font: 400 var(--fs-hero-xl) / var(--leading-display) var(--font-secondary); letter-spacing: var(--tracking-display);
  color: var(--text-strong); max-inline-size: 18ch; text-wrap: balance; }
.hero > p { font-size: var(--fs-h1); color: var(--text-muted); max-inline-size: var(--measure); }
.hero .eyebrow:where([data-surface="brand"] *) { color: var(--accent); } /* brand attribute on the hero itself or an ancestor; render-verified teal-on-black - bare --accent at 11px fails AA on light */

/* responsive (Spec 3 §5.6): 1024 narrow (.split stacks), 768 phone (shell collapses), 640 gutter drop (matches the app bar) */
@media (max-width: 1024px) { .split { grid-template-columns: 1fr; } }
@media (max-width: 768px) {
  .app-shell { grid-template-columns: minmax(0, 1fr); grid-template-areas: "header" "main"; } /* minmax(0,…): the bar's min-content must not widen the shell past the viewport */
  .app-shell > .sidebar { display: none; }
  .app-shell[data-nav-open] > .sidebar { display: flex; position: fixed; inset-block: var(--app-bar-h) 0; inset-inline-start: 0;
    inline-size: var(--sidebar-w); z-index: var(--z-sticky); box-shadow: var(--shadow-high); } /* consumer JS toggles the attribute, like data-rail */
  .app-shell > .app-main { padding: var(--space-4); }
  .page-header { flex-wrap: wrap; }
  .hero { padding: var(--space-10) var(--space-5); }
}
@media (max-width: 640px) { .container { --gutter: var(--space-4); } .app-bar { gap: var(--space-2); } } /* lockup + three icon buttons + the primary fit a 390px bar only at the tighter gap */
```

- [ ] **Step 4: Build and run the tests**

Run: `pnpm --filter @gitzhacode/zha-ui-css build && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: all tests PASS (43).

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/layout.css packages/css/test/exports.test.ts
git commit -m "feat(css): composition primitives (container/stack/cluster/grid/section/split/toolbar/form-grid/table-wrap/eyebrow/hero) + phone-width shell

Refs Spec 3 §5.3, §5.6"
```

---

### Task 4: Focus, states, feedback and tidy

**Files:**
- Modify: `packages/css/src/primitives/base.css`
- Modify: `packages/css/src/primitives/content.css`
- Modify: `packages/css/src/primitives/feedback.css`
- Modify: `packages/css/src/primitives/overlay.css:29`
- Modify: `packages/css/src/primitives/menu.css` (the `.menu__item:has(:disabled)` rule)
- Modify: `packages/css/src/primitives/layout.css:17` (the `.app-bar__app` rule)
- Test: `packages/css/test/exports.test.ts`

**Model:** implementer=sonnet, reviewer=opus - six partials, exact diffs; the focus ring is a shared contract

**Interfaces:**
- Consumes `--z-toast` from Task 1.
- Produces: outline focus ring; hover/active/disabled on every control; `.card` padding + `.card--flush`; `.alert__title` block; `.toast`; `.spinner`; `.data-table--wrap`; selected rows; `aria-sort` chevrons. Later examples rely on `.card` padding and `.toast`.

- [ ] **Step 1: Write the failing tests**

Append inside the describe block of `packages/css/test/exports.test.ts`:

```ts
  // Spec 3 §5.4 - focus is an outline: never clipped by overflow:hidden, follows the element's radius, survives forced-colours.
  it('focus is an outline, never a shadow or a radius override', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/:focus-visible\s*\{\s*outline:\s*2px solid var\(--accent-fill\);\s*outline-offset:\s*2px;\s*\}/);
    expect(css).not.toMatch(/:focus-visible\s*\{[^}]*box-shadow/s);
    expect(css).not.toMatch(/:focus-visible\s*\{[^}]*border-radius/s);
    expect(css).toMatch(/\.input:focus-visible, \.select:focus-visible\s*\{\s*outline-offset:\s*0;\s*border-color:\s*var\(--accent-fill\)/);
    expect(css).toMatch(/\.segmented label:has\(:focus-visible\)\s*\{\s*outline:\s*2px solid var\(--accent-fill\)/);
  });
  // Spec 3 §5.5 - every control has hover, pressed and ONE disabled value.
  it('controls have hover, pressed and one disabled value', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.btn\s*\{[^}]*white-space:\s*nowrap[^}]*gap:\s*var\(--space-2\)[^}]*padding:\s*0 var\(--space-4\)[^}]*transition:\s*background var\(--motion-fast\) var\(--ease-out\), transform var\(--motion-fast\) var\(--ease-out\)/s);
    expect(css).toMatch(/\.btn--primary:hover\s*\{\s*background:\s*color-mix\(in srgb, var\(--accent-fill\) 88%, var\(--text-strong\)\)/);
    expect(css).toMatch(/\.btn--danger:hover\s*\{\s*background:\s*color-mix\(in srgb, var\(--intent-error\) 88%, var\(--text-strong\)\)/);
    expect(css).toMatch(/\.btn:active, \.icon-btn:active, button\.chip:active, \.tabs__tab:active, \.pagination button:active\s*\{\s*transform:\s*translateY\(1px\)/);
    expect(css).toMatch(/\.btn:disabled, \.icon-btn:disabled, button\.chip:disabled, \.tabs__tab:disabled, \.input:disabled, \.select:disabled\s*\{\s*opacity:\s*\.45;\s*cursor:\s*default/);
    expect(css).not.toMatch(/opacity:\s*\.4;/);   // the old .menu__item value is gone
    expect(css).toMatch(/\.menu__item:disabled, \.menu__item:has\(:disabled\)\s*\{\s*opacity:\s*\.45/);
    expect(css).toMatch(/\.input:hover, \.select:hover\s*\{\s*border-color:\s*var\(--border-strong\)/);
    expect(css).toMatch(/button\.chip:not\(\[aria-pressed="true"\]\):not\(\.is-active\):hover\s*\{\s*border-color:\s*var\(--border-default\)/);
    expect(css).toMatch(/\.accordion summary:hover\s*\{\s*background:\s*var\(--bg-surface-2\)/);
    expect(css).toMatch(/\.input, \.select\s*\{[^}]*padding:\s*var\(--control-pad-y, 9px\) var\(--space-3\)/s);
  });
  it('card has default padding with a flush opt-out and still no resting shadow', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const card = css.match(/\.card\s*\{[^}]*\}/s)?.[0] ?? '';
    expect(card).toMatch(/padding:\s*var\(--space-5\)/);
    expect(card).not.toMatch(/box-shadow/);
    expect(css).toMatch(/\.card--flush\s*\{\s*padding:\s*0/);
  });
  // Review Focus 4: base.css forces animation-iteration-count: 1 under reduced motion; the spinner must restate infinite.
  it('feedback: alert title is a block; toast and spinner ship; spinner keeps turning under reduced motion', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.alert__title\s*\{\s*display:\s*block;\s*font-weight:\s*600/);
    expect(css).toMatch(/\.toast\s*\{[^}]*position:\s*fixed[^}]*z-index:\s*var\(--z-toast\)[^}]*animation:\s*zha-view-fade/s);
    expect(css).toMatch(/\.toast > \.alert\s*\{\s*box-shadow:\s*var\(--shadow-high\)/);
    expect(css).toMatch(/\.spinner\s*\{[^}]*border-block-start-color:\s*var\(--accent-fill\)[^}]*animation:\s*zha-spin \.8s linear infinite/s);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.spinner\s*\{\s*animation-duration:\s*1\.5s !important;\s*animation-iteration-count:\s*infinite !important/);
  });
  it('tables: wrap mode after the nowrap rule, selected row, sort chevron', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.data-table--wrap th, \.data-table--wrap td\s*\{\s*white-space:\s*normal/);
    expect(css.indexOf('.data-table--wrap th')).toBeGreaterThan(css.indexOf('.data-table th, .data-table td'));
    expect(css).toMatch(/\.data-table tbody tr\[aria-selected="true"\]\s*\{\s*background:\s*var\(--accent-subtle\)/);
    expect(css).toMatch(/\.data-table th\[aria-sort\] button::after\s*\{[^}]*border-inline-end:\s*2px solid currentColor/s);
    expect(css).toMatch(/\.data-table th\[aria-sort="ascending"\] button::after\s*\{\s*transform:\s*rotate\(-135deg\)/);
  });
  // Review Focus 6: one print block in base, still covering tinted chips and the translucent bar.
  it('base has one print block covering chips and the app bar; dialog title and app name tidy', () => {
    const base = readFileSync(new URL('../src/primitives/base.css', import.meta.url), 'utf8');
    expect((base.match(/@media print/g) ?? []).length).toBe(1);
    const print = base.slice(base.indexOf('@media print'));
    expect(print).toMatch(/\[class\*="chip--"\]/);
    expect(print).toMatch(/\.app-bar\s*\{\s*background:\s*#fff !important/);
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.dialog__title\s*\{[^}]*letter-spacing:\s*var\(--tracking-body\)/s);
    expect(css).toMatch(/\.app-bar \.app-bar__app\s*\{\s*font:\s*400 var\(--fs-h2\) \/ 1\.3 var\(--font-primary\)/);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @gitzhacode/zha-ui-css build && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: the six new tests FAIL; 43 earlier tests pass.

- [ ] **Step 3: Edit `base.css`**

Replace the `.card` line with:

```css
.card { background: var(--bg-surface-1); border: 1px solid var(--border-subtle); border-radius: var(--radius-l); color: var(--text-default); padding: var(--space-5); } /* border-first: hairline only, no resting shadow. Default padding: with inline styles banned, nothing else can pad a card */
.card--flush { padding: 0; } /* media and table cards */
```

Replace the `.btn { … }` rule (five lines) and the `.btn--primary` through `.btn:disabled` lines with:

```css
.btn { display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; gap: var(--space-2); min-height: var(--control-h, 44px);
  padding: 0 var(--space-4); border-radius: var(--radius-m); font: var(--fw-medium, 500) var(--fs-body) / 1 var(--font-primary);
  letter-spacing: var(--tracking-body); cursor: pointer; border: 1px solid transparent;
  text-decoration: none; color: inherit; /* anchor-safe: <a class="btn"> must not keep link underline/colour */
  transition: background var(--motion-fast) var(--ease-out), transform var(--motion-fast) var(--ease-out); }
.btn--primary { background: var(--accent-fill); color: var(--accent-on); }   /* AA-safe fill, never bare --accent */
.btn--primary:hover { background: color-mix(in srgb, var(--accent-fill) 88%, var(--text-strong)); } /* lightens on dark, darkens on light: --text-strong flips per theme; the gate cannot see it - render-verified */
.btn--secondary { background: var(--bg-surface-1); border-color: var(--border-default); color: var(--text-default); }
.btn--secondary:hover { background: var(--bg-surface-2); }
.btn--ghost { background: transparent; color: var(--text-muted); border-color: transparent; } /* keeps .btn's 1px transparent border → same height as siblings, no size jump when toggled */
.btn--ghost:hover { background: var(--bg-surface-2); }
.btn--danger { background: var(--intent-error); color: var(--intent-on-error); }
.btn--danger:hover  { background: color-mix(in srgb, var(--intent-error) 88%, var(--text-strong)); }
/* shared press + disabled states - one value across the package (Spec 3 §5.5) */
.btn:active, .icon-btn:active, button.chip:active, .tabs__tab:active, .pagination button:active { transform: translateY(1px); }
.btn:disabled, .icon-btn:disabled, button.chip:disabled, .tabs__tab:disabled, .input:disabled, .select:disabled { opacity: .45; cursor: default; }
```

Replace the `.input, .select { … }` two-line rule and the placeholder line with:

```css
.input, .select { width: 100%; min-height: var(--control-h, 44px); padding: var(--control-pad-y, 9px) var(--space-3); font: var(--fs-body) / 1.2 var(--font-primary);
  background: var(--bg-surface-1); border: 1px solid var(--border-default); border-radius: var(--radius-m); color: var(--text-default); }
.input::placeholder { color: var(--text-muted); }
.input:hover, .select:hover { border-color: var(--border-strong); }
```

After the `button.chip { cursor: pointer; }` line add:

```css
button.chip:not([aria-pressed="true"]):not(.is-active):hover { border-color: var(--border-default); } /* :not(): the bare hover (0,2,1) would outrank the pressed state (0,2,0) */
```

Replace `:focus-visible { outline: none; box-shadow: var(--focus-ring); border-radius: var(--radius-m); }` with:

```css
/* focus = outline, not shadow: not clipped by overflow:hidden, follows the element's own radius, survives forced-colours (Spec 3 §5.4).
   --accent-fill is gate-checked at 3.0 against every surface, so the ring clears WCAG 2.2 non-text contrast by construction. */
:focus-visible { outline: 2px solid var(--accent-fill); outline-offset: 2px; }
.input:focus-visible, .select:focus-visible { outline-offset: 0; border-color: var(--accent-fill); }
```

Merge the two print blocks: delete the final line `@media print { .app-bar { background: #fff !important; … } }` and add its rule inside the first `@media print { … }` block, after the `[class*="chip--"]` line:

```css
  .app-bar { background: #fff !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; position: static !important; }
```

- [ ] **Step 4: Edit `content.css`**

After `.accordion summary::-webkit-details-marker { display: none; }` add:

```css
.accordion summary:hover { background: var(--bg-surface-2); }
```

Directly after the `.data-table th, .data-table td { … white-space: nowrap; }` line add (it must follow that line: equal specificity, source order decides):

```css
.data-table--wrap th, .data-table--wrap td { white-space: normal; } /* inside .table-wrap; must follow the nowrap rule above */
```

After `.data-table tbody tr:hover { … }` add:

```css
.data-table tbody tr[aria-selected="true"] { background: var(--accent-subtle); }
```

After the sort-header reset rule (the `.data-table thead th :is(.btn, button):not(.icon-btn)…` two-line rule) add:

```css
/* sort direction - same chevron construction as .accordion summary::after */
.data-table th[aria-sort] button::after { content: ""; inline-size: 6px; block-size: 6px; margin-inline-start: var(--space-1);
  border-inline-end: 2px solid currentColor; border-block-end: 2px solid currentColor; transform: rotate(45deg); }
.data-table th[aria-sort="ascending"] button::after { transform: rotate(-135deg); }
```

Replace `.segmented label:has(:focus-visible) { box-shadow: var(--focus-ring); } /* proxy: … */` with:

```css
.segmented label:has(:focus-visible) { outline: 2px solid var(--accent-fill); outline-offset: 2px; } /* proxy: real radio is opacity:0 (line 39); forward the global ring to the visible label - not a stray override, do not remove */
```

- [ ] **Step 5: Edit `feedback.css`**

Replace the `.alert__title` line with:

```css
.alert__title { display: block; font-weight: 600; color: var(--text-strong); margin-block-end: 2px; } /* block: the title used to run into the body text */
```

Append at the end of the file:

```css

/* toast - <div class="toast"><div class="alert alert--success" role="status">…</div></div>; insert/remove is consumer JS (same boundary as .dialog) */
.toast { position: fixed; inset-block-end: var(--space-6); inset-inline-end: var(--space-6); z-index: var(--z-toast);
  inline-size: min(100% - 2 * var(--space-4), 24rem); animation: zha-view-fade var(--motion-base) var(--ease-out); }
.toast > .alert { box-shadow: var(--shadow-high); }
/* spinner - an unknown wait (.skeleton is for a known shape) */
.spinner { display: inline-block; inline-size: 1.25em; block-size: 1.25em; border: 2px solid var(--border-subtle);
  border-block-start-color: var(--accent-fill); border-radius: var(--radius-pill); animation: zha-spin .8s linear infinite; }
@keyframes zha-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 1.5s !important; animation-iteration-count: infinite !important; } } /* slower, not frozen: an indeterminate wait still needs a signal; base.css forces iteration-count 1, so restate it */
```

- [ ] **Step 6: Edit `overlay.css`, `menu.css`, `layout.css`**

In `overlay.css`, in the `.dialog__title` rule replace `letter-spacing: var(--tracking-label)` with `letter-spacing: var(--tracking-body)` (it is a 16 px heading, not a label).

In `menu.css`, replace `.menu__item:has(:disabled) { opacity: .4; cursor: not-allowed; }` with:

```css
.menu__item:disabled, .menu__item:has(:disabled) { opacity: .45; cursor: not-allowed; } /* one disabled value across the package */
```

In `layout.css`, in the `.app-bar .app-bar__app` rule replace `font: 400 var(--fs-h2) / 1 var(--font-primary);` with `font: 400 var(--fs-h2) / 1.3 var(--font-primary);` and extend its trailing comment to `/* ellipsis, never bleed under the actions; 1.3 not 1: overflow:hidden clips descenders at line-height 1 */`.

- [ ] **Step 7: Build and run the tests**

Run: `pnpm --filter @gitzhacode/zha-ui-css build && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: all tests PASS (49). If `expect(css).not.toMatch(/opacity:\s*\.4;/)` fails, grep `packages/css/src` for `opacity: .4;` and align that rule to `.45` too (the spec allows one disabled value only).

- [ ] **Step 8: Cross-check against the preview**

Run: `diff --strip-trailing-cr <(sed -n '/^\/\* type - element defaults/,$p' preview/composition/primitives-preview.css | grep -v 'PREVIEW' ) <(grep -v 'PREVIEW' packages/css/dist/primitives.css | sed -n '/^\/\* type - element defaults/,$p') | head -40`
Expected: only comment-wording differences and the font `url("../../packages/css/dist/assets/…")` lines. Any differing declaration is a bug in this task or Task 2/3: fix it to match the preview (the preview is the render-verified truth).

- [ ] **Step 9: Commit**

```bash
git add packages/css/src/primitives packages/css/test/exports.test.ts
git commit -m "feat(css): outline focus ring, hover/pressed/disabled on every control, card padding, toast + spinner, table states, tidy

Refs Spec 3 §5.4, §5.5, §5.7, §5.8"
```

---

### Task 5: Generated class list (`classes.txt`)

**Files:**
- Modify: `packages/css/build.mjs` (after `writeFileSync('dist/primitives.css', primitives);`)
- Modify: `packages/css/package.json` (the `exports` map)
- Test: `packages/css/test/exports.test.ts`

**Model:** implementer=haiku, reviewer=sonnet - full code, three files

**Interfaces:**
- Produces `dist/classes.txt` (one `.class` per line, sorted, de-duplicated) and the package export `./classes.txt`, which `llms.txt` (Task 1) already points at.

- [ ] **Step 1: Write the failing test**

Append inside the describe block of `packages/css/test/exports.test.ts`:

```ts
  it('ships dist/classes.txt - every primitive class, one per line, no false positives', () => {
    expect(existsSync(d('classes.txt'))).toBe(true);
    const lines = readFileSync(d('classes.txt'), 'utf8').trim().split('\n');
    expect(lines).toContain('.stack');
    expect(lines).toContain('.btn--primary');
    expect(lines).toContain('.zha-lockup__team');
    expect(lines).not.toContain('.g');          // "e.g." in a comment must not leak
    expect(lines.every((l) => /^\.-?[_a-zA-Z][\w-]*$/.test(l))).toBe(true);
    expect(new Set(lines).size).toBe(lines.length);
    expect(JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).exports['./classes.txt']).toBe('./dist/classes.txt');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @gitzhacode/zha-ui-css build && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: the new test FAILS (`classes.txt` does not exist).

- [ ] **Step 3: Generate the list in the build**

In `packages/css/build.mjs`, after `writeFileSync('dist/primitives.css', primitives);` add:

```js
// classes.txt - the always-current class vocabulary for agents (llms.txt points here).
// Comments are stripped first so prose like "e.g." cannot leak a bogus ".g".
const lockup = readFileSync('src/es-lockup.css', 'utf8');
const noComments = (primitives + '\n' + lockup).replace(/\/\*[\s\S]*?\*\//g, '');
const classes = [...new Set([...noComments.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => '.' + m[1]))].sort();
writeFileSync('dist/classes.txt', classes.join('\n') + '\n');
```

- [ ] **Step 4: Export it**

In `packages/css/package.json`, add to `exports` after the `"./index.css"` line:

```json
    "./classes.txt": "./dist/classes.txt",
```

- [ ] **Step 5: Build and run the tests**

Run: `pnpm --filter @gitzhacode/zha-ui-css build && pnpm --filter @gitzhacode/zha-ui-css test && pnpm exec publint packages/css`
Expected: all tests PASS (50); publint reports no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/css/build.mjs packages/css/package.json packages/css/test/exports.test.ts
git commit -m "feat(css): generate dist/classes.txt (export ./classes.txt) for agent vocabulary

Refs Spec 3 §4"
```

---

### Task 6: Drift guard inline-style rule and coverage

**Files:**
- Modify: `examples/_drift-guard.mjs` (`lint()` and `run()`)
- Test: `examples/drift-guard.test.mjs`
- Create: `examples/_checks/package.json`, `examples/_checks/hub-check.mjs`
- Create: `examples/foundation-reference/package.json`, `examples/foundation-reference/check.mjs`

**Model:** implementer=sonnet, reviewer=opus - shared helper used by every example; a false positive blocks CI

**Interfaces:**
- Produces `lint(html, bundle, { checkClasses, inlineKnobsOnly })` returning `{ missing, colors, structural, inline }`, and `run(htmlUrl, bundlePath, { checkClasses, inlineKnobsOnly, label })`. Tasks 8 and 9 pass `inlineKnobsOnly: true`; the decks and the foundation reference leave it off (they are presentation and reference surfaces with page-local demo styles).
- Produces a workspace package `zha-examples-checks` whose `build` runs the guard's unit tests and the hub check, so both run in `pnpm build` and CI.

- [ ] **Step 1: Write the failing tests**

Append to `examples/drift-guard.test.mjs`:

```js
// Spec 3 §7 - inline styles may only set documented knobs (Review Focus 5).
test('inlineKnobsOnly: accepts a listed knob', () => {
  const r = lint('<div class="grid" style="--grid-min: 11rem"></div>', BUNDLE, { inlineKnobsOnly: true });
  assert.deepEqual(r.inline, []);
});
test('inlineKnobsOnly: rejects a layout declaration', () => {
  const r = lint('<div class="card" style="padding: var(--space-5)"></div>', BUNDLE, { inlineKnobsOnly: true });
  assert.deepEqual(r.inline, ['padding: var(--space-5)']);
});
test('inlineKnobsOnly: rejects an unknown custom property', () => {
  const r = lint('<div style="--foo: 1; --control-h: 24px"></div>', BUNDLE, { inlineKnobsOnly: true });
  assert.deepEqual(r.inline, ['--foo: 1']);
});
test('inlineKnobsOnly off: inline styles are not reported', () => {
  const r = lint('<div style="padding: 4px"></div>', BUNDLE);
  assert.deepEqual(r.inline, []);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test examples/drift-guard.test.mjs`
Expected: the four new tests FAIL (`r.inline` is undefined); the eight earlier tests pass.

- [ ] **Step 3: Add the rule to `lint()`**

In `examples/_drift-guard.mjs`, change the signature line to

```js
export function lint(html, bundle, { checkClasses = false, inlineKnobsOnly = false } = {}) {
```

Add after the `NEUTRAL` constant near the top of the file:

```js
// Spec 3 §7: the only inline styles a page may write are the documented knobs. Everything
// else is layout, and layout belongs to .stack/.cluster/.grid/.section (gap-has-one-owner).
const KNOBS = new Set(['--container-w', '--grid-min', '--stack-gap', '--split-aside', '--control-h', '--dialog-w', '--sidebar-w', '--zha-logo-h']);
```

Before the final `return { missing, colors: …` line of `lint()` add:

```js
  const inline = [];
  if (inlineKnobsOnly) {
    for (const m of html.matchAll(/style=["']([^"']*)["']/gi)) {
      for (const decl of m[1].split(';').map((s) => s.trim()).filter(Boolean)) {
        if (!KNOBS.has(decl.split(':')[0].trim())) inline.push(decl);
      }
    }
  }
```

and change the return to:

```js
  return { missing, colors: [...new Set(colors)], structural: [...new Set(structural)], inline };
```

In `run()`, change the signature to `export function run(htmlUrl, bundlePath, { checkClasses = false, inlineKnobsOnly = false, label } = {}) {`, destructure `inline` from `lint(html, bundle, { checkClasses, inlineKnobsOnly })`, add `|| inline.length` to the failure condition, and add inside it:

```js
    if (inline.length) console.error(`${label}: inline styles beyond the knob allowlist (use .stack/.cluster/.grid/.section):`, inline);
```

Extend the success line to `… no hardcoded colour${inlineKnobsOnly ? ', inline styles knobs-only' : ''} ✓`.

- [ ] **Step 4: Run the unit tests**

Run: `node --test examples/drift-guard.test.mjs`
Expected: 12 tests pass.

- [ ] **Step 5: Add the checks package and the foundation-reference check**

Create `examples/_checks/package.json`:

```json
{
  "name": "zha-examples-checks",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "build": "node --test ../drift-guard.test.mjs"
  },
  "dependencies": {
    "@gitzhacode/zha-ui-css": "workspace:*"
  }
}
```

(The hub check is created now but wired into this `build` script in Task 9, once the hub itself is rebuilt; wiring it earlier would turn `pnpm build` red between the two tasks.)

Create `examples/_checks/hub-check.mjs`:

```js
// Drift guard for the examples hub (examples/index.html), which has no package of its own.
// The hub is a landing page built only from bundle classes, so classes are checked and
// inline styles are knobs-only - this is what would have caught the --fs-h1 bug.
import { createRequire } from 'node:module';
import { run } from '../_drift-guard.mjs';

run(
  new URL('../index.html', import.meta.url),
  createRequire(import.meta.url).resolve('@gitzhacode/zha-ui-css/index.css'),
  { checkClasses: true, inlineKnobsOnly: true, label: 'examples hub' },
);
```

Create `examples/foundation-reference/package.json`:

```json
{
  "name": "zha-foundation-reference",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "build": "node check.mjs"
  },
  "dependencies": {
    "@gitzhacode/zha-ui-css": "workspace:*"
  }
}
```

Create `examples/foundation-reference/check.mjs`:

```js
// Drift guard for the foundation reference. Classes are NOT checked (the page defines its own
// fr-* layout classes in a <style> block) and inline styles are allowed (it is a reference sheet
// whose demos set position/size by hand); tokens, colours and CSS structure are enforced.
import { createRequire } from 'node:module';
import { run } from '../_drift-guard.mjs';

run(
  new URL('./index.html', import.meta.url),
  createRequire(import.meta.url).resolve('@gitzhacode/zha-ui-css/index.css'),
  { label: 'foundation-reference' },
);
```

- [ ] **Step 6: Install and run the whole build**

Run: `pnpm install && pnpm build`
Expected: `pnpm install` links the two new workspace packages (lockfile updated); `pnpm build` runs every workspace build and stays green: `zha-examples-checks` runs the 12 drift-guard unit tests, and `zha-foundation-reference` prints `foundation-reference: … CSS balanced, no hardcoded colour ✓`.

Then run the hub check by hand to record the baseline: `node examples/_checks/hub-check.mjs`
Expected: FAIL on the current `examples/index.html` (its `<style>` layout block and inline styles are reported). That is the defect Task 9 removes; do not loosen the rule.

- [ ] **Step 7: Commit**

```bash
git add examples/_drift-guard.mjs examples/drift-guard.test.mjs examples/_checks examples/foundation-reference/package.json examples/foundation-reference/check.mjs pnpm-lock.yaml
git commit -m "feat(examples): drift guard inline-style knob rule; hub + foundation reference join the guard

Refs Spec 3 §7"
```

---

### Task 7: Guidance rewrite (AGENTS.md, DESIGN.md, AI-USAGE.md, README.md)

**Files:**
- Modify: `AGENTS.md`
- Modify: `DESIGN.md`
- Modify: `AI-USAGE.md`
- Modify: `README.md:80-100` (the "What you get" list)

**Model:** implementer=opus, reviewer=opus - the taste layer; prose quality decides agent output

**Interfaces:**
- Consumes every class and token from Tasks 1-5 and the rules in spec §6.1 (copy them from the spec; they are the contract).
- Produces the guidance Tasks 8-11 are built against. No code.

- [ ] **Step 1: Restructure AGENTS.md**

In `AGENTS.md`:

1. Replace the body of the section `## Use the primitives` (everything from the line starting `**Spec 1 (base):**` up to, not including, the line `**The app bar** - exactly one blessed composition`) with:

```markdown
The complete class vocabulary, with roles and markup, is in [`AI-USAGE.md`](./AI-USAGE.md); the
generated list is `@gitzhacode/zha-ui-css/classes.txt`. In short: controls (`.btn` + variants,
`.input`, `.select`, `.field`, `.chip`, `.segmented`, `.icon-btn`), content (`.card`, `.stat`,
`.data-table`, `.badge`, `.accordion`), feedback (`.alert`, `.toast`, `.progress`, `.spinner`,
`.skeleton`, `.empty-state`), navigation (`.app-shell`, `.app-bar`, `.sidebar`, `.tabs`, `.breadcrumb`,
`.pagination`, `.page-header`), overlays (`.dialog`, `.menu`), the composition layer (`.container`,
`.stack`, `.cluster`, `.grid`, `.section`, `.split`, `.toolbar`, `.form-grid`, `.table-wrap`, `.hero`,
`.eyebrow`, `.prose`) and the gradient library (`.grad-*`, `.accent-grad-*`; decorative only, never a
work-surface heading fill). Charts use the `--chart-*` tokens, never a library palette (DESIGN.md
§Charts).

Elements need no classes: `h1`-`h4`, `p`, `a`, `strong`, `code`, `pre`, `hr`, `img` carry on-brand
defaults from the package at zero specificity. Write elements, not sizes.
```

2. After the app-bar block (after the bullet ending `… (≥48px, tokens/`currentColor` only).`) and before `**Important:** .card is now hairline-only`, insert three new sections. Copy their content from the spec, section 6.1, verbatim where the spec gives wording:

- `## Compose a page` - the three recipe skeletons (app page, tool page, landing page) as fenced HTML with the class names exactly as the spec lists them, each followed by one sentence saying when it applies.
- `## Rules` - the twenty-four slugged rules from spec §6.1, one bullet each, slug in backticks first, in the spec's order.
- `## Not ZHA` - the "Blessed, do not remove" sentence and the "Banned" list from spec §6.1.
- `## Before you ship` - the ten numbered lines from spec §6.1.

3. Replace the `**Important:** .card is now **hairline-only** …` paragraph with:

```markdown
**Important:** `.card` is hairline-only (no resting shadow) and now carries default padding
(`--space-5`); add `.card--flush` for media or table cards and `.card--interactive` only on clickable
cards that need the hover lift. Inline `style=` attributes may set only the documented knobs
(`--container-w`, `--grid-min`, `--stack-gap`, `--split-aside`, `--control-h`, `--dialog-w`,
`--sidebar-w`, `--zha-logo-h`); the drift guard rejects anything else. Spacing comes from `.stack`,
`.cluster`, `.grid` and `.section`, never from per-element margins.
```

4. In `## Naming & type rules`, replace the ZHA Sans bullet with:

```markdown
- Headings are `--font-primary` at weight 500 (the brand book's rule). ZHA Sans (`--font-secondary`)
  is always regular weight and upright - never bold or italic - and appears only in the lockup and
  logo, in `.hero > h1` (display size, 32 px and up) and in the decks; never below 24 px, never on a
  card or section heading. In the app bar it belongs to the lockup alone.
```

Keep every other line of AGENTS.md as it is, including the hard rule, the setup, the switches table, the app-bar block and the work protocol.

- [ ] **Step 2: Extend DESIGN.md**

In `DESIGN.md`, after the `## The gradient library` section and before `## Charts`, insert these sections (prose in the report register; tables where items share fields):

- `## Typography ladder` - a table with columns Element, Size token, Face, Weight, Leading, Tracking, Where ZHA Sans is allowed; rows h1 (`--fs-display` 24 px, primary, 500, `--leading-heading`, `--tracking-display`), h2 (`--fs-h1` 20 px), h3 (`--fs-h2` 16 px), h4 (`--fs-h3` 14 px), body (`--fs-body` 13 px, `--leading-body` 1.2), prose (`--fs-reading` 16 px, `--leading-prose` 1.5, `--measure` 65ch), hero h1 (`--fs-hero-xl`, ZHA Sans, 400, `--leading-display`). One paragraph on the locked heading-face decision and the "same surface" reading (spec §2 item 1), and one noting that the `--fs-h*` token names are sizes, not elements.
- `## Composition primitives` - the spec §5.3 table (class, rule in words, knob/modifiers) plus the `.hero` paragraph with the blessed markup `<section class="hero grad-hero-dusk" data-surface="brand">` and `.hero--bleed` for the full-width landing hero. State the two reasons behind the layer: one owner per gap, and content sets height.
- `## Rhythm` - the three tiers (`--space-section` 48/32, `--space-block` 24/16, `--space-inline` 12/8 by density), the gutter (24 px, 16 px under 640), and the two breakpoints (1024 px: `.split` stacks; 768 px: the shell collapses behind `data-nav-open`, which consumer JS toggles like `data-rail`). Say why breakpoints are not tokens (custom properties cannot drive media queries).
- `## Motion contract` - a table: primitive, property, duration token, easing token: `.btn` background and transform, `--motion-fast`, `--ease-out`; `.card--interactive` shadow and transform, `--motion-base`, `--ease-out`; `.accordion` chevron, `--motion-base`, `--ease-out`; `.dialog` opacity, `--motion-base`, `--ease-out`; `.menu` opacity and transform, `--motion-base`, `--ease-out`; `.toast` entrance, `--motion-base`, `--ease-out`; `.view-fade`, `--motion-slow`, `--ease-out`, once per view; `.segmented` thumb, `--motion-fast`, `--ease-spring` (the only spring); `.spinner`, 0.8 s linear, 1.5 s under reduced motion. Then the rules: transform and opacity only, never `transition: all`, never `--ease-in` on a state change, one entrance sequence per page, hover animates only `.card--interactive`, exits shorter than enters, reduced motion honoured by the bundle.
- `## Copy` - the five copy rules (`cta-says-what-happens`, `errors-explain`, `empty-state-invites`, `labels-specific`, `confirm-only-destructive`) each with one before/after pair, e.g. "Submit" becomes "Save changes"; "Something went wrong" becomes "The climate file is missing its header row. Re-export it from the Weather tool and upload again."
- `## States` - the four feedback kinds (status, completion, warning, error) mapped to `.alert` intents, `.badge` + `.dot`, `.toast`, `.field__error` + `aria-invalid`; loading via `.skeleton` (known shape) or `.spinner` (unknown wait); `.empty-state` for empty.

Then: in `## Depth & elevation` add the sentence "The focus ring is a 2 px outline in `--accent-fill`, offset 2 px, never a shadow, so it is never confused with elevation and is never clipped by `overflow: hidden`." In `## Conventions` replace the ZHA Sans bullet with the same wording as AGENTS.md step 1.4. In `## The token + class vocabulary`, add the composition classes, `.toast`, `.spinner`, `.text-muted`, `.card--flush`, `.hero--bleed`, `.data-table--wrap` to the class lists.

- [ ] **Step 3: Extend AI-USAGE.md**

In `AI-USAGE.md`:

1. In the quoted block, add a new line after the Spec 2 class lines:

```markdown
> *Spec 3 (composition + states):*
> `.container .stack .stack--tight .stack--loose .cluster .cluster--between .cluster--end .grid .section .split .split--aside-start .toolbar .divider--vertical .form-grid .field--span .table-wrap .data-table--wrap .eyebrow .hero .hero--bleed .prose .text-muted .card--flush .toast .spinner`
> Knobs (the ONLY inline styles allowed): `--container-w --grid-min --stack-gap --split-aside --control-h --dialog-w --sidebar-w --zha-logo-h`
> Elements carry defaults - write `h1`-`h4`, `p`, `a`, `pre`, `hr` without classes.
```

2. In the variables block, extend `*Typography:*` with `--fs-h1 --fs-hero-xl --fs-reading --leading-heading --leading-prose --measure`, `*Space:*` with `--space-section --space-block --space-inline --gutter` (and the sentence "the three tiers remap under `data-density="compact"`"), and add `*Layers:* --z-sticky --z-toast`. Mark `--focus-ring` as "deprecated: the package paints focus as an outline; kept for consumers who referenced it".

3. In the class cheat-sheet table, add one row per new class (`.container` … `.spinner`), each with the one-line role from spec §5.3 and §5.7, and change the `.card` row to "Border-first content container - 1 px hairline, no resting shadow, default padding `--space-5`. Add `.card--flush` for media/table cards, `.card--interactive` for hover lift, `.card--accent` for a leading accent stripe".

- [ ] **Step 4: Update README.md**

In the `## What you get` list, after the "Primitive classes" bullet add:

```markdown
- **Composition layer** - element typography with zero-specificity defaults, layout primitives
  (`.container`, `.stack`, `.cluster`, `.grid`, `.section`, `.split`, `.toolbar`, `.form-grid`,
  `.hero`), interaction states on every control, an outline focus ring, phone-width behaviour, and
  the rules for composing a page in [`AGENTS.md`](./AGENTS.md).
```

- [ ] **Step 5: Self-check the prose**

Run from the repo root:

```bash
node -e "const fs=require('fs');for(const f of ['AGENTS.md','DESIGN.md','AI-USAGE.md','README.md']){const s=fs.readFileSync(f,'utf8');const bad=s.split('\n').map((l,i)=>[i+1,l]).filter(([,l])=>/Zaha Hadid Architects/.test(l));console.log(f,'old-name hits:',bad.length);}"
grep -n -c "## Compose a page\|## Rules\|## Not ZHA\|## Before you ship" AGENTS.md
grep -c "one-primary-action\|gap-has-one-owner\|heading-ladder\|motion-contract" AGENTS.md
```

Expected: `old-name hits: 0` for all four files; the four section headings present (count 4); the four sample slugs present (count ≥ 4). AGENTS.md stays under 260 lines (`wc -l AGENTS.md`).

- [ ] **Step 6: Commit**

```bash
git add AGENTS.md DESIGN.md AI-USAGE.md README.md
git commit -m "docs: compose-a-page recipes, slugged rules, Not-ZHA list and ship checklist; typography ladder, rhythm, motion, copy, states

Refs Spec 3 §6"
```

---

### Task 8: Vanilla starter rebuilt on the composition layer

**Files:**
- Modify: `examples/zha-app-vanilla/index.html` (replace wholesale)
- Modify: `examples/zha-app-vanilla/check.mjs`
- Source: `preview/composition/tool-page.html` (read-only)

**Model:** implementer=haiku, reviewer=sonnet - a file move plus link edits, gated by the drift guard

**Interfaces:**
- Consumes the Task 2-4 classes and the Task 6 `inlineKnobsOnly` option.
- Produces the Ring 1 "tool page" recipe the guidance (Task 7) points at.

- [ ] **Step 1: Turn on the inline rule in the check**

In `examples/zha-app-vanilla/check.mjs`, change `{ checkClasses: true, label: 'zha-app-vanilla' }` to `{ checkClasses: true, inlineKnobsOnly: true, label: 'zha-app-vanilla' }`.

- [ ] **Step 2: Run the check to verify it fails on the current page**

Run: `pnpm --filter zha-app-vanilla build`
Expected: FAIL listing the current page's inline styles (56 declarations such as `max-width: 64rem`).

- [ ] **Step 3: Replace the page with the preview**

Copy `preview/composition/tool-page.html` over `examples/zha-app-vanilla/index.html`, then in the copy replace the four stylesheet links

```html
  <link rel="stylesheet" href="../../packages/css/dist/tokens.css">
  <link rel="stylesheet" href="./tokens-preview.css">
  <link rel="stylesheet" href="./primitives-preview.css">
  <link rel="stylesheet" href="../../packages/css/dist/es-lockup.css">
```

with the starter's single link and its hosted-URL comment, exactly as the current file has them:

```html
  <!-- Ring 1: one <link> to the bundled CSS. In production, pin the hosted major.minor:
       <link rel="stylesheet" href="https://<pages-host>/zha-ui/0.1/index.css"> -->
  <link rel="stylesheet" href="../../packages/css/dist/index.css">
```

Change the footer link `href="../../examples/index.html"` to `href="../index.html"`. Make no other change.

- [ ] **Step 4: Run the check**

Run: `pnpm --filter zha-app-vanilla build`
Expected: `zha-app-vanilla: N vars all bundle tokens, CSS balanced, no hardcoded colour, inline styles knobs-only ✓` (N is the number of `var(--…)` uses on the page, 0 or more).

- [ ] **Step 5: Commit**

```bash
git add examples/zha-app-vanilla/index.html examples/zha-app-vanilla/check.mjs
git commit -m "feat(examples): vanilla starter rebuilt as the tool-page recipe (hero, form-grid, results, zero inline layout)

Refs Spec 3 §8"
```

---

### Task 9: Examples hub rebuilt as the landing-page recipe

**Files:**
- Modify: `examples/index.html` (replace wholesale)
- Source: `preview/composition/landing-page.html` (read-only)

**Model:** implementer=sonnet, reviewer=sonnet - path surgery across a dozen links

**Interfaces:**
- Consumes Tasks 2-4 classes; gated by the Task 6 hub check (`checkClasses: true, inlineKnobsOnly: true`).

- [ ] **Step 1: Wire the hub check into the checks package and confirm it fails on the current hub**

In `examples/_checks/package.json`, change the build script to `"build": "node --test ../drift-guard.test.mjs && node hub-check.mjs"`.

Run: `pnpm --filter zha-examples-checks build`
Expected: the 12 unit tests pass, then `examples hub` FAILS (the current hub's `<style>` layout block and inline styles are reported).

- [ ] **Step 2: Replace the hub with the preview and fix the paths**

Copy `preview/composition/landing-page.html` over `examples/index.html`. Then:

1. Replace the four stylesheet links with the single `<link rel="stylesheet" href="../packages/css/dist/index.css">`.
2. Rewrite every `href="../../examples/<x>"` to `href="./<x>"` (brand-deck, brand-deck-editorial, brand-deck-product, brand-deck-specimen, foundation-reference, gradient-showcase, zha-app-vanilla).
3. Rewrite the lockup home link `href="./landing-page.html"` to `href="index.html"`.
4. Leave the two GitHub URLs unchanged.
5. Verify with `grep -n -o 'href="[^"]*"' examples/index.html | sort -u`: every relative href starts with `./`, `index.html` or `../packages/`.

- [ ] **Step 3: Run the hub check**

Run: `pnpm --filter zha-examples-checks build`
Expected: the 12 drift-guard unit tests pass and `examples hub: … inline styles knobs-only ✓`.

- [ ] **Step 4: Commit**

```bash
git add examples/index.html examples/_checks/package.json
git commit -m "feat(examples): hub rebuilt as the landing-page recipe (full-bleed hero, sections, no per-card eyebrows); hub joins the guard

Refs Spec 3 §8"
```

---

### Task 10: Foundation reference, section 26 and the heading face

**Files:**
- Modify: `examples/foundation-reference/index.html`

**Model:** implementer=sonnet, reviewer=sonnet - prose-described markup in a 1000-line page

**Interfaces:**
- Consumes every Task 2-4 class. Gated by the Task 6 reference check (tokens, colours, structure).

- [ ] **Step 1: Move small headings off ZHA Sans**

In the `<style>` block, change `.fr-sec__head h2 { margin: 0; font: var(--fs-h2)/1 var(--font-secondary);` to `.fr-sec__head h2 { margin: 0; font: 500 var(--fs-h2)/var(--leading-heading) var(--font-primary);`. In the Cards section, change the login card's `<h3 style="margin: 0 0 var(--space-4); font: var(--fs-h2)/1 var(--font-secondary); letter-spacing: var(--tracking-label); color: var(--text-strong)">Sign in</h3>` to `<h3 style="margin: 0 0 var(--space-4)">Sign in</h3>` (the element default now styles it). Leave `.fr-display` (the 24 px hero title) and `.fr-specimen` (the type specimen) on ZHA Sans.

- [ ] **Step 2: Add section 26**

After the closing `</section>` of section 25 (Tooltip & menu caret) and before `<footer>`, add a section in the page's own pattern (`fr-sec`, `fr-sec__head` with `<span class="fr-num">26</span><h2>Composition</h2>`, a `fr-lead` paragraph, then `fr-col` blocks). It demonstrates, in this order, each with a one-line `fr-lead`-style caption:

1. The element ladder: an `h1`, `h2`, `h3`, `h4`, a `p`, an inline `a`, `strong`, `code`, and an `hr`, with no classes, inside a `.prose` block, plus a `.text-muted` line.
2. `.stack` (three `.card`s, default padding) and `.stack--tight`; `.cluster` with three `.btn`s and a `.divider--vertical`; `.cluster--between`.
3. `.grid` with `style="--grid-min: 12rem"` holding four `.stat` tiles.
4. `.section + .section` (two short sections showing the hairline).
5. `.split` with a `.card` canvas placeholder and a `.card` aside holding two `.slider-row`s; a note that `.split--aside-start` mirrors it.
6. `.toolbar` with a `.segmented`, two `.chip` buttons, a `.divider--vertical` and a `.btn--ghost` (compact by scope).
7. `.form-grid` with three `.field`s and a `.field--span` textarea, then a `.cluster--end` with a ghost and a primary button.
8. `.table-wrap` around a `.data-table.data-table--wrap` with one `tr[aria-selected="true"]` and a `th[aria-sort="ascending"]` sort button.
9. `.eyebrow` on its own, then a `.hero` with `data-surface="brand"` and `.grad-hero-ocean`, with eyebrow, `h1`, `p` and a `.cluster` of two buttons.
10. The state matrix: a `.btn--primary`, `.btn--secondary`, `.btn--ghost`, `.btn--danger`, `.icon-btn`, `button.chip`, `.input`, each in rest and `disabled`, with a caption saying hover, pressed and focus are live (tab through them).
11. A `.toast` shown statically with `style="position: static; inline-size: 24rem"` (the reference is exempt from the knob rule), and a `.spinner` next to the words "Running model".

Every colour, size and space on the page stays a `var(--…)`; icons are inline stroke SVGs.

- [ ] **Step 3: Run the check**

Run: `pnpm --filter zha-foundation-reference build`
Expected: `foundation-reference: … CSS balanced, no hardcoded colour ✓`.

- [ ] **Step 4: Commit**

```bash
git add examples/foundation-reference/index.html
git commit -m "feat(examples): foundation reference section 26 (composition, states, toast, spinner); headings off ZHA Sans

Refs Spec 3 §8"
```

---

### Task 11: React starter rebuilt as the app-page recipe

**Files:**
- Modify: `examples/zha-app-react/src/App.jsx` (replace wholesale)
- Modify: `examples/zha-app-react/index.html:2` (`data-density="compact"`)
- Source: `preview/composition/app-page.html` (read-only)

**Model:** implementer=opus, reviewer=opus - multi-component integration with state and a design judgement per screen

**Interfaces:**
- Consumes every Task 2-4 class and the `data-nav-open` contract from Task 3.
- Produces the Ring 2 "app page" recipe the guidance (Task 7) points at. No router, no new dependency.

- [ ] **Step 1: Set compact density on the document**

In `examples/zha-app-react/index.html`, change `data-density="comfortable"` to `data-density="compact"` (a dense working tool).

- [ ] **Step 2: Rewrite `App.jsx` from the preview**

Translate `preview/composition/app-page.html` into `examples/zha-app-react/src/App.jsx`, keeping its markup, classes, copy and behaviour, with these components (one function each, in this file):

- `Icon({ name })` - returns the inline stroke SVGs used by the page (menu, search, contrast, grid, home, chart, document, sensor, settings, chevron-left, chevron-right, check, close, more), `viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"`.
- `AppBar({ onToggleNav, onToggleTheme, onNewModel })` - the canonical bar: `a.zha-lockup` home link with `aria-label`, `.app-bar__app` "Energy Studio", spacer, three `.icon-btn.icon-btn--ghost` (nav toggle with `aria-controls="nav"` and `aria-expanded`, search, theme) and the one `.btn.btn--primary` "New model".
- `Sidebar()` - `<nav className="sidebar" id="nav" aria-label="Main">` with six links (Overview `aria-current="page"`, Projects, Models, Reports, Sensors, Settings), each `<Icon/> <span>label</span>`.
- `Stat({ label, value, delta, direction })`.
- `ModelsTable({ rows, selected, onSelect, sort, onSort })` - `.table-wrap > table.data-table` with caption, the sortable Project header (`th[aria-sort]` holding a `<button>`), `.num` columns with `.th-unit`, `.badge` + `.dot` statuses, rows with `tabIndex={0}`, `aria-selected`, click and Enter/Space toggling selection.
- `Pagination()` - `<nav aria-label="Pagination"><ol className="pagination">` with chevron buttons and pages 1-3.
- `OverviewView(props)` - the `.toolbar` (segmented 24h/7d/30d, three filter chips with `aria-pressed`, `.divider--vertical`s, the search `.field` with `.sr-only` label, `.btn--ghost` Reset), the `.grid` of four `Stat`s with `style={{ '--grid-min': '11rem' }}`, `ModelsTable`, `Pagination`.
- `ProjectsView({ loaded, onNewModel })` - three `.skeleton` blocks until `loaded`, then the `.empty-state` (icon, `h3` "No projects yet", `p`, `.btn--secondary` "New model").
- `NewModelDialog({ dialogRef, onSaved })` - `<dialog className="dialog dialog--md" aria-labelledby="new-model-title">` with header, `.form-grid` form of four `.field`s (`id="new-model-form"`), footer with `.btn--ghost` Cancel (`formNoValidate`) and `.btn--primary` "Save model" (`type="submit" form="new-model-form"`); `onClose` reads `returnValue === 'save'` and calls `onSaved`.
- `Toast({ visible })` - `<div className="toast" hidden={!visible}><div className="alert alert--success" role="status">…Model saved…</div></div>`.
- `ColumnsMenu({ menuRef, triggerRef })` - `<div className="menu" id="more-menu" popover="auto">` with section, three `.menu__item` checkboxes, separator, footer; positioned on the popover `toggle` event by setting `style.top`/`style.left` from the trigger's `getBoundingClientRect()` (the one sanctioned inline style; set via the element, not a `style` prop).
- `App()` - state: `theme` (applied to `document.documentElement.dataset.theme` in an effect, as today), `navOpen`, `tab` (`'overview' | 'projects'`), `selected` row id, `sort` (`'ascending' | 'descending'`), `projectsLoaded` (set true 900 ms after the Projects tab first shows), `toast` (true for 3 s after a save). Renders `<div className="app-shell" {...(navOpen ? { 'data-nav-open': '' } : {})}>` with `AppBar`, `Sidebar`, `<main className="app-main stack">` holding `.page-header` (`<h1 className="page-header__title">Overview</h1>`, `.page-header__actions` with `.btn--secondary` Export and the `.icon-btn--ghost` more button with `popoverTarget="more-menu"`), the `.tabs` row (two `.tabs__tab` buttons, `aria-current="page"` on the active one), and the active view; then `NewModelDialog`, `Toast`, `ColumnsMenu`.

Rules that bind this file: no `style` prop except the `--grid-min` knob; no hex or named colour; no class outside `AI-USAGE.md`; one `.btn--primary` per view (the dialog's own is allowed); sentence case; no arrow glyphs; `window.__demo` is not needed in the React version. Use the lowercase DOM attribute names `popover="auto"` and `popovertarget="more-menu"` as JSX attributes: React 18.3 passes unknown lowercase attributes through to the DOM, while the camelCase `popoverTarget` prop exists only in React 19.

- [ ] **Step 3: Build and check**

Run: `pnpm --filter zha-app-react build`
Expected: `vite build` completes with no warnings about unresolved imports.

Run:

```bash
node -e "const s=require('fs').readFileSync('examples/zha-app-react/src/App.jsx','utf8');const styles=[...s.matchAll(/style=\{\{([^}]*)\}\}/g)].map(m=>m[1].trim());console.log('style props:',styles);console.log('hex:',(s.match(/#[0-9a-fA-F]{3,8}\b/g)||[]).filter(h=>!/^#(shell|nav|toast|new-model|more-menu|view-)/.test(h)));console.log('primary:',(s.match(/btn--primary/g)||[]).length,'arrows:',(s.match(/→|·/g)||[]).length,'font-secondary:',(s.match(/font-secondary/g)||[]).length);"
```

Expected: `style props: [ "'--grid-min': '11rem'" ]` (one entry), `hex: []`, `primary: 2`, `arrows: 0`, `font-secondary: 0`.

- [ ] **Step 4: Smoke-run in the browser**

Run: `pnpm --filter zha-app-react exec vite --port 7171 --strictPort --host 127.0.0.1` in the background, open `http://127.0.0.1:7171/`, and confirm by clicking: the tabs switch, the Projects tab shows skeletons then the empty state, "New model" opens the dialog, "Save model" closes it and shows the toast for about three seconds, the more button opens the columns menu next to it, the theme toggle flips the document, and at a 390 px wide window the nav toggle slides the sidebar in. Stop the server afterwards. (The executor may do this by hand; Task 13 repeats it with screenshots.)

- [ ] **Step 5: Commit**

```bash
git add examples/zha-app-react/src/App.jsx examples/zha-app-react/index.html
git commit -m "feat(examples): React starter rebuilt as the app-page recipe (shell, tabs, table, dialog, toast, phone nav)

Refs Spec 3 §8"
```

---

### Task 12: Changesets, consumer notes, PLAN.md

**Files:**
- Create: `.changeset/composition-layer.md`
- Create: `docs/tickets/2026-10-01-consumer-notes-0.1.3.md`
- Modify: `PLAN.md` (move the Spec 3 bullet to `## In progress`)

**Model:** implementer=sonnet, reviewer=sonnet - prose with exact facts from the diff

**Interfaces:**
- Consumes the shipped changes of Tasks 1-11 (read `git log --oneline main..HEAD` and the diffs).

- [ ] **Step 1: Write the changeset**

Create `.changeset/composition-layer.md`:

```markdown
---
"@gitzhacode/zha-ui-tokens": patch
"@gitzhacode/zha-ui-css": patch
---

Composition layer (Spec 3, 2026-09-30):

- **Tokens:** `--fs-h1` (20px), `--fs-hero-xl` (fluid 40-72px), `--fs-reading` (16px), `--leading-heading` (1.15), `--leading-prose` (1.5), `--measure` (65ch), the rhythm tiers `--space-section` / `--space-block` / `--space-inline` (48/24/12px, compact 32/16/8), `--gutter`, `--z-sticky`, `--z-toast`. `llms.txt` now carries values and the space/radius groups and points at the generated `classes.txt`.
- **Element defaults** (`type.css`, all `:where()` so any consumer rule wins): body, h1 - h4 (primary face, weight 500), p, a, strong, code, pre, hr, img; `box-sizing: border-box`; `[hidden]` always hides. `.prose` for running text, `.text-muted`.
- **Composition primitives:** `.container` (`--container-w`), `.stack` (`--stack-gap`, `--tight/--loose`), `.cluster` (`--between/--end`), `.grid` (`--grid-min`), `.section`, `.split` (`--split-aside`, `--aside-start`), `.toolbar`, `.divider--vertical`, `.form-grid` + `.field--span`, `.table-wrap` + `.data-table--wrap`, `.eyebrow`, `.hero` (+ `--bleed`).
- **States:** hover on `.btn--primary`/`--danger`, a pressed state and one disabled value on every control, input hover, chip hover, accordion hover, selected table rows, `aria-sort` chevrons. **Focus ring is now an outline** (`2px solid var(--accent-fill)`, offset 2px); `--focus-ring` is deprecated but still defined.
- **Feedback:** `.alert__title` is a block (it used to run into the body text); `.toast`; `.spinner` (keeps turning under reduced motion).
- **Phone width:** the app shell collapses at 768px with an off-canvas sidebar behind `data-nav-open`; `.split` stacks at 1024px; the gutter and app-bar gap tighten at 640px.
- **Breaking for consumers:** `.card` now has default padding (`--space-5`; add `.card--flush` or delete your own padding); `box-sizing: border-box` is the default; the focus ring is an outline; `.app-bar__app` line-height 1.3 (descenders were clipped).
```

- [ ] **Step 2: Write the consumer notes**

Create `docs/tickets/2026-10-01-consumer-notes-0.1.3.md` for digital-archive and zh-es-solar-trace, in the report register, with: the upgrade line (`github:GitZHACODE/zha-ui#release/css`, tag form `css-v0.1.3`); what to delete (hand-rolled container/max-width wrappers, stack margins, any `:focus-visible` override, `.card` padding they add themselves); what to add (`.table-wrap` around wide tables; `data-nav-open` toggle if they want the phone sidebar); what changes on screen without action (focus ring, alert titles, card padding, border-box); where the new rules live (AGENTS.md `## Compose a page`, `## Rules`, `## Before you ship`). Keep it under 60 lines.

- [ ] **Step 3: Update PLAN.md**

Move the "Composition layer (Spec 3)" bullet from `## Planned` to `## In progress`, rewording its tail to: "- implementation on `feat/composition-layer` per docs/plans/2026-10-01-zha-ui-composition-layer.md; remaining: render-verify matrix, preview deletion, final review, PR".

- [ ] **Step 4: Run the full gates**

Run: `pnpm build && pnpm test && pnpm lint`
Expected: every workspace build passes (including `zha-examples-checks`, `zha-foundation-reference`, `zha-app-vanilla`, `zha-app-react`); all vitest suites pass (`@gitzhacode/zha-ui-tokens`, `@gitzhacode/zha-ui-css`); lint clean.

- [ ] **Step 5: Commit**

```bash
git add .changeset/composition-layer.md docs/tickets/2026-10-01-consumer-notes-0.1.3.md PLAN.md
git commit -m "chore(release): changeset for 0.1.3 (composition layer) + consumer notes + PLAN

Refs Spec 3 §10"
```

---

### Task 13: Render-verify matrix, preview deletion, final review

**Files:**
- Delete: `preview/composition/` (five files)
- Modify: `PLAN.md` (move the bullet to `## Done`, dated)
- Modify: `docs/specs/2026-09-30-zha-ui-composition-layer-design.md` (status line to "Implemented" plus the execution date)

**Model:** implementer=fable, reviewer=fable - browser tools and visual judgement; the whole-branch review

**Interfaces:**
- Consumes everything. Produces the evidence that closes the spec's gate (§9).

- [ ] **Step 1: Build and serve**

Run: `pnpm build`, then serve the repo root on the registered preview port: `node -e "require('http').createServer((q,s)=>{const f=require('path').join(process.cwd(),decodeURIComponent(q.url.split('?')[0]).replace(/\/$/,'/index.html'));require('fs').readFile(f,(e,d)=>{if(e){s.writeHead(404);s.end();return;}s.writeHead(200,{'content-type':{'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf'}[require('path').extname(f)]||'application/octet-stream'});s.end(d);});}).listen(7172,'127.0.0.1')"` in the background, and `pnpm --filter zha-app-react exec vite --port 7171 --strictPort --host 127.0.0.1` in the background.

- [ ] **Step 2: Capture the matrix**

With Playwright, capture to `.playwright-mcp/verify/`:

| Page | URL | Widths | Themes | Extra states |
|---|---|---|---|---|
| vanilla starter | `http://127.0.0.1:7172/examples/zha-app-vanilla/index.html` | 1440, 390 | light, dark | - |
| hub | `http://127.0.0.1:7172/examples/index.html` | 1440, 390 | light, dark | - |
| React starter | `http://127.0.0.1:7171/` | 1440, 390 | light, dark | dialog open, toast, Projects empty state, `data-nav-open` at 390 |
| foundation reference section 26 | `http://127.0.0.1:7172/examples/foundation-reference/index.html#` (scroll to section 26) | 1440 | light, dark | - |

Also, on the vanilla page at 1440: hover the primary button and screenshot it in light and in dark (the gate cannot check `color-mix`); tab to three controls and screenshot the focus ring; set `data-surface="brand"` on `<html>` and screenshot the top of the page.

- [ ] **Step 3: Check each capture against the list**

For every capture confirm: no horizontal scroll (`document.documentElement.scrollWidth <= clientWidth`); the focus ring is visible on every control it lands on; hover lightens the primary on dark and darkens it on light; the hero gradient paints and its eyebrow is teal on the brand floor; the app shell collapses at 390 with the sidebar off-canvas when `data-nav-open` is set; alert titles sit above their body text; the app-name descenders are intact. Compare the vanilla, hub and React captures against the preview gallery pairs from 2026-10-01 (same layout, same type sizes, same states). Any difference is a defect in Tasks 2-11: fix it in that task's files, add a regex test for it in `exports.test.ts` where the CSS is at fault, and recapture.

- [ ] **Step 4: Delete the preview and close the spec**

```bash
git rm -r preview/composition
```

In the spec header change `**Status:** Draft for review` to `**Status:** Implemented YYYY-MM-DD on feat/composition-layer; render-verified per §9`, with today's date in ISO form. In `PLAN.md` move the bullet to `## Done` prefixed with today's date in the same form, in the Done list's style (one line: what shipped, the plan path, the render-verify matrix).

- [ ] **Step 5: Final gates and the whole-branch review**

Run: `pnpm build && pnpm test && pnpm lint && node --test examples/drift-guard.test.mjs`
Expected: all green.

Then run the whole-branch review (superpowers:requesting-code-review on `main..HEAD`) with the spec and this plan as the brief. Fix anything Critical or Important before the commit below.

- [ ] **Step 6: Commit**

```bash
git add -A -- PLAN.md docs/specs/2026-09-30-zha-ui-composition-layer-design.md preview
git commit -m "chore: render-verified composition layer; preview folder retired; spec implemented

Refs Spec 3 §9"
```

Stop here. Do not push. Report the branch name, the commit list and the capture folder to the maintainer, who opens the PR; the changesets bot then opens the release PR for 0.1.3.
