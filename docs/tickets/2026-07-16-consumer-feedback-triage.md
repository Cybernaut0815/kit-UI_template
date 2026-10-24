# Consumer feedback triage - digital-archive + solar-trace dogfood (2026-07-16)

The five P1 one-liners fix bugs both repos shipped independently; P2 records the app-bar decisions.

Sources:
- digital-archive: `docs/superpowers/plans/2026-07-16-zha-ui-feedback.md` (10 items)
- zh-es-solar-trace: `docs/planning/2026-07-16-zha-ui-feedback.md` (9 items)
- Direct observation (AM): app-bar brand mark drifts across apps; AM dislikes the app-bar
  and chat buttons in digital-archive; AM prefers solar-trace's header treatment.

Verified against `packages/css/src` + `packages/tokens` 2026-07-16, then adversarially
re-reviewed by a fresh agent the same day. Two claims from the first pass were refuted
(noted inline); the DA feedback's "100/700 tint pairs already exist" claim is **false**.
Items merged, deduplicated, ordered by evidence strength (cross-repo > single-repo) and
remedy cost.

## P1 - one-liners; both repos independently shipped the same bug

| # | Fix | Evidence & gotchas |
|---|-----|--------------------|
| 1 | `color-scheme` binding: `:root, [data-theme="light"] { color-scheme: light; }` then `[data-theme="dark"], [data-surface="brand"] { color-scheme: dark; }` - **in that source order** (all (0,1,0); order is the tiebreaker, same convention as "[data-brand] emitted last wins"). The light rule must include `[data-theme="light"]` or a light island inside a dark app inherits dark scrollbars. | The binding is absent everywhere in src; both repos shipped light widgets in dark mode, and both have since patched locally (DA `app-tokens.css:6-7`, ST `app.css:7-9` - ST's includes the brand-surface line; copy it). Upstreaming lets both delete the patch. Placement: tokens dist is Style-Dictionary-generated ("do not edit directly") and `color-scheme` isn't a custom prop - put it in the hand-written css package (base.css) or add a static-append build step; `index.css` bundles both either way. Brand surface is black-first in both themes (tokens-brand-surface.css) so dark binding is correct. Render-verify dark+brand per the gate blind-spot rule. |
| 2 | `accent-color: var(--accent-fill)` on `input[type=checkbox|radio|range]` | Only `.progress` (feedback.css:10) and `.menu` checkboxes (menu.css:39) have it, so bare native inputs render UA blue. |
| 3 | `.btn { text-decoration: none; color: inherit; }` for anchor use | base.css:27-30 sets neither, so a variant-less `<a class="btn">` keeps the underline AND link color (DA styles `a { color: var(--accent) }`). ST's local patch (`a.btn { text-decoration:none }`, app.css:11) only works because they always add variants. |
| 4 | `.pagination :is(a, button)` for base + hover rules, plus a button reset (`background:none; border:0; font-family:inherit; cursor:pointer`) | nav.css:19-22 styles only a and span and sets no background, border or font-family, so adding `button` to the selector alone leaks UA chrome through. |
| 5 | `.badge--neutral` | content.css:11-14 ships 4 intents; state maps (queued/unknown) need an intent-less variant, so bless the accidental fallback. |

## P2 - app-bar brand mark: decisions (per AM 2026-07-16, solar-trace is the model)

Observed drift:

| Surface | Mark | Team letters | App name |
|---|---|---|---|
| zha-ui examples hub (no `data-brand`; system pair) | `.zha-lockup` @ 24px | "UI", gradient | - |
| zha-ui foundation-reference (`data-brand="es"`, `:434,468`) | plain `.app-bar__brand` text @ 16px | "ES" **neutral** | - |
| digital-archive (es) (`AppHeader.jsx:11-16`) | hand-rolled `<h1>` @ 16px | "ES" **solid teal** inline | Title Case in `.accent-grad-text` (gradient on work surface - spec violation) |
| solar-trace (es) (`BrandMark.jsx:7-25`) | `.zha-lockup` @ 24px + custom SVG | "ES" gradient | "solar-trace" lowercase in invented `.app-bar__app` |

Bar height is consistent (56px via `--app-bar-h`); the drift is entirely the mark. Root
cause is zha-ui shipping two treatments (`.app-bar__brand` 16px neutral vs `.zha-lockup`
24px gradient) with no composition rule and no app-name slot; AGENTS.md:56-60 lists both.

**Decisions (final after rendered design critique, 2026-07-16 - mock + screenshots in
session scratchpad `appbar-critique.html`):**
- Canonical markup: `.app-bar > a.zha-lockup[href=home] + .app-bar__app + .app-bar__spacer + actions`.
  **The bar has no app-icon slot.** Rendered A/B: ST's ray icon reads as a checkmark-with-magenta-dot
  at bar scale (the most saturated element in the bar, with no action attached) and the tokenized
  currentColor version reads as a dropdown caret between "ES" and the app name - a false
  affordance. Also geometrically unfixable: a 22px SVG in a baseline row rides ~4px above the
  baseline (ST went center-aligned *because* of the icon). App icons live in favicon / login /
  empty states, ≥48px, tokens/currentColor only (ST's hard-codes light-theme hexes,
  `BrandMark.jsx:16-22`).
- `.zha-lockup` in the bar: 24px is the minimum lockup size, because the teal gradient stop is
  ~3:1 on light, AA large-text only; team letters never shrink below it and never drop.
  Lockup is the home link (es-lockup's hover/focus gradient-shift assumes interactivity -
  `:focus-visible` on a span never fires); gate the shift on `a.zha-lockup` and add
  `text-decoration:none` for the anchor form.
- `.app-bar__app`: `font: 400 var(--fs-h2)/1 var(--font-primary); color: var(--text-muted);
  white-space: nowrap;` natural product case, no transform. Rendered comparison: 13px reads
  as a drifted caption next to the 24px lockup; 16px muted is subordinate-but-related.
  (Coordinate: ST reuses the class on a content `<h2>`, `JobDetail.jsx:22`.)
- Brand group (redefine `.app-bar__brand` or replace): `inline-flex; align-items:baseline;
  gap:var(--space-3)` - **no font, no color declarations**. layout.css:12 currently hands
  ZHA Sans to arbitrary children; that leak is why ST's app name renders in the brand font.
- Responsive ≤~640px (currently just breaks - name wraps mid-word, buttons wrap internally):
  drop app name first, then actions collapse to overflow; lockup + primary action are the floor.
- Retire the 16px neutral `.app-bar__brand` text treatment; fix
  `examples/foundation-reference` (:434,468) and the hub bar (`examples/index.html:96`);
  AGENTS.md gets exactly one bar recipe. (Resolved 2026-07-17: hub-bar lockup made a
  link; its app-name slot stays deliberately empty - the hub IS the design-system site
  and the right-side hub-label names the surface. Starters also aligned: canonical bar
  + stroke-SVG icons replacing the ⌕/◐ text glyphs.)
- **Hero hybrid doctrine leak.** The bars do not subvert the logo-vs-lockup doctrine:
  every bar typesets ZHA, and neither consumer uses `.zha-logo` anywhere. The subversion is
  zha-ui's own hub hero (`examples/index.html:104-106`): SVG logo paired with typeset gradient
  "UI" violates both doctrine cases (`.zha-logo` = "BIG and on its own"; the lockup's rationale
  is both parts typeset for display parity). Fix: retype the hero as a giant `.zha-lockup`, or
  name the hybrid (`.zha-lockup--hero`) and write the exemption down. Either fix gives the hero a named treatment; four apps already carry four different bars.
- **`.icon-btn` quiet variant** (root cause of the DA bar/chat buttons AM dislikes):
  the only icon button is 44×44, surface fill + border, **icon in `var(--accent)`**
  (base.css:47-50) with a backwards hover (accent→text-strong). Utility icons read as
  branded/decorative; DA's app-bar toggles are bare `.icon-btn` (teal solid heroicons)
  and its chat hand-rolled a ghost icon button twice (`AIChatWidget.jsx:754-766, 422-434`,
  ~22-26px hit targets). Ship `.icon-btn--ghost` (transparent, `--text-muted`, hover
  surface-2, keeps `--control-h` hit target) and reconsider whether accent should be the
  *default* icon color at all vs opt-in.

## P3 - selection states (both repos grew ad-hoc idioms before converging)

- `.btn.is-active` quiet persistent toggle. Traps found by ST that the recipe MUST include
  (app.css:431-433, 256-259): `.btn--ghost` sets `border: none` (base.css:34) so use the
  full `border:` shorthand, not `border-color`; and define `.is-active:hover` or
  `--secondary:hover` washes the state out. **Text color is unsolved**: ST's shipped
  `var(--accent)` on `--accent-subtle`-over-white ≈3.45:1 and even `--accent-fill` ≈4.4:1 -
  both fail AA at 13px. Likely `--text-strong` text with accent border/indicator, or a new
  darker accent-text token; run through the contrast gate, don't pre-commit to accent text.
- Same defect family, fix together: base `.chip` declares no border (base.css:43-45) so
  `.chip.is-active`'s `border-color` is a no-op on spans and colors UA chrome on
  `<button class="chip">` (DA uses chip-buttons, `AIChatWidget.jsx:907-915`, masked only by
  DA's global button reset). Give `.chip` a transparent border + button reset.
- `.tabs` primitive (content tabs ≠ `.segmented`): one blessed `aria-selected` treatment,
  hover state, `--fs-body` metrics. DA's dual-treatment drift is since self-fixed
  (`LibraryContent.jsx:19-21`); the primitive prevents recurrence, and the drift is no longer a live bug.

## P4 - viz/chart tokens + typology text tokens (own spec)

Canonical categorical order + sequential ramp + diverging ramp, per-theme, plus chart
text/grid tokens. Without them every chart falls back to library defaults (observed live)
or a per-app palette file. Seeds: ST `client/src/lib/colormap.js` (16-hue teal-first
CATEGORICAL, heat ramp, RdBu diverging); DA `chartTheme.js`. Near-ink hues vanish on dark
surfaces - per-theme contrast validation required.

Folded in from chips (was P5): **typology-tinted `.chip` variants need tokens that don't
exist yet.** tokens-tints ships only opacity steps (`--typology-*-100/75/50/25`) - there
are no 700-level dark text-safe hues; the DA feedback's "100/700 pairs already exist" is
false. Creating per-hue AA text tokens is a design pass → belongs in this spec. (ST hit
the same wall and went neutral-text + colored swatch, app.css:319-327 - viable interim
recipe.) `.chip__remove` slot can still ship independently.

## P5 - smaller items (cheapest adequate remedy per item)

- **Density below 36px**: document scope-overriding `--control-h` per zone as THE sanctioned
  mechanism. Evidence corrected by review: ST does it in ONE rule covering ten zones
  (app.css:85-88); DA's 32.5px buttons are surviving Vite-starter scaffold CSS
  (`index.css:37-46`), not an invented tier. Decide once: bless `--control-h-sm: 32px` or
  state 36 floor + the knob. Include `.icon-btn` pairing note (44×44 next to compact toolbars).
- **Starter/AGENTS.md line**: "delete template element-level `button`/`a` styling -
  primitives own control paint." DA's scaffold `button:hover { border-color: var(--accent) }`
  (index.css:47-49, specificity (0,1,1)) beats every single-class primitive → every button
  in DA grows a teal hover ring. One doc line prevents the class.
- **Links on work surfaces**: zha-ui styles anchors only in `.sidebar`/`.breadcrumb`. DA
  invented `--accent-hover` and derived it by *darkening* (app-tokens.css:9-11) - the exact
  direction Phase-0 rejected for dark. Ship a tiny link recipe or hover guidance.
- **`.data-table`**: sort-header recipe (`th .btn { font:inherit; … }` or `.data-table__sort`)
  + `.th-unit { text-transform:none }` escape - thead uppercase (content.css:28) mangles units.
- **fieldset/legend reset** matching `.field`, or document `.segmented` as THE
  exclusive-choice control and cover radio markup.
- **`.tooltip`** - dark surface themed for both themes, `--radius-s/m`, `--fs-small`, max-width.
- **`.slider-row`** - label / range / value readout, `tabular-nums`; ST drifted 3 layouts.
- **`.menu__caret`** - rotating chevron mirroring the accordion's (content.css:21-22)
  + `aria-expanded` guidance.
- **`.panel`** (non-modal floating window) - document the compose recipe (surface-1,
  radius-l, shadow-high, header slot); no new primitive until a second consumer. Note the
  DA chat also bypassed `.select`, `.input`, `.alert--error` and hardcoded radii/font sizes
  (`AIChatWidget.jsx` throughout) - most of that is fixed by consuming existing primitives
  plus the new `.icon-btn--ghost`, not by new CSS.
- **Icon vocabulary doc line** - must settle solid vs line, not just "no emoji": DA header
  uses solid heroicons, DA chat + ST use stroke line icons; a line-icons-only rule makes
  DA's header drift too. Plus `.empty-state__icon` glyph guidance, card+`.field` login example.

## Adoption notes (not defects)

- solar-trace **vendored** the CSS (`client/src/styles/zha-ui/`) - receives no fixes.
  Likely GitHub Packages auth friction (PAT + read:packages). Smooth the install story (the 2026-07-22 git-URL channel later did this for dev machines) or
  document the vendor-update path.
- Both consumers carry local patches that upstreaming deletes: color-scheme (both),
  `a.btn` underline (ST), sort-header reset (ST app.css:80).
- Downstream bug to report to DA: `size={FAB_SIZE}` passed to `HeaderIconButton`
  (`AIChatWidget.jsx:1069`) which accepts no `size` prop - the 52px FAB silently renders 44px.
- ST reuses `.app-bar__app` on an `<h2>` in main content (`JobDetail.jsx:22`) - shipping
  upstream styles for that class will restyle it; coordinate.
