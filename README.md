# Gulshan Banquet Hall – frontend

React 19 + TypeScript (strict) + Tailwind CSS v4 + Lucide icons (via `react-icons/lu`). No backend; ready for one.

## Commands
| | |
|---|---|
| `npm install` | install dependencies (includes `@types/react`) |
| `npm run dev` | build + serve at :5173, **rebuilds JS, CSS, HTML and `public/` on every change** and reloads the browser |
| `npm run typecheck` | `tsc` strict + unused-code checks. Uses the real `@types/react`; if they are not installed it falls back to `tsconfig.offline.json` (loose shim) and prints a warning |
| `npm test` | unit tests (dates, leap years, phone formats, validation, SEO) run under 5 timezones |
| `npm run build` | production build to `dist/` (content-hashed assets) + `verify-dist` (fails on missing files / bad head / broken image paths) |
| `npm run preview` | serve `dist/` like production at :4173 |
| `npm run images:check` | every `/images/...` reference must exist (exact case) and no `.webp` may remain. Runs automatically before `build` |
| `npm run images:convert` | converts `public/images/*.webp` to `.jpg` (same file names, same pixel size), moves the originals to `source-images/webp-originals/`, updates all references. Needs `npm i --no-save sharp` once |

Browser tests: `tests/e2e.cjs` and `tests/e2e-images.cjs` (Playwright, not a dependency: `npm i --no-save playwright`).

## Deploying (Vercel)
`vercel.json` is included (build `npm run build`, output `dist`, immutable caching for `/assets/*`, security headers). Set the **`SITE_URL`** environment variable (e.g. `https://www.example.com`) to enable canonical, `og:url`, `og:image`, `sitemap.xml` and the large Twitter card. Without it those are omitted rather than guessed.

## Where to edit (`src/data/`)
`business.ts` (name, address, phone, WhatsApp, email, social, map, hero, guest limits) · `venues.ts` · `services.ts` · `events.ts` · `gallery.ts` · `faqs.ts` · `why.ts`.
The `tel:` link is **derived from the displayed phone number** (`src/lib/contact.ts`), so they cannot disagree. `<head>`/JSON-LD are generated from the same data at build time (`src/data/seo.ts`).

## Management must confirm (nothing below is invented)
1. **WhatsApp number** -> `business.whatsappNumber` (digits, e.g. `'923001234567'`). Until set or if malformed, every WhatsApp button is hidden.
2. **Photos** -> `public/images`, then reference them in `business.ts` (hero desktop + portrait mobile) and `gallery.ts` / `events.ts` / `venues.ts`. Illustrations show until then; a photo that fails to load falls back to its illustration. **When adding a photo, make sure the item's `alt` describes that photograph.**
3. **Real hall list, capacities, guest limits** (10–1500 is a placeholder).
4. **Services** (all marked "Enquire to confirm"), official **packages and prices**.
5. **Exact map pin**: paste Google's "Embed a map" `src` into `business.map.embedUrl` and set `verifiedPin: true`. Until then the map is labelled "may be approximate".
6. Email / social links, and the production URL (`SITE_URL`).

## Backend hand-off
`src/lib/enquiry.ts` builds the validated `Enquiry`. Replace the Send step in `BookingForm.tsx` with a POST to your API.

## Notes
- Framer Motion was not used (could not be installed offline); animation is CSS + one shared IntersectionObserver and respects reduced-motion.
- Tailwind v4 targets modern browsers (Safari 16.4+, Chrome 111+, Firefox 128+).
- `tools/make-brand-assets.mjs` regenerated `public/og-default.png` / `apple-touch-icon.png` (brand card only, no venue photo).
