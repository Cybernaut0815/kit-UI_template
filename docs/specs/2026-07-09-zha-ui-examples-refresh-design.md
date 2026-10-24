# ZHA UI Examples Refresh - Design

**Date:** 2026-07-09 · **Status:** approved (brainstorm) · **Branch:** `phase-0-foundation`

## Goal

Make every example in `examples/` **fully represent ZHA UI** rather than a hand-rolled ES artifact:
consume the real published package (no duplicated tokens, no reinvented classes), demonstrate the
current system (dual-accent pairs + the gradient library + real primitives), be framed as **"ZHA UI"**
(the system) instead of ES-specific, and add a dedicated **gradient showcase** page.

ES stays the *concrete demo brand* inside each page (the lockup shows ES, the demo content stays an ES
example). Each page presents ZHA UI and demonstrates it with ES. No
multi-brand switcher (explicitly out of scope).

## Why now

The drift audit showed the decks hand-copied the brand palette and drifted (stale teal→green, inconsistent
magenta tints). The root cause is that they never consumed the package - the exact problem ZHA UI exists to
solve. Converting them to consume the tokens fixes the drift and shows the system working.

## Shared conventions (apply to every artifact)

### C1 - Consume the package, prove it
Every example links/imports the built bundle and defines **zero design-system tokens of its own** (colour,
type scale, spacing, radius, motion, gradient) and **zero hardcoded brand-colour literals**. Enforced by a
per-example `check.mjs` drift-guard (the vanilla starter already has one; replicate the pattern): it asserts
every `class=`/`className=` and `var(--…)` exists in the shipped bundle and that no chromatic colour literal
(`#hex`, chromatic `rgb()/hsl()/oklch()/lab()`) appears.

**Deliberate guard allowances** (these are NOT design-system tokens, and zha-ui provides no equivalent):
- **Neutral alpha for shadows/scrims/overlays** - `rgba(0,0,0,α)` and `rgba(255,255,255,α)` are permitted
  (a decorative drop-shadow is not a brand colour). Prefer `--shadow-low/mid/high` and `--scrim` where they
  fit; only fall to a neutral-alpha literal for a bespoke effect no token covers (e.g. a deck's large
  presentation shadow). The guard still bans every `#hex` and every chromatic functional colour.
- **Layout scaffolding** - slide widths, `clamp()` responsive display sizes above the `--fs-hero` (32px)
  ceiling, canvas sizing, z-indices, grid tracks. These are not the design system; they stay as raw values.
  (The type *scale* is a token; an 80px slide headline has no token and counts as layout.)
- **Canvas/JS colour** must be read from tokens via `getComputedStyle(el).getPropertyValue('--accent')` etc.,
  with **no hardcoded colour fallback** (a `|| '#048C9C'` fallback is a literal → guard fails). Computed
  values return oklch or hex per engine; canvas `strokeStyle`/`addColorStop` accept both.

- Ring-1 pages (decks, showcase, vanilla): `<link rel="stylesheet" href="…/packages/css/dist/index.css">`
  (relative to the built dist, matching the vanilla starter and foundation-reference).
- Ring-2 (React): `import '@gitzhacode/zha-ui-css/index.css'` (already present).

### C2 - Titling
`<title>` and the top-level page framing say **"ZHA UI"**. The firm is **"ZHA"** - never the spelled-out
former name. ES appears as the demo brand in content, not in the page's identity.

### C3 - Brand-surface token map (for the black-first decks)
The decks' **neutral** chrome tokens are near-identical to zha-ui's brand-surface tokens, so the neutral swap
preserves the look. The **accent** is deliberately *corrected*, not preserved: the decks used the light tint
`#3FB9C7` as their accent; with `data-brand="es" data-surface="brand"` the ES brand block wins the cascade and
`--accent` resolves to base teal `#048C9C` (~4.8:1 on the near-black surface - AA for text) and `--brand-grad`
to base teal→magenta. This is the system's canonical full-strength pair on near-black and keeps the decks
consistent with the starters and the showcase. Reserve `--accent-fill` for buttons/non-text (it is darker,
below AA as text on near-black); use `--accent` for accent-coloured text. Decks set `data-brand="es"
data-surface="brand"` on `<html>` and replace local tokens per this map:

| Deck-local | zha-ui token |
|---|---|
| `--ground` | `--bg-page` |
| `--s1` / `--s2` / `--s3` (`--surface-1…`) | `--bg-surface-1` / `-2` / `-3` |
| `--tx` / `--txs` / `--txm` / `--txms` | `--text-default` / `--text-strong` / `--text-muted` / `--text-muted-strong` |
| `--bd` / `--bd2` / `--bd3` | `--border-subtle` / `--border-default` / `--border-strong` |
| `--teal` / `--teal-fill` | `--accent` / `--accent-fill` (interactive) |
| `--magenta` / `--magenta-fill` | `--accent-2` / `--accent-2-fill` (expressive only) |
| `--duo` | `--brand-grad` |
| `--team-<t>` (per-team accent swatch) | `--typology-<hue>-100/75/50/25` - hue per the **AI-USAGE brand table** (es→teal, code→purple, analytics→blue, bim→dark-green, abps→orange, meta→ultramarine, zh-cluster→magenta). The decks' current `--team-*` hex are stale vs this table - use the table, not the old hex. Identity swatches only, never interactive. |
| `--focus` | `--focus-ring` |
| `--ease` | `--ease-out` |
| `--fp` / `--fb` / `--fm` | `--font-primary` / `--font-secondary` (ZHA Sans) / `--font-mono` |
| `--r-s` / `--r-m` / `--r-l` / `--pill` | `--radius-s` / `-m` / `-l` / `--radius-pill` |
| `--space-*` | `--space-*` (same names) |

Layout scaffolding with no design-system equivalent (slide widths, `clamp()` display sizes above `--fs-hero`,
canvas sizing, z-indices) stays local per C1 - the ban covers duplicating the *design system* only.

### C4 - Naming / voice (from brand-reference §3, §6)
Sentence case for headings/body; UPPERCASE only for tiny chip/eyebrow labels. ZHA Sans (`--font-secondary`)
is always regular + upright. Deck voice: Striking · Refined · Thoughtful · Grounded; action-forward.

## Artifact 1 - Gradient showcase (new)

`examples/gradient-showcase/index.html` (Ring-1) + `check.mjs` + `package.json` (mirrors `zha-app-vanilla`).
The canonical gradient reference. Sections, each tile labelled with its **usage rule**:

1. **Hero meshes** - on a `data-surface="brand"` block: `.grad-hero-ember/-ocean/-violet/-dusk`, full-bleed,
   with sample white headline text set via `--text-strong` (NOT literal `#fff`) to demonstrate the print-safe
   rule. Caption each "hero / marketing surface only."
2. **Spectrum** - `.grad-spectrum` band; note it is oklch-vivid where supported, clean sRGB otherwise.
3. **Team gradient** - `.accent-grad` fill + `.accent-grad-text` headline + `.accent-grad-subtle` wash,
   labelled "identity / hero" (the first two) and "work-safe" (the subtle wash).
4. **Work-safe washes** - `.grad-wash` + `.grad-glow` on a `data-surface="work"` block, labelled
   "safe on work surfaces."

A short prose header states the one rule: gradients are decorative - hero meshes/spectrum are identity/hero
only; the three washes are the only gradients for work surfaces; never a work-surface heading fill.

## Artifact 2 - Starter refresh (vanilla + React)

Retitle to "ZHA UI - vanilla starter" / " - React starter". Make them *represent* the system by using real
primitives where they currently hand-roll:
- Stat tiles (`.surface` + inline type) → `.stat` (`__label` / `__value` / `__delta`).
- Intent banners (`.surface` + `border-left`) → `.alert` (`--success/--warning/--error/--info` + `__icon`/`__title`).
- Add a compact gradient strip (one `.accent-grad-text` headline + one `.grad-hero-*` tile) that links to the
  gradient showcase, so the starter points at the full reference rather than duplicating it.
The hero, form card, lockup, theme toggle stay. The vanilla `check.mjs` already guards drift; keep it green.

## Artifact 3 - Deck conversion (all 4) + reframe to system decks

Per deck: full token swap (C3), link the bundle (C1), retitle (C2), and **reframe the narrative** from an ES
brand story to a **ZHA UI design-system** story, preserving each deck's distinct lens and structure:
- `brand-deck` - the system pitch: one source, on-brand + accessible by default, dual-accent pairs, enforced.
- `brand-deck-editorial` - the editorial/typographic take on the system.
- `brand-deck-product` - the system applied to product UI.
- `brand-deck-specimen` - the token/type/colour specimen of the system.

Narrative north-star (what the new copy asserts, replacing the stale "one accent = teal / single-accent
discipline"): *ZHA UI carries the ZHA brand as code so every team's app is on-brand and accessible by default;
each team is an accent **pair** (primary + expressive secondary → gradient); ES is confirmed (teal→magenta)
and shown here; the system enforces colour-contrast on every build.* Keep bespoke slide layout + the canvas
hero animation (its stops now read from the ES pair). Use `.zha-lockup` / `.accent-grad-text` / `.grad-hero-*`
where the deck hand-rolls those effects.

**Deck-specific complications surfaced by the adversarial review (address per deck):**
- **Team-accent swatches** (`brand-deck`): the 7 `--team-*` hex are hardcoded AND stale vs the current brand
  table. Replace with `--typology-<hue>-*` per the C3 map (identity swatches only).
- **Large decorative shadows** (`editorial`/`product` browser-chrome `.win`): use `--shadow-high` if close
  enough; otherwise keep a neutral `rgba(0,0,0,α)` per the C1 allowance (not a brand-colour violation).
- **Embedded light-UI app mockups** (`editorial`/`product`): these render a picture of a light-mode app
  *inside* the black deck, hand-rolling the full light palette + mini `.m-btn`/`.m-stat`/`.m-tbl` classes.
  Handling is fixed below (Artifact 3b).

### Artifact 3b - Embedded UI mockups (token-swap only)

**Decision: token-swap only** (not a full primitive rebuild). Nest `data-surface="work" data-theme="light"`
on each mockup container so zha-ui tokens re-resolve to the light work palette inside that subtree - a genuine
demonstration of the surface axis, and the deck around it stays brand/dark. Keep the custom `.m-*` layout
classes, but replace every hardcoded colour in the mockup (`--a`/`--a2`/`--m`/`--bg`/`--c1..3`/`--t`/`--t2`/`--ln`
and any inline hex) with the corresponding zha-ui token resolved on that nested surface (`--accent-fill`/
`--accent`/`--accent-2`/`--bg-page`/`--bg-surface-1..3`/`--text-default`/`--text-muted`/`--border-subtle`).
No hardcoded light palette survives; the drift-guard passes. (A future full rebuild onto `.sidebar`/`.stat`/
`.data-table`/`.btn` is noted as an out-of-scope follow-up.)

## Artifact 4 - foundation-reference (light touch)

Confirm the `<title>`/intro read as "ZHA UI" (it is already generic). Add one pointer line to the new gradient
showcase. No structural change (the audit found it CURRENT).

## Verification

- **Drift-guards:** vanilla (exists), gradient-showcase (new), and - where practical - a `check.mjs` for each
  converted deck asserting no colour literal / no non-bundle class survives. A deck's `check.mjs` is the
  machine proof that "represents zha-ui" holds. React is guarded by its build + import.
- **Guard scope:** the drift-guard scans the whole file (markup + inline `<script>` + `<style>`), so canvas
  colour reads must be token-based with no literal fallback (C1), and only neutral-alpha shadow/scrim rgba is
  tolerated. A deck's guard passing is the machine proof it truly consumes the system.
- **Copy review:** each reframed deck's prose is reviewed against the narrative north-star + the C4 voice
  rules (the reframe is the one subjective, un-guardable part - it needs a human/reviewer read, not just a
  render).
- **Render-verify** (method used on the gradient library: local static server + Playwright, `file://` blocked): the gradient
  showcase (light/work + brand), each converted deck (its brand surface + any nested work-surface mockup),
  and the refreshed starters (light + dark). Confirm: neutral swap preserved each deck's chrome; base teal
  accent (~4.8:1) + teal→magenta gradient read legibly on near-black; nested-surface mockups render as light
  UI inside the dark deck; `.stat`/`.alert` render correctly in the starters.

## Phasing (execution order)

**A. Gradient showcase** (net-new, self-contained) → **B. Starter refresh** (2 files, primitive swaps) →
**C. Deck conversion** (4 files, highest-touch: token swap + reframe). Working output lands after A; the big
deck lift comes last, after the pattern is proven on A/B.

## Out of scope

- Multi-brand `data-brand` switcher / showing all 7 teams (chose generic titling + ES demo).
- Full rebuild of the embedded deck mockups onto real primitives (`.app-shell`/`.sidebar`/`.stat`/`.data-table`) -
  token-swap-only for now (Artifact 3b); the rebuild is a noted follow-up.
- Publishing / pushing.
- New primitives or token changes - this is examples-only; if a deck needs something the system lacks, raise
  it as a finding.

## Self-review

- **Placeholders:** none - token map, showcase sections, per-deck lenses, and the narrative north-star are all
  concrete.
- **Consistency:** C1 (consume + guard) and C3 (token map) are the load-bearing rules; every artifact refers
  back to them. Titling (C2) applies uniformly.
- **Scope:** large but cohesive and phaseable.
- **Ambiguity:** "fully represent" is pinned to concrete acts (use real primitives, consume tokens, drift-guard);
  the reframe is pinned to the narrative north-star + per-deck lens; brand breadth is fixed (ES demo, generic title).

Next: write the plan, with per-artifact tasks in phase order A, B, C.
