// Drift guard - thin runner around ../_drift-guard.mjs. A consumer page (not a
// deck), so classes ARE checked: every primitive class and var(--…) must exist in
// the built bundle, no brand colour hardcoded, CSS structurally sound.
import { createRequire } from 'node:module';
import { run } from '../_drift-guard.mjs';

run(
  new URL('./index.html', import.meta.url),
  createRequire(import.meta.url).resolve('@gitzhacode/zha-ui-css/index.css'),
  { checkClasses: true, label: 'gradient-showcase' },
);
