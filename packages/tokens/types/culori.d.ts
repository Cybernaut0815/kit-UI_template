// Minimal type shim for culori@4 (ships no .d.ts).
// Only the symbols used in contrast-matrix.mjs and contrast.test.ts are declared.
declare module 'culori' {
  export type Color = { mode: string; [key: string]: unknown };
  export type RgbColor = { mode: 'rgb'; r: number; g: number; b: number; alpha?: number };

  export function wcagContrast(a: Color | null | undefined, b: Color | null | undefined): number;
  export function converter(mode: string): (color: Color | string | null | undefined) => RgbColor | undefined;
}
