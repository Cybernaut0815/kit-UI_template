import { readFileSync, existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
const d = (f: string) => new URL(`../dist/${f}`, import.meta.url);
// A block that is missing must fail the test, never pass an empty string through a negative assertion (2026-10-06 item 11).
const block = (css: string, re: RegExp) => { const m = css.match(re); expect(m, `${re} matches a block`).not.toBeNull(); return m![0]; };
describe('@gitzhacode/zha-ui-css', () => {
  it('produces index.css containing tokens + primitives + lockup', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/--accent:/);          // tokens present
    expect(css).toMatch(/\.btn--primary\s*\{/); // primitives present
    expect(css).toMatch(/\.zha-lockup__team/);  // lockup present
    expect(css).toMatch(/@font-face/);          // ZHA Sans webfont bundled
  });
  it('ships the logo + font assets', () => {
    expect(existsSync(d('assets/zha-logo.svg'))).toBe(true);
    expect(existsSync(d('assets/zha-sans.ttf'))).toBe(true);
  });
  it('names Neue Haas Unica primary with self-hosted Inter as the bundled fallback (both subsets + OFL)', () => {
    expect(existsSync(d('assets/inter-latin.woff2'))).toBe(true);
    expect(existsSync(d('assets/inter-latin-ext.woff2'))).toBe(true);
    expect(existsSync(d('assets/inter-OFL.txt'))).toBe(true);                                    // OFL licence travels with the fonts
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/--font-primary:\s*"Neue Haas Unica", "Inter", system-ui, sans-serif/); // NHU named first, Inter the fallback
    expect(css).toMatch(/src:\s*url\("\.\/assets\/inter-latin\.woff2"\)\s*format\("woff2"\)/);     // latin subset self-hosted
    expect(css).toMatch(/src:\s*url\("\.\/assets\/inter-latin-ext\.woff2"\)\s*format\("woff2"\)/); // latin-ext subset self-hosted
    expect(css).toMatch(/@font-face\s*\{[^}]*font-family:\s*"Inter"[^}]*font-weight:\s*100 900/s); // variable → real weights, not synthetic
  });
  it('btn--primary uses the AA-safe accent-fill, never bare --accent', () => {
    expect(readFileSync(d('index.css'), 'utf8')).toMatch(/\.btn--primary\s*\{[^}]*background:\s*var\(--accent-fill\)/s);
  });
  it('card is border-first: no resting box-shadow, lift is opt-in', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const card = block(css, /\.card\s*\{[^}]*\}/s);
    expect(card).not.toMatch(/box-shadow/);              // no resting shadow
    expect(css).toMatch(/\.card--interactive:hover\s*\{[^}]*box-shadow/s); // lift opt-in
  });
  it('ships app-shell + app-bar with backdrop fallback', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.app-shell\s*\{/);
    expect(css).toMatch(/\.app-bar\s*\{[^}]*backdrop-filter/s);
    expect(css).toMatch(/@supports not \(\(backdrop-filter/); // opaque fallback
  });
  it('ships a divider', () => { expect(readFileSync(d('index.css'),'utf8')).toMatch(/\.divider\s*\{/); });
  it('sidebar active uses the subtle tint, not the solid accent-fill', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const active = block(css, /\.sidebar a\[aria-current="page"\]\s*\{[^}]*\}/s);
    expect(active).toMatch(/background:\s*var\(--accent-subtle\)/);
    expect(active).not.toMatch(/var\(--accent-fill\)/);
  });
  it('ships breadcrumb with slash separators', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.breadcrumb ol\s*\{/);
    expect(css).toMatch(/\.breadcrumb li:not\(:first-child\)::before\s*\{[^}]*content:\s*"\/"/s);
  });
  it('ships pagination; active uses accent-fill', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.pagination\s*\{/);
    expect(css).toMatch(/\.pagination \[aria-current="page"\]\s*\{[^}]*var\(--accent-fill\)/s);
  });
  it('ships page-header with title + actions', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.page-header\s*\{/);
    expect(css).toMatch(/\.page-header__actions\s*\{/);
  });
  it('stat tile has no shadow and uses fs-display for the value', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const stat = block(css, /\.stat\s*\{[^}]*\}/s);
    expect(stat).toMatch(/border:\s*1px solid var\(--border-subtle\)/);
    expect(stat).not.toMatch(/box-shadow/);
    expect(css).toMatch(/\.stat__value\s*\{[^}]*var\(--fs-display\)/s);
  });
  it('badge background is transparent (outline pill)', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const badge = block(css, /\.badge\s*\{[^}]*\}/s);
    expect(badge).toMatch(/background:\s*transparent/);
    expect(badge).toMatch(/border:\s*1px solid currentColor/);
  });
  it('accordion removes the default marker in both engines', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.accordion summary\s*\{[^}]*list-style:\s*none/s);
    expect(css).toMatch(/\.accordion summary::-webkit-details-marker\s*\{[^}]*display:\s*none/s);
  });
  it('data-table has sticky header, no zebra', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.data-table thead th\s*\{[^}]*position:\s*sticky/s);
    expect(css).toMatch(/\.data-table thead th\s*\{[^}]*background:\s*var\(--bg-surface-1\)/s); // opaque - rows must not bleed through a sticky header
    expect(css).not.toMatch(/\.data-table tbody tr:nth-child/);  // no zebra
  });
  it('ships form-field grouping with an error line', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.field\s*\{/);
    expect(css).toMatch(/\.field__error\s*\{[^}]*var\(--intent-error-text\)/s);
  });
  it('ships a segmented control driven by checked radios (no JS)', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.segmented\s*\{/);
    expect(css).toMatch(/\.segmented label:has\(:checked\)/);
  });
  it('card accent-stripe uses --accent on the inline-start edge', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.card--accent\s*\{[^}]*border-inline-start:\s*3px solid var\(--accent\)/s);
  });
  it('alert has no intent tint behind body text; intent on border + icon only', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const base = block(css, /\.alert\s*\{[^}]*\}/s);
    expect(base).toMatch(/background:\s*var\(--bg-surface-1\)/);
    expect(base).toMatch(/color:\s*var\(--text-default\)/);
    expect(css).toMatch(/\.alert--error\s*\{[^}]*border-inline-start-color:\s*var\(--intent-error-text\)/s);
  });
  it('progress themes via accent-color AND webkit pseudo (Safari)', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.progress\s*\{[^}]*accent-color:\s*var\(--accent-fill\)/s);
    expect(css).toMatch(/\.progress::-webkit-progress-value\s*\{[^}]*var\(--accent-fill\)/s);
  });
  it('ships a borderless centered empty-state', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const es = block(css, /\.empty-state\s*\{[^}]*\}/s);
    expect(es).toMatch(/align-items:\s*center/);
    expect(es).not.toMatch(/border:/);
  });
  it('ships view-fade (opacity + transform only)', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.view-fade\s*\{[^}]*animation:/s);
    expect(css).toMatch(/@keyframes zha-view-fade/);
  });
  it('ships brand-gradient utilities (.accent-grad fill + .accent-grad-text with --accent-fill fallback)', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.accent-grad\s*\{[^}]*background-image:\s*var\(--brand-grad\)/s);
    expect(css).toMatch(/\.accent-grad-text\s*\{[^}]*background-clip:\s*text/s);
    expect(css).toMatch(/\.accent-grad-text\s*\{[^}]*-webkit-background-clip:\s*text/s);
    expect(css).toMatch(/@supports not \(\(-webkit-background-clip: text\) or \(background-clip: text\)\)\s*\{\s*\.accent-grad-text\s*\{[^}]*color:\s*var\(--accent-fill\)/s);
  });
  it('lockup solid/fallback degrades to the AA-safe --accent-fill, never bare --accent', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.zha-lockup--solid \.zha-lockup__team\s*\{[^}]*color:\s*var\(--accent-fill\)/s);
  });
  it('--brand-grad is defined in :root from the live accent vars (re-declared per override block)', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/:root[^{]*\{[^}]*--brand-grad:\s*linear-gradient\(105deg, var\(--accent\) 0%, var\(--accent-2\) 100%\)/s);
  });
  it('lockup forced-colors override follows the @supports-not fallback, so CanvasText wins when both apply', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const supportsIdx = css.search(/@supports not \(\(-webkit-background-clip: text\) or \(background-clip: text\)\)\s*\{\s*\.zha-lockup__team/s);
    const forcedIdx = css.search(/@media \(forced-colors: active\)\s*\{\s*\.zha-lockup__team/);
    expect(supportsIdx).toBeGreaterThan(-1);
    expect(forcedIdx).toBeGreaterThan(supportsIdx); // forced-colors emitted later → wins the equal-specificity tie
  });
  it('ships the dialog primitive styling the native <dialog> + ::backdrop', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.dialog\s*\{[^}]*background:\s*var\(--bg-surface-1\)/s);
    expect(css).toMatch(/dialog\.dialog::backdrop\s*\{[^}]*background:\s*var\(--scrim\)/s);
    expect(css).toMatch(/\.dialog--full\s*\{[^}]*--dialog-w:\s*80rem/s);
    expect(css).toMatch(/\.dialog--full\s*\{[^}]*block-size:\s*min/s); // definite height so iframe/media fill
    expect(css).toMatch(/\.dialog__body\s*\{[^}]*overflow:\s*auto/s);
  });
  it('dialog locks scroll and provides a forced-colors boundary', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/html:has\(dialog\.dialog\[open\]\)\s*\{[^}]*overflow:\s*hidden/s);
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{[^}]*\.dialog\s*\{[^}]*border:\s*2px solid CanvasText/s);
  });
  it('ships the menu primitive styling the native [popover]', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.menu\s*\{[^}]*background:\s*var\(--bg-surface-1\)/s);
    expect(css).toMatch(/\.menu\s*\{[^}]*position:\s*fixed/s);            // UA centering neutralized; hook positions
    expect(css).toMatch(/\.menu__check\s*\{[^}]*accent-color:\s*var\(--accent-fill\)/s); // native checkbox, themed
    expect(css).toMatch(/\.menu__search\s*\{[^}]*position:\s*sticky/s);
  });
  it('ships the gradient library classes', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    for (const c of ['grad-hero-ember', 'grad-hero-ocean', 'grad-hero-violet', 'grad-hero-dusk',
                     'grad-spectrum', 'grad-wash', 'grad-glow', 'accent-grad-subtle'])
      expect(css).toMatch(new RegExp(`\\.${c}\\s*\\{[^}]*background-image:\\s*var\\(--`));
  });
  it('ships the 16 signature-form pool classes; the flat-13 are retired', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    for (const c of ['polar', 'blaze', 'reef', 'nova', 'orchid', 'beacon', 'sundial', 'prism',
                     'verdigris', 'borealis', 'nebula', 'abyss', 'furnace', 'signal', 'terra', 'regatta'])
      expect(css).toMatch(new RegExp(`\\.grad-pair-${c}\\s*\\{[^}]*background-image:\\s*var\\(--grad-pair-${c}\\)`));
    for (const gone of ['electric', 'royal', 'plum', 'ocean', 'deep-sky', 'twilight', 'sunrise',
                        'coral', 'ember', 'raspberry', 'foliage', 'sea-pine', 'chartreuse'])
      expect(css, `.grad-pair-${gone} retired`).not.toMatch(new RegExp(`\\.grad-pair-${gone}\\b`));
    // print + forced-colors suppression via the [class*="grad-pair-"] umbrella arm
    expect(css).toMatch(/@media print\s*\{[^@]*\[class\*="grad-pair-"\][^{]*\{[^}]*background:\s*#fff none/s);
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{[^@]*\[class\*="grad-pair-"\][^{]*\{[^}]*background-image:\s*none/s);
  });
  it('aurora classes floor on a background-COLOR so a failed color-mix stack degrades to a dark panel', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    for (const [name, floor] of [['borealis', 'ink'], ['abyss', 'ink'], ['nebula', 'black'], ['furnace', 'black']] as const)
      expect(css).toMatch(new RegExp(
        `\\.grad-pair-${name}\\s*\\{[^}]*background-color:\\s*var\\(--color-neutral-${floor}\\)[^}]*background-image:\\s*var\\(--grad-pair-${name}\\)`, 's'));
    expect(css).toMatch(/\.accent-grad-aurora\s*\{[^}]*background-color:\s*var\(--color-neutral-ink\)[^}]*background-image:\s*var\(--brand-grad-aurora\)/s);
  });
  it('oklch twins swap under the RIGHT feature test: linear twins in the linear block, conic in the conic block', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const linear = css.match(/@supports \(background-image: linear-gradient\(in oklch, red, red\)\)\s*\{([^@]*)\}/s)?.[1] ?? '';
    for (const n of ['polar', 'nova', 'signal', 'terra', 'regatta'])
      expect(linear, `${n} twin under the linear test`).toContain(`var(--grad-pair-${n}-oklch)`);
    expect(linear).toContain('var(--brand-grad-duo-oklch)');
    expect(linear, 'the conic twin must NOT ride the linear test').not.toContain('conic');
    const conic = css.match(/@supports \(background-image: conic-gradient\(in oklch, red, red\)\)\s*\{([^@]*)\}/s)?.[1] ?? '';
    expect(conic).toMatch(/\.accent-grad-conic\s*\{[^}]*var\(--brand-grad-conic-oklch\)/s);
    // conic + aurora pool entries are sRGB-only - no twin vars exist for them anywhere
    expect(css).not.toMatch(/--grad-pair-(blaze|reef|orchid|beacon|sundial|prism|verdigris|borealis|nebula|abyss|furnace)-oklch/);
  });
  it('ships the team wardrobe classes and lists them in both suppression arms', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.accent-grad-conic\s*\{[^}]*background-image:\s*var\(--brand-grad-conic\)/s);
    expect(css).toMatch(/\.accent-grad-duo\s*\{[^}]*background-image:\s*var\(--brand-grad-duo\)/s);
    for (const c of ['accent-grad-aurora', 'accent-grad-conic', 'accent-grad-duo']) {
      expect(css).toMatch(new RegExp(`@media print\\s*\\{[^@]*\\.${c}[^{]*\\{[^}]*background:\\s*#fff none`, 's'));
      expect(css).toMatch(new RegExp(`@media \\(forced-colors: active\\)\\s*\\{[^@]*\\.${c}[^{]*\\{[^}]*background-image:\\s*none`, 's'));
    }
  });
  it('spectrum upgrades to oklch interpolation ONLY under the gradient-specific feature test', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(
      /@supports \(background-image: linear-gradient\(in oklch, red, red\)\)\s*\{\s*\.grad-spectrum\s*\{[^}]*var\(--grad-spectrum-oklch\)/s,
    );
    // the token overlay's (color: oklch()) test must NOT gate the swap - colours shipped before in-oklch gradients
    expect(css).not.toMatch(/@supports \(color: oklch\(0 0 0\)\)\s*\{\s*\.grad-spectrum/s);
  });
  it('decorative gradients are suppressed in print; gradient-clipped text prints solid, not transparent', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/@media print\s*\{[^@]*\.grad-hero-ember[^{]*\{[^}]*background:\s*#fff none/s);
    expect(css).toMatch(/@media print\s*\{[^@]*\.accent-grad-text\s*\{[^}]*color:\s*var\(--accent-fill\)/s);
    expect(css).toMatch(/@media print\s*\{\s*\.zha-lockup__team\s*\{[^}]*color:\s*var\(--accent-fill\)/s);
  });
  it('gradients defer to forced colors', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(
      /@media \(forced-colors: active\)\s*\{[^@]*\.grad-spectrum[^{]*\{[^}]*background-image:\s*none/s,
    );
  });

  describe('2026-07-17 consumer-feedback quick wins', () => {
    let _idx: string | undefined;
    const css = () => (_idx ??= readFileSync(d('index.css'), 'utf8')); // read once, reuse across assertions
    it('binds color-scheme mirroring the token cascade order: root-light, then dark/brand, then explicit light last', () => {
      const rootIdx = css().search(/:root\s*\{\s*color-scheme:\s*light/s);
      const darkIdx = css().search(/\[data-theme="dark"\],\s*\[data-surface="brand"\]\s*\{[^}]*color-scheme:\s*dark/s);
      const lightIdx = css().search(/\[data-theme="light"\]\s*\{\s*color-scheme:\s*light/s);
      expect(rootIdx).toBeGreaterThan(-1);
      expect(darkIdx).toBeGreaterThan(rootIdx);   // dark/brand beats the root default
      expect(lightIdx).toBeGreaterThan(darkIdx);  // explicit light wins last (light islands, light+brand)
    });
    it('owns native tick/track color for checkbox/radio/range at zero specificity (:where)', () => {
      expect(css()).toMatch(/:where\(input\[type="checkbox"\], input\[type="radio"\], input\[type="range"\]\)\s*\{[^}]*accent-color:\s*var\(--accent-fill\)/s);
    });
    it('btn is anchor-safe: no underline, no link color', () => {
      expect(css()).toMatch(/\.btn\s*\{[^}]*text-decoration:\s*none/s);
      expect(css()).toMatch(/\.btn\s*\{[^}]*color:\s*inherit/s);
    });
    it('pagination styles buttons too and strips their UA chrome', () => {
      expect(css()).toMatch(/\.pagination :is\(a, button, span\)\s*\{/);
      expect(css()).toMatch(/\.pagination button\s*\{[^}]*background:\s*none/s);
      expect(css()).toMatch(/\.pagination :is\(a, button\):not\(\[aria-current="page"\]\):hover/); // hover guard keeps current page's accent-fill
    });
    it('current-page pagination control is NOT washed out on hover (accent-fill survives)', () => {
      // the hover rule must be guarded so [aria-current="page"] keeps its accent-fill background
      expect(css()).toMatch(/\.pagination :is\(a, button\):not\(\[aria-current="page"\]\):hover\s*\{[^}]*background:\s*var\(--bg-surface-2\)/s);
    });
    it('ships badge--neutral (intent-less muted TEXT)', () => {
      expect(css()).toMatch(/\.badge--neutral\s*\{\s*color:\s*var\(--text-muted\)/s); // bound to color:, not merely present in the block
    });
    it('th-unit escapes the thead uppercase transform; PLAIN th buttons reset to header typography, classed primitives exempt', () => {
      expect(css()).toMatch(/\.th-unit\s*\{[^}]*text-transform:\s*none/s);
      expect(css()).toMatch(/\.data-table thead th :is\(\.btn, button\):not\(\.icon-btn\):not\(\[class\*="btn--"\]\)[^{]*\{[^}]*font:\s*inherit/s);
    });
    it('chip carries a real border so is-active border-color paints; button chips get a cursor', () => {
      expect(css()).toMatch(/\.chip\s*\{[^}]*border:\s*1px solid transparent/s);
      expect(css()).toMatch(/button\.chip\s*\{[^}]*cursor:\s*pointer/s);
    });
    it('app-bar__brand is a baseline group with a REGULAR ZHA Sans fallback (bare-text brands stay on-brand, never bold)', () => {
      const brand = block(css(), /\.app-bar__brand\s*\{[^}]*\}/s);
      expect(brand).toMatch(/align-items:\s*baseline/);
      expect(brand).toMatch(/font:\s*400 var\(--fs-h2\) \/ 1 var\(--font-secondary\)/); // explicit 400 → never bold
      // the app NAME being font-primary (not ZHA Sans) is the real anti-leak invariant, asserted below
    });
    it('ships the app-name slot: fs-h2 font-primary muted, scoped to the bar, ellipsized, dropped ≤640px', () => {
      expect(css()).toMatch(/\.app-bar \.app-bar__app\s*\{[^}]*var\(--fs-h2\)[^}]*var\(--font-primary\)/s);
      expect(css()).toMatch(/\.app-bar \.app-bar__app\s*\{[^}]*white-space:\s*nowrap[^}]*text-overflow:\s*ellipsis/s);
      expect(css()).toMatch(/@media \(max-width: 640px\)\s*\{[^}]*\.app-bar__app\s*\{[^}]*display:\s*none/s);
    });
    it('lockup anchor form has no underline; gradient hover-shift only on interactive lockups', () => {
      expect(css()).toMatch(/a\.zha-lockup\s*\{[^}]*text-decoration:\s*none/s);
      expect(css()).toMatch(/button\.zha-lockup\s*\{[^}]*background:\s*none[^}]*border:\s*0/s); // button form UA-chrome reset
      expect(css()).toMatch(/:is\(a, button\)\.zha-lockup:hover \.zha-lockup__team/);
      // guard the static-span regression in ANY form (indented, mid-list), not just column 0:
      expect(css()).not.toMatch(/(?<![\w)])\.zha-lockup:hover \.zha-lockup__team/);
    });
    it('icon-btn is quiet by default (muted icon, not accent) and ships a ghost variant with the same hit target', () => {
      const iconBtn = block(css(), /\.icon-btn\s*\{[^}]*\}/s);
      expect(iconBtn).toMatch(/color:\s*var\(--text-muted\)/);
      expect(iconBtn).not.toMatch(/color:\s*var\(--accent\)/);
      expect(css()).toMatch(/\.icon-btn--ghost\s*\{[^}]*background:\s*transparent[^}]*border-color:\s*transparent/s);
    });
    it('btn toggle: accent-subtle wash + accent border-color + text-strong; aria-pressed arm :where()-demoted; survives hover', () => {
      expect(css()).toMatch(/\.btn\.is-active, \.btn:where\(\[aria-pressed="true"\]\)\s*\{[^}]*background:\s*var\(--accent-subtle\)[^}]*border-color:\s*var\(--accent\)[^}]*color:\s*var\(--text-strong\)/s);
      expect(css()).toMatch(/\.btn\.is-active:hover, \.btn:where\(\[aria-pressed="true"\]\):hover\s*\{[^}]*var\(--accent-subtle\)/s);
    });
    it('ships content tabs with a single blessed selected treatment (strong text + accent underline)', () => {
      expect(css()).toMatch(/\.tabs\s*\{[^}]*border-block-end:\s*1px solid var\(--border-subtle\)/s);
      expect(css()).toMatch(/\.tabs__tab\[aria-current="page"\]\s*\{[^}]*color:\s*var\(--text-strong\)[^}]*border-block-end-color:\s*var\(--accent\)/s);
    });
    it('ships a paint-only tooltip on the inverse surface', () => {
      expect(css()).toMatch(/\.tooltip\s*\{[^}]*background:\s*var\(--text-strong\)[^}]*color:\s*var\(--bg-surface-1\)/s);
      expect(css()).toMatch(/\.tooltip\s*\{[^}]*max-inline-size/s);
    });
    it('ships the labeled slider row with a tabular value slot', () => {
      expect(css()).toMatch(/\.slider-row\s*\{[^}]*grid-template-columns/s);
      expect(css()).toMatch(/\.slider-row__value\s*\{[^}]*tabular-nums/s);
    });
    it('fieldset.field loses the UA border box and gets a .field-style legend', () => {
      expect(css()).toMatch(/fieldset\.field\s*\{[^}]*border:\s*0/s);
      expect(css()).toMatch(/fieldset\.field legend\s*\{[^}]*var\(--fs-small\)/s);
    });
    it('ships the menu caret mirroring the accordion chevron, driven by aria-expanded', () => {
      expect(css()).toMatch(/\.menu__caret\s*\{[^}]*rotate\(-45deg\)/s);
      expect(css()).toMatch(/\[aria-expanded="true"\][^{]*\.menu__caret[^{]*\{[^}]*rotate\(45deg\)/s);
    });
  });

  describe('typology chip pass', () => {
    const css = () => readFileSync(d('index.css'), 'utf8');
    it('ships all 12 typology-tinted chip variants: the hue tint bg + the SAME hue per-theme AA text', () => {
      for (const h of ['purple', 'ultramarine', 'blue', 'teal', 'dark-green', 'light-green',
                       'lime', 'yellow', 'apricot', 'orange', 'cool-red', 'magenta'])
        expect(css()).toMatch(new RegExp(
          `\\.chip--${h}\\s*\\{[^}]*background:\\s*var\\(--typology-${h}-25\\)[^}]*color:\\s*var\\(--typology-${h}-text\\)`, 's',
        ));
    });
    it('ships the chip remove button: inherits the chip colour, hover wash derives from currentColor, 24px hit target', () => {
      expect(css()).toMatch(/\.chip__remove\s*\{[^}]*border-radius:\s*var\(--radius-pill\)[^}]*color:\s*inherit[^}]*cursor:\s*pointer/s);
      expect(css()).toMatch(/\.chip__remove:where\(:not\(:disabled\)\):hover\s*\{[^}]*color-mix\(in srgb, currentColor 15%, transparent\)/);
      expect(css()).toMatch(/\.chip__remove::after\s*\{[^}]*inset:\s*-3px/s); // 18px box + 3px halo = WCAG 2.5.8's 24px
    });
    it('cascade order pins: the (0,1,0) mechanisms depend on source order - pin it', () => {
      const c = css();
      // variants must come AFTER .chip base or all 12 ship dead (base bg wins the tie)
      expect(c.indexOf('.chip {')).toBeLessThan(c.indexOf('.chip--purple'));
      // print umbrellas must come AFTER the class rules they neutralize (same specificity)
      expect(c.indexOf('.chip--magenta')).toBeLessThan(c.indexOf('[class*="chip--"]'));
      expect(c.indexOf('.grad-pair-polar ')).toBeLessThan(c.indexOf('[class*="grad-pair-"]'));
      // 2026-10-06 review follow-ups: the bleed hero's padding and the three media overrides win by source order alone, so pin it.
      // at() fails when a needle is absent; a bare indexOf would return -1 and pass the comparison for a missing rule.
      const at = (needle: string | RegExp) => { const i = typeof needle === 'string' ? c.indexOf(needle) : c.search(needle); expect(i, `${needle} is in the bundle`).toBeGreaterThan(-1); return i; };
      expect(at(/^\.hero \{/m)).toBeLessThan(at('.hero--bleed {'));
      expect(at(/^\.app-bar \{/m)).toBeLessThan(at('@media (prefers-reduced-transparency: reduce)'));
      expect(at(/^\.sidebar a\[aria-current="page"\]::before \{/m)).toBeLessThan(at('@media (forced-colors: active) { .sidebar a[aria-current="page"]::before'));
      expect(at(/^\.badge \.dot \{/m)).toBeLessThan(at('@media (forced-colors: active) { .badge .dot'));
    });
    it('tinted chips print black-on-white on every theme (they carry their own hue tokens)', () => {
      expect(css()).toMatch(/@media print\s*\{[^@]*\[class\*="chip--"\][^{]*\{[^}]*background:\s*#fff none[^}]*color:\s*#000/s);
    });
  });

  // Spec 3 §5.1 - element defaults ship at zero specificity: any consumer rule wins without !important.
  it('ships element defaults in type.css, every element selector :where()-wrapped', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\*, \*::before, \*::after\s*\{\s*box-sizing:\s*border-box/);
    expect(css).toMatch(/\[hidden\]\s*\{\s*display:\s*none !important/);
    expect(css).toMatch(/:where\(html\)\s*\{[^}]*font-synthesis-weight:\s*none/s);
    expect(css).toMatch(/:where\(body\)\s*\{[^}]*font:\s*var\(--fs-body\) \/ var\(--leading-body\) var\(--font-primary\)/s);
    expect(css).toMatch(/:where\(h1, h2, h3, h4\)\s*\{[^}]*line-height:\s*var\(--leading-heading\)/s);
    expect(css).toMatch(/:where\(h1, h2, h3, h4, h5, h6\)\s*\{[^}]*font-weight:\s*500/s);   // R14: h5/h6 take the shared colour and weight
    expect(css).toMatch(/:where\(h5, h6\)\s*\{\s*font-size:\s*1em/);           // and keep the surrounding size
    expect(css).toMatch(/:where\(h1\)\s*\{[^}]*font-size:\s*var\(--fs-display\)/s);
    expect(css).toMatch(/:where\(h2\)\s*\{[^}]*font-size:\s*var\(--fs-h1\)/s);
    expect(css).toMatch(/:where\(h3\)\s*\{[^}]*font-size:\s*var\(--fs-h2\)/s);
    expect(css).toMatch(/:where\(a\)\s*\{[^}]*color:\s*var\(--accent-fill\)/s);
    expect(css).toMatch(/:where\(pre\)\s*\{\s*overflow-x:\s*auto/);
    expect(css).toMatch(/:where\(pre\) :where\(code, kbd, samp\)\s*\{\s*font-size:\s*inherit/);
    // Review Focus 1: no bare element selector in the partial (comments start with /*, rules with :where, . or [)
    const type = readFileSync(new URL('../src/primitives/type.css', import.meta.url), 'utf8');
    expect(type.split('\n').filter((l) => /^[a-z]/.test(l))).toEqual([]);
  });
  it('ships .prose and the one text utility', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.prose\s*\{[^}]*max-inline-size:\s*var\(--measure\)[^}]*font-size:\s*var\(--fs-reading\)[^}]*line-height:\s*var\(--leading-prose\)/s);
    expect(css).toMatch(/\.prose > \* \+ \*\s*\{\s*margin-block-start:\s*var\(--space-4\)/);
    expect(css).toMatch(/\.prose > \* \+ :where\(h2, h3\)\s*\{\s*margin-block-start:\s*var\(--space-8\)/);  // Review Focus 6: a heading that opens the block gets no top gap
    expect(css.indexOf('.prose > * + * {')).toBeLessThan(css.indexOf('.prose > * + :where(h2, h3)'));   // the heading gap follows the generic gap at equal specificity
    expect(css).not.toMatch(/\.prose > :where\(h2, h3\)/);
    expect(css).toMatch(/:where\(a\)\s*\{[^}]*text-decoration:\s*underline/s);   // body links underline everywhere, not only inside .prose (WCAG 1.4.1)
    expect(css).not.toMatch(/:where\(a:hover\)/);
    expect(css).toMatch(/\.text-muted\s*\{\s*color:\s*var\(--text-muted\)/);
  });
  it('type partial sits directly after base in the cascade', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css.indexOf(':where(body)')).toBeGreaterThan(css.indexOf('.sr-only'));        // after base
    expect(css.indexOf(':where(body)')).toBeLessThan(css.indexOf('.grad-hero-ember'));   // before gradient
    // the fixed PARTIALS list is the real guard (a partial inserted between base and type would pass the brackets above): pin it at the source
    const build = readFileSync(new URL('../build.mjs', import.meta.url), 'utf8');
    expect(build).toMatch(/PARTIALS = \['base', 'type', 'gradient', 'layout', 'nav', 'content', 'feedback', 'overlay', 'menu'\]/);
  });

  // Spec 3 §5.3 - composition primitives: one job, one knob each.
  it('ships the composition primitives with their knobs', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const c of ['.container', '.stack', '.stack--tight', '.stack--loose', '.cluster', '.cluster--between', '.cluster--end',
      '.grid', '.section', '.split', '.split--aside-start', '.toolbar', '.divider--vertical', '.form-grid', '.field--span',
      '.table-wrap', '.eyebrow', '.hero', '.hero--bleed']) {
      expect(css, `${c} ships`).toMatch(new RegExp(esc(c) + '\\s*\\{'));
    }
    expect(css).toMatch(/\.container\s*\{\s*--container-w:\s*72rem;\s*inline-size:\s*min\(100% - 2 \* var\(--gutter\), var\(--container-w\)\)/);
    expect(css).toMatch(/\.stack\s*\{[^}]*gap:\s*var\(--stack-gap, var\(--space-block\)\)/s);
    expect(css).toMatch(/\.grid\s*\{[^}]*minmax\(min\(var\(--grid-min, 16rem\), 100%\), 1fr\)/s);
    expect(css).toMatch(/\.section \+ \.section\s*\{\s*border-block-start:\s*1px solid var\(--border-subtle\)/);
    expect(css).toMatch(/\.toolbar\s*\{[^}]*--control-h:\s*36px/s);
    expect(css).toMatch(/\.field--span\s*\{\s*grid-column:\s*1 \/ -1/);
    expect(css).toMatch(/\.divider--vertical\s*\{[^}]*background:\s*var\(--border-subtle\)/s);
  });
  // Review Focus 2: the hero sets background-COLOR so .grad-hero-* / .accent-grad-* (background-image, earlier partial) still paint.
  it('hero keeps gradient classes paintable, ZHA Sans at display size only, brand-scoped eyebrow', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    // the floor is zero-specificity: an aurora class's own ink floor (.accent-grad-aurora, .grad-pair-borealis ..., all (0,1,0)) must win over the panel colour
    expect(css).toMatch(/:where\(\.hero\)\s*\{\s*background-color:\s*var\(--bg-surface-1\);\s*\}/);
    const hero = block(css, /\.hero\s*\{[^}]*\}/s);   // the (0,1,0) rule: no background of any kind
    expect(hero).not.toMatch(/background/);
    expect(css).toMatch(/\.hero--bleed\s*\{\s*--container-w:\s*72rem;\s*border-radius:\s*0;\s*padding-inline:\s*max\(var\(--gutter\), \(100% - var\(--container-w\)\) \/ 2\)/);   // the text edge meets the .container edge below it
    expect(css).toMatch(/:where\(\.container\) > \.hero:where\(:not\(\.hero--bleed\):first-child\)\s*\{\s*margin-block-start:\s*var\(--gutter\);\s*\}/);   // a panel hero that opens the column keeps space under the app bar
    expect(css).toMatch(/\.hero > h1\s*\{[^}]*font:\s*400 var\(--fs-hero-xl\) \/ var\(--leading-display\) var\(--font-secondary\)/s);
    expect(css).toMatch(/\.hero \.eyebrow:where\(\[data-surface="brand"\] \*\)\s*\{\s*color:\s*var\(--accent\)/);
    expect(css).toMatch(/\.hero > p:where\(:not\(\.eyebrow\)\)\s*\{[^}]*font-size:\s*var\(--fs-h1\)/s);
    expect(css).toMatch(/\.eyebrow\s*\{[^}]*var\(--font-mono\)[^}]*text-transform:\s*uppercase[^}]*color:\s*var\(--text-muted\)/s);
  });
  // Spec 3 §5.6 - two breakpoints the docs name (1024 narrow, 768 phone) plus the 640 gutter drop.
  it('collapses the app shell at phone width behind data-nav-open', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const phone = block(css, /@media \(max-width: 768px\)\s*\{[\s\S]*?\n\}/);
    expect(phone).toMatch(/\.app-shell\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)[^}]*grid-template-areas:\s*"header" "main"/s);
    expect(phone).toMatch(/\.app-shell > \.sidebar\s*\{\s*display:\s*none/);
    expect(phone).toMatch(/\.app-shell\[data-nav-open\] > \.sidebar\s*\{[^}]*position:\s*fixed[^}]*z-index:\s*var\(--z-sticky\)/s);
    expect(phone).toMatch(/\.app-shell\[data-nav-open\] > \.sidebar\s*\{[^}]*inline-size:\s*var\(--sidebar-w, 240px\)/s); // R4: --sidebar-w is only set under [data-rail]; without the fallback the drawer shrink-wraps
    expect(phone).toMatch(/\.app-shell > \.app-main\s*\{\s*padding:\s*var\(--space-4\)/);
    expect(phone).toMatch(/\.hero\s*\{\s*padding-block:\s*var\(--space-10\);\s*\}/);   // nothing else may join this rule: a padding-inline here would pull the bleed hero off the container edge
    expect(phone).toMatch(/\.hero:where\(:not\(\.hero--bleed\)\)\s*\{\s*padding-inline:\s*var\(--space-5\)/);   // the bleed hero keeps the container's edge at phone width
    expect(css.indexOf('.app-shell {')).toBeLessThan(css.indexOf('@media (max-width: 768px)'));   // same partial, equal specificity: the collapse must follow the base rule
    // the phone wrap lives in nav.css beside its base rule: equal specificity, so a flex-wrap added to the base can never silently defeat it
    expect(css).toMatch(/@media \(max-width: 768px\)\s*\{\s*\.page-header\s*\{\s*flex-wrap:\s*wrap/);
    expect(css.indexOf('.page-header { display: flex')).toBeLessThan(css.indexOf('.page-header { flex-wrap: wrap'));
    expect(phone).not.toMatch(/\.page-header/);
    expect(phone).toMatch(/\.app-bar__nav-toggle\s*\{\s*display:\s*inline-flex/);
    expect(css).toMatch(/@media \(max-width: 1024px\)\s*\{\s*\.split\s*\{\s*grid-template-columns:\s*1fr/);
    expect(css).toMatch(/@media \(max-width: 640px\)\s*\{\s*\.container\s*\{\s*--gutter:\s*var\(--space-4\);\s*\}\s*\.app-bar\s*\{\s*gap:\s*var\(--space-2\)/);
    expect(css).toMatch(/@media \(max-width: 640px\)\s*\{\s*\.container\s*\{[^}]*\}\s*\.app-bar\s*\{[^}]*\}\s*\.hero--bleed\s*\{\s*--gutter:\s*var\(--space-4\);\s*\}/);   // the gutter drop reaches the bleed hero too
  });
  // Review Focus 5: the phone drawer's button ships as a class, visible only where the drawer exists.
  it('nav toggle is hidden while the sidebar is in the grid', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.app-bar__nav-toggle\s*\{\s*display:\s*none/);
    expect(css.indexOf('.icon-btn {')).toBeLessThan(css.indexOf('.app-bar__nav-toggle {'));   // equal specificity: the hide must follow .icon-btn's inline-flex (base before layout)
    expect(css.indexOf('.app-bar__nav-toggle { display: none')).toBeLessThan(css.indexOf('.app-bar__nav-toggle { display: inline-flex'));   // the hide precedes the 768 show in the same partial
  });

  // Ruling R9: knobs are scoped to the element they are set on - custom properties inherit, a nested .stack must not take its parent's gap.
  it('composition knobs do not leak into nested primitives', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.stack > \*\s*\{\s*--stack-gap:\s*initial/);
    expect(css).toMatch(/\.grid > \*\s*\{\s*--grid-min:\s*initial/);
    expect(css).toMatch(/\.split > \*\s*\{\s*--split-aside:\s*initial/);
    expect(css.indexOf('.stack > *')).toBeLessThan(css.indexOf('.stack--tight'));   // modifiers still win on a nested stack
  });
  // Equal-specificity chain in layout.css: .split, its > * reset, the --aside-start modifier (swaps the columns), then the 1024 query that stacks both.
  it('split modifier and its 1024 stack rule are ordered', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.split--aside-start\s*\{\s*grid-template-columns:\s*minmax\(16rem, var\(--split-aside, 22rem\)\) minmax\(0, 1fr\)/);
    expect(css.indexOf('.split {')).toBeLessThan(css.indexOf('.split > *'));
    expect(css.indexOf('.split > *')).toBeLessThan(css.indexOf('.split--aside-start'));        // R9 reset sits with its base, like .stack > *
    expect(css.indexOf('.split--aside-start')).toBeLessThan(css.indexOf('@media (max-width: 1024px)'));
  });
  // Spec 3 §5.4 - focus is an outline: never clipped by overflow:hidden, follows the element's radius, survives forced-colours.
  it('focus is an outline, never a shadow or a radius override', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/:focus-visible\s*\{\s*outline:\s*2px solid var\(--accent-fill\);\s*outline-offset:\s*2px;\s*\}/);
    expect(css).not.toMatch(/:focus-visible\s*\{[^}]*box-shadow/s);
    expect(css).not.toMatch(/:focus-visible\s*\{[^}]*border-radius/s);
    expect(css).toMatch(/\.input:focus-visible, \.select:focus-visible\s*\{\s*outline-offset:\s*0;\s*border-color:\s*var\(--accent-fill\)/);
    expect(css).toMatch(/\.segmented label:has\(:focus-visible\)\s*\{\s*outline:\s*2px solid var\(--accent-fill\)/);
    expect(css).toMatch(/\.accordion summary:focus-visible\s*\{\s*outline-offset:\s*-2px/);
  });
  // Spec 3 §5.5 - every control has hover, pressed and ONE disabled value.
  it('controls have hover, pressed and one disabled value', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.btn\s*\{[^}]*white-space:\s*nowrap[^}]*gap:\s*var\(--space-2\)[^}]*padding:\s*0 var\(--space-4\)[^}]*transition:\s*background var\(--motion-fast\) var\(--ease-out\), transform var\(--motion-fast\) var\(--ease-out\)/s);
    expect(css).toMatch(/\.btn--primary:where\(:not\(:disabled\)\):hover\s*\{\s*background:\s*var\(--accent-hover\);\s*\}/);
    expect(css).toMatch(/\.btn--danger:where\(:not\(:disabled\)\):hover\s*\{\s*background:\s*color-mix\(in srgb, var\(--intent-error\) 88%, var\(--text-strong\)\)/);
    expect(css).toMatch(/\.btn:active, \.icon-btn:active, button\.chip:active, \.tabs__tab:active, \.pagination button:active\s*\{\s*transform:\s*translateY\(1px\)/);
    expect(css).toMatch(/\.btn:disabled, \.icon-btn:disabled, button\.chip:disabled, \.chip__remove:disabled, \.tabs__tab:disabled, \.input:disabled, \.select:disabled\s*\{\s*opacity:\s*\.45;\s*cursor:\s*default/);
    expect(css).toMatch(/\.btn\[aria-disabled="true"\], \.icon-btn\[aria-disabled="true"\]\s*\{\s*opacity:\s*\.45;\s*cursor:\s*default;\s*pointer-events:\s*none/);   // a link styled as a control cannot be :disabled
    expect(css).not.toMatch(/opacity:\s*\.4;/);   // the old .menu__item value is gone
    expect(css).toMatch(/\.menu__item:disabled, \.menu__item:has\(:disabled\)\s*\{\s*opacity:\s*\.45/);
    expect(css).toMatch(/\.input:where\(:not\(:disabled\)\):hover, \.select:where\(:not\(:disabled\)\):hover\s*\{\s*border-color:\s*var\(--border-strong\)/);
    expect(css).toMatch(/button\.chip:not\(\[aria-pressed="true"\]\):not\(\.is-active\):where\(:not\(:disabled\)\):hover\s*\{\s*border-color:\s*var\(--border-default\)/);
    // Review Focus 1: every control hover carries the guard, and the guard is :where()-wrapped so no hover outranks the aria-pressed arm
    for (const sel of ['.btn--secondary', '.btn--ghost', '.icon-btn', '.tabs__tab', '.chip__remove'])
      expect(css, `${sel} hover is guarded`).toMatch(new RegExp(sel.replace('.', '\\.') + ':where\\(:not\\(:disabled\\)\\):hover\\s*\\{'));
    expect(css).toMatch(/\.menu__item:where\(:not\(:disabled, :has\(:disabled\)\)\):hover, \.menu__item:has\(:focus-visible\)\s*\{\s*background:\s*var\(--bg-surface-2\)/);
    expect(css).not.toMatch(/\.(?:btn--[\w-]+|icon-btn|input|select|tabs__tab|menu__item|chip__remove):hover/);   // no unguarded control hover remains
    expect(css).not.toMatch(/:not\(:disabled\):hover/);                                   // never the bare form: it would add specificity
    expect(css.indexOf('.btn--ghost:where(:not(:disabled)):hover')).toBeLessThan(css.search(/^\.btn\.is-active:hover, \.btn:where\(\[aria-pressed="true"\]\):hover/m));   // Review Focus 1: the pressed arm wins its (0,2,0) tie by source order; line-anchored so the comment above the rule cannot satisfy it
    expect(css).toMatch(/\.accordion summary:hover\s*\{\s*background:\s*var\(--bg-surface-2\)/);
    expect(css).toMatch(/\.input, \.select\s*\{[^}]*padding:\s*var\(--control-pad-y, 9px\) var\(--space-3\)/s);
  });
  // Spec 2026-10-06 §5 items 7 and 8: the bar goes opaque when the user asks for less transparency; WHCM keeps the
  // current-page bar and the badge dot (forced-color-adjust: none with system colours, so they stay in the user's palette).
  it('app bar honours reduced transparency; sidebar bar and badge dot survive forced colours', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/@media \(prefers-reduced-transparency: reduce\)\s*\{\s*\.app-bar\s*\{\s*background:\s*var\(--bg-surface-1\);\s*-webkit-backdrop-filter:\s*none;\s*backdrop-filter:\s*none/);
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{\s*\.sidebar a\[aria-current="page"\]::before\s*\{\s*forced-color-adjust:\s*none;\s*background:\s*Highlight/);
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{\s*\.badge \.dot\s*\{\s*forced-color-adjust:\s*none;\s*background:\s*CanvasText/);
  });
  it('card has default padding with a flush opt-out and still no resting shadow', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    const card = block(css, /\.card\s*\{[^}]*\}/s);
    expect(card).toMatch(/padding:\s*var\(--space-5\)/);
    expect(card).not.toMatch(/box-shadow/);
    expect(card).toMatch(/text-decoration:\s*none/);
    expect(css).toMatch(/\.card--flush\s*\{\s*padding:\s*0/);
  });
  // Review Focus 4: base.css forces animation-iteration-count: 1 under reduced motion; the spinner must restate infinite.
  it('feedback: alert title is a block; toast and spinner ship; spinner keeps turning under reduced motion', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.alert__title\s*\{\s*display:\s*block;\s*font-weight:\s*600/);
    expect(css).toMatch(/\.alert__icon\s*\{\s*flex:\s*none;\s*inline-size:\s*16px;\s*block-size:\s*16px/);   // the inline step of icons-stroke-only (16/20/24)
    expect(css).toMatch(/\.toast\s*\{[^}]*position:\s*fixed[^}]*z-index:\s*var\(--z-toast\)[^}]*animation:\s*zha-view-fade/s);
    expect(css).toMatch(/\.toast > \.alert\s*\{\s*box-shadow:\s*var\(--shadow-high\)/);
    expect(css).toMatch(/\.spinner\s*\{[^}]*border-block-start-color:\s*var\(--accent-fill\)[^}]*animation:\s*zha-spin \.8s linear infinite/s);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.spinner\s*\{\s*animation-duration:\s*1\.5s !important;\s*animation-iteration-count:\s*infinite !important/);
  });
  it('tables: wrap mode after the nowrap rule, selected row, sort chevron', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.data-table--wrap th, \.data-table--wrap td\s*\{\s*white-space:\s*normal/);
    expect(css.indexOf('.data-table--wrap th')).toBeGreaterThan(css.indexOf('.data-table th, .data-table td'));
    expect(css).toMatch(/\.data-table tbody tr\[aria-selected="true"\]\s*\{\s*background:\s*var\(--accent-subtle\)/);
    expect(css).toMatch(/\.data-table thead th\s*\{[^}]*z-index:\s*1;/s);
    // Review Focus 2: the chevron skips the primitives the reset rule exempts, through :where() so the ascending/none rules (0,2,3) still override it
    expect(css).toMatch(/\.data-table th\[aria-sort\] button:where\(:not\(\.icon-btn\):not\(\[class\*="btn--"\]\)\)::after\s*\{[^}]*border-inline-end:\s*2px solid currentColor/s);
    expect(css.indexOf('.data-table th[aria-sort] button:where')).toBeLessThan(css.indexOf('.data-table th[aria-sort="ascending"] button::after'));   // Review Focus 2: the direction arms follow the base chevron at equal specificity
    expect(css.indexOf('.data-table th[aria-sort="ascending"] button::after')).toBeLessThan(css.indexOf('.data-table th:is([aria-sort="none"]'));
    expect(css).not.toMatch(/th\[aria-sort\] button::after/);
    expect(css).toMatch(/\.data-table th\[aria-sort="ascending"\] button::after\s*\{\s*transform:\s*rotate\(-135deg\)/);
    expect(css).toMatch(/\.data-table th:is\(\[aria-sort="none"\], \[aria-sort="other"\]\) button::after\s*\{\s*content:\s*none/);
  });
  // Review Focus 6: one print block in base, still covering tinted chips and the translucent bar.
  it('base has one print block covering chips and the app bar; dialog title and app name tidy', () => {
    const base = readFileSync(new URL('../src/primitives/base.css', import.meta.url), 'utf8');
    expect((base.match(/@media print/g) ?? []).length).toBe(1);
    const print = base.slice(base.indexOf('@media print'));
    expect(print).toMatch(/\[class\*="chip--"\]/);
    expect(print).toMatch(/\.app-bar\s*\{\s*background:\s*#fff !important/);
    expect(print).toMatch(/\.toast\s*\{\s*display:\s*none/);   // a fixed toast would otherwise print on every page
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.dialog__title\s*\{[^}]*letter-spacing:\s*var\(--tracking-body\)/s);
    expect(css).toMatch(/\.app-bar \.app-bar__app\s*\{\s*font:\s*400 var\(--fs-h2\) \/ 1\.3 var\(--font-primary\)/);
  });
  // Spec 2026-10-06 §5 item 9: the first focusable element, hidden with the .sr-only recipe until the keyboard reaches it (WCAG 2.4.1).
  it('ships a skip link that is sr-only until it has keyboard focus', () => {
    const css = readFileSync(d('index.css'), 'utf8');
    expect(css).toMatch(/\.skip-link\s*\{\s*position:\s*absolute;\s*inset-inline-start:\s*var\(--space-4\);\s*inset-block-start:\s*var\(--space-4\);\s*z-index:\s*var\(--z-toast\)/);
    expect(css).toMatch(/\.skip-link:not\(:focus-visible\)\s*\{[^}]*clip:\s*rect\(0,0,0,0\)/s);
    expect(css.indexOf('.skip-link {')).toBeLessThan(css.indexOf('.skip-link:not(:focus-visible) {'));   // the hide follows the paint
  });

  it('ships dist/classes.txt - every primitive class, one per line, no false positives', () => {
    expect(existsSync(d('classes.txt'))).toBe(true);
    const lines = readFileSync(d('classes.txt'), 'utf8').trim().split('\n');
    expect(lines).toContain('.stack');
    expect(lines).toContain('.btn--primary');
    expect(lines).toContain('.zha-lockup__team');
    expect(lines).toContain('.skip-link');
    expect(lines).not.toContain('.g');          // "e.g." in a comment must not leak
    expect(lines).not.toContain('.svg');       // url("…zha-logo.svg") must not leak either
    expect(lines.every((l) => /^\.-?[_a-zA-Z][\w-]*$/.test(l))).toBe(true);
    expect(new Set(lines).size).toBe(lines.length);
    expect(JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).exports['./classes.txt']).toBe('./dist/classes.txt');
  });
});
