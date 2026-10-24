# zha-ui - Foundation Refinement (design)

**Status:** Approved in principle 2026-06-23 (foundation direction confirmed by maintainer). Needs a written-spec review + a **visual presentation** (see §6) before implementation planning.
**Scope:** Spec 1 of 2 in the "grow the CSS primitive layer" phase. Spec 1 retunes the **token foundation** (radius, elevation, motion, tracking, spacing) so the upcoming primitives can look modern and architectural. The primitive classes themselves are **Spec 2** (separate doc), built on this.
**Grounding:** every change traces to `docs/research/2026-06-23-ui-foundations-research.md` (cue numbers below reference its §1).

---

## Guardrails (bind every change)

- **Locked, do not touch:** ES = teal accent; the 12-hue typology palette; ZHA Sans (`--font-secondary`) always regular weight + upright.
- **Contrast gate stays green** - re-run after any colour/border/shadow change (text 4.5 / non-text 3.0 across light, dark, brand surfaces). Radius/motion/type changes don't affect contrast.
- **Closed vocabulary** - consumers use `var(--…)` only; no hardcoded literals.
- **Additive where possible** - prefer adding tokens over renaming; existing consumers (primitives.css, the examples, Digital Archive) must not break. Retuned *values* (radius, motion) are fine; renamed *keys* require updating every consumer in the same change.
- **Byte-reproducible build** - the Style Dictionary multi-instance build is intentional (see the comment in `style-dictionary.config.mjs`); don't restructure it.

## Files in scope

- `packages/tokens/src/primitive/scale.tokens.json` - radius, motion/ease, spacing, type scale.
- `packages/tokens/src/semantic/core.tokens.json` - shadow, control/density.
- `packages/tokens/src/semantic/typography.tokens.json` - tracking.
- `packages/tokens/scripts/contrast-matrix.mjs` - only if a border/shadow change needs a new gated pair.
- `README.md` / `DESIGN.md` - document the elevation philosophy + any new tokens.

---

## 1. Radius - tighten for the architectural register (cue #2)

| Token | Current | Proposed | Use |
|---|---|---|---|
| `--radius-s` | 8px | **4px** | badges, chips, tags |
| `--radius-m` | 10px | **8px** | buttons, inputs, controls |
| `--radius-l` | 14px | **12px** | cards, panels, surfaces |
| `--radius-pill` | 999px | 999px | unchanged |

Value retune only (keys unchanged) → consumers pick it up automatically. Sharper corners suit the engineered register, and the retune can be reverted.

## 2. Elevation - border-first, shadows for floating only (cue #1)

- Keep `--shadow-low`, `--shadow-mid`; **add `--shadow-high`** for overlays/modals (back-port Digital Archive's third level), e.g. `0 8px 24px rgba(0,0,0,0.16)` (tune in build; verify it reads on dark/brand).
- **Rule (document in DESIGN.md):** passive surfaces (`.surface`, `.card`, stat tiles, table) carry depth via `--border-subtle` only; **only** popovers, menus, modals get a shadow. No behaviour change to existing tokens.

## 3. Motion - modern timing + a spring (cue #5)

| Token | Current | Proposed |
|---|---|---|
| `--motion-fast` | 150ms | 150ms (unchanged) |
| `--motion-base` | 220ms | **200ms** |
| `--motion-slow` | 360ms | **300ms** |
| `--ease-out` / `--ease-in` | keep | keep |
| `--ease-spring` | - | **add** `cubic-bezier(0.175,0.885,0.32,1.1)` (positional moves only) |

## 4. Typography - a real tracking scale (cue #6; keeps ZHA Sans regular/upright)

- Current tracking: only `display -0.03em`, `body -0.01em`.
- Proposed: `display → -0.04em`; `body` stays `-0.01em`; **add `tracking.label`/`tracking.small` `+0.01em`** (small geometric text needs air).
- **Optional** `--fs-hero ~32px` as a new step *above* `display` (24px) for headlines, because the examples' hero at 24px reads small. Additive; `display` unchanged. (Decide during review/visual.)
- ZHA Sans rule unchanged: never bold, never italic.

## 5. Spacing & density (cue: density)

- Add spacing steps: **`--space-10` 40px, `--space-12` 48px, `--space-16` 64px** (section rhythm; Digital Archive hand-uses these). Additive.
- Add a **`--row-h` density token** (comfortable default / compact override, mirroring `--control-h` 44/36) so the Spec-2 data-table primitive gets compact rows through the density axis, not hardcoded heights.

---

## 6. Visual presentation (required deliverable)

The foundation must be presented **visually, not only textually** - a render that shows the retuned radius scale, the border-first elevation levels, the motion/easing, the type+tracking scale, the spacing rhythm, and the locked colour/typology, side-by-side current-vs-proposed where it aids the decision. Build it as an **in-repo HTML reference** (e.g. `examples/foundation-reference/` or `docs/`), rendered strictly on the ZHA brand and tokens (no hardcoded colour; ZHA Sans only in the lockup), and **render-verify it in a browser** (headless screenshot) before sign-off. This doubles as living documentation of the foundation.

---

## 7. Decomposition & sequence

1. **This spec (foundation tokens)** → implementation plan (writing-plans) → build → gate green → visual reference.
2. **Spec 2 (primitive classes)** - promote the patterns from the research §4 + the structural set from §2, respecting the CSS-only/JS boundary (§3 of the research). Separate brainstorm/spec/plan cycle, built on this foundation.

## 8. Self-review notes

- Radius/motion are value-only retunes (no key renames) → no consumer breakage. `--shadow-high`, `--ease-spring`, `--space-10/12/16`, `--row-h`, `--fs-hero`, `tracking.label/small` are all **additive**.
- Only border/shadow/colour touches the gate; radius/motion/type/space do not. ES/teal/typology/ZHA-Sans are untouched.

Next: the written-spec review and the §6 visual presentation, then the implementation plan (writing-plans), which must re-run `pnpm build` (the gate) after the elevation change.
