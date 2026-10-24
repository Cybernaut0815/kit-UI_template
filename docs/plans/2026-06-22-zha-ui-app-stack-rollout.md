# zha-ui App-Stack Rollout - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the finished zha-ui design system into something ZHA app teams (and their AI editors) build against: a version-pinned CSS bundle published to GitHub Pages, the `AGENTS.md` + `DESIGN.md` author/AI docs, and two in-repo starter examples (Ring 1 vanilla, Ring 2 React) wired to the workspace packages so they can never drift.

**Architecture:** No changes to the token engine or the two published packages - this is consumer-facing scaffolding on top of the as-built system. One new GitHub Actions workflow (`.github/workflows/pages.yml`) that builds and deploys `dist/index.css` (+ tokens) to a versioned Pages path; two root docs; and an `examples/` workspace folder holding two starter apps wired via `workspace:*`. CI builds both examples against the current packages, so a fabricated class or a broken import fails the build.

**Tech Stack:** GitHub Actions + GitHub Pages (`actions/upload-pages-artifact` + `actions/deploy-pages`); pnpm 9 workspaces + Turborepo; plain HTML for Ring 1; React 18 + Vite for Ring 2. No component/UI library, no Tailwind.

## Global Constraints

These apply to **every** task. Exact values copied from the handoff/spec.

- **Firm name:** the firm is **"ZHA"**. Never write out its former spelled-out name anywhere in code, comments, docs, commit messages, or example content. Tracked code is at 0 occurrences - keep it there.
- **ZHA Sans (`--font-secondary`)** is always regular weight and upright - never bold, never italic.
- **Closed vocabulary:** consuming CSS/HTML uses `var(--…)` tokens and the published primitive classes only - never invent a CSS custom property and never hard-code a hex value in a consumer. (Theme-override blocks that *redefine* the custom properties - dark/brand/print - are the only sanctioned exception, and live in the packages, not in examples.)
- **No component/UI library, no Tailwind in the default path.** React + Vite for the Ring-2 example is expected and fine; add nothing else. The Ring-2 substrate (React Aria / Base UI / vanilla) is an OPEN Phase-3 decision and **must not** be baked into the React example.
- **ES = teal is locked** by the brand book; the other six brands are provisional placeholders. Examples use `data-brand="es"`.
- **npm scope is `@gitzhacode/zha-ui-{tokens,css}`** (`scope == owner == GitZHACODE`).
- **Branch:** all work lands on a NEW branch off `phase-0-foundation` named `app-stack-rollout`. **No merge to `main`, no publish, nothing pushed** unless the maintainer explicitly asks. Each task ends with a *prepared* `git commit` you may run; do not push.
- **GitHub Pages stays disabled in repo Settings** for now (enabling is deferred). Nothing in this plan may depend on Pages being live.
- **Commands** (run from repo root; each Bash call starts in a fresh cwd - `cd /c/Users/aleksander.mastalski/repositories/zha-ui` first or use absolute paths):
  - Full build (both packages + examples, dep order): `pnpm build`
  - Tests: `pnpm test` · Types: `pnpm lint`
  - The `.npmrc` `"Failed to replace env in config: ${NODE_AUTH_TOKEN}"` WARN during builds is harmless and expected.

**Before you start:** create the branch and confirm a green baseline.

```bash
cd /c/Users/aleksander.mastalski/repositories/zha-ui
git checkout -b app-stack-rollout            # off phase-0-foundation
pnpm install && pnpm build && pnpm test      # expect "Contrast matrix: all pairs pass WCAG AA." + tests pass
```

If the baseline is not green, stop and report.

---

## File map

| File | Change |
|---|---|
| `.github/workflows/pages.yml` | **New** - build + deploy `index.css`/tokens to a version-pinned Pages path (T1) |
| `DESIGN.md` | **New** - human design guidance + the four as-built capabilities + catalogue pointer (T2) |
| `AGENTS.md` | **New** - AI/author onboarding: the four switches, per-ring import path, the hard closed-vocabulary rule (T3) |
| `pnpm-workspace.yaml` | Add `examples/*` to the workspace globs (T4) |
| `examples/zha-app-vanilla/package.json` | **New** - Ring-1 package, `workspace:*` dep on the CSS, `build` = vocabulary check (T4) |
| `examples/zha-app-vanilla/index.html` | **New** - on-brand plain-HTML page, four switches set, `<link>` to the bundle (T4) |
| `examples/zha-app-vanilla/check.mjs` | **New** - asserts every class/var used in the HTML exists in the workspace bundle (T4) |
| `examples/zha-app-react/package.json` | **New** - Ring-2 package, React + Vite, `workspace:*` dep on the CSS (T5) |
| `examples/zha-app-react/vite.config.js` | **New** - React plugin, relative base (T5) |
| `examples/zha-app-react/index.html` | **New** - Vite entry, four switches on `<html>` (T5) |
| `examples/zha-app-react/src/main.jsx` | **New** - imports the CSS bundle, mounts `<App>` (T5) |
| `examples/zha-app-react/src/App.jsx` | **New** - small on-brand React page (T5) |
| `examples/zha-app-react/.npmrc` | **New** - GitHub Packages registry line for `@gitzhacode` (T5) |
| `pnpm-lock.yaml` | Updated by `pnpm install` in T5 (React + Vite); commit it (CI uses `--frozen-lockfile`) |

> **No `turbo.json` change needed.** `turbo run build` already runs the `build` script of every workspace package, and `build` `dependsOn: ["^build"]`, so each example builds *after* the tokens/CSS it depends on. Examples have no `test`/`lint` scripts, so Turbo skips them there.

> **`.gitignore` already covers build output** (`dist/`, `node_modules/`, `.turbo/` are ignored globally). The React example's `dist/` and both examples' `node_modules/` will not be committed. Nothing to add.

---

### Task 1: GitHub Pages deploy workflow (version-pinned CSS bundle)

**Deliverable 1.** Write the Actions workflow that builds the packages and publishes `@gitzhacode/zha-ui-css`'s `dist/index.css` (plus `tokens.css`, `tokens.json`, `llms.txt`) to a Pages path pinned by `major.minor`, e.g. `/zha-ui/0.1/index.css`. The version is read from `packages/css/package.json` at deploy time, so the path always matches the shipped version (today `0.0`; `0.1` after the first Version-Packages publish). The workflow triggers on push to `main` (and manual dispatch); since the branch is unmerged and Pages is disabled in Settings, it will not run yet - that is intentional and satisfies "must not depend on Pages being live."

**Files:**
- Create: `.github/workflows/pages.yml`

**Interfaces:**
- Consumes: `pnpm build` output at `packages/css/dist/{index,tokens}.css` and `packages/tokens/dist/{tokens.json,llms.txt}`; the `version` field of `packages/css/package.json`.
- Produces: a Pages site whose layout is `zha-ui/<major.minor>/{index.css,tokens.css,tokens.json,llms.txt}` plus a root `index.html` landing line. No code consumes this; Ring-1 apps `<link>` the published URL.

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/pages.yml`:

```yaml
name: pages
on:
  push:
    branches: [main]
  workflow_dispatch: {}
# Pages must be enabled in repo Settings → Pages (source: GitHub Actions) for the
# deploy step to succeed. Enabling is deferred; until then this workflow is inert.
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build            # builds tokens then css (contrast gate fails closed)
      - name: Assemble version-pinned site
        run: |
          VER=$(node -p "require('./packages/css/package.json').version.split('.').slice(0,2).join('.')")
          DEST="_site/zha-ui/$VER"
          mkdir -p "$DEST"
          cp packages/css/dist/index.css   "$DEST/index.css"
          cp packages/css/dist/tokens.css  "$DEST/tokens.css"
          cp packages/tokens/dist/tokens.json "$DEST/tokens.json"
          cp packages/tokens/dist/llms.txt    "$DEST/llms.txt"
          printf 'zha-ui CSS is published at /zha-ui/%s/index.css\n' "$VER" > _site/index.html
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify the assemble logic locally against a real build**

We cannot run Actions locally, but we can run the workflow's substantive step - version extraction + the file copies - against the local `dist/` to prove the paths and version resolve. Run:

```bash
pnpm build
VER=$(node -p "require('./packages/css/package.json').version.split('.').slice(0,2).join('.')")
DEST="$TMPDIR/zha-pages/_site/zha-ui/$VER"; mkdir -p "$DEST"
cp packages/css/dist/index.css "$DEST/index.css"
cp packages/css/dist/tokens.css "$DEST/tokens.css"
cp packages/tokens/dist/tokens.json "$DEST/tokens.json"
cp packages/tokens/dist/llms.txt "$DEST/llms.txt"
ls "$DEST" && echo "VER=$VER"
```

Expected: `VER=0.0` (current pre-publish version) and `index.css tokens.css tokens.json llms.txt` all listed in `$DEST`. (On Windows Git Bash, `$TMPDIR` may be unset - substitute any scratch path.)

- [ ] **Step 3: Sanity-check the workflow declares the required Pages plumbing**

Run:

```bash
node -e "const y=require('fs').readFileSync('.github/workflows/pages.yml','utf8'); const need=['pages: write','id-token: write','actions/upload-pages-artifact','actions/deploy-pages','pnpm build']; const miss=need.filter(s=>!y.includes(s)); console.log(miss.length?{missing:miss}:'pages workflow OK'); process.exit(miss.length?1:0)"
```

Expected: `pages workflow OK` (exit 0).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/pages.yml
git commit -m "ci: deploy version-pinned zha-ui CSS bundle to GitHub Pages"
```

---

### Task 2: `DESIGN.md` - human design guidance + as-built capabilities

**Deliverable 2a.** Write the human-facing design guide. It teaches *when* to reach for each axis and documents the four as-built capabilities the spec predates (handoff §6): the distinct black-first `data-surface="brand"`, the now-functional `data-density="compact"`, the oklch `@supports` hex fallback (free), and the `@media print` fallback (free). For the enumerated token/class list it points at the canonical sources (`AI-USAGE.md` and the shipped `llms.txt`) rather than duplicating them, so the vocabulary lives in two places, not three.

**Files:**
- Create: `DESIGN.md`

**Interfaces:**
- Consumes: nothing (prose). References `AI-USAGE.md` and `packages/tokens/dist/llms.txt` as the canonical vocabulary.
- Produces: a doc `AGENTS.md` (T3) links to. Section anchors used by T3: `#the-four-switches`, `#the-token--class-vocabulary`.

- [ ] **Step 1: Write `DESIGN.md`**

Create `DESIGN.md`:

```markdown
# Designing with zha-ui

How to make on-brand, accessible ZHA apps with the design system. This is the
*human* guide - for the AI onboarding rules see [`AGENTS.md`](./AGENTS.md); for the
exhaustive token/class list see [`AI-USAGE.md`](./AI-USAGE.md) and the canonical
`llms.txt` shipped in `@gitzhacode/zha-ui-tokens`.

## The mental model

You never hand-style. You declare **who you are** and **what kind of surface** you
are building, and the system resolves every colour, type size, space, and state -
on brand, with colour contrast enforced on every build.

## The four switches

Set on your `<html>` tag; everything inside inherits.

| Attribute | Says | Options |
|---|---|---|
| `data-brand` | which team | `es` (teal, confirmed) · `code` · `analytics` · `bim` · `abps` · `meta` · `zh-cluster` |
| `data-theme` | light or dark | `light` · `dark` |
| `data-surface` | marketing vs. working app | `brand` (black-first) · `work` (light default) |
| `data-density` | how tight | `comfortable` (default) · `compact` |

### `data-surface`: when "brand" vs "work"

- **`work`** - the light default. Use for dashboards, forms, data tables, internal
  tools - anything someone *operates*. Layered light panels tuned for legibility.
- **`brand`** - a **distinct black-first "Black Steel" marketing surface** (not a
  recolour of dark mode). Near-pure-black surfaces, crisp white headlines. Use for
  landing pages, hero sections, marketing/launch screens - anything someone *reads*
  and should feel the ZHA identity. Don't build dense working UI on it.

### `data-density`: when "compact"

`compact` is **functional**, not cosmetic - it drops control height via `--control-h`
from 44px (comfortable) to 36px, with tighter vertical padding. Use it for
information-dense screens (data tables, admin panels, side-by-side editors) where
44px targets waste vertical space. 36px stays at/above the WCAG 2.5.8 target-size
floor. Leave it at `comfortable` for touch-first or public-facing pages.

## Two things you get for free

- **oklch with an sRGB hex fallback.** Colours ship as `oklch()` wrapped in
  `@supports`, with a hex base underneath. On engines without oklch - Citrix,
  kiosks, BIM/CAD webviews, headless-Chrome PDF export - colour degrades cleanly to
  sRGB hex instead of vanishing. You write nothing; it's in the bundle.
- **Print legibility.** A `@media print` block forces any surface (light, dark, or
  brand) to black-on-white, so a dark or brand page never prints ghosted or blank.
  Again, free - no per-page print CSS needed.

## The token + class vocabulary

Use **only** the published CSS variables and primitive classes. Never invent a
custom property (e.g. `--color-primary`) and never hard-code a hex value in your
app - that is the one rule that keeps output on brand. The complete list lives in:

- [`AI-USAGE.md`](./AI-USAGE.md) - the class cheat-sheet and grouped variable list.
- `node_modules/@gitzhacode/zha-ui-tokens/llms.txt` - the canonical machine-readable
  token list (paste into an AI assistant).

Primitive classes: `.surface .card .btn` (+ `--primary/--secondary/--ghost/--danger`)
`.input .select .chip .icon-btn .skeleton .sr-only`, plus the logo/lockup
(`.zha-logo`, `.zha-lockup`).

## Which ring are you in?

- **Ring 1 - plain HTML, no build.** `<link>` the hosted `index.css`, set the four
  switches, use the classes. Start here. See `examples/zha-app-vanilla`.
- **Ring 2 - React + Vite.** Move here only when an app needs multiple views/routing
  or shared components. `import '@gitzhacode/zha-ui-css/index.css'`. Same brand, same
  classes - graduating rings never means restyling. See `examples/zha-app-react`.

A non-coder who never leaves Ring 1 still ships a fully on-brand, accessible app.

## Conventions

- The firm is **"ZHA"** - always; never spell out its former name.
- ZHA Sans (`--font-secondary`) is always regular weight and upright - never bold or
  italic.
- Sentence case for headings and body; UPPERCASE only for tiny chip labels.
- For a primary button use `.btn--primary` (AA-safe `--accent-fill`). Never put white
  text on bare `--accent`.
```

- [ ] **Step 2: Verify the as-built capabilities are all covered and no banned name slipped in**

Run:

```bash
node -e "const d=require('fs').readFileSync('DESIGN.md','utf8'); const need=['data-surface',\"data-density\",'--control-h','@supports','@media print','llms.txt']; const miss=need.filter(s=>!d.includes(s)); const banned=/zaha[ -]?hadid/i.test(d); console.log({miss,banned}); process.exit(miss.length||banned?1:0)"
```

Expected: `{ miss: [], banned: false }` (exit 0).

- [ ] **Step 3: Commit**

```bash
git add DESIGN.md
git commit -m "docs: add DESIGN.md design guide (surface/density, oklch + print as-built)"
```

---

### Task 3: `AGENTS.md` - AI/author onboarding with the hard closed-vocabulary rule

**Deliverable 2b.** Write the repo-root `AGENTS.md` (≤150 lines): the four `<html>` switches, the single import/link path per ring, and the hard rule referencing the closed token list - *"Use only these CSS variables and classes. Never invent a CSS custom property or hard-code a hex value."* This kills the dominant AI failure mode (fabricating plausible-but-fake tokens). It points at `llms.txt` as canonical and at `DESIGN.md` (T2) for the rationale.

**Files:**
- Create: `AGENTS.md`

**Interfaces:**
- Consumes: `DESIGN.md` (created in T2) and `packages/tokens/dist/llms.txt` (must exist - produced by `pnpm build`).
- Produces: the AI-agent entry point at repo root. No code consumes it.

- [ ] **Step 1: Write `AGENTS.md`**

Create `AGENTS.md`:

```markdown
# AGENTS.md - building ZHA apps with zha-ui

You are building a ZHA web app on the **zha-ui** design system. Follow these rules.

## The one hard rule

**Use only the published zha-ui CSS variables and primitive classes. Never invent a
CSS custom property (e.g. `--color-primary`). Never hard-code a hex value.** Every
colour, size, space, and state already exists as a token - if you reach for a literal
hex or a made-up variable, you are off brand and the build may reject it.

The canonical, complete vocabulary is:

- `node_modules/@gitzhacode/zha-ui-tokens/llms.txt` - machine-readable token list (read this first).
- [`AI-USAGE.md`](./AI-USAGE.md) - class cheat-sheet + grouped variables.
- [`DESIGN.md`](./DESIGN.md) - when to use each axis and capability (human guide).

## Setup - pick your ring, link/import once

- **Ring 1 (plain HTML, no build):** add to `<head>`:
  ```html
  <link rel="stylesheet" href="https://<pages-host>/zha-ui/0.1/index.css">
  ```
  (Ask your developer for the real `<pages-host>` once Pages is enabled. Pin the
  `major.minor` so a system update can never silently break your page.)
- **Ring 2 (React + Vite):** install `@gitzhacode/zha-ui-css` (needs a one-time
  `.npmrc` + `read:packages` PAT - see `README.md`), then:
  ```js
  import '@gitzhacode/zha-ui-css/index.css';
  ```

## Declare who you are - set on `<html>`

```html
<html data-brand="es" data-theme="light" data-surface="work" data-density="comfortable">
```

| Attribute | Options | Meaning |
|---|---|---|
| `data-brand` | `es` (teal, confirmed) · `code` · `analytics` · `bim` · `abps` · `meta` · `zh-cluster` | your team's accent |
| `data-theme` | `light` · `dark` | light or dark |
| `data-surface` | `work` · `brand` | `work` = light default for dashboards/forms; `brand` = black-first marketing surface |
| `data-density` | `comfortable` · `compact` | `compact` shrinks controls 44px→36px for dense screens |

Set them once; everything inside inherits.

## Use the primitives

`.surface .card .btn` (+ `.btn--primary .btn--secondary .btn--ghost .btn--danger`)
`.input .select .chip .icon-btn .skeleton .sr-only`, plus `.zha-logo` and the
`.zha-lockup` markup. For the main call-to-action use `.btn--primary` (AA-safe).

## You get these for free (don't reimplement)

- **oklch with sRGB hex fallback** via `@supports` - colour still works on Citrix,
  kiosks, BIM/CAD webviews, and PDF/headless engines.
- **`@media print`** - any surface prints black-on-white automatically.

## Naming & type rules

- The firm is **"ZHA"** - always. Never spell out its former name.
- ZHA Sans (`--font-secondary`) is always regular weight and upright - never bold or italic.
- Sentence case for headings/body; UPPERCASE only for tiny chip labels.

## Working examples in this repo

- `examples/zha-app-vanilla` - Ring 1, plain HTML.
- `examples/zha-app-react` - Ring 2, React + Vite.
```

- [ ] **Step 2: Verify the hard rule + ring paths are present, length ≤150 lines, no banned name**

Run:

```bash
node -e "const f='AGENTS.md',a=require('fs').readFileSync(f,'utf8'); const lines=a.split(/\r?\n/).length; const need=['Never invent','Never hard-code','llms.txt','zha-ui-css/index.css','data-brand']; const miss=need.filter(s=>!a.includes(s)); const banned=/zaha[ -]?hadid/i.test(a); console.log({lines,miss,banned}); process.exit(miss.length||banned||lines>150?1:0)"
```

Expected: `{ lines: <=150, miss: [], banned: false }` (exit 0).

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: add AGENTS.md AI onboarding (closed-vocabulary rule, per-ring path)"
```

---

### Task 4: `examples/zha-app-vanilla` - Ring 1 starter, wired to the workspace

**Deliverable 3a.** Create the Ring-1 starter: a single on-brand `index.html` that `<link>`s the CSS bundle and sets the four switches - no build step for the author. To wire it to the workspace (so it can't drift) and to catch the dominant AI failure mode, the package depends on `@gitzhacode/zha-ui-css` via `workspace:*` and its `build` script runs `check.mjs`, which asserts every class and `var(--…)` used in the HTML exists in the current bundle. CI runs this on every change.

**Files:**
- Modify: `pnpm-workspace.yaml`
- Create: `examples/zha-app-vanilla/package.json`
- Create: `examples/zha-app-vanilla/index.html`
- Create: `examples/zha-app-vanilla/check.mjs`

**Interfaces:**
- Consumes: `@gitzhacode/zha-ui-css/index.css` resolved from the workspace (`require.resolve`).
- Produces: a buildable workspace package `zha-app-vanilla` whose `build` exits non-zero if `index.html` uses any class/variable not defined in the bundle.

- [ ] **Step 1: Add `examples/*` to the workspace**

Replace the contents of `pnpm-workspace.yaml` with:

```yaml
packages:
  - "packages/*"
  - "examples/*"
```

- [ ] **Step 2: Create the Ring-1 package manifest**

Create `examples/zha-app-vanilla/package.json`:

```json
{
  "name": "zha-app-vanilla",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "build": "node check.mjs"
  },
  "dependencies": {
    "@gitzhacode/zha-ui-css": "workspace:*"
  }
}
```

- [ ] **Step 3: Create the on-brand page**

Create `examples/zha-app-vanilla/index.html`:

```html
<!doctype html>
<html lang="en" data-brand="es" data-theme="light" data-surface="work" data-density="comfortable">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ZHA app - vanilla starter</title>
  <!-- Production: link the version-pinned Pages bundle (fill in <pages-host> once
       Pages is enabled, and match the deployed major.minor):
       <link rel="stylesheet" href="https://<pages-host>/zha-ui/0.1/index.css"> -->
  <!-- Local preview after `pnpm build` (the dist/ is gitignored, built by the repo): -->
  <link rel="stylesheet" href="../../packages/css/dist/index.css">
</head>
<body>
  <main class="surface" style="max-width: 40rem; margin: var(--space-6) auto; padding: var(--space-6)">
    <span class="zha-lockup">
      <span class="zha-lockup__zha">ZHA</span><span class="zha-lockup__team">ES</span>
    </span>
    <div class="card" style="margin-top: var(--space-5)">
      <h1 style="font: var(--fs-h2)/var(--leading-display) var(--font-secondary); color: var(--text-strong)">
        Vanilla starter
      </h1>
      <p style="color: var(--text-default)">
        Plain HTML on the ZHA brand - no build step. Describe your app to your AI
        editor and keep to the classes and variables in <code>AI-USAGE.md</code>.
      </p>
      <label class="sr-only" for="q">Search</label>
      <input class="input" id="q" placeholder="Search projects">
      <p style="margin-top: var(--space-4)">
        <button class="btn btn--primary">Explore</button>
        <button class="btn btn--ghost">Cancel</button>
        <span class="chip">ES</span>
      </p>
    </div>
  </main>
</body>
</html>
```

- [ ] **Step 4: Create the vocabulary check**

Create `examples/zha-app-vanilla/check.mjs`:

```js
// ponytail: substring presence check against the built bundle - the point is to
// catch a fabricated class/variable, not to parse CSS. Swap for a real CSS parser
// only if a false positive ever bites.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const bundle = readFileSync(require.resolve('@gitzhacode/zha-ui-css/index.css'), 'utf8');
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');

const classes = new Set();
for (const m of html.matchAll(/class="([^"]+)"/g))
  for (const c of m[1].split(/\s+/)) if (c) classes.add(c);

const vars = new Set();
for (const m of html.matchAll(/var\((--[\w-]+)/g)) vars.add(m[1]);

const missing = [];
for (const c of classes) if (!bundle.includes('.' + c)) missing.push('.' + c);
for (const v of vars) if (!bundle.includes(v)) missing.push(v);

if (missing.length) {
  console.error('zha-app-vanilla: unknown zha-ui vocabulary in index.html:', missing);
  process.exit(1);
}
console.log(`zha-app-vanilla: ${classes.size} classes + ${vars.size} vars - all in the bundle ✓`);
```

- [ ] **Step 5: Install (link the new workspace package) and build**

Run:

```bash
pnpm install
pnpm build
```

Expected: install succeeds (the new package is linked; lockfile unchanged - no new external deps). `pnpm build` builds tokens → css → `zha-app-vanilla`, printing `zha-app-vanilla: N classes + M vars - all in the bundle ✓` and `Contrast matrix: all pairs pass WCAG AA.`

- [ ] **Step 6: Prove the check fails on a fabricated token (then revert)**

Run:

```bash
node -e "let h=require('fs').readFileSync('examples/zha-app-vanilla/index.html','utf8'); require('fs').writeFileSync('examples/zha-app-vanilla/index.html', h.replace('btn--primary','btn--bogus'));"
pnpm --filter zha-app-vanilla build; echo "exit=$?"
git checkout -- examples/zha-app-vanilla/index.html
```

Expected: the build prints `unknown zha-ui vocabulary in index.html: [ '.btn--bogus' ]` and `exit=1`, then the file is restored. (Confirms the drift guard has teeth.)

- [ ] **Step 7: Commit**

```bash
git add pnpm-workspace.yaml examples/zha-app-vanilla/
git commit -m "feat(examples): add Ring-1 vanilla starter wired to workspace CSS + drift check"
```

---

### Task 5: `examples/zha-app-react` - Ring 2 starter (React + Vite, no substrate)

**Deliverable 3b.** Create the Ring-2 starter: React 18 + Vite importing `@gitzhacode/zha-ui-css/index.css`, with the four switches on `<html>`. **No component/UI substrate** - React Aria / Base UI / vanilla is an OPEN Phase-3 decision and must not be baked in. Wired via `workspace:*`; `vite build` runs in CI (`pnpm build`) so the app can never drift from the current packages. Adds React + Vite to the lockfile (expected) - commit `pnpm-lock.yaml`.

**Files:**
- Create: `examples/zha-app-react/package.json`
- Create: `examples/zha-app-react/.npmrc`
- Create: `examples/zha-app-react/vite.config.js`
- Create: `examples/zha-app-react/index.html`
- Create: `examples/zha-app-react/src/main.jsx`
- Create: `examples/zha-app-react/src/App.jsx`
- Modify: `pnpm-lock.yaml` (via `pnpm install`)

**Interfaces:**
- Consumes: `@gitzhacode/zha-ui-css/index.css` (workspace), `react`, `react-dom`, `vite`, `@vitejs/plugin-react`.
- Produces: a buildable workspace package `zha-app-react`; `vite build` emits `dist/index.html` + a hashed CSS asset containing the zha tokens.

- [ ] **Step 1: Create the package manifest**

Create `examples/zha-app-react/package.json`:

```json
{
  "name": "zha-app-react",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@gitzhacode/zha-ui-css": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create the GitHub Packages auth note**

Create `examples/zha-app-react/.npmrc`:

```
@gitzhacode:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

(Inside the monorepo the `workspace:*` link resolves locally and no token is needed; this line is what a *copied-out* standalone app needs - set `GITHUB_TOKEN` to a PAT with `read:packages`. See `README.md`.)

- [ ] **Step 3: Create the Vite config**

Create `examples/zha-app-react/vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' so the static output works from any sub-path (e.g. a Pages project dir).
export default defineConfig({ plugins: [react()], base: './' });
```

- [ ] **Step 4: Create the HTML entry with the four switches**

Create `examples/zha-app-react/index.html`:

```html
<!doctype html>
<html lang="en" data-brand="es" data-theme="light" data-surface="work" data-density="comfortable">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ZHA app - React starter</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 5: Create the React entry (imports the CSS bundle)**

Create `examples/zha-app-react/src/main.jsx`:

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@gitzhacode/zha-ui-css/index.css'; // tokens + primitives + lockup - the whole brand
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 6: Create a small on-brand component (no UI library)**

Create `examples/zha-app-react/src/App.jsx`:

```jsx
// Ring 2 = React + Vite + zha-ui CSS only. No component substrate - that is an
// open Phase-3 decision. Build UI from the primitive classes, same as Ring 1.
export default function App() {
  return (
    <main className="surface" style={{ maxWidth: '40rem', margin: 'var(--space-6) auto', padding: 'var(--space-6)' }}>
      <span className="zha-lockup">
        <span className="zha-lockup__zha">ZHA</span>
        <span className="zha-lockup__team">ES</span>
      </span>
      <div className="card" style={{ marginTop: 'var(--space-5)' }}>
        <h1 style={{ font: 'var(--fs-h2)/var(--leading-display) var(--font-secondary)', color: 'var(--text-strong)' }}>
          React starter
        </h1>
        <p style={{ color: 'var(--text-default)' }}>
          Same brand, same classes as Ring 1 - now with React + Vite for multi-view
          apps. Graduating rings never means restyling.
        </p>
        <p style={{ marginTop: 'var(--space-4)' }}>
          <button className="btn btn--primary">Explore</button>{' '}
          <button className="btn btn--ghost">Cancel</button>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Install the new deps and build**

Run:

```bash
pnpm install
pnpm build
```

Expected: `pnpm install` resolves React + Vite and updates `pnpm-lock.yaml`. `pnpm build` builds tokens → css → `zha-app-react` (`vite build`), emitting `examples/zha-app-react/dist/`. The contrast gate still prints `Contrast matrix: all pairs pass WCAG AA.`

- [ ] **Step 8: Verify the built app bundles the zha tokens**

Run:

```bash
node -e "const fs=require('fs'),p='examples/zha-app-react/dist/assets'; const css=fs.readdirSync(p).find(f=>f.endsWith('.css')); const ok=css&&fs.readFileSync(p+'/'+css,'utf8').includes('--bg-page'); const html=fs.existsSync('examples/zha-app-react/dist/index.html'); console.log({css,tokensBundled:!!ok,html}); process.exit(ok&&html?0:1)"
```

Expected: `{ css: '<hashed>.css', tokensBundled: true, html: true }` (exit 0) - Vite bundled the workspace CSS (so `--bg-page` is present) and emitted the entry HTML.

- [ ] **Step 9: Commit (including the updated lockfile)**

```bash
git add examples/zha-app-react/ pnpm-lock.yaml
git commit -m "feat(examples): add Ring-2 React+Vite starter (zha-ui CSS only, no substrate)"
```

---

## Self-review

- **Deliverable coverage:** Deliverable 1 (Pages workflow) → T1. Deliverable 2 (`AGENTS.md` + `DESIGN.md`) → T2 (`DESIGN.md`) + T3 (`AGENTS.md`). Deliverable 3 (two in-repo starters) → T4 (vanilla) + T5 (React). Handoff §6 as-built capabilities (`data-surface="brand"`, `data-density="compact"`, oklch `@supports` fallback, `@media print`) are all taught in both T2 and T3, and T2 Step 2 / T3 Step 2 assert their presence. ✅
- **Scope discipline:** No merge to `main`, no publish, no Pages-enable, no Tailwind, no component library, no MCP - all confirmed out of scope and absent from the tasks. The React starter bakes in **no** substrate (T5 Step 6 comment states the open decision). ✅
- **Sequencing:** T1 independent. T3 links `DESIGN.md`, so T2 precedes T3. T5 reuses the `examples/*` workspace glob added in T4, so T4 precedes T5. Order T1→T5 as written; T2/T3 could precede T1 with no effect. ✅
- **Drift guards are real:** T4 Step 6 mutates the HTML to a bogus class and proves the check exits 1 before reverting; T5 Step 8 confirms Vite bundled `--bg-page` from the workspace package. Both tie the examples to the live packages. ✅
- **Lockfile / CI:** Only T5 adds external deps (React + Vite); its commit includes `pnpm-lock.yaml` so CI's `--frozen-lockfile` stays green. T4 adds no external deps. ✅
- **Name + vocabulary rules:** T2/T3 verification greps for the firm's former spelled-out name and fails on a hit; examples use only published classes/vars (enforced by T4's check). `--font-secondary` is referenced for headings with no bold/italic. ✅
- **Type/name consistency:** Package names `zha-app-vanilla` / `zha-app-react` are used identically in their manifests, the `pnpm --filter` commands, and the commits. The import path `@gitzhacode/zha-ui-css/index.css` matches the package's `exports`. The Pages path shape `zha-ui/<major.minor>/index.css` is identical in T1 and the `AGENTS.md` Ring-1 `<link>`. ✅

## Not in this plan (deliberately)

- **Enabling GitHub Pages** in repo Settings, the **first publish**, and the **merge to `main`** - maintainer-gated; the workflow is written but inert until then.
- **The `@gitzhacode/zha-ui-react` component library, the Ring-3 Tailwind bridge, and an MCP server** - Phase 3/4; explicitly deferred by the spec.
- **Deduplicating `AI-USAGE.md` ↔ `llms.txt`** (spec §7 drift note) - both already exist and agree; generating one from the other is a separate maintenance task, not a rollout blocker. `AGENTS.md`/`DESIGN.md` name `llms.txt` as canonical to set the direction without doing the codegen now.
- **Graduating `zha-app-react` to a standalone GitHub template repo** - happens later, when a team needs to bootstrap; the in-repo example is the source it graduates from.

## Execution Handoff

Plan complete and saved to `docs/plans/2026-06-22-zha-ui-app-stack-rollout.md`. Two execution options:

1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - execute tasks in this session via executing-plans, batch execution with checkpoints.

Which approach?
```
