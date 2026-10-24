# Gradient Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the ZHA gradient library - 4 frozen hero-mesh masters, the 12-hue spectrum (oklch-vivid where supported), a subtle team wash, and 2 curated accent washes - as `--grad-*` tokens + `.grad-*` utilities with print/forced-colors/oklch guarantees.

**Architecture:** Gradient tokens are `$type: "other"` string tokens in `core.tokens.json` (like the existing `brand.grad`) - they skip the `color/oklch` transform, so the frozen-art meshes emit verbatim sRGB in `:root` with zero build change. Utilities live in a new `src/primitives/gradient.css` partial inserted after `base` in the fixed cascade. The spectrum ships an sRGB base + an `in oklch` variant swapped in under `@supports (background-image: linear-gradient(in oklch, red, red))` - NOT the `(color: oklch())` test (oklch colours shipped before in-oklch gradients, and a failed `var()` swap blanks the property instead of falling back).

**Tech Stack:** DTCG JSON → Style Dictionary v4 (`packages/tokens`) → CSS custom properties; CSS-only utilities (`packages/css`); vitest; pnpm workspace.

**Spec:** `docs/specs/2026-07-09-zha-ui-gradient-library-design.md`.

## Global Constraints

- The firm is **"ZHA"** - always; never write its former spelled-out name in code, docs, or commits.
- ZHA Sans (`--font-secondary`) is always **regular weight + upright** - never bold, never italic.
- **Frozen-art rule:** the 4 hero-mesh tokens keep their authored sRGB hex **verbatim** (brand-reference §2.4). Never oklch-convert them, never re-tune the stops, never re-emit them in the `@supports (color: oklch())` overlay.
- **Gradients are decorative:** never the sole carrier of meaning, never a work-surface heading fill. Hero meshes are black-first marketing surfaces that assume white text.
- **Existing Phase-A surface is untouched:** `.accent-grad`, `.accent-grad-text`, `--brand-grad` keep their current definitions (this plan only ADDS print handling for gradient-clipped text).
- **Built `dist/` is gitignored** - commit **source** files only (`*.tokens.json`, `src/**`, `test/**`, docs). Never `git add` anything under `dist/`.
- Commit messages: `type(scope): subject` (e.g. `feat(tokens): …`).
- Run package scripts via `pnpm --filter <pkg> <script>` from the repo root (no `cd`).
- **Repo norm: confirm with the maintainer before the FIRST commit** of this execution; do not push or merge.

---

### Task 1: Tokens - `grad.*` library + `brand.grad-subtle`

Add the gradient tokens to core semantics. `$type: "other"` string tokens emit verbatim via `css/variables` (precedent: `brand.grad`); the oklch overlay build filters on `$type === 'color'`, so none of these are re-emitted there.

**Files:**
- Modify: `packages/tokens/src/semantic/core.tokens.json`
- Create (test): `packages/tokens/test/gradient.test.ts`

**Interfaces:**
- Consumes: `--accent-subtle` (verified in `:root` via `light.tokens.json`, re-emitted per brand), `--accent-2-subtle` (core), `--color-typology-*` (12 primitives, emitted in `:root` by Build 1).
- Produces (CSS custom properties in `:root` of `dist/tokens.css`, consumed by Tasks 2-3): `--grad-hero-ember`, `--grad-hero-ocean`, `--grad-hero-violet`, `--grad-hero-dusk`, `--grad-spectrum`, `--grad-spectrum-oklch`, `--grad-wash`, `--grad-glow`, `--brand-grad-subtle`.

- [ ] **Step 1: Write the failing test**

Create `packages/tokens/test/gradient.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const css = () => readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');

describe('gradient library tokens', () => {
  it('emits the four frozen hero-mesh tokens with their authored sRGB hex', () => {
    const c = css();
    // one signature authored hex per mesh - proves no oklch conversion / retuning
    expect(c).toMatch(/--grad-hero-ember:[^;]*#a03a1a/);
    expect(c).toMatch(/--grad-hero-ocean:[^;]*#1a22bb/);
    expect(c).toMatch(/--grad-hero-violet:[^;]*#7a1870/);
    expect(c).toMatch(/--grad-hero-dusk:[^;]*#1a0a60/);
    // each ends on its base floor as the bottom background-image layer
    expect(c).toMatch(/--grad-hero-ember:[^;]*linear-gradient\(#110008,#110008\)/);
    expect(c).toMatch(/--grad-hero-dusk:[^;]*linear-gradient\(#05030f,#05030f\)/);
  });

  it('hero meshes are frozen art: emitted once (:root only), never inside the oklch overlay', () => {
    const c = css();
    expect(c.match(/--grad-hero-ember:/g)).toHaveLength(1);
    expect(c).not.toMatch(/--grad-hero-[a-z]+:[^;]*oklch\(/);
  });

  it('emits the spectrum pair: sRGB base + in-oklch variant, 12 typology stops each', () => {
    const c = css();
    const base = c.match(/--grad-spectrum:\s*([^;]+);/)?.[1] ?? '';
    const vivid = c.match(/--grad-spectrum-oklch:\s*([^;]+);/)?.[1] ?? '';
    expect(base).toContain('linear-gradient(105deg,');
    expect(base).not.toContain('in oklch');
    expect(vivid).toContain('linear-gradient(105deg in oklch,');
    expect(base.match(/var\(--color-typology-/g)).toHaveLength(12);
    expect(vivid.match(/var\(--color-typology-/g)).toHaveLength(12);
  });

  it('emits the team subtle gradient + washes from live accent vars', () => {
    const c = css();
    expect(c).toMatch(
      /--brand-grad-subtle:\s*linear-gradient\(105deg, var\(--accent-subtle\) 0%, var\(--accent-2-subtle\) 100%\)/,
    );
    expect(c).toMatch(
      /--grad-wash:\s*linear-gradient\(180deg, var\(--accent-subtle\) 0%, transparent 100%\)/,
    );
    expect(c).toMatch(
      /--grad-glow:\s*radial-gradient\(ellipse 90% 70% at 50% -10%, var\(--accent-subtle\) 0%, transparent 70%\)/,
    );
  });

  it('llms.txt lists the gradient vars AND flags them decorative-only', () => {
    const txt = readFileSync(new URL('../dist/llms.txt', import.meta.url), 'utf8');
    expect(txt).toContain('--grad-hero-ember'); // vars flow in automatically via the llms format
    expect(txt).toMatch(/decorative only/i);    // guidance line - without it an AI may paint heroes behind working UI
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens test`
Expected: FAIL - all four new `gradient.test.ts` tests (tokens absent from the current `dist/tokens.css`). All pre-existing tests still PASS.

- [ ] **Step 3: Add the tokens to core**

In `packages/tokens/src/semantic/core.tokens.json`, replace the existing `"brand"` block:

```json
  "brand": {
    "grad": { "$type": "other", "$value": "linear-gradient(105deg, var(--accent) 0%, var(--accent-2) 100%)", "$description": "Brand gradient = primary→secondary, resolved live from --accent/--accent-2. Identity/hero use only." }
  },
```

with (adds `grad-subtle`, then a new top-level `grad` group after it):

```json
  "brand": {
    "grad": { "$type": "other", "$value": "linear-gradient(105deg, var(--accent) 0%, var(--accent-2) 100%)", "$description": "Brand gradient = primary→secondary, resolved live from --accent/--accent-2. Identity/hero use only." },
    "grad-subtle": { "$type": "other", "$value": "linear-gradient(105deg, var(--accent-subtle) 0%, var(--accent-2-subtle) 100%)", "$description": "Low-opacity team-gradient wash - panel/section backgrounds. Resolves live per team/theme." }
  },
  "grad": {
    "hero": {
      "ember":  { "$type": "other", "$value": "radial-gradient(ellipse 70% 55% at 62% 52%,#a03a1a 0%,#7a2810 35%,transparent 75%),radial-gradient(ellipse 40% 30% at 88% 10%,#b04a20 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 10% 15%,#4a0a3a 0%,transparent 70%),linear-gradient(#110008,#110008)", "$description": "Frozen ZHA hero mesh 01 (ember/terracotta) - verbatim brand art, sRGB. Never oklch-convert." },
      "ocean":  { "$type": "other", "$value": "radial-gradient(ellipse 65% 60% at 85% 75%,#1a22bb 0%,#0d1580 40%,transparent 75%),radial-gradient(ellipse 55% 45% at 45% 5%,#0d3d40 0%,#082030 45%,transparent 75%),linear-gradient(#050508,#050508)", "$description": "Frozen ZHA hero mesh 02 (deep ocean/cobalt) - verbatim brand art, sRGB. Never oklch-convert." },
      "violet": { "$type": "other", "$value": "radial-gradient(ellipse 35% 30% at 95% 2%,#b06020 0%,#8a3a10 40%,transparent 70%),radial-gradient(ellipse 75% 90% at 35% 45%,#7a1870 0%,#5a0c50 40%,#2a0420 70%,transparent 90%),linear-gradient(#0a0008,#0a0008)", "$description": "Frozen ZHA hero mesh 04 (violet sphere/amber flare) - verbatim brand art, sRGB. Never oklch-convert." },
      "dusk":   { "$type": "other", "$value": "radial-gradient(ellipse 30% 25% at 98% 0%,#b08010 0%,#806010 35%,transparent 65%),radial-gradient(ellipse 60% 80% at 90% 50%,#804040 0%,#4a1850 40%,transparent 75%),radial-gradient(ellipse 70% 100% at 10% 50%,#1a0a60 0%,#0d0530 55%,transparent 80%),linear-gradient(#05030f,#05030f)", "$description": "Frozen ZHA hero mesh 05 (indigo→gold dusk sweep; most brand-core) - verbatim brand art, sRGB. Never oklch-convert." }
    },
    "spectrum": {
      "DEFAULT": { "$type": "other", "$value": "linear-gradient(105deg, var(--color-typology-purple), var(--color-typology-ultramarine), var(--color-typology-blue), var(--color-typology-teal), var(--color-typology-dark-green), var(--color-typology-light-green), var(--color-typology-lime), var(--color-typology-yellow), var(--color-typology-apricot), var(--color-typology-orange), var(--color-typology-cool-red), var(--color-typology-magenta))", "$description": "12-hue typology spectrum, sRGB interpolation (universal base). Wayfinding/hero decoration." },
      "oklch":   { "$type": "other", "$value": "linear-gradient(105deg in oklch, var(--color-typology-purple), var(--color-typology-ultramarine), var(--color-typology-blue), var(--color-typology-teal), var(--color-typology-dark-green), var(--color-typology-light-green), var(--color-typology-lime), var(--color-typology-yellow), var(--color-typology-apricot), var(--color-typology-orange), var(--color-typology-cool-red), var(--color-typology-magenta))", "$description": "Spectrum with oklch interpolation - even, vivid hue transitions. Swapped in by .grad-spectrum under the gradient-specific @supports test." }
    },
    "wash": { "$type": "other", "$value": "linear-gradient(180deg, var(--accent-subtle) 0%, transparent 100%)", "$description": "Top-down accent tint wash for section backgrounds. Resolves live per team/theme." },
    "glow": { "$type": "other", "$value": "radial-gradient(ellipse 90% 70% at 50% -10%, var(--accent-subtle) 0%, transparent 70%)", "$description": "Overhead radial accent glow for section backgrounds. Resolves live per team/theme." }
  },
```

(Token names via the `name/no-default` transform: `grad.hero.ember` → `--grad-hero-ember`, `grad.spectrum.DEFAULT` → `--grad-spectrum`, `grad.spectrum.oklch` → `--grad-spectrum-oklch`, `brand.grad-subtle` → `--brand-grad-subtle`.)

- [ ] **Step 3b: Add the decorative-only guidance line to the llms format**

llms.txt is the canonical AI onboarding artifact - the new vars flow in automatically, but without a
usage rule an AI consumer could legally paint `--grad-hero-dusk` behind a data table. In
`packages/tokens/style-dictionary.config.mjs`, inside the `zha/llms` format, replace:

```js
      ...semantic.map((t) => `--${t.name}`),
      '',
      'Primitive classes (from @gitzhacode/zha-ui-css): .surface .card .btn .btn--primary .btn--secondary .btn--ghost .btn--danger .input .select .chip .icon-btn .skeleton .sr-only',
```

with:

```js
      ...semantic.map((t) => `--${t.name}`),
      '',
      'Gradients are decorative only: --grad-hero-* are frozen black-first marketing hero backgrounds (assume white text); --grad-spectrum is the 12-hue sweep; --grad-wash / --grad-glow / --brand-grad-subtle are the only gradients for work surfaces. Never behind working UI, never a heading fill.',
      'Primitive classes (from @gitzhacode/zha-ui-css): .surface .card .btn .btn--primary .btn--secondary .btn--ghost .btn--danger .input .select .chip .icon-btn .skeleton .sr-only',
```

(The class line's pre-existing omission of all Spec-2 classes is a known gap, out of scope here - noted as a follow-up.)

- [ ] **Step 4: Rebuild tokens (runs the contrast gate) and verify tests pass**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens build`
Expected: `Contrast matrix: all pairs pass WCAG AA.` + `tokens.css written ✓` (gradient tokens are `$type: "other"` → invisible to both the gate's PAIRS and the oklch transform).

Run: `pnpm --filter @gitzhacode/zha-ui-tokens test`
Expected: PASS - all of `gradient.test.ts` plus every pre-existing test (notably `brand-axis.test.ts`'s `:root --brand-grad` assertion, unaffected because `--brand-grad-subtle:` never matches the `--brand-grad:` regex).

- [ ] **Step 5: Commit (sources only)**

```bash
git add packages/tokens/src/semantic/core.tokens.json packages/tokens/style-dictionary.config.mjs packages/tokens/test/gradient.test.ts
git commit -m "feat(tokens): gradient library - frozen hero meshes, spectrum pair, team + accent washes"
```

---

### Task 2: CSS - `gradient.css` partial + print fix for gradient-clipped text

Ship the utilities and the free guarantees. Also fixes a pre-existing print gap: `.accent-grad-text` and `.zha-lockup__team` set `color: transparent` and rely on a painted background - browsers skip background images in print by default, so gradient-clipped text currently prints **invisible**. Print reverts them to solid `--accent-fill`, which is **verified theme-stable**: `dark.tokens.json` re-declares `accent.fill` as the same `{color.accent.teal-fill}`, so the printed colour is #037A88 (≥4.5 on white) from light AND dark pages. Don't "optimise" the print colour to `--accent` - bare accent can be the light dark-theme variant.

Cascade-order facts this task relies on (from `build.mjs`): `index.css` = tokens → primitives (fixed `PARTIALS` order) → `es-lockup.css`. Inserting `gradient` **after `base`** lets gradient.css's equal-specificity print override of `.accent-grad-text` (declared in base.css) win; the lockup is concatenated **after** all primitives, so its print fix must live in `es-lockup.css` itself.

**Files:**
- Create: `packages/css/src/primitives/gradient.css`
- Modify: `packages/css/build.mjs` (the `PARTIALS` array)
- Modify: `packages/css/src/es-lockup.css` (append one print rule)
- Test: `packages/css/test/exports.test.ts`

**Interfaces:**
- Consumes: `--grad-hero-ember/-ocean/-violet/-dusk`, `--grad-spectrum`, `--grad-spectrum-oklch`, `--grad-wash`, `--grad-glow`, `--brand-grad-subtle` (Task 1); `--accent-fill` (existing).
- Produces (classes, used by Task 3 docs + Task 4 verify): `.grad-hero-ember`, `.grad-hero-ocean`, `.grad-hero-violet`, `.grad-hero-dusk`, `.grad-spectrum`, `.grad-wash`, `.grad-glow`, `.accent-grad-subtle`.

- [ ] **Step 1: Write the failing tests**

In `packages/css/test/exports.test.ts`, add these four `it(...)` blocks inside the `describe`:

```ts
  it('ships the gradient library classes', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    for (const c of ['grad-hero-ember', 'grad-hero-ocean', 'grad-hero-violet', 'grad-hero-dusk',
                     'grad-spectrum', 'grad-wash', 'grad-glow', 'accent-grad-subtle'])
      expect(css).toMatch(new RegExp(`\\.${c}\\s*\\{[^}]*background-image:\\s*var\\(--`));
  });
  it('spectrum upgrades to oklch interpolation ONLY under the gradient-specific feature test', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(
      /@supports \(background-image: linear-gradient\(in oklch, red, red\)\)\s*\{\s*\.grad-spectrum\s*\{[^}]*var\(--grad-spectrum-oklch\)/s,
    );
    // the token overlay's (color: oklch()) test must NOT gate the swap - colours shipped before in-oklch gradients
    expect(css).not.toMatch(/@supports \(color: oklch\(0 0 0\)\)\s*\{\s*\.grad-spectrum/s);
  });
  it('decorative gradients are suppressed in print; gradient-clipped text prints solid, not transparent', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/@media print\s*\{[^@]*\.grad-hero-ember[^{]*\{[^}]*background:\s*#fff none/s);
    expect(css).toMatch(/@media print\s*\{[^@]*\.accent-grad-text\s*\{[^}]*color:\s*var\(--accent-fill\)/s);
    expect(css).toMatch(/@media print\s*\{\s*\.zha-lockup__team\s*\{[^}]*color:\s*var\(--accent-fill\)/s);
  });
  it('gradients defer to forced colors', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(
      /@media \(forced-colors: active\)\s*\{[^@]*\.grad-spectrum[^{]*\{[^}]*background-image:\s*none/s,
    );
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @gitzhacode/zha-ui-css test`
Expected: FAIL - the four new tests (classes absent from the built `index.css`). All pre-existing tests still PASS.

- [ ] **Step 3: Create the gradient partial**

Create `packages/css/src/primitives/gradient.css` with exactly:

```css
/* Gradient library - tokens from @gitzhacode/zha-ui-tokens (--grad-*, --brand-grad-subtle).
   Two provenance classes (spec: docs/specs/2026-07-09-zha-ui-gradient-library-design.md):
   frozen sRGB brand art (hero meshes) and palette-derived (spectrum / team / washes).
   All decorative - never the sole carrier of meaning, never a work-surface heading fill. */

/* Hero meshes - frozen brand art (sRGB, brand-ref §2.4). Black-first marketing heroes; white text assumed. */
.grad-hero-ember  { background-image: var(--grad-hero-ember); }
.grad-hero-ocean  { background-image: var(--grad-hero-ocean); }
.grad-hero-violet { background-image: var(--grad-hero-violet); }
.grad-hero-dusk   { background-image: var(--grad-hero-dusk); }

/* Spectrum - sRGB base, upgraded where the engine supports IN-OKLCH GRADIENTS specifically.
   Not @supports (color: oklch()): oklch colours shipped before gradient interpolation (Safari 15.4
   vs 16.2), and a failed var() swap blanks the property at computed-value time instead of falling back. */
.grad-spectrum { background-image: var(--grad-spectrum); }
@supports (background-image: linear-gradient(in oklch, red, red)) {
  .grad-spectrum { background-image: var(--grad-spectrum-oklch); }
}

/* Team wash + curated washes - resolve live from the accent vars per brand/theme. */
.accent-grad-subtle { background-image: var(--brand-grad-subtle); }
.grad-wash { background-image: var(--grad-wash); }
.grad-glow { background-image: var(--grad-glow); }

/* Free guarantees. This partial loads after base.css, so the .accent-grad-text override wins its
   equal-specificity tie; the lockup's print fix lives in es-lockup.css (concatenated later). */
@media print {
  .grad-hero-ember, .grad-hero-ocean, .grad-hero-violet, .grad-hero-dusk,
  .grad-spectrum, .grad-wash, .grad-glow, .accent-grad-subtle, .accent-grad {
    background: #fff none;
  }
  /* gradient-clipped text must never print transparent (print skips background images) */
  .accent-grad-text { background: none; color: var(--accent-fill); }
}
@media (forced-colors: active) {
  /* forced-colors preserves background IMAGES (only colours are forced) - drop them explicitly.
     .accent-grad included: Phase A never handled the area fill, only the clipped text. */
  .grad-hero-ember, .grad-hero-ocean, .grad-hero-violet, .grad-hero-dusk,
  .grad-spectrum, .grad-wash, .grad-glow, .accent-grad-subtle, .accent-grad {
    background-image: none;
  }
}
```

- [ ] **Step 4: Insert the partial into the cascade**

In `packages/css/build.mjs`, replace:

```js
const PARTIALS = ['base', 'layout', 'nav', 'content', 'feedback', 'overlay', 'menu'];
```

with:

```js
const PARTIALS = ['base', 'gradient', 'layout', 'nav', 'content', 'feedback', 'overlay', 'menu'];
```

- [ ] **Step 5: Append the lockup print fix**

At the end of `packages/css/src/es-lockup.css`, after the `@media (prefers-reduced-motion: reduce)` line, append:

```css
/* gradient-clipped text must never print transparent (print skips background images) */
@media print { .zha-lockup__team { background: none; color: var(--accent-fill); } }
```

- [ ] **Step 6: Rebuild tokens + css and verify the tests pass**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens build && pnpm --filter @gitzhacode/zha-ui-css build`
Expected: both succeed (`tokens.css written ✓`, `@gitzhacode/zha-ui-css built.`).

Run: `pnpm --filter @gitzhacode/zha-ui-css test`
Expected: PASS - the four new tests plus every pre-existing export test.

- [ ] **Step 7: Commit**

```bash
git add packages/css/src/primitives/gradient.css packages/css/build.mjs packages/css/src/es-lockup.css packages/css/test/exports.test.ts
git commit -m "feat(css): gradient library utilities + print fix for gradient-clipped text"
```

---

### Task 3: Docs - gradient vocabulary across the AI + human guides

Pure text; no build. `llms.txt` picks the new vars up automatically (its filter only excludes `color/space/radius` roots), so only the four curated docs need edits.

**Files:**
- Modify: `AI-USAGE.md`, `AGENTS.md`, `DESIGN.md`, `docs/zha-brand-reference.md`

- [ ] **Step 1: AI-USAGE.md - class list, var lists, cheat-sheet**

(a) Replace the Spec-2 class-list line:

```markdown
> `.segmented .card--interactive .card--accent .accent-grad .accent-grad-text`
```

with:

```markdown
> `.segmented .card--interactive .card--accent .accent-grad .accent-grad-text .accent-grad-subtle`
> `.grad-hero-ember .grad-hero-ocean .grad-hero-violet .grad-hero-dusk .grad-spectrum .grad-wash .grad-glow`
```

(b) Replace the accent var line:

```markdown
> *Accent:* `--accent --accent-fill --accent-on --accent-subtle` - plus the **secondary** (expressive only - gradient/tints, never interactive): `--accent-2 --accent-2-subtle --accent-2-fill`, and the brand gradient `--brand-grad`
```

with:

```markdown
> *Accent:* `--accent --accent-fill --accent-on --accent-subtle` - plus the **secondary** (expressive only - gradient/tints, never interactive): `--accent-2 --accent-2-subtle --accent-2-fill`, the brand gradient `--brand-grad` and its subtle wash `--brand-grad-subtle`
```

(c) Insert a new var line directly after the *Typology tints* line (after the `where <name> is one of: …` line):

```markdown
>
> *Gradient library (decorative only - never a work-surface heading fill):* `--grad-hero-ember --grad-hero-ocean --grad-hero-violet --grad-hero-dusk` (frozen black-first hero meshes; white text) `--grad-spectrum` (12-hue sweep) `--grad-wash --grad-glow` (subtle accent washes)
```

(d) In the class cheat-sheet table, insert after the `.accent-grad-text` row:

```markdown
| `.accent-grad-subtle` | Low-opacity team-gradient wash (`--brand-grad-subtle`) for panel/section backgrounds |
| `.grad-hero-ember` | Frozen ZHA hero mesh (ember/terracotta) - full-bleed black-first marketing hero; white text |
| `.grad-hero-ocean` | Frozen ZHA hero mesh (deep ocean/cobalt) - full-bleed black-first marketing hero; white text |
| `.grad-hero-violet` | Frozen ZHA hero mesh (violet sphere/amber flare) - full-bleed black-first marketing hero; white text |
| `.grad-hero-dusk` | Frozen ZHA hero mesh (indigo→gold dusk; most brand-core) - full-bleed black-first marketing hero; white text |
| `.grad-spectrum` | 12-hue typology spectrum band (oklch-vivid where supported) - wayfinding / hero decoration |
| `.grad-wash` | Top-down accent tint wash for section backgrounds (work-surface safe) |
| `.grad-glow` | Overhead radial accent glow for section backgrounds (work-surface safe) |
```

- [ ] **Step 2: AGENTS.md - add a Gradients bullet to the Spec-2 primitives list**

After the `- Feedback: …` bullet (ends with `.progress .empty-state (+ __icon) .view-fade`), add:

```markdown
- Gradients (decorative only - never a work-surface heading fill): `.accent-grad` `.accent-grad-text` `.accent-grad-subtle` (team gradient family)
  · `.grad-hero-ember` `.grad-hero-ocean` `.grad-hero-violet` `.grad-hero-dusk` (frozen black-first hero meshes - assume white text)
  · `.grad-spectrum` (12-hue sweep). On work surfaces use only the three washes: `.grad-wash` `.grad-glow` `.accent-grad-subtle`.
```

- [ ] **Step 3: DESIGN.md - add "The gradient library" section + vocabulary line**

(a) Insert a new section immediately after the "Primitive vocabulary (Spec 2)" table (before "## CSS-only / JS boundary"):

```markdown
## The gradient library

Gradients come in two provenance classes - treat them differently:

- **Frozen brand art** - `.grad-hero-ember` / `-ocean` / `-violet` / `-dusk`: the four sanctioned
  mesh hero masters, verbatim sRGB recreations of the downloadable assets. Black-first marketing
  heroes only (`data-surface="brand"`); assume white text; never re-tune the colours.
- **Palette-derived** - everything else resolves live from the palette/accent vars:
  `.grad-spectrum` (the 12-hue typology sweep; oklch-vivid where the engine supports in-oklch
  gradients, clean sRGB everywhere else), `.accent-grad-subtle` (low-opacity team wash), and
  `.grad-wash` / `.grad-glow` (accent tints). The three washes - `.grad-wash`, `.grad-glow`,
  `.accent-grad-subtle` - are the only gradients safe on work surfaces; everything else is
  hero/identity.

All gradients are **decorative**: never the sole carrier of meaning, never a work-surface heading
fill. Print drops every gradient to white automatically (and gradient-clipped text prints as solid
`--accent-fill`); forced-colors mode removes them. The contrast gate cannot check text-over-gradient -
the hero meshes' amber zones need a scrim if white text sits directly on them (render-verified).
```

(b) In "The token + class vocabulary", after the line ending `.progress .empty-state (+ __icon) .view-fade.`, add:

```markdown
The gradient library adds: `.accent-grad-subtle` `.grad-hero-ember` `.grad-hero-ocean`
`.grad-hero-violet` `.grad-hero-dusk` `.grad-spectrum` `.grad-wash` `.grad-glow`.
```

- [ ] **Step 4: docs/zha-brand-reference.md - §2.4 points at the shipped tokens**

Replace everything from the line `- **Gradient mesh backgrounds** are dark-base, soft-radial, downloadable hero assets. Four masters analysed, with CSS recreations (radial-gradient stacks on a near-black floor, no \`filter:blur\`):` through the line `Token as \`zha.gradient.mesh.{01,02,04,05}\`; convert stops to oklch with the palette. Text on these assumes \`color-scheme:dark\`; the amber zones (01/04/05) reach ~L35-40% - verify white-text contrast there.` (inclusive - this removes the inline ```css``` block) with:

```markdown
- **Gradient mesh backgrounds** are dark-base, soft-radial, downloadable hero assets. Four masters
  are **shipped as frozen sRGB tokens** - `--grad-hero-ember` (01), `--grad-hero-ocean` (02),
  `--grad-hero-violet` (04), `--grad-hero-dusk` (05, most brand-core; good homepage hero) - with
  matching `.grad-hero-*` utilities. Authored values live in
  `packages/tokens/src/semantic/core.tokens.json`; they are deliberately **not** oklch-converted
  (frozen art - see `docs/specs/2026-07-09-zha-ui-gradient-library-design.md`). Master 03 was not
  analysed and is not shipped. Text on these assumes `color-scheme:dark`; the amber zones
  (ember/violet/dusk) reach ~L35-40% - verify white-text contrast there (the gate can't see gradients).
```

Also append to the first bullet of §2.4 (the one ending `…both a **wayfinding tool** and a **decorative hero treatment**.`):

```markdown
 Shipped as `--grad-spectrum` / `.grad-spectrum`.
```

- [ ] **Step 5: Verify no contradictions or firm-name slips**

Run: `git grep -n "convert stops to oklch" -- '*.md'`
Expected: no matches (the superseded §2.4 instruction is gone).

Run: `git grep -niE "zaha[ -]?hadid" -- '*.md' ':!*.json'`
Expected: no new matches introduced by the edited prose (the firm is "ZHA").

- [ ] **Step 6: Commit**

```bash
git add AI-USAGE.md AGENTS.md DESIGN.md docs/zha-brand-reference.md
git commit -m "docs: gradient library vocabulary (hero meshes, spectrum, washes)"
```

---

### Task 4: Render-verify the library across light / dark / brand (manual, no commit)

The gate validates colour pairs, not gradients - every visual claim must be eyeballed. Proven method from Phase A: `file://` is blocked in Playwright MCP → serve the repo root over http.

**Files:**
- Create (throwaway, not committed): `_verify-grad.html` at the repo root; a tiny static server in the scratchpad.

- [ ] **Step 1: Build the shipped artifact**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens build && pnpm --filter @gitzhacode/zha-ui-css build`
Expected: `packages/css/dist/index.css` contains `--grad-hero-ember` and `.grad-spectrum`.

- [ ] **Step 2: Write the verify page at the repo root**

Create `_verify-grad.html` (relative CSS link so the served repo root resolves it):

```html
<!doctype html><html data-brand="es" data-theme="light" data-surface="work"><head>
<link rel="stylesheet" href="packages/css/dist/index.css">
<style>
  body{padding:32px;background:var(--bg-page);color:var(--text-default);font-family:var(--font-primary)}
  .row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:16px 0}
  .hero{height:180px;border-radius:8px;display:flex;align-items:flex-end;padding:16px;color:#fff}
  .band{height:40px;border-radius:8px;margin:16px 0}
  .panel{height:120px;border-radius:8px;border:1px solid var(--border-subtle);padding:16px}
</style></head><body>
  <span class="zha-lockup"><span class="zha-lockup__zha">ZHA</span><span class="zha-lockup__team">ES</span></span>
  <h1 class="accent-grad-text">Forever advancing</h1>
  <div class="row">
    <div class="hero grad-hero-ember">ember - white text</div>
    <div class="hero grad-hero-ocean">ocean - white text</div>
    <div class="hero grad-hero-violet">violet - white text</div>
    <div class="hero grad-hero-dusk">dusk - white text</div>
  </div>
  <div class="band grad-spectrum"></div>
  <div class="band" id="spectrum-srgb"></div>
  <div class="row" style="grid-template-columns:repeat(3,1fr)">
    <div class="panel grad-wash">wash</div>
    <div class="panel grad-glow">glow</div>
    <div class="panel accent-grad-subtle">team subtle</div>
  </div>
  <script>/* eyeball the sRGB fallback next to the oklch band */
    document.getElementById('spectrum-srgb').style.backgroundImage =
      getComputedStyle(document.documentElement).getPropertyValue('--grad-spectrum');
  </script>
</body></html>
```

- [ ] **Step 3: Serve the repo root and verify the three states**

Write a tiny node static server to the scratchpad, start it with `run_in_background` serving the **repo root**, navigate Playwright MCP to `http://localhost:<port>/_verify-grad.html`. For each of `data-theme`/`data-surface` = **light/work**, **dark/work**, **light/brand** (set via `browser_evaluate` on `document.documentElement`), screenshot and Read the PNG. Confirm:

- The 4 hero meshes render as soft radial glows over a near-black floor (not flat rectangles, not washed out) and match §2.4's characters (ember/terracotta · cobalt · violet+amber · indigo→gold).
- White caption text is legible on each mesh - pay attention to the amber zones (ember / violet / dusk). If any is illegible, note "consumer scrim required" in DESIGN.md's gradient section rather than re-tuning the frozen token.
- `.grad-spectrum` (top band) is a vivid, even 12-hue sweep; the `#spectrum-srgb` band below it shows the sRGB base - duller transitions are expected, but it must be a complete, un-broken sweep (this proves the fallback).
- `.grad-wash` / `.grad-glow` / `.accent-grad-subtle` read as *subtle* on the work surface and recolour with the ES teal (wash/glow) and teal→magenta (team subtle).
- The lockup "ES" and the `.accent-grad-text` heading still render teal→magenta (no regression from the new partial).

- [ ] **Step 4: Clean up**

Delete `_verify-grad.html`, stop the static server, remove screenshots + `.playwright-mcp/`. No commit (verification only). If a defect is found, fix it in the owning task's files, rebuild, re-verify, and commit the fix with a `fix(...)` message.

---

## Self-Review

**Spec coverage:**
- 4 frozen mesh tokens, verbatim §2.4 + base-floor layer → Task 1 ✓
- Spectrum sRGB base + `in oklch` variant, 12 stops → Task 1 ✓
- `--brand-grad-subtle`, `--grad-wash`, `--grad-glow` from live accent vars → Task 1 ✓
- Meshes never oklch-converted / emitted once → Task 1 (test) ✓
- `.grad-*` + `.accent-grad-subtle` utilities → Task 2 ✓
- Gradient-specific `@supports` swap (NOT `color: oklch()`) → Task 2 (code + negative test) ✓
- Print suppression + gradient-clipped-text print fix (incl. lockup, cascade-order aware) → Task 2 ✓
- forced-colors drop → Task 2 ✓
- reduced-motion: nothing needed (library is static) - spec honoured by omission ✓
- Docs: AI-USAGE / AGENTS / DESIGN / brand-ref §2.4 pointer → Task 3 ✓ (work-surface rule states all THREE washes consistently)
- llms.txt: vars automatic + decorative-only guidance line (tested) → Task 1 Step 3b ✓ (Spec-2 class-line staleness = pre-existing, flagged as follow-up)
- Render-verify incl. amber-zone white-text + sRGB fallback eyeball → Task 4 ✓
- Existing `.accent-grad` / `.accent-grad-text` / `--brand-grad` untouched (only print additions) ✓

**Placeholder scan:** none - every step carries exact JSON/CSS/test content and commands.

**Type/name consistency:** token names `--grad-hero-{ember,ocean,violet,dusk}`, `--grad-spectrum`, `--grad-spectrum-oklch`, `--grad-wash`, `--grad-glow`, `--brand-grad-subtle` are identical across Task 1 JSON, Task 1 tests, Task 2 CSS/tests, Task 3 docs, and Task 4's verify page; the `@supports (background-image: linear-gradient(in oklch, red, red))` string is identical in Task 2 code and test; class names in Task 3 docs match Task 2's selectors exactly.
