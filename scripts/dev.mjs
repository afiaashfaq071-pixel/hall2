// Dev loop: rebuild EVERYTHING (JS, CSS, HTML, public/) whenever a source file changes, then reload the browser.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAll } from './build.mjs';
import { serve } from './serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 5173;
let building = false, again = false, timer;

async function rebuild() {
  if (building) { again = true; return; }
  building = true;
  try { await buildAll({ dev: true }); live.reload(); }
  catch (e) { console.error('\nBuild failed (still watching):\n' + (e.message || e)); }
  building = false;
  if (again) { again = false; rebuild(); }
}

const live = serve(path.join(root, 'dist'), port, { live: true });
await rebuild();
for (const target of ['src', 'public', 'index.html', 'scripts/build.mjs']) {
  const p = path.join(root, target);
  if (!fs.existsSync(p)) continue;
  fs.watch(p, { recursive: true }, (_evt, file) => {
    if (file && /(^|[\\/])\.|~$/.test(file)) return; // ignore dotfiles / editor temp files
    clearTimeout(timer);
    timer = setTimeout(() => { console.log(`change: ${target}/${file ?? ''}`); rebuild(); }, 120);
  });
}
console.log('Watching src/, public/, index.html. Edits to TS, CSS, HTML or public files all rebuild and reload.');
