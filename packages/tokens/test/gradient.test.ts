import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const css = () => readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');

describe('gradient library tokens', () => {
  it('emits the four frozen hero-mesh tokens with their authored sRGB hex', () => {
    const c = css();
    // one signature authored hex per mesh - proves no oklch conversion / retuning
    expect(c).toMatch(/--grad-hero-ember:[^;]*#a03a1a/);
    expect(c).toMatch(/--grad-hero-ocean:[^;]*#1a22bb/);
    expect(c).toMatch(/--grad-hero-violet:[^;]*#7a1870/);
    expect(c).toMatch(/--grad-hero-dusk:[^;]*#1a0a60/);
    // each ends on its base floor as the bottom background-image layer
    expect(c).toMatch(/--grad-hero-ember:[^;]*linear-gradient\(#110008,#110008\)/);
    expect(c).toMatch(/--grad-hero-dusk:[^;]*linear-gradient\(#05030f,#05030f\)/);
  });

  it('hero meshes are frozen art: emitted once (:root only), never inside the oklch overlay', () => {
    const c = css();
    expect(c.match(/--grad-hero-ember:/g)).toHaveLength(1);
    expect(c).not.toMatch(/--grad-hero-[a-z]+:[^;]*oklch\(/);
  });

  it('emits the spectrum pair: sRGB base + in-oklch variant, 12 typology stops each', () => {
    const c = css();
    const base = c.match(/--grad-spectrum:\s*([^;]+);/)?.[1] ?? '';
    const vivid = c.match(/--grad-spectrum-oklch:\s*([^;]+);/)?.[1] ?? '';
    expect(base).toContain('linear-gradient(105deg,');
    expect(base).not.toContain('in oklch');
    expect(vivid).toContain('linear-gradient(105deg in oklch,');
    expect(base.match(/var\(--color-typology-/g)).toHaveLength(12);
    expect(vivid.match(/var\(--color-typology-/g)).toHaveLength(12);
  });

  it('emits the team subtle gradient + washes from live accent vars', () => {
    const c = css();
    expect(c).toMatch(
      /--brand-grad-subtle:\s*linear-gradient\(105deg, var\(--accent-subtle\) 0%, var\(--accent-2-subtle\) 100%\)/,
    );
    expect(c).toMatch(
      /--grad-wash:\s*linear-gradient\(180deg, var\(--accent-subtle\) 0%, transparent 100%\)/,
    );
    expect(c).toMatch(
      /--grad-glow:\s*radial-gradient\(ellipse 90% 70% at 50% -10%, var\(--accent-subtle\) 0%, transparent 70%\)/,
    );
  });

  const POOL = [
    'polar', 'blaze', 'reef', 'nova', 'orchid',   // J · journeys
    'beacon', 'sundial', 'prism', 'verdigris',    // C · conics
    'borealis', 'nebula', 'abyss', 'furnace',     // A · auroras
    'signal', 'terra', 'regatta',                 // D · fields
  ];
  const val = (c: string, name: string) => c.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim() ?? '';

  it('emits the journey + field linears verbatim from the approved preview', () => {
    const c = css();
    expect(val(c, 'grad-pair-polar')).toBe('linear-gradient(160deg, var(--color-typology-purple) 0%, var(--color-typology-ultramarine) 45%, var(--color-typology-teal) 100%)');
    expect(val(c, 'grad-pair-blaze')).toBe('linear-gradient(15deg, var(--color-typology-magenta) 0%, var(--color-typology-orange) 55%, var(--color-typology-yellow) 100%)');
    expect(val(c, 'grad-pair-reef')).toBe('linear-gradient(75deg, var(--color-typology-teal) 0 14%, var(--color-typology-dark-green) 48%, var(--color-typology-lime) 100%)');
    expect(val(c, 'grad-pair-nova')).toBe('linear-gradient(135deg, var(--color-typology-ultramarine) 0%, var(--color-typology-magenta) 50%, var(--color-typology-apricot) 100%)');
    expect(val(c, 'grad-pair-orchid')).toBe('linear-gradient(180deg, var(--color-typology-blue) 0%, var(--color-typology-purple) 55%, var(--color-typology-magenta) 100%)');
    expect(val(c, 'grad-pair-signal')).toBe('linear-gradient(118deg, var(--color-typology-lime) 0 32%, var(--color-typology-ultramarine) 68% 100%)');
    expect(val(c, 'grad-pair-terra')).toBe('linear-gradient(0deg, var(--color-typology-dark-green) 0 38%, var(--color-typology-yellow) 54%, var(--color-typology-apricot) 68% 100%)');
    expect(val(c, 'grad-pair-regatta')).toBe('linear-gradient(135deg, var(--color-typology-blue) 0 28%, var(--color-typology-orange) 46% 54%, var(--color-typology-blue) 72% 100%)');
  });

  it('emits the conics: off-canvas centres, wrap-held to 360deg, sRGB only', () => {
    const c = css();
    expect(val(c, 'grad-pair-beacon')).toBe('conic-gradient(from 115deg at 105% -10%, var(--color-typology-teal) 55deg, var(--color-typology-ultramarine) 105deg, var(--color-typology-teal) 155deg, var(--color-typology-teal) 360deg)');
    expect(val(c, 'grad-pair-sundial')).toBe('conic-gradient(from 250deg at 50% 118%, var(--color-typology-yellow) 0deg, var(--color-typology-apricot) 60deg, var(--color-typology-orange) 120deg, var(--color-typology-cool-red) 180deg, var(--color-typology-cool-red) 360deg)');
    expect(val(c, 'grad-pair-prism')).toBe('conic-gradient(from 315deg at -10% 115%, var(--color-typology-purple) 0deg, var(--color-typology-magenta) 65deg, var(--color-typology-cool-red) 125deg, var(--color-typology-cool-red) 360deg)');
    expect(val(c, 'grad-pair-verdigris')).toBe('conic-gradient(from 125deg at 105% -10%, var(--color-typology-dark-green) 62deg, var(--color-typology-teal) 108deg, var(--color-typology-blue) 152deg, var(--color-typology-blue) 360deg)');
  });

  it('emits the auroras as color-mix radial stacks ONLY - the floor is class-level, not a token layer', () => {
    const c = css();
    expect(val(c, 'grad-pair-borealis')).toBe('radial-gradient(ellipse 28% 22% at 82% 72%, color-mix(in srgb, var(--color-typology-light-green) 95%, transparent) 0%, transparent 75%), radial-gradient(ellipse 75% 60% at 20% 22%, color-mix(in srgb, var(--color-typology-ultramarine) 82%, transparent) 0%, transparent 62%), radial-gradient(ellipse 52% 44% at 80% 72%, color-mix(in srgb, var(--color-typology-light-green) 68%, transparent) 0%, transparent 58%), radial-gradient(ellipse 90% 40% at 55% 45%, color-mix(in srgb, var(--color-typology-teal) 30%, transparent) 0%, transparent 70%)');
    expect(val(c, 'grad-pair-nebula')).toBe('radial-gradient(ellipse 80% 85% at 30% 40%, color-mix(in srgb, var(--color-typology-purple) 72%, transparent) 0%, transparent 65%), radial-gradient(ellipse 40% 35% at 85% 15%, color-mix(in srgb, var(--color-typology-apricot) 80%, transparent) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 70% 80%, color-mix(in srgb, var(--color-typology-magenta) 34%, transparent) 0%, transparent 62%)');
    expect(val(c, 'grad-pair-abyss')).toBe('radial-gradient(ellipse 95% 75% at 50% 108%, color-mix(in srgb, var(--color-typology-blue) 88%, transparent) 0%, transparent 70%), radial-gradient(ellipse 55% 38% at 22% 6%, color-mix(in srgb, var(--color-typology-dark-green) 68%, transparent) 0%, transparent 58%), radial-gradient(ellipse 80% 35% at 65% 45%, color-mix(in srgb, var(--color-typology-teal) 26%, transparent) 0%, transparent 68%)');
    expect(val(c, 'grad-pair-furnace')).toBe('radial-gradient(ellipse 70% 55% at 75% 70%, color-mix(in srgb, var(--color-typology-orange) 80%, transparent) 0%, transparent 62%), radial-gradient(ellipse 55% 65% at 15% 30%, color-mix(in srgb, var(--color-typology-magenta) 62%, transparent) 0%, transparent 60%)');
    for (const name of ['borealis', 'nebula', 'abyss', 'furnace'])
      expect(val(c, `grad-pair-${name}`), `${name} has no floor layer`).not.toContain('linear-gradient');
  });

  it('cross-axis journeys/fields ship -oklch twins with identical stops; conics/auroras have none', () => {
    const c = css();
    for (const name of ['polar', 'nova', 'signal', 'terra', 'regatta']) {
      const base = val(c, `grad-pair-${name}`);
      const twin = val(c, `grad-pair-${name}-oklch`);
      expect(base, `${name} base is sRGB`).not.toContain('in oklch');
      expect(twin, `${name} twin = base + interpolation clause`).toBe(base.replace('deg,', 'deg in oklch,'));
    }
    expect(c).not.toMatch(/--grad-pair-(blaze|reef|orchid|beacon|sundial|prism|verdigris|borealis|nebula|abyss|furnace)-oklch/);
  });

  it('pool emits exactly the 16 signature-form entries, once each (flat-13 retired)', () => {
    const c = css();
    for (const name of POOL)
      expect(c.match(new RegExp(`--grad-pair-${name}:`, 'g')), `--grad-pair-${name} emitted once`).toHaveLength(1);
    const names = [...new Set([...c.matchAll(/--grad-pair-([\w-]+?)(?:-oklch)?:/g)].map((m) => m[1]))];
    expect(names.sort()).toEqual([...POOL].sort());
  });

  it('emits the team wardrobe from live accent vars; the conic clause sits AFTER the position (§6 trap)', () => {
    const c = css();
    expect(val(c, 'brand-grad-aurora')).toBe('radial-gradient(ellipse 75% 65% at 22% 28%, color-mix(in srgb, var(--accent) 75%, transparent) 0%, transparent 62%), radial-gradient(ellipse 65% 55% at 80% 75%, color-mix(in srgb, var(--accent-2) 68%, transparent) 0%, transparent 60%)');
    expect(val(c, 'brand-grad-conic')).toBe('conic-gradient(from 235deg at 50% 120%, var(--accent) 0deg, var(--accent) 45deg, var(--accent-2) 135deg, var(--accent-2) 360deg)');
    expect(val(c, 'brand-grad-conic-oklch')).toBe('conic-gradient(from 235deg at 50% 120% in oklch, var(--accent) 0deg, var(--accent) 45deg, var(--accent-2) 135deg, var(--accent-2) 360deg)');
    expect(val(c, 'brand-grad-duo')).toBe('linear-gradient(118deg, var(--accent) 0 35%, var(--accent-2) 65% 100%)');
    expect(val(c, 'brand-grad-duo-oklch')).toBe('linear-gradient(118deg in oklch, var(--accent) 0 35%, var(--accent-2) 65% 100%)');
  });

  it('llms.txt lists the pool, flags it un-assigned, and carries the aurora text rule', () => {
    const txt = readFileSync(new URL('../dist/llms.txt', import.meta.url), 'utf8');
    expect(txt).toContain('--grad-pair-polar');
    expect(txt).not.toContain('--grad-pair-electric');
    expect(txt).toMatch(/un-?assigned/i);
    expect(txt).toMatch(/aurora/i);
  });

  it('llms.txt lists the gradient vars AND flags them decorative-only', () => {
    const txt = readFileSync(new URL('../dist/llms.txt', import.meta.url), 'utf8');
    expect(txt).toContain('--grad-hero-ember'); // vars flow in automatically via the llms format
    expect(txt).toMatch(/decorative only/i);    // guidance line - without it an AI may paint heroes behind working UI
  });
});
