# Examples hub - design spec

**Date:** 2026-07-15 · **Status:** approved for planning
**Replaces:** the SharePoint route (`docs/sharepoint/`, scrapped - SPO won't serve custom aspx/html pages).

## Goal

`examples/index.html` becomes the navigational front door for all examples - built **on the
system itself** (bundle CSS, tokens, lockup, bundled fonts), working identically when browsed
in-repo and when opened off the mirrored ES share via `file://`. Every browsable example links
back to it. GitHub gets its own section.

Adversarial review verdict: GO-WITH-FIXES; all must-fix items are folded in below.

## Scope

**In:** the hub page; back-links on 7 examples; delete `docs/sharepoint/`; fix the existing
broken cross-link in foundation-reference; harden `tools/sync-to-share.ps1`; one-line
AGENTS.md examples-list refresh.
**Out (decided):** theme toggle (hub is light-only - avoids the known
`[data-brand]` > `[data-theme=dark]` accent cascade bug); drift-guard workspace stub (hub is
unguarded, same precedent as foundation-reference); localStorage/theme persistence; live link
or back-link for the React starter; any change to the share-sync hook mechanism.

## 1. The hub page - `examples/index.html`

- Shell: `<html lang="en" data-brand="es" data-theme="light" data-surface="work"
  data-density="comfortable">`, `<meta charset="utf-8">`, viewport meta,
  `<link rel="stylesheet" href="../packages/css/dist/index.css">`.
  **Path is `../` - one level up, NOT `../../`** (the hub sits at `examples/`, one level
  shallower than the other examples; `../../` breaks on the share).
- Page-scoped `<style>`: **layout only** (grid, gaps, max-width). Every colour, font and size
  from `var(--…)` tokens. No new custom properties, no hex/rgb/oklch literals, no literal
  colour words - same discipline as foundation-reference.
- Header: `.app-bar` with `.zha-lockup` (`ZHA` + `ES`) left, `.app-bar__spacer`, page label
  right in `--font-mono`. No toggle.
- Hero: standalone `.zha-logo` (`role="img" aria-label="ZHA"`), an `<h1>` descriptive title
  ("Design system examples" register - NOT a "ZHA UI" text wordmark; two marks max on screen)
  set via the `font:` shorthand in `--font-secondary` so ZHA Sans **never renders bold**, a
  short lede, and a `--brand-grad` hairline rule. Gradient text, if any, uses
  `.accent-grad-text` (has the @supports/print/forced-colors fallbacks) - never hand-rolled
  background-clip.
- Content - four sections, `--font-secondary` headings (weight-reset), card grids:
  1. **Reference** - foundation-reference, gradient-showcase.
  2. **Brand decks** - brand-deck, brand-deck-editorial, brand-deck-product,
     brand-deck-specimen (4 cards).
  3. **Starters** - zha-app-vanilla (live, browsable card); zha-app-react as a
     **source-only card**: no page link (it's a bare Vite mount - blank under `file://` and
     static serving), instead the GitHub folder URL + "clone → `pnpm install` → `pnpm dev`".
  4. **GitHub** - its own titled section: repo link `github.com/GitZHACODE/zha-ui`, a short
     consume-the-package note (`@zha-ui/css` from GitHub Packages; needs a PAT with
     `read:packages`), and one line contrasting access: GitHub needs an account/PAT, the ES
     share is open to everyone in the office.
- **Every card link is explicit**: `./foundation-reference/index.html` etc. - never a bare
  directory `./name/` (no index resolution under `file://`).
- Cards: bundle `.surface`-style cards (or minimal page-scoped layout class), title in
  `--font-secondary` (weight-reset), one-line description in `--text-muted`.

## 2. Back-navigation - "← All examples"

Literal `←` glyph always - **never** the `&#8592;` entity (the drift-guard's colour regex
reads `#8592` as a hex colour and fails the build). Href is `../index.html` from every
example. Per page:

| Page | Treatment | Guard constraint |
|---|---|---|
| foundation-reference | Into `.fr-top`, left group beside the lockup; mono, token-styled. Also **fix the existing `../gradient-showcase/` link → `../gradient-showcase/index.html`** | unguarded |
| gradient-showcase | Into its existing inline-styled header, left of / beside `.zha-logo` | guard: token-only inline style |
| zha-app-vanilla | Into `.app-bar` | `checkClasses: true` - use **existing bundle classes or inline `var(--…)` style only**; no new class names |
| 4 brand decks | Fixed top-left link: compact (≤ ~20 px tall, ~8 px from top - specimen's slide padding bottoms out at 30 px), token-styled, `z-index` above slides, `:focus-visible { box-shadow: var(--focus-ring) }`, and a new `@media print { display: none }` | `checkClasses: false` - new class OK, token-only styling |
| zha-app-react | **None** (under `vite dev`, `../index.html` normalizes to the app's own root - a self-link) | - |

Deck note: decks trap arrow/Space keys but not Tab/Enter, so the link stays keyboard-reachable;
top-left is clear (deck chrome lives bottom / bottom-right).

## 3. Supporting changes

- **Delete `docs/sharepoint/`** (both files). Verified unreferenced in-repo; next post-commit
  sync mirror-deletes them from the share (intended). Off-repo check: no CEWP page was wired
  up in SharePoint, so nothing dangles.
- **`tools/sync-to-share.ps1`**: missing `packages/css/dist/index.css` becomes a **hard fail
  (`exit 1`) before robocopy** instead of a warning - an unbuilt clone must never
  mirror-delete the CSS off the share while the hub depends on it.
- **AGENTS.md**: refresh the stale examples list to name all 8 + the hub (one line).

## 4. Constraints (system invariants this page must honour)

- ZHA Sans (`--font-secondary`): always regular weight, upright - every heading that uses it
  gets the `font:` shorthand or explicit `font-weight: 400`; emphasis by colour only.
- Gradients: `--brand-grad` for identity moments (hero rule) only - never UI chrome.
- All styling token-drawn; the bundle already contains everything needed (`.app-bar`,
  `.zha-lockup`, `.zha-logo`, `.icon-btn`, `.surface`, `.accent-grad-text`, fonts + logo
  assets resolve relative to the CSS file - no extra `<link>`s).
- No `#hex`-shaped strings anywhere in guarded files' markup (incl. prose/snippets).

## 5. Verification (blocking)

1. `pnpm build`, then serve the **repo root** and render `examples/index.html` - screenshot;
   confirm lockup + ZHA Sans render (webfont, not fallback), logo mask resolves, headings are
   regular weight.
2. **Open the mirrored copy via `file://` UNC** after a sync - confirm CSS loads (the `../`
   path) and click through ≥ 3 card links (explicit `index.html` form) + one back-link. A
   localhost check alone cannot catch share-only breakage; this step is mandatory.
3. One deck (specimen - tightest top padding): back-link visible over slide 1, doesn't clip
   the sheet, focus ring shows, gone in print preview.
4. zha-app-vanilla: its per-example drift-guard (`pnpm turbo run build` or the example's own
   `node check.mjs`) still passes after the app-bar edit; deck guards likewise.
5. foundation-reference: gradient link now resolves under `file://`.

## Non-goals / future

- Dark mode on the hub - blocked on the `[data-brand="es"][data-theme="dark"]` token-build
  combo blocks (open Phase B item). Revisit when the cascade emits dark-aware ES accents.
- Guard coverage for the hub page - add a `checkClasses: false` workspace stub only if the
  hub starts accumulating real component markup.
- Azure Static Web Apps hosting for org-wide https access - noted as the durable successor
  to the share if ever needed.
