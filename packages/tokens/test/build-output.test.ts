import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

describe('token build', () => {
  it('emits at least one colour token as an oklch CSS variable', () => {
    const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
    expect(css).toMatch(/--color-typology-teal:\s*oklch\(/);
  });

  // Regression: the oklch overlay used to drop every {alias} token, so the dark
  // block inside @supports re-declared none of its text colours. The oklch :root
  // (light) values then won the cascade in oklch-capable browsers, rendering
  // dark-mode body text dark-on-dark (invisible). The oklch dark overlay MUST
  // re-assert every text override the dark theme defines.
  it('re-declares dark text overrides inside the @supports(oklch) block', () => {
    const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
    const oklchSection = css.slice(css.indexOf('@supports (color: oklch'));
    const darkBlock = oklchSection.match(/\[data-theme="dark"\]\s*\{([^}]*)\}/);
    expect(darkBlock, 'oklch overlay has a [data-theme="dark"] block').not.toBeNull();
    for (const v of ['--text-default', '--text-muted', '--text-disabled']) {
      expect(darkBlock![1], `oklch dark block declares ${v}`).toContain(v);
    }
  });

  // Keystone: a [data-theme="light"] counter-scope block lets a light region nest
  // inside a dark/brand ancestor (light is the :root default but doesn't otherwise
  // re-assert on a descendant). It must be SYMMETRIC with dark - own accent + the
  // AA-safe intent-*-text - and appear in BOTH the hex cascade and the oklch overlay
  // (oklchKeepRefs), or a nested island inherits the ancestor's dark values.
  it('ships a [data-theme="light"] counter-scope block, symmetric with dark, in both cascades', () => {
    const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
    const hexLight = css.slice(0, css.indexOf('@supports (color: oklch'))
      .match(/\[data-theme="light"\]\s*\{([^}]*)\}/);
    expect(hexLight, 'hex cascade has a [data-theme="light"] block').not.toBeNull();
    for (const v of ['--accent:', '--accent-fill:', '--intent-warning-text:', '--text-default:', '--border-default:', '--bg-page:', '--typology-purple-text:', '--typology-yellow-text:'])
      expect(hexLight![1], `light block declares ${v}`).toContain(v);
    // AA-safe warning text (light), not the raw yellow the dark theme uses.
    expect(hexLight![1]).toMatch(/--intent-warning-text:\s*#7A5B00/i);
    const oklchLight = css.slice(css.indexOf('@supports (color: oklch'))
      .match(/\[data-theme="light"\]\s*\{([^}]*)\}/);
    expect(oklchLight, 'oklch overlay re-asserts [data-theme="light"]').not.toBeNull();
  });

  it('ships the retuned + extended scale primitives', () => {
    const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
    // radius tightened (value-only retune)
    expect(css).toContain('--radius-s: 4px');
    expect(css).toContain('--radius-m: 8px');
    expect(css).toContain('--radius-l: 12px');
    expect(css).toContain('--radius-pill: 999px');
    // motion tightened + spring added
    expect(css).toContain('--motion-fast: 150ms');
    expect(css).toContain('--motion-base: 200ms');
    expect(css).toContain('--motion-slow: 300ms');
    expect(css).toMatch(/--ease-spring:\s*cubic-bezier\(0\.175, 0\.885, 0\.32, 1\.1\)/);
    // hero type step + section spacing
    expect(css).toContain('--fs-hero: 32px');
    expect(css).toContain('--space-10: 40px');
    expect(css).toContain('--space-12: 48px');
    expect(css).toContain('--space-16: 64px');
  });

  it('ships the tracking scale (display tighter; label/small positive)', () => {
    const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
    expect(css).toContain('--tracking-display: -0.04em');
    expect(css).toContain('--tracking-body: -0.01em');
    expect(css).toContain('--tracking-label: 0.01em');
    expect(css).toContain('--tracking-small: 0.01em');
  });

  it('ships shadow-high (overlay) and the row-h density token', () => {
    const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
    expect(css).toContain('--shadow-high: 0 8px 24px rgba(0,0,0,0.16)');
    expect(css).toMatch(/:root\s*\{[^}]*--row-h:\s*44px/s);
    const compact = css.slice(css.indexOf('[data-density="compact"]'));
    expect(compact).toContain('--row-h: 36px');
  });

  // Spec 3 §4 - the composition-layer tokens. Base build emits aliases as var() references
  // (outputReferences: true); the density build emits literals (its source has no primitives).
  it('ships the composition-layer tokens in :root', () => {
    const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');
    const root = css.slice(css.indexOf(':root {'), css.indexOf('[data-theme="dark"]'));
    expect(root).toMatch(/--fs-h1:\s*20px;/);
    expect(root).toMatch(/--fs-hero-xl:\s*clamp\(2\.5rem, 1\.5rem \+ 4vw, 4\.5rem\);/);
    expect(root).toMatch(/--fs-reading:\s*16px;/);
    expect(root).toMatch(/--leading-prose:\s*1\.5;/);          // ; anchors the value: 1.55 must not pass
    expect(root).toMatch(/--leading-heading:\s*1\.15;/);
    expect(root).toMatch(/--measure:\s*65ch;/);
    expect(root).toMatch(/--space-section:\s*var\(--space-12\);/);
    expect(root).toMatch(/--space-block:\s*var\(--space-6\);/);
    expect(root).toMatch(/--space-inline:\s*var\(--space-3\);/);
    expect(root).toMatch(/--gutter:\s*var\(--space-6\);/);     // top-level token: --gutter, not --space-gutter
    expect(root).toMatch(/--z-sticky:\s*10;/);                 // ; anchors the value: 100 must not pass
    expect(root).toMatch(/--z-toast:\s*100;/);
  });

  it('compact density remaps the three rhythm tiers', () => {
    const css = readFileSync(new URL('../dist/tokens-density.css', import.meta.url), 'utf8');
    expect(css).toMatch(/--space-section:\s*32px;/);
    expect(css).toMatch(/--space-block:\s*16px;/);
    expect(css).toMatch(/--space-inline:\s*8px;/);
  });

  it('llms.txt carries values, the space/radius groups, and points at classes.txt', () => {
    const txt = readFileSync(new URL('../dist/llms.txt', import.meta.url), 'utf8');
    expect(txt).toMatch(/^--space-4: 16px$/m);
    expect(txt).toMatch(/^--radius-m: 8px$/m);
    expect(txt).toMatch(/^--fs-h1: 20px$/m);
    expect(txt).toMatch(/^--accent$/m);                        // colour tokens stay name-only (per-theme values)
    expect(txt).toMatch(/classes\.txt/);
    expect(txt).toMatch(/skills\/zha-ui\/SKILL\.md/);
    expect(txt).toMatch(/^--focus-ring \(deprecated: the package paints focus as an outline; kept for consumers that referenced it\)$/m);   // name-only (a shadow with colour refs) plus the deprecation the spec requires
    expect(txt).toMatch(/^--grad-spectrum$/m);                  // gradients stay name-only: applied via classes, never read
    const tokenLines = txt.split('\n').filter((l) => l.startsWith('--')).join('\n');
    expect(tokenLines).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i);   // no colour literal on any token line
    expect(txt).not.toMatch(/\.skeleton \.sr-only$/m);         // the stale nine-class line is gone
  });
});
