# zha-ui - Internal App Stack Standard (design)

**Status:** Draft for review · **Date:** 2026-06-21 · **Author:** Aleksander Mastalski
**Relationship to Phase 0:** companion to [`2026-06-20-zha-ui-phase0-foundation-design.md`](./2026-06-20-zha-ui-phase0-foundation-design.md). Phase 0 builds the token engine; this defines how ZHA people *consume* it to build apps. **Depends on the Phase-0 audit fixes landing first** (see [Dependencies](#9-dependencies--sequencing)).

---

## 1. Purpose

Decide the front-end stack(s) ZHA standardizes on for internally-built ("vibe-coded") web apps, so that apps come out **on-brand, accessible, AI-buildable, and deployable by non-developers** - and stay maintainable by a near-solo team at a firm with no software org.

With this standard, every AI-built ZHA app starts from zha-ui as its **default substrate** instead of treating it as a style guide.

### Priorities (in order, unchanged from Phase 0)
1. **Aesthetics** - apps look unmistakably on-brand and refined.
2. **Ease for less-technical employees** (designers/architects) building with an AI assistant who cannot debug a toolchain.
3. **Credibility for developer-inclined staff** - must not feel amateurish.

Over-engineering counts as a failure: each addition must be needed to meet the three priorities.

### Reality this must fit
- Existing apps: Digital Archive (React 19/JS), CDT (React 18/TS), Solar Trace (React 18/JS), ProjectFinder (vanilla HTML/CSS/JS, no build). **React-majority with one no-build holdout that must keep working.**
- Build flow: AI assistant **in an editor** (Cursor/Claude/Copilot) → a developer helps deploy to an internal server, or it lives on company GitHub → **static hosting**. Sometimes just plain HTML.
- **Some apps are public-facing** (client/public), most are internal.
- Maintenance: effectively near-solo.

## 2. Decision

**Maturity-rings model** (the GOV.UK / USWDS pattern): a CSS-first default that everyone can use, escalating to React only when an app needs it, with framework toolchain quarantined to people who can handle it. Brand and accessibility come from the **same framework-agnostic token + primitive CSS in every ring**, so an app graduates rings without restyling.

Rejected alternatives: **(B)** mandate React+Vite everywhere - over-engineers simple tools and forces non-coders into a toolchain they can't debug (violates priority #2); **(C)** classless CSS floor (Pico-style) - adds a new stylesheet to maintain on top of the existing primitives; worth piloting later only if evidence shows non-coders stumble on class names.

## 3. The three rings

| Ring | Stack | For whom | Deploy |
|---|---|---|---|
| **1 - default, no build** | Plain HTML + one `<link>` to the bundled zha-ui CSS; `data-brand`/`data-theme`/`data-surface`/`data-density` on `<html>` | Designers/architects with an AI editor; single-purpose tools (the ProjectFinder class) | Commit an HTML file; GitHub Pages or internal static host |
| **2 - when needed** | React 18/19 + Vite, `import '@gitzhacode/zha-ui-css/index.css'`. TypeScript **optional** (match the app) | Developer-adjacent staff; the existing React apps; multi-view / component-reuse tools | `vite build` → static output to Pages or internal host, per the deploy runbook |
| **3 - opt-in, developers only** | Ring 2 + (optional) Tailwind v4 `@theme inline` bridge and/or shadcn/ui-on-Base UI for complex interactive components | Most technical staff; Phase-3 `@gitzhacode/zha-ui-react` development | Same as Ring 2 |

**Escalation rule (the only judgment a builder makes):** *Start in Ring 1. Move to Ring 2 only when an app needs multiple views/routing or shared components. Ring 3 is never required.*

A non-coder who never leaves Ring 1 produces a fully on-brand, accessible app. There is no "real app vs toy" stigma - the visual result is identical across rings.

## 4. The brand + accessibility contract

- One source of truth: the token CSS (custom properties) + primitive classes (`.btn`, `.card`, `.input`, `.chip`, `.icon-btn`, `.skeleton`, `.sr-only`, lockup). Identical in all rings.
- AI is constrained to a **closed vocabulary** (the variables/classes in `llms.txt`) - this is what keeps AI output on-brand and is *more* reliable than Tailwind for brand fidelity (see [§6](#6-tailwind-handling)).
- **Accessibility tiering by audience:**
  - **Internal apps:** the Phase-0 contrast-gated tokens + primitive a11y (focus-visible, 44px targets, reduced-motion) are the floor.
  - **Public-facing apps:** must additionally meet genuine WCAG 2.2 AA beyond colour contrast - focus indicators, **non-text contrast (1.4.11)**, keyboard operability, hit targets. These are the gaps the Phase-0 audit identified as *not* covered by the contrast gate; for public apps they are in scope, not deferred.

## 5. Distribution & versioning

**Decision: GitHub Pages**, serving a **version-pinned** bundled CSS so a system update can never silently break a deployed app.

- CI publishes `packages/css/dist/index.css` to a **public Pages URL pinned by major.minor**, e.g. `https://<pages-host>/zha-ui/0.1/index.css`. Apps link a pinned version; upgrading is an explicit one-line edit, never automatic.
- **Public reachability:** Pages URLs are public, which suits the public-facing apps. If serving Pages from the private `GitZHACODE/zha-ui` repo is not available on the current plan, CI pushes the built CSS to a tiny **public mirror repo** (e.g. `GitZHACODE/zha-ui-cdn`) holding only `dist/` - the private source stays private, the CSS is public.
- **Ring 2 (React) path:** still installs `@gitzhacode/zha-ui-css` from GitHub Packages. This needs a `read:packages` PAT + an `.npmrc` line - **documented in the starter template and README** (the missing-doc gap from the audit). The PAT step is acceptable here because a developer is in the loop at build time.
- Tokens (`tokens.css`, `tokens.json`, `llms.txt`) are also published to the same Pages path for the AI-context fetch.

## 6. Tailwind handling

**Cut from Rings 1-2.** Rationale: AI trained on Tailwind defaults to its median (indigo-500 / Inter / generic SaaS), which actively fights ZHA's 12-hue palette; a constrained token/class list forces on-brand output instead. Tailwind v4's CSS-first config also makes pre-2025 LLMs emit silently-broken v4 - an unrecoverable failure for a non-coder.

**Ring 3 only, opt-in for developers.** If/when a Tailwind app appears:
- Ship a Tailwind v4 `@theme inline` bridge covering all token namespaces (colour, spacing, font, radius, shadow) - the `inline` keyword is required so vars resolve at the right cascade scope.
- The current colours-only JS preset (`dist/tailwind-preset.js`) is **removed from the advertised feature set** now and retained only as a **v3 shim** for any existing v3 app. README must stop calling it a "v4 preset."

## 7. AI substrate (about one day)

The repo currently ships **no** `AGENTS.md`/`CLAUDE.md` (confirmed gap). The AI substrate is the cheapest addition with the widest reach: it constrains every AI-built app.

- **`AGENTS.md`** at repo root, ≤150 lines: the four `<html>` switches; the single import/link path per ring; and a hard rule referencing the closed token list - *"Use only these CSS variables and classes. Never invent a CSS custom property or hard-code a hex value."* This directly kills the dominant failure mode (AI fabricating plausible-but-fake tokens like `--color-primary`).
- **`DESIGN.md`** for the full token/class catalogue (referenced by `AGENTS.md`, not inlined).
- **Two starter-template repos**, opened pre-wired (builders open a template, they don't read docs):
  - `zha-app-vanilla` - one `index.html` linking the pinned Pages CSS, attributes set, `AGENTS.md` included, GitHub Pages enabled.
  - `zha-app-react` - Vite + React, CSS imported, `.npmrc` + PAT note, `AGENTS.md` included, deploy runbook.
- `llms.txt` and `AI-USAGE.md` are deduplicated - generate one from the other (the audit's drift risk), and `AGENTS.md` points at the generated `llms.txt` as canonical.

## 8. Phase-3 component substrate (documented, not built now)

When `@gitzhacode/zha-ui-react` is built, wrap an OSS **headless** substrate thinly (substrate owns keyboard/ARIA/focus; zha-ui owns all visuals via the token cascade). Plain CSS primitives stay framework-agnostic and need no substrate.

- **Internal apps:** **shadcn/ui on Base UI** - headless, MUI-backed, copies source into the repo (no version drift), has an MCP server for AI editors. Covers dialogs/menus/comboboxes/tabs the CSS-only system can't do accessibly.
- **Public, audited products:** **React Aria** becomes defensible where formal WCAG audit-grade behaviour is required - its depth justifies the steeper curve only there.
- **Not** plain Radix (governance risk after the WorkOS acquisition).
- This is a Phase-3 decision and **must not** be presented as a prerequisite for building Ring 1/2 apps today.

## 9. Dependencies & sequencing

This standard assumed the **Phase-0 audit fixes land first** - **they have landed** (branch `phase-0-foundation`, commits `a2fdb98..e83606e`, 2026-06-22; merge-blocker plan complete, Opus whole-branch review = ready-to-merge, unmerged by choice). What those fixes delivered and this standard relies on:
- ✓ `data-surface="brand"` is split from `data-theme="dark"` with a distinct black-first "Black Steel" palette - Ring 1 can advertise it.
- ✓ **oklch sRGB/hex fallback (`@supports`) + a basic `@media print` block** ship in the tokens/CSS - needed for ZHA's BIM/CAD webviews, PDF/print pipelines, and public browsers, exactly where bare `oklch()` and background-dropping print break.
- ✓ The README a11y wording is corrected and the npm PAT setup is documented (both consumed by the starter templates).

Sequencing (Phase-0 fixes done): publish pinned CSS to Pages → write `AGENTS.md` + `DESIGN.md` → create the two starter templates → pilot with one real Ring-1 app and one Ring-2 app.

## 10. Deliberately skipped (revisit triggers)

- **MCP server** - premature for a near-solo team with no shipped component library. Revisit at Phase 4, after `@gitzhacode/zha-ui-react` exists.
- **Private component registry** - not until there are versioned components to serve.
- **Classless CSS floor** - pilot only if real usage shows non-coders stumbling on class names; it's an enhancement to Ring 1, not a replacement.
- `.cursorrules` as a primary format (deprecated) and any auto-generated context file (actively harmful) - use the hand-written `AGENTS.md` standard.

## 11. Open / deferred decisions

- **TypeScript in Ring 2:** optional per-app (existing apps are mixed). Not mandated, to keep the bar low for developer-adjacent builders.
- Internal static host vs Pages for internal-only apps: document both; default to Pages for consistency with the public path.

## 12. Success criteria

- A designer can take `zha-app-vanilla`, describe an app to an AI editor, and get an on-brand, accessible page live on Pages **with no build step and no hand-styling**.
- A developer can take `zha-app-react`, build a multi-view app on the same brand, and deploy static output following the runbook.
- AI assistants, given `AGENTS.md` + `llms.txt`, produce zero fabricated tokens and zero hard-coded hex in generated output.
- No new standing infrastructure for the near-solo maintainer beyond the CSS bundle, two docs, and two template repos.
