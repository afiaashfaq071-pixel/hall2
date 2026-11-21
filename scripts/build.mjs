// Offline-capable production build: esbuild (JS) + Tailwind v4 compile API (CSS) + build-time <head>/SEO.
// Output goes to dist/ with content-hashed asset names (safe for long-lived caching).
import { build } from 'esbuild';
import { compile } from 'tailwindcss';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const rel = (...p) => path.join(root, ...p);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const hash = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);

async function buildCss({ minify }) {
  const src = fs.readFileSync(rel('src/styles.css'), 'utf8');
  const compiler = await compile(src, {
    base: root,
    onDependency() {},
    loadStylesheet: async (id, base) => {
      const p = id === 'tailwindcss' ? rel('node_modules/tailwindcss/index.css')
        : id.startsWith('tailwindcss/') ? rel('node_modules', id + (id.endsWith('.css') ? '' : '.css'))
        : path.resolve(base, id);
      return { path: p, base: path.dirname(p), content: fs.readFileSync(p, 'utf8') };
    },
  });
  // Tailwind generates only the classes that appear in our source files.
  const candidates = new Set();
  for (const f of [...walk(rel('src')), rel('index.html')]) {
    if (!/\.(tsx?|html)$/.test(f)) continue;
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/[^\s"'`<>=(){};,]+/g)) candidates.add(m[0]);
  }
  const css = compiler.build([...candidates]);
  const { transform } = await import('esbuild');
  return (await transform(css, { loader: 'css', minify })).code;
}

/** Bundle src/data/seo.ts (same business data as the app) and run it in Node to get the <head> markup. */
async function loadSeo() {
  const out = await build({ entryPoints: [rel('src/data/seo.ts')], bundle: true, write: false, format: 'esm', platform: 'node', target: 'node20', logLevel: 'silent' });
  return import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
}

export async function buildAll({ dev = false } = {}) {
  const t0 = Date.now();
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });

  const js = await build({
    entryPoints: [rel('src/main.tsx')], bundle: true, minify: !dev, sourcemap: dev, format: 'esm', target: 'es2020',
    outdir: dist, entryNames: 'assets/app-[hash]', jsx: 'automatic', metafile: true, logLevel: 'warning',
    define: { 'process.env.NODE_ENV': dev ? '"development"' : '"production"' },
  });
  const jsFile = Object.keys(js.metafile.outputs).find((f) => f.endsWith('.js'));
  const jsName = path.basename(jsFile);

  const css = await buildCss({ minify: !dev });
  const cssName = `app-${hash(css)}.css`;
  fs.writeFileSync(path.join(dist, 'assets', cssName), css);

  const siteUrl = (process.env.SITE_URL || '').trim();
  const seo = await loadSeo();
  const effectiveUrl = siteUrl || seo.siteUrlFromBusiness || '';
  let html = fs.readFileSync(rel('index.html'), 'utf8');
  const fill = (marker, value) => { if (!html.includes(marker)) throw new Error(`index.html is missing ${marker}`); html = html.replace(marker, () => value); };
  fill('<!--HEAD-->', seo.renderHead(effectiveUrl));
  fill('<!--CSS-->', `<link rel="stylesheet" href="/assets/${cssName}" />`);
  fill('<!--NOSCRIPT-->', seo.renderNoscript());
  fill('<!--JS-->', `<script type="module" src="/assets/${jsName}"></script>`);
  fs.writeFileSync(path.join(dist, 'index.html'), html);

  // public/ -> dist/ (documentation files are not deployed)
  if (fs.existsSync(rel('public'))) {
    fs.cpSync(rel('public'), dist, { recursive: true, filter: (src) => !/\.(md|txt~)$/i.test(src) && !src.endsWith('.DS_Store') });
  }
  const base = effectiveUrl.replace(/\/$/, '');
  fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ''}`);
  if (base) fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc></url></urlset>\n`);

  const kb = (f) => (fs.statSync(path.join(dist, 'assets', f)).size / 1024).toFixed(1);
  console.log(`Build complete in ${Date.now() - t0}ms -> dist/  (${jsName} ${kb(jsName)} kB, ${cssName} ${kb(cssName)} kB)`);
  return { jsName, cssName };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildAll().catch((e) => { console.error(e); process.exit(1); });
}
