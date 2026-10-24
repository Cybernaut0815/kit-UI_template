# Consumer notes for the 0.1.2 release - digital-archive + zh-es-solar-trace

> Drafted 2026-07-22, to be sent when 0.1.2 ships (after the release PR merges).
> Source triage: `docs/tickets/2026-07-16-consumer-feedback-triage.md`.

0.1.2 moves several of your local patches upstream, adds the components you asked for and ships chart tokens.
Install it from the git URL, which needs no PAT on dev machines.

## Both apps

**Upgrade path:** `"@gitzhacode/zha-ui-css": "github:GitZHACODE/zha-ui#release/css"` is the new
tokenless git-URL channel; no PAT on dev machines (CI/deploy still needs a repo-read token, see
zha-ui `README.md`). Pin a version with the immutable tag form
`github:GitZHACODE/zha-ui#css-v0.1.2` if you prefer (tags are `<pkg>-v<version>`).

These local patches are upstream now:

- Delete the `color-scheme` theme binding (DA `app-tokens.css:6-7`, ST `app.css:7-8`); zha-ui now binds
  `color-scheme` to the theme axes, light-island-safe.
- Delete the native `accent-color` rule for checkbox/radio/range; it is upstream, `:where()`-demoted so your own
  rules still win.

0.1.2 adds these, all from your lists:

- A canonical app bar (`a.zha-lockup` + `.app-bar__app`, one blessed markup; see AGENTS.md).
- `.icon-btn--ghost` and a quiet `.icon-btn` default.
- A `.btn.is-active` toggle.
- `.tabs`, `.badge--neutral`, `.tooltip`, `.slider-row`, `fieldset.field` and `.menu__caret`.
- A sort-header reset and `.th-unit`, plus `<button>` support in pagination.
- Typology-tinted `.chip--<hue>` and `.chip__remove`, with `--typology-<hue>-text` tokens.
- The un-assigned signature-form gradient pool: 16 entries in four families (journeys / conics /
  auroras / fields, `.grad-pair-*`) plus the live team wardrobe `.accent-grad-aurora` / `-conic` /
  `-duo`. Browse `examples/gradient-showcase`; aurora panels are dark-first, so set text via
  `--text-*` only.

Chart tokens ship too (spec: `docs/specs/2026-07-22-zha-ui-viz-chart-tokens-design.md`):
`--chart-cat-1..8` + `--chart-cat-other` (generic series, fixed slot order, never cycled),
`--chart-seq-1..6` (magnitude), `--chart-div-neg-3..pos-3` + `--chart-div-mid` (polarity),
`--chart-text/-text-strong/-grid/-axis`. Each token has a value per theme (dark and brand
included), and the contrast gate validates all of them. The tokens map onto your chart code like this:

- **ST `colormap.js`**: replace just the `CATEGORICAL` 16-hue set (to cat slots + Other), the
  `zha` heat ramp (to seq), and the RdBu `diverging` (to div). Keep the continuous 3D result-field
  ramps (`es_sunhours`, turbo, viridis, ...); they are out of scope.
- **DA `chartTheme.js`**: retire it and read the CSS vars instead; the theme flip comes free.

## digital-archive

These changes apply to digital-archive only:

- **Delete** the `a.btn`-style link-color workaround if any remains; `.btn` is now anchor-safe
  (`text-decoration: none; color: inherit`).
- **Fix** the FAB size: `AIChatWidget.jsx:1069` passes `size={FAB_SIZE}` to
  `HeaderIconButton`, which accepts no `size` prop, so the 52px FAB silently renders 44px.
  With `--control-h` scoping you can now do this with the sanctioned knob instead.
- **Replace** the chat's hand-rolled ghost icon buttons, selects, inputs, and error alerts with
  primitives (`.icon-btn--ghost`, `.select`, `.input`, `.alert--error`).
- **Delete** the Vite scaffold CSS block (`index.css:37-49`). It still styles element-level `button`
  and beats single-class primitives on specificity (your teal hover ring on every button);
  AGENTS.md now warns about this.
- **Replace** `.accent-grad-text` on the app-bar title: gradients are for heroes only,
  and the canonical bar gives you the intended treatment.

## zh-es-solar-trace

These changes apply to zh-es-solar-trace only:

- **Delete local patches:** `a.btn { text-decoration: none }` (`app.css:11`) and the
  sort-header reset (`app.css:80`); both are upstream.
- **Rename or restyle the `.app-bar__app` heading:** the class is now a real upstream primitive
  **scoped to `.app-bar`** (`fs-h2`, muted, nowrap, hidden at 640px and below). Your content
  `<h2 class="app-bar__app">` (`JobDetail.jsx:22`) will not be restyled by us and gets nothing
  from the class, so rename it or style it locally to stop the shared name misleading.
- **Switch to the package:** vendored CSS receives none of this. `client/src/styles/zha-ui/` is
  frozen at whatever you copied, and the git-URL install removes the auth friction that likely
  caused the vendoring.
- **Rework `BrandMark.jsx`:** the ray icon and hard-coded brand hexes conflict with the canonical bar
  (no app icon in the bar; favicon/login/empty states only, 48px or larger, tokens/currentColor). The
  canonical markup is in AGENTS.md.
- **Drop your `.btn.is-active` workarounds:** 0.1.2 handles both traps (ghost border, hover
  wash-out). The shipped toggle uses the full border and restates the wash on hover; text stays
  `--text-strong` (your accent-text version fails AA, as you found).

Next step: install 0.1.2, delete the listed patches and send us anything that still needs one.
