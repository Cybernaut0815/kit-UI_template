# Token-system gaps surfaced by the examples refresh (Phase B backlog)

**Status:** P1 (the light block, 2369bc6; deck payoff 9e3fe27) and P3 (guard hardening, 55d1de0) shipped 2026-07-10; `.duoword` retired the same day (44e1c2c); the deck reconversion's last primitives (P4-1 `gray-77`, P4-3 `accent-on`) closed 2026-10-06; P2 was not built, no need survived the reconversion.
**Raised by:** [progress.md](../../.superpowers/sdd/progress.md) L335 - "FILE token-package ticket before Phase B."
**Source:** the 2026-07-09/10 examples refresh (branch `phase-0-foundation`, tip `7ed7480`), which rebuilt the brand decks to consume the package and hit four system-level walls.
**Validation:** two independent adversarial reviews (2026-07-10) - one on CSS-cascade/build mechanics (ran the refactor + byte-diffed outputs + tested the cascade in real Chromium), one on contrast values/scope (recomputed every WCAG ratio). Verdicts inline below.

The package is pre-1.0 and unpublished. The contrast gate fails the build on an AA miss. Colours ship hex-base + an `@supports (oklch)` overlay. `[data-brand]` is emitted last and wins equal-specificity ties.

---

## Headline: four reported problems are really two pieces of work

- **P1 is the keystone** - a real capability gap (themes/surfaces can't nest light-in-dark).
- **P2 and most of P4 are symptoms of P1** and fall out once it's fixed.
- **P3 (drift-guard) is the only other independent work.**
- One "P4" item (`.duoword`) is a latent accessibility bug, cheap to fix.

---

## P1 - No light/work counter-scope block *(keystone)*

**Root cause.** Light *is* the `:root` default ([style-dictionary.config.mjs:143-154](../../packages/tokens/style-dictionary.config.mjs#L143)). No `[data-theme="light"]` / `[data-surface="work"]` block is ever emitted (**confirmed**: the only selectors any Style Dictionary instance emits are `:root`, `[data-theme="dark"]`, `[data-surface="brand"]`, `[data-density="compact"]`, `[data-brand="*"]`). So a nested `data-theme="light"` subtree inside a dark/brand ancestor inherits the ancestor's dark custom-property values. Deck light-UI mockups had to paint from theme-invariant `--color-*` primitives.

**Who's affected.** Not just the decks - any future light region inside a dark/brand shell (light modal over dark chrome, product screenshot in a marketing page, docs showing a light app on a dark page). The `data-theme` attribute suggests that themes nest, but only dark-in-light works (via the `:root` default), not light-in-dark.

**Recommended fix - Option A (light-only block), browser-validated.**
1. Make `light.tokens.json` **symmetric with `dark.tokens.json`**: move `accent.DEFAULT`, `accent.fill`, and `intent.{error,success,warning,info}-text` from `core.tokens.json` into `light.tokens.json`. (`accent.on`, `accent.2.*`, and the intent *fills*/`on-*` are theme-invariant - leave them in core.)
2. Add one `buildColorBlock` call mirroring the dark build: source `primitive + core + light`, filter `/light\./`, selector `[data-theme="light"]`, `oklchKeepRefs: true`.
3. Concatenate the new block **after `brand-surface`, before the `[data-brand]` blocks, in BOTH the hex and oklch arrays** (`hexParts`/`oklchParts`, [config:312-313](../../packages/tokens/style-dictionary.config.mjs#L312)).

**Why light-only is enough (adversarial C2 - CONFIRMED in Chromium).** A nested element carrying `data-theme="light"` redefines the custom properties on itself; a direct match beats an inherited value regardless of specificity/emission order. Tested: a light island inside `dark`, inside `brand-surface`, and inside `dark + brand` all computed full-light values, including through the oklch `@supports` overlay. `[data-theme="dark"]` and `[data-surface="brand"]` override the **exact same 20 token names** - a symmetric light block covers all of them, **zero category leak**. So a light island counters a brand-surface ancestor too; `[data-surface="work"]` counter-scoping is **not needed** for any current use case - defer it (YAGNI).

**Implementation traps (from the reviews):**
- The core→light token move produces **value-identical but RE-ORDERED** output across `tokens.css/json/js/llms.txt/tailwind-preset` (Style Dictionary emits in declaration order). Verify with a **sorted/set diff + gate-green + full-matrix render**, NOT a raw diff (the raw diff will show reorder noise - expected, not a regression). `focus.ring`'s `{accent.DEFAULT}` ref still resolves (via live `var(--accent)`); no brand file references the moved tokens.
- **Do NOT add the light block to the contrast gate loop.** The gate iterates 3 hardcoded selectors and has no interaction with a new block ([contrast-matrix.mjs:68-72](../../packages/tokens/scripts/contrast-matrix.mjs#L68)). Its sentinel ([L82-98](../../packages/tokens/scripts/contrast-matrix.mjs#L82)) **false-throws** if you force a light-equivalent block in under a non-`light` label. The block re-asserts `:root` values the gate already validates - no gating needed.
- Same-element edge (one element with both `data-theme="light"` AND `data-surface="brand"`): resolves to light *because* the light block is emitted after brand-surface in both cascades. Irrelevant to nesting (different elements); get the order right anyway.

**Effort:** M (~½ day incl. render-verify). **Risk:** Low (pre-1.0, additive block + value-safe move, gate unaffected). The real cost is the mandatory full-matrix render-verify.

---

## P2 - Theme-invariant status colours + alpha hairline *(subsumed by P1)*

**Root cause.** Status text colours exist but are theme-scoped: `core.tokens.json` puts AA-on-light `intent.*-text` into `:root`; `dark.tokens.json` overrides them. A light island inside dark inherits the dark values → the deck approximated warning with grey.

**Scope correction (adversarial C4a - my original "only amber is the gap" was REFUTED).** Recomputed WCAG ratios for the raw typology hues used as *text*:

| status hue (as text) | on `#FFF` | on paper `#F4F2F0` |
|---|---|---|
| success `dark-green #1A9D67` | 3.46 ❌ | 3.10 ❌ |
| info `blue #1372DE` | 4.68 ✅ | 4.19 ❌ |
| warning `yellow/orange/apricot` | all ❌ | all ❌ |

Success and info fail AA-4.5-for-text too, not just warning. On the table above, every status hue fails AA as text except info on white; check each deck use during reconversion. The vetted `intent.*-text` values all pass (warning `#7A5B00` 6.32, success `#147A4F` 5.35, info `#1466C8` 5.58, error `#C2143C` 6.07).

**Fix = P1.** Once the symmetry move puts `intent.*-text` into the light block, a `data-theme="light"` island gets AA-safe status text for **all four** colours. Hairlines ride along too: `light.tokens.json` `border.*` are ink-alpha (`rgba(29,29,27,α)`) vs dark's white-alpha, so the light block gives a nested island correct hairlines - **no separate alpha-hairline primitive needed** (adversarial C5 - confirmed on the merits).

Do not build a standalone theme-invariant `--status-*-on-light` set. The only consumer would be "show the light palette on a dark page," which should wrap the region in `data-theme="light"` (show the real thing in context). Add one only if a concrete need survives P1.

**Effort beyond P1:** the token work is zero; the deck reconversion (below) is where it lands.

---

## P3 - Drift-guard matches by regex and never parses CSS *(independent; NOT adversarially reviewed)*

**Root cause.** [check.mjs](../../examples/brand-deck-editorial/check.mjs) matches `var(--…)` and colour literals by regex; it never parses CSS structure. The `59a3ff6` bug - a `*/` inside a comment (from `--color-*/…` adjacency) closed the comment early and dropped a rule - was token-clean, so it passed; only render-verify caught it. It also can't catch CSS named colours (`crimson`) or local `--x:` definitions.

**Who's affected.** Every deck author (their safety net) + reviewers forced to render-verify by hand to catch structural breakage.

**Options.**
- **A (recommended) - dependency-free structural hardening:** add a comment/brace-balance assertion (catches the `59a3ff6` class) + a named-CSS-colour denylist, factored into one shared `examples/_drift-guard.mjs` (the guard is currently ~duplicated across 6 files). No new dep. Its own ponytail comment already says "swap for a parser only if a real case slips through" - one did; the balance check honours that intent with the lazier mechanism.
- **B - real CSS parse (css-tree/postcss):** handles more cases, but adds a dependency to a workspace that is pure node stdlib today. Too high a rung unless A proves insufficient.
- **C - CI headless render-verify:** catches everything incl. runtime cascade; heaviest. Keep as the existing *manual* practice; don't automate a browser in CI pre-1.0.

**Effort:** S (~1-2h incl. shared-module refactor + a runnable self-check: a fixture with a stray `*/` that must fail closed).
**Confidence caveat:** P3 was not put through the adversarial reviews (it's tooling design, not refutable facts). Verify the balance-check catches the `59a3ff6` bug against a fixture before trusting it.

---

## P4 - Cross-deck inconsistencies

1. **`gray-33` vs `gray-77` for muted text → evaporates with P1** (adversarial C8a - confirmed: every occurrence is inside a light mockup and would revert to `--text-*`). `gray-77` on white is **4.48:1 (sub-AA)**, 4.01 on paper; `--text-muted` (`#6A6764`) is 5.62/5.03 (passes). No standalone fix - it's a step of the deck reconversion.
2. **`.duoword` → adopt the bundle's `.accent-grad-text`**, an **accessibility fix** (adversarial C8b). The bundle class ([base.css:44-48](../../packages/css/src/primitives/base.css#L44)) adds explicit `forced-colors` (→ `CanvasText`) and `@media print` handling that the decks' hand-rolled `.duoword` lacks, and clipped-transparent text is fragile in high-contrast mode. Main path is identical (`var(--brand-grad)`); the no-`background-clip` fallback shifts magenta (`--accent-2`) → teal-fill (`--accent-fill`), a near-dead code path but a deliberate change to **sign off**, then verify forced-colors/print. Independent of P1.
3. **`--accent-on` vs `--color-neutral-white` on dark buttons → both resolve to white** (adversarial C8c - confirmed). Converge on the semantic `--accent-on`. Trivial.

---

## Proposed order

1. **`.duoword` → `.accent-grad-text`** - independent a11y fix; sign off the fallback shift + verify forced-colors/print. Effort XS-S.
2. **P3 guard hardening (Option A)** - independent; re-verify the balance-check against a fixture (it wasn't adversarially reviewed). Effort S.
3. **P1 = Option A** - symmetry move + light block; verify via set-diff + gate + full-matrix render. Effort M.
4. **Deck reconversion (post-P1)** - swap island primitives → `--text-*` / `--intent-*-text` / `--accent-on`. Absorbs P2 (all four status colours) + P4-gray + accent-on. Re-check AA on any status text that was raw-typology.
5. **P2 standalone status set** - do NOT build unless a concrete need survives step 4.

Start with step 1 (`.duoword`); it needs a sign-off on the fallback shift.
