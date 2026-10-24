// P4 derivation: canonical categorical order + per-mode snapped steps + ramps,
// scored/validated with the dataviz skill's validate_palette.js (the standard's own
// simulation model), colors manipulated with culori (same lib as the token pipeline).
import { createRequire } from 'node:module';
const require = createRequire('file:///C:/Users/aleksander.mastalski/repositories/zha-ui/packages/tokens/package.json');
const { converter, formatHex, wcagContrast, clampChroma } = require('culori');
const V = await import('file:///C:/Users/ALEKSA~1.MAS/AppData/Local/Temp/claude/bundled-skills/2.1.217/7ede992a1a9ce3e8911800d71328bc6c/dataviz/scripts/validate_palette.js');

const rgb = converter('rgb');
const toOklch = converter('oklch');

const HUES = {
  purple: '#7633E2', ultramarine: '#2838E6', blue: '#1372DE', teal: '#048C9C',
  'dark-green': '#1A9D67', 'light-green': '#99C025', lime: '#C6BE13', yellow: '#F5BB00',
  apricot: '#F3901B', orange: '#E74D2B', 'cool-red': '#E61C4E', magenta: '#CB0092',
};
const SURFACE = { light: '#FFFFFF', dark: '#1d1d1b' };
const BAND = { light: [0.43, 0.77], dark: [0.48, 0.67] };

const at = (base, l) => clampChroma({ mode: 'oklch', l, c: base.c, h: base.h }, 'oklch');

// Snap: closest-in-band L to the brand hue that also clears 3:1 vs the mode surface.
function snap(hex, mode) {
  const base = toOklch(hex);
  let [lo, hi] = BAND[mode];
  if (mode === 'light') { while (hi > lo && wcagContrast(rgb(at(base, hi)), rgb(SURFACE[mode])) < 3) hi -= 0.005; }
  else { while (lo < hi && wcagContrast(rgb(at(base, lo)), rgb(SURFACE[mode])) < 3) lo += 0.005; }
  const l = Math.min(Math.max(base.l, lo), hi - 0.003); // epsilon: hex round-trip must stay inside the band
  const c = at(base, l);
  return { hex: formatHex(c), L: +l.toFixed(3), C: +toOklch(formatHex(c)).c.toFixed(3), contrast: +wcagContrast(rgb(c), rgb(SURFACE[mode])).toFixed(2) };
}

const snapped = {};
for (const mode of ['light', 'dark']) {
  snapped[mode] = {};
  for (const [n, h] of Object.entries(HUES)) snapped[mode][n] = snap(h, mode);
}

// Pairwise worst-CVD and normal ΔE via 2-color validate() (parse its report).
function pairDE(a, b, mode) {
  const { report } = V.validate([a, b], { mode, surface: SURFACE[mode] });
  const cvd = +(report.find((r) => r[0] === 'CVD separation')[2].match(/ΔE ([\d.]+)/)?.[1] ?? 0);
  const nor = +(report.find((r) => r[0] === 'Normal-vision floor')[2].match(/ΔE ([\d.]+)/)?.[1] ?? 0);
  return { cvd, nor };
}
const names = Object.keys(HUES);
const M = {};
for (const mode of ['light', 'dark']) {
  M[mode] = {};
  for (const a of names) for (const b of names) if (a < b) M[mode][`${a}|${b}`] = pairDE(snapped[mode][a].hex, snapped[mode][b].hex, mode);
}
const de = (mode, a, b) => M[mode][a < b ? `${a}|${b}` : `${b}|${a}`];

// Beam search: 8 slots, slot 1 = teal (brand-first). Score = min adjacent worst-CVD
// across BOTH modes (same order must hold in light and dark); hard gate: normal >= 15.
// Status hues with strong good/bad semantics are excluded from categorical slots
// (intent.error=cool-red, intent.success=dark-green, intent.warning=yellow).
// Blue (intent-info) stays in the pool - info carries no good/bad load.
const POOL = names.filter((n) => !['cool-red', 'dark-green', 'yellow'].includes(n));
const N_SLOTS = 8, BEAM = 800;
let beams = [{ seq: ['teal'], score: Infinity, sum: 0 }];
for (let d = 1; d < N_SLOTS; d++) {
  const next = [];
  for (const b of beams) {
    const last = b.seq[b.seq.length - 1];
    for (const n of POOL) {
      if (b.seq.includes(n)) continue;
      const l = de('light', last, n), k = de('dark', last, n);
      if (l.nor < 15 || k.nor < 15) continue; // normal-vision hard floor, both modes
      const s = Math.min(b.score, l.cvd, k.cvd);
      next.push({ seq: [...b.seq, n], score: s, sum: b.sum + l.cvd + k.cvd });
    }
  }
  next.sort((x, y) => y.score - x.score || y.sum - x.sum);
  beams = next.slice(0, BEAM);
}
const best = beams[0];

console.log('SNAPPED STEPS'); console.log(JSON.stringify(snapped, null, 1));
console.log('\nCANONICAL ORDER:', best.seq.join(' → '), ' minAdjCVD(bothModes):', best.score.toFixed(1));

for (const mode of ['light', 'dark']) {
  const pal = best.seq.map((n) => snapped[mode][n].hex);
  const { report, ok } = V.validate(pal, { mode, surface: SURFACE[mode] });
  console.log(`\nVALIDATE ${mode} (adjacent):`, ok ? 'OK' : 'ISSUES');
  for (const r of report) console.log(' ', r[0], '|', r[1], '|', r[2]);
  const first3 = V.validate(pal.slice(0, 3), { mode, surface: SURFACE[mode], pairs: 'all' });
  console.log(`first-3 all-pairs ${mode}:`, first3.ok ? 'OK' : 'ISSUES',
    first3.report.find((r) => r[0] === 'CVD separation')[2]);
}

// Sequential ramp - teal, 6 steps, monotone L, validated with validateOrdinal.
function ramp(hex, Ls) { const base = toOklch(hex); return Ls.map((l) => formatHex(at(base, l))); }
const seqLight = ramp(HUES.teal, [0.75, 0.68, 0.61, 0.54, 0.47, 0.40]);
const seqDark = ramp(HUES.teal, [0.42, 0.49, 0.56, 0.63, 0.70, 0.77]);
for (const [mode, pal] of [['light', seqLight], ['dark', seqDark]]) {
  const { report, ok } = V.validateOrdinal(pal, { mode, surface: SURFACE[mode] });
  console.log(`\nSEQ ${mode}:`, pal.join(','), ok ? 'OK' : 'ISSUES');
  for (const r of report) if (r[1] !== true && r[1] !== 'pass') console.log(' !', r[0], '|', r[1], '|', r[2]);
}

// Diverging - blue pole ↔ cool-red pole, 3 steps per arm + neutral gray midpoint.
function arm(hex, mode) {
  const Ls = mode === 'light' ? [0.45, 0.57, 0.69] : [0.72, 0.62, 0.52]; // pole → near-mid
  return ramp(hex, Ls);
}
const MID = { light: '#B9B7B5', dark: '#5A5754' };
for (const mode of ['light', 'dark']) {
  const neg = arm(HUES.blue, mode), pos = arm(HUES['cool-red'], mode);
  const full = mode === 'light' ? [...neg, MID.light, ...pos.slice().reverse()] : [...neg, MID.dark, ...pos.slice().reverse()];
  console.log(`\nDIV ${mode}:`, full.join(','));
  for (const [label, a] of [['blue-arm', neg], ['red-arm', pos]]) {
    const { report, ok } = V.validateOrdinal(mode === 'light' ? a.slice().reverse() : a, { mode, surface: SURFACE[mode] });
    console.log(` ${label}:`, ok ? 'OK' : 'ISSUES', report.filter((r) => r[1] !== true && r[1] !== 'pass').map((r) => `${r[0]}: ${r[2]}`).join(' · ') || '');
  }
}
