# Gradient Pool Redesign - Signature Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat 13-pair gradient pool with the owner-approved 16-entry signature-form pool (journeys / conics / auroras / fields) plus the live team wardrobe (`.accent-grad-aurora` / `-conic` / `-duo`), end to end: tokens, CSS classes, tests, showcase, docs, changeset.

**Architecture:** Tokens (`$type: "other"` gradient strings in `core.tokens.json`) emit as `--grad-pair-*` / `--brand-grad-*` CSS vars; `gradient.css` applies them via classes and owns the two `@supports` in-oklch swap blocks, the aurora `background-color` floors, and the print/forced-colors suppression. The committed preview `_preview-gradient-redesign.html` is the rendering source of truth - declarations are copied verbatim (normalising double spaces after commas to single), then the preview is deleted after render-verify parity.

**Tech Stack:** Style Dictionary v4 (multi-instance build), vitest, pnpm + turbo (Node ≥ 20), Playwright browser tools for render-verify.

**Spec:** `docs/specs/2026-07-23-zha-ui-gradient-pool-redesign-design.md` (owner-approved). Preview: `_preview-gradient-redesign.html` (repo root).

## Global Constraints

- Branch: `feat/consumer-feedback-quick-wins` (same unreleased 0.1.2 train, PR #5). Renames/removals are free - no deprecation path. Rewrite the existing changeset, do not add one.
- Base pool tokens NEVER contain `in oklch`; oklch twins are separate `-oklch` tokens swapped only by classes (same doctrine as `--grad-spectrum-oklch`: never use a `-oklch` var directly).
- Conic grammar trap (spec §6): the interpolation clause goes **after** the position - `conic-gradient(from 235deg at 50% 120% in oklch, …)`. The other order parses invalid and blanks the whole background at computed-value time.
- Feature-test exactly the capability used: linear swaps behind `@supports (background-image: linear-gradient(in oklch, red, red))`; the conic swap behind `@supports (background-image: conic-gradient(in oklch, red, red))`. Never `@supports (color: oklch(…))`.
- Aurora weak-engine rule (spec §6): the near-black floor is a `background-color` on the class, never a gradient layer in the token - a failed `color-mix()` stack must degrade to a solid dark panel, not transparent.
- Conic centres sit off-canvas; final conic stop wrap-held to `360deg`.
- All colours via `var(--color-typology-*)` / `var(--color-neutral-*)` / `var(--accent)` / `var(--accent-2)` - no literals.
- All commands run from the repo root. Build: `pnpm build`; tests: `pnpm test`; lint: `pnpm lint`.
- The 16 pool names: `polar blaze reef nova orchid` (J) · `beacon sundial prism verdigris` (C) · `borealis nebula abyss furnace` (A) · `signal terra regatta` (D). oklch twins exist for exactly: `polar nova signal terra regatta` (+ team `duo`, `conic`).
- Retired flat-13 names: `electric royal plum ocean deep-sky twilight sunrise coral ember raspberry foliage sea-pine chartreuse` (note: `ocean`/`ember` still exist as `--grad-hero-*` mesh names - only the `-pair-` forms die).

---

### Task 1: Token layer - 16-entry pool + team wardrobe tokens + llms guidance

**Files:**
- Modify: `packages/tokens/test/gradient.test.ts` (replace the tests at lines 49-72; keep hero/spectrum/washes tests and the `decorative only` llms test)
- Modify: `packages/tokens/src/semantic/core.tokens.json` (replace `grad.pair` at lines 25-39; add three `brand.*` tokens after `grad-subtle` at line 12)
- Modify: `packages/tokens/style-dictionary.config.mjs` (rewrite the gradient guidance line, line 45)

**Interfaces:**
- Consumes: existing `--color-typology-<hue>`, `--color-neutral-ink` (#1d1d1b), `--color-neutral-black` (#000000), `--accent`, `--accent-2` vars.
- Produces (Task 2 depends on these exact var names): `--grad-pair-<name>` for all 16 names; `--grad-pair-{polar,nova,signal,terra,regatta}-oklch`; `--brand-grad-aurora`; `--brand-grad-conic` + `--brand-grad-conic-oklch`; `--brand-grad-duo` + `--brand-grad-duo-oklch`. Aurora/team-aurora token values are the radial stack ONLY (no floor layer).

- [ ] **Step 1: Write the failing tests**

In `packages/tokens/test/gradient.test.ts`, delete the two tests `'emits the 13 un-assigned team-pair pool tokens…'` (lines 49-66) and `'llms.txt lists the pair pool AND flags it un-assigned'` (lines 68-72). In their place insert (inside the same `describe`):

```ts
  const POOL = [
    'polar', 'blaze', 'reef', 'nova', 'orchid',   // J · journeys
    'beacon', 'sundial', 'prism', 'verdigris',    // C · conics
    'borealis', 'nebula', 'abyss', 'furnace',     // A · auroras
    'signal', 'terra', 'regatta',                 // D · fields
  ];
  const val = (c: string, name: string) => c.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim() ?? '';

  it('emits the journey + field linears verbatim from the approved preview', () => {
    const c = css();
    expect(val(c, 'grad-pair-polar')).toBe('linear-gradient(160deg, var(--color-typology-purple) 0%, var(--color-typology-ultramarine) 45%, var(--color-typology-teal) 100%)');
    expect(val(c, 'grad-pair-blaze')).toBe('linear-gradient(15deg, var(--color-typology-magenta) 0%, var(--color-typology-orange) 55%, var(--color-typology-yellow) 100%)');
    expect(val(c, 'grad-pair-reef')).toBe('linear-gradient(75deg, var(--color-typology-teal) 0 14%, var(--color-typology-dark-green) 48%, var(--color-typology-lime) 100%)');
    expect(val(c, 'grad-pair-nova')).toBe('linear-gradient(135deg, var(--color-typology-ultramarine) 0%, var(--color-typology-magenta) 50%, var(--color-typology-apricot) 100%)');
    expect(val(c, 'grad-pair-orchid')).toBe('linear-gradient(180deg, var(--color-typology-blue) 0%, var(--color-typology-purple) 55%, var(--color-typology-magenta) 100%)');
    expect(val(c, 'grad-pair-signal')).toBe('linear-gradient(118deg, var(--color-typology-lime) 0 32%, var(--color-typology-ultramarine) 68% 100%)');
    expect(val(c, 'grad-pair-terra')).toBe('linear-gradient(0deg, var(--color-typology-dark-green) 0 38%, var(--color-typology-yellow) 54%, var(--color-typology-apricot) 68% 100%)');
    expect(val(c, 'grad-pair-regatta')).toBe('linear-gradient(135deg, var(--color-typology-blue) 0 28%, var(--color-typology-orange) 46% 54%, var(--color-typology-blue) 72% 100%)');
  });

  it('emits the conics: off-canvas centres, wrap-held to 360deg, sRGB only', () => {
    const c = css();
    expect(val(c, 'grad-pair-beacon')).toBe('conic-gradient(from 115deg at 105% -10%, var(--color-typology-teal) 55deg, var(--color-typology-ultramarine) 105deg, var(--color-typology-teal) 155deg, var(--color-typology-teal) 360deg)');
    expect(val(c, 'grad-pair-sundial')).toBe('conic-gradient(from 250deg at 50% 118%, var(--color-typology-yellow) 0deg, var(--color-typology-apricot) 60deg, var(--color-typology-orange) 120deg, var(--color-typology-cool-red) 180deg, var(--color-typology-cool-red) 360deg)');
    expect(val(c, 'grad-pair-prism')).toBe('conic-gradient(from 315deg at -10% 115%, var(--color-typology-purple) 0deg, var(--color-typology-magenta) 65deg, var(--color-typology-cool-red) 125deg, var(--color-typology-cool-red) 360deg)');
    expect(val(c, 'grad-pair-verdigris')).toBe('conic-gradient(from 125deg at 105% -10%, var(--color-typology-dark-green) 62deg, var(--color-typology-teal) 108deg, var(--color-typology-blue) 152deg, var(--color-typology-blue) 360deg)');
  });

  it('emits the auroras as color-mix radial stacks ONLY - the floor is class-level, not a token layer', () => {
    const c = css();
    expect(val(c, 'grad-pair-borealis')).toBe('radial-gradient(ellipse 28% 22% at 82% 72%, color-mix(in srgb, var(--color-typology-light-green) 95%, transparent) 0%, transparent 75%), radial-gradient(ellipse 75% 60% at 20% 22%, color-mix(in srgb, var(--color-typology-ultramarine) 82%, transparent) 0%, transparent 62%), radial-gradient(ellipse 52% 44% at 80% 72%, color-mix(in srgb, var(--color-typology-light-green) 68%, transparent) 0%, transparent 58%), radial-gradient(ellipse 90% 40% at 55% 45%, color-mix(in srgb, var(--color-typology-teal) 30%, transparent) 0%, transparent 70%)');
    expect(val(c, 'grad-pair-nebula')).toBe('radial-gradient(ellipse 80% 85% at 30% 40%, color-mix(in srgb, var(--color-typology-purple) 72%, transparent) 0%, transparent 65%), radial-gradient(ellipse 40% 35% at 85% 15%, color-mix(in srgb, var(--color-typology-apricot) 80%, transparent) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 70% 80%, color-mix(in srgb, var(--color-typology-magenta) 34%, transparent) 0%, transparent 62%)');
    expect(val(c, 'grad-pair-abyss')).toBe('radial-gradient(ellipse 95% 75% at 50% 108%, color-mix(in srgb, var(--color-typology-blue) 88%, transparent) 0%, transparent 70%), radial-gradient(ellipse 55% 38% at 22% 6%, color-mix(in srgb, var(--color-typology-dark-green) 68%, transparent) 0%, transparent 58%), radial-gradient(ellipse 80% 35% at 65% 45%, color-mix(in srgb, var(--color-typology-teal) 26%, transparent) 0%, transparent 68%)');
    expect(val(c, 'grad-pair-furnace')).toBe('radial-gradient(ellipse 70% 55% at 75% 70%, color-mix(in srgb, var(--color-typology-orange) 80%, transparent) 0%, transparent 62%), radial-gradient(ellipse 55% 65% at 15% 30%, color-mix(in srgb, var(--color-typology-magenta) 62%, transparent) 0%, transparent 60%)');
    for (const name of ['borealis', 'nebula', 'abyss', 'furnace'])
      expect(val(c, `grad-pair-${name}`), `${name} has no floor layer`).not.toContain('linear-gradient');
  });

  it('cross-axis journeys/fields ship -oklch twins with identical stops; conics/auroras have none', () => {
    const c = css();
    for (const name of ['polar', 'nova', 'signal', 'terra', 'regatta']) {
      const base = val(c, `grad-pair-${name}`);
      const twin = val(c, `grad-pair-${name}-oklch`);
      expect(base, `${name} base is sRGB`).not.toContain('in oklch');
      expect(twin, `${name} twin = base + interpolation clause`).toBe(base.replace('deg,', 'deg in oklch,'));
    }
    expect(c).not.toMatch(/--grad-pair-(blaze|reef|orchid|beacon|sundial|prism|verdigris|borealis|nebula|abyss|furnace)-oklch/);
  });

  it('pool emits exactly the 16 signature-form entries, once each (flat-13 retired)', () => {
    const c = css();
    for (const name of POOL)
      expect(c.match(new RegExp(`--grad-pair-${name}:`, 'g')), `--grad-pair-${name} emitted once`).toHaveLength(1);
    const names = [...new Set([...c.matchAll(/--grad-pair-([\w-]+?)(?:-oklch)?:/g)].map((m) => m[1]))];
    expect(names.sort()).toEqual([...POOL].sort());
  });

  it('emits the team wardrobe from live accent vars; the conic clause sits AFTER the position (§6 trap)', () => {
    const c = css();
    expect(val(c, 'brand-grad-aurora')).toBe('radial-gradient(ellipse 75% 65% at 22% 28%, color-mix(in srgb, var(--accent) 75%, transparent) 0%, transparent 62%), radial-gradient(ellipse 65% 55% at 80% 75%, color-mix(in srgb, var(--accent-2) 68%, transparent) 0%, transparent 60%)');
    expect(val(c, 'brand-grad-conic')).toBe('conic-gradient(from 235deg at 50% 120%, var(--accent) 0deg, var(--accent) 45deg, var(--accent-2) 135deg, var(--accent-2) 360deg)');
    expect(val(c, 'brand-grad-conic-oklch')).toBe('conic-gradient(from 235deg at 50% 120% in oklch, var(--accent) 0deg, var(--accent) 45deg, var(--accent-2) 135deg, var(--accent-2) 360deg)');
    expect(val(c, 'brand-grad-duo')).toBe('linear-gradient(118deg, var(--accent) 0 35%, var(--accent-2) 65% 100%)');
    expect(val(c, 'brand-grad-duo-oklch')).toBe('linear-gradient(118deg in oklch, var(--accent) 0 35%, var(--accent-2) 65% 100%)');
  });

  it('llms.txt lists the pool, flags it un-assigned, and carries the aurora text rule', () => {
    const txt = readFileSync(new URL('../dist/llms.txt', import.meta.url), 'utf8');
    expect(txt).toContain('--grad-pair-polar');
    expect(txt).not.toContain('--grad-pair-electric');
    expect(txt).toMatch(/un-?assigned/i);
    expect(txt).toMatch(/aurora/i);
  });
```

- [ ] **Step 2: Run the tokens tests to verify they fail**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens test`
Expected: FAIL - the new pool/team assertions fail against the stale dist (old 13-pair vars present, no `--grad-pair-polar`).

- [ ] **Step 3: Replace the tokens**

In `packages/tokens/src/semantic/core.tokens.json`:

**(a)** Inside `"brand"` (after the `"grad-subtle"` entry, line 12), add - note `DEFAULT`/`oklch` nesting produces `--brand-grad-conic` / `--brand-grad-conic-oklch` via the `name/no-default` transform:

```json
    "grad-aurora": { "$type": "other", "$value": "radial-gradient(ellipse 75% 65% at 22% 28%, color-mix(in srgb, var(--accent) 75%, transparent) 0%, transparent 62%), radial-gradient(ellipse 65% 55% at 80% 75%, color-mix(in srgb, var(--accent-2) 68%, transparent) 0%, transparent 60%)", "$description": "Team aurora - two live accent glows; the ink floor is .accent-grad-aurora's background-color (weak-engine rule). Identity/hero only; text via --text-*." },
    "grad-conic": {
      "DEFAULT": { "$type": "other", "$value": "conic-gradient(from 235deg at 50% 120%, var(--accent) 0deg, var(--accent) 45deg, var(--accent-2) 135deg, var(--accent-2) 360deg)", "$description": "Team conic - off-canvas sweep below the box, wrap-held to 360deg. Resolves live per team. Identity/hero only." },
      "oklch": { "$type": "other", "$value": "conic-gradient(from 235deg at 50% 120% in oklch, var(--accent) 0deg, var(--accent) 45deg, var(--accent-2) 135deg, var(--accent-2) 360deg)", "$description": "Team conic, oklch interpolation (clause AFTER the position - the other order blanks the background). Swapped in by .accent-grad-conic under the conic in-oklch feature test; never use directly." }
    },
    "grad-duo": {
      "DEFAULT": { "$type": "other", "$value": "linear-gradient(118deg, var(--accent) 0 35%, var(--accent-2) 65% 100%)", "$description": "Team duotone - plateaued two-field blend of the live pair. Identity/hero only." },
      "oklch": { "$type": "other", "$value": "linear-gradient(118deg in oklch, var(--accent) 0 35%, var(--accent-2) 65% 100%)", "$description": "Team duotone, oklch transition band. Swapped in by .accent-grad-duo under the linear in-oklch feature test; never use directly." }
    }
```

**(b)** Replace the entire `"pair"` object (lines 25-39) with:

```json
    "pair": {
      "polar": {
        "DEFAULT": { "$type": "other", "$value": "linear-gradient(160deg, var(--color-typology-purple) 0%, var(--color-typology-ultramarine) 45%, var(--color-typology-teal) 100%)", "$description": "Pool J (journey): purple→teal through ultramarine, 160°. Un-assigned - a team adopts an entry (pair + form) at confirmation. Decorative only." },
        "oklch": { "$type": "other", "$value": "linear-gradient(160deg in oklch, var(--color-typology-purple) 0%, var(--color-typology-ultramarine) 45%, var(--color-typology-teal) 100%)", "$description": "polar, oklch interpolation - swapped in by .grad-pair-polar under the linear in-oklch feature test; never use directly." }
      },
      "blaze": { "$type": "other", "$value": "linear-gradient(15deg, var(--color-typology-magenta) 0%, var(--color-typology-orange) 55%, var(--color-typology-yellow) 100%)", "$description": "Pool J (journey): magenta→yellow through orange, 15°. Un-assigned pool entry; decorative only." },
      "reef": { "$type": "other", "$value": "linear-gradient(75deg, var(--color-typology-teal) 0 14%, var(--color-typology-dark-green) 48%, var(--color-typology-lime) 100%)", "$description": "Pool J (journey): teal→lime through dark-green, 75°. Un-assigned pool entry; decorative only." },
      "nova": {
        "DEFAULT": { "$type": "other", "$value": "linear-gradient(135deg, var(--color-typology-ultramarine) 0%, var(--color-typology-magenta) 50%, var(--color-typology-apricot) 100%)", "$description": "Pool J (journey): ultramarine→apricot through magenta, 135°. Un-assigned pool entry; decorative only." },
        "oklch": { "$type": "other", "$value": "linear-gradient(135deg in oklch, var(--color-typology-ultramarine) 0%, var(--color-typology-magenta) 50%, var(--color-typology-apricot) 100%)", "$description": "nova, oklch interpolation - swapped in by .grad-pair-nova under the linear in-oklch feature test; never use directly." }
      },
      "orchid": { "$type": "other", "$value": "linear-gradient(180deg, var(--color-typology-blue) 0%, var(--color-typology-purple) 55%, var(--color-typology-magenta) 100%)", "$description": "Pool J (journey): blue→magenta through purple, 180°. Un-assigned pool entry; decorative only." },
      "beacon": { "$type": "other", "$value": "conic-gradient(from 115deg at 105% -10%, var(--color-typology-teal) 55deg, var(--color-typology-ultramarine) 105deg, var(--color-typology-teal) 155deg, var(--color-typology-teal) 360deg)", "$description": "Pool C (conic): teal↔ultramarine lighthouse wrap; off-canvas centre, wrap-held. Un-assigned pool entry; decorative only." },
      "sundial": { "$type": "other", "$value": "conic-gradient(from 250deg at 50% 118%, var(--color-typology-yellow) 0deg, var(--color-typology-apricot) 60deg, var(--color-typology-orange) 120deg, var(--color-typology-cool-red) 180deg, var(--color-typology-cool-red) 360deg)", "$description": "Pool C (conic): yellow↔cool-red sunset fan through apricot/orange; centre below the box. Un-assigned pool entry; decorative only." },
      "prism": { "$type": "other", "$value": "conic-gradient(from 315deg at -10% 115%, var(--color-typology-purple) 0deg, var(--color-typology-magenta) 65deg, var(--color-typology-cool-red) 125deg, var(--color-typology-cool-red) 360deg)", "$description": "Pool C (conic): purple↔cool-red through magenta; off-canvas centre, wrap-held. Un-assigned pool entry; decorative only." },
      "verdigris": { "$type": "other", "$value": "conic-gradient(from 125deg at 105% -10%, var(--color-typology-dark-green) 62deg, var(--color-typology-teal) 108deg, var(--color-typology-blue) 152deg, var(--color-typology-blue) 360deg)", "$description": "Pool C (conic): dark-green↔blue through teal; off-canvas centre, wrap-held. Un-assigned pool entry; decorative only." },
      "borealis": { "$type": "other", "$value": "radial-gradient(ellipse 28% 22% at 82% 72%, color-mix(in srgb, var(--color-typology-light-green) 95%, transparent) 0%, transparent 75%), radial-gradient(ellipse 75% 60% at 20% 22%, color-mix(in srgb, var(--color-typology-ultramarine) 82%, transparent) 0%, transparent 62%), radial-gradient(ellipse 52% 44% at 80% 72%, color-mix(in srgb, var(--color-typology-light-green) 68%, transparent) 0%, transparent 58%), radial-gradient(ellipse 90% 40% at 55% 45%, color-mix(in srgb, var(--color-typology-teal) 30%, transparent) 0%, transparent 70%)", "$description": "Pool A (aurora): ultramarine↔light-green (+teal haze) glows; radial stack only - the ink floor is .grad-pair-borealis's background-color. Dark-first panel; text via --text-*. Un-assigned; decorative only." },
      "nebula": { "$type": "other", "$value": "radial-gradient(ellipse 80% 85% at 30% 40%, color-mix(in srgb, var(--color-typology-purple) 72%, transparent) 0%, transparent 65%), radial-gradient(ellipse 40% 35% at 85% 15%, color-mix(in srgb, var(--color-typology-apricot) 80%, transparent) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 70% 80%, color-mix(in srgb, var(--color-typology-magenta) 34%, transparent) 0%, transparent 62%)", "$description": "Pool A (aurora): purple↔apricot (+magenta haze) glows; radial stack only - the black floor is .grad-pair-nebula's background-color. Dark-first panel; text via --text-*. Un-assigned; decorative only." },
      "abyss": { "$type": "other", "$value": "radial-gradient(ellipse 95% 75% at 50% 108%, color-mix(in srgb, var(--color-typology-blue) 88%, transparent) 0%, transparent 70%), radial-gradient(ellipse 55% 38% at 22% 6%, color-mix(in srgb, var(--color-typology-dark-green) 68%, transparent) 0%, transparent 58%), radial-gradient(ellipse 80% 35% at 65% 45%, color-mix(in srgb, var(--color-typology-teal) 26%, transparent) 0%, transparent 68%)", "$description": "Pool A (aurora): blue↔dark-green (+teal haze) glows; radial stack only - the ink floor is .grad-pair-abyss's background-color. Dark-first panel; text via --text-*. Un-assigned; decorative only." },
      "furnace": { "$type": "other", "$value": "radial-gradient(ellipse 70% 55% at 75% 70%, color-mix(in srgb, var(--color-typology-orange) 80%, transparent) 0%, transparent 62%), radial-gradient(ellipse 55% 65% at 15% 30%, color-mix(in srgb, var(--color-typology-magenta) 62%, transparent) 0%, transparent 60%)", "$description": "Pool A (aurora): orange↔magenta glows; radial stack only - the black floor is .grad-pair-furnace's background-color. Dark-first panel; text via --text-*. Un-assigned; decorative only." },
      "signal": {
        "DEFAULT": { "$type": "other", "$value": "linear-gradient(118deg, var(--color-typology-lime) 0 32%, var(--color-typology-ultramarine) 68% 100%)", "$description": "Pool D (field): lime⇢ultramarine plateaued blend, 118°; the band upgrades to oklch via the class (sRGB band mutes - decorative-accepted). Un-assigned; decorative only." },
        "oklch": { "$type": "other", "$value": "linear-gradient(118deg in oklch, var(--color-typology-lime) 0 32%, var(--color-typology-ultramarine) 68% 100%)", "$description": "signal, oklch transition band - swapped in by .grad-pair-signal under the linear in-oklch feature test; never use directly." }
      },
      "terra": {
        "DEFAULT": { "$type": "other", "$value": "linear-gradient(0deg, var(--color-typology-dark-green) 0 38%, var(--color-typology-yellow) 54%, var(--color-typology-apricot) 68% 100%)", "$description": "Pool D (field): dark-green⇢apricot horizon through yellow, 0°. Un-assigned; decorative only." },
        "oklch": { "$type": "other", "$value": "linear-gradient(0deg in oklch, var(--color-typology-dark-green) 0 38%, var(--color-typology-yellow) 54%, var(--color-typology-apricot) 68% 100%)", "$description": "terra, oklch transition bands - swapped in by .grad-pair-terra under the linear in-oklch feature test; never use directly." }
      },
      "regatta": {
        "DEFAULT": { "$type": "other", "$value": "linear-gradient(135deg, var(--color-typology-blue) 0 28%, var(--color-typology-orange) 46% 54%, var(--color-typology-blue) 72% 100%)", "$description": "Pool D (field): blue⇢orange⇢blue sash, 135°. Un-assigned; decorative only." },
        "oklch": { "$type": "other", "$value": "linear-gradient(135deg in oklch, var(--color-typology-blue) 0 28%, var(--color-typology-orange) 46% 54%, var(--color-typology-blue) 72% 100%)", "$description": "regatta, oklch transition bands - swapped in by .grad-pair-regatta under the linear in-oklch feature test; never use directly." }
      }
    },
```

- [ ] **Step 4: Rewrite the llms guidance line**

In `packages/tokens/style-dictionary.config.mjs`, replace the single guidance line (line 45, the one beginning `'Gradients are decorative only: --grad-hero-*`) with:

```js
      'Gradients are decorative only: --grad-hero-* are frozen black-first marketing hero backgrounds (hero text via --text-* vars, never literal #fff); --grad-spectrum is the 12-hue sweep - apply it via the .grad-spectrum class. --grad-pair-* are the 16 vetted but un-assigned signature-form pool entries in four families - journeys (polar blaze reef nova orchid), conics (beacon sundial prism verdigris), auroras (borealis nebula abyss furnace: dark glow panels, text via --text-* only), fields (signal terra regatta) - apply ONLY via the .grad-pair-* classes (the classes own the aurora floors and oklch swaps; never use any *-oklch gradient var directly - no fallback on engines without in-oklch gradients); pool entries are NOT team identities until confirmed. The team wardrobe .accent-grad / .accent-grad-aurora / .accent-grad-conic / .accent-grad-duo renders live from the confirmed pair. --grad-wash / --grad-glow / --brand-grad-subtle are the only gradients for work surfaces. Never behind working UI, never a heading fill.',
```

- [ ] **Step 5: Build and run the tokens tests**

Run: `pnpm --filter @gitzhacode/zha-ui-tokens build && pnpm --filter @gitzhacode/zha-ui-tokens test`
Expected: build succeeds (contrast gate untouched - `other`-type tokens aren't gated), all gradient tests PASS, including the untouched hero/spectrum/washes tests.

- [ ] **Step 6: Commit**

```bash
git add packages/tokens/src/semantic/core.tokens.json packages/tokens/style-dictionary.config.mjs packages/tokens/test/gradient.test.ts
git commit -m "feat(tokens): signature-form gradient pool (16 entries, 4 families) + team wardrobe vars"
```

---

### Task 2: CSS layer - pool classes, aurora floors, @supports swaps, suppression arms

**Files:**
- Modify: `packages/css/test/exports.test.ts` (replace the test at lines 173-185; update the cascade pin at line 315)
- Modify: `packages/css/src/primitives/gradient.css` (full rewrite below)

**Interfaces:**
- Consumes: every var Task 1 produces, plus `--color-neutral-ink` / `--color-neutral-black`.
- Produces (Tasks 3-5 depend on these class names): `.grad-pair-<name>` × 16, `.accent-grad-aurora`, `.accent-grad-conic`, `.accent-grad-duo`. `.accent-grad`, `.accent-grad-subtle`, `.grad-spectrum`, washes, heroes unchanged in behaviour.

- [ ] **Step 1: Write the failing tests**

In `packages/css/test/exports.test.ts`, replace the test `'ships the 13 un-assigned team-pair pool classes, sRGB-interpolated (no in-oklch upgrade)'` (lines 173-185) with these four tests:

```ts
  it('ships the 16 signature-form pool classes; the flat-13 are retired', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    for (const c of ['polar', 'blaze', 'reef', 'nova', 'orchid', 'beacon', 'sundial', 'prism',
                     'verdigris', 'borealis', 'nebula', 'abyss', 'furnace', 'signal', 'terra', 'regatta'])
      expect(css).toMatch(new RegExp(`\\.grad-pair-${c}\\s*\\{[^}]*background-image:\\s*var\\(--grad-pair-${c}\\)`));
    for (const gone of ['electric', 'royal', 'plum', 'ocean', 'deep-sky', 'twilight', 'sunrise',
                        'coral', 'ember', 'raspberry', 'foliage', 'sea-pine', 'chartreuse'])
      expect(css, `.grad-pair-${gone} retired`).not.toMatch(new RegExp(`\\.grad-pair-${gone}\\b`));
    // print + forced-colors suppression via the [class*="grad-pair-"] umbrella arm
    expect(css).toMatch(/@media print\s*\{[^@]*\[class\*="grad-pair-"\][^{]*\{[^}]*background:\s*#fff none/s);
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{[^@]*\[class\*="grad-pair-"\][^{]*\{[^}]*background-image:\s*none/s);
  });

  it('aurora classes floor on a background-COLOR so a failed color-mix stack degrades to a dark panel', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    for (const [name, floor] of [['borealis', 'ink'], ['abyss', 'ink'], ['nebula', 'black'], ['furnace', 'black']] as const)
      expect(css).toMatch(new RegExp(
        `\\.grad-pair-${name}\\s*\\{[^}]*background-color:\\s*var\\(--color-neutral-${floor}\\)[^}]*background-image:\\s*var\\(--grad-pair-${name}\\)`, 's'));
    expect(css).toMatch(/\.accent-grad-aurora\s*\{[^}]*background-color:\s*var\(--color-neutral-ink\)[^}]*background-image:\s*var\(--brand-grad-aurora\)/s);
  });

  it('oklch twins swap under the RIGHT feature test: linear twins in the linear block, conic in the conic block', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const linear = css.match(/@supports \(background-image: linear-gradient\(in oklch, red, red\)\)\s*\{([^@]*)\}/s)?.[1] ?? '';
    for (const n of ['polar', 'nova', 'signal', 'terra', 'regatta'])
      expect(linear, `${n} twin under the linear test`).toContain(`var(--grad-pair-${n}-oklch)`);
    expect(linear).toContain('var(--brand-grad-duo-oklch)');
    expect(linear, 'the conic twin must NOT ride the linear test').not.toContain('conic');
    const conic = css.match(/@supports \(background-image: conic-gradient\(in oklch, red, red\)\)\s*\{([^@]*)\}/s)?.[1] ?? '';
    expect(conic).toMatch(/\.accent-grad-conic\s*\{[^}]*var\(--brand-grad-conic-oklch\)/s);
    // conic + aurora pool entries are sRGB-only - no twin vars exist for them anywhere
    expect(css).not.toMatch(/--grad-pair-(blaze|reef|orchid|beacon|sundial|prism|verdigris|borealis|nebula|abyss|furnace)-oklch/);
  });

  it('ships the team wardrobe classes and lists them in both suppression arms', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.accent-grad-conic\s*\{[^}]*background-image:\s*var\(--brand-grad-conic\)/s);
    expect(css).toMatch(/\.accent-grad-duo\s*\{[^}]*background-image:\s*var\(--brand-grad-duo\)/s);
    for (const c of ['accent-grad-aurora', 'accent-grad-conic', 'accent-grad-duo']) {
      expect(css).toMatch(new RegExp(`@media print\\s*\\{[^@]*\\.${c}[^{]*\\{[^}]*background:\\s*#fff none`, 's'));
      expect(css).toMatch(new RegExp(`@media \\(forced-colors: active\\)\\s*\\{[^@]*\\.${c}[^{]*\\{[^}]*background-image:\\s*none`, 's'));
    }
  });
```

Then update the cascade-order pin (line 315): change

```ts
      expect(c.indexOf('.grad-pair-electric ')).toBeLessThan(c.indexOf('[class*="grad-pair-"]'));
```

to

```ts
      expect(c.indexOf('.grad-pair-polar ')).toBeLessThan(c.indexOf('[class*="grad-pair-"]'));
```

- [ ] **Step 2: Run the css tests to verify they fail**

Run: `pnpm --filter @gitzhacode/zha-ui-css test`
Expected: FAIL - new pool classes absent from the stale dist. (Note: the pre-existing spectrum test at line 186 must be left untouched - the rewrite keeps `.grad-spectrum` as the FIRST rule of the linear @supports block.)

- [ ] **Step 3: Rewrite gradient.css**

Replace the full contents of `packages/css/src/primitives/gradient.css` with:

```css
/* Gradient library - tokens from @gitzhacode/zha-ui-tokens (--grad-*, --brand-grad-*).
   Two provenance classes (specs: 2026-07-09 gradient library, 2026-07-23 pool redesign):
   frozen sRGB brand art (hero meshes) and palette-derived (spectrum / team / washes / pool).
   All decorative - never the sole carrier of meaning, never a work-surface heading fill. */

/* Hero meshes - frozen brand art (sRGB, brand-ref §2.4). Black-first marketing heroes; white text assumed. */
.grad-hero-ember  { background-image: var(--grad-hero-ember); }
.grad-hero-ocean  { background-image: var(--grad-hero-ocean); }
.grad-hero-violet { background-image: var(--grad-hero-violet); }
.grad-hero-dusk   { background-image: var(--grad-hero-dusk); }

/* Spectrum - sRGB base; the in-oklch upgrade rides the shared linear feature test below. */
.grad-spectrum { background-image: var(--grad-spectrum); }

/* Team wash + curated washes - resolve live from the accent vars per brand/theme. */
.accent-grad-subtle { background-image: var(--brand-grad-subtle); }
.grad-wash { background-image: var(--grad-wash); }
.grad-glow { background-image: var(--grad-glow); }

/* Signature-form pool - 16 vetted, UN-ASSIGNED entries in four form families (pool-redesign
   spec §2). Anyone may invoke them decoratively; at confirmation a team adopts an ENTRY -
   its two anchor hues become accent/accent-2 and its form becomes the team signature. */

/* J · journeys - multi-stop linears through a third palette hue */
.grad-pair-polar  { background-image: var(--grad-pair-polar); }
.grad-pair-blaze  { background-image: var(--grad-pair-blaze); }
.grad-pair-reef   { background-image: var(--grad-pair-reef); }
.grad-pair-nova   { background-image: var(--grad-pair-nova); }
.grad-pair-orchid { background-image: var(--grad-pair-orchid); }

/* C · conics - off-canvas centres (an inside-the-box centre renders a pinwheel singularity),
   final stop wrap-held to 360deg. Within-family arcs - sRGB on purpose, no oklch twin. */
.grad-pair-beacon    { background-image: var(--grad-pair-beacon); }
.grad-pair-sundial   { background-image: var(--grad-pair-sundial); }
.grad-pair-prism     { background-image: var(--grad-pair-prism); }
.grad-pair-verdigris { background-image: var(--grad-pair-verdigris); }

/* A · auroras - layered alpha radials over a near-black floor; dark-first identity panels,
   text via --text-* only. The floor is a BACKGROUND-COLOR, not a gradient layer: color-mix()
   stops invalidate the whole background-image on weak engines, and a failed stack must
   degrade to a solid dark panel - never to transparent. */
.grad-pair-borealis { background-color: var(--color-neutral-ink);   background-image: var(--grad-pair-borealis); }
.grad-pair-nebula   { background-color: var(--color-neutral-black); background-image: var(--grad-pair-nebula); }
.grad-pair-abyss    { background-color: var(--color-neutral-ink);   background-image: var(--grad-pair-abyss); }
.grad-pair-furnace  { background-color: var(--color-neutral-black); background-image: var(--grad-pair-furnace); }

/* D · fields - plateaued two-field blends; the transition band upgrades to oklch below
   (the sRGB fallback band mutes - decorative-accepted). */
.grad-pair-signal  { background-image: var(--grad-pair-signal); }
.grad-pair-terra   { background-image: var(--grad-pair-terra); }
.grad-pair-regatta { background-image: var(--grad-pair-regatta); }

/* Team signature forms - resolve live from var(--accent)/var(--accent-2); every confirmed
   team inherits the wardrobe (unconfirmed teams blend accent → core-default magenta; never
   shipped as identity). .accent-grad / .accent-grad-subtle stay as-is. */
.accent-grad-aurora { background-color: var(--color-neutral-ink); background-image: var(--brand-grad-aurora); }
.accent-grad-conic  { background-image: var(--brand-grad-conic); }
.accent-grad-duo    { background-image: var(--brand-grad-duo); }

/* in-oklch upgrades - feature-test EXACTLY the capability used: oklch colours shipped before
   in-oklch gradient interpolation (Safari 15.4 vs 16.2), linear shipped before conic, and a
   failed var() swap blanks the property at computed-value time instead of falling back. */
@supports (background-image: linear-gradient(in oklch, red, red)) {
  .grad-spectrum     { background-image: var(--grad-spectrum-oklch); }
  .grad-pair-polar   { background-image: var(--grad-pair-polar-oklch); }
  .grad-pair-nova    { background-image: var(--grad-pair-nova-oklch); }
  .grad-pair-signal  { background-image: var(--grad-pair-signal-oklch); }
  .grad-pair-terra   { background-image: var(--grad-pair-terra-oklch); }
  .grad-pair-regatta { background-image: var(--grad-pair-regatta-oklch); }
  .accent-grad-duo   { background-image: var(--brand-grad-duo-oklch); }
}
/* Conic interpolation is its own capability, tested separately; the clause goes AFTER the
   position (grammar trap: the other order is invalid and blanks at computed-value time). */
@supports (background-image: conic-gradient(in oklch, red, red)) {
  .accent-grad-conic { background-image: var(--brand-grad-conic-oklch); }
}

/* Free guarantees. This partial loads after base.css, so the .accent-grad-text override wins its
   equal-specificity tie; the lockup's print fix lives in es-lockup.css (concatenated later). */
@media print {
  .grad-hero-ember, .grad-hero-ocean, .grad-hero-violet, .grad-hero-dusk,
  .grad-spectrum, .grad-wash, .grad-glow, .accent-grad-subtle, .accent-grad,
  .accent-grad-aurora, .accent-grad-conic, .accent-grad-duo,
  [class*="grad-pair-"] {
    background: #fff none;
  }
  /* gradient-clipped text must never print transparent (print skips background images) */
  .accent-grad-text { background: none; color: var(--accent-fill); }
}
@media (forced-colors: active) {
  /* forced-colors preserves background IMAGES (only colours are forced) - drop them explicitly;
     the aurora floor colours are forced by the UA itself.
     [class*="grad-pair-"] covers the whole pool (and any entry added later) in one arm. */
  .grad-hero-ember, .grad-hero-ocean, .grad-hero-violet, .grad-hero-dusk,
  .grad-spectrum, .grad-wash, .grad-glow, .accent-grad-subtle, .accent-grad,
  .accent-grad-aurora, .accent-grad-conic, .accent-grad-duo,
  [class*="grad-pair-"] {
    background-image: none;
  }
}
```

- [ ] **Step 4: Build and run the css tests**

Run: `pnpm --filter @gitzhacode/zha-ui-css build && pnpm --filter @gitzhacode/zha-ui-css test`
Expected: PASS - including the untouched spectrum swap test (`.grad-spectrum` stays the first rule of the linear block) and the cascade-order pins.

- [ ] **Step 5: Commit**

```bash
git add packages/css/src/primitives/gradient.css packages/css/test/exports.test.ts
git commit -m "feat(css): signature-form pool classes - aurora background-color floors, split linear/conic in-oklch swaps, team wardrobe"
```

---

### Task 3: Showcase rebuild by family

**Files:**
- Modify: `examples/gradient-showcase/index.html` (replace the team section at lines 39-43 and the pool section at lines 45-77; header, hero-mesh, spectrum, and washes sections unchanged)

**Interfaces:**
- Consumes: class names from Task 2. Drift guard requires every class/var used here to exist in the built bundle.

- [ ] **Step 1: Replace the team-gradient section**

Replace the section at lines 39-43 (`Team gradient (ES) - identity / hero`) with:

```html
    <section style="margin-bottom: var(--space-8)">
      <p style="margin: 0 0 var(--space-3); font-family: var(--font-mono); font-size: var(--fs-label); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted)">Team signature wardrobe (ES) - identity / hero, live from the confirmed pair</p>
      <h2 class="accent-grad-text" style="margin: 0 0 var(--space-4); font: var(--fs-display)/var(--leading-display) var(--font-secondary); letter-spacing: var(--tracking-display)">Forever advancing</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: var(--space-4)">
        <div><div class="accent-grad" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.accent-grad</span> · flat sweep</p></div>
        <div><div class="accent-grad-aurora" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.accent-grad-aurora</span> · glow panel</p></div>
        <div><div class="accent-grad-conic" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.accent-grad-conic</span> · angular sweep</p></div>
        <div><div class="accent-grad-duo" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.accent-grad-duo</span> · plateaued blend</p></div>
      </div>
    </section>
```

- [ ] **Step 2: Replace the pool section**

Replace the section at lines 45-77 (`Team-pair pool - 13 vetted sweeps, un-assigned`) with:

```html
    <section style="margin-bottom: var(--space-8)">
      <p style="margin: 0 0 var(--space-2); font-family: var(--font-mono); font-size: var(--fs-label); letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted)">Signature-form pool - 16 entries, four families, un-assigned</p>
      <p style="max-width: 52rem; margin: 0 0 var(--space-4); font-size: var(--fs-small); color: var(--text-muted-strong)">Anyone may invoke an entry as decoration. At confirmation a team adopts an <em>entry</em>: its two anchor hues become the team pair (rendered live as <span style="font-family: var(--font-mono)">--brand-grad</span> and the wardrobe above) and its form becomes the team signature. Through-hues and hazes are decorative. ES's confirmed teal → magenta is not in the pool.</p>

      <p style="margin: 0 0 var(--space-2); font-size: var(--fs-small); color: var(--text-muted)">J · journeys - travel through a third hue</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: var(--space-4); margin-bottom: var(--space-5)">
        <div><div class="grad-pair-polar" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-polar</span> · purple → (ultramarine) → teal</p></div>
        <div><div class="grad-pair-blaze" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-blaze</span> · magenta → (orange) → yellow</p></div>
        <div><div class="grad-pair-reef" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-reef</span> · teal → (dark green) → lime</p></div>
        <div><div class="grad-pair-nova" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-nova</span> · ultramarine → (magenta) → apricot</p></div>
        <div><div class="grad-pair-orchid" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-orchid</span> · blue → (purple) → magenta</p></div>
      </div>

      <p style="margin: 0 0 var(--space-2); font-size: var(--fs-small); color: var(--text-muted)">C · conics - off-centre angular sweeps</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: var(--space-4); margin-bottom: var(--space-5)">
        <div><div class="grad-pair-beacon" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-beacon</span> · teal ↔ ultramarine</p></div>
        <div><div class="grad-pair-sundial" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-sundial</span> · yellow ↔ cool red</p></div>
        <div><div class="grad-pair-prism" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-prism</span> · purple ↔ cool red</p></div>
        <div><div class="grad-pair-verdigris" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-verdigris</span> · dark green ↔ blue</p></div>
      </div>

      <p style="margin: 0 0 var(--space-2); font-size: var(--fs-small); color: var(--text-muted)">A · auroras - layered glow over near-black (dark-first) · text via --text-* only</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: var(--space-4); margin-bottom: var(--space-5)">
        <div><div class="grad-pair-borealis" style="height: 10rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-borealis</span> · ultramarine ↔ light green</p></div>
        <div><div class="grad-pair-nebula" style="height: 10rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-nebula</span> · purple ↔ apricot</p></div>
        <div><div class="grad-pair-abyss" style="height: 10rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-abyss</span> · blue ↔ dark green</p></div>
        <div><div class="grad-pair-furnace" style="height: 10rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-furnace</span> · orange ↔ magenta</p></div>
      </div>

      <p style="margin: 0 0 var(--space-2); font-size: var(--fs-small); color: var(--text-muted)">D · fields - plateaued soft blends</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: var(--space-4)">
        <div><div class="grad-pair-signal" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-signal</span> · lime ⇢ ultramarine</p></div>
        <div><div class="grad-pair-terra" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-terra</span> · dark green ⇢ (yellow) ⇢ apricot</p></div>
        <div><div class="grad-pair-regatta" style="height: 6rem; border-radius: var(--radius-m)"></div><p style="margin: var(--space-1) 0 0; font-size: var(--fs-small); color: var(--text-muted)"><span style="font-family: var(--font-mono)">.grad-pair-regatta</span> · blue ⇢ orange ⇢ blue</p></div>
      </div>
    </section>
```

- [ ] **Step 3: Run the drift guard**

Run: `node examples/gradient-showcase/check.mjs`
Expected: exits 0, no missing class/var findings (all 16 pool classes + 3 wardrobe classes resolve against the freshly built bundle).

- [ ] **Step 4: Commit**

```bash
git add examples/gradient-showcase/index.html
git commit -m "feat(examples): gradient showcase rebuilt by signature-form family + ES team wardrobe"
```

---

### Task 4: Render-verify parity, then delete the preview

**Files:**
- Delete: `_preview-gradient-redesign.html` (only after parity is confirmed)

**Interfaces:**
- Consumes: the built bundle + showcase from Tasks 1-3; the preview file as the reference rendering.

- [ ] **Step 1: Fresh build**

Run: `pnpm build`
Expected: all packages build green.

- [ ] **Step 2: Screenshot preview vs showcase in all three modes**

Using the Playwright browser tools (`browser_navigate`, `browser_evaluate`, `browser_take_screenshot`):
1. Navigate to `file:///c:/Users/aleksander.mastalski/repositories/zha-ui/_preview-gradient-redesign.html`; screenshot full page (light). Click/evaluate its theme buttons for dark (`data-theme="dark"`) and brand (`data-theme="dark" data-surface="brand"`); screenshot each.
2. Navigate to `file:///c:/Users/aleksander.mastalski/repositories/zha-ui/examples/gradient-showcase/index.html`; set the same three mode combinations via `document.documentElement.dataset`; screenshot each.
3. Read the screenshot pairs and compare per entry: same hues, same direction/shape, same floor darkness for auroras. Tile sizes differ by design; colour/form must match. Any mismatch = fix tokens/CSS (values must be verbatim from the preview), rebuild, re-shoot.

- [ ] **Step 3: All-brands team-form matrix (7 brands × 3 forms)**

On the showcase page, for each of `es code bim analytics abps meta zh-cluster`: `document.documentElement.dataset.brand = '<brand>'`, screenshot the wardrobe section. Expected: every brand renders all three forms; unconfirmed brands blend `accent → magenta` (acceptable fallback); `zh-cluster` aurora/conic/duo degenerate toward solid magenta; no text sits on them, so contrast is unaffected. Nothing blanks.

- [ ] **Step 4: Degradation spot-check**

On the showcase page evaluate:

```js
JSON.stringify({
  borealisFloor: getComputedStyle(document.querySelector('.grad-pair-borealis')).backgroundColor,
  nebulaFloor: getComputedStyle(document.querySelector('.grad-pair-nebula')).backgroundColor,
  linearOklch: CSS.supports('background-image: linear-gradient(in oklch, red, red)'),
  conicOklch: CSS.supports('background-image: conic-gradient(in oklch, red, red)'),
})
```

Expected: `borealisFloor` = `rgb(29, 29, 27)`, `nebulaFloor` = `rgb(0, 0, 0)` (the floors are real background-colors, so a failed color-mix stack degrades to a solid dark panel, never transparent). Note which oklch paths the test browser exercises; the sRGB base paths were already asserted string-exact in the unit tests.

- [ ] **Step 5: Delete the preview and commit**

```bash
git rm _preview-gradient-redesign.html
git commit -m "chore: delete the redesign preview - render-verified parity, tokens/CSS are now the source of truth"
```

---

### Task 5: Docs, changeset, PLAN.md

**Files:**
- Modify: `AGENTS.md:78-81`, `AI-USAGE.md` (lines 21, 23, 37, 49, 79, cheat-sheet rows 109/117), `DESIGN.md` (§gradient library lines 133-141, class list lines 207-210), `.changeset/pair-pool-typology-text-chips.md`, `PLAN.md`

**Interfaces:**
- Consumes: final class/var names from Tasks 1-2 (no new names introduced here).

- [ ] **Step 1: AGENTS.md**

Line 78 - append the wardrobe to the team gradient family:

```
- Gradients (decorative only - never a work-surface heading fill): `.accent-grad` `.accent-grad-text` `.accent-grad-subtle` `.accent-grad-aurora` `.accent-grad-conic` `.accent-grad-duo` (team gradient wardrobe - live from the confirmed pair)
```

Line 81 - replace the 13-name bullet with:

```
  · the 16-entry signature-form pool (**un-assigned**: invoke any entry as decoration; a team adopts an entry - pair + form - only at confirmation): journeys `.grad-pair-polar` `-blaze` `-reef` `-nova` `-orchid` · conics `.grad-pair-beacon` `-sundial` `-prism` `-verdigris` · auroras `.grad-pair-borealis` `-nebula` `-abyss` `-furnace` (dark glow panels - text via `--text-*` only) · fields `.grad-pair-signal` `-terra` `-regatta`
```

- [ ] **Step 2: AI-USAGE.md**

Line 21 - append the wardrobe classes after `.accent-grad-subtle`:

```
> `.slider-row .slider-row__value .segmented .card--interactive .card--accent .accent-grad .accent-grad-text .accent-grad-subtle .accent-grad-aurora .accent-grad-conic .accent-grad-duo`
```

Line 23 - replace the 13 class names with:

```
> `.grad-pair-polar .grad-pair-blaze .grad-pair-reef .grad-pair-nova .grad-pair-orchid .grad-pair-beacon .grad-pair-sundial .grad-pair-prism .grad-pair-verdigris .grad-pair-borealis .grad-pair-nebula .grad-pair-abyss .grad-pair-furnace .grad-pair-signal .grad-pair-terra .grad-pair-regatta`
```

Line 37 - extend the accent bullet's tail after `--brand-grad-subtle`:

```
…the brand gradient `--brand-grad` and its subtle wash `--brand-grad-subtle`, plus the team wardrobe `--brand-grad-aurora --brand-grad-conic --brand-grad-duo` (apply via the `.accent-grad-aurora` / `-conic` / `-duo` classes, never the raw vars)
```

Line 49 - replace the `--grad-pair-<name>` portion of the gradient-library line:

```
> *Gradient library (decorative only - never a work-surface heading fill):* `--grad-hero-ember --grad-hero-ocean --grad-hero-violet --grad-hero-dusk` (frozen black-first hero meshes; white text) `--grad-spectrum` (12-hue sweep) `--grad-wash --grad-glow` (subtle accent washes) - plus the 16-entry **signature-form pool**, applied ONLY via its `.grad-pair-<name>` classes (the classes own the aurora floors and oklch upgrades - never use the raw vars): journeys `polar blaze reef nova orchid` · conics `beacon sundial prism verdigris` · auroras `borealis nebula abyss furnace` (dark glow panels - text via `--text-*` only) · fields `signal terra regatta`. An **un-assigned pool**: free to invoke as decoration; a team adopts an entry (pair + form) only at confirmation
```

Line 79 - replace the parenthetical note:

```
> *(ES is a confirmed **pair** - teal primary → magenta secondary, blended as `--brand-grad` and the wardrobe forms. Non-ES teams show a provisional primary only; each adopts a catalog entry - pair + signature form - later. The pool ships as the 16 `--grad-pair-*` signature forms / `.grad-pair-*` classes - browse them in `examples/gradient-showcase` and invoke them freely as decoration; none is a team identity until confirmed.)*
```

Cheat-sheet - after the `.accent-grad-subtle` row (line 109) insert:

```
| `.accent-grad-aurora` | Team aurora - live accent glow pair over an ink floor (`--brand-grad-aurora`). Identity/hero only; text via `--text-*` |
| `.accent-grad-conic` | Team conic - off-centre angular sweep (`--brand-grad-conic`), live per team. Identity/hero only |
| `.accent-grad-duo` | Team duotone - plateaued two-field blend (`--brand-grad-duo`), live per team. Identity/hero only |
```

Replace the `.grad-pair-<name>` row (line 117) with:

```
| `.grad-pair-<name>` | One of the 16 signature-form pool entries - journeys (`polar blaze reef nova orchid`), conics (`beacon sundial prism verdigris`), auroras (`borealis nebula abyss furnace` - dark glow panels, text via `--text-*` only), fields (`signal terra regatta`). Un-assigned pool, decorative use only; a team adopts an entry (pair + form) at confirmation |
```

- [ ] **Step 3: DESIGN.md**

Replace the team-pair pool paragraph (lines 133-141) with:

```
The **signature-form pool** is its own palette-derived family - 16 vetted, un-assigned entries
in four form families (`docs/specs/2026-07-23-zha-ui-gradient-pool-redesign-design.md`):
**journeys** `.grad-pair-polar` `-blaze` `-reef` `-nova` `-orchid` (multi-stop linears through a
third hue), **conics** `.grad-pair-beacon` `-sundial` `-prism` `-verdigris` (off-canvas angular
sweeps, wrap-held to 360°), **auroras** `.grad-pair-borealis` `-nebula` `-abyss` `-furnace`
(layered accent glows over a near-black floor - dark-first panels, text via `--text-*` only; the
floor is a `background-color`, so weak engines degrade to a solid dark panel), and **fields**
`.grad-pair-signal` `-terra` `-regatta` (plateaued blends whose transition band interpolates in
oklch where supported). Each entry's two anchor hues are its adoptable team pair; through-hues
and hazes are decorative. Entries are deliberately **un-assigned**: anyone may invoke one as
hero/identity decoration today, but at confirmation a team adopts an ENTRY - its anchors become
`--accent`/`--accent-2` and its form the team signature (the entry then leaves the pool). Apply
pool entries via their classes, never the raw vars - the aurora floors and the linear- and
conic-specific in-oklch feature tests live in the classes. Browse them in
`examples/gradient-showcase`.

Every confirmed team also inherits the **signature wardrobe** - `.accent-grad-aurora`,
`.accent-grad-conic`, `.accent-grad-duo` (plus the kept `.accent-grad` flat sweep) - rendered
live from `--accent`/`--accent-2`.
```

Replace the class list (lines 207-210) with:

```
The gradient library adds: `.accent-grad-subtle` `.grad-hero-ember` `.grad-hero-ocean`
`.grad-hero-violet` `.grad-hero-dusk` `.grad-spectrum` `.grad-wash` `.grad-glow`, the team
wardrobe `.accent-grad-aurora` `.accent-grad-conic` `.accent-grad-duo`, plus the 16-entry
signature-form pool `.grad-pair-polar` `-blaze` `-reef` `-nova` `-orchid` `-beacon` `-sundial`
`-prism` `-verdigris` `-borealis` `-nebula` `-abyss` `-furnace` `-signal` `-terra` `-regatta`.
```

- [ ] **Step 4: Rewrite the changeset**

Replace the full contents of `.changeset/pair-pool-typology-text-chips.md` with:

```md
---
"@gitzhacode/zha-ui-tokens": patch
"@gitzhacode/zha-ui-css": patch
---

Signature-form gradient pool + team wardrobe + typology text tokens + the chip pass:

- **`--grad-pair-*` / `.grad-pair-*`** - the 16-entry signature-form pool (gradient-pool
  redesign, 2026-07-23 spec), four families: journeys (`polar blaze reef nova orchid`),
  conics (`beacon sundial prism verdigris` - off-canvas centres, wrap-held), auroras
  (`borealis nebula abyss furnace` - layered accent glows over a near-black
  `background-color` floor, so weak engines degrade to a solid dark panel; text via
  `--text-*` only), fields (`signal terra regatta`). Cross-axis journeys/fields ship
  `-oklch` twins swapped by the classes behind gradient-specific feature tests. Un-assigned:
  a team adopts an entry (pair + form) at confirmation. Browsable in
  `examples/gradient-showcase`.
- **`.accent-grad-aurora` / `.accent-grad-conic` / `.accent-grad-duo`** - the team signature
  wardrobe, rendered live from `--accent`/`--accent-2` (`--brand-grad-aurora/-conic/-duo` +
  oklch twins; the conic interpolation clause sits after the position). Every confirmed team
  inherits all three automatically; print/forced-colors suppression included.
- **`--typology-<hue>-text`** - per-theme AA-safe text form of each of the 12 typology hues
  (light/dark/brand-surface), culori-computed and enforced by the contrast gate against both
  `bg-surface-1` and the hue's 25% tint composited over it.
- **`.chip--<hue>`** (12 typology-tinted chip variants: hue tint background + the same hue's
  AA text) and **`.chip__remove`** (remove button with a currentColor hover wash).
```

- [ ] **Step 5: PLAN.md**

Move the top Planned bullet (`Implement the gradient pool redesign…`) to Done, rewritten as:

```
- 2026-07-23 Gradient pool redesign IMPLEMENTED per the same-day spec (§7 executed): 16 signature-form entries (journeys/conics/auroras/fields) + -oklch twins + .accent-grad-aurora/-conic/-duo team wardrobe; aurora background-color floors; split linear/conic in-oklch feature tests; showcase rebuilt by family; docs + llms + changeset rewritten; render-verified light/dark/brand + 7-brand wardrobe matrix; preview deleted
```

- [ ] **Step 6: Full verification + commit**

Run: `pnpm build && pnpm test && pnpm lint && node examples/gradient-showcase/check.mjs`
Expected: all green.

```bash
git add AGENTS.md AI-USAGE.md DESIGN.md .changeset/pair-pool-typology-text-chips.md PLAN.md
git commit -m "docs: signature-form pool + team wardrobe across AGENTS/AI-USAGE/DESIGN, changeset rewritten"
```

---

### Post-plan (session housekeeping, not repo work)

Update auto-memory: `dual-accent-pairs.md` (redesign IMPLEMENTED, preview deleted, next = owner merges PR #5) and `gradient-library.md` (pool now 16 signature forms; aurora floor + conic-clause traps live in tests). Update `MEMORY.md` hooks to match.
