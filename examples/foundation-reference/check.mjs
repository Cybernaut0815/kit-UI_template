// Drift guard for the foundation reference. Classes are NOT checked (the page defines its own
// fr-* layout classes in a <style> block) and inline styles are allowed (it is a reference sheet
// whose demos set position/size by hand); tokens, colours and CSS structure are enforced.
import { createRequire } from 'node:module';
import { run } from '../_drift-guard.mjs';

run(
  new URL('./index.html', import.meta.url),
  createRequire(import.meta.url).resolve('@gitzhacode/zha-ui-css/index.css'),
  { label: 'foundation-reference' },
);
