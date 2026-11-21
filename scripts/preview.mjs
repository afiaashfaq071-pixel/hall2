// Serve the production build (dist/) with production-like caching headers.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) { console.error('dist/ not found. Run `npm run build` first.'); process.exit(1); }
serve(dist, Number(process.env.PORT) || 4173);
