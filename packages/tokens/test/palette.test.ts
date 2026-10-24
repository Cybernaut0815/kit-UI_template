import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const css = () => readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');

describe('primitive palette', () => {
  it('emits all 12 typology hues as oklch vars', () => {
    const names = ['purple','ultramarine','blue','teal','dark-green','light-green','lime','yellow','apricot','orange','cool-red','magenta'];
    for (const n of names) expect(css()).toMatch(new RegExp(`--color-typology-${n}:\\s*oklch\\(`));
  });
  it('keeps brand-pure neutrals (black, concrete, white) and type greys', () => {
    for (const n of ['black','concrete','white','gray-99','gray-77','gray-33'])
      expect(css()).toMatch(new RegExp(`--color-neutral-${n}:\\s*oklch\\(`));
  });
});
