// Self-check for the shared deck/consumer drift guard (node:test, no deps).
// Run: node --test examples/drift-guard.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lint, jsxToMarkup } from './_drift-guard.mjs';

// The leading comment proves the strip: names mentioned in bundle comments (--text-*, .ghost) define nothing.
const BUNDLE = '/* tokens: --text-* and the .ghost class are only words here */\n:root{--text-default:#000;--x:#000;}\n.card{}\n.btn{}';
const style = (css) => `<html><style>${css}</style></html>`;

test('flags a stray */ that closes a CSS comment early (the 59a3ff6 bug)', () => {
  // The */ inside "--color-*/" closes the comment early; the real */ is then an
  // unmatched close. Token-clean, so the old regex guard passed it.
  const r = lint(style('/* note about --color-*/ adjacency */\n.a{color:var(--text-default);}'), BUNDLE);
  assert.ok(r.structural.length > 0, 'should report a structural defect');
});

test('flags unbalanced braces', () => {
  const r = lint(style('.a{color:var(--x);'), BUNDLE);
  assert.ok(r.structural.length > 0, 'unclosed rule should be flagged');
});

test('flags a bare CSS named colour in a value', () => {
  const r = lint(style('.a{color:crimson;}'), BUNDLE);
  assert.ok(r.colors.some((c) => /crimson/i.test(c)), 'crimson should be flagged');
});

test('flags a hardcoded hex literal', () => {
  const r = lint(style('.a{color:#CB0092;}'), BUNDLE);
  assert.ok(r.colors.includes('#CB0092'), 'hex literal should be flagged');
});

test('flags a var() that is not defined in the bundle', () => {
  const r = lint(style('.a{color:var(--nope);}'), BUNDLE);
  assert.ok(r.missing.includes('--nope'), 'unknown var should be flagged');
});

test('allows neutral black/white alpha (shadows, scrims)', () => {
  const r = lint(style('.a{box-shadow:0 1px 2px rgba(0,0,0,0.1);background:rgba(255,255,255,0.08);}'), BUNDLE);
  assert.equal(r.colors.length, 0, 'neutral alphas are allowed');
});

test('passes clean, balanced, token-only CSS', () => {
  const r = lint(style('/* fine */ .a{color:var(--text-default);border:1px solid rgba(0,0,0,0.14);}'), BUNDLE);
  assert.deepEqual({ m: r.missing, c: r.colors, s: r.structural }, { m: [], c: [], s: [] });
});

test('checkClasses:true flags an unknown class', () => {
  const r = lint('<div class="card made-up-class"></div>', BUNDLE, { checkClasses: true });
  assert.ok(r.missing.includes('.made-up-class'), 'unknown class should be flagged');
  assert.ok(!r.missing.includes('.card'), 'known class should pass');
});

// Spec 3 §7 - inline styles may only set documented knobs (Review Focus 5).
test('inlineKnobsOnly: accepts a listed knob', () => {
  const r = lint('<div class="grid" style="--grid-min: 11rem"></div>', BUNDLE, { inlineKnobsOnly: true });
  assert.deepEqual(r.inline, []);
});
test('inlineKnobsOnly: rejects a layout declaration', () => {
  const r = lint('<div class="card" style="padding: var(--space-5)"></div>', BUNDLE, { inlineKnobsOnly: true });
  assert.deepEqual(r.inline, ['padding: var(--space-5)']);
});
test('inlineKnobsOnly: rejects an unknown custom property', () => {
  const r = lint('<div style="--foo: 1; --control-h: 24px"></div>', BUNDLE, { inlineKnobsOnly: true });
  assert.deepEqual(r.inline, ['--foo: 1']);
});
test('inlineKnobsOnly off: inline styles are not reported', () => {
  const r = lint('<div style="padding: 4px"></div>', BUNDLE);
  assert.deepEqual(r.inline, []);
});

// Ruling R12 - a token name assembled in JS reads as a prefix; the guard must not report it.
test('a JS-built var prefix (name ending in -) is not a reference', () => {
  const r = lint(`<html><script>el.style.background = 'var(--typology-' + hue + '-100)';</script></html>`, BUNDLE);
  assert.deepEqual(r.missing, []);
});
test('inlineKnobsOnly: accepts the lockup size knob', () => {
  const r = lint('<span class="zha-lockup" style="--zha-lockup-size: clamp(3.25rem, 9vw, 5.5rem)"></span>', BUNDLE, { inlineKnobsOnly: true });
  assert.deepEqual(r.inline, []);
});

// Ruling R12, scoped: the JS-built prefix skip applies inside <script> only; the same trailing hyphen in CSS is a typo.
test('a trailing-hyphen var() in a <style> block is reported', () => {
  const r = lint(style('.a{color:var(--text-);}'), BUNDLE);
  assert.deepEqual(r.missing, ['--text-']);
});
test('a trailing-hyphen var() in a style attribute is reported', () => {
  const r = lint('<div style="color: var(--x-)"></div>', BUNDLE);
  assert.deepEqual(r.missing, ['--x-']);
});
// The attribute match has a boundary: data-style is not an inline style, and spaces around = do not hide one.
test('inlineKnobsOnly: data-style is not an inline style', () => {
  const r = lint('<div data-style="padding: 4px"></div>', BUNDLE, { inlineKnobsOnly: true });
  assert.deepEqual(r.inline, []);
});
test('inlineKnobsOnly: spaces around = still count', () => {
  const r = lint('<div style = "padding: 4px"></div>', BUNDLE, { inlineKnobsOnly: true });
  assert.deepEqual(r.inline, ['padding: 4px']);
});
test('checkClasses: a class named only in a bundle comment is not defined', () => {
  const r = lint('<div class="ghost"></div>', BUNDLE, { checkClasses: true });
  assert.deepEqual(r.missing, ['.ghost']);
});
test('inlineKnobsOnly: a style assignment inside <script> is not an inline style', () => {
  const r = lint('<script>el.style = "padding: 4px"</script>', BUNDLE, { inlineKnobsOnly: true });
  assert.deepEqual(r.inline, []);
});
// A mixed page: the <script> prefix is skipped and the <style> typo is reported (a broken inScript would pass the single-case tests).
test('a <style> typo is reported while a <script> prefix on the same page is skipped', () => {
  const r = lint('<style>.a{color:var(--text-)}</style><script>x = "var(--typology-" + h</script>', BUNDLE);
  assert.deepEqual(r.missing, ['--text-']);
});
// The colour scan reads <style> blocks and markup style attributes only: a style assignment inside <script> is JS (item 2, 2026-10-06).
test('colour scan: a named colour in a <script> style assignment is not reported', () => {
  const r = lint('<script>el.style = "color: red"</script>', BUNDLE);
  assert.deepEqual(r.colors, []);
});

// The React starter is JSX: className and template literals become class="", a prefix such as badge-- (finished in JS) is dropped
// the way a var(--x- prefix inside <script> is, and a style object becomes a style attribute (Review Focus 4, 2026-10-06).
test('jsxToMarkup: classNames, template prefixes and style objects', () => {
  const out = jsxToMarkup('<span className={`badge badge--${tone}`} style={{ \'--grid-min\': \'11rem\' }}><i className="dot" /></span>');
  assert.equal(out, '<span class="badge" style="--grid-min: 11rem"><i class="dot" /></span>');
});
test('jsxToMarkup: a conditional keeps every literal branch', () => {
  assert.equal(jsxToMarkup('<a className={on ? "tabs__tab is-active" : "tabs__tab"}>'), '<a class="tabs__tab is-active tabs__tab">');
});
test('jsxToMarkup output is lintable: a typo is reported, a knob passes, layout in a style object is reported', () => {
  const bundle = BUNDLE + '\n.badge{}\n.dot{}\n.grid{}';
  const r = lint(jsxToMarkup('<div className="grid clsuter" style={{ \'--grid-min\': \'11rem\', padding: \'4px\', color: \'#fff\' }} />'), bundle, { checkClasses: true, inlineKnobsOnly: true });
  assert.deepEqual(r.missing, ['.clsuter']);
  assert.deepEqual(r.inline, ['padding: 4px', 'color: #fff']);
  assert.deepEqual(r.colors, ['#fff']);
});
test('jsxToMarkup: unquoted and template style values are kept, so layout in a style object is still reported', () => {
  const r = lint(jsxToMarkup('<div className="grid" style={{ padding: 4, gap: g, width: `${w}px` }} />'), BUNDLE + '\n.grid{}', { checkClasses: true, inlineKnobsOnly: true });
  assert.deepEqual(r.inline, ['padding: 4', 'gap: g', 'width: `${w}px`']);
});
test('jsxToMarkup ceilings: a className with no string literal and a two-level style object are left unchecked', () => {
  assert.equal(jsxToMarkup('<div className={cls} />'), '<div class="" />');
  assert.ok(jsxToMarkup('<div style={{ a: { b: { c: 1 } } }} />').includes('style={{'));
});
