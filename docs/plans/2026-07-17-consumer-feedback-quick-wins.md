# Consumer Feedback Quick Wins Implementation Plan

> **STATUS: EXECUTED 2026-07-17, then corrected by code review - do NOT re-run destructively.**
> The shipped working tree (packages/css/src, examples, docs) is the source of truth; where any
> step below conflicts with it, the tree wins. The code review corrected the plan after execution:
> (1) **color-scheme order** - the shipped rule emits `:root` light → `[data-theme="dark"],[data-surface="brand"]` dark → `[data-theme="light"]` light **LAST**, mirroring the token cascade so light+brand keeps light chrome; Task 1 below shows an earlier, inverted draft - ignore it. (2) **starters** - both `examples/zha-app-*` headers WERE rewritten to the canonical bar (the self-review's "out of scope" note is wrong). (3) A follow-up code review hardened many of these rules (`:where()` on accent-color and the aria-pressed toggle arm, `.app-bar__app` scoped + ellipsized, `.btn--ghost` border-color, pagination hover `:not([aria-current])`, `.menu__item` button reset, tabs keyed on `aria-current`, tooltip `display`+forced-colors, etc.). See `docs/tickets/2026-07-16-consumer-feedback-triage.md` and the git diff for the true final state.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the P1/P2/P3/P5 items of `docs/tickets/2026-07-16-consumer-feedback-triage.md` - platform ownership one-liners, the canonical app-bar brand mark, quiet icon buttons, selection states, and small primitives - in the zha-ui CSS package, examples, and docs. P4 (viz tokens) is explicitly out of scope (needs its own spec).

**Architecture:** All CSS changes are hand-written source edits in `packages/css/src/**` (the tokens dist is Style-Dictionary-generated - never edited). `packages/css/build.mjs` concatenates partials in fixed cascade order (base → gradient → layout → nav → content → feedback → overlay → menu, then es-lockup.css last), so source order inside each file and the partial order carry cascade meaning. Tests are regex assertions against the built `dist/index.css` in `packages/css/test/exports.test.ts` (TDD: assertions land first and fail against the stale dist).

**Tech Stack:** plain CSS, Node build script, vitest, turbo/pnpm, Playwright MCP for render-verify.

## Global Constraints

- **No `git commit`, `git push`, or publish** - leave the working-tree diff (maintainer commits). `dist/` is generated and gitignored.
- ZHA Sans (`--font-secondary`) is never bold, never italic; reserved for the marks (lockup/logo).
- Never bare `--accent` as text or fill color; `--accent-fill` is the AA-safe fill; `--accent` is allowed for non-text strokes/borders/indicators only.
- Never hard-code a hex; tokens only.
- Gates: `pnpm build` green (runs the contrast gate, fails closed), `pnpm test` green, `pnpm lint` clean, then **browser render-verify at light + dark + brand** (the gate is blind to the emitted oklch cascade).
- Equal-specificity rules rely on source order (repo convention: dark/brand emitted last wins).

---

### Task 1: Platform ownership + P1 one-liners (base.css, nav.css, content.css)

**Files:**
- Modify: `packages/css/src/primitives/base.css` (insert platform block after the two `@font-face` rules, ~line 21; extend `.btn` ~line 27; extend `.chip` ~line 43)
- Modify: `packages/css/src/primitives/nav.css:18-23` (pagination)
- Modify: `packages/css/src/primitives/content.css:14` (badge--neutral), `:28` area (th-unit + sort reset)
- Test: `packages/css/test/exports.test.ts` (append new describe block)

**Interfaces:**
- Produces: `color-scheme` bindings, global `accent-color` for checkbox/radio/range, anchor-safe `.btn`, `.pagination` button support, `.badge--neutral`, `.th-unit`, `.data-table` sort-button reset, `.chip` transparent border + `button.chip` cursor.

- [ ] **Step 1: Append failing assertions** to `packages/css/test/exports.test.ts` before the final `});`:

```ts
describe('2026-07-17 consumer-feedback quick wins', () => {
  const css = () => readFileSync(d('index.css'), 'utf8');
  it('binds color-scheme to the theme axes, light rule first (source order is the tiebreaker)', () => {
    const lightIdx = css().search(/:root,\s*\[data-theme="light"\]\s*\{[^}]*color-scheme:\s*light/s);
    const darkIdx = css().search(/\[data-theme="dark"\],\s*\[data-surface="brand"\]\s*\{[^}]*color-scheme:\s*dark/s);
    expect(lightIdx).toBeGreaterThan(-1);
    expect(darkIdx).toBeGreaterThan(lightIdx);
  });
  it('owns native tick/track color for checkbox/radio/range', () => {
    expect(css()).toMatch(/input\[type="checkbox"\], input\[type="radio"\], input\[type="range"\]\s*\{[^}]*accent-color:\s*var\(--accent-fill\)/s);
  });
  it('btn is anchor-safe: no underline, no link color', () => {
    expect(css()).toMatch(/\.btn\s*\{[^}]*text-decoration:\s*none/s);
    expect(css()).toMatch(/\.btn\s*\{[^}]*color:\s*inherit/s);
  });
  it('pagination styles buttons too and strips their UA chrome', () => {
    expect(css()).toMatch(/\.pagination :is\(a, button, span\)\s*\{/);
    expect(css()).toMatch(/\.pagination button\s*\{[^}]*background:\s*none/s);
    expect(css()).toMatch(/\.pagination :is\(a, button\):hover/);
  });
  it('ships badge--neutral (intent-less)', () => {
    expect(css()).toMatch(/\.badge--neutral\s*\{[^}]*var\(--text-muted\)/s);
  });
  it('th-unit escapes the thead uppercase transform; th buttons reset to header typography', () => {
    expect(css()).toMatch(/\.th-unit\s*\{[^}]*text-transform:\s*none/s);
    expect(css()).toMatch(/\.data-table thead th :is\(\.btn, button\)\s*\{[^}]*font:\s*inherit/s);
  });
  it('chip carries a real border so is-active border-color paints; button chips get a cursor', () => {
    expect(css()).toMatch(/\.chip\s*\{[^}]*border:\s*1px solid transparent/s);
    expect(css()).toMatch(/button\.chip\s*\{[^}]*cursor:\s*pointer/s);
  });
});
```

- [ ] **Step 2: Run to verify failure.** `pnpm --filter @gitzhacode/zha-ui-css test` → the new block FAILS (dist lacks the rules).

- [ ] **Step 3: Implement.** In `base.css`, insert after the second `@font-face` block:

```css
/* Native-widget ownership. UA chrome (scrollbars, form-control wells, <select> popups)
   follows the theme axes; [data-surface="brand"] is black-first in BOTH themes. All
   selectors are (0,1,0) - source order is the tiebreaker (dark last), the same
   convention as the [data-brand] token blocks. The [data-theme="light"] leg keeps
   light islands inside dark apps from inheriting dark scrollbars. */
:root, [data-theme="light"] { color-scheme: light; }
[data-theme="dark"], [data-surface="brand"] { color-scheme: dark; }
input[type="checkbox"], input[type="radio"], input[type="range"] { accent-color: var(--accent-fill); }
```

In `base.css` `.btn` (line 27), add to the declaration: `text-decoration: none; color: inherit;` (anchor-safe - `<a class="btn">` keeps underline + link color otherwise).

In `base.css` `.chip` (line 43), add `border: 1px solid transparent;` and after the `.chip[aria-pressed]` line add:

```css
button.chip { cursor: pointer; } /* .chip already paints font/background/border on the button form */
```

Replace `nav.css:18-23` pagination block with:

```css
.pagination { display: flex; gap: var(--space-1); list-style: none; margin: 0; padding: 0; }
.pagination :is(a, button, span) { display: inline-flex; align-items: center; justify-content: center; min-inline-size: 32px; block-size: 32px; padding-inline: var(--space-2);
  border-radius: var(--radius-s); color: var(--text-default); text-decoration: none; font-size: var(--fs-body); font-variant-numeric: tabular-nums; }
.pagination button { background: none; border: 0; font-family: inherit; cursor: pointer; } /* SPA pagination is <button>s - strip UA chrome */
.pagination :is(a, button):hover { background: var(--bg-surface-2); }
.pagination [aria-current="page"] { background: var(--accent-fill); color: var(--accent-on); }
.pagination [aria-disabled="true"], .pagination :disabled { opacity: .45; pointer-events: none; }
```

In `content.css` after `.badge--info` (line 14): `.badge--neutral { color: var(--text-muted); }`
After the `.data-table` block (line 30), add:

```css
/* sort headers: a button in a th adopts the header's typography instead of .btn's */
.data-table thead th :is(.btn, button) { font: inherit; letter-spacing: inherit; text-transform: inherit; color: inherit;
  display: inline-flex; align-items: center; gap: var(--space-1); background: none; border: 0; padding: 0; min-height: 0; cursor: pointer; }
.th-unit { text-transform: none; } /* unit strings ("Wh/m²") escape the thead uppercase transform */
```

- [ ] **Step 4: Build + test.** `pnpm --filter @gitzhacode/zha-ui-css build` then `pnpm --filter @gitzhacode/zha-ui-css test` → all PASS (including the pre-existing suite).

### Task 2: App-bar canon (layout.css + es-lockup.css)

**Files:**
- Modify: `packages/css/src/primitives/layout.css:12` (redefine `__brand`, add `__app`)
- Modify: `packages/css/src/es-lockup.css:31-45` (link form, hover gating, size-floor comment)
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.app-bar__brand` = layout-only group (inline-flex, baseline, gap space-3, **no font/color**); `.app-bar__app` app-name slot (400 fs-h2 font-primary, text-muted, nowrap, hidden ≤640px); `a.zha-lockup` (no underline); gradient hover-shift gated on `:is(a, button).zha-lockup`.

- [ ] **Step 1: Failing assertions** (same new describe block):

```ts
  it('app-bar__brand is a layout-only baseline group (no font - ZHA Sans must not leak to the app name)', () => {
    const brand = css().match(/\.app-bar__brand\s*\{[^}]*\}/s)?.[0] ?? '';
    expect(brand).toMatch(/align-items:\s*baseline/);
    expect(brand).not.toMatch(/font/);
    expect(brand).not.toMatch(/--font-secondary/);
  });
  it('ships the app-name slot: fs-h2 font-primary muted nowrap, dropped first at narrow widths', () => {
    expect(css()).toMatch(/\.app-bar__app\s*\{[^}]*var\(--fs-h2\)[^}]*var\(--font-primary\)/s);
    expect(css()).toMatch(/\.app-bar__app\s*\{[^}]*white-space:\s*nowrap/s);
    expect(css()).toMatch(/@media \(max-width: 640px\)\s*\{\s*\.app-bar__app\s*\{[^}]*display:\s*none/s);
  });
  it('lockup anchor form has no underline; gradient hover-shift only on interactive lockups', () => {
    expect(css()).toMatch(/a\.zha-lockup\s*\{[^}]*text-decoration:\s*none/s);
    expect(css()).toMatch(/:is\(a, button\)\.zha-lockup:hover \.zha-lockup__team/);
    expect(css()).not.toMatch(/^\.zha-lockup:hover \.zha-lockup__team/m);
  });
```

- [ ] **Step 2: Run to verify failure** (as Task 1 Step 2).

- [ ] **Step 3: Implement.** `layout.css:12` - replace

```css
.app-bar__brand { font: var(--fs-h2) / 1 var(--font-secondary); letter-spacing: var(--tracking-label); color: var(--text-strong); }
```

with

```css
/* layout-only brand group: the lockup and app name each carry their OWN font/colour.
   No font here - a font declaration on the wrapper leaks ZHA Sans to the app name. */
.app-bar__brand { display: inline-flex; align-items: baseline; gap: var(--space-3); min-inline-size: 0; }
.app-bar__app { font: 400 var(--fs-h2) / 1 var(--font-primary); color: var(--text-muted); white-space: nowrap; }
@media (max-width: 640px) { .app-bar__app { display: none; } } /* drops first; team letters never drop or shrink */
```

`es-lockup.css` - in the `.zha-lockup` block comment, extend line 32's context: change `--zha-lockup-size: 1.5rem;` line to carry the floor rule:

```css
  --zha-lockup-size: 1.5rem;   /* in app bars this is the FLOOR, not a suggestion: the teal
                                  gradient stop is ~3:1 on light - AA large-text only */
```

Replace lines 44-45 (hover/focus shift) with:

```css
a.zha-lockup { text-decoration: none; } /* canonical app-bar form: the lockup IS the home link */
:is(a, button).zha-lockup:hover .zha-lockup__team,
:is(a, button).zha-lockup:focus-visible .zha-lockup__team { background-position: 100% 0; } /* shift implies interactivity - gated on the interactive forms */
```

- [ ] **Step 4: Build + test** (as Task 1 Step 4).

### Task 3: Quiet icon buttons (base.css)

**Files:**
- Modify: `packages/css/src/primitives/base.css:47-50`
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.icon-btn` default icon color `--text-muted` (accent demoted - utility icons are not brand decoration), hover `--text-strong` on `--bg-surface-2`; `.icon-btn--ghost` (transparent bg + border, same box/hit target).

- [ ] **Step 1: Failing assertions:**

```ts
  it('icon-btn is quiet by default (muted icon, not accent) and ships a ghost variant with the same hit target', () => {
    const iconBtn = css().match(/\.icon-btn\s*\{[^}]*\}/s)?.[0] ?? '';
    expect(iconBtn).toMatch(/color:\s*var\(--text-muted\)/);
    expect(iconBtn).not.toMatch(/color:\s*var\(--accent\)/);
    expect(css()).toMatch(/\.icon-btn--ghost\s*\{[^}]*background:\s*transparent[^}]*border-color:\s*transparent/s);
  });
```

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement.** Replace `base.css:47-50` with:

```css
.icon-btn { display: inline-flex; align-items: center; justify-content: center; width: var(--control-h, 44px); height: var(--control-h, 44px);
  border-radius: var(--radius-m); background: var(--bg-surface-1); border: 1px solid var(--border-subtle);
  color: var(--text-muted); cursor: pointer; } /* quiet by default - utility icons are not brand decoration */
.icon-btn:hover { color: var(--text-strong); background: var(--bg-surface-2); }
.icon-btn--ghost { background: transparent; border-color: transparent; } /* toolbar/chat form - same box, no chrome */
```

- [ ] **Step 4: Build + test.**

### Task 4: Selection states - .btn.is-active + .tabs (base.css, nav.css)

**Files:**
- Modify: `packages/css/src/primitives/base.css` (after `.btn:disabled`, line ~37)
- Modify: `packages/css/src/primitives/nav.css` (after pagination block)
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.btn.is-active` / `.btn[aria-pressed="true"]` quiet toggle (accent-subtle bg, full `border:` shorthand with `--accent` stroke, `--text-strong` text, hover-stable); `.tabs` / `.tabs__tab` with one blessed selected treatment (`aria-selected="true"` or `aria-current="page"`: strong text + 2px accent underline).

- [ ] **Step 1: Failing assertions:**

```ts
  it('btn toggle state uses the full border shorthand (ghost has border:none), text-strong text, and survives hover', () => {
    expect(css()).toMatch(/\.btn\.is-active, \.btn\[aria-pressed="true"\]\s*\{[^}]*background:\s*var\(--accent-subtle\)[^}]*border:\s*1px solid var\(--accent\)[^}]*color:\s*var\(--text-strong\)/s);
    expect(css()).toMatch(/\.btn\.is-active:hover, \.btn\[aria-pressed="true"\]:hover\s*\{[^}]*var\(--accent-subtle\)/s);
  });
  it('ships content tabs with a single blessed selected treatment (strong text + accent underline)', () => {
    expect(css()).toMatch(/\.tabs\s*\{[^}]*border-block-end:\s*1px solid var\(--border-subtle\)/s);
    expect(css()).toMatch(/\.tabs__tab:is\(\[aria-selected="true"\], \[aria-current="page"\]\)\s*\{[^}]*color:\s*var\(--text-strong\)[^}]*border-block-end-color:\s*var\(--accent\)/s);
  });
```

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement.** `base.css`, after `.btn:disabled` add:

```css
/* quiet persistent toggle (view switchers, layer toggles). Full border shorthand - .btn--ghost
   sets border:none, so border-color alone never paints. Text stays text-strong: accent-family
   text on the subtle wash fails AA at body size. Hover restates the wash so --secondary/--ghost
   hovers can't wash the state out. */
.btn.is-active, .btn[aria-pressed="true"] { background: var(--accent-subtle); border: 1px solid var(--accent); color: var(--text-strong); }
.btn.is-active:hover, .btn[aria-pressed="true"]:hover { background: var(--accent-subtle); }
```

`nav.css`, after the pagination block add:

```css
/* content-switching tabs (≠ .segmented, which is the input-like exclusive choice) */
.tabs { display: flex; gap: var(--space-1); border-block-end: 1px solid var(--border-subtle); }
.tabs__tab { appearance: none; background: none; border: none; margin-block-end: -1px; padding: var(--space-2) var(--space-3);
  font: var(--fw-medium,500) var(--fs-body) / 1 var(--font-primary); color: var(--text-muted); text-decoration: none; cursor: pointer;
  border-block-end: 2px solid transparent; }
.tabs__tab:hover { color: var(--text-default); }
.tabs__tab:is([aria-selected="true"], [aria-current="page"]) { color: var(--text-strong); border-block-end-color: var(--accent); }
```

- [ ] **Step 4: Build + test.**

### Task 5: Small primitives - tooltip, slider-row, fieldset, menu caret (overlay.css, content.css, menu.css)

**Files:**
- Modify: `packages/css/src/primitives/overlay.css` (append), `content.css` (after `.field` block), `menu.css` (after `.menu__separator`)
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Produces: `.tooltip` (paint-only, inverse surface both themes), `.slider-row` (+`__value`), `fieldset.field` + legend reset, `.menu__caret` (rotating chevron, `aria-expanded`-driven).

- [ ] **Step 1: Failing assertions:**

```ts
  it('ships a paint-only tooltip on the inverse surface', () => {
    expect(css()).toMatch(/\.tooltip\s*\{[^}]*background:\s*var\(--text-strong\)[^}]*color:\s*var\(--bg-surface-1\)/s);
    expect(css()).toMatch(/\.tooltip\s*\{[^}]*max-inline-size/s);
  });
  it('ships the labeled slider row with a tabular value slot', () => {
    expect(css()).toMatch(/\.slider-row\s*\{[^}]*grid-template-columns/s);
    expect(css()).toMatch(/\.slider-row__value\s*\{[^}]*tabular-nums/s);
  });
  it('fieldset.field loses the UA border box and gets a .field-style legend', () => {
    expect(css()).toMatch(/fieldset\.field\s*\{[^}]*border:\s*0/s);
    expect(css()).toMatch(/fieldset\.field legend\s*\{[^}]*var\(--fs-small\)/s);
  });
  it('ships the menu caret mirroring the accordion chevron, driven by aria-expanded', () => {
    expect(css()).toMatch(/\.menu__caret\s*\{[^}]*rotate\(-45deg\)/s);
    expect(css()).toMatch(/\[aria-expanded="true"\][^{]*\.menu__caret[^{]*\{[^}]*rotate\(45deg\)/s);
  });
```

- [ ] **Step 2: Run to verify failure.**

- [ ] **Step 3: Implement.** `overlay.css`, append:

```css
/* tooltip - paint only (positioning is the consumer's/Anchor API's job). Inverse surface
   reads as "tooltip" in both themes: near-ink on light, near-paper on dark. */
.tooltip { max-inline-size: 36ch; padding: var(--space-2) var(--space-3); border-radius: var(--radius-s);
  background: var(--text-strong); color: var(--bg-surface-1); font-size: var(--fs-small); line-height: var(--leading-body); box-shadow: var(--shadow-mid); }
```

`content.css`, after the `.field [aria-invalid]` line add:

```css
/* label + <input type=range> + value readout - the analysis-app row that drifts otherwise */
.slider-row { display: grid; grid-template-columns: minmax(0, auto) 1fr auto; align-items: center; gap: var(--space-3); font-size: var(--fs-body); }
.slider-row__value { font-variant-numeric: tabular-nums; color: var(--text-muted); min-inline-size: 5ch; text-align: end; }

/* choice group: fieldset+legend radio/checkbox stacks join the .field family (UA border box removed) */
fieldset.field { border: 0; padding: 0; margin: 0; min-inline-size: 0; }
fieldset.field legend { padding: 0; margin-block-end: var(--space-2); font-size: var(--fs-small); color: var(--text-default); letter-spacing: var(--tracking-small); }
```

`menu.css`, after `.menu__separator` add:

```css
.menu__caret { flex: none; margin-inline-start: auto; inline-size: 8px; block-size: 8px;
  border-inline-end: 2px solid var(--text-muted); border-block-end: 2px solid var(--text-muted);
  transform: rotate(-45deg); transition: transform var(--motion-base) var(--ease-out); } /* points right (collapsed) */
[aria-expanded="true"] .menu__caret { transform: rotate(45deg); } /* points down (expanded) */
```

- [ ] **Step 4: Build + test.** Full suite: `pnpm build && pnpm test` at repo root (turbo runs tokens gate + all packages).

### Task 6: Examples - foundation-reference bars + hub hero retype

**Files:**
- Modify: `examples/foundation-reference/index.html:433-441` and `:467-470` (canonical bar markup)
- Modify: `examples/index.html:34-42` (hub-mark CSS) and `:104-107` (hero markup)

**Interfaces:**
- Consumes: `.app-bar__brand` group, `.app-bar__app`, `a.zha-lockup` from Task 2.

- [ ] **Step 1: foundation-reference default shell bar** - replace lines 433-435 (`<span class="app-bar__brand">ZHA ES</span>` + spacer) with:

```html
            <header class="app-bar">
              <span class="app-bar__brand">
                <a class="zha-lockup" href="index.html"><span class="zha-lockup__zha">ZHA</span><span class="zha-lockup__team">ES</span></a>
                <span class="app-bar__app">App name</span>
              </span>
              <span class="app-bar__spacer"></span>
```

(keep the existing user-menu `icon-btn` that follows). Apply the same brand-group markup to the rail shell bar at lines 467-469.

- [ ] **Step 2: hub hero.** In `examples/index.html`, replace the `.hub-mark` CSS block (lines 31-42) with:

```css
    /* Hero mark = a display-scale .zha-lockup - BOTH parts typeset (doctrine: the SVG
       .zha-logo is for standalone use; anything paired is the typeset lockup). */
    .hub-hero .zha-lockup { margin: 0; --zha-lockup-size: clamp(3.25rem, 9vw, 5.5rem); }
```

and replace the `<h1 class="hub-mark">…</h1>` markup (lines 104-107, including the inline SVG) with:

```html
      <h1 class="zha-lockup" aria-label="ZHA UI">
        <span class="zha-lockup__zha" aria-hidden="true">ZHA</span><span class="zha-lockup__team" aria-hidden="true">UI</span>
      </h1>
```

The hub app-bar (line 96) stays a non-link lockup deliberately - the hub IS home, and after Task 2 the hover shift no longer implies interactivity on spans.

- [ ] **Step 3: Verify in browser** (folded into Task 8's render pass).

### Task 7: Docs - AGENTS.md + AI-USAGE.md

**Files:**
- Modify: `AGENTS.md` (primitives lists + new "App bar" recipe + guidance lines)
- Modify: `AI-USAGE.md` (class cheat-sheet rows for every new class)

- [ ] **Step 1: AGENTS.md.** In the Spec 1 line (55-57) add `.icon-btn--ghost` after `.icon-btn`. In Spec 2 Layout line add `__app`; Navigation line add `.tabs` (+ `__tab`); Content line add `--neutral` to badge list, `.slider-row` (+ `__value`), `.th-unit`, `fieldset.field`; Feedback line add `.tooltip`; menu family gets `.menu__caret`. After the Spec 2 list, add:

```markdown
**The app bar** - exactly one blessed composition (do not improvise the mark):

```html
<header class="app-bar">
  <span class="app-bar__brand">
    <a class="zha-lockup" href="/"><span class="zha-lockup__zha">ZHA</span><span class="zha-lockup__team">ES</span></a>
    <span class="app-bar__app">Your App Name</span>
  </span>
  <span class="app-bar__spacer"></span>
  <!-- actions: .btn--primary, .btn--ghost, .icon-btn--ghost -->
</header>
```

- The lockup is the home link; team letters are the gradient (never inline-colour them, never `.accent-grad-text` an app name - gradients are hero/expressive-only).
- The app name is `--font-primary` (ZHA Sans is reserved for the marks) in natural product case; it hides itself below 640px.
- No app icon in the bar - product icons live in the favicon, login, and empty states (≥48px, tokens/currentColor only).
- Toggled states: `.btn.is-active` / `aria-pressed="true"` (quiet accent wash), selected tabs via `.tabs__tab[aria-selected="true"]`.
```

After "Naming & type rules", add these lines:

```markdown
- Icons are inline **stroke (line) SVGs** using `currentColor` - never colour emoji, never solid glyph fonts.
- Density floor is 36px (`data-density="compact"`); below that, scope-override `--control-h` per zone (e.g. `.toolbar { --control-h: 24px; }`) - that is the sanctioned knob, don't invent smaller buttons.
- Links in body copy: `color: var(--accent-fill)` + underline on hover. Never derive hover colours (no `color-mix` darkening - dark surfaces need *lighter*, not darker).
- Non-modal floating panels compose existing tokens: `.surface` + `var(--radius-l)` + `var(--shadow-high)` + a `.dialog__header`-style row. No `.panel` primitive (yet).
- Starting from a Vite/CRA template? **Delete the template's element-level `button`/`a` CSS first** - primitives own control paint; scaffold hovers (e.g. `button:hover { border-color: … }`) beat single-class primitives on specificity.
```

- [ ] **Step 2: AI-USAGE.md.** Update line 12 (`.icon-btn` list) to include `.icon-btn--ghost`; line 15 to `.app-bar__brand .app-bar__app`; line 18 badge list `+ .badge--neutral`. Update the table rows: `.icon-btn` description → "44 × 44 px icon-only button (muted icon; `--ghost` for chromeless toolbar/chat form)"; `.app-bar__brand` → "Layout-only brand group (baseline row: lockup + app name) - carries no font"; add rows for `.app-bar__app`, `.tabs` / `.tabs__tab`, `.btn.is-active`, `.tooltip`, `.slider-row` (+ `__value`), `fieldset.field`, `.menu__caret`, `.th-unit`, `.badge--neutral`.

### Task 8: Gates + render-verify

- [ ] **Step 1:** `pnpm build` at root → green (includes contrast gate; tokens untouched so the gate output must be unchanged).
- [ ] **Step 2:** `pnpm test` at root → green. `pnpm lint` → clean.
- [ ] **Step 3: Render-verify (Playwright MCP)** - build a scratchpad page importing `packages/css/dist/index.css` with: the canonical app-bar (link lockup + app name + ghost icon-btns + is-active buttons), `.tabs`, `.tooltip`, `.slider-row`, `fieldset.field`, checkbox/radio/range (accent-color), `.pagination` with buttons, `.badge--neutral`, sort-header table with `.th-unit`. Screenshot at ≥3 states: `data-theme="light"`, `data-theme="dark"` (checkbox wells/scrollbars must render dark - the color-scheme fix), and `data-brand="es"` + dark (brand+dark blind-spot check: lockup gradient + accent-subtle states legible). Also screenshot `examples/foundation-reference` (updated bar) and `examples/index.html` (hero retype) - hub hero must show the typeset giant lockup with gradient "UI".
- [ ] **Step 4:** Report the diff summary + screenshots; leave everything uncommitted.

## Self-Review

- Spec coverage: P1 items 1-5 → Task 1; P2 decisions (brand group, app name slot, link lockup, size floor, no icon, responsive, examples, AGENTS) → Tasks 2/6/7; `.icon-btn--ghost` + quiet default → Task 3; P3 (is-active + traps, chip border no-op, tabs) → Tasks 1/4; P5 CSS (tooltip, slider-row, fieldset, caret, th-unit/sort) → Tasks 1/5; P5 docs (density knob, icon vocabulary, links, panel recipe, starter warning) → Task 7; hero doctrine leak → Task 6. Deliberately out: P4 viz tokens (own spec), `.chip` typology variants (blocked on P4 tokens), `.chip__remove` (defer with it - ships as one chip pass), starter header rewrites (they already use the lockup correctly and don't use `.app-bar`).
- Placeholder scan: none - every step has exact code.
- Type consistency: class names cross-checked (`.app-bar__app`, `.icon-btn--ghost`, `.tabs__tab`, `.slider-row__value`, `.menu__caret`, `.th-unit`, `fieldset.field`) match between CSS, tests, examples, and docs.
