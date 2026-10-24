# zha-ui - Viz / Chart Tokens (design)

> Status: **implemented 2026-07-22** (same day, §7 executed: tokens in
> light/dark/brand-surface, gate 3.0 pairs, ramp-monotonicity tests, llms guidance, docs;
> consumer migrations pending the 0.1.2 release). Originally the P4 item of
> `docs/tickets/2026-07-16-consumer-feedback-triage.md` (own spec, out of quick-wins scope).
> Every colour below is **computed and machine-validated**: snapping/ramps with
> culori (the token pipeline's own lib), palette checks with the dataviz-standard validator
> (lightness band, chroma floor, CVD separation under Machado - Oliveira - Fernandes 2009 severity 1.0
> protan/deutan, normal-vision floor ≥ 15, contrast vs surface). Derivation script output is quoted
> inline; re-run before implementing if the typology primitives ever change.
>
> **Shipped already (2026-07-22, same session):** the per-hue AA text tokens
> `--typology-<hue>-text` (light/dark/brand-surface) + the typology-tinted `.chip--<hue>` variants
> and `.chip__remove` - those were the triage's folded-in P5 chip pass and are implemented in
> `packages/tokens/src/semantic/*.tokens.json` + `packages/css/src/primitives/base.css`, gated by
> `contrast-matrix.mjs` (4.5 on surface-1 AND on the hue's 25% tint composited over surface-1,
> per theme). The chart tokens below shipped in the same session (gate 3.0 pairs, `chart.test.ts`), so the header's status line stands.

## 1. Problem

Without canonical chart tokens every consumer chart falls back to library defaults (observed
live in both dogfood apps) or grows a per-app palette file: solar-trace vendored a 16-hue
teal-first `colormap.js` (categorical + heat ramp + RdBu diverging), digital-archive wrote its
own `chartTheme.js`. Near-ink hues vanish on dark surfaces, and nothing validates any of it.

## 2. The two palettes - domain-keyed vs series-keyed

zha-ui has **two different categorical jobs**, and one palette serving both grows to 16 hues:

1. **Typology-keyed data** (the architecture domain: a bar per building typology, a map coloured
   by typology). Colour IS the domain semantic - use the existing `--typology-<hue>-100/-75/-50/-25`
   tints for marks and `--typology-<hue>-text` for any readable text in that hue. All 12 hues are
   legal here because the *entity* fixes the hue; discriminability is carried by labels/tooltips
   (12 fixed hues do not pairwise-clear the CVD floors - the snapped 8-slot set already caps
   all-pairs forms at 3 slots (§3), and the 12 unsnapped hues are strictly worse - so
   **secondary encoding is mandatory** for typology-keyed charts: direct labels or the table view).
2. **Generic series data** (any N series with no domain colour: sensors, scenarios, cohorts).
   This is what the new `--chart-cat-*` slots are for: **8 slots, fixed order, assigned in
   sequence, never cycled, never re-painted when a filter changes the series count.** A 9th
   series folds into "Other" (`--chart-cat-other`, a neutral), or the chart facets.

## 3. Canonical categorical order (the 8 slots)

**Pool rule:** hues carrying strong good/bad status semantics are excluded from series slots -
`cool-red` (intent-error), `dark-green` (intent-success), `yellow` (intent-warning) - so a
neutral series can never impersonate a status. `blue` (intent-info) stays: info carries no
good/bad load. When a series *means* good/bad (pass rate, error count), it wears intent tokens,
not categorical - never both in one chart. The excluded hues remain fully available to
typology-keyed charts (§2, palette 1). Of the 9 remaining candidates, **orange** is the one
the beam search left unplaced (its adjacencies scored below the winners') - it stays
typology-only in practice.

**Order (beam-searched to maximise the worst adjacent CVD ΔE across BOTH modes simultaneously -
the order must not change between themes; slot 1 = teal, brand-first, matching solar-trace's
seed):**

| Slot | Hue | Light (on `#FFFFFF`) | Dark (on `#1d1d1b`) |
|---|---|---|---|
| 1 | teal | `#048C9C` (4.01:1) | `#048C9C` (4.21:1) |
| 2 | ultramarine | `#2838E6` (7.50:1) | `#3652FF` (3.07:1) |
| 3 | light-green | `#7C9F00` (3.09:1) | `#80A400` (5.80:1) |
| 4 | blue | `#1372DE` (4.68:1) | `#1372DE` (3.61:1) |
| 5 | lime | `#9E9700` (3.04:1) | `#A09900` (5.66:1) |
| 6 | purple | `#7633E2` (6.28:1) | `#7D3EEB` (3.02:1) |
| 7 | apricot | `#D97D00` (3.04:1) | `#D57B00` (5.35:1) |
| 8 | magenta | `#CB0092` (5.31:1) | `#CB0092` (3.18:1) |

Values are the typology hues **snapped per mode**: hue held, OKLCH lightness moved the minimum
distance into the mode's band (0.43-0.77 light / 0.48-0.67 dark) AND to ≥ 3:1 vs the mode's
surface-1, chroma gamut-clamped. Where the full brand hue already passes it is kept verbatim
(the token stays a `{color.typology.*}` ref). Light/lime/yellow-family hues darken to
olive/ochre in light mode so that marks clear 3:1.

**Validator verdicts (adjacent pairs, the stacked/bar/line case):**

```
light: band PASS · chroma PASS (all ≥ .10) · CVD worst 20.4 (deutan, slots 1↔2) ·
       normal-vision worst 24.9 · contrast all ≥ 3:1  → OK
dark:  band PASS · chroma PASS · CVD worst 19.2 (deutan, slots 1↔2) ·
       normal-vision worst 22.6 · contrast all ≥ 3:1  → OK
```

**All-pairs forms (scatter, bubble, choropleth, small multiples):** only the **first 3 slots**
validate all-pairs (light 17.8 / dark 18.6 worst) - more than 3 series in those forms means
fold or facet, not more colours. Tritan ΔE bottoms at 6.6 (dark, slots 1↔2) - tritanopia is
not gated by the standard (rarest CVD) but is one more reason legends are never colour-alone.

`--chart-cat-other`: `{text.disabled}` per theme (a real neutral - below the chroma floor by
design; "Other" must read as background, not as a ninth identity).

## 4. Sequential ramp (magnitude)

One hue - teal (the system default accent), 6 steps, ΔL 0.07 (validator requires ≥ 0.06 after
hex rounding), monotone, anchor flipped in dark. `validateOrdinal`: **OK both modes.**

| Step | Light | Dark |
|---|---|---|
| seq-1 (low) | `#54BFD0` | `#005862` |
| seq-2 | `#3AA9B9` | `#006D7A` |
| seq-3 | `#1993A3` | `#008493` |
| seq-4 | `#007D8C` | `#2499AA` |
| seq-5 | `#006773` | `#42AFC0` |
| seq-6 (high) | `#00525C` | `#5BC6D7` |

Direction: "more" is always **higher contrast against the surface** (darker on light, lighter on
dark) - a heatmap reads the same way in both themes. Solar-trace's warm "heat" ramp is replaced
by this single-hue ramp; heat semantics come from the diverging ramp's warm arm if the data is
polar.

## 5. Diverging ramp (polarity)

Two poles + neutral gray midpoint, 3 steps per arm, lightness monotone per arm
(`validateOrdinal` per arm: **OK both modes**). Poles are the snapped `blue` and `cool-red`
(the RdBu convention both consumer seeds already used; cool-red is legal here because a
diverging arm carries meaning by design).

| Token | Light | Dark |
|---|---|---|
| div-neg-3 (strong) | `#0052A8` | `#63A6FF` |
| div-neg-2 | `#1774E0` | `#2B84F2` |
| div-neg-1 (weak) | `#509CFF` | `#0065CC` |
| div-mid | `#B9B7B5` | `#5A5754` |
| div-pos-1 (weak) | `#FF586F` | `#C4003D` |
| div-pos-2 | `#DD0447` | `#EF2A55` |
| div-pos-3 (strong) | `#A10031` | `#FF6F7E` |

Midpoint is neutral gray (never a hue), continuing each arm's ΔL progression one step past the
weak ends toward the surface (light mid L 0.78 vs weak ends 0.69; dark 0.46 vs 0.52). Weak steps
approach the surface (low contrast) by design - the midpoint region of a diverging map SHOULD
recede; values there are read from labels/tooltips.

## 6. Chart text / grid tokens

Pure aliases - recessive grid, ink-not-series-colour text, per-theme for free via the cascade:

```
chart.text        = {text.muted}      // axis tick + legend labels
chart.text-strong = {text.default}    // axis titles, direct labels
chart.grid        = {border.subtle}   // gridlines - recessive, behind marks
chart.axis        = {border.default}  // axis/domain lines
```

Rules that ride along (docs, not tokens): text wears text tokens, never the series colour;
one axis only (no dual-axis); legend always present for ≥ 2 series (single series: the title
names it, no legend box); ≤ 4 series also get selective direct labels.

## 7. Token shape & implementation plan (follow-up, one session)

- `packages/tokens/src/semantic/light.tokens.json` / `dark.tokens.json` /
  `brand-surface.tokens.json` (brand-surface duplicates dark, same as `intent-*-text`):
  `chart.cat.1..8`, `chart.cat.other`, `chart.seq.1..6`, `chart.div.{neg-3..neg-1,mid,pos-1..pos-3}`,
  `chart.text`, `chart.text-strong`, `chart.grid`, `chart.axis` - emitting
  `--chart-cat-1 … --chart-axis`. Values as ref where the table shows the full brand hue,
  hex otherwise.
- **Gate** (`contrast-matrix.mjs`): add per-theme `['chart-cat-N', 'bg-surface-1', 3.0]` pairs
  (marks, 1.4.11). Ramps: a vitest asserting OKLCH-L monotonicity of seq/div arms in each theme
  block (the categorical validator would false-fail ramps by design - do not run it on them).
- **llms.txt** guidance line: chart slots are fixed-order, never cycled; >8 → Other; typology
  hues for typology-keyed data only; text via `--chart-text`, never the series colour.
- **Docs**: AI-USAGE var groups + AGENTS.md one-liner; DESIGN.md gets a short "charts" section
  (the two-palettes rule, §2).
- **Consumers**: solar-trace deletes the **categorical / heat / RdBu entries** of `colormap.js`
  (16-hue categorical → 8 slots + Other; `zha` heat ramp → seq; RdBu → div) - NOT the whole
  file: its continuous 3D result-field ramps (`es_sunhours`, turbo, viridis, …) drive the
  point-cloud viewer and stay. digital-archive deletes `chartTheme.js`. Both keyed off CSS
  vars so the theme flip is automatic.
- **Render-verify** light + dark + brand (the gate is blind to the oklch overlay, and ramps
  deserve an eyeball on real charts).

## 8. Non-goals

- No per-team categorical palettes - series identity is system-wide; the team accent shows up
  only when a chart has a single series (a lone series may wear `--accent-fill`, the AA-gated
  team accent; two or more switch to the slots).
- No 12-slot generic palette - 12 fixed hues cannot clear pairwise CVD floors; the 12-hue set
  stays reserved for typology-keyed data with mandatory secondary encoding.
- No rainbow/spectrum encodings for magnitude (the `--grad-spectrum` band is decoration, never
  a data scale).

## 9. Derivation provenance

Script: `docs/research/2026-07-22-p4-chart-palette-derivation.mjs` (+ its captured output
alongside; the validator import path points at the dataviz skill bundle - adjust locally).
It performs a culori snap + beam search over the status-clean
pool, teal-fixed slot 1, scored on min adjacent worst-of-protan/deutan ΔE across both modes,
normal-vision ≥ 15 hard; validated with the dataviz-standard `validate_palette.js`). Beam width
800; winner min adjacent CVD 19.2. Re-derive if typology primitives, surfaces, or the band
definitions ever change.
