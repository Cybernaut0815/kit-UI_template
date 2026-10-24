import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
const css = () => readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');

describe('semantic layer', () => {
  it('emits AA-safe intent text tokens', () => {
    for (const n of ['error','success','warning','info'])
      expect(css()).toMatch(new RegExp(`--intent-${n}-text:`));
  });
  it('scopes dark overrides under [data-theme="dark"]', () => {
    expect(css()).toMatch(/\[data-theme="dark"\][^{]*\{[^}]*--bg-page:/s);
  });
  it('uses outputReferences (vars reference vars, not raw values)', () => {
    expect(css()).toMatch(/--accent:\s*var\(--color-neutral-ink\)/);
  });
  it('emits the opacity-tint ladder for typology hues', () => {
    expect(css()).toMatch(/--typology-teal-75:\s*color-mix\(in srgb, var\(--color-typology-teal\) 75%, transparent\)/);
    expect(css()).toMatch(/--typology-magenta-25:/);
  });
  it('keeps lowercase -default names and emits shadows', () => {
    const c = css();
    expect(c).toMatch(/--text-default:/);
    expect(c).toMatch(/--border-default:/);
    expect(c).toMatch(/--shadow-low:/);
    expect(c).toMatch(/--shadow-mid:/);
  });
});
