import { existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const p = (f: string) => new URL(`../dist/${f}`, import.meta.url);

describe('build outputs', () => {
  it('emits css/ts/json/tailwind/llms', () => {
    for (const f of [
      'tokens.css',
      'tokens.js',
      'tokens.d.ts',
      'tokens.json',
      'tailwind-preset.js',
      'tailwind-preset.d.ts',
      'llms.txt',
    ]) {
      expect(existsSync(p(f)), `dist/${f} should exist`).toBe(true);
    }
  });
});
