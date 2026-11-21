// Converts every .webp in public/images to .jpg, keeping the file name EXACTLY (only the extension changes),
// keeping the pixel dimensions, then updates every reference in the project and runs the image check.
//
//   npm i --no-save sharp          (one time; sharp is not a project dependency)
//   npm run images:convert         (options: --quality=90  --dry-run  --force)
//
// The original .webp files are MOVED to source-images/webp-originals/ (outside public/, so they are never deployed).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = path.join(root, 'public/images');
const backup = path.join(root, 'source-images/webp-originals');
const args = process.argv.slice(2);
const dry = args.includes('--dry-run'), force = args.includes('--force');
const quality = Number((args.find((a) => a.startsWith('--quality=')) || '--quality=90').split('=')[1]);
if (!(quality >= 60 && quality <= 100)) { console.error('--quality must be between 60 and 100'); process.exit(1); }

let sharp;
try { sharp = (await import('sharp')).default; }
catch { console.error('The "sharp" image library is needed once for conversion.\nRun:  npm i --no-save sharp   then run this command again.'); process.exit(1); }

const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const files = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).filter((f) => /\.webp$/i.test(f)) : [];
if (!files.length) console.log('No .webp files found in public/images. Nothing to convert.');

const converted = [];
for (const f of files) {
  const base = f.replace(/\.webp$/i, '');
  const src = path.join(imgDir, f), out = path.join(imgDir, base + '.jpg');
  if (fs.existsSync(out) && !force) { console.warn(`  skip  ${f}: ${base}.jpg already exists (use --force to overwrite)`); continue; }
  const meta = await sharp(src).metadata();
  if ((meta.pages ?? 1) > 1) console.warn(`  note  ${f} is animated; only its first frame is kept in the JPG`);
  if (dry) { console.log(`  would convert ${f} -> ${base}.jpg (${meta.width}x${meta.height}${meta.hasAlpha ? ', transparency becomes white' : ''})`); continue; }
  let img = sharp(src);
  if (meta.hasAlpha) img = img.flatten({ background: '#ffffff' }); // JPG cannot be transparent
  await img.jpeg({ quality, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(out);
  const after = await sharp(out).metadata();
  if (after.width !== meta.width || after.height !== meta.height) throw new Error(`${base}.jpg changed size (${meta.width}x${meta.height} -> ${after.width}x${after.height})`);
  fs.mkdirSync(backup, { recursive: true });
  fs.renameSync(src, path.join(backup, f));
  converted.push(base);
  console.log(`  ok    ${f} -> ${base}.jpg  ${meta.width}x${meta.height}  ${(fs.statSync(out).size / 1024).toFixed(0)} kB`);
}

// Update references (code, data files, docs). Only names that were actually converted are touched.
let edits = 0;
if (!dry) {
  const targets = [...walk(path.join(root, 'src')).filter((f) => /\.(ts|tsx)$/.test(f)), path.join(root, 'index.html'), path.join(root, 'README.md'), path.join(imgDir, 'README.md')].filter((f) => fs.existsSync(f));
  for (const t of targets) {
    let s = fs.readFileSync(t, 'utf8'); const before = s;
    for (const base of converted) s = s.replace(new RegExp(`(/images/${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\.webp`, 'gi'), (_m, p1) => { edits++; return `${p1}.jpg`; });
    if (s !== before) { fs.writeFileSync(t, s); console.log(`  updated references in ${path.relative(root, t)}`); }
  }
}
console.log(`\nConverted ${converted.length} file(s); ${edits} reference(s) updated.${converted.length ? ' Originals are in source-images/webp-originals/.' : ''}`);
if (!dry) process.exit(spawnSync(process.execPath, [path.join(root, 'scripts/check-images.mjs')], { stdio: 'inherit' }).status ?? 1);
