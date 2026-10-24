# AGENTS.md

zha-ui is the ZHA design system: tokens, primitives and the ZHA lockup as CSS variables and
classes, plus an agent skill that tells coding agents how to use them. It is a library consumed by
the other ES repos and by company apps, published from the `release/css` branch as
`@gitzhacode/zha-ui-css`, with `@gitzhacode/zha-ui-tokens` on `release/tokens`; the
`@gitzhacode/zha-ui-runtime` package stays private. Stack: a pnpm and turbo workspace, CSS built
from tokens, plain HTML and React plus Vite
examples. The agent rules live in [the skill](./skills/zha-ui/SKILL.md), the human guide in
[`DESIGN.md`](./DESIGN.md) and the consumer guide in [`README.md`](./README.md).

## Rules

These rules are non-negotiable, each with its reason, so that nobody undoes one for lack of
context.

- **Published vocabulary only.** Use only the published zha-ui CSS variables and primitive
  classes: never invent a custom property (for example `--color-primary`) and never hard-code a
  hex value. Every colour, size, space and state already exists as a token, so a literal or a
  made-up variable is off brand and the build may reject it. The canonical vocabulary is
  `@gitzhacode/zha-ui-tokens/llms.txt` (the package's `llms.txt` export; on disk at
  `node_modules/@gitzhacode/zha-ui-tokens/dist/llms.txt`), which is machine-readable and read
  first, then [`skills/zha-ui/reference.md`](./skills/zha-ui/reference.md) (class cheat-sheet and
  grouped variables) and [`DESIGN.md`](./DESIGN.md) (when to use each axis and capability).
- **Import the CSS once, first.** A page loads `@gitzhacode/zha-ui-css/index.css` once, from
  `./node_modules/@gitzhacode/zha-ui-css/dist/index.css` in plain HTML, because fonts and the logo
  resolve relative to that file. Consumers pin a tag such as `#css-v0.2.0` so an update never
  silently changes their page. Steps for both rings are in
  [`docs/how-to-set-up-a-zha-app.md`](docs/how-to-set-up-a-zha-app.md).
- **Declare identity on `<html>`.** Set `data-brand`, `data-theme`, `data-surface` and
  `data-density` once on `<html>` and let everything inside inherit; `zha-app` is the firm identity
  and the default when `data-brand` is absent. Beside `data-theme="light"` on the same element
  light wins, because the tokens emit light last, so a brand page sets `data-theme="dark"
  data-surface="brand"` or puts `brand` on the island only. The options table is in the same
  [setup page](docs/how-to-set-up-a-zha-app.md).
- **One copy of the skill.** The skill in `skills/zha-ui/` holds the page skeletons, the slugged
  rules, the anti-pattern list, the ship checklist and the naming and type rules, and consumers
  install it with `npx skills add GitZHACODE/zha-ui`, which places it where every tool the `skills`
  CLI supports reads it (the README's quick start lists the folders). Change it here, never in a
  fork, and add no per-tool copy: a second copy drifts from the first. Read `SKILL.md` and
  `reference.md` before building or changing any example page.
- **Source only in git.** `dist/` is generated and gitignored, so commit source only.
- **Dark brand cascade is intended.** `[data-brand]` beating `[data-theme="dark"]` on branded pages
  is by design; do not "fix" it.
- **No push, no merge.** Never `git push` or merge, and commit only when the maintainer
  asks, because publishing is deferred.

## Run and verify

Commands run from the repo root with Node and pnpm; the repo has no Python environment.

- `pnpm install` installs the workspace (pnpm 9 per `packageManager`, Node 20 per `.nvmrc`).
- `pnpm build` builds every package through turbo and runs the contrast gate, which fails closed.
- `pnpm test` runs every package's tests through turbo.
- `pnpm lint` lints every package through turbo.
- `node scripts/preflight.mjs` checks that your git can read the private repo, without prompts.
- Done means `pnpm build` green, `pnpm test` green and `pnpm lint` clean. For any colour or token
  change, add a browser render-verify of ES at light, dark and brand, because the contrast gate
  validates the source-intended token values, not the emitted oklch `@supports` cascade.

## Code map

These are the working examples and the skill, the paths a newcomer needs first.

| Path | What it is |
| --- | --- |
| `examples/index.html` | The hub: navigational front door for all examples (works in-repo and off the ES share) |
| `examples/foundation-reference` | Every token and primitive rendered live |
| `examples/gradient-showcase` | The gradient library and its usage rules |
| `examples/brand-deck`, `-editorial`, `-product`, `-specimen` | The presentation system |
| `examples/zha-app-vanilla` | Ring 1, plain HTML |
| `examples/zha-app-react` | Ring 2, React + Vite (runs from source; not browsable statically) |
| `skills/zha-ui/` | The agent skill: `SKILL.md` and `reference.md` |

## How-to

One line per workflow a colleague runs, each linked to its note.

- Set up a ZHA app on zha-ui (Ring 1 or Ring 2, and the `<html>` attributes):
  [`docs/how-to-set-up-a-zha-app.md`](docs/how-to-set-up-a-zha-app.md).
- Build with the skill: [`skills/zha-ui/SKILL.md`](./skills/zha-ui/SKILL.md) and
  [`skills/zha-ui/reference.md`](./skills/zha-ui/reference.md).
- Install and consume the package: the consumer guide in [`README.md`](./README.md), under
  For developers.

## Suite conventions

This repo follows the ES rules in the hub's
[`RULES.md`](https://github.com/GitZHACODE/zh-es-hub/blob/main/RULES.md). It is the company-wide
design system rather than one ES tool, so it has no tool colour of its own; its packages are
`UNLICENSED` (internal use) and the repo carries no `LICENSE` file.

## Working style

This is how to work in this repo.

- Tasks are goals with acceptance criteria; the gates are under Run and verify.
- Specs in `docs/specs/`, plans in `.plans/`, `PLAN.md` and the auto-memory answer most questions;
  one tight question only when they do not.
- Commit completed work on a branch as one logical commit per task, `type(scope): what changed`.

## Work queue

`PLAN.md` holds `## Planned`, `## In progress` and `## Done`. At session start, run `git pull`,
read it, and work the top Planned item unless told otherwise. Move the item to In progress when you
start and to Done with a `YYYY-MM-DD` prefix when it ships, in the same commit as the work where
possible; Done is append-only history, never rewritten. If direction changes mid-session, reorder,
add or remove Planned bullets before continuing. Follow-up work is one new bullet at the bottom of
Planned, or at the top only when told it is urgent: one line, one session-sized item, technical
framing only, no client names. Inline `# TODO` comments are for sub-item granularity only.
Reference GitHub issues as `Refs #n` in commits, never auto-closing keywords (`Fixes` or
`Closes`). Design specs go to `docs/specs/` with a one-line `Status:` at the top; implementation
plans go to `.plans/`, which is git-ignored.
