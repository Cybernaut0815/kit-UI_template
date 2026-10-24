# kit-forge-ui

Design tokens and CSS primitives for the kit-forge modules: square corners, Geist type, and a warm ramp from orange over red to purple with red as the default accent. One stylesheet, no build, no dependencies.

Open [`examples/index.html`](examples/index.html) straight from disk to see every token and primitive, with live theme, accent and density switches. [`examples/app.html`](examples/app.html) is a tool page and [`examples/deck.html`](examples/deck.html) a slide deck.

## Install

```jsonc
"dependencies": { "kit-forge-ui": "github:Cybernaut0815/kit-forge_UI-template#v0.1.0" }
```

Pin a tag so an update never silently changes a page. Then load it once, before your own CSS:

```js
import 'kit-forge-ui'; // Vite, Next or any bundler
```

```html
<!-- plain HTML; the fonts resolve relative to this file -->
<link rel="stylesheet" href="./node_modules/kit-forge-ui/css/kit-forge-ui.css">
```

`kit-forge-ui/tokens.css` is the variables alone, for a page that wants the tokens without the primitives.

## Declare the identity on `<html>`

```html
<html lang="en" data-theme="dark" data-accent="orange" data-density="compact">
```

| Attribute | Options | Effect |
| --- | --- | --- |
| `data-theme` | `light` (default) · `dark` | Surfaces, text and fills flip together |
| `data-surface` | `brand` | Black-first surface for decks and heroes, in both themes; wins over `data-theme` on the same element |
| `data-density` | `compact` | Controls and table rows from 44 to 36 px |
| `data-accent` | `orange` · `purple` | Red when absent |

Everything inside inherits. An element with its own `data-theme` is an island (a light card on a dark deck). Put `data-accent` on `<html>` or beside a `data-theme`.

## What is in it

- **Tokens** ([`css/tokens.css`](css/tokens.css)): surfaces, text, borders, accent, intent, a 3 × 3 warm palette, chip hues, chart ramps, space, `--radius`, type, motion, shadows.
- **Primitives** ([`css/kit-forge-ui.css`](css/kit-forge-ui.css)): buttons, inputs, chips, segmented controls, cards, stats, badges, tables, alerts, toasts, progress, spinners, skeletons, app shell, sidebar, tabs, breadcrumb, pagination, native `<dialog>` and `[popover]` menus, and a composition layer (`.container .stack .cluster .grid .section .split .toolbar .form-grid .hero`). Element defaults sit at zero specificity, so any rule of yours wins.
- **Gradients**: `.grad-spectrum` (orange → red → purple), `.grad-ember`, `.grad-dusk`, `.grad-accent`, `.grad-aurora`, plus `.grad-wash` and `.grad-glow` for work surfaces.
- **Fonts**: Geist and Geist Mono, variable, self-hosted under the SIL Open Font License ([`css/fonts/OFL.txt`](css/fonts/OFL.txt)).

Corners are square: `--radius` is `0`. Set `--radius: 2px` on `<html>` to soften a whole app, never per component. The danger button is outlined, so it never reads as the red primary.

The full class and variable list is [`skills/kit-forge-ui/reference.md`](skills/kit-forge-ui/reference.md).

## With a coding agent

The agent skill in [`skills/kit-forge-ui/`](skills/kit-forge-ui/SKILL.md) holds the setup, page skeletons, rules and ship checklist. Install it into a project with:

```sh
npx skills add Cybernaut0815/kit-forge_UI-template
```

## Develop

```sh
npm test
```

One zero-dependency `node:test` file checks:

- WCAG contrast for every theme and accent;
- that every class appears in the reference and every `var()` is declared;
- that the examples use no colour literals;
- that no trace of the former company identity remains.

For any colour change, also open the three examples in light, dark and brand and look.

Known limit: Firefox may refuse fonts loaded from a parent folder over `file://`, so the examples fall back to the system font there. Chrome and Edge load them, and every browser does over http.
