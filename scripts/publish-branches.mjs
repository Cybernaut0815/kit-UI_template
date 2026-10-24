// Publishes each package's built dist as a flat, tokenless, git-URL-installable branch.
// Consumers install with `github:GitZHACODE/zha-ui#release/<pkg>` - no PAT, no .npmrc,
// just their existing git access. Each release also gets a pinnable tag `<pkg>-v<version>`.
// Idempotent: a package whose version tag already exists on the remote is skipped, so
// version tags are immutable (consumer lockfiles pin the resolved sha) and the CI step
// can run on every push to main - it self-heals after a partial failure and bootstraps
// missing branches for the current version.
// ponytail: branch-based delivery sidesteps GitHub Packages auth for a private monorepo;
//           upgrade path is a dedicated repo or public npmjs if consumer count grows.
//
// Run: node scripts/publish-branches.mjs   (needs GITHUB_TOKEN, run after build)
// flatten() is unit-tested in packages/css/test/publish-branches.test.mjs.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { argv } from 'node:process';
import { fileURLToPath } from 'node:url';

const REPO = 'GitZHACODE/zha-ui';
const PKGS = ['tokens', 'css']; // publishable packages; packages/runtime is private

// Strip build-only fields; rewrite workspace:* deps to the DEPENDENCY's own release tag
// (depVersions maps package name → its actual version - packages version independently
// unless the changeset `fixed` group says otherwise, so never assume the consumer's).
export function flatten(pkg, depVersions) {
  const deps = Object.fromEntries(
    Object.entries(pkg.dependencies ?? {}).map(([name, spec]) => {
      if (!spec.startsWith('workspace:')) return [name, spec];
      const stem = name.replace('@gitzhacode/zha-ui-', '');
      if (stem === name || !depVersions[name]) {
        throw new Error(`workspace dep ${name} is not a known @gitzhacode/zha-ui-* package`);
      }
      return [name, `github:${REPO}#${stem}-v${depVersions[name]}`];
    }),
  );
  return {
    name: pkg.name,
    version: pkg.version,
    license: pkg.license,
    author: pkg.author,
    type: pkg.type,
    exports: pkg.exports,
    sideEffects: pkg.sideEffects,
    repository: pkg.repository,
    ...(Object.keys(deps).length ? { dependencies: deps } : {}),
  };
}

// Run the publish only when invoked directly. realpath both sides: Node realpaths the
// ESM entry URL but not argv[1], so a symlinked/junctioned checkout would otherwise
// silently no-op (fail-open) on the string compare.
const invokedDirectly = argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(argv[1]);

if (invokedDirectly) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN required');
  const remote = `https://x-access-token:${token}@github.com/${REPO}.git`;
  const git = (cwd, ...args) => execFileSync('git', args, { cwd, stdio: 'inherit' });
  const readPkg = (dir) => JSON.parse(readFileSync(`packages/${dir}/package.json`, 'utf8'));

  // Fail loud if a new publishable package isn't wired into this script.
  for (const dir of readdirSync('packages')) {
    if (!readPkg(dir).private && !PKGS.includes(dir)) {
      throw new Error(`packages/${dir} is publishable but missing from PKGS - add it (and its release branch docs)`);
    }
  }

  const versions = Object.fromEntries(PKGS.map((p) => { const m = readPkg(p); return [m.name, m.version]; }));

  for (const pkg of PKGS) {
    const meta = readPkg(pkg);
    const branch = `release/${pkg}`;
    const tag = `${pkg}-v${meta.version}`;

    // Tag exists → this version is already published; never move a published tag.
    try {
      execFileSync('git', ['ls-remote', '--exit-code', remote, `refs/tags/${tag}`], { stdio: 'ignore' });
      console.log(`skip ${pkg}: ${tag} already on remote`);
      continue;
    } catch { /* tag missing → publish */ }

    const work = mkdtempSync(join(tmpdir(), `zha-rel-${pkg}-`));
    try {
      cpSync(`packages/${pkg}/dist`, join(work, 'dist'), { recursive: true });
      writeFileSync(join(work, 'package.json'), JSON.stringify(flatten(meta, versions), null, 2) + '\n');
      cpSync('README.md', join(work, 'README.md'));

      git(work, 'init', '-q');
      git(work, 'config', 'user.name', 'zha-ui release');
      git(work, 'config', 'user.email', 'release@zha.com');
      git(work, 'checkout', '-q', '-b', branch);
      git(work, 'add', '-A');
      git(work, 'commit', '-qm', `release: ${tag}`);
      git(work, 'tag', tag);
      git(work, 'push', '-f', remote, branch, tag); // one push: branch+tag land together
      console.log(`published ${branch} + ${tag}`);
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  }
}
