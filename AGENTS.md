# AGENTS.md

kit-ui is the design system for the kit modules (kit-sim, kit-forge, kit-viz): tokens and primitive classes as plain CSS, Geist fonts, three example pages and an agent skill. There is no build: `css/` is the package, installed from a git tag. The agent rules live in [the skill](./skills/kit-ui/SKILL.md); the consumer guide is [`README.md`](./README.md).

## Rules

Each rule carries its reason, so nobody undoes one for lack of context.

- **Tokens only.** Primitives and examples use only variables declared in `css/tokens.css`; colour literals live in that file alone (and the print block). A literal elsewhere drifts from the themes and dodges the contrast gate.
- **Dark by default, system-aware.** Without `data-theme` the page follows `prefers-color-scheme`, dark when unknown. The light roles live twice in `tokens.css` (explicit and system block) because `light-dark()` would hand canvas readers a non-hex string; edit both, the test checks they match.
- **Three kits.** `data-kit="sim|forge|viz"` (orange, red, purple) is the only accent switch; forge is the default. A new accent is a new kit, never an ad-hoc override.
- **Sharp by default.** Every corner is `var(--radius)`, which is `0`. Never add a per-component radius or a pill: the square look is the product decision.
- **No build.** `css/` ships as written; `kit-ui.css` pulls `tokens.css` in with `@import`. Adding a build step means consumers and examples need it too.
- **Examples open from `file://`.** Plain HTML linking `../css/kit-ui.css`; inline script only for toggles. No fetch, no modules, no server.
- **One copy of the skill.** `skills/kit-ui/` is the only copy; `reference.md` must name every class (the test enforces it).
- **Identity-free.** No company names, logos or fonts; the test's leak guard fails on the old ones.
- **No push, no merge.** Commit only when the maintainer asks.

## Run and verify

- `npm test` runs the single `node:test` gate (Node 20+, no install step):
  - contrast for 5 themes (system dark and light, explicit dark and light, brand) × 3 kits;
  - dark by default, system-aware, and the two light blocks identical;
  - class and `var()` sync;
  - no colour literals in examples;
  - the leak guard.
- Done means `npm test` green. For any colour or token change, also open `examples/index.html`, `app.html` and `deck.html` in a browser at light, dark and brand. The gate checks token values, not how they render.

## Code map

| Path | What it is |
| --- | --- |
| `css/tokens.css` | Every variable: palette, theme roles, kit presets, charts, scale, type, gradients |
| `css/kit-ui.css` | Fonts and all primitives, in cascade order (base, type, gradients, layout, navigation, content, feedback, overlay, menu) |
| `css/fonts/` | Geist, Geist Mono and their OFL licence |
| `examples/index.html` | Live reference of every token and primitive, with switches |
| `examples/app.html` | Tool page: shell, table, dialog, menu, toast |
| `examples/deck.html` | Slide deck on the brand surface |
| `skills/kit-ui/` | Agent skill: `SKILL.md` and `reference.md` |
| `test/check.test.mjs` | The gate |

## Work queue

`PLAN.md` holds `## Planned`, `## In progress` and `## Done`.

- Work the top Planned item unless told otherwise.
- Move the item to Done with a `YYYY-MM-DD` prefix in the same commit as the work.
- Follow-up work is one new bullet at the bottom of Planned.
- Commits are `type(scope): what changed`, one logical commit per task.
