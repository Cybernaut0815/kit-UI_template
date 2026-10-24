// Guards the release-branch flatten() logic (scripts/publish-branches.mjs at repo root):
// a regression here ships as a broken consumer install, so it must run in the CI gate.
import { describe, it, expect } from 'vitest';
import { flatten } from '../../../scripts/publish-branches.mjs';

const cssPkg = {
  name: '@gitzhacode/zha-ui-css', version: '0.2.0', type: 'module',
  scripts: { build: 'x' }, devDependencies: { vitest: '^2' }, publishConfig: {}, files: ['dist'],
  dependencies: { '@gitzhacode/zha-ui-tokens': 'workspace:*', culori: '^4.0.0' },
};

describe('publish-branches flatten()', () => {
  it('pins workspace deps to the DEPENDENCY package own version, not the consumer version', () => {
    const out = flatten(cssPkg, { '@gitzhacode/zha-ui-tokens': '0.1.1' }); // divergent on purpose
    expect(out.dependencies['@gitzhacode/zha-ui-tokens']).toBe('github:GitZHACODE/zha-ui#tokens-v0.1.1');
  });
  it('passes real registry deps through untouched', () => {
    const out = flatten(cssPkg, { '@gitzhacode/zha-ui-tokens': '0.1.1' });
    expect(out.dependencies.culori).toBe('^4.0.0');
  });
  it('strips build-only fields so the git-installed package is inert', () => {
    const out = flatten(cssPkg, { '@gitzhacode/zha-ui-tokens': '0.1.1' });
    for (const k of ['scripts', 'devDependencies', 'publishConfig', 'files']) expect(out).not.toHaveProperty(k);
  });
  it('throws on a workspace dep outside the zha-ui naming convention instead of emitting a malformed ref', () => {
    const bad = { ...cssPkg, dependencies: { '@gitzhacode/other-thing': 'workspace:*' } };
    expect(() => flatten(bad, {})).toThrow(/not a known/);
  });
});
