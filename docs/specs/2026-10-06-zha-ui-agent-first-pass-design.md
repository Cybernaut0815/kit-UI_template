# zha-ui - Agent-first pass (brand meshes, hero alignment, open items, skill) design

**Status:** Implemented 2026-10-06 on feat/composition-layer, released as 0.1.3 (see Spec 3 §14); render-verified per §7 · **Date:** 2026-10-06 · **Author:** Aleksander Mastalski
**Builds on:** Spec 3 (composition layer, 2026-09-30, implemented 2026-10-01) and its fix-later pass (2026-10-02). The branch tip is `ca82c5a`, 47 commits past `main`, not pushed.
**Evaluation base:** four read-only audits run on 2026-10-06 at Aleksander's request: the open-items audit over the plans, specs, research note, tickets and ledgers; the hero and showcase mapping; the quick-start surface mapping; and a web check of the Agent Skills standard and the three agent CLIs.

---

## 1. Purpose

A developer should be able to hand ZHA UI to Claude Code, Codex CLI or Gemini CLI with one command or one pasted paragraph and get on-brand pages without touching CSS. That route does not exist today: the README tells people to paste a 233-line file into a chat, the agent guidance points at a `<pages-host>` that will never exist for a private repo, and nothing ships in the Agent Skills format the three CLIs now read natively. This spec adds that route and closes three smaller gaps on the same branch before the 0.1.3 PR: the gradient library shows only CSS approximations of the brand meshes and not the graphic design team's originals; the hub hero's text sits 32 px from the viewport edge while every section below it sits at the container edge; and fifteen items from the June to October reviews are still open.

## 2. Decisions

Aleksander took these on 2026-10-06 in the brainstorm that preceded this spec:

1. Every in-repo open item ships in this pass (fourteen of the fifteen). The detector lint over the examples, which the research note recommended and Spec 3 deferred to "the next spec", is too large for a batch task and goes on PLAN.md's Planned list for its own spec.
2. The two ports the October plans used for render-verify servers, 7171 (dev) and 7172 (preview), are recorded in the machine-wide register `zh-es-hub/PORTS.md` rather than erased from the plans.
3. `AI-USAGE.md` moves into the skill as `skills/zha-ui/reference.md`; the root file is not kept, and every link to it is repointed. One copy of the vocabulary.
4. The brand meshes get their own section on the showcase, placed first, with each original's CSS twin at its side; the existing hero-mesh section stays as it is.
5. The hero fix is a package CSS change (one rule), not hub markup, so any landing page built from the skeleton gets it.

## 3. Brand meshes on the gradient showcase

The graphic design team keeps four meshes on the brand assets share, `\\zaha-hadid.com\Data\Projects\__Z_H_A__Brand_Assets\BRAND ASSETS\ZHA_Colour\ZHA_Gradients`: `ZHA Gradient mesh backgrounds-01.png`, `-02`, `-04` and `-05` (the numbering skips 03), each 3991 x 2245 px and 0.6 to 0.8 MB, dated 29 September 2025. They map one-to-one onto the CSS hero meshes: 01 (plum to rust) is `.grad-hero-ember`, 02 (teal to royal blue) is `.grad-hero-ocean`, 04 (magenta arc on charcoal with an amber edge) is `.grad-hero-violet`, 05 (indigo to gold) is `.grad-hero-dusk`.

The repo takes a 1600 x 900 WebP copy of each at quality 90, which I measured at 11 to 13 KB per file through Chromium's canvas encoder (a lossless PNG at the same size is 200 to 300 KB, because the Windows PNG encoder does not compress smooth gradients well). The copies live in `examples/gradient-showcase/assets/` with a README naming the share path, the file date and the encoding so anyone can re-encode when the team updates the originals. `.gitattributes` marks `*.webp` binary, as it does the fonts. The originals stay on the share.

The showcase page gets a new first section after its intro paragraph, "Source material - the graphic design team's gradient meshes": one sentence on provenance, then a grid of four `<figure>` elements. Each figure is the image at two thirds of the width with its CSS twin as a swatch at one third, the same height, and a caption giving the original filename and the twin's class. The `<img>` carries `width`, `height` and an `alt` that names the colours. The showcase's drift guard checks classes and tokens, not images, so the page passes as it is.

## 4. Hero alignment

`.container` places its edge at `max(var(--gutter), (100% - var(--container-w)) / 2)` from the viewport, through `inline-size: min(100% - 2 * var(--gutter), var(--container-w))` and auto margins. `.hero--bleed` gets the same expression as its `padding-inline`, with `--container-w: 72rem` declared on it so the expression resolves outside a container; a page that narrows its column sets the same knob on both. Two follow-on edits keep it true at phone width: the 768 px rule that sets `.hero { padding: var(--space-10) var(--space-5) }` splits into `padding-block` for every hero and `padding-inline` for `.hero:where(:not(.hero--bleed))` only, and the 640 px block that drops `.container`'s gutter to `--space-4` does the same for `.hero--bleed` in a separate rule (the existing `.container` rule is pinned verbatim by a test and stays untouched).

`.hero--bleed` is new in 0.1.3, so no consumer sees a departure. The hub keeps its markup: the children stay direct children of the hero, so `.hero > h1` and `.hero > p` still apply. A render check measures the hero eyebrow's left edge against `main.container`'s at 1440 and 390 px; they must be equal.

## 5. Open items

The 2 October pass closed all nineteen minors and both Importants from the 1 October review and deferred nothing. The open-items audit found fifteen older or chat-handed items, verified each against `ca82c5a`, and this pass closes fourteen of them:

| # | Item | Fix |
|---|---|---|
| 1 | The pressed-arm order test (`exports.test.ts:488`) finds the selector text in a comment at `base.css:54`, not the rule | `css.search()` with a line-anchored regex for the real rule, `^.btn.is-active:hover, .btn:where([aria-pressed="true"]):hover` |
| 2 | No test reaches the colour scan's `<script>` skip (`_drift-guard.mjs:123`) | A node:test case: `<script>el.style = "color: red"</script>` reports no colour |
| 3 | `.chip__remove:hover` is bare and `.chip__remove` is missing from the disabled list | `:where(:not(:disabled))` on the hover; `.chip__remove:disabled` joins the one disabled rule |
| 4 | `<a class="btn" aria-disabled="true">` still hovers and looks enabled | `.btn[aria-disabled="true"], .icon-btn[aria-disabled="true"]` take the disabled value plus `pointer-events: none`, the `.pagination` precedent |
| 5 | `--focus-ring` is deprecated in AI-USAGE.md but a bare name in llms.txt | The llms format appends `(deprecated: the package paints focus as an outline; kept for consumers that referenced it)` from a one-entry map in the format; the tokens test pins the suffix |
| 7 | The translucent app bar ignores `prefers-reduced-transparency` | `@media (prefers-reduced-transparency: reduce) { .app-bar { background: var(--bg-surface-1); backdrop-filter: none } }` |
| 8 | Windows high-contrast mode erases the sidebar's current-page bar and the badge dot | `@media (forced-colors: active)` rules with `forced-color-adjust: none` and the system colours `Highlight` (bar) and `CanvasText` (dot) |
| 9 | No skip link | `.skip-link` in nav.css: absolutely positioned at the top start, `--z-toast`, surface-1 with `--shadow-mid`, and the `.sr-only` recipe under `:not(:focus-visible)`; the hub, the vanilla starter and the React starter get `<a class="skip-link" href="#main">Skip to content</a>` as the first element and `id="main"` on `<main>`; the skill's skeletons and rules carry it |
| 10 | The React starter has no drift guard | `_drift-guard.mjs` exports `jsxToMarkup()` (className and template literals to `class=""`, dropping `-`-suffixed prefixes; `style={{ '--knob': 'v' }}` to `style=""`) and `run()` takes a `transform`; `examples/zha-app-react/check.mjs` runs before `vite build` with classes checked and inline styles knobs-only |
| 11 | Eleven negative CSS tests extract a block with `?.[0] ?? ''`, so a missing block passes | A `block(css, re)` helper that fails the test when the block is missing |
| 12 | Foundation reference: three unlabelled `<progress>` demos, four alerts without a role | `aria-label` on each progress; `role="status"` on success, warning and info, `role="alert"` on error |
| 13 | Three deck slides still use colour primitives, one at 4.48:1 | Per ticket 2026-07-10 P4-1 and P4-3: `--text-muted` inside the editorial light plate, `--accent-on` on the product and brand deck buttons (the brand deck's `.mini--work` keeps its primitive route (`--accent-on` has one value in the bundle, so no `data-theme` is needed)) |
| 14 | Stale status lines: PLAN.md still has the 0.1.2 train in progress, the July ticket says nothing is implemented, the viz spec says both implemented and not | PLAN.md moves 0.1.2 to Done and puts the 0.1.3 train in progress; the ticket and the spec headers state what shipped and when |
| 15 | Ports 7171 and 7172 are used by two plans but blank in the register | Decision 2: the zha-ui row in `zh-es-hub/PORTS.md` records them as render-verify ports |

Item 6, the detector lint, becomes a PLAN.md Planned bullet. The audit also listed items that stay parked with their stated triggers (hover gating on `(hover: hover)`, animated theme switching, the `--fs-body` retune, ZHA Sans on `.stat__value`, the Neue Haas Unica licence) and two it could not settle (the theme-toggle flash from the research note, and whether the dataviz validator ever ran over the built oklch cascade); none of those is in scope.

## 6. Agent quick start

Claude Code (since 2025-10-16), Codex CLI (`.agents/skills`, native since 2026-02) and Gemini CLI (on by default since v0.25.0, 2026-01-20) all read the Agent Skills `SKILL.md` format, and they choose a skill from its `description` without the user naming it. The `npx skills add <owner>/<repo>` CLI (vercel-labs/skills) discovers `skills/<name>/SKILL.md` in a repo, installs it into `.claude/skills` and `.agents/skills` for the targeted agents, and works on a private repo through the developer's git credentials. No agent discovers a skill inside `node_modules`, so the skill is not shipped in the npm package.

The skill is one canonical folder, `skills/zha-ui/`:

- `SKILL.md` (frontmatter `name: zha-ui`, a description that names the trigger "any ZHA project that needs UI, styling, layout, colour, type or a page skeleton"; under 300 lines, since it carries the sections AGENTS.md gives up): install and load once (git-URL dependency; `import` for bundled apps, a `<link>` to `node_modules/@gitzhacode/zha-ui-css/dist/index.css` for plain HTML), the four switches, the one hard rule and the nine knobs, the three page skeletons (app, tool, landing, each with the skip link), the slugged rules, the before-you-ship checklist, the naming and type rules, and a last setup step that writes one line into the consuming project's own AGENTS.md or CLAUDE.md so later sessions keep using the skill.
- `reference.md`: today's AI-USAGE.md, moved with `git mv` so its history survives, with the `.hero--bleed`, `.skip-link`, `.btn` (aria-disabled) and `.chip__remove` rows updated by the earlier tasks.

AGENTS.md shrinks to what is specific to working in this repo (the model note, the hard rule in brief, the setup rings, the switches, a pointer to the skill for primitives, skeletons, rules, checklist and type rules, the examples list, the work protocol), so the rules exist once. Its `<pages-host>` Ring 1 link is replaced by the `node_modules` link, as is the same placeholder in the vanilla starter's head comment. DESIGN.md and the llms.txt format string point at the skill; a vitest in `packages/css/test/skill.test.ts` pins the frontmatter, that the repo holds exactly one `SKILL.md`, and that every class in the generated `classes.txt` appears in `reference.md`, so the cheat-sheet can no longer go stale silently.

The README opens its quick start with the agent route: the one command, what it does, and a paragraph to paste for anyone who would rather not run it (the paragraph tells the agent to run the command itself and follow the installed skill). The hand route follows with the same install and the `node_modules` link. The examples hub's Starters section gains a first card with the same command and paragraph.

## 7. Tie-up and verification

The changeset gains bullets for the skip link, the aligned bleed hero, `aria-disabled` controls, reduced transparency, forced colours, the chip-remove guard, the llms deprecation note and the skill; the 0.1.3 consumer notes add the skip link under "What to add" and replace the AI-USAGE.md pointer with the skill and its install command; Spec 3 gets a dated §13 amendments section; PLAN.md records the pass. The render-verify covers the hub at 1440 and 390 px in light and dark (hero edge measured against the container edge, the skip link shown on Tab), the showcase section, the foundation reference under forced-colours emulation (current-page bar and badge dot visible), and the three deck slides, with captures under `.playwright-mcp/verify-agent-first/`. Every task's gate is `pnpm build`, `pnpm test` and `pnpm lint` green. A whole-branch review on the most capable model closes the pass; the 0.1.3 review artifact is rebuilt afterwards.

## 8. Out of scope

The detector lint (item 6) waits for its own spec. The release itself, and sending the 0.1.3 consumer notes, remain the maintainer's actions after the PR.
