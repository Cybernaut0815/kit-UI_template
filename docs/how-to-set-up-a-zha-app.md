# Setting up a ZHA app on zha-ui

This page holds the install steps for the two rings and the four attributes every page declares on
`<html>`. Read it when you start a new app or example on zha-ui, or when a page looks off brand
and you suspect the setup. The rules these steps serve are in [`AGENTS.md`](../AGENTS.md).

## Setup - pick your ring, link/import once

- **Ring 1 (plain HTML, no build):** install the package the same way as Ring 2 (`npm i`, no bundler needed), then add to `<head>`:
  ```html
  <link rel="stylesheet" href="./node_modules/@gitzhacode/zha-ui-css/dist/index.css">
  ```
  (The fonts and the logo resolve relative to that file. Pin a tag, `#css-v0.2.0`, so an update never silently changes your page.)
- **Ring 2 (React + Vite):** add `"@gitzhacode/zha-ui-css": "github:GitZHACODE/zha-ui#release/css"`
  to `package.json` and `npm i` - no token on your machine (reuses your git login); a CI/deploy
  pipeline still needs a repo-read token wired into git (see `README.md`), then:
  ```js
  import '@gitzhacode/zha-ui-css/index.css';
  ```

## Declare who you are - set on `<html>`

```html
<html data-brand="zha-app" data-theme="light" data-surface="work" data-density="comfortable">
```

| Attribute | Options | Meaning |
|---|---|---|
| `data-brand` | `zha-app` (firm default: black-first neutral, no team letters) · `es` (teal→magenta, the one confirmed team pair) · `code` · `analytics` · `bim` · `abps` · `meta` · `zh-cluster` (provisional) | `zha-app` is the firm identity and the default when the attribute is absent; a team sets its accent pair (ES confirmed, others provisional) |
| `data-theme` | `light` · `dark` | light or dark |
| `data-surface` | `work` · `brand` | `work` = light default for dashboards/forms; `brand` = black-first marketing surface. Beside `data-theme="light"` on the same element light wins (the tokens emit light last): a brand page sets `data-theme="dark" data-surface="brand"`, or puts `brand` on the island (the `.hero`) only |
| `data-density` | `comfortable` · `compact` | `compact` shrinks controls 44px→36px for dense screens |

Set them once; everything inside inherits.
