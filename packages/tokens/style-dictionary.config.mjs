import StyleDictionary from 'style-dictionary';
import { readFileSync, writeFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { oklchFromHex } from './sd-transforms.mjs';

// ── Tailwind preset type declaration ──────────────────────────────────────────
// Written after Build 7 so attw can resolve types for the ./tailwind export.
function writeTailwindPresetDts() {
  const dts = [
    'declare const preset: { theme: { extend: { colors: Record<string, string> } } };',
    'export default preset;',
    '',
  ].join('\n');
  writeFileSync('dist/tailwind-preset.d.ts', dts, 'utf8');
}

// ── Custom format: Tailwind preset (semantic colour tokens → CSS vars) ─────────

StyleDictionary.registerFormat({
  name: 'zha/tailwind-preset',
  format: ({ dictionary }) => {
    const colors = {};
    dictionary.allTokens
      .filter((t) => t.$type === 'color' && t.path[0] !== 'color')
      .forEach((t) => {
        colors[t.name] = `var(--${t.name})`;
      });
    return `export default { theme: { extend: { colors: ${JSON.stringify(colors, null, 2)} } } };\n`;
  },
});

// ── Custom format: llms.txt - machine-readable token + class summary ──────────

StyleDictionary.registerFormat({
  name: 'zha/llms',
  format: ({ dictionary }) => {
    // Every non-colour token, with its value (space/radius included - an agent reading llms.txt
    // alone had never seen --space-4). Colour tokens stay name-only: their values differ per theme.
    const semantic = dictionary.allTokens.filter((t) => t.path[0] !== 'color');
    // Colour tokens - and anything carrying a colour literal or gradient (focus ring, shadows, gradients) -
    // stay name-only: their values differ per theme and the file must never hand an agent a hex.
    const hasColour = (v) => /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(|gradient\(/i.test(String(v));
    // Deprecations travel with the name, so an agent reading llms.txt alone never adopts a retired token.
    const DEPRECATED = { 'focus-ring': 'the package paints focus as an outline; kept for consumers that referenced it' };
    const line = (t) => (t.$type === 'color' || hasColour(t.$value) ? `--${t.name}` : `--${t.name}: ${t.$value}`) + (DEPRECATED[t.name] ? ` (deprecated: ${DEPRECATED[t.name]})` : '');
    return [
      '# zha-ui design tokens (for AI assistants)',
      'Set data-theme="light|dark", data-brand="zha-app" (firm default) or a team: es (confirmed pair), code|analytics|bim|abps|meta|zh-cluster (provisional), data-surface="brand|work" on <html>.',
      'Use these CSS variables (do not invent colours):',
      ...semantic.map(line),
      '',
      'Gradients are decorative only: --grad-hero-* are frozen black-first marketing hero backgrounds (hero text via --text-* vars, never literal #fff); --grad-spectrum is the 12-hue sweep - apply it via the .grad-spectrum class. --grad-pair-* are the 16 vetted but un-assigned signature-form pool entries in four families - journeys (polar blaze reef nova orchid), conics (beacon sundial prism verdigris), auroras (borealis nebula abyss furnace: dark glow panels, text via --text-* only), fields (signal terra regatta) - apply ONLY via the .grad-pair-* classes (the classes own the aurora floors and oklch swaps; never use any *-oklch gradient var directly - no fallback on engines without in-oklch gradients); pool entries are NOT team identities until confirmed. The team wardrobe .accent-grad / .accent-grad-aurora / .accent-grad-conic / .accent-grad-duo renders live from the confirmed pair. --grad-wash / --grad-glow / --brand-grad-subtle are the only gradients for work surfaces. Never behind working UI, never a heading fill.',
      'Charts: --chart-cat-1..8 are the ONLY colours for generic data series - assign in fixed slot order, never cycle, never re-order between themes; a 9th series folds into --chart-cat-other ("Other") or the chart facets. --chart-seq-1..6 = magnitude (single hue; "more" = more contrast vs the surface in both themes); --chart-div-neg-3..pos-3 = polarity (--chart-div-mid is the neutral midpoint, never a hue). Data keyed BY building typology uses --typology-* (+ --typology-*-text for readable text) instead of the cat slots. Chart text/grid always --chart-text / --chart-text-strong / --chart-grid / --chart-axis - text never wears a series colour.',
      'Primitive classes (from @gitzhacode/zha-ui-css): the generated, always-current list is that package\'s dist/classes.txt (export "./classes.txt"); roles, markup, knobs and page skeletons are in the zha-ui skill (skills/zha-ui/SKILL.md and reference.md in the GitZHACODE/zha-ui repo; npx skills add GitZHACODE/zha-ui installs it).',
    ].join('\n');
  },
});

// ── Custom transforms ──────────────────────────────────────────────────────────

// Convert hex colours to oklch
StyleDictionary.registerTransform({
  name: 'color/oklch',
  type: 'value',
  filter: (t) => t.$type === 'color' && typeof t.$value === 'string' && t.$value.startsWith('#'),
  transform: (t) => oklchFromHex(t.$value),
});

// Drop trailing "-default" from kebab-cased token names ONLY when the raw
// last path segment is exactly "DEFAULT" (Style Dictionary's collapse sentinel).
//   accent.DEFAULT → --accent       (collapses as intended)
//   border.default → --border-default  (lowercase "default" is a real name, kept)
StyleDictionary.registerTransform({
  name: 'name/no-default',
  type: 'name',
  transform: (t) => {
    const name = t.path.join('-').toLowerCase();
    return t.path[t.path.length - 1] === 'DEFAULT' ? name.replace(/-default$/, '') : name;
  },
});

// ── Custom format: opacity-tint ladder for typology hues ─────────────────────

StyleDictionary.registerFormat({
  name: 'zha/typology-tints',
  format: ({ dictionary }) => {
    const hues = dictionary.allTokens.filter(
      (t) => t.path[0] === 'color' && t.path[1] === 'typology',
    );
    const lines = [':root {'];
    for (const t of hues) {
      const v = `var(--${t.name})`;
      lines.push(`  --typology-${t.path[2]}-100: ${v};`);
      for (const pct of [75, 50, 25])
        lines.push(
          `  --typology-${t.path[2]}-${pct}: color-mix(in srgb, ${v} ${pct}%, transparent);`,
        );
    }
    lines.push('}\n');
    return lines.join('\n');
  },
});

const HEX_TRANSFORMS = ['name/no-default'];
const OKLCH_TRANSFORMS = ['name/no-default', 'color/oklch'];

// Build one colour-bearing selector block twice: a hex base (the universal
// fallback) and an oklch overlay. The :root overlay carries only raw colour
// values (its aliases inherit fine from the hex base), but OVERRIDE blocks must
// also re-emit their {alias} tokens (oklchKeepRefs) - otherwise the oklch :root's
// raw LIGHT values win the cascade inside @supports and the override is lost
// (e.g. dark --text-default fell back to light → dark-on-dark, invisible text).
// The caller wraps the overlays in a single @supports (color: oklch()) block.
async function buildColorBlock({ name, source, selector, outputFilter, oklchKeepRefs = false }) {
  const make = (transforms, suffix, extra) =>
    // ponytail: collisions are byte-reproducible log noise (audit-verified); errors
    // still throw. Re-enable warnings if a new source file changes resolved values.
    new StyleDictionary({
      log: { warnings: 'disabled' },
      source,
      platforms: {
        css: {
          transforms,
          buildPath: 'dist/',
          options: { outputReferences: true },
          files: [{
            destination: `tokens-${name}${suffix}.css`,
            format: 'css/variables',
            filter: extra ? (t) => outputFilter(t) && extra(t) : outputFilter,
            options: { outputReferences: true, selector },
          }],
        },
      },
    });
  // SD writes no file when the filter matches nothing (zha-app is name-only, so it has no oklch
  // overlay): clear any stale overlay first and read it only if this build wrote one.
  const oklchPath = `dist/tokens-${name}-oklch.css`;
  rmSync(oklchPath, { force: true });
  await make(HEX_TRANSFORMS, '').buildAllPlatforms();
  await make(OKLCH_TRANSFORMS, '-oklch', (t) =>
    t.$type === 'color' && (oklchKeepRefs || !String(t.original?.$value ?? '').startsWith('{')),
  ).buildAllPlatforms();
  return {
    hex: readFileSync(`dist/tokens-${name}.css`, 'utf8'),
    oklch: existsSync(oklchPath) ? readFileSync(oklchPath, 'utf8') : '',
  };
}

// Architecture note: this file runs SEVERAL StyleDictionary instances (base, dark,
// brand surface, density, typology tints, JS/JSON, a kebab instance, and one per
// brand file) and concatenates their selector-scoped outputs into dist/tokens.css.
// This is intentional - SD v4's `css/variables` format cannot `append`, so a single
// instance can't emit multiple `[data-*]` blocks. Don't collapse it to one instance.

// ── Build 1: Base - primitives + core semantic + light defaults → :root ───────
const base = await buildColorBlock({
  name: 'base',
  source: [
    'src/primitive/*.tokens.json',
    'src/semantic/core.tokens.json',
    'src/semantic/light.tokens.json',
    'src/semantic/typography.tokens.json',
  ],
  selector: ':root',
  outputFilter: (t) => !t.filePath.includes('/density.') && !t.filePath.includes('/brand/'),
});

// ── Build 2: Dark overrides ──────────────────────────────────────────────────
const dark = await buildColorBlock({
  name: 'dark',
  source: [
    'src/primitive/*.tokens.json',
    'src/semantic/core.tokens.json',
    'src/semantic/light.tokens.json',
    'src/semantic/dark.tokens.json',
  ],
  selector: '[data-theme="dark"]',
  outputFilter: (t) => t.filePath.includes('/dark.'),
  oklchKeepRefs: true,
});

// ── Build 2b: Brand surface - distinct black-first marketing palette ──────────
const brandSurface = await buildColorBlock({
  name: 'brand-surface',
  source: ['src/primitive/*.tokens.json', 'src/semantic/brand-surface.tokens.json'],
  selector: '[data-surface="brand"]',
  outputFilter: (t) => t.filePath.includes('/brand-surface.'),
  oklchKeepRefs: true,
});

// ── Build 2c: Light counter-scope - re-asserts the :root light values so a nested
// [data-theme="light"] island counters a dark/brand ancestor. Light is ALSO the
// :root default (Build 1); this block exists only so light nests both ways. It
// mirrors the dark build's shape (source primitives+core+light, emit only light's
// tokens) and MUST be concatenated AFTER brand-surface in BOTH cascades so a
// same-element data-theme="light" + data-surface="brand" resolves to light. ─────
const light = await buildColorBlock({
  name: 'light',
  source: [
    'src/primitive/*.tokens.json',
    'src/semantic/core.tokens.json',
    'src/semantic/light.tokens.json',
  ],
  selector: '[data-theme="light"]',
  outputFilter: (t) => t.filePath.includes('/light.'),
  oklchKeepRefs: true,
});

// ── Build 3: Density tokens ───────────────────────────────────────────────────

const sdDensity = new StyleDictionary({
  log: { warnings: 'disabled' },
  source: ['src/semantic/density.tokens.json'],
  platforms: {
    css: {
      transforms: OKLCH_TRANSFORMS,
      buildPath: 'dist/',
      files: [
        {
          destination: 'tokens-density.css',
          format: 'css/variables',
          options: { selector: '[data-density="compact"]' },
        },
      ],
    },
  },
});
await sdDensity.buildAllPlatforms();

// ── Build 4: Brand axis - one [data-brand="<name>"] block per brand file ──────
//
// Each brand file redefines `accent.*` (DEFAULT/fill/subtle/on/hover) + `brand.*`. We
// source the PRIMITIVES + that ONE brand file only - NOT core/light/dark -
// because core also defines `accent.*` and merging the two would collide
// (last-write-wins on the same token path). Sourcing primitives keeps brand
// values that are primitive refs (e.g. {color.accent.teal}) rendering as
// var(--color-...) via outputReferences, resolving against :root at runtime.
// The output filter keeps only the brand file's tokens, so referenced
// primitives are NOT re-emitted in the brand block - they live in :root.
//
// zha-app (the firm brand, also the :root default) is per-theme: its accent
// lives in the light/dark/brand-surface theme files and zha-app.tokens.json
// carries brand.name ONLY. A [data-brand] block wins over [data-theme="dark"]
// (equal specificity, emitted later), so an accent here would paint the light
// ink fill on dark pages. Team files pin accent.on (white) and accent.hover for
// the same reason: the dark cascade now carries a black label and a flat hover.
// accent.hover is typed "color" (not "other") so the brand's oklch overlay
// re-emits it; otherwise the later oklch dark/brand-surface/light blocks win.
//
// Island reach: each block also matches a nested theme/surface island that sets
// no brand of its own. (0,3,0) beats the island's own [data-theme]/[data-surface]
// block (0,1,0), so inside an ES page a dark or brand island shows teal (the
// brand's single accent), not teal-light - what a same-element
// data-brand="es" data-theme="dark" page already did. :not([data-brand]) leaves a
// nested other-team island to its own block.

const brandFiles = readdirSync('src/brand')
  .filter((f) => f.endsWith('.tokens.json'))
  .map((f) => f.replace(/\.tokens\.json$/, ''))
  .sort();

const brandBlocks = [];
for (const brand of brandFiles) {
  brandBlocks.push(await buildColorBlock({
    name: `brand-${brand}`,
    source: ['src/primitive/*.tokens.json', `src/brand/${brand}.tokens.json`],
    selector: `[data-brand="${brand}"], [data-brand="${brand}"] :is([data-theme], [data-surface]):not([data-brand])`,
    outputFilter: (t) => t.filePath.includes(`/brand/${brand}.`),
    oklchKeepRefs: true,
  }));
}

// ── Build 5: Typology-tints (custom format, no selector wrapping needed) ──────

const sdTints = new StyleDictionary({
  log: { warnings: 'disabled' },
  source: ['src/primitive/color.tokens.json'],
  platforms: {
    css: {
      transforms: OKLCH_TRANSFORMS,
      buildPath: 'dist/',
      files: [{ destination: 'tokens-tints.css', format: 'zha/typology-tints' }],
    },
  },
});
await sdTints.buildAllPlatforms();

// ── Build 6: JS / JSON outputs - full token set ───────────────────────────────
//
// Sources the same set as Build 1 (primitives + core + light + typography) so
// semantic colour tokens are present. The `js` transformGroup resolves all
// references to their final values.

const sdJs = new StyleDictionary({
  log: { warnings: 'disabled' },
  source: [
    'src/primitive/*.tokens.json',
    'src/semantic/core.tokens.json',
    'src/semantic/light.tokens.json',
    'src/semantic/typography.tokens.json',
  ],
  platforms: {
    js: {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [
        { destination: 'tokens.js', format: 'javascript/esm' },
        { destination: 'tokens.d.ts', format: 'typescript/module-declarations' },
      ],
    },
    json: {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [{ destination: 'tokens.json', format: 'json/flat' }],
    },
  },
});
await sdJs.buildAllPlatforms();

// ── Build 7: Tailwind preset + llms.txt - kebab-named token set ───────────────
//
// Uses the same TRANSFORMS as the CSS builds (name/no-default + color/oklch) so
// the token names emitted here (t.name) match the CSS custom properties in
// tokens.css. Without this, the default `js` transformGroup would produce
// PascalCase names that don't match the actual --kebab-case CSS variables.

const sdKebab = new StyleDictionary({
  log: { warnings: 'disabled' },
  source: [
    'src/primitive/*.tokens.json',
    'src/semantic/core.tokens.json',
    'src/semantic/light.tokens.json',
    'src/semantic/typography.tokens.json',
  ],
  platforms: {
    tailwind: {
      transforms: OKLCH_TRANSFORMS,
      buildPath: 'dist/',
      files: [{ destination: 'tailwind-preset.js', format: 'zha/tailwind-preset' }],
    },
    llms: {
      transforms: OKLCH_TRANSFORMS,
      buildPath: 'dist/',
      files: [{ destination: 'llms.txt', format: 'zha/llms' }],
    },
  },
});
await sdKebab.buildAllPlatforms();

// ── Emit Tailwind preset type declaration ─────────────────────────────────────
writeTailwindPresetDts();
console.log('tailwind-preset.d.ts written ✓');

// ── Concatenate: hex base (fallback) + @supports oklch overlay (enhancement) ──
const density = readFileSync('dist/tokens-density.css', 'utf8');
const tints = readFileSync('dist/tokens-tints.css', 'utf8');

// var() inside a custom property is substituted on the element where the property is
// declared, so a token computed from --accent* must be re-declared wherever --accent* is
// overridden, or an island inherits :root's already-resolved gradient. Hex blocks only:
// the oklch overlays carry colour values, so this stays the island's only declaration.
// The /** */ descriptions stay on :root only; ten copies would add ~11 KB of repeated comment.
const accentDerived = base.hex.split('\n').filter((l) => /^\s*--[\w-]+:[^;]*var\(--accent/.test(l))
  .map((l) => l.replace(/\s*\/\*\*.*\*\/\s*$/, '')).join('\n');
const withAccentDerived = (hex) => hex.replace(/\}\s*$/, `${accentDerived}\n}\n`);
const brandHex = brandBlocks.map((b) => (/--accent(-[\w-]+)?:/.test(b.hex) ? withAccentDerived(b.hex) : b.hex)); // any --accent* override; zha-app is name-only

const hexParts = [base.hex, withAccentDerived(dark.hex), withAccentDerived(brandSurface.hex), withAccentDerived(light.hex), density, ...brandHex, tints];
const oklchParts = [base.oklch, dark.oklch, brandSurface.oklch, light.oklch, ...brandBlocks.map((b) => b.oklch)]
  .filter((s) => s.includes('--')); // drop empty overlays (blocks with no raw colours)

const supports = `@supports (color: oklch(0 0 0)) {\n${oklchParts.join('\n')}\n}\n`;
writeFileSync('dist/tokens.css', [...hexParts, supports].join('\n'));

console.log('tokens.css written ✓');
