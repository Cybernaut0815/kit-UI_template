import { converter } from 'culori';
const toOklch = converter('oklch');

/** Convert a hex string to a CSS oklch() string, rounded for stable output. */
export function oklchFromHex(hex) {
  const c = toOklch(hex);
  const L = Math.round(c.l * 10000) / 10000;
  const C = Math.round((c.c ?? 0) * 10000) / 10000;
  const H = c.h == null ? 0 : Math.round(c.h * 100) / 100;
  return `oklch(${L} ${C} ${H})`;
}
