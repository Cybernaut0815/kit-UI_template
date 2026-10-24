# zha-ui - Dual-Accent Colour Pairs (design)

> Status: **proposed design**, brainstormed + **two opus adversarial reviews** (design + systems), 2026-06-26. Awaiting maintainer review before `superpowers:writing-plans`.
> Builds on the foundation (`docs/specs/2026-06-23-zha-ui-foundation-refinement-design.md`) and primitive layer (`docs/specs/2026-06-24-zha-ui-primitive-layer-design.md`).
> Origin: in the four brand decks (`examples/brand-deck*`), a teal→magenta pair plus gradient read as richer than a single accent. This promotes that finding to a system-wide rule.
> Review fixes folded in (R1 = the cascade reality below - the "auto-lightens on dark" claim was false and removed; R2 = pairs are an un-assigned pool, not team defaults; R3 = gate the no-partial-secondary rule + secondary-fill AA, not decorative endpoints; R4 = restraint ceiling on gradient-text). Midpoints are now computed with culori, not eyeballed. Both reviews agreed: ship ES + the mechanism; do **not** hardcode the other teams' gradients before they confirm.

## 1. Goal

Move every team ("brand") from **one** accent colour to an **ordered pair** - a primary anchor and a secondary - plus a gradient that sweeps primary→secondary. Team identity becomes *the pair and its sweep*. ES is fixed to **teal → magenta**; every other pairing is drawn from a vetted **pool** (§4 - more pairs than there are teams) that a team picks from at confirmation. Pairs are **not pre-assigned** to teams and nothing but ES is a shipped default.

## 2. Decisions locked (maintainer, 2026-06-26)

1. **Secondary = expressive only.** The secondary drives the gradient, a subtle tint, and identity/marketing/data-viz accents. The **primary stays the sole interactive accent** - buttons, focus, links, active states, progress. Status/alerts keep their existing `--intent-*` colours. *Trade-off (review-flagged, accepted by maintainer): this consciously drops the decks' use of the **secondary** as a "live / needs-attention" signal - that role stays with `--intent-*` and the team's **primary** accent (the maintainer's call: "the individual accent will take this role"). The secondary is purely expressive.*
2. **Gradients reach identity surfaces only** - lockup, hero, section dividers, big numbers, empty-state art, data-viz - plus one opt-in utility. Functional UI stays on solid `--accent-fill`. **Restraint ceiling:** gradients are an identity/hero accent, never a default heading style; `.accent-grad-text` is forbidden on `data-surface="work"` headings (keeps the firm's hairline-restraint identity - DESIGN.md §"Depth & elevation").
3. **Magenta is shared.** `teal→magenta` (ES) and ZH-Cluster's magenta coexist; identity is the pair. Constraint added after review: magenta as a **primary** belongs to ZH-Cluster alone; ES uses magenta **only as a gradient endpoint**, never as a solid swatch.

## 3. The model

### Token shape

`--accent`, `--accent-fill`, `--accent-subtle`, `--accent-on` are unchanged (the primary). Add a parallel secondary family:

- `--accent-2` - the secondary hue (gradient endpoint + tint source).
- `--accent-2-subtle` - 12-16 % tint, for faint secondary washes.
- `--accent-2-fill` - a 3.0-safe solid, **shipped only where a team paints its secondary as a solid swatch/border/icon**; omitted (gradient-only) where the hue can't clear 3.0 (yellow/lime/light-green). No `--accent-2-on`: expressive-only means no text sits on the secondary.

### The gradient is one token

Define `--brand-grad` **once** in `:root` (semantic core):

```css
--brand-grad: linear-gradient(105deg, var(--accent) 0%, var(--accent-2) 100%);
```

It resolves to whatever `--accent` / `--accent-2` are in the current cascade, so every team gets a correct sweep with no per-team gradient string and no new build logic (`var()` inside a gradient already works here - `es-lockup.css:39`).

### Cascade reality - what the gradient renders (R1, verified)

**A brand is always present on shipped pages**, and brand blocks win. Verified in `packages/tokens/dist/tokens.css`: the single-attribute selectors are emitted `:root` → `[data-theme="dark"]` (line 114) → `[data-surface="brand"]` (141) → `[data-brand="…"]` (178-245), all equal specificity (0,1,0). The later one wins, so **`[data-brand]` overrides `[data-theme="dark"]`/`[data-surface="brand"]`**. The dark block's `--accent: teal-light` is shadowed whenever a brand is set.

Consequence: `--accent` and `--accent-2` take the **brand's own values on every surface - they do not lighten on dark/brand.** This is a *pre-existing* behaviour of the primary (not introduced here), and for the gradient it is exactly what we want: the gradient renders the brand's **full-strength** pair, which is precisely what the four decks shipped and the maintainer approved (deck gradient = `#048C9C → #CB0092`, full strength). On the near-black brand surface (`#0D0D0C`) the ES endpoints clear non-text contrast (teal `#048C9C` ≈ 4.85, magenta `#CB0092` ≈ 3.66, both ≥ 3.0). **No `magenta-light`, no dark-surface secondary override, no compound selectors.** (The earlier draft's "auto-lightens on dark" claim was false and is removed.)

### The real invariant (R1): no partial secondary

Core defines a default `--accent-2` (magenta) in `:root`, so `--brand-grad` always resolves - an unconfirmed team that sets only `--accent` inherits core's magenta as its second stop. That is **acceptable** under the un-assigned model (§4): an unconfirmed team has no committed pair, and `{its-accent}→magenta` is a sane default that nobody renders until the team opts into a gradient. So the gate does **not** force every brand to declare `--accent-2`.

The genuine authoring hazard is a **partial secondary**: a brand that sets `--accent-2-subtle` or `--accent-2-fill` but forgets `--accent-2` (the hue), which would silently fall back to core magenta for the gradient/tint while the team thinks it set its own. So the **gate fails if a `[data-brand]` block defines any secondary token (`--accent-2-subtle` / `--accent-2-fill`) without `--accent-2`** (§7). A confirmed team declaring its full pair is a Phase-B checklist item, not a Phase-A gate (no non-ES team ships a secondary in Phase A).

## 4. The pool - vetted pairs to pick from (R2)

Pairs are **not assigned to teams.** Only **ES** ships (Phase A); every other team picks from this pool at confirmation, or proposes its own against the rule below. The pool is intentionally **larger than the seven teams** so there is real choice.

**The principle (computed, not eyeballed):** a pair stays vivid when it travels **within one temperature family** (cool↔cool, warm↔warm, green↔green) or **bridges through the saturated violet/magenta corner**; it greys when it crosses the **green↔red axis** (teal/green ↔ orange/red), where the sRGB midpoint desaturates. Verified with culori - every pool midpoint is oklch chroma **C ≥ 0.107**; the rejected cross-axis controls fall to **C ≤ 0.08** (teal→orange `#766d64` C=0.018, blue→light-green `#569982` C=0.078, blue→orange `#7d6085` C=0.066). CSS gradients interpolate in gamma sRGB by default, so the midpoint hex below *is* the rendered middle. `Edge` columns = WCAG contrast of each endpoint on the near-black brand surface `#0D0D0C` / on white `#FFFFFF` (3.0 = decorative-surface floor).

**A · Cool→hot through violet** (dramatic signature sweeps)

| Pair | Hexes | Midpoint | C | Edge (on #0D0D0C / #fff) |
|---|---|---|---|---|
| Teal → Magenta - **ES, confirmed** | `#048C9C → #CB0092` | `#684697` | .129 | 4.85·3.66 / 4.01·5.31 |
| Blue → Magenta - *electric* | `#1372DE → #CB0092` | `#6F39B8` | .189 | 4.16·3.66 / 4.68·5.31 |
| Ultramarine → Magenta - *royal* | `#2838E6 → #CB0092` | `#7A1CBC` | .224 | **2.59**·3.66 / 7.50·5.31 |
| Purple → Cool-red - *plum* | `#7633E2 → #E61C4E` | `#AE2898` | .204 | 3.09·4.30 / 6.28·4.53 |

**B · Cool** (blue/indigo deepenings)

| Pair | Hexes | Midpoint | C | Edge (on #0D0D0C / #fff) |
|---|---|---|---|---|
| Teal → Blue - *ocean* | `#048C9C → #1372DE` | `#0C7FBD` | .131 | 4.85·4.16 / 4.01·4.68 |
| Blue → Ultramarine - *deep sky* | `#1372DE → #2838E6` | `#1E55E2` | .221 | 4.16·**2.59** / 4.68·7.50 |
| Ultramarine → Purple - *twilight* | `#2838E6 → #7633E2` | `#4F36E4` | .244 | **2.59·3.09** / 7.50·6.28 |

**C · Warm** (sunset / ember)

| Pair | Hexes | Midpoint | C | Edge (on #0D0D0C / #fff) |
|---|---|---|---|---|
| Orange → Yellow - *sunrise* | `#E74D2B → #F5BB00` | `#EE8416` | .166 | 5.09·11.1 / 3.82·**1.75** |
| Magenta → Orange - *coral* | `#CB0092 → #E74D2B` | `#D9275F` | .211 | 3.66·5.09 / 5.31·3.82 |
| Apricot → Cool-red - *ember* | `#F3901B → #E61C4E` | `#ED5635` | .192 | 8.16·4.30 / **2.38**·4.53 |
| Magenta → Cool-red - *raspberry* | `#CB0092 → #E61C4E` | `#D90E70` | .228 | 3.66·4.30 / 5.31·4.53 |

**D · Green** (foliage)

| Pair | Hexes | Midpoint | C | Edge (on #0D0D0C / #fff) |
|---|---|---|---|---|
| Dark-green → Lime - *foliage* | `#1A9D67 → #C6BE13` | `#70AE3D` | .159 | 5.61·9.98 / 3.46·**1.95** |
| Teal → Dark-green - *sea-pine* | `#048C9C → #1A9D67` | `#0F9582` | .107 | 4.85·5.61 / 4.01·3.46 |
| Light-green → Yellow - *chartreuse* | `#99C025 → #F5BB00` | `#C7BE13` | .164 | 9.19·11.1 / **2.12·1.75** |

**Reading the edges (informs the pick, doesn't gate the gradient):** **bold** values are below 3.0. The dim-on-near-black cases (ultramarine 2.59) suit light surfaces or gradient-text *on* the brand surface; the dim-on-white cases (yellow/lime/light-green endpoints) are fine as a gradient stop but must not be used as solid text on white. Distinctness between teams is a selection concern at confirmation - pick across families (A/B/C/D) rather than two neighbours from the same column.

## 5. Contrast & accessibility (R3)

- **Gradient as backdrop is decorative - endpoints are not hard-gated** (a deliberate scoping of reviewers' "gate the endpoints", because a hard ≥3.0 endpoint rule would false-fail valid dim stops like ultramarine `#2838E6` = 2.59 on near-black, which is fine as a decorative gradient stop but not as a UI element). Instead: the pool (§4) publishes every endpoint's contrast so picks are informed, and each team's pair is **render-verified** on its surfaces at confirmation. Bare `--accent`/`--accent-2` used as a *UI element* (not a gradient stop) are covered by the existing primary gate + the secondary-fill check below.
- **No reading text on a gradient backdrop.** A gradient `.accent-grad` fill is a backdrop accent, not a text bed; if text must sit on one, it has to clear AA at the *lightest* endpoint (the teal end of teal→magenta is the risky one) - discouraged, not gated.
- **Gradient-text** (the lockup, `.accent-grad-text`) is a brand-display treatment only: permitted at display/hero sizes (≥ `--fs-hero`, large-text 3.0 threshold), brand surface / lockup only. Its **solid fallback uses `--accent-fill`**, not bare `--accent` (bare `--accent` as text fails AA on light - e.g. teal `#048C9C` on white ≈ 3.0, which is why the system already mandates `--accent-fill` for the primary button, DESIGN.md:171).
- **Primary** is unchanged - still gated exactly as today (white-on-fill ≥ 4.5, fill-on-surface ≥ 3.0 light + dark).
- **Secondary** solid fill, where shipped, adds a non-text 3.0 check on light + dark. No 4.5 white-on-fill - expressive-only means no text on the secondary.
- Status remains colour-plus-shape (badges keep their dot/text); the secondary never becomes a status signal.

## 6. Token changes, file by file (ES / Phase A)

**`packages/tokens/src/primitive/color.tokens.json`** - no change needed (`magenta #CB0092` already exists; `magenta-light` is **not** added - the gradient uses full-strength magenta, per §3).

**`packages/tokens/src/semantic/core.tokens.json`** (light/work default = the ES pair) - add:
- `accent.2.DEFAULT = {color.accent.magenta}`, `accent.2.subtle = rgba(203,0,146,0.12)`, `accent.2.fill = {color.accent.magenta}` (magenta is already 3.0-safe as a fill).
- `brand.grad = "linear-gradient(105deg, var(--accent) 0%, var(--accent-2) 100%)"` (`$type: other`).

**`packages/tokens/src/semantic/dark.tokens.json`** / **`brand-surface.tokens.json`** - **no accent-2 override** (the brand block wins anyway; the full-strength pair is the intended dark/brand look). Leave as-is.

**`packages/tokens/src/brand/es.tokens.json`** - add `accent.2.DEFAULT = {color.accent.magenta}`, `accent.2.subtle = rgba(203,0,146,0.12)`; **remove** the obsolete `brand.grad` (teal→green) so the var-based core gradient (teal→magenta) is inherited.

**Other six `brand/*.tokens.json`** - **untouched in Phase A.** Each gets its `accent.2` only when its pair is confirmed (Phase B). Until then they inherit core's `--brand-grad` and their `--accent-2` falls back to core magenta - acceptable for an unconfirmed team (§3). Because they define no secondary tokens at all, the no-partial-secondary gate (§7) is vacuously satisfied for them.

## 7. Build & gate

- **`style-dictionary.config.mjs`** - Build 4 (brand axis) emits whatever a brand file defines, so `accent-2*` flows automatically and gets the hex + oklch overlay like any colour token (`oklchKeepRefs:true` already set for brand blocks, so the known alias-drop bug does not bite). `brand.grad` is `$type:other` → excluded from the oklch overlay and emitted literally, as today. **Verify** no logic change needed; expected none.
- **`scripts/contrast-matrix.mjs`** - add exactly two checks (kept minimal on purpose - the gradient itself is decorative, §5):
  1. **Secondary-fill AA** - add `['accent-2-fill', 'bg-surface-1', 3.0]` to the `PAIRS` list, so the secondary fill is checked on light **and** dark **and** brand surfaces (the existing `PAIRS` loop runs all three). In Phase A this validates core's `--accent-2-fill` (magenta): 5.31 on white, ≥3.0 on dark/brand (magenta is already a shipped AA fill for ZH-Cluster, so this passes).
  2. **No partial secondary** - in the per-brand loop (`:107`), fail if a brand block defines `--accent-2-subtle` or `--accent-2-fill` but not `--accent-2`. Vacuously true for the six untouched teams (they define none); ES defines `--accent-2` + `--accent-2-subtle`, so it passes.
  Gradient endpoints are **not** hard-gated (§5 rationale: ultramarine-class dim stops are valid decoration); endpoint contrast is published in §4 and render-verified per team at confirmation. A confirmed team declaring both stops is a **Phase-B** gate addition, not Phase A. These reuse the gate's existing source-value resolution and do **not** close the oklch-overlay blind spot, so ES still needs a render spot-check (§11).
- **`packages/tokens/test/brand-axis.test.ts:17`** - the `--brand-grad` assertion regex (`/--brand-grad:\s*linear-gradient\(105deg/`) still matches once the token moves to `:root`; **update the stale comment** ("its teal→green gradient") and drop any green-specific expectation.

## 8. CSS consumers

- **No primitive changes.** `base.css`, `nav.css`, `feedback.css`, `content.css` read `--accent`/`--accent-fill` = the primary, which is unchanged.
- **`es-lockup.css:39,49,52`** - drop the ES-specific `teal→green` fallback; the fallback gradient becomes `var(--accent)`→`var(--accent-2)`, and the solid/forced-colors fallback uses **`--accent-fill`** (R3), so the lockup is generic per team and AA-safe where it degrades to solid.
- **New opt-in utility** (one small block, in `base.css` or a new `accents.css` partial):
  - `.accent-grad { background-image: var(--brand-grad); }` - area fills (hero bands, dividers, stat-accent strips).
  - `.accent-grad-text { background-image: var(--brand-grad); -webkit-background-clip: text; background-clip: text; color: transparent; }` - gradient headlines/numbers, reusing the lockup's existing `@supports not (…background-clip:text)` + `forced-colors` fallback to a solid **`--accent-fill`**. Restraint ceiling per §2.2 (hero/identity sizes, not `work` headings).

## 9. Docs

Rewrite "one accent per team" → "a pair per team", and supersede "typology palette is data-only":

- **`AI-USAGE.md`** (per-team table + the `--accent…` var list) - add the secondary family + ES's pair; note rows 2-7 are unconfirmed candidates.
- **`AGENTS.md:40`**, **`README.md:19,45`**, **`DESIGN.md:20,171`** - "your team's accent" → "your team's accent pair"; document the gradient + the `.accent-grad*` utilities **and their restraint ceiling**; clarify the typology prism now also sources team pairs (data-viz still uses the full prism).
- **`docs/zha-brand-reference.md:52`** - reframe ES's teal/magenta as the confirmed **pair**, not a light/dark split.
- **`llms.txt`** (generated) - picks up the new tokens on rebuild; confirm the var list shows `--accent-2*` and `--brand-grad`.

## 10. Rollout & scope

- **Phase A - system + ES (confirmed), ships now:** core `--accent-2` + the single var-based `--brand-grad`; ES brand file gains `accent-2` and drops its teal→green grad; the gate gains the secondary-fill AA + no-partial-secondary checks (§7); the `.accent-grad*` utilities with restraint ceiling + `--accent-fill` fallback; docs. **Render-verify ES across light / dark / brand** (the gate can't see the oklch overlay). Both reviews: GO.
- **Phase B - per team, at confirmation only:** the team picks a pair from the §4 pool (or proposes one against the pool's vivid-midpoint rule + checks the endpoint contrast for its surfaces), then adds its `accent.2` (+ optional fill), and the gate gains a "this confirmed brand defines both stops" check for that team. **No per-team gradients are written before confirmation** - unconfirmed teams inherit core's default. The §4 pool is the picking menu.
- **Out of scope:** the four `examples/brand-deck*` are frozen showcases that already demonstrate teal+magenta - **left as-is**. `zha-app-vanilla` / `-react` / `foundation-reference` are token-only and update for free.

## 11. Risks & non-goals

- **Cascade blind spot (R1):** the gate validates source-intended values, not the emitted oklch `@supports` cascade. Mitigation: the invariant + secondary-fill checks catch the common failures; a **render spot-check of ES on light/dark/brand** (3 states, not the full 7×2×2 matrix, because only ES ships in Phase A) covers the rest. Per-team render-verify happens at each Phase-B confirmation, not all at once.
- **Pre-existing quirk (not introduced here):** the primary's dark-mode lightening (`[data-theme="dark"] --accent: teal-light`) is shadowed whenever a brand is set. The gradient design relies on this (full-strength pair on dark) rather than fighting it. Fixing the quirk system-wide (compound `[data-theme][data-brand]` selectors) is a separate decision, explicitly out of scope.
- **Risk: lookalike pairs (§4):** with pairs un-assigned, the risk shifts from "four teams in the violet band" to "two teams pick lookalike pairs." Mitigation: the pool is grouped A - D and confirmation guidance is "pick across families"; not a Phase-A concern.
- **Non-goal:** no change to intent/status colours, the primary's behaviour, or the typology data-viz palette's role in charts.

## 12. Next

`superpowers:writing-plans` → SDD. Phase A is one plan (system + ES + docs). Phase B is a thin follow-on per team as pairs are confirmed.
