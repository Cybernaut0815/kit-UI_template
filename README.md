# zha-ui - the ZHA design system

The ZHA look & feel - colour, type, spacing, components - packaged so every
team's app comes out on-brand and accessible **by default**.

## Why this exists

Every ZHA app should look like the same firm made it, without each team re-deciding
what that means. zha-ui carries the ZHA Brand Book 2026 so you don't have to:
the firm brand is the default, and a team declares its own pair on top of it.

The brand it carries, in brief:

- **"Forever Advancing Architecture."** Clean lines, bold geometry - striking yet refined.
- **Black-first identity.** Black Steel is the primary brand surface: pure-black
  marketing surfaces, white headlines, photography and gradient heroes.
- **A spectral palette where each hue is a team.** The 12-hue typology ramp is
  "refracted light on architecture" - cool→warm, large-scale→intimate. Your team's
  identity is a *pair* sliced from that prism - a primary + a secondary that blend
  into a gradient (ES = teal→magenta). An app with no team pair renders the firm
  brand, `zha-app`, which is black-first and carries no spectral hue.
- **Brand and colour-contrast, enforced on every build.** Every brand's text and
  button colours are checked against their surfaces - light, dark, and brand - on each
  build; fail the gate, fail the build. This guarantees _colour contrast_, not full
  accessibility: focus order, keyboard operation and component-level WCAG remain the
  app author's responsibility (and are in scope for public-facing apps).

Before this, the same tokens were copy-pasted and quietly drifting across ZHA's web
apps. Now there's one source: the firm brand by default, and a team pair where a team has confirmed one. Full brand digest:
[`zha-brand-reference.md`](./docs/zha-brand-reference.md).

## How it works

You don't hand-style anything. You declare **who you are** and **what kind of
surface** you're building; the system resolves every colour, type size, space and
state from there - on brand, accessible.

Four switches, set on your `<html>` tag:

| Attribute | Says | Options |
|---|---|---|
| `data-brand` | firm default or team | `zha-app` (firm default: black-first neutral, no team letters) · `es` (teal→magenta, the one confirmed team pair) · `code` · `analytics` · `bim` · `abps` · `meta` · `zh-cluster` (provisional) |
| `data-theme` | light or dark | `light` · `dark` |
| `data-surface` | marketing vs. working app | `brand` (black-first) · `work` (light - dashboards, forms, print) |
| `data-density` | how tight | `comfortable` (default) · `compact` |

Set them once; everything inside inherits. Leave `data-brand` off and the page renders
`zha-app`. ES is the one confirmed team pair; the other team accents are provisional
placeholders today - each team confirms its own *pair* later (picking a secondary
from the vetted pool).

## Quick start with your coding agent

You need Node.js (which provides npx), a project folder, and a GitHub account in the ZHA organisation.

Hand the system to the agent and describe the app; the agent installs the package, sets the switches and composes every page from zha-ui classes. In the project folder, with Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, Antigravity, Windsurf or another tool the `skills` CLI supports:

```
npx skills add GitZHACODE/zha-ui
```

That installs the `zha-ui` skill into the agent's skills folder from this private repo, through your normal GitHub login. Then ask for what you want, for example "build the project list page".

Already have an app? Install the skill and ask the agent to restyle it.

If you would rather not run the command yourself, paste this to the agent instead:

> Use the ZHA UI design system for everything visual in this project. Run `npx skills add GitZHACODE/zha-ui -y`, then read the installed `zha-ui/SKILL.md` and follow it: install `@gitzhacode/zha-ui-css` from `github:GitZHACODE/zha-ui#release/css`, load its `index.css` once, set `data-brand`, `data-theme` and `data-surface` on `<html>`, and use only its classes and tokens. Never write custom colours, invent CSS variables or add inline layout.

The skill is [`skills/zha-ui/SKILL.md`](./skills/zha-ui/SKILL.md); its [`reference.md`](./skills/zha-ui/reference.md) lists every class and variable.

### Where the skill lands

The CLI installs into the project folder: `.claude/skills/zha-ui/` for Claude Code, `.windsurf/skills/zha-ui/` for Windsurf, and `.agents/skills/zha-ui/`, a folder many tools share, for Codex, Cursor, GitHub Copilot, Gemini CLI, Antigravity, OpenCode and Amp. It installs for the agents it detects on the machine; `-a <agent>` names one instead, and with `-y` and no agent detected it targets every agent it supports; the test run wrote `.agents/` and `.claude/`.

The commands below were run on Windows 11 on 14 October 2026, with `skills` 1.7.2 and Claude Code, Cursor and VS Code installed; each produced the result shown when run in an empty folder of its own:

| Command | What it produced |
|---|---|
| `npx skills add GitZHACODE/zha-ui -y` | `.agents/skills/zha-ui/` as a copy, and `.claude/skills/zha-ui/` as a link to it for Claude Code |
| `npx skills add GitZHACODE/zha-ui -a cursor -y` | `.agents/skills/zha-ui/` as a copy |
| `npx skills add GitZHACODE/zha-ui -a github-copilot -y` | `.agents/skills/zha-ui/` as a copy |
| `npx skills add GitZHACODE/zha-ui -a codex -y` | `.agents/skills/zha-ui/` as a copy |
| `npx skills add GitZHACODE/zha-ui -a antigravity -y` | `.agents/skills/zha-ui/` as a copy |

Every run also wrote a `skills-lock.json` that records the source. On Windows the Claude Code link is a directory junction, which needed no administrator rights; where the file system does not permit links, add `--copy` to copy instead of linking.

For a tool that cannot run `npx`, copy the `skills/zha-ui/` folder of this repo into the project's `.agents/skills/zha-ui/` (`.claude/skills/zha-ui/` for Claude Code, `.windsurf/skills/zha-ui/` for Windsurf).

## Quick start by hand

**1. Install the stylesheet.** Add to `package.json` (create one with `npm init -y` if the folder has none) and run your installer (no token, no `.npmrc`; it reuses your GitHub access):

```jsonc
"dependencies": { "@gitzhacode/zha-ui-css": "github:GitZHACODE/zha-ui#release/css" }
```

**2. Load it once.** In a bundled app, `import '@gitzhacode/zha-ui-css/index.css';` in the entry file. In a plain HTML page, one line in `<head>`:

```html
<link rel="stylesheet" href="./node_modules/@gitzhacode/zha-ui-css/dist/index.css">
```

**3. Set the switches on your `<html>` tag** (see [How it works](#how-it-works)):

```html
<html data-brand="zha-app" data-theme="light" data-surface="work">
```

A team page sets its own brand instead, for example `data-brand="es"`.

With the stylesheet loaded and the switches set, use the ready-made classes:

```html
<button class="btn btn--primary">Explore</button>
<div class="card">…your content…</div>
<input class="input" placeholder="Search">
```

Every class and colour is listed in [`skills/zha-ui/reference.md`](./skills/zha-ui/reference.md).

## What you get

**Today (Phase 0):**

- **Design tokens** - colour, type scale, spacing, motion - as CSS variables, a
  Tailwind preset, and JS constants.
- **Primitive classes** - framework-agnostic, work in any app. Controls
  (`.btn` + variants, `.input`, `.field`, `.chip`, `.segmented`, `.icon-btn`),
  content (`.card`, `.data-table`, `.accordion`, `.badge`, `.stat`), feedback
  (`.alert`, `.progress`, `.empty-state`, `.skeleton`), layout & nav
  (`.app-shell`, `.app-bar`, `.sidebar`, `.breadcrumb`, `.pagination`,
  `.page-header`, `.divider`), overlays (`.dialog`, `.menu`), plus `.sr-only`.
  Full list in [`skills/zha-ui/reference.md`](./skills/zha-ui/reference.md).
- **Composition layer** - element typography with zero-specificity defaults, layout primitives
  (`.container`, `.stack`, `.cluster`, `.grid`, `.section`, `.split`, `.toolbar`, `.form-grid`,
  `.hero`), interaction states on every control, an outline focus ring, phone-width behaviour, and
  the rules for composing a page in [`skills/zha-ui/SKILL.md`](./skills/zha-ui/SKILL.md).
- **Gradient devices** - frozen sRGB mesh heroes (`.grad-hero-*`), work-safe
  washes (`.grad-wash`, `.grad-glow`) and accent gradients (`.accent-grad`,
  `.accent-grad-text`).
- **The ZHA logo** (inline SVG, `currentColor`) and the **ZHA lockup** (firm form, with the team form for a team app).
- **The firm brand and seven team brands** - `zha-app` is the default; **ES is confirmed**
  (teal); the other six are provisional placeholder accents until each team confirms its own.

**Coming:**

- Brand devices - parametric flowing lines and the ghost
  letterform *(Phase 3)*.
- **React components** (React Aria + CVA) + Storybook *(Phase 3)*.
- **Figma ↔ Git** token round-trip and governance *(Phase 4)*.

## For developers

### Check access first

The repo is private, so an install works only when your git can read it. Run this
before you add the dependency:

```sh
git ls-remote https://github.com/GitZHACODE/zha-ui refs/heads/release/css
```

The output tells you where you stand:

- A sha followed by `refs/heads/release/css`: your git can read zha-ui and the
  install will work.
- "could not read Username", "terminal prompts disabled" or "Authentication failed":
  git has no GitHub credential on this machine. Run `gh auth login`, or clone any
  private GitZHACODE repository once so Git Credential Manager stores one. If Git
  Credential Manager opens a browser sign-in instead, signing in there is the same fix.
- "Repository not found": your GitHub account cannot read GitZHACODE/zha-ui. Ask the
  zha-ui maintainers for access.

With a checkout of this repo, `node scripts/preflight.mjs` runs the same check without
prompts and prints one line naming the outcome and the fix: `ok:`, `sign in:`,
`no access:`, or `could not run git:` when git is missing, the network fails or GitHub
does not answer within 20 seconds.

### Install from git

Install straight from git - **no token, no `.npmrc`**. Once the check above prints a
sha, you can install the package (it reuses your existing GitHub access). Add to
your `package.json`:

```jsonc
"dependencies": {
  "@gitzhacode/zha-ui-css": "github:GitZHACODE/zha-ui#release/css"
}
```

```ts
import '@gitzhacode/zha-ui-css/index.css';  // tokens + primitives + the ZHA lockup
```

`release/css` is a flat, prebuilt branch published by CI on every release - it
carries the built `dist/` and its `@gitzhacode/zha-ui-tokens` dependency already
pinned, so `npm i` / `pnpm i` just works. To lock a version, pin the tag instead
of the branch: `#css-v<version>`, for example `#css-v0.2.0`.

> **Your project's CI is the one exception.** The repo is private, so a pipeline
> (GitHub Actions, Docker, deploy hosts) still needs git credentials that can read
> it - its own `GITHUB_TOKEN` can't reach another repo. In GitHub Actions, use the
> GitZHACODE organisation secret `GITZHACODE_READ_TOKEN`: a read-only token for this
> repo that every private GitZHACODE repo can already read, so there is nothing to
> set up per repo. Check out without persisted credentials and rewrite git auth
> before `npm ci`:
> ```yaml
> - uses: actions/checkout@v4
>   with:
>     persist-credentials: false  # otherwise checkout's own token wins: "Repository not found"
> - env:
>     TOKEN: ${{ secrets.GITZHACODE_READ_TOKEN }}
>   run: |
>     git config --global url."https://x-access-token:${TOKEN}@github.com/".insteadOf "https://github.com/"
>     git config --global --add url."https://x-access-token:${TOKEN}@github.com/".insteadOf "ssh://git@github.com/"
> ```
> The `ssh://` line covers lockfiles that pin `git+ssh://`, which `github:` specs
> usually resolve to.

Tokens only, Tailwind preset, or JS constants - same pattern:

```jsonc
"dependencies": {
  "@gitzhacode/zha-ui-tokens": "github:GitZHACODE/zha-ui#release/tokens"
}
```

> **Prefer the npm registry?** The packages are also published to the org's GitHub
> Packages registry. That route needs a one-time `.npmrc`:
> ```
> @gitzhacode:registry=https://npm.pkg.github.com
> //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
> ```
> with `GITHUB_TOKEN` set to a PAT carrying `read:packages` (or `$(gh auth token)`
> after `gh auth refresh -s read:packages`). The git-URL route above avoids all of this.

```ts
import preset from '@gitzhacode/zha-ui-tokens/tailwind'; // Tailwind colour preset (v3-style; not a v4 @theme config)
import tokens  from '@gitzhacode/zha-ui-tokens/tokens.json'; // JS constants
// AI context file:  node_modules/@gitzhacode/zha-ui-tokens/llms.txt
```

See the [design spec](./docs/specs/2026-06-20-zha-ui-phase0-foundation-design.md) and
[brand reference](./docs/zha-brand-reference.md).

> We commit `.vscode/settings.json` so everyone's VS Code chrome is themed in ZHA black + teal - the editor itself stays on-brand while you work in the repo.

### Try an unreleased build in your app

To test a change before it is released, build this repo and pack both packages into
`.local-pack/` at its root (the folder is gitignored):

```sh
pnpm build
pnpm -C packages/tokens pack --pack-destination ../../.local-pack
pnpm -C packages/css pack --pack-destination ../../.local-pack
```

Each `pack` prints the full path of its tarball. From your app, install both tarballs
in one command:

```sh
npm install <zha-ui>/.local-pack/gitzhacode-zha-ui-tokens-<version>.tgz <zha-ui>/.local-pack/gitzhacode-zha-ui-css-<version>.tgz
```

The tokens tarball has to come along because `pnpm pack` turns the css package's
`workspace:*` dependency into a plain version number, which npm would otherwise look up
in a registry rather than take from your build. The install writes `file:` paths into
your `package.json`, so put the `github:` dependency back before you commit. After a
further change, run the three commands again and repeat the install.

## Logo rules (don't break these)

Min width 50 px · keep clear space around it · never add a box or keyline behind
it · never retype it in another font · horizontal orientation only.

---

Built by **Aleksander Mastalski**.
