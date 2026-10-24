# zha-ui Gradient Library - Design

**Date:** 2026-07-09 · **Status:** approved (brainstorm) · **Branch:** `phase-0-foundation`
**Supersedes nothing.** Extends the Phase-A dual-accent work (`--brand-grad`, `.accent-grad`, `.accent-grad-text` stay as-is).

## Goal

Ship a **gradient library**: faithfully recreate the sanctioned ZHA brand gradients
(brand-reference §2.4) and add a small curated set of ready-to-use, on-brand gradients - as
`--grad-*` tokens + `.grad-*` utility classes, with the same free guarantees (print, forced-colors,
oklch fallback) the rest of the system carries.

## Colour-source rule

Gradients come in two provenance classes, and the rule is explicit so nobody "fixes" it later:

- **Frozen art** - the 4 documented mesh hero masters. Stored **verbatim in their authored sRGB hex**
  (brand-reference §2.4). The brand book hand-tuned them, so they sit outside the palette. The system may
  hold literal hex in a token definition - the "no raw hex" rule governs *consumer apps*, not the token layer.
- **Palette-derived** - everything new (spectrum, team, washes). Built **only** from the 12 typology
  hues / accent vars, so they trace to the palette and inherit oklch automatically via their `var()` refs.

### Why meshes stay sRGB (do not force oklch)

1. **Fidelity** - an oklch `@supports` overlay would render the masters *more saturated / hue-shifted*
   than the authored hex on P3 displays. That is drift from the downloadable asset, i.e. the opposite of faithful.
2. **Interpolation** - the meshes fade to `transparent`; fading to transparent in oklch produces muddy
   midpoints / hue-swings. sRGB is the space the art was tuned in.
3. **Nothing to protect** - the oklch overlay exists so colour doesn't *vanish* on weak engines. A gradient
   that ships as a hex string can't vanish, so oklch here is purely additive vividness bought at the cost of fidelity.

Because `$type: "other"` tokens skip the `color/oklch` transform (`style-dictionary.config.mjs`, filter
requires `$type === 'color'`), mesh tokens emit verbatim in `:root` once - this is free, no build change.

### Why the spectrum *does* use `in oklch`

Blending 12 hues across the wheel in sRGB muddies the transitions between opposing hues; `in oklch`
keeps them even and vivid - the textbook oklch-interpolation case. But an `in oklch` gradient is **invalid
on engines without interpolation-method support**, and oklch *colours* shipped before oklch *gradient
interpolation* (e.g. Safari 15.4 vs 16.2) - so the swap must NOT reuse the token overlay's
`@supports (color: oklch(0 0 0))` test. Worse, `var()` substitution defers validity to computed-value
time: a failed swap doesn't fall back to the earlier declaration, it blanks the property. So the spectrum
ships an **sRGB base token** plus an **oklch-interpolated token**, and the class swaps inside
**`@supports (background-image: linear-gradient(in oklch, red, red))`** - feature-testing the exact
capability being used. Clean sRGB fallback, vivid where supported.

## Architecture

No new build machinery. Gradient tokens are `$type: "other"` string tokens added to
`src/semantic/core.tokens.json` (alongside the existing `brand.grad`, already sourced by Builds 1/6/7 →
`:root`, `tokens.json`, `llms.txt`). A new CSS partial `src/primitives/gradient.css` holds the utilities,
inserted into the fixed `PARTIALS` cascade in `build.mjs`.

```
tokens/src/semantic/core.tokens.json   → --grad-* custom properties in :root
css/src/primitives/gradient.css        → .grad-* utility classes (+ print / forced-colors / @supports)
```

## Catalog

### Tier 1 - Hero mesh (frozen art), brand surface only

Each token is the radial stack **plus a trailing `linear-gradient(<base>,<base>)` layer** so a single
`background-image: var(--grad-hero-*)` paints the radials over the near-black floor (first layer = top,
last = bottom). Values transcribed verbatim from brand-reference §2.4 (masters 01/02/04/05; 03 was not
analysed and is out of scope).

| Token | Character | Base floor |
|---|---|---|
| `--grad-hero-ember` | Ember / Terracotta | `#110008` |
| `--grad-hero-ocean` | Deep Ocean / Cobalt | `#050508` |
| `--grad-hero-violet` | Violet Sphere / Amber Flare | `#0a0008` |
| `--grad-hero-dusk` | Indigo→Gold / Dusk Sweep (most brand-core) | `#05030f` |

Exact values (the radial stacks are §2.4 verbatim; only the trailing base-floor layer is appended):

```
--grad-hero-ember:
  radial-gradient(ellipse 70% 55% at 62% 52%,#a03a1a 0%,#7a2810 35%,transparent 75%),
  radial-gradient(ellipse 40% 30% at 88% 10%,#b04a20 0%,transparent 60%),
  radial-gradient(ellipse 60% 50% at 10% 15%,#4a0a3a 0%,transparent 70%),
  linear-gradient(#110008,#110008);
--grad-hero-ocean:
  radial-gradient(ellipse 65% 60% at 85% 75%,#1a22bb 0%,#0d1580 40%,transparent 75%),
  radial-gradient(ellipse 55% 45% at 45% 5%,#0d3d40 0%,#082030 45%,transparent 75%),
  linear-gradient(#050508,#050508);
--grad-hero-violet:
  radial-gradient(ellipse 35% 30% at 95% 2%,#b06020 0%,#8a3a10 40%,transparent 70%),
  radial-gradient(ellipse 75% 90% at 35% 45%,#7a1870 0%,#5a0c50 40%,#2a0420 70%,transparent 90%),
  linear-gradient(#0a0008,#0a0008);
--grad-hero-dusk:
  radial-gradient(ellipse 30% 25% at 98% 0%,#b08010 0%,#806010 35%,transparent 65%),
  radial-gradient(ellipse 60% 80% at 90% 50%,#804040 0%,#4a1850 40%,transparent 75%),
  radial-gradient(ellipse 70% 100% at 10% 50%,#1a0a60 0%,#0d0530 55%,transparent 80%),
  linear-gradient(#05030f,#05030f);
```

### Tier 2 - Spectrum (palette-derived)

12 typology hues in spectrum order. Two tokens; the class picks by `@supports` (see rationale above).

```
--grad-spectrum:                 /* sRGB base - universal fallback */
  linear-gradient(105deg,
    var(--color-typology-purple), var(--color-typology-ultramarine), var(--color-typology-blue),
    var(--color-typology-teal), var(--color-typology-dark-green), var(--color-typology-light-green),
    var(--color-typology-lime), var(--color-typology-yellow), var(--color-typology-apricot),
    var(--color-typology-orange), var(--color-typology-cool-red), var(--color-typology-magenta));
--grad-spectrum-oklch:           /* identical stops, interpolated in oklch - vivid transitions */
  linear-gradient(105deg in oklch,
    var(--color-typology-purple), … , var(--color-typology-magenta));
```

(12 stops with no explicit positions auto-distribute evenly.)

### Tier 3 - Team (palette-derived, already partly shipped)

- `--brand-grad` - **exists** (Phase A): `linear-gradient(105deg, var(--accent) 0%, var(--accent-2) 100%)`. Kept.
- `--brand-grad-subtle` - **new**: `linear-gradient(105deg, var(--accent-subtle) 0%, var(--accent-2-subtle) 100%)` -
  a low-opacity team wash for panel/section backgrounds on work surfaces. Resolves live per team/theme.

### Tier 4 - Curated washes (palette-derived, two utilities)

Deliberately minimal - two utilities, extensible later. Both reference `--accent-subtle`, which is
**verified present in `:root`** (`light.tokens.json` → Build 1) and re-emitted per team by the brand
blocks - so the washes resolve live per team and inherit oklch, no fallback needed.

```
--grad-wash:  linear-gradient(180deg, var(--accent-subtle) 0%, transparent 100%);          /* top-tint wash */
--grad-glow:  radial-gradient(ellipse 90% 70% at 50% -10%, var(--accent-subtle) 0%, transparent 70%); /* overhead glow */
```

## API - utility classes (`src/primitives/gradient.css`)

Named classes mirror the tokens; the existing `.accent-grad` / `.accent-grad-text` are unchanged
(minor prefix inconsistency with `.grad-*` accepted pre-1.0 to avoid churning just-shipped Phase A).

| Class | Paints |
|---|---|
| `.grad-hero-ember` · `-ocean` · `-violet` · `-dusk` | `background-image: var(--grad-hero-*)` - full-bleed hero mesh |
| `.grad-spectrum` | `var(--grad-spectrum)`, upgraded to `var(--grad-spectrum-oklch)` under `@supports (background-image: linear-gradient(in oklch, red, red))` |
| `.grad-wash` · `.grad-glow` | `background-image: var(--grad-wash|--grad-glow)` |
| `.accent-grad-subtle` | `background-image: var(--brand-grad-subtle)` - joins the `.accent-grad*` team family |

## Free guarantees (built into `gradient.css`)

- **Print** - one grouped `@media print` rule sets every gradient utility to `background-image: none`
  and a white floor, so decorative gradients never print ink-heavy. (Hero text uses `--text-*`, which the
  existing token print block already flips to black-on-white → stays legible.)
- **forced-colors** - `@media (forced-colors: active)` drops the gradient `background-image`
  (forced-colors forces the underlying colours itself); gradient-clipped text reverts to
  `CanvasText` via the existing base/lockup rules.
- **oklch** - spectrum handled above; team/wash gradients inherit oklch via their `var()` refs; meshes
  are intentionally sRGB (frozen art).
- **reduced-motion** - library gradients are **static** (no animation added), so nothing new is needed.
  The only animated gradient remains the lockup hover-shift.

## Accessibility guardrail (documented, not gated)

The contrast gate validates named colour PAIRS, not text-over-gradient - it cannot see these. So:
- Hero meshes assume **white text on a dark floor** (`color-scheme: dark`). §2.4 flags the amber zones
  (`grad-hero-ember/violet/dusk`) reaching L≈35-40% - white text there is borderline. **Render-verify
  white-text legibility on the amber zones**; if any fails, the consumer adds a scrim, not the token.
- Gradients are **decorative**: never the sole carrier of meaning; never a work-surface heading fill.
- This is enforced by docs + the render-verify step below, the same way Phase A's oklch cascade was.

## Files touched

- **Modify** `packages/tokens/src/semantic/core.tokens.json` - add the `grad.*` + `brand.grad-subtle` tokens.
- **Create** `packages/css/src/primitives/gradient.css` - the `.grad-*` utilities + print/forced-colors/@supports.
- **Modify** `packages/css/build.mjs` - add `'gradient'` to the `PARTIALS` cascade (after `'base'`).
- **Test** `packages/tokens/test/` - new `gradient.test.ts`: assert `--grad-hero-*`, `--grad-spectrum`,
  `--grad-spectrum-oklch`, `--brand-grad-subtle`, `--grad-wash/glow` present in built `dist/tokens.css`,
  and that mesh tokens contain their authored hex (no oklch conversion).
- **Test** `packages/css/test/exports.test.ts` - assert the classes ship; `.grad-spectrum` has the
  `@supports (background-image: linear-gradient(in oklch, red, red))` upgrade; the `@media print` and `forced-colors` suppressions exist.
- **Docs** `AI-USAGE.md`, `DESIGN.md`, `docs/zha-brand-reference.md` (§2.4 → point at the shipped tokens),
  and the llms.txt token list picks up the new vars automatically.

## Render-verify (manual, no commit - same method as Phase A Task 5)

`file://` is blocked in Playwright MCP → serve the repo root with a tiny static node server
(`run_in_background`), navigate to a throwaway `_verify-grad.html`, and confirm:
- The 4 hero meshes match the §2.4 look (radials over near-black; not flat) on `data-surface="brand"`.
- `.grad-spectrum` renders a vivid, even sweep (oklch path); temporarily disable oklch to eyeball the sRGB fallback.
- `.grad-wash` / `.grad-glow` / `.grad-brand-subtle` read as subtle on `data-surface="work"`, per team (ES teal).
- White text over the amber hero zones is legible (or note where a scrim is needed).
Delete the page, screenshots, `.playwright-mcp/`, and stop the server after. Fix defects in the owning
file, rebuild, re-verify.

## Out of scope

- Animated / interactive gradients beyond the existing lockup hover-shift.
- Per-team mesh variants (the 4 masters are shared brand assets, not per-team).
- Assigning accent pairs to the six unconfirmed teams (that's Phase B).
- Parametric flowing lines / ghost letterform (brand-reference §5 - separate Phase-3 devices).

## Self-review

- **Placeholders:** none - every token value is concrete (meshes verbatim §2.4, spectrum enumerated,
  washes defined). One flagged runtime dependency (`--accent-subtle` at `:root`) with an explicit fallback.
- **Consistency:** token names `--grad-hero-*`, `--grad-spectrum(-oklch)`, `--grad-wash/glow`,
  `--brand-grad-subtle` used identically in catalog, API table, and Files-touched; the `in oklch` fallback
  story is stated once and referenced.
- **Scope:** one implementation plan's worth - tokens + one CSS partial + tests + docs + verify.
- **Ambiguity:** the sRGB-vs-oklch rule is stated per tier; the print/forced-colors behaviour is explicit.

Next: write the implementation plan, then render-verify per the section above.
