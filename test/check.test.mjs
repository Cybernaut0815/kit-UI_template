// The repo's one gate: contrast per theme × kit, vocabulary sync, brand leak. Zero dependencies: `node --test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const TOKENS = read('css/tokens.css');
const CSS = read('css/kit-ui.css');
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

// ── token cascade: apply every tokens.css block whose selector (and media) matches <html> in a scene ──
const BLOCKS = [];
let media = null;
for (const m of strip(TOKENS).matchAll(/@media([^{]+)\{|([^{}]+)\{([^{}]*)\}|\}/g)) {
  if (m[1] !== undefined) media = m[1].trim();
  else if (m[2] === undefined) media = null; // the @media's closing brace
  else BLOCKS.push({
    media,
    sels: m[2].split(/,(?![^(]*\))/).map((s) => s.trim()),
    decls: [...m[3].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.replace(/\s+/g, ' ').trim()]),
  });
}
// compound selectors of :root, [data-x], [data-x="v"], :where(…) and :not(…)
function matches(sel, attrs) {
  for (let rest = sel; rest; ) {
    let m;
    if ((m = rest.match(/^:root/))) { /* every scene is <html> */ }
    else if (rest.match(/^\.[\w-]+/)) return false; // a class (the .app-bar island) is never <html>
    else if ((m = rest.match(/^\[data-(\w+)(?:="(\w+)")?\]/))) { if (m[2] === undefined ? !(m[1] in attrs) : attrs[m[1]] !== m[2]) return false; }
    else if ((m = rest.match(/^:(where|not)\(/))) {
      let depth = 1, i = m[0].length;
      while (depth) depth += { '(': 1, ')': -1 }[rest[i++]] ?? 0;
      if (matches(rest.slice(m[0].length, i - 1), attrs) !== (m[1] === 'where')) return false;
      m = [rest.slice(0, i)];
    } else assert.fail(`tokens.css selector the gate cannot read: ${sel}`);
    rest = rest.slice(m[0].length);
  }
  return true;
}
function cascade(attrs, system = 'dark') {
  const vars = {};
  for (const b of BLOCKS)
    if ((!b.media || b.media.includes(`prefers-color-scheme: ${system}`)) && b.sels.some((s) => matches(s, attrs)))
      for (const [k, v] of b.decls) vars[k] = v;
  const sub = (v, d = 0) => (d > 20 ? v : v.includes('var(') ? sub(v.replace(/var\(--([\w-]+)\)/g, (_, n) => vars[n] ?? `MISSING(${n})`), d + 1) : v);
  return (name) => { assert.ok(name in vars, `--${name} not defined`); return parse(sub(vars[name])); };
}

// themes × kits; each theme names the system setting it is tested under
const THEMES = [
  ['default', {}, 'dark'], ['system-light', {}, 'light'],
  ['light', { theme: 'light' }, 'dark'], ['dark', { theme: 'dark' }, 'light'], ['brand', { theme: 'light', surface: 'brand' }, 'light'],
];
const SCENES = [];
for (const kit of ['forge', 'sim', 'viz'])
  for (const [label, attrs, system] of THEMES)
    SCENES.push([`${label}/${kit}`, { ...attrs, ...(kit === 'forge' ? {} : { kit }) }, system]);

const HUES = { orange: 'color-orange-500', red: 'color-red-500', purple: 'color-purple-500', green: 'color-green', amber: 'color-amber', blue: 'color-blue' };
const INTENTS = ['error', 'success', 'warning', 'info'];

for (const [scene, attrs, system] of SCENES) {
  test(`contrast ${scene}`, () => {
    const c = cascade(attrs, system);
    const misses = [];
    const need = (fgName, bgName, min, fg = c(fgName), bg = c(bgName)) => {
      const r = ratio(over(fg, bg), bg);
      if (r < min) misses.push(`${fgName} on ${bgName}: ${r.toFixed(2)} < ${min}`);
    };
    // --accent is text-like (links, focus ring): 4.5 on every surface. The button fill needs no boundary contrast - its label identifies it (WCAG 1.4.11) - only its own text does.
    for (const bg of ['bg-page', 'bg-surface-1', 'bg-panel']) { need('text-strong', bg, 4.5); need('text-default', bg, 4.5); need('text-muted', bg, 4.5); need('accent', bg, 4.5); }
    need('text-muted', 'bg-surface-2', 4.5);
    need('text-muted-strong', 'bg-surface-3', 4.5);
    need('accent-on', 'accent-fill', 4.5);
    need('accent-on', 'accent-hover', 4.5);
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

const page = (attrs, system) => cascade(attrs, system)('bg-page').join();

test('no data-theme follows the system, dark by default', () => {
  assert.equal(page({}, 'dark'), page({ theme: 'dark' }));
  assert.equal(page({}, 'light'), page({ theme: 'light' }));
  assert.notEqual(page({}, 'dark'), page({}, 'light'));
});

test('an explicit data-theme beats the system', () => {
  assert.equal(page({ theme: 'dark' }, 'light'), page({ theme: 'dark' }, 'dark'));
  assert.equal(page({ theme: 'light' }, 'dark'), page({ theme: 'light' }, 'light'));
});

test('brand surface wins over data-theme="light" and the system', () => {
  assert.equal(page({ theme: 'light', surface: 'brand' }, 'light'), page({ theme: 'dark' }));
  assert.equal(page({ surface: 'brand' }, 'light'), page({ theme: 'dark' }));
});

// sRGB <-> OKLCH, enough to find the centre of an `in oklch` gradient
const M1 = [[0.4122214708, 0.5363325363, 0.0514459929], [0.2119034982, 0.6806995451, 0.1073969566], [0.0883024619, 0.2817188376, 0.6299787005]];
const M2 = [[0.2104542553, 0.7936177850, -0.0040720468], [1.9779984951, -2.4285922050, 0.4505937099], [0.0259040371, 0.7827717662, -0.8086757660]];
const dot = (m, v) => m.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
const toLch = (c) => { const [L, a, b] = dot(M2, dot(M1, c.slice(0, 3).map(lin)).map(Math.cbrt)); return [L, Math.hypot(a, b), Math.atan2(b, a)]; };
const fromLch = ([L, C, h]) => {
  const lms = [[1, 0.3963377774, 0.2158037573], [1, -0.1055613458, -0.0638541728], [1, -0.0894841775, -1.2914855480]].map((r) => (r[0] * L + r[1] * C * Math.cos(h) + r[2] * C * Math.sin(h)) ** 3);
  return dot([[4.0767416621, -3.3077115913, 0.2309699292], [-1.2684380046, 2.6097574011, -0.3413193965], [-0.0041960863, -0.7034186147, 1.7076147010]], lms)
    .map((x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055));
};

test('each kit button fill is the centre colour of its gradient', () => {
  for (const kit of ['forge', 'sim', 'viz']) {
    const c = cascade(kit === 'forge' ? {} : { kit });
    const stops = BLOCKS.flatMap((b) => (b.sels.some((s) => matches(s, kit === 'forge' ? {} : { kit })) ? b.decls : []))
      .filter(([k]) => k === 'grad-kit').pop()[1].match(/var\(--[\w-]+\)/g).map((v) => v.slice(6, -1));
    const n = stops.length, a = toLch(c(stops[Math.floor((n - 1) / 2)])), b = toLch(c(stops[Math.ceil((n - 1) / 2)]));
    let dh = b[2] - a[2]; if (dh > Math.PI) dh -= 2 * Math.PI; if (dh < -Math.PI) dh += 2 * Math.PI; // shorter hue arc, as CSS does
    const centre = fromLch([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2] + dh / 2]);
    const fill = c('accent-fill');
    assert.ok(centre.every((v, i) => Math.abs(v - fill[i]) < 2 / 255), `${kit}: --accent-fill should be the gradient centre ${centre.map((v) => Math.round(v * 255))}`);
  }
});

test('the explicit and system light blocks match', () => {
  const light = BLOCKS.filter((b) => b.decls.some(([k, v]) => k === 'bg-page' && v === '#F4F2F0'));
  assert.equal(light.length, 2);
  assert.deepEqual(light[0].decls, light[1].decls);
});

// ── vocabulary ───────────────────────────────────────────────────────────────
const classesIn = (css) => new Set([...strip(css).replace(/url\([^)]*\)|"[^"]*"/g, '').matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const declared = new Set([...strip(TOKENS + CSS).matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
const EXAMPLES = readdirSync(join(ROOT, 'examples')).filter((f) => f.endsWith('.html')).map((f) => [`examples/${f}`, read(`examples/${f}`)]);

test('every class is in the skill reference', () => {
  const ref = read('skills/kit-ui/reference.md');
  assert.deepEqual([...classesIn(CSS)].filter((c) => !ref.includes(`.${c}`)), []);
});

test('every var() used is declared', () => {
  const missing = [];
  for (const [file, text] of [['css/kit-ui.css', CSS], ['css/tokens.css', TOKENS], ...EXAMPLES])
    for (const [, name] of strip(text).matchAll(/var\((--[\w-]+)/g)) {
      // a trailing - is a prefix a script completes ('var(--chart-seq-' + n + ')'): some declared token must start with it
      const known = name.endsWith('-') ? [...declared].some((d) => d.startsWith(name)) : declared.has(name);
      if (!known) missing.push(`${file}: ${name}`);
    }
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
      if (SKIP.has(name) || p === self || /\.(png|jpe?g|webp|woff2)$/i.test(name)) continue; // binaries can hold any byte run
      if (statSync(join(ROOT, p)).isDirectory()) walk(p);
      else if (LEAK.test(name) || LEAK.test(read(p))) hits.push(p);
    }
  };
  walk('');
  assert.deepEqual(hits, []);
});
