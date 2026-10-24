// Deck drift guard - thin runner around ../_drift-guard.mjs (pure lint + tests
// live there). Decks keep their own LAYOUT classes (.slide/.chrome/…), so classes
// are NOT checked; render-verify backstops class spelling. Vars must resolve to a
// bundle token, no brand colour may be hardcoded, and the CSS must be structurally
// sound (comment/brace balance - the check the old regex-only guard lacked).
import { createRequire } from 'node:module';
import { run } from '../_drift-guard.mjs';

run(
  new URL('./index.html', import.meta.url),
  createRequire(import.meta.url).resolve('@gitzhacode/zha-ui-css/index.css'),
  { label: 'deck drift guard' },
);
