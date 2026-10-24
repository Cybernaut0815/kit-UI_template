import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const tokensCss = require.resolve('@gitzhacode/zha-ui-tokens/tokens.css');

mkdirSync('dist/assets', { recursive: true });
copyFileSync(tokensCss, 'dist/tokens.css');
copyFileSync('src/es-lockup.css', 'dist/es-lockup.css');
copyFileSync('src/assets/zha-logo.svg', 'dist/assets/zha-logo.svg');
copyFileSync('src/assets/zha-sans.ttf', 'dist/assets/zha-sans.ttf');
copyFileSync('src/assets/inter-latin.woff2', 'dist/assets/inter-latin.woff2');
copyFileSync('src/assets/inter-latin-ext.woff2', 'dist/assets/inter-latin-ext.woff2');
copyFileSync('src/assets/inter-OFL.txt', 'dist/assets/inter-OFL.txt'); // SIL OFL 1.1 must travel with the fonts

// Fixed, ordered list - this IS the cascade order. Do not glob.
const PARTIALS = ['base', 'type', 'gradient', 'layout', 'nav', 'content', 'feedback', 'overlay', 'menu'];
const primitives = PARTIALS.map((n) => readFileSync(`src/primitives/${n}.css`, 'utf8')).join('\n');
writeFileSync('dist/primitives.css', primitives);

// classes.txt - the always-current class vocabulary for agents (llms.txt points here).
// Comments and url() values are stripped first so prose like "e.g." or an asset path like "zha-logo.svg" cannot leak a bogus ".g" or ".svg".
const lockup = readFileSync('src/es-lockup.css', 'utf8');
const noComments = (primitives + '\n' + lockup).replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, '');
const classes = [...new Set([...noComments.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => '.' + m[1]))].sort();
writeFileSync('dist/classes.txt', classes.join('\n') + '\n');

const index = [readFileSync(tokensCss, 'utf8'), primitives, readFileSync('src/es-lockup.css', 'utf8')].join('\n');
writeFileSync('dist/index.css', index);
console.log('@gitzhacode/zha-ui-css built.');
