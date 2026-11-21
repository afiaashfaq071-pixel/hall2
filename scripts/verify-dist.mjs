// Fails the build when dist/ is incomplete or its HTML points at files that do not exist.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const errors = [];
const need = (cond, msg) => { if (!cond) errors.push(msg); };
const exists = (p) => fs.existsSync(path.join(dist, p));

need(exists('index.html'), 'dist/index.html is missing');
if (exists('index.html')) {
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) need(exists(m[1].slice(1)), `index.html references ${m[1]} but it is not in dist/`);
  need(/<title>[^<]{10,70}<\/title>/.test(html), 'missing or badly sized <title> (10-70 chars)');
  const desc = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '';
  need(desc.length >= 70 && desc.length <= 160, `meta description is ${desc.length} chars (want 70-160)`);
  for (const k of ['og:title', 'og:description', 'og:type', 'twitter:card']) need(html.includes(`"${k}"`), `missing ${k} meta`);
  need(html.includes('viewport-fit=cover'), 'viewport meta lacks viewport-fit=cover (safe-area insets need it)');
  const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1];
  need(!!ld, 'missing JSON-LD');
  if (ld) {
    try {
      const j = JSON.parse(ld);
      need(j['@context'] === 'https://schema.org' && j['@type'] === 'EventVenue', 'JSON-LD has wrong @context/@type');
      need(!!j.name && !!j.telephone && j.address?.['@type'] === 'PostalAddress', 'JSON-LD missing name/telephone/address');
      need(/^\+92\d{9,10}$/.test(j.telephone), `JSON-LD telephone "${j.telephone}" is not E.164 (+92...)`);
      need(!('geo' in j), 'JSON-LD must not contain unverified geo coordinates');
    } catch (e) { errors.push('JSON-LD is not valid JSON: ' + e.message); }
  }
  const canonical = /rel="canonical" href="([^"]+)"/.exec(html)?.[1];
  const hasOgImage = html.includes('og:image"');
  if (canonical) need(hasOgImage && html.includes('og:url'), 'canonical set but og:url/og:image missing');
}
for (const f of ['favicon.svg', 'apple-touch-icon.png', 'og-default.png', 'robots.txt']) need(exists(f), `dist/${f} is missing`);
const all = fs.readdirSync(dist, { recursive: true }).map(String);
need(all.filter((f) => /^assets\/app-.+\.js$/.test(f)).length === 1, 'expected exactly one hashed app JS file');
need(all.filter((f) => /^assets\/app-.+\.css$/.test(f)).length === 1, 'expected exactly one hashed app CSS file');
need(!all.some((f) => /\.md$/i.test(f)), 'documentation (.md) files must not be deployed');
need(!all.some((f) => /\.webp$/i.test(f)), 'WEBP images must not be deployed (JPG is the required format): run npm run images:convert');

if (errors.length) { console.error('dist verification FAILED:\n - ' + errors.join('\n - ')); process.exit(1); }
console.log(`dist verification passed (${all.length} entries).`);
