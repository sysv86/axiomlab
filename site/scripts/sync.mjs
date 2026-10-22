import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const lib = resolve(here, '../src/lib');

mkdirSync(resolve(lib, 'data'), { recursive: true });
copyFileSync(resolve(root, 'benchmarks.json'), resolve(lib, 'data/benchmarks.json'));
copyFileSync(resolve(root, 'axiomlab_results.json'), resolve(lib, 'data/results.json'));

// The root implementation is a UMD bundle. Convert the factory body to an ESM
// module so both SSR and the browser import exactly the same code.
const source = readFileSync(resolve(root, 'axiomlab.js'), 'utf8');
const marker = '})(typeof globalThis !== "undefined" ? globalThis : this, function () {';
const at = source.indexOf(marker);
if (at < 0) throw new Error('UMD header not found in axiomlab.js');
let esm = '// Generated from ../../axiomlab.js by scripts/sync.mjs — do not edit.\n' + 'const AxiomLab = (function () {\n' + source.slice(at + marker.length);
esm = esm.replace(/\}\);\s*$/, '})();\n\nexport default AxiomLab;\n');
writeFileSync(resolve(lib, 'axiomlab.js'), esm);

console.log('Synced axiomlab.js (ESM), benchmarks.json, results.json');
