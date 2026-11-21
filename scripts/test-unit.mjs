// Bundles tests/unit.ts with esbuild and runs it under several timezones (date code must never shift).
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = await build({ entryPoints: [path.join(root, 'tests/unit.ts')], bundle: true, write: false, format: 'esm', platform: 'node', target: 'node20', logLevel: 'silent' });
const code = out.outputFiles[0].text;
let failed = false;
for (const tz of ['Asia/Karachi', 'UTC', 'Pacific/Kiritimati', 'Etc/GMT+12', 'America/Los_Angeles']) {
  console.log(`\n[TZ=${tz}]`);
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { env: { ...process.env, TZ: tz }, stdio: 'inherit' });
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
