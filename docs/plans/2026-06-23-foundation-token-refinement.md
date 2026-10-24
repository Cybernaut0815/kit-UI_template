# Foundation Token Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retune the ZHA token foundation to a tighter register: 4/8/12px radii, 200/300ms motion plus a spring, a real tracking scale, a hero type step, denser spacing, and a border-first elevation model with a new overlay shadow. The change is strictly additive or value-only, so no consumer breaks.

**Architecture:** All changes are token-source edits (DTCG JSON) consumed by the existing multi-instance Style Dictionary build (`packages/tokens/style-dictionary.config.mjs`) → `dist/tokens.css`. Primitives pick up retuned *values* automatically (keys unchanged); new tokens are additive. No primitive-class changes (those are Spec 2). Each token task is test-first: a vitest assertion against the built `dist/tokens.css` locks the decided value.

**Tech Stack:** DTCG token JSON · Style Dictionary v4 · culori contrast gate · vitest · pnpm 9 + Turborepo.

**Spec:** `docs/specs/2026-06-23-zha-ui-foundation-refinement-design.md` (approved; visual reviewed; `--fs-hero` confirmed in). **Research:** `docs/research/2026-06-23-ui-foundations-research.md`.

## Global Constraints

- **ZHA brand locks - untouched:** ES = teal accent; the 12-hue typology palette; ZHA Sans (`--font-secondary`) always regular weight + upright, never bold/italic.
- **Contrast gate stays green:** `pnpm build` runs `scripts/contrast-matrix.mjs` (text 4.5 / non-text 3.0 across light, dark, brand). Expect `Contrast matrix: all pairs pass WCAG AA.` on every rebuild. The gate's `PAIRS` cover text/bg + accent/intent only - shadows are not gated, so `--shadow-high` adds no pair.
- **Closed vocabulary:** consumer/reference output uses `var(--…)` only; no hardcoded hex. Proposed *non-colour* literals (radius/motion/spacing px) are fine; shadow token values carry black-alpha rgba exactly as the existing `--shadow-low/mid` do.
- **Additive / value-only:** retuned values (radius, motion, tracking.display) keep their keys → consumers pick them up automatically. `--ease-spring`, `--fs-hero`, `--tracking-label/small`, `--space-10/12/16`, `--shadow-high`, `--row-h` are all new keys (additive). No key renames.
- **Don't restructure the SD build:** the multi-instance, byte-reproducible build is intentional. Edit token JSON only; do not collapse instances.
- **oklch dark blind-spot (just fixed):** the contrast gate validates source-intended values, not the emitted oklch `@supports` cascade. After any token change, **render-verify dark + brand in a real (oklch) browser**, not just `pnpm build`. (See `packages/tokens/test/build-output.test.ts`.)
- **Commits deferred:** per repo rule, do NOT commit or push until the maintainer explicitly asks. Each task ends at *build + gate + tests green* (its testable deliverable); keep the working tree clean and review diffs between tasks. A final commit happens only on explicit approval (Task 6).

---

### Task 1: Scale primitives - radius, motion, ease-spring, fs-hero, spacing

**Files:**
- Modify: `packages/tokens/src/primitive/scale.tokens.json`
- Test: `packages/tokens/test/build-output.test.ts`

**Interfaces:**
- Consumes: nothing (leaf token file).
- Produces (CSS custom properties in `:root` of `dist/tokens.css`): `--radius-s: 4px`, `--radius-m: 8px`, `--radius-l: 12px` (retuned); `--motion-base: 200ms`, `--motion-slow: 300ms` (retuned); `--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.1)` (new); `--fs-hero: 32px` (new); `--space-10: 40px`, `--space-12: 48px`, `--space-16: 64px` (new). `--radius-pill`, `--motion-fast`, `--ease-out/in`, `--fs-display` and below unchanged.

- [ ] **Step 1: Write the failing test**

Add to `packages/tokens/test/build-output.test.ts`, inside the existing `describe('token build', …)`:

```ts
  it('ships the retuned + extended scale primitives', () => {
    const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
    // radius tightened (value-only retune)
    expect(css).toContain('--radius-s: 4px');
    expect(css).toContain('--radius-m: 8px');
    expect(css).toContain('--radius-l: 12px');
    expect(css).toContain('--radius-pill: 999px');
    // motion tightened + spring added
    expect(css).toContain('--motion-fast: 150ms');
    expect(css).toContain('--motion-base: 200ms');
    expect(css).toContain('--motion-slow: 300ms');
    expect(css).toMatch(/--ease-spring:\s*cubic-bezier\(0\.175, 0\.885, 0\.32, 1\.1\)/);
    // hero type step + section spacing
    expect(css).toContain('--fs-hero: 32px');
    expect(css).toContain('--space-10: 40px');
    expect(css).toContain('--space-12: 48px');
    expect(css).toContain('--space-16: 64px');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /c/Users/aleksander.mastalski/repositories/zha-ui/packages/tokens && npx vitest run test/build-output.test.ts`
Expected: FAIL - current `dist` still has `--radius-s: 8px`, `--motion-base: 220ms`, and no `--ease-spring`/`--fs-hero`/`--space-10`.

- [ ] **Step 3: Edit `scale.tokens.json`**

Replace the file contents with (radius/motion retuned; `ease.spring`, `fs.hero`, `space.10/12/16` added; everything else identical):

```json
{
  "space": {
    "1": { "$type": "dimension", "$value": "4px" },
    "2": { "$type": "dimension", "$value": "8px" },
    "3": { "$type": "dimension", "$value": "12px" },
    "4": { "$type": "dimension", "$value": "16px" },
    "5": { "$type": "dimension", "$value": "20px" },
    "6": { "$type": "dimension", "$value": "24px" },
    "8": { "$type": "dimension", "$value": "32px" },
    "10": { "$type": "dimension", "$value": "40px" },
    "12": { "$type": "dimension", "$value": "48px" },
    "16": { "$type": "dimension", "$value": "64px" }
  },
  "radius": {
    "s": { "$type": "dimension", "$value": "4px" },
    "m": { "$type": "dimension", "$value": "8px" },
    "l": { "$type": "dimension", "$value": "12px" },
    "pill": { "$type": "dimension", "$value": "999px" }
  },
  "motion": {
    "fast": { "$type": "duration", "$value": "150ms" },
    "base": { "$type": "duration", "$value": "200ms" },
    "slow": { "$type": "duration", "$value": "300ms" }
  },
  "ease": {
    "out": { "$type": "other", "$value": "cubic-bezier(0.2, 0, 0, 1)" },
    "in": { "$type": "other", "$value": "cubic-bezier(0.4, 0, 1, 1)" },
    "spring": { "$type": "other", "$value": "cubic-bezier(0.175, 0.885, 0.32, 1.1)" }
  },
  "font": {
    "primary": { "$type": "fontFamily", "$value": "\"Neue Haas Unica\", \"Inter Variable\", system-ui, sans-serif" },
    "secondary": { "$type": "fontFamily", "$value": "\"ZHA Sans\", \"Neue Haas Unica\", system-ui, sans-serif" },
    "mono": { "$type": "fontFamily", "$value": "\"SF Mono\", Consolas, ui-monospace, monospace" },
    "zh": { "$type": "fontFamily", "$value": "\"Noto Sans SC\", \"Neue Haas Unica\", sans-serif" },
    "ar-display": { "$type": "fontFamily", "$value": "\"Noto Kufi Arabic\", sans-serif" },
    "ar-body": { "$type": "fontFamily", "$value": "\"Noto Sans Arabic\", sans-serif" }
  },
  "fs": {
    "hero": { "$type": "dimension", "$value": "32px" },
    "display": { "$type": "dimension", "$value": "24px" },
    "h2": { "$type": "dimension", "$value": "16px" },
    "h3": { "$type": "dimension", "$value": "14px" },
    "body": { "$type": "dimension", "$value": "13px" },
    "small": { "$type": "dimension", "$value": "12px" },
    "label": { "$type": "dimension", "$value": "11px" }
  }
}
```

- [ ] **Step 4: Rebuild and verify the test passes + gate green**

Run: `cd /c/Users/aleksander.mastalski/repositories/zha-ui && pnpm --filter @gitzhacode/zha-ui-tokens build && pnpm --filter @gitzhacode/zha-ui-tokens exec vitest run test/build-output.test.ts`
Expected: build prints `Contrast matrix: all pairs pass WCAG AA.`; the new test PASSES; the existing build-output tests still PASS.

- [ ] **Step 5: Verify no contrast regression across the whole build**

Run: `cd /c/Users/aleksander.mastalski/repositories/zha-ui && pnpm build`
Expected: `Tasks: 4 successful, 4 total`; `Contrast matrix: all pairs pass WCAG AA.` (radius/motion/type/space don't touch gated pairs).

---

### Task 2: Typography - tracking scale

**Files:**
- Modify: `packages/tokens/src/semantic/typography.tokens.json`
- Test: `packages/tokens/test/build-output.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (`:root`): `--tracking-display: -0.04em` (retuned from -0.03em); `--tracking-label: 0.01em`, `--tracking-small: 0.01em` (new). `--tracking-body: -0.01em`, `--leading-display/body` unchanged.

- [ ] **Step 1: Write the failing test**

Add to `packages/tokens/test/build-output.test.ts`:

```ts
  it('ships the tracking scale (display tighter; label/small positive)', () => {
    const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
    expect(css).toContain('--tracking-display: -0.04em');
    expect(css).toContain('--tracking-body: -0.01em');
    expect(css).toContain('--tracking-label: 0.01em');
    expect(css).toContain('--tracking-small: 0.01em');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /c/Users/aleksander.mastalski/repositories/zha-ui/packages/tokens && npx vitest run test/build-output.test.ts`
Expected: FAIL - `dist` has `--tracking-display: -0.03em` and no `--tracking-label`/`--tracking-small`.

- [ ] **Step 3: Edit `typography.tokens.json`**

Replace the file contents with:

```json
{
  "tracking": { "display": { "$type": "dimension", "$value": "-0.04em" },
                "body": { "$type": "dimension", "$value": "-0.01em" },
                "label": { "$type": "dimension", "$value": "0.01em" },
                "small": { "$type": "dimension", "$value": "0.01em" } },
  "leading":  { "display": { "$type": "number", "$value": 1.0 },
                "body": { "$type": "number", "$value": 1.2 } }
}
```

- [ ] **Step 4: Rebuild and verify the test passes + gate green**

Run: `cd /c/Users/aleksander.mastalski/repositories/zha-ui && pnpm --filter @gitzhacode/zha-ui-tokens build && pnpm --filter @gitzhacode/zha-ui-tokens exec vitest run test/build-output.test.ts`
Expected: `Contrast matrix: all pairs pass WCAG AA.`; tracking test PASSES; prior tests still PASS.

---

### Task 3: Elevation + density - `--shadow-high` and `--row-h`

**Files:**
- Modify: `packages/tokens/src/semantic/core.tokens.json` (add `shadow.high`, `row.h` comfortable)
- Modify: `packages/tokens/src/semantic/density.tokens.json` (add `row.h` compact)
- Test: `packages/tokens/test/build-output.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `--shadow-high: 0 8px 24px rgba(0,0,0,0.16)` in `:root`; `--row-h: 44px` in `:root` and `--row-h: 36px` in `[data-density="compact"]`. Existing `--shadow-low/mid`, `--control-h`, `--control-pad-y` unchanged.

- [ ] **Step 1: Write the failing test**

Add to `packages/tokens/test/build-output.test.ts`:

```ts
  it('ships shadow-high (overlay) and the row-h density token', () => {
    const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
    expect(css).toContain('--shadow-high: 0 8px 24px rgba(0,0,0,0.16)');
    expect(css).toMatch(/:root\s*\{[^}]*--row-h:\s*44px/s);
    const compact = css.slice(css.indexOf('[data-density="compact"]'));
    expect(compact).toContain('--row-h: 36px');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /c/Users/aleksander.mastalski/repositories/zha-ui/packages/tokens && npx vitest run test/build-output.test.ts`
Expected: FAIL - no `--shadow-high` or `--row-h` in `dist`.

- [ ] **Step 3: Edit `core.tokens.json`**

Add `high` to the `shadow` group and a new top-level `row` group. The `shadow` block becomes:

```json
  "shadow": {
    "low": { "$type": "shadow", "$value": "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.10)" },
    "mid": { "$type": "shadow", "$value": "0 4px 12px rgba(0,0,0,0.12)" },
    "high": { "$type": "shadow", "$value": "0 8px 24px rgba(0,0,0,0.16)" }
  },
  "row": {
    "h": { "$type": "dimension", "$value": "44px", "$description": "Comfortable table-row height. Compact density overrides to 36px." }
  }
```

(Add the `row` group as a sibling of `shadow`/`control`/`focus`; keep all other keys in `core.tokens.json` exactly as-is. Mind the trailing comma after the `shadow` block since `row` follows it.)

- [ ] **Step 4: Edit `density.tokens.json`**

Add a `row` group mirroring `control`:

```json
{
  "control": {
    "h":     { "$type": "dimension", "$value": "36px" },
    "pad-y": { "$type": "dimension", "$value": "6px" }
  },
  "row": {
    "h":     { "$type": "dimension", "$value": "36px" }
  }
}
```

- [ ] **Step 5: Rebuild and verify the test passes + gate green**

Run: `cd /c/Users/aleksander.mastalski/repositories/zha-ui && pnpm --filter @gitzhacode/zha-ui-tokens build && pnpm --filter @gitzhacode/zha-ui-tokens exec vitest run test/build-output.test.ts`
Expected: `Contrast matrix: all pairs pass WCAG AA.` (shadows aren't gated); shadow/row-h test PASSES; prior tests still PASS.

- [ ] **Step 6: Render-verify `--shadow-high` reads on dark + brand**

Per the oklch blind-spot constraint, confirm the new overlay shadow is visible (not lost) on the dark and brand surfaces using the static-server + Playwright pattern (HANDOFF §4): serve the repo, open the foundation reference (its Elevation section renders `--shadow-high`), screenshot in `data-theme="dark"` and `data-surface="brand"`. Expected: the `high / modal` tier reads as a clear overlay shadow on dark; if it disappears, note it for a follow-up tune (value-only; not blocking this task).

---

### Task 4: Documentation - elevation philosophy + new tokens

**Files:**
- Modify: `DESIGN.md` (elevation philosophy; `--fs-hero`; `--row-h` in the density section)
- Modify: `AI-USAGE.md` (add the new tokens to its variable lists - only if it hand-enumerates the affected groups)
- Verify: `README.md` (category-level; confirm no token-level change needed), `packages/tokens/dist/llms.txt` (auto-regenerated)

**Interfaces:**
- Consumes: the tokens shipped in Tasks 1-3.
- Produces: human + AI docs that describe the border-first elevation model and the new tokens, keeping the closed vocabulary complete.

- [ ] **Step 1: Add the elevation philosophy to `DESIGN.md`**

Add a new `## Depth & elevation` section after the `## Two things you get for free` section:

```markdown
## Depth & elevation

Depth is **border-first**. Passive surfaces - `.surface`, `.card`, stat tiles, table
rows - are separated by a 1px hairline (`--border-subtle`), not a shadow. Shadows are
reserved for layers that genuinely float above the page:

- `--shadow-low` - a subtle raise (use sparingly).
- `--shadow-mid` - popovers, menus, dropdowns.
- `--shadow-high` - modals and full overlays.

The reasoning (and the wider system survey behind it) is in
`docs/research/2026-06-23-ui-foundations-research.md`. A 1px hairline reads as
engineered; stacked shadows read as consumer-app. When in doubt, use the border.
```

- [ ] **Step 2: Note `--fs-hero` and `--row-h` in `DESIGN.md`**

In the `### data-density: when "compact"` subsection, append after the existing paragraph:

```markdown

Tables get a parallel knob: `--row-h` (44px comfortable / 36px compact) sets row
height through the density axis, so a data table densifies with the page instead of
hardcoding heights.
```

And add a one-line note about the hero step where the token vocabulary is introduced - at the end of the `## The token + class vocabulary` section:

```markdown

> Type scale tops out at `--fs-display` (24px) for in-app headings; `--fs-hero` (32px)
> is an optional larger step for marketing/landing headlines on the brand surface.
```

- [ ] **Step 3: Update `AI-USAGE.md` if it hand-lists tokens**

Read `AI-USAGE.md`. If it enumerates the motion / ease / type-size / tracking / shadow / density variable groups, add the new members so the published vocabulary stays complete: `--ease-spring`, `--fs-hero`, `--tracking-label`, `--tracking-small`, `--space-10`, `--space-12`, `--space-16`, `--shadow-high`, `--row-h`. Match the file's existing formatting. If it only points at `llms.txt`, leave it (llms.txt regenerates automatically).

- [ ] **Step 4: Confirm README + llms.txt**

Read `README.md`: it lists token *categories* ("type scale, spacing, motion"), which remain accurate - confirm no token-level edit is needed and leave it unless a category is now wrong.
Run: `grep -E "ease-spring|fs-hero|shadow-high|row-h|tracking-label" packages/tokens/dist/llms.txt`
Expected: `--ease-spring`, `--fs-hero`, `--shadow-high`, `--row-h`, `--tracking-label` all present (the `zha/llms` format includes these groups; `--space-*` is intentionally excluded from llms.txt). This confirms the AI context file regenerated with the additions.

- [ ] **Step 5: Build still green**

Run: `cd /c/Users/aleksander.mastalski/repositories/zha-ui && pnpm build`
Expected: `Tasks: 4 successful, 4 total`; `Contrast matrix: all pairs pass WCAG AA.` (docs don't affect the build, but confirm nothing was left half-edited).

---

### Task 5: Re-point the foundation reference to living documentation

**Files:**
- Modify: `examples/foundation-reference/index.html`

**Context:** The reference was built as a Current-vs-Proposed approval device, with proposed values pinned in a `.is-proposed` `<style>` override. Now that the proposed values are the live tokens, a live "Current" column would render the *new* values too - so a truthful before/after live demo is no longer possible. Convert the page to single-specimen living docs rendered on the live (shipped) tokens, and keep the delta tables as the permanent record of what this refinement changed.

**Interfaces:**
- Consumes: the shipped tokens (Tasks 1-3) via `../../packages/css/dist/index.css`.
- Produces: living documentation of the foundation; no Current/Proposed split.

- [ ] **Step 1: Remove the proposed-override block**

Delete the entire `.is-proposed { … }` rule from the page `<style>` (the block that overrides `--radius-*`, `--motion-*`, `--ease-spring`, `--tracking-*`, `--shadow-high`, `--fs-hero`, `--space-10/12/16`, `--row-h`). The page now renders only on the live bundle.

- [ ] **Step 2: Collapse each comparison to a single specimen (worked example: §01 Radius)**

For the Radius section, delete the `.fr-col` "Current" column and the `is-proposed` class + "Proposed" tag on the second, leaving one specimen group. Result:

```html
    <section class="fr-sec">
      <div class="fr-sec__head">
        <span class="fr-num">01</span><h2>Radius</h2>
        <span class="fr-delta fr-mono">s 4 · m 8 · l 12 · pill 999</span>
      </div>
      <p class="fr-lead">Sharper corners read engineered, not consumer-app (cue&nbsp;#2).</p>
      <div class="fr-col">
        <div class="fr-row">
          <span class="fr-swatch fr-r-s">s</span>
          <span class="fr-swatch fr-r-m">m</span>
          <span class="fr-swatch fr-r-l">l</span>
        </div>
        <div class="fr-row" style="margin-top: var(--space-4)">
          <span class="chip">chip</span><button class="btn btn--primary">Button</button>
        </div>
      </div>
      <table class="fr-tok">
        <thead><tr><th>token</th><th>was</th><th>now</th><th>use</th></tr></thead>
        <tbody>
          <tr><td>--radius-s</td><td>8px</td><td class="fr-to">4px</td><td>badges, chips, tags</td></tr>
          <tr><td>--radius-m</td><td>10px</td><td class="fr-to">8px</td><td>buttons, inputs, controls</td></tr>
          <tr><td>--radius-l</td><td>14px</td><td class="fr-to">12px</td><td>cards, panels, surfaces</td></tr>
          <tr><td>--radius-pill</td><td colspan="2">999px (unchanged)</td><td>pills</td></tr>
        </tbody>
      </table>
    </section>
```

- [ ] **Step 3: Apply the same transform to §02 - §05**

Apply the identical structural change to the Elevation, Motion, Type & tracking, and Spacing & density sections: drop the duplicate column, remove `is-proposed` tags, and rename each delta table's header columns from `current`/`proposed` to `was`/`now` (the literal values already in those tables are the permanent changelog). The Elevation ladder and the density compact rows already demonstrate live tokens - keep them. Leave the Locked section unchanged.

- [ ] **Step 4: Update the hero + footer copy to present tense**

Change the hero so it documents the shipped foundation rather than a proposal. Eyebrow stays `Foundation · Spec 1 of 2`. Replace the lead with:

```html
      <p class="fr-hero__lead">The ZHA token foundation, tuned for an engineered register:
        sharper corners, depth from borders, faster motion with a spring, a real tracking
        scale, and a denser rhythm. Everything below renders on the live ZHA tokens; each
        section's <strong>was → now</strong> table records what this refinement changed.
        Colour, type and the typology palette are unchanged.</p>
```

Keep the locked-invariants row as-is. Leave the footer note about brand-font fallback.

- [ ] **Step 5: Render-verify (light + dark)**

Using the static-server + Playwright pattern (HANDOFF §4 - `file://` is blocked): serve the repo, navigate to `http://localhost:<port>/examples/foundation-reference/`, screenshot light, flip `data-theme="dark"`, screenshot dark. Expected: every section renders on live tokens, all text legible in both themes (confirms the oklch fix holds), no Current/Proposed duplication remains. Stop the server and delete screenshots + any `.playwright-mcp/` scratch afterward.

---

### Task 6: Commit (only on explicit maintainer approval)

**Files:** none (version control only).

- [ ] **Step 1: Present the full diff and request approval**

Show `git status` + `git diff --stat` for: `packages/tokens/src/primitive/scale.tokens.json`, `packages/tokens/src/semantic/{core,typography,density}.tokens.json`, `packages/tokens/test/build-output.test.ts`, `packages/tokens/style-dictionary.config.mjs` (+ test) [the oklch dark-mode fix landed this session], `DESIGN.md`, `AI-USAGE.md` (if changed), `examples/foundation-reference/index.html`. Note that `dist/` is gitignored (rebuilt).

- [ ] **Step 2: On approval, commit on `phase-0-foundation` (no push unless asked)**

Suggested grouping (the maintainer may prefer one commit):

```bash
git add packages/tokens/style-dictionary.config.mjs packages/tokens/test/build-output.test.ts
git commit -m "fix(tokens): oklch dark overlay dropped {alias} overrides - dark text rendered light-on-dark"

git add packages/tokens/src
git commit -m "feat(tokens): refine foundation - radius/motion/spring/hero/tracking/spacing/shadow-high/row-h"

git add DESIGN.md AI-USAGE.md examples/foundation-reference
git commit -m "docs(tokens): border-first elevation philosophy + foundation reference as living docs"
```

Expected: clean tree; gate green; 22+ tests pass. Do NOT push or merge to `main` (publish is deferred - see `publish-deferred` memory).

---

## Self-Review

**Spec coverage** (`docs/specs/2026-06-23-…`):
- §1 Radius (s4/m8/l12, pill unchanged) → Task 1 ✓
- §2 Elevation (keep low/mid, add `--shadow-high`; border-first rule documented) → Task 3 (token) + Task 4 (philosophy in DESIGN.md) ✓. Primitive-class border-first retrofit is Spec 2 (out of scope here) ✓.
- §3 Motion (base→200, slow→300, add `--ease-spring`) → Task 1 ✓
- §4 Typography (display→-0.04, add label/small +0.01, add `--fs-hero` - confirmed in by maintainer) → Task 1 (`--fs-hero`) + Task 2 (tracking) ✓
- §5 Spacing & density (add space-10/12/16, add `--row-h`) → Task 1 (spacing) + Task 3 (`--row-h`) ✓
- §6 Visual presentation (built + render-verified this session; reconciled to living docs) → done + Task 5 ✓
- §8 gate re-run after elevation; additive keys; ES/teal/typology/ZHA-Sans untouched → Global Constraints + per-task build steps ✓

**Placeholder scan:** every code/JSON step shows full content; every command has expected output. No TBD/TODO. ✓

**Type consistency:** token names used in tests match the `name/no-default` kebab output (`--radius-s`, `--ease-spring`, `--fs-hero`, `--tracking-label`, `--shadow-high`, `--row-h`); `row.h` → `--row-h` (no DEFAULT sentinel). Density `--row-h` (36px) and core `--row-h` (44px) share the key, mirroring `--control-h`. ✓

Next step: ask the maintainer to approve the Task 6 commit.
