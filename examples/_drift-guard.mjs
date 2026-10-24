// Shared drift guard for examples/ pages. `lint()` is pure (testable - see
// drift-guard.test.mjs); each page's check.mjs is a thin runner around it.
//
// It proves token/colour discipline AND does a lightweight STRUCTURAL scan of
// the CSS inside <style> blocks (comment + brace balance). The structural scan
// exists because the old regex-only guard passed broken-but-token-clean CSS: a
// comment containing an embedded */ (from a `--color-*/…` adjacency) closed the
// comment early and dropped a rule (fixed at 59a3ff6, caught only by render).
// ponytail: a hand-rolled comment/brace scan, not a full CSS parser - it catches
// that bug class + named colours with zero deps; swap for a parser only if a
// structural case slips past THIS.

import { readFileSync } from 'node:fs';

// CSS named colours (drift - every colour must be a var(--…) token). transparent
// and currentColor are keywords, not brand colours, so they're intentionally out.
const NAMED_COLORS = new Set([
  'aliceblue','antiquewhite','aqua','aquamarine','azure','beige','bisque','black','blanchedalmond',
  'blue','blueviolet','brown','burlywood','cadetblue','chartreuse','chocolate','coral','cornflowerblue',
  'cornsilk','crimson','cyan','darkblue','darkcyan','darkgoldenrod','darkgray','darkgreen','darkgrey',
  'darkkhaki','darkmagenta','darkolivegreen','darkorange','darkorchid','darkred','darksalmon',
  'darkseagreen','darkslateblue','darkslategray','darkslategrey','darkturquoise','darkviolet','deeppink',
  'deepskyblue','dimgray','dimgrey','dodgerblue','firebrick','floralwhite','forestgreen','fuchsia',
  'gainsboro','ghostwhite','gold','goldenrod','gray','green','greenyellow','grey','honeydew','hotpink',
  'indianred','indigo','ivory','khaki','lavender','lavenderblush','lawngreen','lemonchiffon','lightblue',
  'lightcoral','lightcyan','lightgoldenrodyellow','lightgray','lightgreen','lightgrey','lightpink',
  'lightsalmon','lightseagreen','lightskyblue','lightslategray','lightslategrey','lightsteelblue',
  'lightyellow','lime','limegreen','linen','magenta','maroon','mediumaquamarine','mediumblue',
  'mediumorchid','mediumpurple','mediumseagreen','mediumslateblue','mediumspringgreen','mediumturquoise',
  'mediumvioletred','midnightblue','mintcream','mistyrose','moccasin','navajowhite','navy','oldlace',
  'olive','olivedrab','orange','orangered','orchid','palegoldenrod','palegreen','paleturquoise',
  'palevioletred','papayawhip','peachpuff','peru','pink','plum','powderblue','purple','rebeccapurple',
  'red','rosybrown','royalblue','saddlebrown','salmon','sandybrown','seagreen','seashell','sienna',
  'silver','skyblue','slateblue','slategray','slategrey','snow','springgreen','steelblue','tan','teal',
  'thistle','tomato','turquoise','violet','wheat','white','whitesmoke','yellow','yellowgreen',
]);

// Pure black / white with any alpha - allowed (shadows, scrims, hairlines).
const NEUTRAL = /^rgba?\(\s*(?:0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*(?:,[^)]*)?\)$/i;

// Spec 3 §7: the only inline styles a page may write are the documented knobs. Everything
// else is layout, and layout belongs to .stack/.cluster/.grid/.section (gap-has-one-owner).
const KNOBS = new Set(['--container-w', '--grid-min', '--stack-gap', '--split-aside', '--control-h', '--dialog-w', '--sidebar-w', '--zha-logo-h', '--zha-lockup-size']);

// An inline style attribute in markup. The lookbehind keeps data-style="..." out; the \s* lets `style = "..."` in;
// the callers skip matches inside <script> (el.style = "..."), which are JS, not markup.
const INLINE_STYLE = /(?<![\w-])style\s*=\s*["']([^"']*)["']/gi;

const styleBlocks = (html) =>
  [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);

// Walk CSS tracking comment state. Returns the comment-stripped CSS plus any
// structural comment defects. A `*/` seen outside a comment = closed early or
// unbalanced (the 59a3ff6 bug); a trailing open `/*` = unclosed.
function scanComments(css) {
  let out = '';
  let i = 0;
  let inComment = false;
  const errs = [];
  while (i < css.length) {
    if (inComment) {
      if (css[i] === '*' && css[i + 1] === '/') { inComment = false; i += 2; continue; }
      i++;
    } else if (css[i] === '/' && css[i + 1] === '*') {
      inComment = true; i += 2;
    } else if (css[i] === '*' && css[i + 1] === '/') {
      errs.push('stray "*/" - comment closed early or unbalanced'); i += 2;
    } else {
      out += css[i]; i++;
    }
  }
  if (inComment) errs.push('unclosed "/*" comment');
  return { stripped: out, structural: errs };
}

// Brace balance on comment-stripped, string-stripped CSS.
function braceBalance(css) {
  const noStrings = css.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');
  let depth = 0;
  for (const ch of noStrings) {
    if (ch === '{') depth++;
    else if (ch === '}' && --depth < 0) return ['unbalanced "}" - more closes than opens'];
  }
  return depth > 0 ? [`unbalanced braces - ${depth} unclosed "{"`] : [];
}

// JSX to the markup dialect lint() reads. className="a b" and className={...} become class="" (every string literal inside the
// braces contributes; a token ending in "-" is a template prefix finished in JS, like the var(--x- rule, and is dropped);
// style={{ '--knob': 'v', prop: 'v' }} becomes style="--knob: v; prop: v" so the knob rule applies; a value may be a quoted string
// or any other expression up to the next comma. Other braces are JS and stay.
// Ceiling: a className with no string literal (className={cls}) or nested deeper than one ${} is not checked; a style object nested deeper than one level is left as JSX.
export function jsxToMarkup(src) {
  // Whole string literals only (a closing quote is never an opening one); a ${...} inside a template is finished in JS and is dropped with its prefix.
  const tokens = (expr) => [...expr.matchAll(/"([^"]*)"|'([^']*)'|`([^`]*)`/g)]
    .flatMap((m) => (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, ' ').split(/\s+/))
    .filter((c) => c && !c.endsWith('-'));
  return src
    .replace(/className=\{((?:[^{}]|\{[^{}]*\})*)\}/g, (_, expr) => `class="${tokens(expr).join(' ')}"`) // one level of nesting, for ${expr} inside a template
    .replace(/className=/g, 'class=')
    .replace(/style=\{\{((?:[^{}]|\{[^{}]*\})*)\}\}/g, (_, obj) =>
      `style="${[...obj.matchAll(/['"]?([\w-]+)['"]?\s*:\s*(?:['"]([^'"]*)['"]|([^,]+))/g)].map((m) => `${m[1]}: ${(m[2] ?? m[3]).trim()}`).join('; ')}"`);
}

export function lint(html, bundle, { checkClasses = false, inlineKnobsOnly = false } = {}) {
  // Only real declarations define a name: the bundle's own comments mention prefixes like --text-* and class names in prose.
  const { stripped: bundleCss } = scanComments(bundle);
  const defined = (t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\w-])').test(bundleCss);

  const missing = [];
  if (checkClasses) {
    const classes = new Set();
    for (const m of html.matchAll(/class=["']([^"']+)["']/g))
      for (const c of (m[1] ?? '').split(/\s+/)) if (c) classes.add(c);
    for (const c of classes) if (!defined('.' + c)) missing.push('.' + c);
  }
  // Ruling R12, scoped: a token name assembled in JS ('var(--typology-' + hue + '-100)') is a prefix, not a reference,
  // but only inside <script>; the same trailing hyphen in a <style> block or a style attribute is a typo and stays reported.
  const scripts = [...html.matchAll(/<script[^>]*>[\s\S]*?<\/script>/gi)].map((m) => [m.index, m.index + m[0].length]);
  const inScript = (i) => scripts.some(([s, e]) => i >= s && i < e);
  const vars = new Set();
  for (const m of html.matchAll(/var\((--[\w-]+)/g)) {
    if (m[1].endsWith('-') && inScript(m.index)) continue;
    vars.add(m[1]);
  }
  for (const v of vars) if (!defined(v)) missing.push(v);

  const colors = (html.match(/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\([^)]*\)/g) ?? [])
    .filter((c) => !NEUTRAL.test(c));

  // Structural scan of each <style> block, and collect the comment-stripped CSS
  // so the named-colour scan runs on REAL declarations only - not prose or
  // comments, where brand words like "teal"/"magenta" legitimately appear.
  const structural = [];
  let css = '';
  for (const block of styleBlocks(html)) {
    const { stripped, structural: cerr } = scanComments(block);
    structural.push(...cerr, ...braceBalance(stripped));
    css += '\n' + stripped;
  }
  for (const m of html.matchAll(INLINE_STYLE)) if (!inScript(m.index)) css += '\n' + m[1];

  // Named colours in value position (after ':' or ',') - every colour must be a token.
  for (const m of css.matchAll(/[:,]\s*([a-zA-Z]{3,20})\b/g))
    if (NAMED_COLORS.has(m[1].toLowerCase())) colors.push(m[1]);

  const inline = [];
  if (inlineKnobsOnly) {
    for (const m of html.matchAll(INLINE_STYLE)) {
      if (inScript(m.index)) continue;
      for (const decl of m[1].split(';').map((s) => s.trim()).filter(Boolean)) {
        if (!KNOBS.has(decl.split(':')[0].trim())) inline.push(decl);
      }
    }
  }
  return { missing, colors: [...new Set(colors)], structural: [...new Set(structural)], inline };
}

// Thin runner used by each page's check.mjs. htmlUrl may be a path or file URL;
// bundlePath is the resolved @gitzhacode/zha-ui-css/index.css path.
export function run(htmlUrl, bundlePath, { checkClasses = false, inlineKnobsOnly = false, transform = (s) => s, label } = {}) {
  const bundle = readFileSync(bundlePath, 'utf8');
  const html = transform(readFileSync(htmlUrl, 'utf8'));
  const { missing, colors, structural, inline } = lint(html, bundle, { checkClasses, inlineKnobsOnly });
  if (missing.length || colors.length || structural.length || inline.length) {
    if (structural.length) console.error(`${label}: broken CSS structure:`, structural);
    if (missing.length) console.error(`${label}: unknown zha-ui vocabulary (must be bundle tokens):`, missing);
    if (colors.length) console.error(`${label}: hardcoded colour literals (use var(--…) tokens):`, colors);
    if (inline.length) console.error(`${label}: inline styles beyond the knob allowlist (use .stack/.cluster/.grid/.section):`, inline);
    process.exit(1);
  }
  const vars = new Set([...html.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
  console.log(`${label}: ${vars.size} vars all bundle tokens, CSS balanced, no hardcoded colour${inlineKnobsOnly ? ', inline styles knobs-only' : ''} ✓`);
}
