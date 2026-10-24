# zha-ui Agent-first Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the brand meshes on the gradient showcase, align the bleed hero with the container, close the fourteen open review items, and give ZHA UI an Agent Skills `SKILL.md` plus an agent-first quick start, all on `feat/composition-layer` before the 0.1.3 PR.

**Architecture:** Ten tasks. One adds images and a page section; one changes a single CSS rule; two change control-state and navigation CSS with tests; two harden tests and tooling (a `block()` helper, a JSX transform for the shared drift guard); one edits examples and status documents; one builds the skill and restructures AGENTS.md around it; one rewrites the README and hub quick start; the last ties up the changeset, notes, spec amendments and the render-verify. Every CSS change keeps the Spec 3 cascade contract: zero-specificity opt-outs, equal-specificity rules ordered by the fixed `PARTIALS` list, one disabled value across the package. One new class ships, `.skip-link`.

**Tech Stack:** pnpm 9 workspace, turbo, Style Dictionary 4 (`packages/tokens`), plain CSS partials concatenated by `packages/css/build.mjs`, vitest (regex tests over `dist/`), node:test for the drift guard, Vite 5 + React 18 for the React starter, Playwright (playwright-core with the Edge channel, installed in the session scratchpad, never in the repo) for image encoding and the render-verify.

**Spec:** [`docs/specs/2026-10-06-zha-ui-agent-first-pass-design.md`](../specs/2026-10-06-zha-ui-agent-first-pass-design.md). Spec 3, [`docs/specs/2026-09-30-zha-ui-composition-layer-design.md`](../specs/2026-09-30-zha-ui-composition-layer-design.md), stays the authority for the composition layer; Task 10 appends a dated §13 to it. Line numbers below are from the branch tip `ca82c5a`; where an earlier task shifts them, find the anchor by the quoted text or the `it(` title.

## Global Constraints

This section copies the constraints from the 2026-10-02 plan, AGENTS.md and the spec. Every task's requirements include this section.

- **The one hard rule (AGENTS.md):** "Use only the published zha-ui CSS variables and primitive classes. Never invent a CSS custom property (e.g. `--color-primary`). Never hard-code a hex value." The CSS package may define the one new class this plan names (`.skip-link`) and no new custom property; `--container-w` on `.hero--bleed` is the existing knob.
- **The firm is "ZHA"** - always. Never spell out its former name.
- **ZHA Sans (`--font-secondary`) is always regular weight and upright** - never bold or italic, never below 24 px, only in the lockup, the logo, `.hero > h1` and the decks.
- Sentence case for headings and body; UPPERCASE only for chip labels and `.eyebrow`.
- Icons are inline stroke SVGs in `currentColor` at 16, 20 or 24 px - never emoji, never solid glyph fonts.
- `[data-brand]` beating `[data-theme="dark"]` on branded pages is intended - do not "fix" it.
- `.app-bar__brand` keeps its regular ZHA Sans fallback.
- The cascade order is the fixed `PARTIALS` list in `packages/css/build.mjs` (`base, type, gradient, layout, nav, content, feedback, overlay, menu`) - never glob. Equal-specificity rules are ordered by that list and by position inside a partial.
- Every hover guard is `:where(:not(:disabled))`, never a bare `:not(:disabled)`.
- `dist/` is generated and gitignored - never `git add` under it. Stage `src/**`, `test/**`, `skills/**`, docs and examples.
- **Never `git push`, never merge.** Work on the existing branch `feat/composition-layer` (48 commits past `main`, tip `91f6ced`, which added only this spec and plan over `ca82c5a`); commit per task; the maintainer opens the PR. Do not commit in any other repo (Task 7 edits `zh-es-hub/PORTS.md` and leaves it uncommitted, because that working tree already holds the maintainer's uncommitted edits).
- No new dependencies in any package. Image encoding and the render-verify use a scratch folder outside the repo that holds `playwright-core` (Edge channel), called "the playwright folder" below: `C:\Users\aleksander.mastalski\AppData\Local\Temp\claude\c--Users-aleksander-mastalski-repositories-zha-ui\0333618f-00d5-4f80-8415-e68c72b86325\scratchpad\playwright-run`. If it is missing, create `playwright-run` in your own scratchpad, run `npm init -y` and `npm i playwright-core` there, never in the repo. Run every Playwright script from Git Bash (the Bash tool); a PowerShell form is given where quoting differs.
- Images are committed only under `examples/gradient-showcase/assets/`, never under `packages/`.
- Gates for "done" on every task: `pnpm build` green (it runs the contrast gate and the example drift guards), `pnpm test` green, `pnpm lint` clean. Test counts at `ca82c5a`: css 79, tokens 44, runtime 2, drift guard 21.
- The five visible departures already accepted stand (11 px hero eyebrow, giant hub lockup, 16 px React icons, 16 px alert icon, hamburger hidden above 768 px). This plan changes no further visible default for a 0.1.2 consumer: `.hero--bleed` and `.skip-link` are new in 0.1.3.
- New prose in the README, AGENTS.md, DESIGN.md, the skill, the spec amendments, the consumer notes and the changeset is semi-formal British English with ASCII hyphens only (no em or en dashes); new code comments use ASCII hyphens too. Existing lines are left as they are unless a step names them.
- AGENTS.md stays at or under 260 lines.
- Inline `style=` attributes in the hub, the vanilla starter and the React starter may set only the knob allowlist: `--container-w`, `--grid-min`, `--stack-gap`, `--split-aside`, `--control-h`, `--dialog-w`, `--sidebar-w`, `--zha-logo-h`, `--zha-lockup-size`. The gradient showcase and the foundation reference are exempt (their guards do not set `inlineKnobsOnly`).
- `skills/zha-ui/SKILL.md` is the only `SKILL.md` in the repo.
- Every task's **Model** line follows the per-task tag rule: `implementer=<haiku|sonnet|opus|fable>, reviewer=<sonnet|opus|fable>`; the reviewer is never below sonnet.

## Review Focus

These input classes are implied by the spec but no existing test pins them; each is pinned in the task named.

1. A landing page that narrows its column (`<main class="container" style="--container-w: 64rem">`) keeps the hero aligned only when the hero carries the same knob; with the default column the two edges are equal at 1440 and 390 px - pinned in Task 2 (test and render check).
2. An `<a class="btn" aria-disabled="true">` neither hovers nor lifts, and a disabled `.chip__remove` paints no hover wash - pinned in Task 3.
3. A keyboard user tabbing from the address bar reaches the skip link first and sees it; a mouse user never sees it - pinned in Task 4 (test) and Task 10 (render).
4. A template className with a prefix (`` `badge badge--${tone}` ``) is not reported as a missing class, while a plain typo (`clsuter`) is, and a non-knob inline style object is reported - pinned in Task 6.
5. The repo holds exactly one `SKILL.md`, its `name` equals its folder, and every class in `classes.txt` appears in `reference.md` - pinned in Task 8.

---

### Task 1: Brand meshes on the gradient showcase

**Files:**
- Create: `examples/gradient-showcase/assets/zha-gradient-mesh-01.webp`, `-02.webp`, `-04.webp`, `-05.webp`, `examples/gradient-showcase/assets/README.md`
- Modify: `examples/gradient-showcase/index.html:22-24` (insert a section between the intro `<p>` and the hero-mesh `<section data-surface="brand"`)
- Modify: `.gitattributes` (append one line after `*.woff2 binary`)

**Model:** implementer=sonnet, reviewer=sonnet - one page, an encode step, prose-described markup

**Interfaces:**
- Consumes: the four PNGs on `\\zaha-hadid.com\Data\Projects\__Z_H_A__Brand_Assets\BRAND ASSETS\ZHA_Colour\ZHA_Gradients` (read-only; never modify the share) and the bundle classes `.grad-hero-ember`, `.grad-hero-ocean`, `.grad-hero-violet`, `.grad-hero-dusk`.
- Produces: the four asset paths Task 10 renders.

- [ ] **Step 1: Encode the four meshes**

Write this script as `encode-meshes.mjs` in the playwright folder (Global Constraints) and run it from there, after creating the assets folder (`mkdir -p /c/Users/aleksander.mastalski/repositories/zha-ui/examples/gradient-showcase/assets`). Run it from PowerShell (Git Bash's path conversion mangles the UNC path):

```powershell
node encode-meshes.mjs '\\zaha-hadid.com\Data\Projects\__Z_H_A__Brand_Assets\BRAND ASSETS\ZHA_Colour\ZHA_Gradients' 'C:\Users\aleksander.mastalski\repositories\zha-ui\examples\gradient-showcase\assets'
```

```js
// encode-meshes.mjs - one-off: 1600 px wide WebP copies of the brand meshes through Chromium's canvas encoder.
// Usage: node encode-meshes.mjs <share folder> <repo assets folder>
import { chromium } from 'playwright-core';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
const [src, out] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
for (const f of readdirSync(src).filter((n) => /^ZHA Gradient mesh backgrounds-\d\d\.png$/.test(n))) {
  const data = 'data:image/png;base64,' + readFileSync(path.join(src, f)).toString('base64'); // about:blank cannot load file:// images
  const [b64, h] = await page.evaluate(async ([data, w, q]) => {
    const img = new Image(); img.src = data; await img.decode();
    const c = document.createElement('canvas'); c.width = w; c.height = Math.round(img.naturalHeight * w / img.naturalWidth);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return [c.toDataURL('image/webp', q).split(',')[1], c.height];
  }, [data, 1600, 0.9]);
  const name = f.replace('ZHA Gradient mesh backgrounds-', 'zha-gradient-mesh-').replace('.png', '.webp');
  writeFileSync(path.join(out, name), Buffer.from(b64, 'base64'));
  console.log(name, `1600x${h}`, Math.round(statSync(path.join(out, name)).size / 1024) + ' KB');
}
await browser.close();
```

Expected: four lines, `zha-gradient-mesh-01.webp 1600x900 13 KB` and so on (01, 02 and 04 are 900 tall, 05 is 899); every file under 20 KB. If any file is over 40 KB, stop and report.

- [ ] **Step 2: Write the assets README**

Create `examples/gradient-showcase/assets/README.md`:

```markdown
# Brand gradient meshes

The graphic design team keeps the originals on the brand assets share, `\\zaha-hadid.com\Data\Projects\__Z_H_A__Brand_Assets\BRAND ASSETS\ZHA_Colour\ZHA_Gradients`: `ZHA Gradient mesh backgrounds-01.png`, `-02`, `-04` and `-05` (their numbering skips 03), each a 3991 x 2245 px PNG of 0.6 to 0.8 MB, dated 29 September 2025. The originals stay on the share.

The copies here are 1600 px wide WebP files at quality 90, encoded on 2026-10-06 through Chromium's canvas encoder; the script is in `docs/plans/2026-10-06-zha-ui-agent-first-pass.md`, Task 1. Re-encode from the share if the team updates the originals.
```

- [ ] **Step 3: Mark WebP binary**

In `.gitattributes`, after the line `*.woff2 binary`, add:

```
*.webp binary
```

- [ ] **Step 4: Add the section to the showcase**

In `examples/gradient-showcase/index.html`, directly after the intro paragraph that ends `Never use gradients as a work-surface heading fill.</p>` (line 22) and before `<section data-surface="brand" style="border-radius: var(--radius-l);` (line 24), insert:

```html
    <section style="margin-bottom: var(--space-8)">
      <p style="margin: 0 0 var(--space-3); font-family: var(--font-mono); font-size: var(--fs-label); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted)">Source material - the graphic design team's gradient meshes</p>
      <p style="max-width: 52rem; margin: 0 0 var(--space-4); color: var(--text-muted-strong)">The hero meshes in the next section are CSS approximations of these four images, which the graphic design team keeps on the brand assets share under <code>ZHA_Colour\ZHA_Gradients</code>. Each original sits beside its CSS twin; the page shows a 1600 px copy of each 3991 x 2245 px file.</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: var(--space-5)">
        <figure style="margin: 0; display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-2)">
          <img src="./assets/zha-gradient-mesh-01.webp" alt="Brand gradient mesh 01: plum fading to rust" width="1600" height="900" style="inline-size: 100%; block-size: 100%; object-fit: cover; display: block; border-radius: var(--radius-m)">
          <div class="grad-hero-ember" style="border-radius: var(--radius-m)" aria-hidden="true"></div>
          <figcaption style="grid-column: 1 / -1; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">ZHA Gradient mesh backgrounds-01.png</span> - CSS twin <span style="font-family: var(--font-mono)">.grad-hero-ember</span></figcaption>
        </figure>
        <figure style="margin: 0; display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-2)">
          <img src="./assets/zha-gradient-mesh-02.webp" alt="Brand gradient mesh 02: teal fading to royal blue" width="1600" height="900" style="inline-size: 100%; block-size: 100%; object-fit: cover; display: block; border-radius: var(--radius-m)">
          <div class="grad-hero-ocean" style="border-radius: var(--radius-m)" aria-hidden="true"></div>
          <figcaption style="grid-column: 1 / -1; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">ZHA Gradient mesh backgrounds-02.png</span> - CSS twin <span style="font-family: var(--font-mono)">.grad-hero-ocean</span></figcaption>
        </figure>
        <figure style="margin: 0; display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-2)">
          <img src="./assets/zha-gradient-mesh-04.webp" alt="Brand gradient mesh 04: a magenta arc on charcoal with an amber edge" width="1600" height="900" style="inline-size: 100%; block-size: 100%; object-fit: cover; display: block; border-radius: var(--radius-m)">
          <div class="grad-hero-violet" style="border-radius: var(--radius-m)" aria-hidden="true"></div>
          <figcaption style="grid-column: 1 / -1; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">ZHA Gradient mesh backgrounds-04.png</span> - CSS twin <span style="font-family: var(--font-mono)">.grad-hero-violet</span></figcaption>
        </figure>
        <figure style="margin: 0; display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-2)">
          <img src="./assets/zha-gradient-mesh-05.webp" alt="Brand gradient mesh 05: indigo fading to gold" width="1600" height="899" style="inline-size: 100%; block-size: 100%; object-fit: cover; display: block; border-radius: var(--radius-m)">
          <div class="grad-hero-dusk" style="border-radius: var(--radius-m)" aria-hidden="true"></div>
          <figcaption style="grid-column: 1 / -1; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">ZHA Gradient mesh backgrounds-05.png</span> - CSS twin <span style="font-family: var(--font-mono)">.grad-hero-dusk</span></figcaption>
        </figure>
      </div>
    </section>

```

Why `object-fit: cover` with `block-size: 100%`: the image and the swatch share a grid row, so the swatch takes the image's height and the image never letterboxes.

- [ ] **Step 5: Gate**

Run: `pnpm build 2>&1 | grep -E "gradient-showcase|error"`
Expected: among the `zha-ui-gradient-showcase:build:` lines (turbo prints the cache line and the `>` command lines too), one ending `gradient-showcase: N vars all bundle tokens, CSS balanced, no hardcoded colour ✓` and no error line. Then open `examples/gradient-showcase/index.html` in Edge at 1440 px (or run a Playwright screenshot from the scratchpad) and confirm: the new section is first, four figures, each image and swatch the same height, captions under both.

- [ ] **Step 6: Commit**

```bash
git add examples/gradient-showcase/assets examples/gradient-showcase/index.html .gitattributes
git commit -m "feat(examples): the graphic design team's gradient meshes on the showcase, beside their CSS twins"
```

---

### Task 2: The bleed hero pads to the container edge

**Files:**
- Modify: `packages/css/src/primitives/layout.css:57` (`.hero--bleed`), `:72` (the 768 px `.hero` padding), `:74` (the 640 px block)
- Modify: `packages/css/test/exports.test.ts:411` (the `.hero--bleed` regex), `:426` (the 768 px hero regex), after `:434` (the 640 px regex)
- Modify: `AI-USAGE.md` (the `.hero--bleed` row of the class cheat-sheet), `DESIGN.md:215` (the `.hero` row's modifier cell) and `:226-227` (the `.hero--bleed` sentence)

**Model:** implementer=sonnet, reviewer=opus - one rule, but it sits in the cascade's media order and a pinned test

**Interfaces:**
- Consumes: `.container { --container-w: 72rem; inline-size: min(100% - 2 * var(--gutter), var(--container-w)); margin-inline: auto; }` at `layout.css:28`, which must not change (pinned at `exports.test.ts:396`).
- Produces: `.hero--bleed` with `padding-inline: max(var(--gutter), (100% - var(--container-w)) / 2)`, which Task 10 measures and the skill documents.

- [ ] **Step 1: Pin the new rules (tests first)**

In `packages/css/test/exports.test.ts`, replace line 411 (the `.hero--bleed` assertion; line 412 is the `.hero > h1` test, leave it):

```ts
    expect(css).toMatch(/\.hero--bleed\s*\{\s*border-radius:\s*0/);
```

with:

```ts
    expect(css).toMatch(/\.hero--bleed\s*\{\s*--container-w:\s*72rem;\s*border-radius:\s*0;\s*padding-inline:\s*max\(var\(--gutter\), \(100% - var\(--container-w\)\) \/ 2\)/);   // the text edge meets the .container edge below it
```

Replace line 426:

```ts
    expect(phone).toMatch(/\.hero\s*\{\s*padding:\s*var\(--space-10\) var\(--space-5\)/);
```

with:

```ts
    expect(phone).toMatch(/\.hero\s*\{\s*padding-block:\s*var\(--space-10\)/);
    expect(phone).toMatch(/\.hero:where\(:not\(\.hero--bleed\)\)\s*\{\s*padding-inline:\s*var\(--space-5\)/);   // the bleed hero keeps the container's edge at phone width
```

After the line that matches `@media \(max-width: 640px\)` (line 434), add:

```ts
    expect(css).toMatch(/@media \(max-width: 640px\)\s*\{\s*\.container\s*\{[^}]*\}\s*\.app-bar\s*\{[^}]*\}\s*\.hero--bleed\s*\{\s*--gutter:\s*var\(--space-4\);\s*\}/);   // the gutter drop reaches the bleed hero too
```

- [ ] **Step 2: Run the test to see it fail**

Run: `pnpm --filter @gitzhacode/zha-ui-css test 2>&1 | grep -E "✓|×|failed|passed"`
Expected: `hero keeps gradient classes paintable` and `collapses the app shell at phone width` fail; the rest pass.

- [ ] **Step 3: Change the CSS**

In `packages/css/src/primitives/layout.css`, replace line 57:

```css
.hero--bleed { border-radius: 0; } /* full-width hero outside the container drops the panel radius */
```

with:

```css
.hero--bleed { --container-w: 72rem; border-radius: 0; padding-inline: max(var(--gutter), (100% - var(--container-w)) / 2); } /* full-width hero outside the container: no panel radius, and the text edge meets the .container edge below it (the same max() as the container's auto margin). A page that narrows its column sets the same --container-w on both */
```

Replace line 72 (inside the 768 px block):

```css
  .hero { padding: var(--space-10) var(--space-5); }
```

with:

```css
  .hero { padding-block: var(--space-10); }
  .hero:where(:not(.hero--bleed)) { padding-inline: var(--space-5); } /* :where(): stays (0,1,0); the bleed hero keeps its container-edge padding */
```

Replace line 74:

```css
@media (max-width: 640px) { .container { --gutter: var(--space-4); } .app-bar { gap: var(--space-2); } } /* lockup + three icon buttons + the primary fit a 390px bar only at the tighter gap */
```

with:

```css
@media (max-width: 640px) { .container { --gutter: var(--space-4); } .app-bar { gap: var(--space-2); } .hero--bleed { --gutter: var(--space-4); } } /* lockup + three icon buttons + the primary fit a 390px bar only at the tighter gap; the bleed hero follows the container's gutter */
```

- [ ] **Step 4: Update the vocabulary row**

In `AI-USAGE.md`, replace the row:

```
| `.hero--bleed` | Full-width landing hero outside the container (radius 0) |
```

with:

```
| `.hero--bleed` | Full-width landing hero outside the container (radius 0); its side padding equals the `.container` margin, so the text lines up with the column below. A page that narrows its column sets the same `--container-w` on the hero |
```

In `DESIGN.md` line 215, change the cell `` `.hero--bleed` (radius 0, for the full-width landing hero) `` to `` `.hero--bleed` (radius 0, sides padded to the container edge; for the full-width landing hero) ``. In lines 226-227, change `Add `.hero--bleed` for the full-width landing hero outside the container; it drops the panel radius, because` to `Add `.hero--bleed` for the full-width landing hero outside the container; it pads its sides to the `.container` edge, so the hero text lines up with the column below, and it drops the panel radius, because` (rewrap to the file's 100-column style).

- [ ] **Step 5: Gate**

Run `pnpm build`, then `pnpm test`.
Expected: build `Tasks: 11 successful`; test: css 79 passed, tokens 44, runtime 2, `Tasks: 14 successful`. Turbo colours the vitest summary line, so read the counts rather than matching the text byte for byte.

Then write `hero-edge.mjs` in the playwright folder and run it from Git Bash:

```js
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'msedge' });
for (const w of [1440, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto('file:///C:/Users/aleksander.mastalski/repositories/zha-ui/examples/index.html');
  console.log(w, await page.evaluate(() => [document.querySelector('.hero--bleed .eyebrow').getBoundingClientRect().left, document.querySelector('main.container').getBoundingClientRect().left]));
}
await browser.close();
```

Expected: at 1440 both numbers equal (about 136 to 144 px, depending on the scrollbar); at 390 both are `16`. Unequal numbers mean stop and report.

- [ ] **Step 6: Commit**

```bash
git add packages/css/src/primitives/layout.css packages/css/test/exports.test.ts AI-USAGE.md DESIGN.md
git commit -m "fix(css): .hero--bleed pads to the container edge so the hero text lines up with the column below"
```

---

### Task 3: Control states - chip remove guard, aria-disabled links, reduced transparency, forced colours

**Files:**
- Modify: `packages/css/src/primitives/base.css:56` (the disabled list), `:101` (`.chip__remove:hover`)
- Modify: `packages/css/src/primitives/layout.css:11` (after the `@supports not` line)
- Modify: `packages/css/src/primitives/nav.css:8` (after the `::before` rule)
- Modify: `packages/css/src/primitives/content.css:16` (after `.badge .dot`)
- Modify: `packages/css/test/exports.test.ts:332` (the chip-remove hover regex), `:477` (the disabled-list regex), `:483` (the guarded-hover loop), `:486` (the unguarded-hover alternation), and a new `it(` after the `controls have hover, pressed and one disabled value` block (ends before `it('card has default padding`)
- Modify: `AI-USAGE.md` (the `.btn` and `.chip__remove` rows)

**Model:** implementer=sonnet, reviewer=opus - four partials, cascade-sensitive, Review Focus 2

**Interfaces:**
- Consumes: the one disabled rule at `base.css:56` and the `:where(:not(:disabled))` hover convention.
- Produces: `.btn[aria-disabled="true"], .icon-btn[aria-disabled="true"]`, the three media blocks the skill's rules cite.

- [ ] **Step 1: Pin the new rules (tests first)**

In `packages/css/test/exports.test.ts`, replace line 477 (the disabled-list assertion; 475 is the `.btn--danger` hover, leave it):

```ts
    expect(css).toMatch(/\.btn:disabled, \.icon-btn:disabled, button\.chip:disabled, \.tabs__tab:disabled, \.input:disabled, \.select:disabled\s*\{\s*opacity:\s*\.45;\s*cursor:\s*default/);
```

with:

```ts
    expect(css).toMatch(/\.btn:disabled, \.icon-btn:disabled, button\.chip:disabled, \.chip__remove:disabled, \.tabs__tab:disabled, \.input:disabled, \.select:disabled\s*\{\s*opacity:\s*\.45;\s*cursor:\s*default/);
    expect(css).toMatch(/\.btn\[aria-disabled="true"\], \.icon-btn\[aria-disabled="true"\]\s*\{\s*opacity:\s*\.45;\s*cursor:\s*default;\s*pointer-events:\s*none/);   // a link styled as a control cannot be :disabled
```

In the `for (const sel of [...])` loop at line 483, change the array to:

```ts
    for (const sel of ['.btn--secondary', '.btn--ghost', '.icon-btn', '.tabs__tab', '.chip__remove'])
```

Replace line 486:

```ts
    expect(css).not.toMatch(/\.(?:btn--[\w-]+|icon-btn|input|select|tabs__tab|menu__item):hover/);   // no unguarded control hover remains
```

with:

```ts
    expect(css).not.toMatch(/\.(?:btn--[\w-]+|icon-btn|input|select|tabs__tab|menu__item|chip__remove):hover/);   // no unguarded control hover remains
```

Line 332, inside `it('ships the chip remove button`, asserts the bare hover, `/\.chip__remove:hover\s*\{[^}]*color-mix\(in srgb, currentColor 15%, transparent\)/`, which the alternation above now forbids. In that line change the selector to `\.chip__remove:where\(:not\(:disabled\)\):hover` and keep the rest of the line (the `color-mix` tail and any trailing comment).

After the closing `});` of that `it(` block (the line before `it('card has default padding`), add:

```ts
  // Spec 2026-10-06 §5 items 7 and 8: the bar goes opaque when the user asks for less transparency; WHCM keeps the
  // current-page bar and the badge dot (forced-color-adjust: none with system colours, so they stay in the user's palette).
  it('app bar honours reduced transparency; sidebar bar and badge dot survive forced colours', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/@media \(prefers-reduced-transparency: reduce\)\s*\{\s*\.app-bar\s*\{\s*background:\s*var\(--bg-surface-1\);\s*-webkit-backdrop-filter:\s*none;\s*backdrop-filter:\s*none/);
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{\s*\.sidebar a\[aria-current="page"\]::before\s*\{\s*forced-color-adjust:\s*none;\s*background:\s*Highlight/);
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{\s*\.badge \.dot\s*\{\s*forced-color-adjust:\s*none;\s*background:\s*CanvasText/);
  });
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `pnpm --filter @gitzhacode/zha-ui-css test 2>&1 | grep -E "×|failed|passed"`
Expected: `ships the chip remove button`, `controls have hover, pressed and one disabled value` and the new test fail; 77 pass.

- [ ] **Step 3: Change the CSS**

In `packages/css/src/primitives/base.css`, replace line 56:

```css
.btn:disabled, .icon-btn:disabled, button.chip:disabled, .tabs__tab:disabled, .input:disabled, .select:disabled { opacity: .45; cursor: default; }
```

with:

```css
.btn:disabled, .icon-btn:disabled, button.chip:disabled, .chip__remove:disabled, .tabs__tab:disabled, .input:disabled, .select:disabled { opacity: .45; cursor: default; }
.btn[aria-disabled="true"], .icon-btn[aria-disabled="true"] { opacity: .45; cursor: default; pointer-events: none; } /* a link styled as a control cannot be :disabled; pointer-events: none also silences its hover. Drop the href too, or the keyboard still follows it */
```

Replace line 101:

```css
.chip__remove:hover { background: color-mix(in srgb, currentColor 15%, transparent); }
```

with:

```css
.chip__remove:where(:not(:disabled)):hover { background: color-mix(in srgb, currentColor 15%, transparent); }
```

In `packages/css/src/primitives/layout.css`, after line 11 (`@supports not ((backdrop-filter: blur(1px)) ...`), add:

```css
@media (prefers-reduced-transparency: reduce) { .app-bar { background: var(--bg-surface-1); -webkit-backdrop-filter: none; backdrop-filter: none; } } /* an opaque bar when the user asks for less transparency */
```

In `packages/css/src/primitives/nav.css`, after line 8 (the `.sidebar a[aria-current="page"]::before` rule), add:

```css
@media (forced-colors: active) { .sidebar a[aria-current="page"]::before { forced-color-adjust: none; background: Highlight; } } /* WHCM drops author backgrounds; the current-page bar stays, in the user's highlight colour */
```

In `packages/css/src/primitives/content.css`, after line 16 (`.badge .dot { ... }`), add:

```css
@media (forced-colors: active) { .badge .dot { forced-color-adjust: none; background: CanvasText; } } /* WHCM would erase the dot and leave colour-alone status */
```

- [ ] **Step 4: Update the vocabulary rows**

In `AI-USAGE.md`, replace the `.btn` row:

```
| `.btn` | Base button - always pair with a modifier |
```

with:

```
| `.btn` | Base button - always pair with a modifier. A link styled as a button that is unavailable carries `aria-disabled="true"` and no `href`: it takes the disabled look and stops answering the pointer |
```

and in the `.chip__remove` row, change the ending `never inside \`button.chip\` / toggle chips (nested interactive controls are invalid HTML and unreachable) |` to `never inside \`button.chip\` / toggle chips (nested interactive controls are invalid HTML and unreachable). Disabled, it takes the shared disabled value and no hover wash |`.

- [ ] **Step 5: Gate**

Run `pnpm build`, then `pnpm test`.
Expected: build green (11 tasks); css 80 passed; tokens 44; runtime 2.

- [ ] **Step 6: Commit**

```bash
git add packages/css/src/primitives/base.css packages/css/src/primitives/layout.css packages/css/src/primitives/nav.css packages/css/src/primitives/content.css packages/css/test/exports.test.ts AI-USAGE.md
git commit -m "fix(css): aria-disabled controls, a guarded chip-remove hover, an opaque bar under reduced transparency, WHCM-safe sidebar bar and badge dot"
```

---

### Task 4: Skip link

**Files:**
- Modify: `packages/css/src/primitives/nav.css:1` (new rules after the `/* navigation primitives */` comment)
- Modify: `packages/css/test/exports.test.ts` (a new `it(` before `it('ships dist/classes.txt`), and the `classes.txt` test gains one line
- Modify: `AI-USAGE.md` (the Spec 3 class line and a new table row after `.divider--vertical`)
- Modify: `AGENTS.md` (a new rule under `## Rules` and item 7 of `## Before you ship`; the skeletons stay untouched until Task 8)
- Modify: `examples/index.html:11-12` (`<body>` and `<main class="container stack">` at line 42), `examples/zha-app-vanilla/index.html:13` (`<body>`) and `:30` (`<main class="container">`), `examples/zha-app-react/src/App.jsx:337` (the fragment `App()` returns) and `:347` (`<main className="app-main stack">`)

**Model:** implementer=sonnet, reviewer=sonnet - one class, three starters, guidance lines

**Interfaces:**
- Consumes: the `.sr-only` recipe at `base.css:119`, `--z-toast`, `--shadow-mid`.
- Produces: `.skip-link`, which Task 8 moves into the skill with the skeletons and Task 10 renders.

- [ ] **Step 1: Pin the class (test first)**

In `packages/css/test/exports.test.ts`, before `it('ships dist/classes.txt`, add:

```ts
  // Spec 2026-10-06 §5 item 9: the first focusable element, hidden with the .sr-only recipe until the keyboard reaches it (WCAG 2.4.1).
  it('ships a skip link that is sr-only until it has keyboard focus', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.skip-link\s*\{\s*position:\s*absolute;\s*inset-inline-start:\s*var\(--space-4\);\s*inset-block-start:\s*var\(--space-4\);\s*z-index:\s*var\(--z-toast\)/);
    expect(css).toMatch(/\.skip-link:not\(:focus-visible\)\s*\{[^}]*clip:\s*rect\(0,0,0,0\)/s);
    expect(css.indexOf('.skip-link {')).toBeLessThan(css.indexOf('.skip-link:not(:focus-visible) {'));   // the hide follows the paint
  });
```

In the `ships dist/classes.txt` test, after `expect(lines).toContain('.zha-lockup__team');`, add:

```ts
    expect(lines).toContain('.skip-link');
```

- [ ] **Step 2: Run the test to see it fail**

Run: `pnpm --filter @gitzhacode/zha-ui-css test 2>&1 | grep -E "×|failed|passed"`
Expected: the two tests fail; 79 pass.

- [ ] **Step 3: Add the CSS**

In `packages/css/src/primitives/nav.css`, after line 1 (`/* navigation primitives */`), add:

```css

/* skip link (Spec 2026-10-06 §5 item 9): the first element in <body>, visible only while it has keyboard focus */
.skip-link { position: absolute; inset-inline-start: var(--space-4); inset-block-start: var(--space-4); z-index: var(--z-toast); padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-m); background: var(--bg-surface-1); color: var(--text-strong); box-shadow: var(--shadow-mid); text-decoration: underline; }
.skip-link:not(:focus-visible) { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; } /* the .sr-only recipe until the keyboard reaches it; (0,2,0) beats the paint rule above */
```

- [ ] **Step 4: Put the link in the three starters**

In `examples/index.html`, replace `<body>` (line 11) with:

```html
<body>
  <a class="skip-link" href="#main">Skip to content</a>
```

and `<main class="container stack">` (line 42) with `<main class="container stack" id="main">`.

In `examples/zha-app-vanilla/index.html`, replace `<body>` (line 13) with the same two lines, and `<main class="container">` (line 30) with `<main class="container" id="main">`.

In `examples/zha-app-react/src/App.jsx`, `App()` already returns a fragment: line 337 is `    <>`, line 338 a JSX comment, line 339 `<div className="app-shell" {...(navOpen ? { 'data-nav-open': '' } : {})}>`, and the fragment closes with `</>` at line 381 after the dialog, toast and menu. Directly after line 337 and before the comment on line 338, insert one line:

```jsx
      <a className="skip-link" href="#main">Skip to content</a>
```

Add no new fragment. Change `<main className="app-main stack">` (line 347, now 348) to `<main className="app-main stack" id="main">`. Keep the file's indentation style.

- [ ] **Step 5: Guidance**

In `AI-USAGE.md`, in the Spec 3 class line, append ` .skip-link` after `.app-bar__nav-toggle`. After the `.divider--vertical` table row, add:

```
| `.skip-link` | The page's first element: `<a class="skip-link" href="#main">Skip to content</a>`, hidden until the keyboard reaches it; `<main>` carries `id="main"` |
```

In `AGENTS.md`, under `## Rules`, directly after the `one-primary-action` bullet, add:

```
- `skip-link`: the first element in `<body>` is `<a class="skip-link" href="#main">Skip to content</a>` and the page's `<main>` carries `id="main"`; the link is invisible until the keyboard reaches it.
```

In `## Before you ship`, item 7 becomes: `7. Keyboard: the skip link comes first, the focus ring is visible on every control; dialogs and menus are the native primitives.` Leave the three skeletons under `## Compose a page` alone here: Task 8 moves them into the skill and adds the link there (adding three lines now would push AGENTS.md past 260).

Check: `wc -l AGENTS.md` prints `259`.

- [ ] **Step 6: Gate**

Run `pnpm build`, then `pnpm test`.
Expected: build green with the `examples hub` and `zha-app-vanilla` guard lines ending `✓` (the new class is in the bundle), `zha-app-react` builds; css 81 passed. Then from the playwright folder: open `examples/index.html` in Playwright, press Tab once, and confirm `document.activeElement.className === 'skip-link'` and its bounding box has a positive width.

- [ ] **Step 7: Commit**

```bash
git add packages/css/src/primitives/nav.css packages/css/test/exports.test.ts AI-USAGE.md AGENTS.md examples/index.html examples/zha-app-vanilla/index.html examples/zha-app-react/src/App.jsx
git commit -m "feat(css): .skip-link, the first element of every starter and skeleton"
```

---

### Task 5: Tests that fail when their block is missing; the pressed-arm pin; the colour-scan script skip

**Files:**
- Modify: `packages/css/test/exports.test.ts:3` (a helper after the `d()` line), `:31, :44, :65, :72, :103, :115, :272, :290, :409, :420, :494` (the eleven `?.[0] ?? ''` extractions), `:488` (the pressed-arm `indexOf`)
- Modify: `examples/drift-guard.test.mjs` (append one test)

**Model:** implementer=haiku, reviewer=sonnet - full code in the plan, two test files, mechanical

**Interfaces:**
- Consumes: the real pressed rule at `base.css:65`, `.btn.is-active:hover, .btn:where([aria-pressed="true"]):hover { ... }`, and `lint()` from `examples/_drift-guard.mjs`.
- Produces: `block()` in `exports.test.ts`, which Task 6 and Task 8 may use.

- [ ] **Step 1: The helper**

In `packages/css/test/exports.test.ts`, after line 3 (`const d = (f: string) => ...`), add:

```ts
// A block that is missing must fail the test, never pass an empty string through a negative assertion (2026-10-06 item 11).
const block = (css: string, re: RegExp) => { const m = css.match(re); expect(m, `${re} matches a block`).not.toBeNull(); return m![0]; };
```

- [ ] **Step 2: Replace the eleven extractions**

Each line of the form `const NAME = css.match(RE)?.[0] ?? '';` becomes `const NAME = block(css, RE);`, and each of the form `const NAME = css().match(RE)?.[0] ?? '';` (lines 272 and 290) becomes `const NAME = block(css(), RE);`. Keep every trailing comment. The eleven lines are 31 (`card`), 44 (`active`), 65 (`stat`), 72 (`badge`), 103 (`base`), 115 (`es`), 272 (`brand`), 290 (`iconBtn`), 409 (`hero`), 420 (`phone`), 494 (`card`). Line numbers have shifted by the tasks above; find each by the quoted variable name and `?.[0] ?? ''`. After the edit, `grep -c "?.\[0\] ?? ''" packages/css/test/exports.test.ts` prints `0`.

- [ ] **Step 3: The pressed-arm pin**

Replace the line (originally 488):

```ts
    expect(css.indexOf('.btn--ghost:where(:not(:disabled)):hover')).toBeLessThan(css.indexOf('.btn:where([aria-pressed="true"]):hover'));   // Review Focus 1: the pressed arm wins its (0,2,0) tie by source order
```

with:

```ts
    expect(css.indexOf('.btn--ghost:where(:not(:disabled)):hover')).toBeLessThan(css.search(/^\.btn\.is-active:hover, \.btn:where\(\[aria-pressed="true"\]\):hover/m));   // Review Focus 1: the pressed arm wins its (0,2,0) tie by source order; line-anchored so the comment above the rule cannot satisfy it
```

- [ ] **Step 4: The colour-scan test**

Append to `examples/drift-guard.test.mjs`:

```js
// The colour scan reads <style> blocks and markup style attributes only: a style assignment inside <script> is JS (item 2, 2026-10-06).
test('colour scan: a named colour in a <script> style assignment is not reported', () => {
  const r = lint('<script>el.style = "color: red"</script>', BUNDLE);
  assert.deepEqual(r.colors, []);
});
```

- [ ] **Step 5: Gate**

Run `pnpm build`, then `pnpm test`.
Expected: css 81 passed; the checks package prints `ℹ pass 22`. Also run `node --test examples/drift-guard.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)"` and expect `pass 22`, `fail 0`.

- [ ] **Step 6: Commit**

```bash
git add packages/css/test/exports.test.ts examples/drift-guard.test.mjs
git commit -m "test: blocks that are missing fail, the pressed-arm pin finds the rule, the colour scan's script skip is pinned"
```

---

### Task 6: A drift guard for the React starter

**Files:**
- Modify: `examples/_drift-guard.mjs` (export `jsxToMarkup`; `run()` takes `transform`)
- Modify: `examples/drift-guard.test.mjs` (three tests)
- Create: `examples/zha-app-react/check.mjs`
- Modify: `examples/zha-app-react/package.json` (`"build": "node check.mjs && vite build"`)

**Model:** implementer=sonnet, reviewer=opus - a shared helper changes; Review Focus 4

Amended during execution (ruling 6): the shipped jsxToMarkup in examples/_drift-guard.mjs differs from Step 2's block in two regexes - the style regex allows one level of nested braces and the inner matcher accepts an unquoted value up to the next comma - and the drift tests number 26, not 25 (a fourth jsxToMarkup test pins unquoted and template style values). The committed code is authoritative.

**Interfaces:**
- Consumes: `lint(html, bundle, opts)` and `run(htmlUrl, bundlePath, opts)` in `examples/_drift-guard.mjs`.
- Produces: `jsxToMarkup(src: string): string` and `run(..., { transform })`.

- [ ] **Step 1: Tests first**

Append to `examples/drift-guard.test.mjs`:

```js
import { jsxToMarkup } from './_drift-guard.mjs';

// The React starter is JSX: className and template literals become class="", a prefix such as badge-- (finished in JS) is dropped
// the way a var(--x- prefix inside <script> is, and a style object becomes a style attribute (Review Focus 4, 2026-10-06).
test('jsxToMarkup: classNames, template prefixes and style objects', () => {
  const out = jsxToMarkup('<span className={`badge badge--${tone}`} style={{ \'--grid-min\': \'11rem\' }}><i className="dot" /></span>');
  assert.equal(out, '<span class="badge" style="--grid-min: 11rem"><i class="dot" /></span>');
});
test('jsxToMarkup: a conditional keeps every literal branch', () => {
  assert.equal(jsxToMarkup('<a className={on ? "tabs__tab is-active" : "tabs__tab"}>'), '<a class="tabs__tab is-active tabs__tab">');
});
test('jsxToMarkup output is lintable: a typo is reported, a knob passes, layout in a style object is reported', () => {
  const bundle = BUNDLE + '\n.badge{}\n.dot{}\n.grid{}';
  const r = lint(jsxToMarkup('<div className="grid clsuter" style={{ \'--grid-min\': \'11rem\', padding: \'4px\' }} />'), bundle, { checkClasses: true, inlineKnobsOnly: true });
  assert.deepEqual(r.missing, ['.clsuter']);
  assert.deepEqual(r.inline, ['padding: 4px']);
});
```

Run: `node --test examples/drift-guard.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)"`
Expected: the file fails to load with `SyntaxError: The requested module './_drift-guard.mjs' does not provide an export named 'jsxToMarkup'`, then `ℹ tests 1`, `ℹ pass 0`, `ℹ fail 1` (a missing ESM export is a link-time error, so no test in the file runs).

- [ ] **Step 2: The transform and the hook**

In `examples/_drift-guard.mjs`, before `export function lint(`, add:

```js
// JSX to the markup dialect lint() reads. className="a b" and className={...} become class="" (every string literal inside the
// braces contributes; a token ending in "-" is a template prefix finished in JS, like the var(--x- rule, and is dropped);
// style={{ '--knob': 'v', prop: 'v' }} becomes style="--knob: v; prop: v" so the knob rule applies. Other braces are JS and stay.
export function jsxToMarkup(src) {
  // Whole string literals only (a closing quote is never an opening one); a ${...} inside a template is finished in JS and is dropped with its prefix.
  const tokens = (expr) => [...expr.matchAll(/"([^"]*)"|'([^']*)'|`([^`]*)`/g)]
    .flatMap((m) => (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, ' ').split(/\s+/))
    .filter((c) => c && !c.endsWith('-'));
  return src
    .replace(/className=\{((?:[^{}]|\{[^{}]*\})*)\}/g, (_, expr) => `class="${tokens(expr).join(' ')}"`) // one level of nesting, for ${expr} inside a template
    .replace(/className=/g, 'class=')
    .replace(/style=\{\{([^}]*)\}\}/g, (_, obj) =>
      `style="${[...obj.matchAll(/['"]?([\w-]+)['"]?\s*:\s*['"]([^'"]*)['"]/g)].map((m) => `${m[1]}: ${m[2]}`).join('; ')}"`);
}
```

Change the `run()` signature and its first lines to:

```js
export function run(htmlUrl, bundlePath, { checkClasses = false, inlineKnobsOnly = false, transform = (s) => s, label } = {}) {
  const bundle = readFileSync(bundlePath, 'utf8');
  const html = transform(readFileSync(htmlUrl, 'utf8'));
```

(the rest of `run()` is unchanged; the `vars` count at the end reads the transformed `html`, which is what you want).

Run the drift tests again. Expected: `pass 25`, `fail 0`. If the first test's expected string differs only by the `is-active` branch order or a space, fix the expected string, not the transform, and note it in the report.

- [ ] **Step 3: The runner**

Create `examples/zha-app-react/check.mjs`:

```js
// Drift guard for the React starter - thin runner around ../_drift-guard.mjs with the JSX transform.
// A consumer app (Ring 2), so classes ARE checked and inline styles are knobs-only: every className must be a
// bundle class, every var(--…) a bundle token, no colour literal, no layout in a style object.
import { createRequire } from 'node:module';
import { run, jsxToMarkup } from '../_drift-guard.mjs';

run(
  new URL('./src/App.jsx', import.meta.url),
  createRequire(import.meta.url).resolve('@gitzhacode/zha-ui-css/index.css'),
  { checkClasses: true, inlineKnobsOnly: true, transform: jsxToMarkup, label: 'zha-app-react' },
);
```

In `examples/zha-app-react/package.json`, change `"build": "vite build"` to `"build": "node check.mjs && vite build"`.

- [ ] **Step 4: Gate**

Run: `pnpm build 2>&1 | grep -E "zha-app-react|error"`
Expected: `zha-app-react:build: zha-app-react: N vars all bundle tokens, CSS balanced, no hardcoded colour, inline styles knobs-only ✓` followed by the vite lines. If the guard reports a missing class or an inline style, the starter has a real defect: fix the starter (not the guard), say what it was in the report, and keep the fix in this commit. `pnpm test` stays at css 81; the checks package prints `pass 25`.

- [ ] **Step 5: Commit**

```bash
git add examples/_drift-guard.mjs examples/drift-guard.test.mjs examples/zha-app-react/check.mjs examples/zha-app-react/package.json
# add examples/zha-app-react/src/App.jsx too if Step 4 changed it
git commit -m "feat(examples): the React starter runs the drift guard through a JSX transform"
```

---

### Task 7: llms deprecation note, foundation labels, deck leftovers, status lines, the port register

**Files:**
- Modify: `packages/tokens/style-dictionary.config.mjs:31-51` (the `zha/llms` format), `packages/tokens/test/build-output.test.ts:112`
- Modify: `examples/foundation-reference/index.html:834-874` (the four alerts), `:901, :906, :911` (the three `<progress>`)
- Modify: `examples/brand-deck-editorial/index.html:178, :180`, `examples/brand-deck-product/index.html:129, :137`, `examples/brand-deck/index.html:120-124` (a stale comment) and `:127`
- Modify: `PLAN.md:6` (In progress), the Planned list (append one bullet), `docs/tickets/2026-07-10-phase-b-token-system-gaps.md:3`, `docs/specs/2026-07-22-zha-ui-viz-chart-tokens-design.md:17-18`
- Modify (outside the repo, not committed): `C:\Users\aleksander.mastalski\repositories\zh-es-hub\PORTS.md` (the `zha-ui` row)

**Model:** implementer=sonnet, reviewer=sonnet - several files, each edit small, one render check

**Interfaces:**
- Consumes: ticket 2026-07-10 §P4 items 1 and 3 (the deck rule), `--text-muted` and `--accent-on`.
- Produces: the llms line `--focus-ring (deprecated: ...)` the skill and Task 10 cite.

- [ ] **Step 1: llms.txt deprecation (test first)**

In `packages/tokens/test/build-output.test.ts`, replace line 112:

```ts
    expect(txt).toMatch(/^--focus-ring$/m);                     // shadow with colour refs stays name-only
```

with:

```ts
    expect(txt).toMatch(/^--focus-ring \(deprecated: the package paints focus as an outline; kept for consumers that referenced it\)$/m);   // name-only (a shadow with colour refs) plus the deprecation the spec requires
```

In `packages/tokens/style-dictionary.config.mjs`, inside the `zha/llms` format, replace:

```js
    const line = (t) => (t.$type === 'color' || hasColour(t.$value) ? `--${t.name}` : `--${t.name}: ${t.$value}`);
```

with:

```js
    // Deprecations travel with the name, so an agent reading llms.txt alone never adopts a retired token.
    const DEPRECATED = { 'focus-ring': 'the package paints focus as an outline; kept for consumers that referenced it' };
    const line = (t) => (t.$type === 'color' || hasColour(t.$value) ? `--${t.name}` : `--${t.name}: ${t.$value}`) + (DEPRECATED[t.name] ? ` (deprecated: ${DEPRECATED[t.name]})` : '');
```

Run: `pnpm build && pnpm --filter @gitzhacode/zha-ui-tokens test 2>&1 | grep -E "Tests"`
Expected: `Tests  44 passed (44)`.

- [ ] **Step 2: Foundation reference labels**

In `examples/foundation-reference/index.html`: `<div class="alert alert--success">` gains `role="status"`, as do `alert--warning` and `alert--info`; `<div class="alert alert--error">` gains `role="alert"`. The three `<progress class="progress" value="25" max="100">` lines gain `aria-label="Early stage, 25 percent"`, `aria-label="Mid stage, 60 percent"` and `aria-label="Near complete, 95 percent"` respectively.

- [ ] **Step 3: Deck leftovers**

Capture before: from the playwright folder, screenshot the three slides at 1440 px (editorial slide containing `ZHA Sans` at line 178, product slide containing `.btnp.t`, brand deck slide containing `.mini--work`) into `.playwright-mcp/verify-agent-first/decks-before-*.png`; the deck pages take a slide index in the hash or arrow keys, so note which slide you captured.

In `examples/brand-deck-editorial/index.html` lines 178 and 180, replace `var(--color-neutral-gray-77)` with `var(--text-muted)` (the plate is `data-theme="light"`, so this resolves to the light value, 5.62:1 on white). In `examples/brand-deck-product/index.html` line 129 (`.btnp.t`) and 137 (`.swrow span.on`), replace `color:var(--color-neutral-white)` with `color:var(--accent-on)`. In `examples/brand-deck/index.html` line 127 (`.mini--work .mbtn`), replace `color:var(--color-neutral-white)` with `color:var(--accent-on)`. Do not add `data-theme="light"` to the `.mini--work` markup: `--accent-on` has one value in the bundle, so the button reads the same under either theme. Replace the stale comment at lines 120-124 (it claims the bundle has no `[data-theme="light"]` block, which has been false since the P1 fix):

```css
/* The work surface, in light - this page is data-theme="dark", so the dark overrides
   would otherwise inherit into any nested scope; the light/work values are read here
   from their un-themed --color-* primitives directly - still real zha-ui tokens, not
   literals. (The bundle now carries a [data-theme="light"] block; this mockup predates
   it and keeps the primitive route.) */
```

Capture after, same three slides; the only visible change is the muted text one shade darker on the editorial plate; the buttons look the same (white on teal).

Run: `pnpm build 2>&1 | grep -E "brand-deck"`
Expected: among the `brand-deck` prefixed lines (turbo prints cache and command lines too), the deck guard lines end `✓` and no error line appears.

- [ ] **Step 4: Status lines**

`PLAN.md`: move the `## In progress` bullet (the 0.1.2 train) to the top of `## Done` as `- 2026-07-23 0.1.2 released (PR #5 + release PR #6): quick wins, the no-PAT git-URL install route, the gradient pool redesign and the viz tokens; release branches and tags verified end-to-end` (confirm the date with `git log -1 --format=%cs css-v0.1.2`; use that date if it differs). Put under `## In progress`:

```
- 0.1.3 release train (feat/composition-layer): Spec 3, the fix-later pass, the register sweep and the agent-first pass (plan 2026-10-06) sit on the branch with the changeset - NEXT: the maintainer pushes and opens the PR against main → the changesets bot opens the release PR → merge it to publish 0.1.3 → send docs/tickets/2026-10-01-consumer-notes-0.1.3.md to both dogfood apps
```

Append to the bottom of `## Planned`:

```
- Detector lint over examples/ (research 2026-09-30, Spec 3 §2 "next spec", agent-first spec 2026-10-06 §8): a CI check for the anti-pattern list (inline layout, invented classes, more than one primary action, ZHA Sans below 24 px) - needs its own spec
```

`docs/tickets/2026-07-10-phase-b-token-system-gaps.md` line 3 becomes:

```
**Status:** P1 (the light block, 2369bc6; deck payoff 9e3fe27) and P3 (guard hardening, 55d1de0) shipped 2026-07-10; `.duoword` retired the same day (44e1c2c); the deck reconversion's last primitives (P4-1 `gray-77`, P4-3 `accent-on`) closed 2026-10-06; P2 was not built, no need survived the reconversion.
```

`docs/specs/2026-07-22-zha-ui-viz-chart-tokens-design.md` line 18: replace the sentence at the end of the second blockquote paragraph,

```
**Not yet implemented:** the remaining chart tokens, defined below.
```

with

```
The chart tokens below shipped in the same session (gate 3.0 pairs, `chart.test.ts`), so the header's status line stands.
```

- [ ] **Step 5: The port register**

In `C:\Users\aleksander.mastalski\repositories\zh-es-hub\PORTS.md`, replace the row:

```
| zha-ui | 7170 | — | — | — | reserved — turbo build/test only. Company-wide repo: its port note is local-only in `CLAUDE.local.md` (uncommitted), never `AGENTS.md` |
```

with:

```
| zha-ui | 7170 | — | 7171 | 7172 | render-verify only (vite dev of the React starter on 7171, vite preview of it on 7172; recorded 2026-10-06 after two plans used them). Company-wide repo: its port note is local-only in `CLAUDE.local.md` (uncommitted), never `AGENTS.md` |
```

Keep that file's own dash style (it is the hub's house style). Do not commit in zh-es-hub: the working tree already has the maintainer's uncommitted edits to PORTS.md and four other files. Say so in the report.

- [ ] **Step 6: Gate**

Run `pnpm build`, `pnpm test`, `pnpm lint`, reading each command's own summary.
Expected: build 11 tasks, test 14 tasks, lint 3 tasks, all successful; tokens 44 passed, css 81 passed.

- [ ] **Step 7: Commit**

```bash
git add packages/tokens/style-dictionary.config.mjs packages/tokens/test/build-output.test.ts examples/foundation-reference/index.html examples/brand-deck-editorial/index.html examples/brand-deck-product/index.html examples/brand-deck/index.html PLAN.md docs/tickets/2026-07-10-phase-b-token-system-gaps.md docs/specs/2026-07-22-zha-ui-viz-chart-tokens-design.md
git commit -m "docs,examples,tokens: llms marks --focus-ring deprecated; labelled demos; the decks' last primitives; status lines match what shipped"
```

---

### Task 8: The zha-ui skill, and AGENTS.md around it

**Files:**
- Move: `AI-USAGE.md` to `skills/zha-ui/reference.md` (`git mv`)
- Create: `skills/zha-ui/SKILL.md`
- Create: `packages/css/test/skill.test.ts`
- Modify: `AGENTS.md` (restructure: see Step 3), `DESIGN.md:4-5, :297, :368`, `README.md:76, :90, :94, :111`, `examples/index.html:7` (a comment), `AGENTS_FABLE.md:4`, `packages/tokens/style-dictionary.config.mjs:53` (the last llms line; 51 before Task 7's two inserted lines), `packages/tokens/test/build-output.test.ts` (one expectation in the llms test), `turbo.json` (the `test` task's inputs)

**Model:** implementer=opus, reviewer=opus - a multi-file restructure with judgement about what stays in AGENTS.md

**Interfaces:**
- Consumes: AGENTS.md's sections as they stand after Task 4, the AI-USAGE.md rows as they stand after Task 3.
- Produces: `skills/zha-ui/SKILL.md` and `reference.md`; the install command `npx skills add GitZHACODE/zha-ui`, which Task 9 quotes.

- [ ] **Step 1: Move the reference**

Run: `git mv AI-USAGE.md skills/zha-ui/reference.md` (create the folder). Change its first line from `# Using zha-ui (paste this into your AI coding assistant)` to `# zha-ui reference - every class and variable` and the blockquote's first line from `> You are building a ZHA web app with the zha-ui design system. Obey these rules.` to `> The vocabulary for the zha-ui skill. SKILL.md beside this file carries setup, skeletons and rules; this file is the lookup.`. Leave the rest as it is.

- [ ] **Step 2: Write SKILL.md**

Create `skills/zha-ui/SKILL.md` with this frontmatter and opening, then the moved sections in the order given (the block is fenced with four backticks because it contains three-backtick fences of its own):

````markdown
---
name: zha-ui
description: Build or restyle a ZHA web app with the zha-ui design system. Installs @gitzhacode/zha-ui-css from the private GitZHACODE/zha-ui repo, sets the four html switches, composes pages from the layout classes and uses only zha-ui classes and tokens. Use for any ZHA project that needs UI, styling, layout, colour, type, a page skeleton or a brand check.
license: Internal to ZHA; not for redistribution
metadata:
  source: "https://github.com/GitZHACODE/zha-ui/tree/main/skills/zha-ui"
  version: "0.1.3"
---

# ZHA UI

You are building a ZHA web app on the zha-ui design system. Four attributes on `<html>` resolve colour, type, space and state; you declare them, compose the page from the layout classes and never style by hand. The vocabulary is in [reference.md](reference.md) beside this file: read it before writing markup.

## 1. Install and load once

The package installs straight from git with the developer's existing GitHub access (the repo is private to the ZHA org; a workstation needs no token and no `.npmrc`). Add to `package.json` and run the installer:

```jsonc
"dependencies": { "@gitzhacode/zha-ui-css": "github:GitZHACODE/zha-ui#release/css" }
```

Then load the bundle once:

- With a bundler (Vite, Next, CRA): `import '@gitzhacode/zha-ui-css/index.css';` in the entry file.
- Plain HTML with no build step: `<link rel="stylesheet" href="./node_modules/@gitzhacode/zha-ui-css/dist/index.css">` in `<head>`; the fonts and the logo resolve relative to that file.

To pin a version, use the tag form `#css-v0.1.3`. A CI pipeline needs a repo-read token rewritten into git before `npm ci`; the repo README's "For developers" section has the one-line `git config`.

If the project started from a Vite or CRA template, delete its element-level `button` and `a` CSS first: the primitives own control paint.

Last, add one line to the project's own `AGENTS.md` or `CLAUDE.md` (create it if absent) so later sessions keep using this skill: `Use the zha-ui skill for every UI change; never style by hand.`

## 2. Declare who you are
````

Under that heading, paste the content of AGENTS.md's `## Declare who you are - set on <html>` section (the code block, the table and `Set them once; everything inside inherits.`).

Then:

```markdown
## 3. The one hard rule

Use only the published zha-ui classes and CSS variables. Never invent a custom property (no `--color-primary`), never hard-code a hex, rgb or named colour, never write layout in a `style` attribute. The only inline styles allowed are the nine knobs: `--container-w --grid-min --stack-gap --split-aside --control-h --dialog-w --sidebar-w --zha-logo-h --zha-lockup-size`. Elements carry their defaults: write `h1` to `h4`, `p`, `a`, `pre` and `hr` without classes.

[reference.md](reference.md) has a one-line role for every class and the grouped variables. The generated, always-current lists are in the installed packages: `node_modules/@gitzhacode/zha-ui-css/dist/classes.txt` and `node_modules/@gitzhacode/zha-ui-tokens/dist/llms.txt` (the latter marks `--focus-ring` deprecated; the package paints focus as an outline).

## 4. Use the primitives
```

Paste AGENTS.md's `## Use the primitives` section body, changing its first sentence's link from `[\`AI-USAGE.md\`](./AI-USAGE.md)` to `[reference.md](reference.md)`.

Then `## 5. Compose a page` with the body of AGENTS.md's `## Compose a page` (the three skeletons), where each skeleton gains the skip link: the app page gets `<a class="skip-link" href="#main">Skip to content</a>` as the line before `<div class="app-shell">` and `id="main"` on `<main class="app-main stack">`; the tool page gets the link as the line before `<main class="container stack">` and `id="main"` on it; the landing page gets the link as the line before `<section class="hero hero--bleed ...">` and `id="main"` on `<main class="container">`; `## 6. Rules` with the body of `## Rules`; `## 7. Not ZHA` with the body of `## Not ZHA`; `## 8. Before you ship` with the body of `## Before you ship`; `## 9. You get these for free` with the body of `## You get these for free (don't reimplement)`; `## 10. Naming and type rules` with the body of `## Naming & type rules`. Keep each body verbatim apart from the AI-USAGE link above and relative links, which become GitHub URLs (`https://github.com/GitZHACODE/zha-ui/blob/main/DESIGN.md`), because the skill is installed outside this repo.

Check: `wc -l skills/zha-ui/SKILL.md` is under 300; no em or en dash in the new prose (`LC_ALL=C.UTF-8 grep -nP '[\x{2013}\x{2014}]' skills/zha-ui/SKILL.md` prints nothing for the lines you wrote; moved lines keep whatever they had, which after the 2 October sweep is nothing).

- [ ] **Step 3: Shrink AGENTS.md to the repo-specific part**

AGENTS.md keeps, in this order: the title and model note (lines 1-9), `## The one hard rule` with its vocabulary list where `[\`AI-USAGE.md\`](./AI-USAGE.md) - class cheat-sheet + grouped variables.` becomes `[\`skills/zha-ui/reference.md\`](./skills/zha-ui/reference.md) - class cheat-sheet + grouped variables.`, `## Setup - pick your ring, link/import once` with Ring 1 rewritten as below, `## Declare who you are - set on <html>` unchanged, a new section `## Build with the skill` (text below), `## Working examples in this repo` unchanged, `## Work protocol (PLAN.md)` unchanged. The sections `## Use the primitives`, `## Compose a page`, `## Rules`, `## Not ZHA`, `## Before you ship`, `## You get these for free (don't reimplement)` and `## Naming & type rules` are removed (they now live in the skill).

Ring 1 bullet, replacing the `<pages-host>` version (four-backtick fence because the bullet holds a fence of its own):

````markdown
- **Ring 1 (plain HTML, no build):** install the package the same way as Ring 2 (`npm i`, no bundler needed), then add to `<head>`:
  ```html
  <link rel="stylesheet" href="./node_modules/@gitzhacode/zha-ui-css/dist/index.css">
  ```
  (The fonts and the logo resolve relative to that file. Pin a tag, `#css-v0.1.3`, so an update never silently changes your page.)
````

The new section:

```markdown
## Build with the skill

The page skeletons, the slugged rules, the anti-pattern list, the ship checklist and the naming and
type rules live in [`skills/zha-ui/SKILL.md`](./skills/zha-ui/SKILL.md), with the full vocabulary in
[`skills/zha-ui/reference.md`](./skills/zha-ui/reference.md). Read both before building or changing
any example page in this repo. Consumers install the same skill into their project with
`npx skills add GitZHACODE/zha-ui`; it is the one copy of the rules, so change it here, never in a fork.
```

Check: `wc -l AGENTS.md` is under 120 and `grep -c "pages-host" AGENTS.md` prints `0`.

- [ ] **Step 4: Repoint the other links**

`DESIGN.md` line 5: `[\`AI-USAGE.md\`](./AI-USAGE.md)` becomes `[\`skills/zha-ui/reference.md\`](./skills/zha-ui/reference.md)`; line 368 likewise, with its description `the class cheat-sheet and grouped variable list` kept. `README.md` lines 76 and 90: the same replacement (Task 9 rewrites the surrounding sections; keep the links correct now so no commit has a dead link); line 111: `**\`AI-USAGE.md\`**` becomes `**\`skills/zha-ui/reference.md\`**` (Task 9 deletes that section); line 94: `the rules for composing a page in [\`AGENTS.md\`](./AGENTS.md).` becomes `the rules for composing a page in [\`skills/zha-ui/SKILL.md\`](./skills/zha-ui/SKILL.md).`.

The sections that leave AGENTS.md have pointers elsewhere; repoint each. `DESIGN.md` line 4: `for the AI onboarding rules see [\`AGENTS.md\`](./AGENTS.md)` becomes `for the agent rules see [\`skills/zha-ui/SKILL.md\`](./skills/zha-ui/SKILL.md)`; line 297: `[\`AGENTS.md\`](./AGENTS.md) follow, each shown as a before and after:` becomes `[\`skills/zha-ui/SKILL.md\`](./skills/zha-ui/SKILL.md) §6 follow, each shown as a before and after:`. `examples/index.html` line 7: `the landing-page recipe from AGENTS.md` becomes `the landing-page recipe from skills/zha-ui/SKILL.md`. `AGENTS_FABLE.md` line 4: `change any rule in \`AGENTS.md\` - the one hard rule,` becomes `change any rule in \`AGENTS.md\` or \`skills/zha-ui/SKILL.md\` - the one hard rule,`. (The consumer notes' pointer is rewritten in Task 10.)

`packages/tokens/style-dictionary.config.mjs` line 53 (51 before Task 7's two inserted lines): change `roles, markup and knobs are in AI-USAGE.md and AGENTS.md.` to `roles, markup, knobs and page skeletons are in the zha-ui skill (skills/zha-ui/SKILL.md and reference.md in the GitZHACODE/zha-ui repo; npx skills add GitZHACODE/zha-ui installs it).` In `packages/tokens/test/build-output.test.ts`, in the llms test, after `expect(txt).toMatch(/classes\.txt/);`, add `expect(txt).toMatch(/skills\/zha-ui\/SKILL\.md/);`.

Run: `git grep -n --untracked "AI-USAGE" -- . ':!docs/plans' ':!docs/specs' ':!docs/research' ':!docs/tickets' ':!PLAN.md'`
Expected: no output (the dated plans, specs, research, tickets and PLAN.md history keep their historical mentions; `git grep` skips the gitignored `.superpowers/` and `node_modules/`, which a plain `grep -r` would walk).

- [ ] **Step 5: Pin the skill (test)**

Create `packages/css/test/skill.test.ts`:

```ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
const root = new URL('../../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

// Review Focus 5 (2026-10-06): one skill, named after its folder, and a reference that covers every shipped class.
describe('skills/zha-ui', () => {
  it('has the Agent Skills frontmatter and is the only SKILL.md in the repo', () => {
    const skill = read('skills/zha-ui/SKILL.md');
    expect(skill).toMatch(/^---\r?\nname: zha-ui\r?\n/);
    const desc = skill.match(/^description: (.+?)\r?$/m)?.[1] ?? '';
    expect(desc.length).toBeGreaterThan(0);
    expect(desc.length).toBeLessThanOrEqual(1024);
    expect(skill).toMatch(/\[reference\.md\]\(reference\.md\)/);
    const found: string[] = [];
    const walk = (dir: string) => { for (const n of readdirSync(dir)) { if (n === 'node_modules' || n === 'dist' || n.startsWith('.')) continue; const p = join(dir, n); if (statSync(p).isDirectory()) walk(p); else if (n === 'SKILL.md') found.push(p); } };
    walk(fileURLToPath(root));
    expect(found.map((p) => p.replaceAll('\\', '/'))).toEqual([fileURLToPath(new URL('skills/zha-ui/SKILL.md', root)).replaceAll('\\', '/')]);
  });
  it('reference.md names every class in classes.txt', () => {
    const ref = read('skills/zha-ui/reference.md');
    const classes = readFileSync(new URL('../dist/classes.txt', import.meta.url), 'utf8').trim().split('\n');
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const missing = classes.filter((c) => !new RegExp(esc(c) + '(?![\\w-])').test(ref));
    expect(missing, 'classes with no row or mention in reference.md').toEqual([]);
  });
});
```

Run: `pnpm --filter @gitzhacode/zha-ui-css test 2>&1 | grep -E "×|missing|Tests"`. If the second test lists missing classes, add a row for each to the cheat-sheet table in `reference.md` (one line, the class's role in plain words, read from the CSS comment beside its rule); if more than ten are missing, stop and report the list instead. Expected afterwards: css 83 passed.

The test reads files outside the package, so turbo's cache key must see them. In `turbo.json`, change `"test": { "dependsOn": ["build"] }` to `"test": { "dependsOn": ["build"], "inputs": ["$TURBO_DEFAULT$", "$TURBO_ROOT$/skills/**"] }` (the `build` task already uses `$TURBO_ROOT$`, so the installed turbo supports it).

- [ ] **Step 6: Gate**

Run `pnpm build`, `pnpm test`, `pnpm lint`, reading each command's own summary.
Expected: build 11 tasks, test 14 tasks, lint 3 tasks, all successful; css 83 passed, tokens 44.

- [ ] **Step 7: Commit**

```bash
git add skills AGENTS.md AGENTS_FABLE.md DESIGN.md README.md examples/index.html turbo.json packages/tokens/style-dictionary.config.mjs packages/tokens/test/build-output.test.ts packages/css/test/skill.test.ts
git commit -m "feat: the zha-ui skill (Agent Skills format) carries the skeletons, rules and vocabulary; AGENTS.md points at it"
```

(`git mv` in Step 1 already staged the removal of AI-USAGE.md; do not name it in `git add`, or git stops with a pathspec error and stages nothing.)

---

### Task 9: Quick start for agents - README, hub, vanilla starter

**Files:**
- Modify: `README.md:50-76` (the `## Quick start (no coding experience needed)` section) and `:109-113` (`## Using an AI assistant (Claude / Cursor / Copilot)?`)
- Modify: `examples/index.html:99-121` (the Starters section; one line down from `ca82c5a` after Task 4's skip link)
- Modify: `examples/zha-app-vanilla/index.html:7-8` (the head comment)

**Model:** implementer=sonnet, reviewer=sonnet - prose and markup given in full

**Interfaces:**
- Consumes: `npx skills add GitZHACODE/zha-ui` and `skills/zha-ui/SKILL.md` from Task 8.
- Produces: the paste paragraph, quoted identically in the README and the hub.

- [ ] **Step 1: README**

Replace the whole `## Quick start (no coding experience needed)` section (from its heading to the line `Every class and colour is listed in [\`skills/zha-ui/reference.md\`](./skills/zha-ui/reference.md).`) with:

````markdown
## Quick start with your coding agent

Hand the system to the agent and describe the app; the agent installs the package, sets the switches and composes every page from zha-ui classes. In the project folder, with Claude Code, Codex CLI or Gemini CLI:

```
npx skills add GitZHACODE/zha-ui
```

That installs the `zha-ui` skill into the agent's skills folder from this private repo, through your normal GitHub login. Then ask for what you want, for example "build the project list page". If you would rather not run the command yourself, paste this to the agent instead:

> Use the ZHA UI design system for everything visual in this project. Run `npx skills add GitZHACODE/zha-ui -y`, then read the installed `zha-ui/SKILL.md` and follow it: install `@gitzhacode/zha-ui-css` from `github:GitZHACODE/zha-ui#release/css`, load its `index.css` once, set `data-brand`, `data-theme` and `data-surface` on `<html>`, and use only its classes and tokens. Never write custom colours, invent CSS variables or add inline layout.

The skill is [`skills/zha-ui/SKILL.md`](./skills/zha-ui/SKILL.md); its [`reference.md`](./skills/zha-ui/reference.md) lists every class and variable.

## Quick start by hand

**1. Install the stylesheet.** Add to `package.json` and run your installer (no token, no `.npmrc`; it reuses your GitHub access):

```jsonc
"dependencies": { "@gitzhacode/zha-ui-css": "github:GitZHACODE/zha-ui#release/css" }
```

**2. Load it once.** In a bundled app, `import '@gitzhacode/zha-ui-css/index.css';` in the entry file. In a plain HTML page, one line in `<head>`:

```html
<link rel="stylesheet" href="./node_modules/@gitzhacode/zha-ui-css/dist/index.css">
```

**3. Set the switches on your `<html>` tag** (see [How it works](#how-it-works)):

```html
<html data-brand="es" data-theme="light" data-surface="work">
```

With the stylesheet loaded and the switches set, use the ready-made classes:

```html
<button class="btn btn--primary">Explore</button>
<div class="card">…your content…</div>
<input class="input" placeholder="Search">
```

Every class and colour is listed in [`skills/zha-ui/reference.md`](./skills/zha-ui/reference.md).
````

(The block above is fenced with four backticks because it holds fences of its own.) Delete the `## Using an AI assistant (Claude / Cursor / Copilot)?` section (heading and its paragraph); the agent quick start replaces it.

- [ ] **Step 2: The hub**

In `examples/index.html`, change `<p>Two ways to begin an on-brand app: copy the pattern, or run it.</p>` to `<p>Three ways to begin an on-brand app: hand it to your coding agent, copy the pattern, or run it.</p>`, and insert this card as the first child of the Starters `<div class="grid">`, before the vanilla starter card:

```html
        <div class="card">
          <div class="stack stack--tight">
            <h3>Your coding agent</h3>
            <p>Claude Code, Codex CLI and Gemini CLI read the zha-ui skill. Install it in your
               project, then describe the app: the agent installs the package and composes on-brand pages.</p>
            <pre><code>npx skills add GitZHACODE/zha-ui</code></pre>
            <p>Or paste this to the agent: "Use the ZHA UI design system for everything visual in this
               project. Run npx skills add GitZHACODE/zha-ui -y, then read the installed zha-ui/SKILL.md
               and follow it."</p>
          </div>
        </div>
```

- [ ] **Step 3: The vanilla starter comment**

Replace lines 7-8 of `examples/zha-app-vanilla/index.html`:

```html
  <!-- Ring 1: one <link> to the bundled CSS. In production, pin the hosted major.minor:
       <link rel="stylesheet" href="https://<pages-host>/zha-ui/0.1/index.css"> -->
```

with:

```html
  <!-- Ring 1: one <link> to the bundled CSS. In a real project, install the package and link it:
       <link rel="stylesheet" href="./node_modules/@gitzhacode/zha-ui-css/dist/index.css"> -->
```

- [ ] **Step 4: Gate**

Run: `pnpm build && pnpm lint 2>&1 | grep -E "examples hub|zha-app-vanilla|Tasks"`
Expected: both guard lines end `✓`; lint `3 successful`. `grep -rn "pages-host" --include=*.md --include=*.html . | grep -v node_modules | grep -v "docs/"` prints nothing.

- [ ] **Step 5: Commit**

```bash
git add README.md examples/index.html examples/zha-app-vanilla/index.html
git commit -m "docs: the quick start opens with the agent route (npx skills add GitZHACODE/zha-ui or one pasted paragraph)"
```

---

### Task 10: Tie-up - changeset, consumer notes, spec amendments, render-verify

**Files:**
- Modify: `.changeset/composition-layer.md` (append bullets), `docs/tickets/2026-10-01-consumer-notes-0.1.3.md` (`## What to add`, `## Where the rules live`), `docs/specs/2026-09-30-zha-ui-composition-layer-design.md` (append `## 13. Amendments (2026-10-06, agent-first pass)`), `docs/specs/2026-10-06-zha-ui-agent-first-pass-design.md:3` (status line), `PLAN.md` (`## Done` entry)
- Create (gitignored): `.playwright-mcp/verify-agent-first/*.png`

**Model:** implementer=opus, reviewer=opus - judgement across docs plus the render-verify

**Interfaces:**
- Consumes: everything above.
- Produces: the record the maintainer reads before the PR; the final whole-branch review and the artifact refresh follow outside this plan.

- [ ] **Step 1: Changeset**

Append to the bullet list in `.changeset/composition-layer.md`:

```
- **Agent-first pass (2026-10-06):** `.skip-link` (the first element of every skeleton; sr-only until keyboard focus); `.hero--bleed` pads to the `.container` edge so the hero text lines up with the column below; `.btn` and `.icon-btn` with `aria-disabled="true"` take the disabled value and stop answering the pointer; `.chip__remove` hover skips disabled; the app bar goes opaque under `prefers-reduced-transparency`; the sidebar's current-page bar and the badge dot survive forced colours; `llms.txt` marks `--focus-ring` deprecated.
- **The zha-ui skill:** `skills/zha-ui/SKILL.md` and `reference.md` (the former `AI-USAGE.md`) in the Agent Skills format; `npx skills add GitZHACODE/zha-ui` installs it for Claude Code, Codex CLI and Gemini CLI. The README's quick start opens with that route.
- **Repo-internal:** the React starter runs the drift guard through a JSX transform; the gradient showcase shows the graphic design team's four meshes beside their CSS twins.
```

- [ ] **Step 2: Consumer notes**

In `docs/tickets/2026-10-01-consumer-notes-0.1.3.md`, under `## What to add`, append:

```
- A skip link: `<a class="skip-link" href="#main">Skip to content</a>` as the first element in `<body>`, and `id="main"` on your `<main>`. It is invisible until a keyboard user reaches it.
```

Under `## Where the rules live`, replace the first paragraph (the one beginning `Read AGENTS.md`, which names sections that Task 8 moved into the skill) with:

```
Read the zha-ui skill, `skills/zha-ui/SKILL.md`: §5 for the page recipes, §6 for the taste rules (ZHA Sans
only in the lockup, logo, `.hero > h1` and decks, regular and upright, 24 px or larger) and §8 for the
checklist; `skills/zha-ui/reference.md` lists every class with its role. The token list with values is
`llms.txt`; class names are in the generated `classes.txt`.
```

and append to the section:

```
- Your coding agent can take the rules directly: `npx skills add GitZHACODE/zha-ui` in your project installs the `zha-ui` skill for Claude Code, Codex CLI and Gemini CLI; the README's quick start has the one paragraph to paste if you would rather not run it.
```

- [ ] **Step 3: Spec amendments**

Append to `docs/specs/2026-09-30-zha-ui-composition-layer-design.md`:

```markdown

## 13. Amendments (2026-10-06, agent-first pass)

`docs/specs/2026-10-06-zha-ui-agent-first-pass-design.md` and its plan change the layer as follows; where the CSS now differs from the blocks above, the CSS is authoritative:

- §5.3: `.hero--bleed` declares `--container-w: 72rem` and pads to `max(var(--gutter), (100% - var(--container-w)) / 2)`, the `.container` edge; the 768 px hero padding applies its inline part to `.hero:where(:not(.hero--bleed))` only, and the 640 px gutter drop reaches `.hero--bleed`.
- §5.5: `.btn[aria-disabled="true"]` and `.icon-btn[aria-disabled="true"]` take the disabled value with `pointer-events: none`; `.chip__remove` joins the disabled list and its hover carries the guard.
- §5.6: `.skip-link` ships in `nav.css` (sr-only until `:focus-visible`); the app bar is opaque under `prefers-reduced-transparency`; the sidebar current-page bar and the badge dot keep system colours under `forced-colors`.
- §6: the guidance moved: skeletons, rules, anti-patterns, checklist and type rules live in `skills/zha-ui/SKILL.md`, the vocabulary in `skills/zha-ui/reference.md` (the former AI-USAGE.md); AGENTS.md keeps the repo-specific part and points at the skill. Ring 1 links the installed package's `dist/index.css`; the `<pages-host>` placeholder is gone.
- §7: the React starter runs the guard through `jsxToMarkup()`; negative CSS tests fail when their block is missing.
- §4: `llms.txt` marks `--focus-ring` deprecated.
```

Change line 3 of `docs/specs/2026-10-06-zha-ui-agent-first-pass-design.md` to begin `**Status:** Implemented 2026-10-06 on feat/composition-layer; render-verified per §7 ·`.

- [ ] **Step 4: Render-verify**

From the playwright folder (Global Constraints), write and run one script that saves into `C:\Users\aleksander.mastalski\repositories\zha-ui\.playwright-mcp\verify-agent-first\`:

1. `hub-1440-light.png`, `hub-1440-dark.png` (`colorScheme` alone does not switch this bundle: set `document.documentElement.dataset.theme = 'dark'` in the page), `hub-390-light.png`: full page. Print the hero eyebrow's and `main.container`'s left edges at each; they must be equal.
2. `hub-skip-link.png`: at 1440, press Tab once and capture the top-left 600 x 200 px; the link must be visible with the focus outline.
3. `showcase-1440.png`: full page of `examples/gradient-showcase/index.html`; the source-material section is first, four figures, image and swatch the same height.
4. `foundation-forced-colors.png`: `examples/foundation-reference/index.html` with `forcedColors: 'active'` in the context; crop the sidebar demo and the badge demo. The current-page bar and every badge dot must be visible.
5. `vanilla-390.png`: full page at 390 px in light; no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`).
6. The React starter: `pnpm --filter zha-app-react exec vite --port 7171 --strictPort --host 127.0.0.1` in the background (7171 is this checkout's registered dev port). If 7171 is already held by a stray vite from an earlier session, do not touch that process: run `pnpm --filter zha-app-react build` and `pnpm --filter zha-app-react exec vite preview --port 7172 --strictPort --host 127.0.0.1` instead (7172 is this checkout's preview port) and say so in the report. Then `react-1440.png` and, after one Tab, confirm `document.activeElement.className === 'skip-link'`. Stop the server you started.

Report every measurement in the task report. Any inequality, any missing marker, any horizontal scroll: stop and report.

- [ ] **Step 5: PLAN.md**

Add at the top of `## Done` in `PLAN.md`:

```
- 2026-10-06 Agent-first pass on feat/composition-layer (plan: docs/plans/2026-10-06-zha-ui-agent-first-pass.md): the graphic design team's meshes on the showcase; .hero--bleed aligned with the container; fourteen open review items closed (skip link, aria-disabled controls, chip-remove guard, reduced transparency, forced colours, llms deprecation, React drift guard, failing-when-missing tests, foundation labels, deck primitives, status lines, ports); the zha-ui skill (skills/zha-ui) with the agent-first quick start in the README and hub; render-verified
```

- [ ] **Step 6: Gate**

Run `pnpm build`, `pnpm test`, `pnpm lint`, reading each command's own summary.
Expected: all green: css 83, tokens 44, runtime 2; `Tasks: 11 successful` (build), `14 successful` (test), `3 successful` (lint). `git status --short` shows nothing outside the files this task names (the `.playwright-mcp/` captures are ignored).

- [ ] **Step 7: Commit**

```bash
git add .changeset/composition-layer.md docs/tickets/2026-10-01-consumer-notes-0.1.3.md docs/specs/2026-09-30-zha-ui-composition-layer-design.md docs/specs/2026-10-06-zha-ui-agent-first-pass-design.md PLAN.md
git commit -m "docs: agent-first pass recorded in the changeset, the consumer notes, spec 3 §13 and PLAN.md; render-verified"
```

---

## After the plan

The orchestrator dispatches the whole-branch review on Fable, applies one fix round if it finds anything, then rebuilds the 0.1.3 review artifact from the scratchpad (`zha-ui-020/build.mjs`, with the commit list re-exported from `git log --reverse --format='%h|%ad|%s' --date=short main..HEAD`) and tells the maintainer that `zh-es-hub/PORTS.md` carries an uncommitted row. The branch is still not pushed; the maintainer opens the PR.
