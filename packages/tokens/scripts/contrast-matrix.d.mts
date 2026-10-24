/** A theme-pair contrast miss (light/dark fg-on-bg below its WCAG need). */
export interface ThemeContrastFailure {
  theme: string;
  fg: string;
  bg: string;
  ratio: number;
  need: number;
}

/** A brand-axis contrast miss (a `[data-brand]` accent pair below its need); `note` set when the block is absent. */
export interface BrandContrastFailure {
  brand: string;
  fg: string;
  bg: string;
  ratio: number;
  need: number;
  note?: string;
}

/** Returned by {@link checkContrast}. `failures` mixes theme-pair, brand-pair, and structural records. */
export interface ContrastResult {
  pass: boolean;
  failures: Array<ThemeContrastFailure | BrandContrastFailure | PartialSecondaryFailure>;
}

/**
 * Read `dist/tokens.css`, resolve every declared fg/bg pair in both light and
 * dark themes, and return pass/fail status with per-pair details.
 *
 * @param cssPath - Path to the built CSS file.  Defaults to `../dist/tokens.css`
 *                  relative to this script.
 */
export function checkContrast(cssPath?: URL | string): ContrastResult;

/** Structural failure record returned by {@link partialSecondaryFailure}, or null when the brand is consistent. */
export interface PartialSecondaryFailure {
  brand: string;
  type: 'structural';
  fg: string;
  bg: string;
  note: string;
}

/**
 * A brand that declares a secondary tint/fill MUST declare its `--accent-2` hue;
 * otherwise the gradient/tint silently falls back to core's default magenta.
 * Returns a structural-failure record, or `null` when the brand is consistent.
 */
export function partialSecondaryFailure(
  brand: string,
  brandVars: Record<string, string>,
): PartialSecondaryFailure | null;
