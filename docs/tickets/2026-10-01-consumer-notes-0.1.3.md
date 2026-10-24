# Consumer notes for the 0.1.3 release - digital-archive + zh-es-solar-trace

> Drafted 2026-10-01, to be sent when 0.1.3 ships (after the release PR merges).
> Source: the composition-layer changeset and `docs/specs/2026-09-30-zha-ui-composition-layer-design.md`.

0.1.3 adds the layout and element layer you have been hand-rolling, and changes eleven defaults
that will show on screen the day you upgrade. Both packages move together.

## Upgrade

`"@gitzhacode/zha-ui-css": "github:GitZHACODE/zha-ui#release/css"` and
`"@gitzhacode/zha-ui-tokens": "github:GitZHACODE/zha-ui#release/tokens"`. To pin, use the tag
form `#css-v0.1.4` and `#tokens-v0.1.4` (0.1.4 is 0.1.3 plus a README fix). Re-install, then look at every page once.

## What changes on screen without action

These defaults change the day you upgrade:

- The focus ring is now a 2px outline with a 2px offset, not a box-shadow. `--focus-ring` still
  exists but is deprecated.
- `.alert__title` is a block, so it no longer runs into the body text.
- `.card` has default padding (`--space-5`), so a card that already pads itself now pads twice.
- `box-sizing: border-box` is the default for every element.
- h1-h6, p, a, code and pre carry element defaults at zero specificity, so your own rules, including
  a page's own `h1 { ... }`, still win. UA margins on headings, paragraphs, lists, `blockquote`,
  `figure` and `pre` are now 0, `h1`-`h4` take the ladder sizes, and links take `--accent-fill`
  with an underline on hover. Wrap running text in `.prose` or space blocks with `.stack` to get
  the rhythm back.
- `.app-bar__app` has line-height 1.3, because descenders were clipped.
- `[hidden]` now always hides (`display: none !important`), so a `display` rule can no longer reveal a
  hidden element; toggle the attribute instead.
- Disabled menu rows (`.menu__item`) sit at opacity .45, the package's one disabled value (they were .4).
- `.alert__icon` is a 16px slot, so an 18px SVG inside it now overflows by 2px; draw alert icons at 16.
- Hover no longer changes a disabled control, and the sort chevron no longer lands on an `.icon-btn` in a
  sorted header.
- A disabled `.chip__remove` sits at opacity .45 with a default cursor and no hover wash, the package's
  one disabled value; in 0.1.2 it kept its full colour and still washed on hover.

## What to delete

Once 0.1.3 is installed, this local CSS can go:

- Delete hand-rolled container and max-width wrappers, and use `.container`.
- Delete margins between stacked blocks, and use `.stack` (set `--stack-gap` on the element that
  needs a different gap; a nested `.stack` takes its own).
- Delete any `:focus-visible` override that rebuilds the ring.
- Delete padding you add to `.card`, and use `.card--flush` where you want none (media, tables).

## What to add

Add these to each app:

- Wrap wide tables in `.table-wrap`, so they scroll inside the page and not the page itself.
- Toggle `data-nav-open` on `.app-shell` for the phone sidebar, from a button that carries
  `.app-bar__nav-toggle`, so the button appears only at 768px and below, where the sidebar is off-canvas.
- Optionally use `.grid`, `.split`, `.toolbar`, `.form-grid`, `.hero`, `.toast` and `.spinner`
  in place of most one-off layout CSS.
- A skip link: `<a class="skip-link" href="#main">Skip to content</a>` as the first element in `<body>`, and `id="main"` on your `<main>`. It is invisible until a keyboard user reaches it.

## Where the rules live

Read the zha-ui skill, `skills/zha-ui/SKILL.md`: §5 for the page recipes, §6 for the taste rules (ZHA Sans
only in the lockup, logo, `.hero > h1` and decks, regular and upright, 24 px or larger) and §8 for the
checklist; `skills/zha-ui/reference.md` lists every class with its role. The token list with values is
`llms.txt`; class names are in the generated `classes.txt`.

- Your coding agent can take the rules directly: `npx skills add GitZHACODE/zha-ui` in your project installs the `zha-ui` skill for Claude Code, Codex CLI and Gemini CLI; the README's quick start has the one paragraph to paste if you would rather not run it.

The next step for each app is to run the checklist on its busiest page and send us anything
that still needs a local patch.

