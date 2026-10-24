import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
const root = new URL('../../../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

// Review Focus 5 (2026-10-06): one skill, named after its folder, and a reference that covers every shipped class.
describe('skills/zha-ui', () => {
  it('has the Agent Skills frontmatter and is the only SKILL.md in the repo', () => {
    const skill = read('skills/zha-ui/SKILL.md');
    expect(skill).toMatch(/^---\r?\nname: zha-ui\r?\n/);
    const desc = skill.match(/^description: (.+?)\r?$/m)?.[1] ?? '';
    expect(desc.length).toBeGreaterThan(0);
    expect(desc.length).toBeLessThanOrEqual(1024);
    expect(skill).toMatch(/\[reference\.md\]\(reference\.md\)/);
    const found: string[] = [];
    const walk = (dir: string) => { for (const n of readdirSync(dir)) { if (n === 'node_modules' || n === 'dist' || n.startsWith('.')) continue; const p = join(dir, n); if (statSync(p).isDirectory()) walk(p); else if (n === 'SKILL.md') found.push(p); } };
    walk(fileURLToPath(root));
    expect(found.map((p) => p.replaceAll('\\', '/'))).toEqual([fileURLToPath(new URL('skills/zha-ui/SKILL.md', root)).replaceAll('\\', '/')]);
  });
  it('reference.md names every class in classes.txt', () => {
    const ref = read('skills/zha-ui/reference.md');
    const classes = readFileSync(new URL('../dist/classes.txt', import.meta.url), 'utf8').trim().split('\n');
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const missing = classes.filter((c) => !new RegExp(esc(c) + '(?![\\w-])').test(ref));
    expect(missing, 'classes with no row or mention in reference.md').toEqual([]);
  });
  it('SKILL.md lists exactly the nine knobs the drift guard allows', () => {
    const doc = read('skills/zha-ui/SKILL.md').match(/the nine knobs: `([^`]+)`/)?.[1] ?? '';
    const guard = read('examples/_drift-guard.mjs').match(/const KNOBS = new Set\(\[([^\]]+)\]\)/)?.[1] ?? '';
    const inGuard = [...guard.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
    expect(doc.split(/\s+/).sort()).toEqual(inGuard);
    expect(inGuard).toHaveLength(9);
  });
});
