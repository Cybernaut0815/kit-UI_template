import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { wcagContrast, converter } from 'culori';
const toRgb = converter('rgb');

/**
 * Pull `--name: value;` declarations from a CSS block matching `selector`.
 *
 * The selector is matched as a TOKEN - any non-`{` characters may follow it
 * before the opening `{`. This handles compound selectors like:
 *   [data-theme="dark"], [data-surface="brand"] {
 * where a naive `selector\s*\{` regex would fail to match.
 */
function readVars(css, selector) {
  // Escape all regex special chars in the selector string, then allow any
  // non-`{` chars between the selector token and the opening brace.
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}[^{]*\\{([^}]*)\\}`, 's');
  const block = css.match(re)?.[1] ?? '';
  const vars = {};
  for (const m of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

function resolve(vars, value, depth = 0) {
  if (depth > 10) return value;
  const ref = value.match(/^var\(--([\w-]+)\)$/);
  return ref ? resolve(vars, vars[ref[1]] ?? value, depth + 1) : value;
}

function ratio(fg, bg) { return wcagContrast(toRgb(fg), toRgb(bg)); }

// A brand that declares a secondary tint/fill MUST declare its --accent-2 hue;
// otherwise the gradient/tint silently falls back to core's default, Dark Gray.
// (A brand with NO secondary tokens is fine - it inherits core's default.)
export function partialSecondaryFailure(brand, brandVars) {
  const hasDetail = 'accent-2-subtle' in brandVars || 'accent-2-fill' in brandVars;
  return hasDetail && !('accent-2' in brandVars)
    // structural defect, not a contrast miss - no ratio/need (a 0/0 pair reads as a trivially-passing check).
    ? { brand, type: 'structural', fg: 'accent-2', bg: '(missing)', note: 'declares a secondary tint/fill without --accent-2' }
    : null;
}

// The 12 typology hues - each ships a per-theme AA text form (--typology-<hue>-text).
const TYPOLOGY = ['purple', 'ultramarine', 'blue', 'teal', 'dark-green', 'light-green',
  'lime', 'yellow', 'apricot', 'orange', 'cool-red', 'magenta'];

// Pairs that MUST pass AA (4.5 normal text / 3.0 large+UI), per theme.
const PAIRS = [
  // Per-hue typology text forms (chip text, chart labels) - real text, 4.5.
  ...TYPOLOGY.map((h) => [`typology-${h}-text`, 'bg-surface-1', 4.5]),
  // Chart categorical slots - non-text marks (WCAG 1.4.11 = 3.0). chart-cat-other is
  // exempt by design: a sub-floor neutral that must recede, not read as a 9th identity.
  ...Array.from({ length: 8 }, (_, i) => [`chart-cat-${i + 1}`, 'bg-surface-1', 3.0]),
  ['text-default', 'bg-page', 4.5], ['text-default', 'bg-surface-1', 4.5],
  ['text-muted', 'bg-surface-1', 4.5], ['text-muted', 'bg-surface-2', 4.5], ['text-muted-strong', 'bg-surface-3', 4.5],
  ['accent-fill', 'bg-surface-1', 3.0], ['accent-on', 'accent-fill', 4.5],
  // Primary button hover fill (plain colours on the default cascades; team hovers are a
  // color-mix the gate cannot evaluate, so they stay render-verified).
  ['accent-on', 'accent-hover', 4.5], ['accent-hover', 'bg-surface-1', 3.0],
  // Secondary accent fill is non-text only (expressive) → WCAG 1.4.11 = 3.0.
  ['accent-2-fill', 'bg-surface-1', 3.0],
  ['intent-error-text', 'bg-surface-1', 4.5], ['intent-success-text', 'bg-surface-1', 4.5],
  ['intent-warning-text', 'bg-surface-1', 4.5], ['intent-info-text', 'bg-surface-1', 4.5],
  ['intent-on-warning', 'intent-warning', 4.5],
  // Intent colour on a SECONDARY surface is only valid as a NON-TEXT signal
  // (border/icon, WCAG 1.4.11 = 3.0). Intent-coloured TEXT (4.5) is validated
  // against bg-surface-1/bg-page above and must not be placed on surface-2/3.
  ['intent-error-text', 'bg-surface-2', 3.0], ['intent-success-text', 'bg-surface-2', 3.0],
  ['intent-warning-text', 'bg-surface-2', 3.0], ['intent-info-text', 'bg-surface-2', 3.0],
];

// Brand-axis selectors whose accent-fill must each clear AA.
const BRANDS = ['zha-app', 'es', 'code', 'analytics', 'zh-cluster', 'bim', 'abps', 'meta'];

export function checkContrast(cssPath = new URL('../dist/tokens.css', import.meta.url)) {
  const css = readFileSync(cssPath, 'utf8');
  const failures = [];

  for (const [selector, label] of [
    [':root', 'light'],
    ['[data-theme="dark"]', 'dark'],
    ['[data-surface="brand"]', 'brand'],
  ]) {
    const base = readVars(css, ':root');
    const darkVars = readVars(css, selector);
    const themed = { ...base, ...darkVars };

    // Sentinel guard: verify the non-light block was read and
    // overrides light - by checking that bg-page differs between themes.
    // Non-light bg-page is black (or near-black); light bg-page is the paper page colour.
    // If readVars returned empty (or only matched light vars), themed bg-page
    // would equal the light value - a silent false GREEN, not a real non-light check.
    if (label !== 'light') {
      const darkBgPage = darkVars['bg-page'];
      const lightBgPage = resolve(base, base['bg-page'] ?? '');
      const darkBgPageResolved = darkBgPage ? resolve({ ...base, ...darkVars }, darkBgPage) : undefined;

      if (Object.keys(darkVars).length === 0) {
        throw new Error(
          `readVars returned no vars for selector "${selector}" - block was not matched. ` +
          'Check the CSS selector format vs. the regex in readVars.'
        );
      }
      if (!darkBgPage || darkBgPageResolved === lightBgPage) {
        throw new Error(
          `Sentinel failed for "${selector}": --bg-page ("${darkBgPageResolved}") ` +
          `matches the light value ("${lightBgPage}") or is absent - block was not read.`
        );
      }
    }

    for (const [fg, bg, need] of PAIRS) {
      if (themed[fg] === undefined || themed[bg] === undefined) {
        // fail loud but structured - a missing token must never read as a passing pair
        failures.push({ theme: label, type: 'structural', fg, bg, note: 'token missing from cascade' });
        continue;
      }
      const fgVal = resolve(themed, themed[fg]);
      const bgVal = resolve(themed, themed[bg]);
      const r = ratio(fgVal, bgVal);
      if (!(r >= need)) failures.push({ theme: label, fg, bg, ratio: Math.round(r * 100) / 100, need });
    }

    // Tinted-chip reality check: a .chip--<hue> paints its text on the hue's 25% tint
    // composited over the surface, not on the bare surface - validate that actual pair.
    // color-mix(in srgb, hue 25%, transparent) over a bg is a gamma-sRGB channel lerp.
    // Both blessed placements are checked: surface-1 (cards/tables) and bg-page.
    for (const h of TYPOLOGY) {
      for (const surfKey of ['bg-surface-1', 'bg-page']) {
        if (themed[`color-typology-${h}`] === undefined || themed[surfKey] === undefined || themed[`typology-${h}-text`] === undefined) {
          failures.push({ theme: label, type: 'structural', fg: `typology-${h}-text`, bg: surfKey, note: 'token missing from cascade' });
          continue;
        }
        const hue = toRgb(resolve(themed, themed[`color-typology-${h}`]));
        const surf = toRgb(resolve(themed, themed[surfKey]));
        const tint = {
          mode: 'rgb',
          r: hue.r * 0.25 + surf.r * 0.75,
          g: hue.g * 0.25 + surf.g * 0.75,
          b: hue.b * 0.25 + surf.b * 0.75,
        };
        const r = wcagContrast(toRgb(resolve(themed, themed[`typology-${h}-text`])), tint);
        if (!(r >= 4.5)) {
          failures.push({ theme: label, fg: `typology-${h}-text`, bg: `typology-${h}-25 over ${surfKey}`, ratio: Math.round(r * 100) / 100, need: 4.5 });
        }
      }
    }
  }

  // ── Brand axis: every [data-brand] override must keep its accent-fill AA ────
  // A team block redefines --accent-fill/--accent-on (and --accent/--accent-subtle);
  // zha-app's block carries only --brand-name and inherits the theme's accent.
  // Merge the brand block over each cascade the way the browser does and assert:
  // on-fill >= 4.5 (text on button) AND fill-on-surface >= 3.0 (button against
  // page). Because contrast is symmetric, 4.5 implies 3.0, but we check both
  // explicitly per the gate contract.
  const base = readVars(css, ':root');
  // Resolve the dark surface once: on a dark OR brand surface the brand block's
  // accent-fill wins over the dark block (equal specificity; brand emitted
  // later), so the fill sits on the dark surface. The gate must test that too.
  const darkBase = { ...base, ...readVars(css, '[data-theme="dark"]') };
  for (const brand of BRANDS) {
    // Pass the RAW selector - readVars escapes regex specials internally.
    const brandVars = readVars(css, `[data-brand="${brand}"]`);
    if (Object.keys(brandVars).length === 0) {
      failures.push({ brand, fg: 'accent-on', bg: 'accent-fill', ratio: 0, need: 4.5, note: 'brand block missing' });
      continue;
    }
    const merged = { ...base, ...brandVars };
    const partial = partialSecondaryFailure(brand, brandVars);
    if (partial) failures.push(partial);
    const fill = resolve(merged, merged['accent-fill']);
    const on = resolve(merged, merged['accent-on'] ?? merged['accent-fill']);
    const surface = resolve(merged, merged['bg-surface-1']);

    const onFill = ratio(on, fill);
    if (!(onFill >= 4.5)) {
      failures.push({ brand, fg: 'accent-on', bg: 'accent-fill', ratio: Math.round(onFill * 100) / 100, need: 4.5 });
    }
    const fillSurface = ratio(fill, surface);
    if (!(fillSurface >= 3.0)) {
      failures.push({ brand, fg: 'accent-fill', bg: 'bg-surface-1', ratio: Math.round(fillSurface * 100) / 100, need: 3.0 });
    }
    // Dark leg, cascade-faithful: fill AND label come from the brand block over the
    // dark cascade (a block that omits them inherits the dark theme's values).
    const darkMerged = { ...darkBase, ...brandVars };
    const darkFill = resolve(darkMerged, darkMerged['accent-fill']);
    const darkOn = resolve(darkMerged, darkMerged['accent-on'] ?? darkMerged['accent-fill']);
    const darkOnFill = ratio(darkOn, darkFill);
    if (!(darkOnFill >= 4.5)) {
      failures.push({ brand, fg: 'accent-on', bg: 'accent-fill (dark)', ratio: Math.round(darkOnFill * 100) / 100, need: 4.5 });
    }
    // Dark-surface non-text contrast (WCAG 1.4.11 = 3.0) - the gap the gate missed.
    const darkSurface = resolve(darkMerged, darkMerged['bg-surface-1']);
    const fillOnDark = ratio(darkFill, darkSurface);
    if (!(fillOnDark >= 3.0)) {
      failures.push({ brand, fg: 'accent-fill', bg: 'bg-surface-1 (dark)', ratio: Math.round(fillOnDark * 100) / 100, need: 3.0 });
    }
  }

  return { pass: failures.length === 0, failures };
}

// CLI - use pathToFileURL so the comparison works on Windows (backslash paths)
// and Unix alike.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { pass, failures } = checkContrast();
  if (!pass) { console.error('Contrast failures:', failures); process.exit(1); }
  console.log('Contrast matrix: all pairs pass WCAG AA.');
}
