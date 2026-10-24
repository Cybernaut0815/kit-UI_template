// Consumer preflight: can this machine's git read the private zha-ui repository?
// npm installs `github:GitZHACODE/zha-ui#release/css` by cloning with the developer's own git
// credentials and no prompts (GIT_ASKPASS=echo), so this makes the same read and names the fix.
// GCM_INTERACTIVE=never stops Git Credential Manager opening a browser: a check must not block.
//
// Run: node scripts/preflight.mjs   (no dependencies; prints one line;
//      exit 0 ok, 1 sign in, 2 no access, 3 could not run git)
// classify() is unit-tested in packages/css/test/preflight.test.mjs.
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { argv, env } from 'node:process';
import { fileURLToPath } from 'node:url';

const SECONDS = 20;

export function classify({ status, stdout = '', stderr = '', error }) {
  const sha = (stdout ?? '').match(/^[0-9a-f]{40}/m)?.[0]; // spawnSync gives null, not undefined, when git never ran
  if (status === 0 && sha) return { line: `ok: your git can read zha-ui (release/css at ${sha})`, code: 0 };
  if (error) {
    const reason = { ENOENT: 'git is not installed or not on PATH', ETIMEDOUT: `no answer within ${SECONDS} seconds` }[error.code];
    return { line: `could not run git: ${reason ?? error.message}`, code: 3 };
  }
  // Observed: GCM with no credential prints "Cannot prompt ..." then "Authentication failed";
  // with no helper at all git prints "could not read Username ...: terminal prompts disabled".
  if (/could not read Username|terminal prompts disabled|Authentication failed|Invalid username or token|Cannot prompt|No credential/i.test(stderr)) {
    return { line: 'sign in: git has no GitHub credential on this machine - run `gh auth login`, or clone any private GitZHACODE repository once so Git Credential Manager stores one', code: 1 };
  }
  // Not reproducible from an account that has access. GitHub answers a signed-in account that
  // cannot read a private repository exactly as it answers a missing one; the test uses the
  // string observed for a missing GitZHACODE repository. A 403 is not this: it is a SAML SSO or
  // IP allow-list refusal, fixed by authorising the credential, so it falls through below.
  if (/Repository not found|repository '[^']*' not found/i.test(stderr)) {
    return { line: 'no access: your GitHub account cannot read GitZHACODE/zha-ui - ask the zha-ui maintainers for access', code: 2 };
  }
  // DNS, proxy, TLS, a 403 or an empty answer is not an access verdict: a wrong name is worse than
  // none. GitHub's first remote: line carries the reason (for SAML, the URL that authorises), so prefer it.
  const lines = stderr.trim().split(/\r?\n/);
  const reason = lines.find((l) => l.startsWith('remote:')) ?? lines.pop();
  return { line: `could not run git: ${reason || `git exited with status ${status} and printed no release/css line`}`, code: 3 };
}

// Same direct-run guard as publish-branches.mjs (realpath both sides, so a junctioned checkout runs).
const invokedDirectly = argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(argv[1]);

if (invokedDirectly) {
  const result = spawnSync('git', ['ls-remote', 'https://github.com/GitZHACODE/zha-ui', 'refs/heads/release/css'], {
    encoding: 'utf8',
    timeout: SECONDS * 1000,
    env: { ...env, GIT_ASKPASS: 'echo', GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' },
  });
  const { line, code } = classify(result);
  console.log(line);
  process.exitCode = code;
}
