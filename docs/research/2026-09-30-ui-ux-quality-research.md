# zha-ui - UI/UX quality research: what stops an agent building a ZHA-grade page

A four-agent research swarm and a browser render pass gathered this evidence on 2026-09-30, at Aleksander's request that the system deliver UI, UX and layout "fitting the ZHA name"; the spec that follows cites it.

---

## 1. Headline

The system enforces colour and brand vocabulary well and ships no composition layer at all. An agent
given AGENTS.md today knows which classes and variables it may use and nothing about how to build a
page with them: there is no container, grid, stack or section rhythm in the CSS, no element
typography (h1-h4, p, a and body are unstyled), no rule for hierarchy, motion, copy or forms, and no
pre-delivery check. Every example in the repo hand-rolls its layout with inline styles (56 style
attributes in the vanilla starter, 107 in the foundation reference, 40 in the React starter), and the
examples hub tells builders to copy that pattern. The brand deck renders unmistakably ZHA; the app
starters render as a competent generic dashboard, because none of the brand deck's language exists as a primitive.

The work that closes the gap is three layers, in order of expected effect: a **composition layer** in the CSS
package (layout primitives, element typography, interaction states, responsive behaviour), a **taste
layer** in the guidance (hierarchy, motion, copy, forms, named anti-patterns adapted to ZHA's register),
and a **gate** (a pre-delivery checklist plus a deterministic lint over example pages). More colour and
gradient work would not move delivered quality; the palette is already the strongest part.

## 2. Method

I read the full guidance layer (AGENTS.md, AGENTS_FABLE.md, AI-USAGE.md, DESIGN.md, README.md, the
stack spec, both consumer tickets, the 2026-06-23 research), the shipped CSS and tokens, and rendered
the hub, vanilla starter, foundation reference, gradient showcase and brand deck in Chromium at 1440
and 390 px (screenshots are session-local under `.playwright-mcp/shots/`, which is gitignored). Four
agents ran in parallel: a study of Emil Kowalski's `apple-design` skill and its siblings; a survey of
the most-starred GitHub resources for AI-driven UI/UX design; an inventory of the design skills already
installed on this machine; and a read-only audit of the repo against layout and UX quality. I verified
the audit's sharpest claims directly before relying on them (section 4).

## 3. Render pass

The vanilla starter (`examples/zha-app-vanilla`) at 1440 px reads as a tidy generic dashboard: a black
hero panel, four stat tiles, a form card, four alerts, four brand cards. Two defects show at a glance.
The alert title is an inline span, so "Simulation complete" runs straight into its body text
(`packages/css/src/primitives/feedback.css:5` sets weight and margin but not `display`). The alert
icons are text glyphs (✓ ⚠ ✕ ℹ, `index.html:85-88`) against the stroke-SVG rule in AGENTS.md. At
390 px the app bar breaks: the "All examples" back link collides with the lockup and the nav does not
collapse; the rest of the page survives only because its grids are inline `auto-fit` rules.

The hub (`examples/index.html`) looks better thanks to the dusk hero mesh, and it carries a live bug:
its tagline uses `--fs-h1`, a token that does not exist, so the `font` shorthand is invalid and the
line renders at browser defaults (`index.html:35`). Neither the hub nor the foundation reference has a
`check.mjs`, so the drift guard never saw it.

The brand deck (`examples/brand-deck`) is the one artefact that looks like ZHA: black field, flowing
line art, ZHA Sans display at deck scale, one teal eyebrow. Nothing of that language exists as a
reusable primitive for app or landing pages.

## 4. Ranked gaps (audit, verified)

The audit agent ranked fifteen gaps; I re-checked the claims that decide priorities. All held: zero
`:active` rules in `packages/css/src`; no hover on `.btn--primary` or `.btn--danger`; zero element
rules in `dist/index.css`; `--fs-h1` absent from the tokens; the brand reference restricting ZHA Sans.

1. **No base typography layer.** h1-h6, p, body and a are unstyled; every heading in every example is
   a five-declaration inline style, and the primitives that style their own headings disagree with
   each other (`.page-header__title` display tracking, `.dialog__title` label tracking, `.alert__title`
   weight 600). An agent invents a heading system per page and gets it different each time.
2. **App-only type scale.** 11/12/13/14/16/24/32 px with nothing between 16 and 24 and `--fs-hero`
   capped at 32 px (`packages/tokens/src/primitive/scale.tokens.json`). The decks abandon it for
   `clamp()` values of their own. The 2026-06-21 audit already called the body-13 scale cramped.
3. **`--leading-body: 1.2` is the brand book's print value**, not a screen paragraph value; both decks
   override to 1.5. There is no measure token; examples hand-roll 30ch to 46rem.
4. **Zero layout composition primitives.** `layout.css` is 23 lines: app shell, app bar, divider.
   Both starters hand-roll `max-width: 64rem; margin: 0 auto` and every grid inline.
5. **Not responsive.** One media query in the package (hiding the app name at 640 px). `.app-shell`
   stays `240px 1fr` on phones; `.page-header` does not wrap; `.data-table` forces `nowrap` on every
   cell with no scroll wrapper; no breakpoint tokens.
6. **Interaction states are thin.** No pressed state anywhere; no hover on the primary and danger
   buttons; `.btn` transitions only `background`; the promised `.45` disabled opacity ships on three
   primitives only.
7. **Global focus ring is buggy.** `:focus-visible` sets `border-radius: var(--radius-m)` and a
   box-shadow ring, so it reshapes pills, overrides the segmented thumb and the card lift while
   focused, and is clipped by `.accordion { overflow: hidden }`. An outline with offset fixes all four.
8. **Guidance covers vocabulary only.** AGENTS.md, DESIGN.md and AI-USAGE.md list what exists and say
   nothing on page anatomy, hierarchy, whitespace, action placement, state coverage, forms, mobile or
   a pre-ship check. `llms.txt` lists bare token names without values or roles.
9. **The heading face rule contradicts itself.** The brand reference (`docs/zha-brand-reference.md`,
   type-in-use rules) says headers are Neue Haas Unica and ZHA Sans is restricted to the logo, short
   editorial headers, dividers and large display numerals, "never on the same surface as Neue Haas
   Unica". AGENTS.md says ZHA Sans "sets display headings". The examples put ZHA Sans on 14 px card
   headings. Agents copy the examples.
10. **Spacing has no semantic tier.** Only the 4 px scale; section rhythm differs per page; `.btn`,
    `.chip` and `.input` use literal 6/8/10/12/16 px instead of tokens.
11. **Examples skip their own primitives.** Neither starter uses `.app-shell`, `.sidebar`,
    `.page-header`, `.data-table`, `.tabs`, `.dialog` or `.menu`; the vanilla form uses a
    placeholder-as-label instead of `.field`. The React starter is the vanilla page transliterated
    to style objects and teaches nothing about routing, layout or component boundaries.
12. **Motion has no exit, theme-change, toast or indeterminate loading**; `.view-fade` is entrance
    only; the theme toggle flashes.
13. **Accessibility beyond colour is under-specified**: no skip link, no landmark guidance, forced
    colours drop the sidebar current-page bar and the badge dot, no `font-synthesis: none` so a stray
    `<strong>` faux-bolds ZHA Sans.
14. **Data-table gaps**: no wrapping mode, no row selection state, no `aria-sort` indicator although
    sort buttons are now blessed.
15. **Minor debt**: two `@media print` blocks in `base.css`; `.app-bar__brand` still carries the ZHA
    Sans fallback the 2026-07-16 triage said to remove.

What is already strong, and must not be disturbed: the four-axis token architecture with oklch plus
hex fallback and the contrast gate; border-first depth, tight radii, translucent chrome and the
150/200/300 motion tokens, which landed the 2026-06-23 research cues faithfully; the native-element
strategy (`<dialog>`, `[popover]`, `<details>`, radio-driven `.segmented`); the app-bar recipe, which
is the one place the docs teach composition and shows the right shape; and the evidence-driven consumer
feedback loop.

## 5. External research

### 5.1 The apple-design skill (Emil Kowalski)

The apple-design skill transfers its motion contract and never-ship list, and conflicts with ZHA on five points.
`emilkowalski/skills` had 42.4k stars on 2026-09-30; `apple-design/SKILL.md` is a single 290-line
file rebuilt on 2026-07-09 around Apple's eight WWDC 2026 principles. Its structure is the lesson: an
initial-response gate, one through-line paragraph, seventeen numbered sections that each pair a WWDC
quote with three to six rules and a code snippet, and a closing Quick Reference table of need,
technique and concrete value. Every rule carries a one-clause reason. The sibling skills add a
frequency gate for motion (100+ uses a day means no animation), an easing map (ease-out for enters,
never ease-in on UI), duration bands (press 100-160 ms, tooltip 125-200, dropdown 150-250, modal
200-500, everything under 300 ms), and a mandatory "Never Ship" table.

Transfers directly: a per-primitive motion contract with numbers, the never-ship list (no
`transition: all`, no ease-in, no `scale(0)`, transform and opacity only, hover gated on
`(hover: hover) and (pointer: fine)`), the three accessibility media queries including
`prefers-reduced-transparency` for the translucent app bar, size-specific tracking with inverse
leading, the four feedback kinds, a wayfinding checklist, specific labels over safe ones, and
confirmation dialogs only for irreversible actions.

Conflicts with ZHA's register and should not be adopted: scroll-edge fades instead of hairlines
(DESIGN.md's border-first rule stands, with Atlassian and Linear behind it); light translucent glass
as hierarchy; "emphasise with weight" (ZHA Sans is regular only, so hierarchy must come from size,
text intensity, tracking and space); the system-font default; bounce, rubber-banding and haptics.
Emil Kowalski's cohesion rule ("a professional dashboard should be crisp and fast") supports ZHA's position.

### 5.2 Landscape survey

Stars are the GitHub API figures the survey agent recorded on 2026-09-30.

| Resource | Stars | What it ships | What transfers |
|---|---|---|---|
| Vercel `design.md` + `vercel-brand.css` | n/a | prose file documenting a class API so "the agent never reads the stylesheet"; eval loop | the architecture zha-ui already has, done at scale; "give every gap one owner"; a "reject generated-design reflexes" section; encode each corrected mistake as a rule |
| pbakaus/impeccable | 73.0k | 24 commands, 61 deterministic detector rules, CLI | detector list as a lint seed (nested cards, mixed radii, grey on colour, pulsing dots, bounce easing, competing hierarchy); audit / critique / polish split |
| anthropics/skills `frontend-design` | 179k (repo) | SKILL.md Claude Code already loads | five named "slop clusters"; "spend your boldness in one place"; plan, review against brief, build, critique |
| vercel-labs/web-interface-guidelines | 912 (+31.8k agent-skills) | 100+ review rules, `file:line` output | the best ready-made review gate once Tailwind names are rewritten to primitives |
| google-labs-code/design.md | 28.2k | Stitch spec plus CLI (`lint`, `diff`, `export`) | YAML front-matter tokens and eight fixed sections; generate from the token package; lint in CI |
| VoltAgent/awesome-design-md | 119k | 73 brand DESIGN.md files with preview pages | section template; paired preview convention |
| nextlevelbuilder/ui-ux-pro-max-skill | 132k | CSV databases plus a BM25 search script | the 98 UX guideline rows; the styles taxonomy does not fit a single brand |
| Leonxlnx/taste-skill | 91.5k | 13 skills with three 1-10 dials | variance, motion and density dials as a one-line brief parameter |
| ibelick/ui-skills | 9.3k | terse imperative rules naming classes | the rule format ("use `.x` for y") |
| shadcn-ui/ui, tweakcn, magicui, motion-primitives, magic-mcp | 6k-125k | React and Tailwind components | only the `*-foreground` token pairing and MCP or llms.txt delivery |

Eight principles appear in three or more sources: named anti-patterns beat adjectives; exact tokens
plus prose rationale in one file the agent reads before building; restraint (one focal element, colour
only for meaning); a plan, build, critique loop; motion discipline (ease-out enters, transform and
opacity only, reduced motion honoured, one orchestrated moment rather than per-section fades);
typography tells (one or two families, no tracked all-caps eyebrows, sentence case, tabular numerals);
an accessibility floor as a hard gate; one spacing and radius scale with a single owner per gap.
Every top-starred skill is stack-neutral; the React and Tailwind repos contribute least.

### 5.3 Installed skills

The `ui-ux-pro-max` plugin, Anthropic's `frontend-design`, the bundled `artifact-design` and `dataviz`
are already on this machine. The useful material is the rule content, not the machinery: the 98
slugged UX rules with severity and do/don't pairs ("one primary CTA per screen", "desktop 60-75
characters per line", "exit shorter than enter", "animate one or two elements per view"), the
frontend-design tells and the artifact-design composition rules ("apply border, fill, radius and
shadow by role", "use layout for spacing, not per-element margins", "encode state in form as well as
number", "name the page like a product"). The CSV-and-search machinery, the 84-style taxonomy and the
palette and font databases do not fit a single-brand system with a closed token set; `llms.txt` is
already the queryable surface. The dataviz `validate_palette.js` is worth running over the chart
tokens per theme to close the oklch blind spot recorded in memory.

## 6. Adapting the consensus to ZHA

Several of the field's anti-patterns are ZHA's identity, so the anti-pattern list must be rewritten
rather than copied. Blessed here: black-first surfaces, hairline dividers, the gradient wardrobe on
hero and identity surfaces, one accent plus intent hues, mono uppercase eyebrows used sparingly on
brand surfaces. Banned here, in line with the field: an eyebrow above every heading, an arrow appended
to every link, 01/02/03 numbering without a sequence, everything centred, the same radius and shadow on
every block, identical rounded cards chopping a dashboard, emoji or solid-glyph icons, gradients on
work-surface headings, weight or italics on ZHA Sans, `Inter` treated as a design choice rather than a
fallback.

## 7. Candidate directions

**A. Composition layer first (recommended).** Add to the CSS package the ~150 lines that every page
needs: `body`, `h1-h4`, `p`, `a` defaults and a `.prose` block; `.container`, `.stack`, `.cluster`,
`.grid`, `.section`, `.toolbar`, `.form-grid`; a fluid display step; hover, active and disabled on
every control; an outline-based focus ring; app-shell and table behaviour at phone width. Rewrite
the guidance around it: a "Compose a page" section with three recipes (dashboard, form page,
landing), a slugged rule list (hierarchy, motion, copy, forms), the ZHA-adapted anti-pattern list, and
a ten-line pre-delivery checklist. Rebuild the React starter as a real app-shell dashboard and fix the
vanilla one. Cost: one spec, roughly two to three sessions. Risk: element defaults are a deliberate
break from the class-only contract and need a decision (section 8).

**B. Guidance-only.** Leave the CSS as is and write the taste layer, the recipes and the checklist.
Cheapest, but every recipe would still teach inline-style layout, so the examples and consumer apps
stay hand-rolled and inconsistent. I would not stop here.

**C. Jump to the React layer.** Build `@gitzhacode/zha-ui-react` on a headless substrate and put the
composition into components. This is the Phase 3 bet the stack spec deferred; it leaves Ring 1 (plain
HTML, the non-coder ring) exactly as weak as today, and the 2026-06-21 review already flagged it as an
over-engineering risk for a near-solo maintainer. Not before A.

A then a lint pass (the impeccable detector idea, run over `examples/` in CI) is the sequence I
recommend. The gate for A is the same as every phase here: build, test and lint green, contrast gate
green, and a browser render-verify of the three starters at 1440 and 390 px in light, dark and brand.

## 8. Decisions only Aleksander can make

Aleksander has to make these decisions before the spec; my recommendation follows each.

1. **Heading face.** Neue Haas Unica (or Inter) for all in-app headings per the brand book, with ZHA
   Sans reserved for the lockup, hero display and large numerals; or keep ZHA Sans on display-size
   headings as AGENTS.md says today. My recommendation is the brand book: ZHA Sans at 24 px and
   above only, and never beside Neue Haas Unica on the same surface.
2. **Element defaults.** Ship `body`, `h1-h4`, `p` and `a` defaults from the package (a break from
   class-only, opt-out impossible), or keep class-only with `.prose` as the opt-in. I recommend
   shipping defaults; the consumer tickets show that unstyled elements are what agents hand-roll first.
3. **Body leading.** Keep `--leading-body: 1.2` as a locked brand value and add `--leading-prose: 1.5`
   beside it, or retune body to 1.4-1.5. I recommend adding the prose token and leaving 1.2 for
   controls and dense tables.
4. **Mobile policy.** Are ZHA tools desktop-first by policy (analysis apps on workstations), so that
   phone behaviour is a graceful degrade, or must `.app-shell` and `.data-table` work at 390 px? This
   decides whether responsiveness is P1 or P3. I recommend graceful degrade for internal tools and a
   hard requirement for public-facing pages, which the stack spec already separates.
5. **Layout utilities in the CSS package.** Yes, as the composition layer above, or no, leaving layout
   to the React layer. I recommend yes; Ring 1 has no other route to a good page.

## 9. References

- `emilkowalski/skills` - https://github.com/emilkowalski/skills - `skills/apple-design/SKILL.md`,
  `skills/animate/RECIPES.md`, `skills/review-animations/STANDARDS.md`, `skills/mobile-native/SKILL.md`
- Vercel design.md - https://vercel.com/design.md - stylesheet https://vercel.com/geist/vercel-brand.css -
  blog https://vercel.com/blog/how-our-agents-build-on-brand-pages-with-design-md
- pbakaus/impeccable - https://github.com/pbakaus/impeccable
- anthropics/skills frontend-design - https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- vercel-labs/web-interface-guidelines - https://github.com/vercel-labs/web-interface-guidelines -
  agent-skills https://github.com/vercel-labs/agent-skills
- google-labs-code/design.md - https://github.com/google-labs-code/design.md
- VoltAgent/awesome-design-md - https://github.com/VoltAgent/awesome-design-md -
  official index https://github.com/VoltAgent/official-design-md
- nextlevelbuilder/ui-ux-pro-max-skill - https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Leonxlnx/taste-skill - https://github.com/Leonxlnx/taste-skill
- ibelick/ui-skills - https://github.com/ibelick/ui-skills
- nexu-io/open-design - https://github.com/nexu-io/open-design - Railly/tinte - https://github.com/Railly/tinte
- bergside/awesome-design-skills - https://github.com/bergside/awesome-design-skills
- Prior research and specs in this repo: `docs/research/2026-06-23-ui-foundations-research.md`,
  `docs/specs/2026-06-21-zha-ui-app-stack-standard-design.md`,
  `docs/specs/2026-06-24-zha-ui-primitive-layer-design.md`,
  `docs/tickets/2026-07-16-consumer-feedback-triage.md`, `docs/zha-brand-reference.md`
