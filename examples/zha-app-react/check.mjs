// Drift guard for the React starter - thin runner around ../_drift-guard.mjs with the JSX transform.
// A consumer app (Ring 2), so classes ARE checked and inline styles are knobs-only: every string-literal className must be a
// bundle class, every var(--…) a bundle token, no colour literal, no layout in a style object.
import { createRequire } from 'node:module';
import { run, jsxToMarkup } from '../_drift-guard.mjs';

run(
  new URL('./src/App.jsx', import.meta.url),
  createRequire(import.meta.url).resolve('@gitzhacode/zha-ui-css/index.css'),
  { checkClasses: true, inlineKnobsOnly: true, transform: jsxToMarkup, label: 'zha-app-react' },
);
