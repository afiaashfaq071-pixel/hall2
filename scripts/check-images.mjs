// Image integrity gate (runs before every build). Fails when:
//   - a source file references an image that does not exist in public/images (exact-case match, because Vercel is case-sensitive)
//   - a .webp file or a ".webp" reference is still present (JPG is the required format)
// Warns about other formats, unreferenced files, very large files and risky file names.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = path.join(root, 'public/images');
const errors = [], warns = [];
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);

const onDisk = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).filter((f) => !/^readme\.md$/i.test(f)) : [];
const byLower = new Map(onDisk.map((f) => [f.toLowerCase(), f]));

for (const f of onDisk) {
  if (/\.webp$/i.test(f)) errors.push(`public/images/${f} is still WEBP. Run: npm run images:convert`);
  else if (!/\.jpg$/.test(f)) warns.push(`public/images/${f}: expected a lowercase ".jpg" extension`);
  if (/[A-Z\s]/.test(f)) warns.push(`public/images/${f}: upper-case letters or spaces in a file name often break on Linux hosting; consider renaming (and updating its reference)`);
  const kb = fs.statSync(path.join(imgDir, f)).size / 1024;
  if (kb > 700) warns.push(`public/images/${f} is ${Math.round(kb)} kB; large photos slow phones down (consider quality 80-85 or smaller dimensions)`);
}

const code = [...walk(path.join(root, 'src')).filter((f) => /\.(ts|tsx)$/.test(f)), path.join(root, 'index.html')];
const docs = [path.join(root, 'README.md'), path.join(imgDir, 'README.md')].filter((f) => fs.existsSync(f));
const referenced = new Set();
// Documentation: only a concrete "/images/<name>.webp" path counts as a stale reference (prose may mention the word).
for (const file of docs) {
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => { if (/\/images\/[^\s'"`)*]+\.webp\b/i.test(line)) errors.push(`${path.relative(root, file)}:${i + 1} still points at a .webp image: ${line.trim().slice(0, 90)}`); });
}
for (const file of code) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, 'utf8');
  text.split('\n').forEach((line, i) => {
    if (/\.webp\b/i.test(line)) errors.push(`${rel}:${i + 1} still mentions ".webp": ${line.trim().slice(0, 90)}`);
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // comments hold examples, not real references
    for (const m of line.matchAll(/['"`](\/images\/[^'"`\s]+)['"`]/g)) {
      const name = decodeURIComponent(m[1].slice('/images/'.length));
      referenced.add(name);
      if (onDisk.includes(name)) continue;
      const near = byLower.get(name.toLowerCase());
      errors.push(near ? `${rel}:${i + 1} references "${name}" but the file is named "${near}" (case differs: works on Windows, 404s on Vercel)` : `${rel}:${i + 1} references /images/${name} but public/images/${name} does not exist`);
    }
  });
}
for (const f of onDisk) if (!referenced.has(f)) warns.push(`public/images/${f} is not used by any page yet`);

for (const w of warns) console.warn('  warn: ' + w);
if (errors.length) { console.error('Image check FAILED:\n - ' + errors.join('\n - ')); process.exit(1); }
console.log(`Image check passed (${onDisk.length} file(s) in public/images, ${referenced.size} referenced).`);
