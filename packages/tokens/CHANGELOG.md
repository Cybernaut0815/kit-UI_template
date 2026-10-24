# @gitzhacode/zha-ui-tokens

## 0.2.0

### Minor Changes

- 2108459: `zha-app`, the firm brand, is now the default that `:root` renders when `data-brand` is absent. Its accent is ink on light and white on dark and brand surfaces, its secondary accent is Dark Gray, and its lockup carries no team letters. Apps that relied on the unset default must set `data-brand="es"` (or their team); without it they now render the firm look.

  Token changes a consumer can see:

  - `--accent-on` is now per theme instead of one value for all themes.
  - `--accent-hover` is new. It is the primary button's hover fill, and the skill's reference now lists it. Team brands keep the former `color-mix` formula through it.
  - `--accent-2` defaults to Dark Gray instead of magenta. ES still declares magenta. The six provisional teams declare no `accent.2`, so their `.accent-grad*` and `--brand-grad*` now end in Dark Gray instead of magenta.
  - `[data-brand="zha-app"]` is a name-only block: it sets `--brand-name` and no accent, so the theme and surface accents apply.
  - Every `[data-brand]` block now also applies inside `data-theme` and `data-surface` islands beneath it. Before 0.2.0, a brand hero or a dark panel on a team page silently showed the default accent for every team.
  - The accent-derived gradient tokens (`--brand-grad*`, `--grad-wash`, `--grad-glow`, `--focus-ring`) are re-declared in every theme, surface and team brand block, so an island's gradients resolve against the island's own accent.

  Body links are now underlined by default, not only on hover: with a neutral accent, colour alone no longer marks a link. Components that are links (buttons, cards, the lockup, navigation) are unchanged.

  A panel `.hero` (not `.hero--bleed`) that opens its `.container` now keeps one gutter of space above it, so it no longer sits flush under the app bar. The full-width bleed hero is unchanged.

  The lockup has a firm form: `ZHA` alone, with `aria-label="ZHA, home"`. The starters use it; the examples hub keeps its `ZHA UI` team form.

  The `zha-ui` skill is now tool-neutral and declares `compatibility` in its frontmatter, so Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, Antigravity, Windsurf and the other tools the `skills` CLI supports read the same copy (`.claude/skills/` for Claude Code, `.agents/skills/` for most others). A new "Restyle an existing app" section gives the order for moving an older app onto zha-ui.

  A consumer preflight, `scripts/preflight.mjs` (run from a checkout of this repository), checks that Git can read the repository and prints one line: an ok line with the commit sha, or the failure and the fix. The same one-line check is in the skill and the README, and the README has a new "Try an unreleased build in your app" sequence for installing local tarballs.

## 0.1.4

### Patch Changes

- cb3dcae: The README's pin line names the tag form, `#css-v<version>`, with 0.1.4 as the example; the copy shipped in 0.1.3 still pointed at `#css-v0.1.2`. No CSS or token changes.

## 0.1.3

### Patch Changes

- ae6307b: This release (0.1.3) has breaking changes: `.card` gains default padding, `box-sizing: border-box` becomes the default, the focus ring becomes an outline, `.app-bar__app` takes line-height 1.3, and the element defaults reset UA margins, size `h1`-`h4` and colour links. It also adds the composition layer (Spec 3, 2026-09-30) and the 2026-10-02 fix-later pass:

  - **Tokens:** `--fs-h1` (20px), `--fs-hero-xl` (fluid 40-72px), `--fs-reading` (16px), `--leading-heading` (1.15), `--leading-prose` (1.5), `--measure` (65ch), the rhythm tiers `--space-section` / `--space-block` / `--space-inline` (48/24/12px, compact 32/16/8), `--gutter`, `--z-sticky`, `--z-toast`. `llms.txt` now carries values for every non-colour token (colour, shadow, focus-ring and gradient tokens stay name-only), adds the space/radius groups and points at the generated `classes.txt`.
  - **Element defaults** (`type.css`, all `:where()` so any consumer rule wins): body, h1-h6 (primary face, weight 500; h5 and h6 take the shared colour and weight at `1em`, the size ladder stops at h4), p, a, strong, code, pre, hr, img; `box-sizing: border-box`; `[hidden]` always hides. `.prose` for running text, `.text-muted`.
  - **Composition primitives:** `.container` (`--container-w`), `.stack` (`--stack-gap`, `--tight/--loose`), `.cluster` (`--between/--end`), `.grid` (`--grid-min`), `.section`, `.split` (`--split-aside`, `--aside-start`), `.toolbar`, `.divider--vertical`, `.form-grid` + `.field--span`, `.table-wrap` + `.data-table--wrap`, `.eyebrow`, `.hero` (+ `--bleed`). The knobs are scoped to the element they are set on, so a nested `.stack` sets its own gap.
  - **States:** hover on `.btn--primary`/`--danger`, a pressed state and one disabled value on every control, input hover, chip hover, accordion hover, selected table rows, and `aria-sort` chevrons (`ascending` and `descending` only; `none` and `other` paint nothing). **Focus ring is now an outline** (`2px solid var(--accent-fill)`, offset 2px; `.accordion summary` insets it by 2px because the accordion clips overflow); `--focus-ring` is deprecated but still defined.
  - **Feedback:** `.alert__title` is a block (it used to run into the body text); `.toast`; `.spinner` (keeps turning under reduced motion).
  - **Phone width:** the app shell collapses at 768px with an off-canvas sidebar behind `data-nav-open` (the drawer is `var(--sidebar-w, 240px)` wide); `.split` stacks at 1024px; the gutter and app-bar gap tighten at 640px.
  - **Breaking for consumers:** `.card` now has default padding (`--space-5`; add `.card--flush` or delete your own padding); `box-sizing: border-box` is the default; the focus ring is an outline; `.app-bar__app` line-height 1.3 (descenders were clipped); element defaults reset the UA margins on headings, `p`, lists, `blockquote`, `figure` and `pre` to 0 (spacing now comes from `.stack` or `.prose`), size `h1`-`h4` and colour links (`--accent-fill`, underline on hover), so any page that leaned on the browser defaults sees the change.
  - **Fix-later pass (2026-10-02):** `.app-bar__nav-toggle` (the phone drawer's button, visible at 768px and below only); hovers skip disabled controls; the sort chevron skips `.icon-btn` and `.btn--*` in a sorted header; `.hero`'s panel colour is zero-specificity so an aurora class's ink floor wins; a `.prose` heading that opens the block carries no top gap; `.alert__icon` is 16px (was 18); `.toast` never prints.
  - **Repo-internal:** the examples drift guard gained an inline-knobs rule and now covers the examples hub and the foundation reference; the root build inputs include the guard files.
  - **Agent-first pass (2026-10-06):** `.skip-link` (the first element of every skeleton; sr-only until keyboard focus); `.hero--bleed` pads to the `.container` edge so the hero text lines up with the column below; `.btn` and `.icon-btn` with `aria-disabled="true"` take the disabled value and stop answering the pointer; `.chip__remove` joins the one disabled value (opacity .45, default cursor) and its hover skips disabled (a 0.1.2 consumer with a disabled chip-remove sees it fade); the app bar goes opaque under `prefers-reduced-transparency`; the sidebar's current-page bar and the badge dot survive forced colours; `llms.txt` marks `--focus-ring` deprecated.
  - **The zha-ui skill:** `skills/zha-ui/SKILL.md` and `reference.md` (the former `AI-USAGE.md`) in the Agent Skills format; `npx skills add GitZHACODE/zha-ui` installs it for Claude Code, Codex CLI and Gemini CLI. The README's quick start opens with that route.
  - **Repo-internal (2026-10-06):** the React starter runs the drift guard through a JSX transform; the gradient showcase shows the graphic design team's four meshes beside their CSS twins.

## 0.1.2

### Patch Changes

- 95a73da: Signature-form gradient pool + team wardrobe + typology text tokens + the chip pass:

  - **`--grad-pair-*` / `.grad-pair-*`** - the 16-entry signature-form pool (gradient-pool
    redesign, 2026-07-23 spec), four families: journeys (`polar blaze reef nova orchid`),
    conics (`beacon sundial prism verdigris` - off-canvas centres, wrap-held), auroras
    (`borealis nebula abyss furnace` - layered accent glows over a near-black
    `background-color` floor, so weak engines degrade to a solid dark panel; text via
    `--text-*` only), fields (`signal terra regatta`). Cross-axis journeys/fields ship
    `-oklch` twins swapped by the classes behind gradient-specific feature tests. Un-assigned:
    a team adopts an entry (pair + form) at confirmation. Browsable in
    `examples/gradient-showcase`.
  - **`.accent-grad-aurora` / `.accent-grad-conic` / `.accent-grad-duo`** - the team signature
    wardrobe, rendered live from `--accent`/`--accent-2` (`--brand-grad-aurora/-conic/-duo` +
    oklch twins; the conic interpolation clause sits after the position). Every confirmed team
    inherits all three automatically; print/forced-colors suppression included.
  - **`--typology-<hue>-text`** - per-theme AA-safe text form of each of the 12 typology hues
    (light/dark/brand-surface), culori-computed and enforced by the contrast gate against both
    `bg-surface-1` and the hue's 25% tint composited over it.
  - **`.chip--<hue>`** (12 typology-tinted chip variants: hue tint background + the same hue's
    AA text) and **`.chip__remove`** (remove button with a currentColor hover wash).

- 95a73da: Consumer-feedback quick wins (P1/P2/P3/P5 of the 2026-07-16 triage): platform ownership
  (`color-scheme` bound to the theme axes, `accent-color` on native checkbox/radio/range),
  anchor-safe `.btn`, `.pagination` button support, `.badge--neutral`, sort-header reset +
  `.th-unit`, the canonical app-bar brand mark (`.app-bar__brand` layout-only group +
  `.app-bar__app` slot, `a.zha-lockup` link form with gated hover-shift), quiet `.icon-btn`
  default + `.icon-btn--ghost`, `.btn.is-active` toggle, `.tabs`, `.tooltip`, `.slider-row`,
  `fieldset.field`, `.menu__caret`. Also: the tokenless git-URL install channel
  (`github:GitZHACODE/zha-ui#release/<pkg>` mirror branches) - no PAT needed on dev machines.
- 506a9ac: Viz/chart tokens (per `docs/specs/2026-07-22-zha-ui-viz-chart-tokens-design.md`, all values
  validator-derived and per-theme incl. brand surface):

  - **`--chart-cat-1 … --chart-cat-8`** + **`--chart-cat-other`** - the canonical categorical
    slots for generic data series (teal-first, fixed order, never cycled; status hues excluded
    by design; "Other" is a receding neutral). Gate-enforced ≥ 3:1 vs surface per theme.
  - **`--chart-seq-1..6`** - teal sequential (magnitude) ramp; "more" reads as more contrast
    against the surface in both themes.
  - **`--chart-div-neg-3 … --chart-div-pos-3`** + **`--chart-div-mid`** - blue↔cool-red
    diverging (polarity) ramp with a neutral gray midpoint; lightness-monotone per arm
    (test-enforced).
  - **`--chart-text` / `--chart-text-strong` / `--chart-grid` / `--chart-axis`** - chart
    text/grid aliases; chart text never wears a series colour.

  Replaces per-app chart palettes (solar-trace `colormap.js` categorical/heat/RdBu entries,
  digital-archive `chartTheme.js`).

## 0.1.1

### Patch Changes

- 38c3fba: Bundle self-hosted Inter as the primary-font fallback

  Ship Inter Variable (latin + latin-ext subsets, weight 100-900) inside the CSS
  bundle as a self-hosted `@font-face`, so `--font-primary` falls back to a real
  bundled face instead of a bare system font on machines that lack Neue Haas
  Unica. NHU remains the named primary and still renders where it is
  licensed/installed; its webfont-licence question is unaffected. Inter is under
  the SIL Open Font License 1.1 (bundled at `dist/assets/inter-OFL.txt`). No
  class, token, or export names change - consumers need do nothing.

## 0.1.0

### Minor Changes

- e2c3dc7: Phase 0 foundation: tokens + css
