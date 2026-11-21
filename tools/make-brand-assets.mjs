// One-off generator for public/og-default.png (1200x630) and public/apple-touch-icon.png (180x180).
// Needs `sharp` (not a project dependency):  npm i --no-save sharp && node tools/make-brand-assets.mjs
// Brand card only: name, area and tagline. It deliberately contains no photograph of any venue.
import sharp from 'sharp';
const arch = (s) => `<g transform="scale(${s})"><path d="M32 6C20 6 11 16 11 29v29h42V29C53 16 44 6 32 6z" fill="none" stroke="#C5A46D" stroke-width="2.5"/><path d="M32 14c-7 0-12 6-12 15v29h24V29c0-9-5-15-12-15z" fill="none" stroke="#C5A46D" stroke-opacity=".5" stroke-width="1.5"/><text x="32" y="46" font-family="Georgia,serif" font-size="26" font-weight="600" text-anchor="middle" fill="#C5A46D">G</text></g>`;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#30212A"/><rect x="24" y="24" width="1152" height="582" fill="none" stroke="#C5A46D" stroke-opacity=".5"/><g transform="translate(540,70)">${arch(2)}</g><text x="600" y="340" font-family="Georgia,serif" font-size="84" font-weight="600" text-anchor="middle" fill="#F7F3ED">Gulshan Banquet Hall</text><text x="600" y="410" font-family="Georgia,serif" font-size="34" letter-spacing="8" text-anchor="middle" fill="#C5A46D">SAMBRIAL ROAD · SIALKOT</text><text x="600" y="500" font-family="Georgia,serif" font-style="italic" font-size="36" text-anchor="middle" fill="#F7F3ED" fill-opacity=".85">Where Every Celebration Becomes a Beautiful Memory</text></svg>`;
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="180" height="180" fill="#30212A"/><g transform="translate(34,26)">${arch(1.8)}</g></svg>`;
await sharp(Buffer.from(og)).png().toFile('public/og-default.png');
await sharp(Buffer.from(icon)).png().toFile('public/apple-touch-icon.png');
console.log('written');
