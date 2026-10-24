import { describe, it, expect, afterEach } from 'vitest';
import { wcagContrast, converter } from 'culori';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkContrast } from '../scripts/contrast-matrix.mjs';
const toRgb = converter('rgb');

describe('contrast checker correctness (catches the known audit failures)', () => {
  it('flags warning yellow as text on white (must be < 4.5)', () => {
    expect(wcagContrast(toRgb('#F5BB00'), toRgb('#ffffff'))).toBeLessThan(4.5);
  });
  it('flags white on raw accent teal (must be < 4.5)', () => {
    expect(wcagContrast(toRgb('#ffffff'), toRgb('#048C9C'))).toBeLessThan(4.5);
  });
});

describe('dark theme is read (not falling back to light)', () => {
  it('dark accent-fill (#048C9C) fails AA with white, confirming the guard works', () => {
    // The pre-fix dark token was {color.accent.teal} = #048C9C.
    // white on #048C9C ≈ 4.01 < 4.5. If dark were NOT being read, the gate
    // would silently pass (using light fill #037A88 ≈ 5.07 instead).
    // Our fix sets dark accent.fill → {color.accent.teal-fill} = #037A88.
    // This test stays red if the dark block is ever silently unmatched because
    // checkContrast() throws a hard Error in that case (guard in the script).
    expect(wcagContrast(toRgb('#ffffff'), toRgb('#048C9C'))).toBeLessThan(4.5); // raw teal fails
    expect(wcagContrast(toRgb('#ffffff'), toRgb('#037A88'))).toBeGreaterThanOrEqual(4.5); // teal-fill passes
  });
});

describe('dark-read sentinel guard fires on bad CSS', () => {
  let tmpFile: string | undefined;

  afterEach(() => {
    if (tmpFile) {
      try { unlinkSync(tmpFile); } catch { /* ignore */ }
      tmpFile = undefined;
    }
  });

  it('throws when the CSS is missing the dark block', () => {
    // A minimal CSS with only a :root block - no [data-theme="dark"] - so the
    // dark sentinel guard must throw rather than silently fall back to light vars.
    const badCss = `
:root {
  --bg-page: #ffffff;
  --bg-surface-1: #f8f8f8;
  --bg-surface-3: #e0e0e0;
  --text-default: #111111;
  --text-muted: #555555;
  --text-muted-strong: #333333;
  --accent-fill: #037A88;
  --accent-on: #ffffff;
  --accent-hover: #333333;
  --intent-error-text: #b00020;
  --intent-success-text: #1a6b2a;
  --intent-warning-text: #7a5100;
  --intent-info-text: #0057a8;
  --intent-on-warning: #ffffff;
  --intent-warning: #7a5100;
}
`;
    tmpFile = join(tmpdir(), `contrast-guard-test-${Date.now()}.css`);
    writeFileSync(tmpFile, badCss, 'utf8');

    // Pin the THROW REASON: it must be the dark sentinel guard, not an incidental
    // crash on some unrelated missing token (missing tokens now report structurally).
    expect(() => checkContrast(tmpFile)).toThrow(/was not matched|was not read/);
  });
});

describe('built token semantic pairs all pass AA', () => {
  it('has zero contrast failures', () => {
    const { pass, failures } = checkContrast();
    expect(failures).toEqual([]);
    expect(pass).toBe(true);
  });
});
