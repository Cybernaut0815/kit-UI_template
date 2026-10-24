# kit-forge-ui reference

Every class and the grouped variables. `css/tokens.css` is the source of truth for values; this file says what each name is for. `npm test` fails when a class is missing here.

## Variables

- **Surfaces:** `--bg-page --bg-surface-1 --bg-surface-2 --bg-surface-3`
- **Text:** `--text-strong --text-default --text-muted --text-muted-strong --text-disabled`
- **Borders:** `--border-subtle --border-default --border-strong`
- **Accent:** `--accent` (lines, underlines, stripes), `--accent-fill` (button fill, links, focus ring), `--accent-on` (text on the fill), `--accent-hover`, `--accent-subtle` (tint), `--accent-2` (gradient partner). Never put text on bare `--accent`; use `.btn--primary`.
- **Intent:** `--intent-{error,success,warning,info}` (fills), `--intent-on-*` (text on those fills), `--intent-*-text` (AA text on surface-1 and page)
- **Palette:** `--color-{orange,red,purple}-{400,500,600}`, `--color-green --color-amber --color-blue --color-black --color-ink --color-white`. Reach for a role token first; the palette is for swatches and charts.
- **Chips:** `--chip-{orange,red,purple,green,amber,blue}-text`
- **Charts:** `--chart-cat-1..8 --chart-cat-other`, `--chart-seq-1..6`, `--chart-div-neg-3..-1 --chart-div-mid --chart-div-pos-1..3`, `--chart-text --chart-text-strong --chart-grid --chart-axis`
- **Gradients:** `--grad-spectrum --grad-ember --grad-dusk --grad-aurora` (apply through the classes)
- **Space:** `--space-1 2 3 4 5 6 8 10 12 16` (4-64 px), tiers `--space-section --space-block --space-inline`, `--gutter`
- **Shape:** `--radius` (0; the one corner knob)
- **Controls:** `--control-h --control-pad-y --row-h`
- **Type:** `--font-primary --font-mono`, `--fs-hero-xl --fs-hero --fs-display --fs-h1 --fs-h2 --fs-h3 --fs-reading --fs-body --fs-small --fs-label`, `--tracking-{display,body,label,small}`, `--leading-{display,heading,body,prose}`, `--measure`
- **Motion:** `--motion-fast --motion-base --motion-slow --ease-out --ease-in --ease-spring`
- **Depth:** `--shadow-low --shadow-mid --shadow-high --scrim --z-sticky --z-toast`

The seven inline knobs: `--container-w --grid-min --stack-gap --split-aside --control-h --dialog-w --sidebar-w`.

**Canvas renderers** (charts, WebGL overlays) read plain tokens with `getComputedStyle(document.documentElement).getPropertyValue('--chart-cat-1')`, which returns hex. `--accent-hover` and `--accent-subtle` are `color-mix()` strings that a canvas cannot parse.

## Classes

### Controls
| Class | What it is |
|---|---|
| `.btn` | Base button; always pair with a modifier. A link that is unavailable carries `aria-disabled="true"` and no `href` |
| `.btn--primary` | Filled accent button: the one main action per view |
| `.btn--secondary` | Outlined button |
| `.btn--ghost` | Text-only button |
| `.btn--danger` | Outlined destructive action (red border and text; filled red is the primary) |
| `.btn.is-active` | Quiet persistent toggle on any `.btn`; also via `aria-pressed="true"` |
| `.icon-btn` | Square icon-only button, `--control-h` wide; muted icon |
| `.icon-btn--ghost` | Chromeless icon button, same hit target |
| `.input` | Full-width text input (also `<textarea>`) |
| `.select` | Full-width `<select>` |
| `.chip` | Tag; `aria-pressed="true"` or `.is-active` for the selected state |
| `.chip--orange` `.chip--red` `.chip--purple` `.chip--green` `.chip--amber` `.chip--blue` | Hue-tinted category tag with its AA text; keep on surface-1 or page |
| `.chip__remove` | Remove button inside a non-interactive `<span class="chip">` (never inside `button.chip`) |
| `.segmented` | Radio group track; the checked label lifts via `:has(:checked)`, no JS |
| `.field` | Column of label + control + help or error. `fieldset.field` + `<legend>` for choice groups |
| `.field__label` | Label above the control |
| `.field__help` | Muted hint below the control |
| `.field__error` | Error text; pair with `aria-invalid="true"` on the control |
| `.field--span` | A field spanning the whole `.form-grid` row |
| `.slider-row` | Label + `<input type="range">` + value readout |
| `.slider-row__value` | Tabular readout at the row end |

### Content
| Class | What it is |
|---|---|
| `.card` | Hairline container with default padding, no resting shadow |
| `.card--flush` | No padding: media and table cards |
| `.card--interactive` | Hover lift; clickable cards only |
| `.card--accent` | 3 px accent stripe on the start edge |
| `.surface` | Flat bordered container without padding |
| `.stat` | KPI tile: `__label`, `__value`, `__delta` |
| `.stat__label` | Muted uppercase label |
| `.stat__value` | Display-size tabular number |
| `.stat__delta` | Trend line; `.stat__delta--up` (green) or `.stat__delta--down` (red) |
| `.badge` | Outlined status label coloured by an intent modifier; always with text |
| `.badge--success` `.badge--warning` `.badge--error` `.badge--info` `.badge--neutral` | Badge intents (`neutral` for queued or unknown) |
| `.dot` | Square status mark inside `.badge` |
| `.accordion` | `<details>` with a rotating chevron |
| `.accordion__body` | Padded body inside `.accordion` |
| `.data-table` | `<table>` with sticky header, hairline rows, hover; a plain `<button>` in a `<th>` becomes a sort header (`aria-sort`) |
| `.data-table--wrap` | Lets cells wrap; use inside `.table-wrap` |
| `.num` | Right-aligned tabular cell |
| `.th-unit` | Unit inside a header that escapes the uppercase ("m²") |
| `.prose` | Running text: 16 px, 1.5 leading, `--measure` wide |
| `.text-muted` | The one text utility: a secondary line |
| `.eyebrow` | Mono uppercase label above a hero or deck heading; never above every heading |
| `.divider` | `<hr>` hairline with block margins |
| `.divider--vertical` | Vertical hairline between groups in `.toolbar` and `.cluster` |
| `.sr-only` | Visually hidden, read by screen readers |

### Feedback
| Class | What it is |
|---|---|
| `.alert` | Status row: 3 px intent edge and icon colour, not a tinted background |
| `.alert--success` `.alert--warning` `.alert--error` `.alert--info` | Alert intents |
| `.alert__icon` | 16 px icon slot |
| `.alert__title` | Title line |
| `.toast` | Fixed bottom-end wrapper for one `.alert` with `role="status"`; consumer JS inserts and removes it |
| `.progress` | Native `<progress>` in the accent |
| `.spinner` | Indeterminate wait (square, rotating) |
| `.skeleton` | Shimmering placeholder for a known shape |
| `.empty-state` | Centred icon + `<h3>` + `<p>` + one action |
| `.empty-state__icon` | 48 px tile for the illustration |
| `.view-fade` | The page's one entrance animation, on the main region |
| `.tooltip` | Paint-only tooltip on the inverse surface; you position it |

### Navigation and shell
| Class | What it is |
|---|---|
| `.app-shell` | Grid of sidebar, bar and main. `[data-rail]` collapses the sidebar to 56 px; `[data-nav-open]` opens the phone drawer (≤ 768 px) |
| `.app-main` | The shell's scrolling main region |
| `.app-bar` | 56 px top bar with translucent chrome |
| `.app-bar__brand` | Home link: product wordmark in 600 weight, tight tracking |
| `.app-bar__app` | App name beside the wordmark; muted, ellipsizes, hides ≤ 640 px |
| `.app-bar__spacer` | Pushes the actions to the end |
| `.app-bar__nav-toggle` | Phone drawer button (`.icon-btn--ghost`); shown ≤ 768 px only |
| `.sidebar` | `<nav>` column of links; current = `aria-current="page"` (tint + accent bar) |
| `.skip-link` | First element in `<body>`, visible on keyboard focus only |
| `.breadcrumb` | `<nav><ol>` with `/` separators; last item `aria-current="page"` |
| `.pagination` | `<ol>` of 32 px links or buttons; current = `aria-current="page"` |
| `.tabs` | Content-switching tab row (≠ `.segmented`) |
| `.tabs__tab` | Tab link or button; selected via `aria-current="page"` |
| `.page-header` | Title on the start, actions on the end, bottom hairline |
| `.page-header__title` | The page's `h1` at display size |
| `.page-header__actions` | Up to two buttons, one primary |

### Composition
| Class | What it is |
|---|---|
| `.container` | Centred column, `--container-w` (72rem) with `--gutter` sides |
| `.stack` | Vertical flow at `--space-block`; knob `--stack-gap` |
| `.stack--tight` | Stack at `--space-2` |
| `.stack--loose` | Stack at `--space-section` |
| `.cluster` | Wrapping row at `--space-inline` |
| `.cluster--between` | Row pushed to both ends |
| `.cluster--end` | Row aligned to the end (form actions) |
| `.grid` | Auto-fit equal columns no narrower than `--grid-min` (16rem) |
| `.section` | Page region with `--space-section` padding; hairline between siblings |
| `.split` | Main column + aside up to `--split-aside` (22rem); stacks ≤ 1024 px |
| `.split--aside-start` | Aside first (a panel left of a canvas) |
| `.toolbar` | Wrapping row of compact 36 px controls |
| `.form-grid` | Auto-fit grid of `.field`s |
| `.table-wrap` | Horizontal scroller for a wide `.data-table` |
| `.hero` | Display panel: `h1` at `--fs-hero-xl`, a lead `p`, one gradient. `<section class="hero grad-aurora" data-surface="brand">` |
| `.hero--bleed` | Full-width hero outside the container; text aligns with the container edge |

### Overlays
| Class | What it is |
|---|---|
| `.dialog` | Native `<dialog>` opened with `showModal()`; sizes `.dialog--sm` `.dialog--md` `.dialog--lg` `.dialog--full` |
| `.dialog__header` | Title bar with `__title` and `__close` |
| `.dialog__title` | Dialog heading |
| `.dialog__close` | Close-button slot; compose with `.icon-btn--ghost` |
| `.dialog__body` | Scrolling content |
| `.dialog__footer` | End-aligned action row |
| `.menu` | Native `[popover]` dropdown; `popovertarget` opens it, your JS sets `top`/`left` |
| `.menu__search` | Sticky filter input at the top |
| `.menu__list` | Column of rows |
| `.menu__section` | Muted caps group header |
| `.menu__item` | `<label>` or `<button>` row |
| `.menu__check` | Native checkbox in a row |
| `.menu__caret` | Chevron for an expandable row (`aria-expanded="true"` rotates it) |
| `.menu__separator` | Hairline between groups |
| `.menu__footer` | Sticky bottom row |

### Gradients (decorative only)
| Class | What it is |
|---|---|
| `.grad-spectrum` | Orange → red → purple, the signature sweep |
| `.grad-ember` | Orange → red |
| `.grad-dusk` | Red → purple |
| `.grad-accent` | Live `--accent-fill` → `--accent-2`; follows `data-accent` and the theme |
| `.grad-aurora` | Orange, red and purple glows over a black floor; dark hero panels, text via `--text-*` |
| `.grad-wash` | Top-down accent tint; safe on work surfaces |
| `.grad-glow` | Overhead accent glow; safe on work surfaces |
| `.grad-text` | Spectrum-clipped headline with a solid fallback; heroes and decks only |
