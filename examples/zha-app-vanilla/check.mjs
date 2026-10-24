// Drift guard - thin runner around ../_drift-guard.mjs. A consumer page (Ring-1
// starter), so classes ARE checked: every primitive class and var(--…) must exist
// in the built bundle, no colour hardcoded, CSS structurally sound. This catches
// the dominant AI failure mode (made-up classes/tokens) and enforces token-only colour.
import { createRequire } from 'node:module';
import { run } from '../_drift-guard.mjs';

run(
  new URL('./index.html', import.meta.url),
  createRequire(import.meta.url).resolve('@gitzhacode/zha-ui-css/index.css'),
  { checkClasses: true, inlineKnobsOnly: true, label: 'zha-app-vanilla' },
);
