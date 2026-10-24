// Drift guard for the examples hub (examples/index.html), which has no package of its own.
// The hub is a landing page built only from bundle classes, so classes are checked and
// inline styles are knobs-only - this is what would have caught the --fs-h1 bug.
import { createRequire } from 'node:module';
import { run } from '../_drift-guard.mjs';

run(
  new URL('../index.html', import.meta.url),
  createRequire(import.meta.url).resolve('@gitzhacode/zha-ui-css/index.css'),
  { checkClasses: true, inlineKnobsOnly: true, label: 'examples hub' },
);
