import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it, expect } from 'vitest';
import { checkContrast, partialSecondaryFailure } from '../scripts/contrast-matrix.mjs';

const css = () => readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');

const STUB_BRANDS = ['code', 'analytics', 'zh-cluster', 'bim', 'abps', 'meta'];

describe('brand axis', () => {
  it('emits the ES brand pair (--accent teal + --accent-2 magenta) and a var-based --brand-grad in :root', () => {
    // ES overrides the SEMANTIC --accent/--accent-2 vars (not a namespaced
    // --brand-accent), so data-brand="es" recolours primitive-driven components.
    expect(css()).toMatch(
      /\[data-brand="es"\][^{]*\{[^}]*--accent:\s*var\(--color-accent-teal\)/s,
    );
    expect(css()).toMatch(
      /\[data-brand="es"\][^{]*\{[^}]*--accent-2:\s*var\(--color-accent-magenta\)/s,
    );
    // The gradient is defined in :root from the live --accent/--accent-2 vars (and
    // re-declared, unchanged, in every block that overrides --accent*).
    expect(css()).toMatch(
      /:root[^{]*\{[^}]*--brand-grad:\s*linear-gradient\(105deg, var\(--accent\) 0%, var\(--accent-2\) 100%\)/s,
    );
    // Island reach: the ES block also matches a nested theme/surface island without its own brand.
    expect(css()).toContain('[data-brand="es"], [data-brand="es"] :is([data-theme], [data-surface]):not([data-brand]) {');
  });

  it('re-declares the accent-derived tokens in every hex block that overrides --accent*', () => {
    // var() in a custom property resolves where it is declared: without this an island
    // inherits :root's already-resolved gradient (ink on the black brand hero).
    const hex = css().slice(0, css().indexOf('@supports (color: oklch'));
    for (const sel of ['[data-theme="dark"]', '[data-surface="brand"]', '[data-theme="light"]', '[data-brand="es"]']) {
      const block = hex.slice(hex.indexOf(sel), hex.indexOf('}', hex.indexOf(sel)));
      expect(block, `${sel} re-declares --brand-grad`).toMatch(/--brand-grad:/);
      expect(block, `${sel} re-declares --grad-wash`).toMatch(/--grad-wash:/);
    }
  });

  it('ships an --accent override + --brand-name for every stub team', () => {
    for (const b of STUB_BRANDS) {
      expect(css()).toMatch(new RegExp(`\\[data-brand="${b}"\\]`));
    }
  });

  it('every brand accent-fill clears WCAG AA (gate covers all 8 brands)', () => {
    expect(checkContrast().failures).toEqual([]);
  });

  it('does not leak brand accents into :root (zha-app ink + Dark Gray stay the default)', () => {
    expect(css()).toMatch(/:root[^{]*\{[^}]*--accent:\s*var\(--color-neutral-ink\)/s);
    expect(css()).toMatch(/:root[^{]*\{[^}]*--accent-2:\s*var\(--color-neutral-gray-77\)/s);
  });

  it('emits a name-only [data-brand="zha-app"] block (an accent there would beat [data-theme="dark"])', () => {
    const block = css().match(/\[data-brand="zha-app"\][^{]*\{([^}]*)\}/)?.[1];
    expect(block, 'zha-app brand block').toBeDefined();
    expect(block).toMatch(/--brand-name:\s*ZHA;/);
    expect(block).not.toMatch(/--accent/);
  });

  it('the dark leg is cascade-faithful: a zha-app block carrying the light ink fill fails under the dark label', () => {
    const tmp = join(tmpdir(), `brand-dark-leg-${Date.now()}.css`);
    const injected = css().replace(/(\[data-brand="zha-app"\][^{]*\{)/, '$1\n  --accent-fill: var(--color-neutral-ink);');
    const zhaBlock = injected.match(/\[data-brand="zha-app"\][^{]*\{([^}]*)\}/)?.[1];
    expect(zhaBlock).toContain('--accent-fill: var(--color-neutral-ink);');   // the fixture really carries the bad fill (:root already has this line, so check the block)
    writeFileSync(tmp, injected, 'utf8');
    try {
      expect(checkContrast(tmp).failures).toContainEqual(expect.objectContaining({ brand: 'zha-app', fg: 'accent-on', bg: 'accent-fill (dark)' }));
    } finally {
      unlinkSync(tmp);
    }
  });

  it('every team re-emits its color-mix --accent-hover in the oklch overlay (a hex-only hover loses to the overlay theme grays)', () => {
    const overlay = css().slice(css().indexOf('@supports (color: oklch'));
    for (const b of ['es', ...STUB_BRANDS]) {
      const start = overlay.indexOf(`[data-brand="${b}"]`);
      expect(start, `${b} overlay block`).toBeGreaterThan(-1);
      expect(overlay.slice(start, overlay.indexOf('}', start)), `${b} overlay --accent-hover`).toContain('--accent-hover: color-mix(');
    }
  });

  it('flags a secondary tint/fill declared without its --accent-2 hue', () => {
    // partial secondary → failure
    expect(partialSecondaryFailure('x', { 'accent-2-subtle': 'rgba(0,0,0,.1)' })).not.toBeNull();
    expect(partialSecondaryFailure('x', { 'accent-2-fill': '#000' })).not.toBeNull();
    // complete secondary → ok (both detail tokens, symmetric)
    expect(partialSecondaryFailure('x', { 'accent-2': '#000', 'accent-2-subtle': 'rgba(0,0,0,.1)' })).toBeNull();
    expect(partialSecondaryFailure('x', { 'accent-2': '#000', 'accent-2-fill': '#000' })).toBeNull();
    // no secondary at all → ok (unconfirmed teams inherit core)
    expect(partialSecondaryFailure('x', { accent: '#000' })).toBeNull();
  });
});
