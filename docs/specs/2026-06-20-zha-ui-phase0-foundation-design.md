# @zha-ui - Phase 0: Foundation (Design Spec)

> **Note (2026-06-22):** the npm scope shipped as `@gitzhacode/zha-ui-*` (`@gitzhacode/zha-ui-tokens`, `@gitzhacode/zha-ui-css`), **not** the `@zha-ui` used throughout this historical spec. `README.md`, `AI-USAGE.md`, and the `package.json` files are authoritative for current package names.

**Date:** 2026-06-20
**Status:** Draft for review
**Author:** kickoff session (CDT repo)
**Program:** `@zha-ui` firm-wide design system. **Phase 0 only** is in scope here: the token engine + accessibility-safe semantic layer + the first two published packages + CI. Later phases (app adoption, React component library, Figma/governance) get their own specs.
**Brand source of truth:** `docs/superpowers/zha-brand-reference.md` - the distilled digest of `ZHA_Brand-Book_2026.pdf` + brand assets (palette, typefaces, logo rules, brand devices, voice). This spec defers to it on all brand values.

---

## 0. Terminology & naming rules (binding)

- The firm is **ZHA** - always. **Never** write out its former spelled-out name anywhere - code, docs, package metadata, comments, UI strings.
- The design system is **firm-wide**, npm scope **`@zha-ui`**. It is **not** sustainability-specific. Known teams that may consume it (each a `data-brand` value): **ES** (sustainability - current consumers: CDT, Digital Archive, Solar Trace, ProjectFinder), **CODE**, **Analytics & Insights**, **ZH Cluster**, **BIM**, **ABPS** (Tyson's team), **META** (Jose). Phase 0 ships the ES brand fully + stubs for the others; teams are added incrementally.
- Each team is a **brand** layered on the core: it may override the **accent** colour and supply its own **logo lockup / name**, nothing else. Core neutrals, type, spacing, motion, and a11y guarantees are shared and not team-overridable.
- **ES brand lockup:** accent = **teal `#048C9C`**; the wordmark trails the ZHA logo as **`ES` set in ZHA Sans, teal** (optionally a teal→green gradient, evoking sustainability). Exact treatment locked from the lockup mockups (see §3.9). The `--brand-logo` slot for `data-brand="es"` resolves to this lockup.
- Repo name: **`zha-ui`**. Packages this phase: **`@zha-ui/tokens`**, **`@zha-ui/css`**. (Phase 3 adds `@zha-ui/react`.)

---

## 1. Context & problem

The ZHA token block (`zha_es_style.md §13.2`) is already **copy-pasted into four live frontends**, all derived from the same source, and the copies have **started to drift**:

| Tool | Stack | Token layer | Drift state |
|---|---|---|---|
| Digital Archive | React 19 · JS | `tokens.css`+`primitives.css`+`useTheme.js` | most advanced (adds `color-scheme`, `--scrim`, Phase-C4 polish) |
| CDT | React 18 · TS | `tokens.css`+`primitives.css`+`useTheme.ts` | a11y-hardened (deleted AA-failing `.btn--primary`) |
| Solar Trace | React 18 · JS | `tokens.css`+`app.css` | parallel (live-CSS-var chart palette; scoped dark accent) |
| ProjectFinder | vanilla HTML/CSS/JS | inlined `style.css` | **diverged** - pre-C4 radius, old `--text-muted #7E7B7A` |

Two problems compound:

1. **The copies have already drifted and shipped that way**; ProjectFinder shows it. With no single source, the next palette change splits the brand further.
2. **The current tokens are not accessible.** A programmatic WCAG audit found systemic contrast failures beyond the one already known (`.btn--primary`):
   - `warning #F5BB00` as text on light = **1.75:1** (fails all).
   - white on dark `accent-secondary #04A8BC` = **2.86:1** (fails all).
   - most typology colors as text fail in both themes (ultramarine 1.80, purple 2.15, magenta 2.54, blue 2.88, cool-red 2.98).
   - semantic error/info as text on dark = **2.88-2.98**; success never reaches 4.5:1 anywhere (max 3.90).
   - white on `accent #048C9C` = **4.01:1** (fails AA); `text-muted` on `surface-3` = **3.86:1** (AA-large only).

There are **four** consumers, one of them non-React, so the token layer must be framework-agnostic. The system must fix accessibility **by construction**, then be distributed so the copies can never drift again.

### What `zha_es_style.md` gives us, and its gaps

`zha_es_style.md` already provides a distinctive **typology palette** (12 hues mapped to ZHA project categories, a cross-tool semantic vocabulary), typography rules and an anti-pattern list. Gaps a true system must eventually fill (deferred past Phase 0): component states, form validation, focus management, toast/notification, z-index scale, table completeness, data-viz contract, layout grid, Figma deliverable, compliance tooling.

### Reconciliation with the official Brand Book (2026)

A 9-agent digest of `ZHA_Brand-Book_2026.pdf` (see the brand reference doc) confirmed our typology HEX values and **corrected/added** several things this spec now honours:
- **Typology mapping is authoritative:** Teal `#048C9C` = **Tall Buildings**, Dark-Green `#1A9D67` = **Offices** (the `zha_es_style.md` "teal = Offices" lineage was wrong). Ramp order = cool→warm = large-scale→intimate-scale.
- **The brand is black-first.** Primary = **Black Steel `#000`**; neutrals = Concrete Gray `#d4d4d4` / Alabaster White `#fff` / type-only greys `#999/#777/#333`. The **warm-paper `#F4F2F0` ladder is NOT in the brand book** - it is a CDT/DA invention. → adopted as a *data-app extension*, not brand-core (decision §3.2).
- **Opacity-tint ladder** (100/75/50/25%, on white & black, via real alpha) is a core brand device → a token group.
- **Typefaces:** Neue Haas Unica (primary; Adobe-Fonts-licensed, **needs a webfont licence** - Inter Variable is the shipped fallback meanwhile) + ZHA Sans (bespoke; logo/editorial only) + Noto SC/Kufi-Arabic/Sans-Arabic (i18n). Type rules: sentence-case, header `-0.03em`/`1.0`, body `-0.01em`/`1.2`.
- **Lime value ambiguity** (`#C6BE13` vs `#C8BE13`) → resolve by parsing the authoritative `.ase` swatch, not transcribing PDFs.
- Brand devices (gradient-mesh heroes, parametric lines, ghost letterform, animated logo) and voice (Striking/Refined/Thoughtful/Grounded; "Forever Advancing Architecture") are captured for later phases.

---

## 2. Goals & non-goals

### Phase 0 goals
1. Stand up the **`zha-ui`** mini-monorepo (pnpm workspaces + Turborepo).
2. Author tokens as **W3C DTCG `*.tokens.json`** in **oklch**, in a **3-tier taxonomy** (primitive → semantic → component).
3. Build with **Style Dictionary v4** to: `tokens.css` (CSS custom properties, `outputReferences:true`), `tokens.ts` (typed JS constants), and a **Tailwind v4 preset** (for future apps; cheap to emit).
4. Encode **accessibility-safe semantic tokens** so every documented fg/bg pairing passes WCAG 2.2 AA - and a **contrast-matrix check fails CI** on any regression.
5. Support composable theme axes: **`data-theme`** (light/dark) × **`data-density`** (compact/comfortable/spacious) × **`data-brand`** (es/code/…) × **`data-surface`** (brand/work - sets the surface's *default* theme, §3.3) + `color-scheme`.
6. Source canonical colour values from the **`.ase` swatch** (not PDF transcription); model brand-pure neutrals as core and the warm-paper ladder as a data-app extension; include the **opacity-tint ladder** and the **typography token set** (faces, tracking/leading, sentence-case).
7. Ship **`@zha-ui/css`**: the built `tokens.css` + the **framework-agnostic primitive classes** (reconciled from the four forks; DA aesthetics as visual baseline, CDT a11y fixes as the floor).
8. Publish **`@zha-ui/tokens`** and **`@zha-ui/css`** privately (GitHub Packages) with **Changesets** (fixed-mode, single-library versioning; tokens may version independently of future component packages).
9. Ship the **ES brand** fully (teal accent + the `ES` lockup asset, §3.9) and **stubs** for the other teams (CODE, Analytics & Insights, ZH Cluster, BIM, ABPS, META).
10. Make adoption trivial for **non-developers** (§3.10): a no-build hosted `<link>` CSS path, a plain-language README quick-start, and an `AI-USAGE.md`/`llms.txt` paste-into-your-AI usage doc. Commit a brand-recolored **`.vscode/settings.json`** (§3.11).

### Non-goals (explicitly deferred)
- Migrating any of the four apps (Phase 1-2).
- The React component library / React Aria (Phase 3).
- Storybook, visual-regression, Figma/Tokens Studio bridge, governance/contribution model (Phase 3-4).
- New components not already present across the four apps (forms, toasts, tables, z-index scale) - recorded as backlog, not built here.
- Filling every `zha_es_style.md` gap.

---

## 3. Architecture

### 3.1 Repo layout

```
zha-ui/                         # new repo, pnpm + turborepo
  .vscode/settings.json         # TRACKED - ZHA brand recolor of the IDE (§3.10)
  README.md                     # incl. the non-developer / "vibecoder" quick-start (§3.10)
  AI-USAGE.md + llms.txt        # machine-readable usage for AI coding assistants (§3.10)
  pnpm-workspace.yaml
  turbo.json
  .changeset/
  packages/
    tokens/                     # @zha-ui/tokens
      src/
        primitive/*.tokens.json # oklch ramps, spacing, radius, type, motion (private)
        semantic/*.tokens.json  # intent tokens incl. AA-safe pairs; theme/density/brand sets
        brand/es.tokens.json    # ES accent + logo slot
        brand/code.tokens.json  # CODE accent + logo slot (stub)
      style-dictionary.config.* # SD v4 config
      scripts/contrast-check.*  # WCAG matrix gate (Phase-0 test)
      dist/                     # tokens.css, tokens.ts, tailwind-preset.* (built)
    css/                        # @zha-ui/css
      src/primitives.css        # .surface/.card/.btn/.input/.chip/.icon-btn/.skeleton/focus/sr-only/scrollbar/reduced-motion
      dist/                     # bundled css (re-exports tokens.css)
  apps/                         # (empty in Phase 0; docs app added Phase 3)
```

### 3.2 Token model - 3 tiers

The one inviolable rule: **components and apps reference semantic tokens only; never primitives.** All theming lives in the semantic layer.

- **Primitive** (private, not exported for app use): raw oklch colour ramps, spacing, radius, type scale, motion. **Brand-pure neutrals are core** - Black Steel `#000`, Concrete Gray `#d4d4d4`, Alabaster White `#fff`, type-greys `#999/#777/#333` - plus the 12 typology hues and teal/magenta accents. **Values are sourced from `ZHA_and_Typology_Colours_2026.ase`** (authoritative; resolves the Lime ambiguity) and **converted to oklch preserving appearance**, so AA-safe variants derive by moving lightness only.
  - **Data-app neutral extension** (not brand-core): the warm-paper ladder (`#F4F2F0` page, white/`#ECEAE8`/`#DDDCDB` surfaces) ships as a documented *extension* token set - the brand book's own §10 "domain extension" rule sanctions it. Used by `data-surface="work"` light surfaces; data-dense UIs legitimately need more surface greys than the brand specifies.
- **Semantic** (the public theming surface): `--bg-page`, `--bg-surface-1..3`, `--text-strong/default/muted`, **`--text-muted-strong`** (AA on tinted surfaces), `--border-*`, **`--accent`** (decorative), **`--accent-fill`** (AA-safe button fill = the 5.07:1 shade), `--accent-subtle`, **`--on-accent`**, the four semantic intents each with **`--{intent}`**, **`--{intent}-text`** (AA as text), **`--on-{intent}`** (AA on the fill), the 12 typology hues each with **`--typology-{name}`** (fill/marker), **`--typology-{name}-text`** (AA as text, split light/dark), and the **opacity-tint ladder `--typology-{name}-{100|75|50|25}`** (alpha-based, surface-aware per the brand device), plus shadows, scrim, focus ring, and the **typography tokens** (§3.7).
- **Component** (optional, thin): e.g. `--btn-bg`, `--card-shadow` - reference semantic only. Kept minimal in Phase 0.

### 3.3 Theme axes - composable, attribute-driven

All on `:root`, no JS re-render - just attribute flips:

- `data-theme="light|dark"` - swaps the semantic layer; always paired with `color-scheme`.
- `data-density="compact|comfortable|spacious"` - the guide's row-height/padding modes, finally implemented as a real axis (default `comfortable`).
- `data-brand="es|code|analytics|zh-cluster|bim|abps|meta"` - overrides **only** `--accent` (and thus `--accent-fill`/`--accent-subtle`/`--on-accent`, derived) plus the `--brand-logo`/`--brand-name` slot. Core ships a default ZHA brand; Phase 0 ships **ES fully** (teal + the `ES` lockup, §3.9) and stubs for the rest. Axes are independent and compose.
- `data-surface="brand|work"` - **surface-role default theme** (decision: dual-default by role). `brand` surfaces (marketing/hero/cover/landing) default **dark/black-first** with the brand-pure neutrals + gradient-mesh heroes; `work` surfaces (dashboards, tables, forms) default **light** with the data-app warm-paper extension. `data-theme` still overrides explicitly on any surface - both light and dark are first-class everywhere; `data-surface` only sets the default.

### 3.4 Build pipeline

`@zha-ui/tokens` DTCG JSON → **Style Dictionary v4** →
- `dist/tokens.css` - CSS custom properties, `outputReferences:true` so the alias graph survives (e.g. `--btn-bg: var(--accent-fill)`), enabling runtime theming without recompilation. Theme/density/brand sets emitted under their `[data-*]` selectors.
- `dist/tokens.ts` - typed constants for JS consumers (charts that need literal strings, e.g. ECharts).
- `dist/tailwind-preset.{js,css}` - a `@theme` preset mapping semantic tokens into Tailwind's utility namespace, for future Tailwind apps. Cheap to emit now; no app must use it.

### 3.5 Packages & `package.json` exports

ESM-first. Exports map with **`types` first** in each conditional block and **explicit CSS subpath exports** (Vite consumers 500 on missing CSS paths), plus `sideEffects` for CSS.

```jsonc
// @zha-ui/tokens
{
  "exports": {
    ".":              { "import": { "types": "./dist/tokens.d.ts", "default": "./dist/tokens.js" } },
    "./tokens.css":   "./dist/tokens.css",
    "./tailwind":     "./dist/tailwind-preset.js",
    "./tokens.json":  "./dist/tokens.json"
  },
  "sideEffects": ["**/*.css"]
}
// @zha-ui/css
{
  "exports": {
    "./tokens.css":     "./dist/tokens.css",      // re-export, convenience
    "./primitives.css": "./dist/primitives.css",
    "./index.css":      "./dist/index.css"         // tokens + primitives, the one-import option
  },
  "sideEffects": ["**/*.css"]
}
```

Validated with `publint` + `@arethetypeswrong/cli` before publish.

### 3.6 Primitive classes (the `@zha-ui/css` reconciliation)

Reconcile the four forks into one canonical set, **framework-agnostic** (so vanilla ProjectFinder can consume): `.surface`, `.card`, `.btn`/`.btn--secondary`/`.btn--ghost`/`.btn--danger`, `.input`, `.select`, `.chip` (+ `aria-pressed`/`is-active`), `.icon-btn`, `.skeleton`, `:focus-visible`, scrollbars, `prefers-reduced-motion`, `.sr-only`. Reconciliation rule:
- **Digital Archive aesthetics are the visual baseline** (card elevation/hover, chip states, skeleton shimmer, `color-scheme`).
- **CDT's accessibility fixes are the floor** - no AA-failing `.btn--primary`; the AA-safe semantic tokens back every class. A *primary* button is reintroduced only on `--accent-fill` (AA-passing), not bare `--accent`.
- App-specific classes do **not** enter the package (e.g. DA's `.chip--tag`, `.view-toggle-btn`, `.chat-loading-dot`; Solar Trace's `.viewer__*`; CDT's `.kpi-tile` stays app-side, or ships renamed `.data-tile` only if ≥2 apps need it).

### 3.7 Typography tokens (brand-faithful)

Per the Brand Book (see brand reference doc §3):
- **Families:** `--font-primary: "Neue Haas Unica", "Inter Variable", system-ui, sans-serif` (Inter is the **shipped fallback** until the NHU webfont licence lands - §10); `--font-secondary: "ZHA Sans", …` (logo/editorial only, never long-form, never beside primary); i18n stacks for `--font-zh` (Noto Sans SC), `--font-ar-display` (Noto Kufi Arabic), `--font-ar-body` (Noto Sans Arabic).
- **Type-in-use:** `--tracking-display: -0.03em`, `--leading-display: 1.0`; `--tracking-body: -0.01em`, `--leading-body: 1.2`. **Sentence case** is the default; uppercase is allowed only for small category chips/eyebrow labels and single-word emphasis - *not* headings or body. (This narrows CDT/DA's current uppercase-micro-label usage.)
- The fixed-px data-density scale (`--fs-*`) is retained for `work` surfaces; `brand` surfaces may use larger display sizes.

### 3.8 Brand assets in scope for Phase 0 (tokens/asset only; components are Phase 3)

- **Logo:** ship the canonical `ZHA_logo` SVG (3 paths, `viewBox 0 0 283.5 110.3`, fill `#1d1d1b`/white) into `@zha-ui/css` as an asset + tokens `--logo-min-width: 50px` and a documented clearspace ratio (≈0.72× height). The `<ZhaLogo currentColor>` React component is Phase 3. Misuse rules (no keyline, no solid block behind, horizontal-only, no retypesetting) documented in the README.
- **Gradient-mesh heroes:** register `zha.gradient.mesh.{01,02,04,05}` tokens (oklch stops; CSS recreations in the brand reference). The `<ZhaLines>` parametric-line + ghost-letterform components are Phase 3.

### 3.9 ES brand lockup

The ES team brand (`data-brand="es"`) = teal accent + a wordmark lockup where **`ES` trails the ZHA logo, set in ZHA Sans** (see mockups `docs/superpowers/zha-ui-es-lockup.html`). **Chosen direction:**
- **Primary = gradient (Option C):** `ES` filled with a **teal→dark-green gradient** (`#048C9C → #1A9D67`) - echoes the brand gradient device and the ES sustainability connotation.
- **Solid fallback (Option A):** flat teal (`#048C9C`, lightened to `#3FB9C7` on dark/black) - used automatically wherever the gradient fails AA/visibility: small sizes (favicon/compact nav), low-contrast surfaces, monochrome/print, `forced-colors`/high-contrast mode. The contrast-matrix gate decides per surface; never ship a gradient that fails AA.
- **Hover micro-interaction:** the gradient **reveals/shifts on hover** (e.g. rest = subtle/near-solid → hover = full teal→green sweep, or an animated `background-position` shift). CSS-only, `prefers-reduced-motion`-safe (no motion → instant or static gradient).

Phase 0 ships this as the `--brand-logo` SVG asset + the hover treatment in `@zha-ui/css`. Constraint: the ZHA logo itself is never modified - `ES` is an *adjacent* element (logo-misuse rules govern the ZHA mark, not a sibling wordmark). Other teams follow the same pattern with their own short tag + accent (gradient drawn from their own typology hue).

### 3.10 Consumption for everyone - incl. non-developers ("vibecoders")

Some consumers have no developer background and build "vibecoded" apps via AI assistants. Phase 0 must make adoption trivial for them, on top of the npm path:

- **No-build path:** publish a **single hosted, versioned CSS bundle** (`@zha-ui/css/index.css`) reachable by a plain `<link>` (internal CDN / GitHub Pages). A non-dev pastes one `<link>` line, sets `data-brand="es"` + `data-theme`, and uses the documented classes (`.btn`, `.card`, `.input`, `.chip`…). No npm, no build step.
- **Plain-language README quick-start:** a top-of-README section for non-developers - copy-paste blocks, a result screenshot, a class cheat-sheet, "do this / not that". No jargon.
- **AI-assistant usage doc (`AI-USAGE.md` + `llms.txt`):** a machine-readable description of tokens, classes, theme/brand attributes and rules, designed to be **pasted into Claude/Cursor/Copilot** so a vibecoded app uses `@zha-ui` correctly. It does the most for non-developer adoption: their AI assistant does the wiring and the doc constrains it to the brand. Includes a ready-to-paste prompt block.

### 3.11 Tracked IDE brand recolor (`.vscode/settings.json`)

The repo commits a `.vscode/settings.json` recoloring VS Code to the ZHA brand (black-first + teal) so anyone opening it gets the brand in their IDE chrome. Draft in Appendix A: `workbench.colorCustomizations` (Black Steel title/activity bars, teal accents/badges/focus borders, white-on-black) + a restrained `editor.tokenColorCustomizations` accent - teal-on-black clears AA. (Considered `ui-ux-pro-max` for the palette; the authoritative ZHA palette already determines it - can run a second pass on request.)

---

## 4. Accessibility by construction

- Every semantic fg/bg pair documented in the system must pass **WCAG 2.2 AA** (4.5:1 text, 3:1 large/UI) for the default ZHA brand **and every team brand**, in light and dark.
- A **contrast-matrix script** (`scripts/contrast-check`) recomputes ratios from the built tokens and **fails CI** on any pair below target.
- oklch authoring makes the `*-text` / `--on-*` / `--accent-fill` variants derivable by lightness adjustment rather than hand-picked hex - so a brand accent swap re-derives its AA-safe companions automatically.
- Carry forward the colour-never-alone rule (typology pairs with a label/shape) and the `prefers-reduced-motion` baseline.

---

## 5. Versioning & release

- **Changesets**, **fixed (single-library) mode** - one version for the system. (Adobe's 200-package independent-versioning reversal is the cautionary tale; single-library guarantees inter-package compatibility.)
- **Tokens versioned independently of the future component package**, so a palette tweak doesn't force a component-library major.
- Private publish to **GitHub Packages**; CI opens a "Version Packages" PR; publishing is gated behind a human merge (never auto-publish on push). Consumers pin by semver.

---

## 6. Tooling & CI gates (Phase 0)

The `zha-ui` repo CI must pass:
1. `turbo build` - token build + css bundle succeed.
2. **Contrast-matrix check** - all pairs AA, all brands, both themes.
3. **Token build snapshot** - built `tokens.css` matches a committed golden (catches accidental value/structure changes).
4. `publint` + `attw` - package exports are correct.
5. Lint + format.

---

## 7. Testing strategy (TDD)

Write the check before the tokens it guards:
- **`contrast-check` test** - red first: assert the *current* failing pairs (warning-as-text, white-on-accent, typology-as-text) are caught; then author the AA-safe semantic tokens until green.
- **Build-output test** - Style Dictionary produces the expected token names per tier and theme/brand selectors; snapshot the CSS.
- **Exports test** - `publint`/`attw` clean; a tiny consumer fixture imports `@zha-ui/css/index.css` and `@zha-ui/tokens` without resolution errors.
- **Brand-axis test** - switching `data-brand` changes `--accent` and re-derives `--accent-fill` to an AA-passing value.

---

## 8. How apps will consume (forward-looking, not built here)

Phase 1+ each app: `npm i @zha-ui/css`, replace its vendored `tokens.css`/`primitives.css` with `import '@zha-ui/css/index.css'`, set `data-theme`/`data-brand="es"`. React apps later swap their components for `@zha-ui/react` (Phase 3). **Behaviour-preservation principle for CDT:** any visual change from adopting the canonical layer is a *defined, reviewed* delta (AA-safe-wins), re-verified against CDT's axe 12/12 + visual gates. `useTheme` is **not** shared in Phase 0 (the three app hooks have incompatible APIs); a canonical hook is a Phase 3 decision alongside the React layer.

---

## 9. Acceptance criteria (Phase 0 done)

- [ ] `zha-ui` repo exists (pnpm + turborepo + changesets).
- [ ] Colour values sourced from the `.ase` swatch (Lime ambiguity resolved); tokens authored as DTCG JSON in oklch, 3-tier, with theme/density/brand/surface sets incl. ES + a CODE stub.
- [ ] Brand-pure neutrals are core; the warm-paper data-app extension is a separate, documented token set.
- [ ] Typology mapping matches the Brand Book (Teal=Tall Buildings, Dark-Green=Offices); opacity-tint ladder (100/75/50/25, white & black) present.
- [ ] Typography tokens present (Neue Haas Unica primary + Inter fallback, ZHA Sans, Noto i18n; tracking/leading; sentence-case default).
- [ ] Style Dictionary builds `tokens.css` (outputReferences), `tokens.ts`, tailwind preset.
- [ ] AA-safe semantic tokens defined; **contrast-matrix CI is green** and demonstrably catches the audit's failures when reverted.
- [ ] `@zha-ui/css` ships reconciled primitives + the canonical logo SVG asset; framework-agnostic; importable by a vanilla fixture.
- [ ] `@zha-ui/tokens` + `@zha-ui/css` published privately, versioned via Changesets; `publint`/`attw` clean.
- [ ] ES brand shipped (teal + `ES` lockup asset); stub brands present for CODE / Analytics & Insights / ZH Cluster / BIM / ABPS / META.
- [ ] Non-dev adoption: no-build `<link>` CSS path works from a plain-HTML fixture; README has a jargon-free quick-start; `AI-USAGE.md` + `llms.txt` present with a paste-ready prompt block.
- [ ] `.vscode/settings.json` committed with the ZHA brand recolor (Appendix A).
- [ ] README documents the token tiers, theme/surface axes, brand mechanism, how a team adds a brand, and logo misuse rules.

---

## 10. Open questions / to revisit in later phases

- **Procurement (in-flight): Neue Haas Unica webfont licence** (Adobe Fonts web project or Monotype). Decision is to pursue it; Inter Variable ships as the metric-matched fallback meanwhile, with tokens naming NHU first so the swap is free. ZHA Sans webfont packaging (from OpenAsset) for editorial/logo contexts.
- Canonical `useTheme` hook API (Phase 3) - reconcile CDT context vs DA tuple+favicon vs Solar Trace MutationObserver.
- Whether the themed-favicon (DA) becomes a core capability or stays app-side.
- Component library scope & first components (Phase 3): Button, Input, Chip, Dialog, Combobox, Toast, plus brand devices `<ZhaLogo>`/`<ZhaLines>`/`<ZhaGradient>` and the animated-logo reveal.
- Figma source-of-truth via Tokens Studio (Phase 4) - DTCG was chosen now precisely so this drops in without rework.
- ProjectFinder (vanilla) adoption ergonomics - it has no build step; confirm a plain `<link>` to the published CSS is acceptable.
- Deep cover/surface shades (deep-teal `~#005F6B`, deep-burgundy `~#5C0A18`) seen on covers/slides - capture as `brand`-surface tokens if hero/cover components need them (Phase 3).

---

## Appendix A - `.vscode/settings.json` (ZHA brand IDE recolor, draft)

Committed in the `zha-ui` repo. Black Steel chrome, teal accents; teal-on-black clears WCAG AA. Final values should reference the built tokens once they exist.

```jsonc
{
  // ZHA brand recolor - black-first chrome, teal accent. See docs brand reference.
  "workbench.colorCustomizations": {
    "titleBar.activeBackground":        "#000000",
    "titleBar.activeForeground":        "#ffffff",
    "titleBar.inactiveBackground":      "#1d1d1b",
    "titleBar.inactiveForeground":      "#d4d4d4",
    "activityBar.background":           "#000000",
    "activityBar.foreground":           "#ffffff",
    "activityBar.inactiveForeground":   "#777777",
    "activityBar.activeBorder":         "#048C9C",
    "activityBarBadge.background":      "#048C9C",
    "activityBarBadge.foreground":      "#ffffff",
    "sideBar.background":               "#1d1d1b",
    "sideBar.foreground":               "#d4d4d4",
    "sideBarTitle.foreground":          "#ffffff",
    "statusBar.background":             "#000000",
    "statusBar.foreground":             "#ffffff",
    "statusBar.noFolderBackground":     "#000000",
    "statusBar.debuggingBackground":    "#048C9C",
    "statusBarItem.remoteBackground":   "#048C9C",
    "editorGroupHeader.tabsBackground": "#1d1d1b",
    "tab.activeBackground":             "#000000",
    "tab.activeForeground":             "#ffffff",
    "tab.activeBorderTop":              "#048C9C",
    "tab.inactiveBackground":           "#1d1d1b",
    "tab.inactiveForeground":           "#999999",
    "focusBorder":                      "#048C9C",
    "progressBar.background":           "#048C9C",
    "textLink.foreground":              "#3FB9C7",
    "button.background":                "#048C9C",
    "button.foreground":                "#ffffff",
    "button.hoverBackground":           "#037A88"
  },
  // Restrained accent on the token theme; relies on the user's base theme otherwise.
  "editor.tokenColorCustomizations": {
    "comments": "#777777"
  }
}
```

Note: `textLink.foreground` uses a lightened teal `#3FB9C7` so links clear AA on the black sidebar (raw `#048C9C` on `#000` is borderline for small text). This mirrors the system's own `--accent` vs `--accent-fill` distinction.
