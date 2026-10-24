// Read a CSS custom property off :root and normalize it to sRGB rgb()/rgba().
// Canvas renderers (ECharts, Leaflet) need literal colours, not var(); and this
// design system's tokens resolve to oklch() in modern browsers, which those
// renderers can't parse as a colour input. A 1px canvas getImageData round-trip
// forces sRGB. Verified in Chromium. Browser-only (needs a <canvas>).
let ctx

export function cssVar(name, fallback = '#000') {
  ctx ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!raw || !ctx) return fallback
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = '#000' // seed: canvas ignores an unparseable assignment, so a bad token renders black
  ctx.fillStyle = raw
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${+(a / 255).toFixed(3)})`
}
