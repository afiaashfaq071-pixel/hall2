// `npm run typecheck`: uses the real @types/react when installed; otherwise the offline shim (and says so).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const real = fs.existsSync(path.join(root, 'node_modules/@types/react/index.d.ts'));
const project = real ? 'tsconfig.json' : 'tsconfig.offline.json';
console.log(real ? 'Type checking against the real @types/react.' : 'WARNING: @types/react is not installed; using the loose offline shim (tsconfig.offline.json). Run `npm install` for full checking.');
const r = spawnSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', project, '--noEmit'], { cwd: root, stdio: 'inherit' });
process.exit(r.status ?? 1);
