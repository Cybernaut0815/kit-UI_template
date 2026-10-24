// The repo's one gate: contrast per theme × accent, vocabulary sync, brand leak. Zero dependencies: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const TOKENS = read('css/tokens.css');
const CSS = read('css/kit-forge-ui.css');
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

// ── colour maths ─────────────────────────────────────────────────────────────
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (a, b, t) => a.map((v, i) => v * t + b[i] * (1 - t)); // t = share of a; colours are opaque [r,g,b,alpha]
function parse(v) {
  let m;
  if ((m = v.match(/^#([0-9a-f]{6})$/i))) { const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255].map((c) => c / 255).concat(1); }
  if ((m = v.match(/^rgba?\(([^)]+)\)$/))) { const [r, g, b, a = 1] = m[1].split(',').map(Number); return [r / 255, g / 255, b / 255, a]; }
  if (v === 'transparent') return [0, 0, 0, 0];
  if ((m = v.match(/^color-mix\(in srgb, (.+) (\d+)%, (.+)\)$/))) {
    const a = parse(m[1]), b = parse(m[3]), t = m[2] / 100;
    if (b[3] === 0) return [...a.slice(0, 3), a[3] * t]; // mixing with transparent = the colour at reduced alpha
    return [...mix(a.slice(0, 3), b.slice(0, 3), t), 1];
  }
  throw new Error(`unparsed colour: ${v}`);
}
const over = (fg, bg) => (fg[3] === 1 ? fg : [...mix(fg.slice(0, 3), bg.slice(0, 3), fg[3]), 1]);

// ── token cascade: apply every tokens.css block whose selector matches <html> with these attributes ──
const BLOCKS = [...strip(TOKENS).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({
  sels: sel.split(',').map((s) => s.trim()),
  decls: [...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.replace(/\s+/g, ' ').trim()]),
}));
function matches(sel, attrs) {
  if (sel === ':root') return true;
  const m = sel.match(/^\[data-(\w+)(?:="(\w+)")?\]$/);
  assert.ok(m, `tokens.css selector the gate cannot read: ${sel}`);
  return m[2] === undefined ? m[1] in attrs : attrs[m[1]] === m[2];
}
function cascade(attrs) {
  const vars = {};
  for (const b of BLOCKS) if (b.sels.some((s) => matches(s, attrs))) for (const [k, v] of b.decls) vars[k] = v;
  const sub = (v, d = 0) => (d > 20 ? v : v.includes('var(') ? sub(v.replace(/var\(--([\w-]+)\)/g, (_, n) => vars[n] ?? `MISSING(${n})`), d + 1) : v);
  return (name) => { assert.ok(name in vars, `--${name} not defined`); return parse(sub(vars[name])); };
}

const SCENES = [];
for (const accent of ['red', 'orange', 'purple'])
  for (const [label, attrs] of [['light', { theme: 'light' }], ['dark', { theme: 'dark' }], ['brand', { theme: 'light', surface: 'brand' }]])
    SCENES.push([`${label}/${accent}`, { ...attrs, ...(accent === 'red' ? {} : { accent }) }]);

const HUES = { orange: 'color-orange-500', red: 'color-red-500', purple: 'color-purple-500', green: 'color-green', amber: 'color-amber', blue: 'color-blue' };
const INTENTS = ['error', 'success', 'warning', 'info'];

for (const [scene, attrs] of SCENES) {
  test(`contrast ${scene}`, () => {
    const c = cascade(attrs);
    const misses = [];
    const need = (fgName, bgName, min, fg = c(fgName), bg = c(bgName)) => {
      const r = ratio(over(fg, bg), bg);
      if (r < min) misses.push(`${fgName} on ${bgName}: ${r.toFixed(2)} < ${min}`);
    };
    for (const bg of ['bg-page', 'bg-surface-1']) { need('text-strong', bg, 4.5); need('text-default', bg, 4.5); need('text-muted', bg, 4.5); need('accent-fill', bg, 3); }
    need('text-muted', 'bg-surface-2', 4.5);
    need('text-muted-strong', 'bg-surface-3', 4.5);
    need('accent-on', 'accent-fill', 4.5);
    need('accent-on', 'accent-hover', 4.5);
    need('accent-hover', 'bg-surface-1', 3);
    need('intent-on-warning', 'intent-warning', 4.5);
    for (const i of INTENTS) { need(`intent-${i}-text`, 'bg-surface-1', 4.5); need(`intent-${i}-text`, 'bg-page', 4.5); need(`intent-${i}-text`, 'bg-surface-2', 3); }
    for (let n = 1; n <= 8; n++) need(`chart-cat-${n}`, 'bg-surface-1', 3);
    for (const [hue, base] of Object.entries(HUES))
      for (const bg of ['bg-surface-1', 'bg-page']) {
        const tint = over([...c(base).slice(0, 3), 0.25], c(bg)); // .chip--<hue> background: the hue at 25%
        need(`chip-${hue}-text`, `${hue} tint on ${bg}`, 4.5, c(`chip-${hue}-text`), tint);
      }
    const seq = [1, 2, 3, 4, 5, 6].map((n) => ratio(c(`chart-seq-${n}`), c('bg-surface-1')));
    if (seq.some((r, i) => i && r <= seq[i - 1])) misses.push(`chart-seq not monotone vs surface: ${seq.map((r) => r.toFixed(2)).join(' ')}`);
    assert.deepEqual(misses, []);
  });
}

test('brand surface wins over data-theme="light" on the same element', () => {
  assert.equal(cascade({ theme: 'light', surface: 'brand' })('bg-page').join(), cascade({ theme: 'dark' })('bg-page').join());
});

// ── vocabulary ───────────────────────────────────────────────────────────────
const classesIn = (css) => new Set([...strip(css).replace(/url\([^)]*\)|"[^"]*"/g, '').matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const declared = new Set([...strip(TOKENS + CSS).matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
const EXAMPLES = readdirSync(join(ROOT, 'examples')).filter((f) => f.endsWith('.html')).map((f) => [`examples/${f}`, read(`examples/${f}`)]);

test('every class is in the skill reference', () => {
  const ref = read('skills/kit-forge-ui/reference.md');
  assert.deepEqual([...classesIn(CSS)].filter((c) => !ref.includes(`.${c}`)), []);
});

test('every var() used is declared', () => {
  const missing = [];
  for (const [file, text] of [['css/kit-forge-ui.css', CSS], ['css/tokens.css', TOKENS], ...EXAMPLES])
    for (const [, name] of strip(text).matchAll(/var\((--[\w-]+)/g)) if (!declared.has(name)) missing.push(`${file}: ${name}`);
  assert.deepEqual([...new Set(missing)], []);
});

test('examples use tokens, never colour literals', () => {
  const hits = [];
  for (const [file, html] of EXAMPLES) {
    const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>|style="([^"]*)"/g)].map((m) => m[1] ?? m[2]).join('\n');
    for (const [lit] of styles.matchAll(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/gi)) hits.push(`${file}: ${lit}`);
  }
  assert.deepEqual(hits, []);
});

// ── brand leak ───────────────────────────────────────────────────────────────
test('no trace of the former company identity', () => {
  const LEAK = new RegExp(['zha', 'zaha', 'gitzhacode', 'haas unica'].join('|'), 'i');
  const SKIP = new Set(['.git', 'node_modules', 'fonts']);
  const self = relative(ROOT, new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  const hits = [];
  const walk = (dir) => {
    for (const name of readdirSync(join(ROOT, dir))) {
      const p = join(dir, name);
      if (SKIP.has(name) || p === self) continue;
      if (statSync(join(ROOT, p)).isDirectory()) walk(p);
      else if (LEAK.test(name) || LEAK.test(read(p))) hits.push(p);
    }
  };
  walk('');
  assert.deepEqual(hits, []);
});
