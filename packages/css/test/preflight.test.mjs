// Guards the consumer preflight's verdicts (scripts/preflight.mjs at repo root). The stderr
// strings are what git 2.47 for Windows printed against GitHub on 14 Oct 2026.
import { describe, it, expect } from 'vitest';
import { classify } from '../../../scripts/preflight.mjs';

const SHA = '9cfd26f8b7422f7e87fc981866a77ab2f035df84';

describe('preflight classify()', () => {
  it('reports ok with the release/css sha', () => {
    expect(classify({ status: 0, stdout: `${SHA}\trefs/heads/release/css\n`, stderr: '' }))
      .toEqual({ line: `ok: your git can read zha-ui (release/css at ${SHA})`, code: 0 });
  });
  it.each([
    // Git Credential Manager holding no credential, GCM_INTERACTIVE=never, GIT_ASKPASS=echo
    "fatal: Cannot prompt because user interactivity has been disabled.\nremote: Invalid username or token. Password authentication is not supported for Git operations.\nfatal: Authentication failed for 'https://github.com/GitZHACODE/zha-ui/'\n",
    // no credential helper and no askpass
    "fatal: could not read Username for 'https://github.com': terminal prompts disabled\n",
  ])('names sign-in when git has no credential: %#', (stderr) => {
    const { line, code } = classify({ status: 128, stdout: '', stderr });
    expect(code).toBe(1);
    expect(line).toMatch(/^sign in: .*`gh auth login`/);
  });
  it('names no access when GitHub hides the repository from a signed-in account', () => {
    const stderr = "remote: Repository not found.\nfatal: repository 'https://github.com/GitZHACODE/zha-ui/' not found\n";
    expect(classify({ status: 128, stdout: '', stderr }))
      .toEqual({ line: 'no access: your GitHub account cannot read GitZHACODE/zha-ui - ask the zha-ui maintainers for access', code: 2 });
  });
  it.each([
    [{ status: null, error: Object.assign(new Error('spawnSync git ETIMEDOUT'), { code: 'ETIMEDOUT' }) }, 'no answer within 20 seconds'],
    [{ status: null, error: Object.assign(new Error('spawnSync git ENOENT'), { code: 'ENOENT' }) }, 'git is not installed or not on PATH'],
    [{ status: 128, stdout: '', stderr: "fatal: unable to access 'https://github.com/GitZHACODE/zha-ui/': Could not resolve host: github.com\n" }, 'Could not resolve host: github.com'],
    // git ran and exited 0 but release/css is missing: stdout is empty
    [{ status: 0, stdout: '', stderr: '' }, 'git exited with status 0 and printed no release/css line'],
  ])('never turns a timeout, a missing git or a network failure into an access verdict: %#', (result, reason) => {
    const { line, code } = classify(result);
    expect(code).toBe(3);
    expect(line).toMatch(/^could not run git: /);
    expect(line).toContain(reason);
  });
  it('reports a 403 (SAML SSO or IP allow-list) as could-not-run with the remote: line, not as no access', () => {
    const saml = "remote: The 'GitZHACODE' organization has enabled or enforced SAML SSO. To access this repository, visit https://github.com/orgs/GitZHACODE/sso?authorization_request=TOKEN and try your request again.";
    const stderr = `${saml}\nfatal: unable to access 'https://github.com/GitZHACODE/zha-ui/': The requested URL returned error: 403\n`;
    expect(classify({ status: 128, stdout: '', stderr })).toEqual({ line: `could not run git: ${saml}`, code: 3 });
  });
});
