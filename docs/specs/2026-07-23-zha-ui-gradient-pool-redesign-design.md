# zha-ui - Gradient Pool Redesign: Signature Forms (design)

> Status: **approved design** (owner, 2026-07-23, after four visual iterations on the live
> preview `_preview-gradient-redesign.html` - that file is the rendering source of truth for
> every declaration below until implementation lands, then it is deleted).
> Supersedes the flat 13-pair pool shipped on `feat/consumer-feedback-quick-wins`
> (95a73da; **unreleased** - PR #5 not merged, so renames/removals are free).
> The dual-accent pair *semantics* (docs/specs/2026-06-26-…) stay in force; this spec
> replaces its §4 table as the **picking menu** and widens the pair-vetting rule (§5 below).

## 1. Goal

The owner found the shipped pool boring: 13 identical flat 105° two-stop sweeps. Redesign
**both** layers - pool composition and rendering - into a **signature-form system**:
16 entries across four form families, each visually distinct, plus a richer **live team
layer** so every confirmed team automatically inherits the new forms. Every colour still
traces to the 12 typology hues (+ `color-mix` alpha tints + neutral floors). Decorative-only
doctrine, print/forced-colors suppression, and un-assigned Phase-B semantics unchanged.

## 2. The catalog - 16 entries, four families

Anchor rule: each entry declares **exactly two anchor hues = the adoptable team pair**
(primary first). Through-hues and hazes are decorative and non-binding. All declarations
below are final (owner-approved renders); values use `var(--color-typology-*)` /
`var(--color-neutral-*)` refs - shown abbreviated here as bare hue names.

### J · Journeys - multi-stop linears through a third hue (5)

| Entry | Pair (through) | Declaration |
|---|---|---|
| `polar` † | purple/teal (ultramarine) | `linear-gradient(160deg, purple 0%, ultramarine 45%, teal 100%)` |
| `blaze` | magenta/yellow (orange) | `linear-gradient(15deg, magenta 0%, orange 55%, yellow 100%)` |
| `reef` | teal/lime (dark-green) | `linear-gradient(75deg, teal 0 14%, dark-green 48%, lime 100%)` |
| `nova` † | ultramarine/apricot (magenta) | `linear-gradient(135deg, ultramarine 0%, magenta 50%, apricot 100%)` |
| `orchid` | blue/magenta (purple) | `linear-gradient(180deg, blue 0%, purple 55%, magenta 100%)` |

† ships an oklch twin (`…-oklch`, identical stops, `160deg/135deg in oklch`) swapped in by
the class under the **linear** in-oklch feature test (§6).

### C · Conics - off-centre angular sweeps (4)

Centres sit **outside the paint box** (a sun below the horizon): an inside-the-box conic
centre renders a pinwheel singularity. Wrap safety: hold the last colour to `360deg`.
All sRGB (within-family arcs; no oklch twin).

| Entry | Pair (through) | Declaration |
|---|---|---|
| `beacon` | teal/ultramarine | `conic-gradient(from 115deg at 105% -10%, teal 55deg, ultramarine 105deg, teal 155deg, teal 360deg)` |
| `sundial` | yellow/cool-red (apricot, orange) | `conic-gradient(from 250deg at 50% 118%, yellow 0deg, apricot 60deg, orange 120deg, cool-red 180deg, cool-red 360deg)` |
| `prism` | purple/cool-red (magenta) | `conic-gradient(from 315deg at -10% 115%, purple 0deg, magenta 65deg, cool-red 125deg, cool-red 360deg)` |
| `verdigris` | dark-green/blue (teal) | `conic-gradient(from 125deg at 105% -10%, dark-green 62deg, teal 108deg, blue 152deg, blue 360deg)` |

### A · Auroras - layered alpha radials over a near-black floor (4)

Dark-first identity compositions (hero-mesh technique, palette-derived). **No hue-to-hue
interpolation → the sRGB grey-midpoint rule does not bind; cross-axis pairs are legal.**
Stops are `color-mix(in srgb, <hue> N%, transparent)`. The **floor is a `background-color`,
not a gradient layer** (§6 weak-engine rule). Floors: `borealis`/`abyss` = ink `#1d1d1b`
(`{color.neutral.ink}`); `nebula`/`furnace` = black (`{color.neutral.black}`).

| Entry | Pair (haze) | Radial stack (top→bottom) |
|---|---|---|
| `borealis` | ultramarine/light-green (teal) | `ellipse 28% 22% at 82% 72%, light-green 95%` → `ellipse 75% 60% at 20% 22%, ultramarine 82%` → `ellipse 52% 44% at 80% 72%, light-green 68%` → `ellipse 90% 40% at 55% 45%, teal 30%` (fade-outs 75/62/58/70%) |
| `nebula` | purple/apricot (magenta) | `ellipse 80% 85% at 30% 40%, purple 72%` → `ellipse 40% 35% at 85% 15%, apricot 80%` → `ellipse 55% 45% at 70% 80%, magenta 34%` (65/60/62%) |
| `abyss` | blue/dark-green (teal) | `ellipse 95% 75% at 50% 108%, blue 88%` → `ellipse 55% 38% at 22% 6%, dark-green 68%` → `ellipse 80% 35% at 65% 45%, teal 26%` (70/58/68%) |
| `furnace` | orange/magenta | `ellipse 70% 55% at 75% 70%, orange 80%` → `ellipse 55% 65% at 15% 30%, magenta 62%` (62/60%) |

(Every radial ends `…, transparent <fade>%`; exact strings in the preview file.)

### D · Fields - plateaued soft blends, oklch transition band (3)

Wide solid fields + one smooth band. The band interpolates **in oklch** so cross-axis pairs
travel vivid hue territory; the sRGB fallback shows a muted band (decorative-accepted). All
three ship oklch twins under the linear feature test.

| Entry | Pair (through) | Declaration |
|---|---|---|
| `signal` | lime/ultramarine | `linear-gradient(118deg, lime 0 32%, ultramarine 68% 100%)` |
| `terra` | dark-green/apricot (yellow) | `linear-gradient(0deg, dark-green 0 38%, yellow 54%, apricot 68% 100%)` |
| `regatta` | blue/orange | `linear-gradient(135deg, blue 0 28%, orange 46% 54%, blue 72% 100%)` |

## 3. Team signature layer - live from `var(--accent)` / `var(--accent-2)`

Every confirmed team inherits the wardrobe automatically (ES today). Existing `.accent-grad`
(flat sweep) and `.accent-grad-subtle` are kept unchanged.

| Class / tokens | Declaration |
|---|---|
| `.accent-grad-aurora` · `--brand-grad-aurora` | `background-color: ink` + image `radial(ellipse 75% 65% at 22% 28%, mix(accent 75%) → transparent 62%), radial(ellipse 65% 55% at 80% 75%, mix(accent-2 68%) → transparent 60%)` |
| `.accent-grad-conic` · `--brand-grad-conic` (+`-oklch`) | `conic-gradient(from 235deg at 50% 120%, accent 0deg, accent 45deg, accent-2 135deg, accent-2 360deg)`; oklch twin adds `in oklch` **after the position** (§6 trap) under the **conic** feature test |
| `.accent-grad-duo` · `--brand-grad-duo` (+`-oklch`) | `linear-gradient(118deg, accent 0 35%, accent-2 65% 100%)`; oklch twin under the linear test |

**Fallback behaviour (verified across all 7 brands):** unconfirmed teams render
`accent → core-default magenta` - acceptable, never shipped as identity. `zh-cluster`
(accent = magenta) degenerates to a solid magenta fill until it confirms a secondary -
harmless by design. bim's fallback oklch arc passes through orange - evidence for the rule
that confirmed pairs come from this catalog (deliberate through-hues), never ad-hoc.

## 4. Retirement & adoption

- The 13 flat entries (`electric royal plum ocean deep-sky twilight sunrise coral ember
  raspberry foliage sea-pine chartreuse`) are **deleted** - tokens, classes, showcase tiles,
  docs rows, llms mention, tests. Unreleased, so no deprecation path is needed. The
  pending changeset `.changeset/pair-pool-typology-text-chips.md` is rewritten to describe
  the new pool (same release train).
- **Phase-B adoption upgrades:** a team now adopts an **entry** - its two anchors become
  `accent`/`accent-2` in the brand file AND the entry's form becomes the team's signature
  (its name recorded in the brand file `$description`). The entry leaves the pool.
- Pair-hue coverage (anchors only): every provisional team primary appears in ≥ 2 entries -
  purple 3 · blue 4 · dark-green 3 · orange 2 · ultramarine 5 · magenta 3 (teal 3 for ES-
  adjacent picks; light-green 1, lime 2, yellow 2, apricot 3, cool-red 2 for secondaries).

## 5. Vetting rule (widens dual-accent §4)

An entry is colour-legal when **each rendered transition** satisfies ONE of:
1. **sRGB-interpolated segment** - adjacent stops within one temperature family or bridging
   the violet/magenta corner (the original culori-verified rule, applied per segment;
   through-hues chain segments so long journeys stay vivid);
2. **oklch-interpolated band** - vivid by construction; the sRGB fallback band may mute
   (accepted for decoration; never carries meaning);
3. **non-interpolating form** - aurora layers / plateaued fields never blend hue-into-hue.

## 6. Implementation rules & traps (learned live on the preview)

- **Conic grammar trap:** the interpolation clause goes **after** the position -
  `conic-gradient(from 235deg at 50% 120% in oklch, …)`. The other order parses as invalid
  and, because `var()` defers validity to computed-value time, **blanks the whole
  background** (no fallback to the earlier declaration). Feature-test exactly the capability
  used: linear swaps behind `@supports (background-image: linear-gradient(in oklch, red, red))`,
  the conic swap behind `@supports (background-image: conic-gradient(in oklch, red, red))`.
- **oklch twins are separate tokens** (`--grad-pair-<name>-oklch`, `--brand-grad-conic-oklch`,
  `--brand-grad-duo-oklch`) swapped by the class - same pattern and same "never use the
  `-oklch` var directly" rule as `--grad-spectrum-oklch` (llms.txt line).
- **Weak-engine rule for auroras:** `color-mix()` stops make the whole `background-image`
  invalid on no-color-mix engines. Aurora classes therefore declare the floor as
  `background-color` (ink/black) separately from the radial-stack `background-image` - a
  failed stack degrades to a solid dark panel, never to transparent.
- **Conic centres off-canvas**; wrap-hold the final stop to `360deg`.
- **Print/forced-colors:** the existing `[class*="grad-pair-"]` umbrella arms cover all pool
  entries (`background: #fff none` resets colour + image; forced-colors drops images and
  forces the floor colour itself). The three new team classes are appended to the explicit
  `.accent-grad*` lists in both arms in `gradient.css`.
- **Text on auroras** follows the hero-mesh rule: `--text-*` only, render-verified; a scrim
  is the consumer's fix, never a token retune.

## 7. Files touched (implementation plan input)

- `packages/tokens/src/semantic/core.tokens.json` - replace `grad.pair.*` (16 entries;
  aurora values are the radial stack only), add `grad.pair.<name>.oklch` twins (polar, nova,
  signal, terra, regatta) and `brand.grad-aurora`, `brand.grad-conic(+oklch)`,
  `brand.grad-duo(+oklch)`. All `$type: "other"`; `$description` carries pair + family +
  un-assigned note (llms.txt inherits).
- `packages/css/src/primitives/gradient.css` - replace `.grad-pair-*` classes (aurora
  classes: `background-color` floor + image var), add the two `@supports` swap blocks and
  the three `.accent-grad-{aurora,conic,duo}` classes; extend both suppression arms'
  explicit `.accent-grad*` lists.
- `packages/tokens/test/gradient.test.ts` + `packages/css/test/exports.test.ts` - rewrite
  pool assertions (16 names, family shapes, twins swapped under the RIGHT feature test,
  single emission, no `in oklch` inside base tokens, umbrella coverage, aurora
  background-color fallback), team-form assertions.
- `examples/gradient-showcase/index.html` - pool section rebuilt by family (aurora tiles
  tall), team wardrobe section (ES); drift-guard must stay green.
- Docs: `AGENTS.md` gradient bullet, `AI-USAGE.md` class list/table/vars, `DESIGN.md`
  gradient-library section (family descriptions + adoption rule), llms guidance line
  (16 names, un-assigned, aurora text rule).
- `.changeset/pair-pool-typology-text-chips.md` - rewrite pool paragraph.
- Delete `_preview-gradient-redesign.html` after render-verify parity.
- Memory: update [[dual-accent-pairs]] + [[gradient-library]].

## 8. Verification

`pnpm build` (contrast gate untouched - decorative tokens aren't gated) + `pnpm test` +
`pnpm lint`; drift guard on the showcase; **render-verify** the showcase at light/dark/brand
against the approved preview (visual parity per entry), plus the all-brands team-form matrix
(7 brands × 3 forms) and a no-oklch/no-color-mix degradation spot-check (DevTools override or
the sRGB fallback eyeball): journeys/fields show their sRGB base, auroras show solid floors,
nothing blanks.

## 9. Out of scope

Grain/noise textures (needs an SVG filter asset; fights the hairline-restraint identity),
animated gradients, per-team meshes beyond the var-driven aurora, any change to hero meshes,
spectrum, washes, `.accent-grad`/`.accent-grad-subtle`, or chart/typology tokens.

## Self-review

- Every entry's declaration matches the owner-approved preview (source of truth named in the
  header; implementation copies from it verbatim before deleting it).
- No placeholders; counts add up (5+4+4+3=16; oklch twins 5 pool + 2 team; 4 aurora floors
  assigned; anchors audited in §4).
- Consistency: §5's rule justifies every §2 transition; §6's fallback rule matches §2's
  "floor is background-color"; retirement list matches the shipped 13 names.
- Scope: one implementation-plan session (tokens + one CSS partial + tests + showcase + docs
  + changeset), same shape as the original gradient-library plan.

Next: write the implementation plan from section 7, starting with the tokens.
