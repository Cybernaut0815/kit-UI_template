# zha-ui Composition Layer Fix-later Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the nineteen minor findings the 2026-10-01 whole-branch review deferred, on the same `feat/composition-layer` branch, before the maintainer opens the 0.1.3 PR.

**Architecture:** The pass has seven tasks: two harden tests, two change CSS (layout and navigation; states and type), one tightens the drift guard, one edits examples, one edits guidance, and the last is the render-verify and whole-branch review. Every CSS change keeps the cascade contract of Spec 3: zero-specificity opt-outs, equal-specificity rules ordered by the fixed `PARTIALS` list, and one disabled value across the package. One new class ships, `.app-bar__nav-toggle`, so the phone drawer's button is visible only where the drawer exists.

**Tech Stack:** pnpm 9 workspace, turbo, Style Dictionary 4 (`packages/tokens`), plain CSS partials concatenated by `packages/css/build.mjs`, vitest (regex tests over `dist/`), node:test for the drift guard, Vite 5 + React 18 for the React starter, Playwright for the render-verify.

**Spec:** [`docs/specs/2026-09-30-zha-ui-composition-layer-design.md`](../specs/2026-09-30-zha-ui-composition-layer-design.md) (status: Implemented 2026-10-01). Task 6 appends a dated amendments section to it, so the spec stays authoritative. The findings come from the final review's "Deferred-minor triage" of 2026-10-01; the SDD workspace that held the review was deleted, so this plan is the durable record of each finding. Line numbers below are from the branch tip `6a3489b`; where an earlier task in this plan shifts them, find the anchor by the quoted text or the `it(` title.

## Global Constraints

This section copies the constraints from the 2026-10-01 plan, AGENTS.md and the spec. Every task's requirements include this section.

- **The one hard rule (AGENTS.md):** "Use only the published zha-ui CSS variables and primitive classes. Never invent a CSS custom property (e.g. `--color-primary`). Never hard-code a hex value." The CSS package may define the one new class this plan names (`.app-bar__nav-toggle`) and no new custom property.
- **The firm is "ZHA"** - always. Never spell out its former name.
- **ZHA Sans (`--font-secondary`) is always regular weight and upright** - never bold or italic, never below 24 px, only in the lockup, the logo, `.hero > h1` and the decks.
- Sentence case for headings and body; UPPERCASE only for chip labels and `.eyebrow`.
- Icons are inline stroke SVGs in `currentColor` at 16, 20 or 24 px - never emoji, never solid glyph fonts.
- `[data-brand]` beating `[data-theme="dark"]` on branded pages is intended - do not "fix" it.
- `.app-bar__brand` keeps its regular ZHA Sans fallback (the 2026-07-17 review put it back on purpose).
- The cascade order is the fixed `PARTIALS` list in `packages/css/build.mjs` (`base, type, gradient, layout, nav, content, feedback, overlay, menu`) - never glob. Equal-specificity rules are ordered by that list and by position inside a partial.
- Every hover guard in this plan is `:where(:not(:disabled))`, never a bare `:not(:disabled)`: the bare form adds (0,1,0) and would let `.btn--ghost` hover outrank the `.btn:where([aria-pressed="true"]):hover` arm.
- `dist/` is generated and gitignored - never `git add` under it. Stage `src/**`, `test/**`, docs and examples.
- **Never `git push`, never merge.** Work on the existing branch `feat/composition-layer` (31 commits past `main`, tip `6a3489b`); commit per task; the maintainer opens the PR.
- No new dependencies in any package. The render-verify's browser runner, if one has to be installed, lives in the session scratchpad outside the repo.
- Gates for "done" on every task: `pnpm build` green (it runs the contrast gate and the three example drift guards), `pnpm test` green, `pnpm lint` clean.
- The three visible departures the maintainer accepted on 2026-10-01 stand: 11 px hero eyebrow (R21), giant hub lockup through `--zha-lockup-size` (R22), 16 px React icons (R19). This plan changes two further visible defaults and no others: `.alert__icon` goes to 16 px, and the React starter's hamburger disappears above 768 px.
- New prose in AGENTS.md, DESIGN.md, AI-USAGE.md, the spec amendments, the consumer notes and the changeset is semi-formal British English with ASCII hyphens only (no em or en dashes); new code comments use ASCII hyphens too. Existing lines are left as they are unless a step names them.
- AGENTS.md stays at or under 260 lines (it is at 258); its edits replace existing lines in place.
- Inline `style=` attributes in the examples may set only the knob allowlist: `--container-w`, `--grid-min`, `--stack-gap`, `--split-aside`, `--control-h`, `--dialog-w`, `--sidebar-w`, `--zha-logo-h`, `--zha-lockup-size`. The React menu's JS positioning is the one exception.
- Every task's **Model** line follows the per-task tag rule: `implementer=<haiku|sonnet|opus|fable>, reviewer=<sonnet|opus|fable>`; the reviewer is never below sonnet.

## Review Focus

These input classes are implied by the spec but no test pinned them on 2026-10-01; each is now pinned in the task named.

1. A disabled `.btn--ghost` carrying `aria-pressed="true"` keeps its pressed wash under the pointer: the hover guard must not raise any control hover above (0,2,0) - pinned in Task 3 (no `:not(:disabled):hover` outside `:where()`, every control hover guarded).
2. A sorted `<th>` holding both the sort button and a column-menu `.icon-btn` draws exactly one chevron, on the sort button - pinned in Task 3.
3. A `<style>` block containing `var(--space-)` (a typo) fails the guard, while a `<script>` building `'var(--typology-' + hue + '-100)'` still passes - pinned in Task 4.
4. `<div data-style="padding: 4px">` is not an inline style and `<div style = "padding: 4px">` is - pinned in Task 4.
5. `.app-bar__nav-toggle` hides above 768 px although `.icon-btn` sets `display: inline-flex` at the same specificity: the hide must follow `.icon-btn` in the bundle - pinned in Task 2.
6. A `.prose` block that opens with an `h2` has no dead space above it, while a later `h2` keeps its `--space-8` - pinned in Task 3.

---

### Task 1: Test hardening (tokens and CSS)

**Files:**
- Modify: `packages/tokens/test/build-output.test.ts:81-103` (the two Spec 3 token tests)
- Modify: `packages/css/test/exports.test.ts:375-379` (the cascade-position test), `:411-420` (the phone collapse test), after `:429` (new split-chain test)
- Reads: `packages/css/build.mjs:16` (the `PARTIALS` line)

**Model:** implementer=haiku, reviewer=sonnet - full code in the plan, two test files, no CSS change

**Interfaces:**
- Consumes the branch's built `dist/` as it is at `6a3489b` (every assertion below passes against the current CSS; this task pins, it does not change).
- Produces the test names Task 2 edits: `'collapses the app shell at phone width behind data-nav-open'` and `'type partial sits directly after base in the cascade'`.

- [ ] **Step 1: Commit this plan with the branch**

```bash
git add docs/plans/2026-10-02-composition-layer-fix-later.md
git commit -m "docs(plan): fix-later pass for the composition layer (19 deferred review minors)"
```

- [ ] **Step 2: End-anchor the token regexes**

In `packages/tokens/test/build-output.test.ts`, inside `it('ships the composition-layer tokens in :root', …)`, replace the twelve `expect(root)` lines (lines 84-95) with:

```ts
    expect(root).toMatch(/--fs-h1:\s*20px;/);
    expect(root).toMatch(/--fs-hero-xl:\s*clamp\(2\.5rem, 1\.5rem \+ 4vw, 4\.5rem\);/);
    expect(root).toMatch(/--fs-reading:\s*16px;/);
    expect(root).toMatch(/--leading-prose:\s*1\.5;/);          // ; anchors the value: 1.55 must not pass
    expect(root).toMatch(/--leading-heading:\s*1\.15;/);
    expect(root).toMatch(/--measure:\s*65ch;/);
    expect(root).toMatch(/--space-section:\s*var\(--space-12\);/);
    expect(root).toMatch(/--space-block:\s*var\(--space-6\);/);
    expect(root).toMatch(/--space-inline:\s*var\(--space-3\);/);
    expect(root).toMatch(/--gutter:\s*var\(--space-6\);/);     // top-level token: --gutter, not --space-gutter
    expect(root).toMatch(/--z-sticky:\s*10;/);                 // ; anchors the value: 100 must not pass
    expect(root).toMatch(/--z-toast:\s*100;/);
```

Inside `it('compact density remaps the three rhythm tiers', …)`, replace the three `expect(css)` lines (lines 100-102) with:

```ts
    expect(css).toMatch(/--space-section:\s*32px;/);
    expect(css).toMatch(/--space-block:\s*16px;/);
    expect(css).toMatch(/--space-inline:\s*8px;/);
```

- [ ] **Step 3: Pin the partial order at its source**

In `packages/css/test/exports.test.ts`, replace the whole `it('type partial sits directly after base in the cascade', …)` test (lines 375-379) with:

```ts
  it('type partial sits directly after base in the cascade', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css.indexOf(':where(body)')).toBeGreaterThan(css.indexOf('.sr-only'));        // after base
    expect(css.indexOf(':where(body)')).toBeLessThan(css.indexOf('.grad-hero-ember'));   // before gradient
    // the fixed PARTIALS list is the real guard (a partial inserted between base and type would pass the brackets above): pin it at the source
    const build = readFileSync(new URL('../build.mjs', import.meta.url), 'utf8');
    expect(build).toMatch(/PARTIALS = \['base', 'type', 'gradient', 'layout', 'nav', 'content', 'feedback', 'overlay', 'menu'\]/);
  });
```

- [ ] **Step 4: Assert the R4 fallback, the 768 paddings and the app-shell order**

In the same file, inside `it('collapses the app shell at phone width behind data-nav-open', …)`, directly after the line `expect(phone).toMatch(/\.app-shell\[data-nav-open\] > \.sidebar\s*\{[^}]*position:\s*fixed[^}]*z-index:\s*var\(--z-sticky\)/s);` add:

```ts
    expect(phone).toMatch(/\.app-shell\[data-nav-open\] > \.sidebar\s*\{[^}]*inline-size:\s*var\(--sidebar-w, 240px\)/s); // R4: --sidebar-w is only set under [data-rail]; without the fallback the drawer shrink-wraps
    expect(phone).toMatch(/\.app-shell > \.app-main\s*\{\s*padding:\s*var\(--space-4\)/);
    expect(phone).toMatch(/\.hero\s*\{\s*padding:\s*var\(--space-10\) var\(--space-5\)/);
    expect(css.indexOf('.app-shell {')).toBeLessThan(css.indexOf('@media (max-width: 768px)'));   // same partial, equal specificity: the collapse must follow the base rule
```

- [ ] **Step 5: Add the split-chain test**

Directly after the closing `});` of `it('composition knobs do not leak into nested primitives', …)` (line 429) add:

```ts
  // Equal-specificity chain in layout.css: .split, its > * reset, the --aside-start modifier (swaps the columns), then the 1024 query that stacks both.
  it('split modifier and its 1024 stack rule are ordered', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.split--aside-start\s*\{\s*grid-template-columns:\s*minmax\(16rem, var\(--split-aside, 22rem\)\) minmax\(0, 1fr\)/);
    expect(css.indexOf('.split {')).toBeLessThan(css.indexOf('.split > *'));
    expect(css.indexOf('.split > *')).toBeLessThan(css.indexOf('.split--aside-start'));        // R9 reset sits with its base, like .stack > *
    expect(css.indexOf('.split--aside-start')).toBeLessThan(css.indexOf('@media (max-width: 1024px)'));
  });
```

- [ ] **Step 6: Run the two suites**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens build && pnpm --filter @gitzhacode/zha-ui-css build && pnpm --filter @gitzhacode/zha-ui-tokens test && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: tokens 44 tests pass (`build-output.test.ts` 9); css 78 tests pass (`exports.test.ts` 74, one more than before). Any failure here means an assertion above does not match the current CSS: stop and report the failing line, do not change CSS in this task.

- [ ] **Step 7: Commit**

```bash
git add packages/tokens/test/build-output.test.ts packages/css/test/exports.test.ts
git commit -m "test(tokens,css): end-anchor token values; pin PARTIALS at the source, the R4 drawer fallback, 768 paddings, the split chain and app-shell order

Refs the 2026-10-01 review's deferred minors (Task 1, Task 2, Task 3 test items)"
```

---

### Task 2: Layout and navigation CSS: hero floor, page-header rule home, nav toggle

**Files:**
- Modify: `packages/css/src/primitives/layout.css:22` (after `.app-bar__spacer`), `:48-52` (the `.hero` comment and rule), `:61-69` (the 768 block)
- Modify: `packages/css/src/primitives/nav.css:37-39` (after `.page-header__actions`)
- Test: `packages/css/test/exports.test.ts` - the tests titled `'hero keeps gradient classes paintable, ZHA Sans at display size only, brand-scoped eyebrow'` and `'collapses the app shell at phone width behind data-nav-open'`, plus one new test

**Model:** implementer=sonnet, reviewer=opus - three files; `.app-bar__nav-toggle` is a new consumer-facing class and the hero floor is a cascade contract

**Interfaces:**
- Consumes the test names from Task 1.
- Produces `.app-bar__nav-toggle` (hidden by default, `display: inline-flex` at 768 px and below), which Task 5 puts on the React starter's button and Task 6 documents. Produces `:where(.hero) { background-color }`, which Task 6 records in the spec amendments.

- [ ] **Step 1: Write the failing tests**

In `packages/css/test/exports.test.ts`, inside `it('hero keeps gradient classes paintable, …')`, replace the three lines

```ts
    const hero = css.match(/\.hero\s*\{[^}]*\}/s)?.[0] ?? '';
    expect(hero).toMatch(/background-color:\s*var\(--bg-surface-1\)/);
    expect(hero).not.toMatch(/background:/);
```

with

```ts
    // the floor is zero-specificity: an aurora class's own ink floor (.accent-grad-aurora, .grad-pair-borealis …, all (0,1,0)) must win over the panel colour
    expect(css).toMatch(/:where\(\.hero\)\s*\{\s*background-color:\s*var\(--bg-surface-1\);\s*\}/);
    const hero = css.match(/\.hero\s*\{[^}]*\}/s)?.[0] ?? '';   // the (0,1,0) rule: no background of any kind
    expect(hero).not.toMatch(/background/);
```

Inside `it('collapses the app shell at phone width behind data-nav-open', …)`, replace the line `expect(phone).toMatch(/\.page-header\s*\{\s*flex-wrap:\s*wrap/);` with:

```ts
    // the phone wrap lives in nav.css beside its base rule: equal specificity, so a flex-wrap added to the base can never silently defeat it
    expect(css).toMatch(/@media \(max-width: 768px\)\s*\{\s*\.page-header\s*\{\s*flex-wrap:\s*wrap/);
    expect(css.indexOf('.page-header { display: flex')).toBeLessThan(css.indexOf('.page-header { flex-wrap: wrap'));
    expect(phone).not.toMatch(/\.page-header/);
    expect(phone).toMatch(/\.app-bar__nav-toggle\s*\{\s*display:\s*inline-flex/);
```

Directly after that test's closing `});` add:

```ts
  // Review Focus 5: the phone drawer's button ships as a class, visible only where the drawer exists.
  it('nav toggle is hidden while the sidebar is in the grid', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.app-bar__nav-toggle\s*\{\s*display:\s*none/);
    expect(css.indexOf('.icon-btn {')).toBeLessThan(css.indexOf('.app-bar__nav-toggle {'));   // equal specificity: the hide must follow .icon-btn's inline-flex (base before layout)
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @gitzhacode/zha-ui-css test`
Expected: the hero test fails (`:where(.hero)` not found), the collapse test fails (`.page-header` still inside the layout block, no `.app-bar__nav-toggle`), the new nav-toggle test fails; the other 75 pass.

- [ ] **Step 3: Move the hero floor to zero specificity**

In `packages/css/src/primitives/layout.css`, replace lines 48-52 (from `/* .hero - where the deck's language` to the end of the `.hero {` rule) with:

```css
/* .hero - where the deck's language enters app and landing pages: ZHA Sans at real display size, one gradient, black field.
   The panel colour is a zero-specificity background-COLOR: the gradient classes (.grad-hero-*, .accent-grad-*) set
   background-image earlier in the cascade, and the aurora forms (.accent-grad-aurora, .grad-pair-borealis and friends)
   also set their own ink floor, which must win over the panel colour; the shorthand would reset the image to none on
   <section class="hero grad-hero-dusk">. */
:where(.hero) { background-color: var(--bg-surface-1); }
.hero { display: flex; flex-direction: column; gap: var(--space-5); padding: var(--space-16) var(--space-8);
  border-radius: var(--radius-l); color: var(--text-default); }
```

- [ ] **Step 4: Add the nav toggle class**

In the same file, directly after line 22 (`.app-bar__spacer { flex: 1; }`) add:

```css
.app-bar__nav-toggle { display: none; } /* the phone drawer's button: hidden while the sidebar sits in the grid; after .icon-btn in the cascade (base before layout), so this wins the (0,1,0) tie */
```

- [ ] **Step 5: Rework the 768 block**

In the same file, inside `@media (max-width: 768px) {`, delete the line `  .page-header { flex-wrap: wrap; }` and, directly after `  .app-shell > .sidebar { display: none; }`, add:

```css
  .app-bar__nav-toggle { display: inline-flex; } /* the same box as .icon-btn; consumer JS toggles data-nav-open on the shell */
```

- [ ] **Step 6: Give the page-header its phone rule in nav.css**

In `packages/css/src/primitives/nav.css`, directly after line 39 (`.page-header__actions { display: flex; gap: var(--space-2); }`) add:

```css
@media (max-width: 768px) { .page-header { flex-wrap: wrap; } } /* phone: title and actions stack. Beside its base rule on purpose: equal specificity, so a flex-wrap added to the base can never silently win (layout.css comes before nav.css in PARTIALS) */
```

- [ ] **Step 7: Build and run the tests**

Run: `pnpm --filter @gitzhacode/zha-ui-css build && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: 79 tests pass (`exports.test.ts` 75). Then `pnpm build` from the root: every workspace passes, including the three guard checks (`hub`, `vanilla`, `foundation`) and the React Vite build.

- [ ] **Step 8: Commit**

```bash
git add packages/css/src/primitives/layout.css packages/css/src/primitives/nav.css packages/css/test/exports.test.ts
git commit -m "feat(css): zero-specificity hero floor so aurora ink wins; .page-header phone rule beside its base in nav.css; .app-bar__nav-toggle for the phone drawer

Refs the 2026-10-01 review's deferred minors (hero floor, page-header order, React hamburger)"
```

---

### Task 3: States and type: disabled-hover guard, chevron exemption, prose first heading, alert icon, print toast, stale comment

**Files:**
- Modify: `packages/css/src/primitives/base.css:45,47,49,51` (the four `.btn--*:hover` rules), `:52` (the shared-states comment), `:68` (`.input:hover, .select:hover`), `:74` (the chip hover), `:104` (`.icon-btn:hover`), `:146` (the print block, after the `.app-bar` line)
- Modify: `packages/css/src/primitives/nav.css:31` (`.tabs__tab:hover`)
- Modify: `packages/css/src/primitives/content.css:42` (the chevron rule), `:66` (the segmented focus comment)
- Modify: `packages/css/src/primitives/feedback.css:4` (`.alert__icon`)
- Modify: `packages/css/src/primitives/type.css:33` (`.prose > :where(h2, h3)`)
- Test: `packages/css/test/exports.test.ts` - the tests titled `'controls have hover, pressed and one disabled value'`, `'tables: wrap mode after the nowrap rule, selected row, sort chevron'`, `'ships .prose and the one text utility'`, `'feedback: alert title is a block; toast and spinner ship; spinner keeps turning under reduced motion'`, `'base has one print block covering chips and the app bar; dialog title and app name tidy'`

**Model:** implementer=sonnet, reviewer=opus - five partials with exact diffs; the hover guard touches every control's cascade

**Interfaces:**
- Produces `.alert__icon` at 16 px (Task 5 resizes the examples' alert SVGs to match; Task 6 documents it), the guarded hovers and the exempted chevron (Task 6 records them in the spec amendments).

- [ ] **Step 1: Write the failing tests**

In `packages/css/test/exports.test.ts`, inside `it('controls have hover, pressed and one disabled value', …)`, replace the four lines

```ts
    expect(css).toMatch(/\.btn--primary:hover\s*\{\s*background:\s*color-mix\(in srgb, var\(--accent-fill\) 88%, var\(--text-strong\)\)/);
    expect(css).toMatch(/\.btn--danger:hover\s*\{\s*background:\s*color-mix\(in srgb, var\(--intent-error\) 88%, var\(--text-strong\)\)/);
```

and

```ts
    expect(css).toMatch(/\.input:hover, \.select:hover\s*\{\s*border-color:\s*var\(--border-strong\)/);
    expect(css).toMatch(/button\.chip:not\(\[aria-pressed="true"\]\):not\(\.is-active\):hover\s*\{\s*border-color:\s*var\(--border-default\)/);
```

with

```ts
    expect(css).toMatch(/\.btn--primary:where\(:not\(:disabled\)\):hover\s*\{\s*background:\s*color-mix\(in srgb, var\(--accent-fill\) 88%, var\(--text-strong\)\)/);
    expect(css).toMatch(/\.btn--danger:where\(:not\(:disabled\)\):hover\s*\{\s*background:\s*color-mix\(in srgb, var\(--intent-error\) 88%, var\(--text-strong\)\)/);
```

and

```ts
    expect(css).toMatch(/\.input:where\(:not\(:disabled\)\):hover, \.select:where\(:not\(:disabled\)\):hover\s*\{\s*border-color:\s*var\(--border-strong\)/);
    expect(css).toMatch(/button\.chip:not\(\[aria-pressed="true"\]\):not\(\.is-active\):where\(:not\(:disabled\)\):hover\s*\{\s*border-color:\s*var\(--border-default\)/);
    // Review Focus 1: every control hover carries the guard, and the guard is :where()-wrapped so no hover outranks the aria-pressed arm
    for (const sel of ['.btn--secondary', '.btn--ghost', '.icon-btn', '.tabs__tab'])
      expect(css, `${sel} hover is guarded`).toMatch(new RegExp(sel.replace('.', '\\.') + ':where\\(:not\\(:disabled\\)\\):hover\\s*\\{'));
    expect(css).not.toMatch(/\.(?:btn--[\w-]+|icon-btn|input|select|tabs__tab):hover/);   // no unguarded control hover remains
    expect(css).not.toMatch(/:not\(:disabled\):hover/);                                   // never the bare form: it would add specificity
```

Inside `it('tables: wrap mode after the nowrap rule, selected row, sort chevron', …)`, replace the line

```ts
    expect(css).toMatch(/\.data-table th\[aria-sort\] button::after\s*\{[^}]*border-inline-end:\s*2px solid currentColor/s);
```

with

```ts
    // Review Focus 2: the chevron skips the primitives the reset rule exempts, through :where() so the ascending/none rules (0,2,3) still override it
    expect(css).toMatch(/\.data-table th\[aria-sort\] button:where\(:not\(\.icon-btn\):not\(\[class\*="btn--"\]\)\)::after\s*\{[^}]*border-inline-end:\s*2px solid currentColor/s);
    expect(css).not.toMatch(/th\[aria-sort\] button::after/);
```

Inside `it('ships .prose and the one text utility', …)`, directly after the `.prose > \* \+ \*` assertion add:

```ts
    expect(css).toMatch(/\.prose > \* \+ :where\(h2, h3\)\s*\{\s*margin-block-start:\s*var\(--space-8\)/);  // Review Focus 6: a heading that opens the block gets no top gap
    expect(css).not.toMatch(/\.prose > :where\(h2, h3\)/);
```

Inside `it('feedback: alert title is a block; …')`, directly after the `.alert__title` assertion add:

```ts
    expect(css).toMatch(/\.alert__icon\s*\{\s*flex:\s*none;\s*inline-size:\s*16px;\s*block-size:\s*16px/);   // the inline step of icons-stroke-only (16/20/24)
```

Inside `it('base has one print block covering chips and the app bar; …')`, directly after `expect(print).toMatch(/\.app-bar\s*\{\s*background:\s*#fff !important/);` add:

```ts
    expect(print).toMatch(/\.toast\s*\{\s*display:\s*none/);   // a fixed toast would otherwise print on every page
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @gitzhacode/zha-ui-css test`
Expected: the five edited tests fail; the other 74 pass.

- [ ] **Step 3: Guard the hovers**

In `packages/css/src/primitives/base.css` make these exact selector edits (declarations and trailing comments unchanged):

- line 45: `.btn--primary:hover {` becomes `.btn--primary:where(:not(:disabled)):hover {`
- line 47: `.btn--secondary:hover {` becomes `.btn--secondary:where(:not(:disabled)):hover {`
- line 49: `.btn--ghost:hover {` becomes `.btn--ghost:where(:not(:disabled)):hover {`
- line 51: `.btn--danger:hover  {` becomes `.btn--danger:where(:not(:disabled)):hover {`
- line 68: `.input:hover, .select:hover {` becomes `.input:where(:not(:disabled)):hover, .select:where(:not(:disabled)):hover {`
- line 74: `button.chip:not([aria-pressed="true"]):not(.is-active):hover {` becomes `button.chip:not([aria-pressed="true"]):not(.is-active):where(:not(:disabled)):hover {`
- line 104: `.icon-btn:hover {` becomes `.icon-btn:where(:not(:disabled)):hover {`

Replace the comment on line 52 with:

```css
/* shared press + disabled states - one value across the package (Spec 3 §5.5). Every control hover above carries
   :where(:not(:disabled)): a disabled control never answers the pointer, and :where() adds no specificity, so the
   .btn:where([aria-pressed="true"]):hover arm below still wins its (0,2,0) tie against the ghost hover. */
```

In `packages/css/src/primitives/nav.css` line 31: `.tabs__tab:hover {` becomes `.tabs__tab:where(:not(:disabled)):hover {`.

- [ ] **Step 4: Exempt the primitives from the chevron and fix the stale comment**

In `packages/css/src/primitives/content.css` line 42, replace `.data-table th[aria-sort] button::after {` with:

```css
.data-table th[aria-sort] button:where(:not(.icon-btn):not([class*="btn--"]))::after {
```

(the rest of that rule and the two rules after it stay as they are; the ascending and none/other rules keep their plain `button::after` form, which at (0,2,3) still overrides this (0,2,3) rule by source order). Replace the comment on line 41 with:

```css
/* sort direction - same chevron construction as .accordion summary::after. The :where() carries the reset rule's
   exemption at zero cost: a column-menu .icon-btn in a sorted header gets no chevron */
```

On line 66, in the `.segmented label:has(:focus-visible)` comment, replace `(line 39)` with `(the .segmented input rule above)`.

- [ ] **Step 5: Alert icon, print toast, prose heading**

In `packages/css/src/primitives/feedback.css` line 4 replace the rule with:

```css
.alert__icon { flex: none; inline-size: 16px; block-size: 16px; } /* 16: the inline step of icons-stroke-only (16/20/24), level with the --fs-body line box */
```

In `packages/css/src/primitives/base.css`, inside the `@media print {` block, directly after the `.app-bar { background: #fff !important; … }` line add:

```css
  .toast { display: none; } /* transient: a fixed toast would otherwise print on every page */
```

In `packages/css/src/primitives/type.css` line 33 replace the rule with:

```css
.prose > * + :where(h2, h3) { margin-block-start: var(--space-8); } /* a heading that opens the block gets no dead space above it */
```

- [ ] **Step 6: Build and run the tests**

Run: `pnpm --filter @gitzhacode/zha-ui-css build && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: 79 tests pass. Then `pnpm build && pnpm lint` from the root: all green.

- [ ] **Step 7: Commit**

```bash
git add packages/css/src/primitives/base.css packages/css/src/primitives/nav.css packages/css/src/primitives/content.css packages/css/src/primitives/feedback.css packages/css/src/primitives/type.css packages/css/test/exports.test.ts
git commit -m "fix(css): hovers skip disabled controls; sort chevron skips .icon-btn and .btn--*; .prose first heading has no top gap; .alert__icon 16px; toasts never print; stale comment

Refs the 2026-10-01 review's deferred minors (Task 4 items, prose, alert slot, print toast)"
```

---

### Task 4: Drift guard: script-only prefix skip and a bounded `style=` match

**Files:**
- Modify: `examples/_drift-guard.mjs:43` (after `KNOBS`), `:93-98` (the `vars` loop), `:113` and `:121` (the two `style=` matches)
- Test: `examples/drift-guard.test.mjs` (append four tests)

**Model:** implementer=haiku, reviewer=opus - full code in the plan, two files; the guard gates every example build, so a false positive blocks CI

**Interfaces:**
- Consumes `lint(html, bundle, { checkClasses, inlineKnobsOnly })` as it is; the signature and return shape (`{ missing, colors, structural, inline }`) do not change.
- Produces the same contract with two tightened behaviours (Review Focus 3 and 4).

- [ ] **Step 1: Write the failing tests**

Append to `examples/drift-guard.test.mjs`:

```js
// Ruling R12, scoped: the JS-built prefix skip applies inside <script> only; the same trailing hyphen in CSS is a typo.
test('a trailing-hyphen var() in a <style> block is reported', () => {
  const r = lint(style('.a{color:var(--text-);}'), BUNDLE);
  assert.deepEqual(r.missing, ['--text-']);
});
test('a trailing-hyphen var() in a style attribute is reported', () => {
  const r = lint('<div style="color: var(--x-)"></div>', BUNDLE);
  assert.deepEqual(r.missing, ['--x-']);
});
// The attribute match has a boundary: data-style is not an inline style, and spaces around = do not hide one.
test('inlineKnobsOnly: data-style is not an inline style', () => {
  const r = lint('<div data-style="padding: 4px"></div>', BUNDLE, { inlineKnobsOnly: true });
  assert.deepEqual(r.inline, []);
});
test('inlineKnobsOnly: spaces around = still count', () => {
  const r = lint('<div style = "padding: 4px"></div>', BUNDLE, { inlineKnobsOnly: true });
  assert.deepEqual(r.inline, ['padding: 4px']);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test examples/drift-guard.test.mjs`
Expected: 18 tests, 4 fail (the two trailing-hyphen cases report `[]`, `data-style` reports `['padding: 4px']`, `style = ` reports `[]`); 14 pass.

- [ ] **Step 3: Implement**

In `examples/_drift-guard.mjs`, directly after the `KNOBS` line (line 43) add:

```js
// An inline style attribute. The lookbehind keeps data-style="…" out; the \s* lets `style = "…"` in.
const INLINE_STYLE = /(?<![\w-])style\s*=\s*["']([^"']*)["']/gi;
```

Replace the `vars` block (lines 93-97, from `const vars = new Set();` to the closing `}` of its `for`) with:

```js
  // Ruling R12, scoped: a token name assembled in JS ('var(--typology-' + hue + '-100)') is a prefix, not a reference,
  // but only inside <script>; the same trailing hyphen in a <style> block or a style attribute is a typo and stays reported.
  const scripts = [...html.matchAll(/<script[^>]*>[\s\S]*?<\/script>/gi)].map((m) => [m.index, m.index + m[0].length]);
  const inScript = (i) => scripts.some(([s, e]) => i >= s && i < e);
  const vars = new Set();
  for (const m of html.matchAll(/var\((--[\w-]+)/g)) {
    if (m[1].endsWith('-') && inScript(m.index)) continue;
    vars.add(m[1]);
  }
```

Replace both occurrences of `html.matchAll(/style=["']([^"']*)["']/gi)` (the colour-scan collector at line 113 and the `inlineKnobsOnly` loop at line 121) with `html.matchAll(INLINE_STYLE)` (`matchAll` clones a global regex, so the shared constant is safe to reuse).

- [ ] **Step 4: Run the tests and the three real pages**

Run: `node --test examples/drift-guard.test.mjs && pnpm build`
Expected: 18 tests pass; the build's `hub`, `vanilla` and `foundation` guard lines all end in `✓` (the foundation page's JS-built prefix is inside `<script>`, so it is still skipped).

- [ ] **Step 5: Commit**

```bash
git add examples/_drift-guard.mjs examples/drift-guard.test.mjs
git commit -m "fix(examples): drift guard limits the R12 prefix skip to <script> and bounds the style= attribute match

Refs the 2026-10-01 review's deferred minors (Task 6 items)"
```

---

### Task 5: Examples: alert icons at 16 px, split caption, React nav toggle and toast

**Files:**
- Modify: `examples/zha-app-vanilla/index.html:176,180,184,188` (the four alert SVGs)
- Modify: `examples/foundation-reference/index.html:831` (the alert lead), `:836,849,863,876` (the four alert SVGs), `:1076` (the item 5 caption)
- Modify: `examples/zha-app-react/src/App.jsx:34-35` (the AppBar comment), `:43` (the toggle button), `:251-261` (`Toast`), `:336` (the shell comment), `:377` (the `<Toast>` render)

**Model:** implementer=sonnet, reviewer=sonnet - four files, line edits across HTML and JSX; gated by the guards and the Vite build

**Interfaces:**
- Consumes `.app-bar__nav-toggle` from Task 2 and the 16 px `.alert__icon` from Task 3.
- Produces the React starter as the worked example AGENTS.md and DESIGN.md (Task 6) describe: the toggle hidden above 768 px, the toast mounted only while shown.

- [ ] **Step 1: Vanilla alert icons**

In `examples/zha-app-vanilla/index.html`, in each of the four `<span class="alert__icon" …><svg width="18" height="18" viewBox="0 0 24 24" …>` lines (176, 180, 184, 188) change `width="18" height="18"` to `width="16" height="16"`. Nothing else on those lines changes; no other SVG on the page changes.

- [ ] **Step 2: Foundation reference**

In `examples/foundation-reference/index.html`:

- line 831: replace `__icon is 18×18 and inherits the intent colour.` with `__icon is 16×16 (the inline icon step) and inherits the intent colour.`
- lines 836, 849, 863, 876: in each `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" role="img" …>` inside a `.alert__icon`, change `width="18" height="18"` to `width="16" height="16"` (the `viewBox` stays `0 0 18 18`). The app-bar and user-menu SVGs elsewhere on the page are not alert icons and stay at 18.
- line 1076: replace the caption with
  `<p class="fr-lead">5. .split puts a canvas beside a fixed aside; .split--aside-start swaps the column widths, so put the aside first in the markup.</p>`

- [ ] **Step 3: React starter**

In `examples/zha-app-react/src/App.jsx`:

Replace the comment at lines 34-35 (`// The canonical bar: …`) with:

```jsx
// The canonical bar: lockup as the home link, the app name in the primary face, then actions. The nav
// toggle carries .app-bar__nav-toggle, so the bundle shows it only where the drawer exists (768 px and below).
```

On line 43 replace `className="icon-btn icon-btn--ghost"` on the `Toggle navigation` button with `className="icon-btn icon-btn--ghost app-bar__nav-toggle"` (the other two icon buttons keep `icon-btn icon-btn--ghost`).

Replace the `Toast` component and its comment (lines 251-261) with:

```jsx
// The toast repeats the action's verb ("Model saved"). It mounts and unmounts with the state, which is the
// bundle's contract (consumer JS inserts and removes it): a live region that appears together with its
// content is announced; one that is merely un-hidden often is not.
function Toast() {
  return (
    <div className="toast">
      <div className="alert alert--success" role="status">
        <span className="alert__icon"><Icon name="check" /></span>
        <div><span className="alert__title">Model saved</span>Bee'ah Headquarters is queued to run.</div>
      </div>
    </div>
  );
}
```

Replace the comment on line 336 with:

```jsx
      {/* data-nav-open is the shell's contract; it only paints at 768 px and below, where the bar's .app-bar__nav-toggle is visible. */}
```

On line 377 replace `<Toast visible={toast} />` with `{toast && <Toast />}`.

- [ ] **Step 4: Gates**

Run: `pnpm build && pnpm lint`
Expected: `vanilla` and `foundation` guard lines end in `✓`, `zha-app-react` builds, lint clean. Then, with the dev server up (`pnpm --filter zha-app-react exec vite --port 7171 --strictPort --host 127.0.0.1`, in the background, on this checkout's registered dev port), open `http://127.0.0.1:7171/` and confirm in the DOM: `document.querySelector('.app-bar__nav-toggle')` exists; `document.querySelector('.toast')` is `null` until "Save model" is pressed and `null` again three seconds later. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add examples/zha-app-vanilla/index.html examples/foundation-reference/index.html examples/zha-app-react/src/App.jsx
git commit -m "fix(examples): alert icons at 16px; split caption says aside-first markup; React nav toggle carries .app-bar__nav-toggle; toast mounts and unmounts

Refs the 2026-10-01 review's deferred minors (alert slot, Task 10 caption, React hamburger and toast)"
```

---

### Task 6: Guidance, spec amendments, consumer notes, changeset, PLAN

**Files:**
- Modify: `AGENTS.md:49` (the `data-surface` row), `:79` (the actions comment), `:169` (`heading-ladder`), `:229-231` (the density bullet)
- Modify: `DESIGN.md:32` (the `brand` bullet), `:248` (the 768 bullet), `:282` (the exits rule), `:382` (the Spec 3 inventory line), `:391` (the `--fs-hero` note)
- Modify: `AI-USAGE.md:7` (the switches line), `:30` (the Spec 3 class line), `:56` (the gradient line), after `:135` (new `.app-bar__nav-toggle` row), `:199` (`.alert__icon` row)
- Modify: `docs/specs/2026-09-30-zha-ui-composition-layer-design.md` (append section 12 after line 478)
- Modify: `docs/tickets/2026-10-01-consumer-notes-0.1.3.md:6-7,17-26,39-40`
- Modify: `.changeset/composition-layer.md` (one bullet before the `Repo-internal` bullet)
- Modify: `PLAN.md` (one bullet at the top of `## Done`)

**Model:** implementer=sonnet, reviewer=sonnet - exact replacement lines; the report register and AGENTS.md's 260-line budget bind

**Interfaces:**
- Consumes every change of Tasks 2-5 (read `git log --oneline 6a3489b..HEAD` and the diffs if a line below needs checking).
- Produces the documentation the whole-branch review (Task 7) checks for agreement with the CSS.

- [ ] **Step 1: AGENTS.md (in place, four edits, line count stays 258)**

Line 49, replace the `data-surface` table row with:

```markdown
| `data-surface` | `work` · `brand` | `work` = light default for dashboards/forms; `brand` = black-first marketing surface. Beside `data-theme="light"` on the same element light wins (the tokens emit light last): a brand page sets `data-theme="dark" data-surface="brand"`, or puts `brand` on the island (the `.hero`) only |
```

Line 79, replace the actions comment with:

```html
  <!-- actions: .btn--primary, .btn--ghost, .icon-btn--ghost; the phone nav toggle is an .icon-btn--ghost with .app-bar__nav-toggle (shown at 768 px and below only) -->
```

Line 169, replace the `heading-ladder` rule with:

```markdown
- `heading-ladder`: one `h1` per page (24 px, `--font-primary`), `h2` sections (20), `h3` cards (16), `h4` (14). ZHA Sans only in `.hero > h1`, the lockup, the logo and the decks. Never `.accent-grad-text` on a work surface.
```

Lines 229-231, replace the density bullet (three lines, keep it three lines) with:

```markdown
- Density floor is 36px (`data-density="compact"`); below that, scope `--control-h` per zone - that is the
  sanctioned knob; don't invent smaller buttons. `.toolbar` already sets `--control-h: 36px` for everything inside
  it; elsewhere set the knob inline (`style="--control-h: 36px"`) on the zone or the single control that needs it, so a 44px `.icon-btn` never sits beside a compact toolbar.
```

- [ ] **Step 2: DESIGN.md (five edits)**

Apply these from the bottom of the file upwards (391, then 382, 282, 248, 32), so the line numbers stay valid while you work; do the same in Step 3 (199, then the new row after 135, 56, 30, 7).

Line 32, replace `  and should feel the ZHA identity. Don't build dense working UI on it.` with:

```markdown
  and should feel the ZHA identity. Don't build dense working UI on it. On one element `data-theme="light"`
  beats `brand` (the tokens emit light last), so pair `brand` with `data-theme="dark"`, or put it on the
  hero island alone.
```

Line 248, after the sentence `Consumer JS toggles the attribute, as it toggles `data-rail`.` and before `At the`, insert:

```markdown
  The toggle button carries `.app-bar__nav-toggle`, which the bundle hides while the sidebar is in the
  grid and shows at 768 px and below, so the button is only visible where the drawer exists.
```

(re-wrap the bullet's lines as needed; the sentence order is: drawer, consumer JS, nav toggle, padding and page-header and hero.)

Line 282, replace `- Exits are shorter than enters.` with:

```markdown
- Exits are shorter than enters in consumer sequences; the bundle's own `.dialog` and `.menu` cross-fade
  symmetrically, each on one token.
```

Line 382, replace `` `.text-muted` `.card--flush`, and the feedback pair `.toast` `.spinner`. `` with:

```markdown
`.text-muted` `.card--flush` `.app-bar__nav-toggle`, and the feedback pair `.toast` `.spinner`.
```

Line 391, replace `> exists for `.hero > h1` only, and `--fs-hero` (32px) for large display numerals.` with:

```markdown
> exists for `.hero > h1` only, and `--fs-hero` (32px) is the display step between them, for a display line or
> number outside the heading ladder.
```

- [ ] **Step 3: AI-USAGE.md (five edits)**

Line 7, replace with:

```markdown
> - On `<html>` set `data-brand="es"` `data-theme="light|dark"` `data-surface="brand|work"` (`brand` goes with `data-theme="dark"`, or on a nested island; beside `data-theme="light"` on the same element, light wins).
```

Line 30, append ` .app-bar__nav-toggle` to the end of the Spec 3 class line, after `.spinner`.

Line 56, replace `` `--grad-wash --grad-glow` (subtle accent washes) `` with `` `--grad-wash --grad-glow` (subtle accent washes; on a work surface use only these two and `.accent-grad-subtle`, nothing else from this library) ``.

After line 135 (the `.app-bar__spacer` row) insert:

```markdown
| `.app-bar__nav-toggle` | The phone drawer's button: an `.icon-btn.icon-btn--ghost` with `aria-controls` on the sidebar, hidden while the sidebar is in the grid and shown at 768px and below; its click toggles `data-nav-open` on `.app-shell` |
```

Line 199, replace with:

```markdown
| `.alert__icon` | 16×16 icon slot inside `.alert` (the inline icon step); inherits intent colour |
```

- [ ] **Step 4: Spec amendments**

Append to the end of `docs/specs/2026-09-30-zha-ui-composition-layer-design.md` (after line 478):

```markdown

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
```

- [ ] **Step 5: Consumer notes**

In `docs/tickets/2026-10-01-consumer-notes-0.1.3.md`:

Lines 6-7, replace `changes five defaults` with `changes nine defaults`.

After the `.app-bar__app` bullet (line 26) add four bullets:

```markdown
- `[hidden]` now always hides (`display: none !important`), so a `display` rule can no longer reveal a
  hidden element; toggle the attribute instead.
- Disabled menu rows (`.menu__item`) sit at opacity .45, the package's one disabled value (they were .4).
- `.alert__icon` is a 16px slot; an 18px SVG inside it now overflows by 2px, so draw alert icons at 16.
- Hover no longer changes a disabled control, and the sort chevron no longer lands on an `.icon-btn` in a
  sorted header.
```

Lines 39-40, replace the phone-sidebar bullet with:

```markdown
- For the phone sidebar, toggle `data-nav-open` on `.app-shell` from a button that carries
  `.app-bar__nav-toggle`, so the button appears only at 768px and below, where the sidebar is off-canvas.
```

- [ ] **Step 6: Changeset and PLAN.md**

In `.changeset/composition-layer.md`, directly before the `- **Repo-internal:**` bullet add:

```markdown
- **Fix-later pass (2026-10-02):** `.app-bar__nav-toggle` (the phone drawer's button, visible at 768px and below only); hovers skip disabled controls; the sort chevron skips `.icon-btn` and `.btn--*` in a sorted header; `.hero`'s panel colour is zero-specificity so an aurora class's ink floor wins; a `.prose` heading that opens the block carries no top gap; `.alert__icon` is 16px (was 18); `.toast` never prints.
```

In `PLAN.md`, add at the top of `## Done` (above the 2026-10-01 bullet):

```markdown
- 2026-10-02 Composition layer fix-later pass: the 19 minors the 2026-10-01 whole-branch review deferred (test anchors and order pins, zero-specificity hero floor, .app-bar__nav-toggle, disabled-hover guard, chevron exemption, prose first heading, 16px alert icon, print toast, guard boundary + script-only prefix skip, guidance lines, spec amendments, notes) on feat/composition-layer (plan: docs/plans/2026-10-02-composition-layer-fix-later.md)
```

- [ ] **Step 7: Register self-check and gates**

Run: `wc -l AGENTS.md` - expected `258`. Run `git diff -U0 -- AGENTS.md DESIGN.md AI-USAGE.md docs .changeset PLAN.md | grep '^+' | grep -n '[—–]'` - expected no output (no em or en dash on any added line). Read every added sentence once against the register: full sentences, no exclamation marks, the firm is ZHA. Then `pnpm build && pnpm test && pnpm lint` - all green.

- [ ] **Step 8: Commit**

```bash
git add AGENTS.md DESIGN.md AI-USAGE.md docs/specs/2026-09-30-zha-ui-composition-layer-design.md docs/tickets/2026-10-01-consumer-notes-0.1.3.md .changeset/composition-layer.md PLAN.md
git commit -m "docs: surface and theme precedence, nav toggle, decks in the ladder, density knob, --fs-hero role, work-surface washes, exits rule, alert slot; spec amendments; notes, changeset, PLAN

Refs the 2026-10-01 review's deferred minors (Task 7, 12 and 13 docs items)"
```

---

### Task 7: Render-verify, final gates, whole-branch review

**Files:**
- No tracked file changes expected. Captures go to `.playwright-mcp/verify-fix-later/` (gitignored).

**Model:** implementer=fable, reviewer=fable - browser tools and visual judgement; the whole-branch review

**Interfaces:**
- Consumes everything. Produces the evidence that the two visible changes (alert icon, nav toggle) and the invisible cascade changes render as intended.

- [ ] **Step 1: Build and serve**

Run `pnpm build`, then serve the repo root on the registered preview port in the background: `node -e "require('http').createServer((q,s)=>{const f=require('path').join(process.cwd(),decodeURIComponent(q.url.split('?')[0]).replace(/\/$/,'/index.html'));require('fs').readFile(f,(e,d)=>{if(e){s.writeHead(404);s.end();return;}s.writeHead(200,{'content-type':{'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf'}[require('path').extname(f)]||'application/octet-stream'});s.end(d);});}).listen(7172,'127.0.0.1')"`, and the React starter in the background: `pnpm --filter zha-app-react exec vite --port 7171 --strictPort --host 127.0.0.1`. If 7171 is already held by a stray vite from an earlier session, reuse it after confirming it serves this checkout's `examples/zha-app-react` (the page title and the `.app-bar__nav-toggle` element must be present); otherwise stop and report.

- [ ] **Step 2: Capture**

Use the Playwright MCP browser tools (`browser_resize`, `browser_navigate`, `browser_evaluate`, `browser_take_screenshot`). If the MCP browser is held by another session, create `playwright-run/` in the session scratchpad (outside the repo), run `npm i playwright-core` there and launch with `chromium.launch({ channel: 'msedge' })` (Edge is installed; no browser download, nothing added to any workspace package). If neither route works, write "not captured" against each row in the report and stop after Step 4; the maintainer verifies by hand.

| Capture | URL | Width | Check |
|---|---|---|---|
| `react-1440-light` | `http://127.0.0.1:7171/` | 1440 | no hamburger beside the search button; `getComputedStyle(document.querySelector('.app-bar__nav-toggle')).display === 'none'` |
| `react-390-nav-open` | same, click the toggle | 390 | hamburger visible (`display === 'inline-flex'`), drawer 240 px wide, no horizontal scroll (`scrollWidth <= clientWidth`) |
| `react-1440-toast` | same, New model, Save model | 1440 | `.toast` present with a 16 px check icon level with the title; after 3.5 s `document.querySelector('.toast') === null` |
| `vanilla-1440-alerts` | `http://127.0.0.1:7172/examples/zha-app-vanilla/index.html` | 1440 | the four alert icons are 16 px and sit level with their titles, none overflows its slot |
| `vanilla-1440-disabled-hover` | same | 1440 | hover a disabled control (add `disabled` to the "Run model" `.btn--primary` via `browser_evaluate`), screenshot: its background does not change under the pointer |
| `foundation-s26-1440-light` | `http://127.0.0.1:7172/examples/foundation-reference/index.html` (scroll to section 26) | 1440 | item 9's hero still paints the ocean mesh; the section's table header is sticky; the alert icons are 16 px |
| `foundation-s26-1440-dark` | same with `data-theme="dark"` | 1440 | the same, on dark |

- [ ] **Step 3: Compare with 2026-10-01**

Against the captures in `.playwright-mcp/verify/`: the only differences are the ones this plan names (alert icons smaller, the React hamburger gone at 1440). Any other difference is a defect in Tasks 2-5: fix it in that task's files, add a regex test in `exports.test.ts` where the CSS is at fault, and recapture.

- [ ] **Step 4: Final gates**

Run: `pnpm build && pnpm test && pnpm lint && node --test examples/drift-guard.test.mjs`
Expected: all green; css `exports.test.ts` 75, tokens `build-output.test.ts` 9, drift guard 18.

- [ ] **Step 5: Whole-branch review**

Run the whole-branch review (superpowers:requesting-code-review on `6a3489b..HEAD`) with the spec's section 12 and this plan as the brief. Fix anything Critical or Important in one commit, re-run Step 4, and recapture the affected rows.

Stop here. Do not push. Report the branch name, the commit list since `6a3489b` and the capture folder to the maintainer, who opens the PR; the changesets bot then opens the release PR for 0.1.3.
