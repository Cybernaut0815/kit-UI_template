import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { converter } from 'culori';

const toOklch = converter('oklch');
const css = () => readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');

// Read --name: value pairs from the FIRST block matching the selector in the hex
// cascade (the oklch overlay comes after '@supports (color: oklch' - sliced off).
function readVars(selector: string) {
  const hex = css().slice(0, css().indexOf('@supports (color: oklch'));
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = hex.match(new RegExp(`${escaped}[^{]*\\{([^}]*)\\}`, 's'))?.[1] ?? '';
  const vars: Record<string, string> = {};
  for (const m of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}
const L = (hex: string) => (toOklch(hex) as unknown as { l: number }).l;

const SEQ = [1, 2, 3, 4, 5, 6].map((n) => `chart-seq-${n}`);
const NEG = ['chart-div-neg-3', 'chart-div-neg-2', 'chart-div-neg-1'];
const POS = ['chart-div-pos-3', 'chart-div-pos-2', 'chart-div-pos-1'];

describe('chart tokens (viz spec §7)', () => {
  it(':root ships the full chart set: 8 fixed cat slots + other, seq, div, text/grid aliases', () => {
    const root = readVars(':root');
    for (let i = 1; i <= 8; i++) expect(root[`chart-cat-${i}`], `chart-cat-${i}`).toBeTruthy();
    expect(root['chart-cat-other']).toBe('var(--text-disabled)'); // recedes with the theme, live
    for (const v of [...SEQ, ...NEG, 'chart-div-mid', ...POS]) expect(root[v], v).toBeTruthy();
    expect(root['chart-text']).toBe('var(--text-muted)');
    expect(root['chart-text-strong']).toBe('var(--text-default)');
    expect(root['chart-grid']).toBe('var(--border-subtle)');
    expect(root['chart-axis']).toBe('var(--border-default)');
    // verbatim-hue slots stay refs so the palette traces to the primitives
    expect(root['chart-cat-1']).toBe('var(--color-typology-teal)');
    expect(root['chart-cat-8']).toBe('var(--color-typology-magenta)');
  });

  it('dark overrides the full cat/seq/div set; brand-surface mirrors dark exactly', () => {
    const dark = readVars('[data-theme="dark"]');
    const brand = readVars('[data-surface="brand"]');
    const chartKeys = Object.keys(dark).filter((k) => k.startsWith('chart-'));
    expect(chartKeys.length).toBe(8 + 6 + 7); // cat 1-8, seq 1-6, div 7 (aliases live in :root)
    for (const k of chartKeys) expect(brand[k], `brand-surface ${k}`).toBe(dark[k]);
    expect(dark['chart-cat-2']).toBe('#3652FF'); // dark slot 2 is the snapped step, not the primitive
  });

  it('ramps are lightness-monotone with the anchor flipped in dark ("more"/"strong" = more contrast)', () => {
    const root = readVars(':root');
    const dark = readVars('[data-theme="dark"]');
    const Ls = (vars: Record<string, string>, names: string[]) => names.map((n) => L(vars[n]));
    const increasing = (xs: number[]) => xs.every((x, i) => i === 0 || x > xs[i - 1]);
    const decreasing = (xs: number[]) => xs.every((x, i) => i === 0 || x < xs[i - 1]);
    // sequential: light darkens toward "more"; dark lightens toward "more"
    expect(decreasing(Ls(root, SEQ)), 'seq light L strictly decreasing').toBe(true);
    expect(increasing(Ls(dark, SEQ)), 'seq dark L strictly increasing').toBe(true);
    // diverging arms: strong→weak runs toward the surface in each mode
    expect(increasing(Ls(root, NEG)), 'div light blue arm').toBe(true);
    expect(increasing(Ls(root, POS)), 'div light red arm').toBe(true);
    expect(decreasing(Ls(dark, NEG)), 'div dark blue arm').toBe(true);
    expect(decreasing(Ls(dark, POS)), 'div dark red arm').toBe(true);
    // neutral midpoint continues each progression past the weak ends
    expect(L(root['chart-div-mid'])).toBeGreaterThan(Math.max(L(root['chart-div-neg-1']), L(root['chart-div-pos-1'])));
    expect(L(dark['chart-div-mid'])).toBeLessThan(Math.min(L(dark['chart-div-neg-1']), L(dark['chart-div-pos-1'])));
  });

  it('the [data-theme="light"] counter-scope carries the chart set (light islands in dark apps)', () => {
    const light = readVars('[data-theme="light"]');
    for (const v of ['chart-cat-2', 'chart-seq-1', 'chart-div-mid', 'chart-text']) expect(light[v], v).toBeTruthy();
  });

  it('llms.txt lists the chart vars AND the fixed-order guidance', () => {
    const txt = readFileSync(new URL('../dist/llms.txt', import.meta.url), 'utf8');
    expect(txt).toContain('--chart-cat-1');
    expect(txt).toContain('--chart-div-mid');
    expect(txt).toMatch(/fixed slot order|never cycle/i);
  });
});
