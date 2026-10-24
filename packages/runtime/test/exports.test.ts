import { existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { cssVar } from '../src/cssVar.js';

// Compile-time contract check: fails `lint` (tsc) if cssVar.d.ts drifts from
// (name: string, fallback?: string) => string. Erased at runtime.
type Contract = typeof cssVar extends (name: string, fallback?: string) => string ? true : never;
const _contract: Contract = true;

describe('@gitzhacode/zha-ui-runtime', () => {
  // .d.ts is types-only (never runtime-imported), so assert it ships.
  it('ships cssVar.d.ts alongside the source', () => {
    expect(existsSync(new URL('../src/cssVar.d.ts', import.meta.url))).toBe(true);
  });

  // Importing in node (no DOM) must not throw - proves the canvas is created
  // lazily inside cssVar(), not at module load. Calling it needs a browser.
  it('imports without a DOM and exports cssVar()', () => {
    expect(typeof cssVar).toBe('function');
    void _contract;
  });
});
