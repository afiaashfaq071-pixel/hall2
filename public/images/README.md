# Real photographs go here

The site ships with illustrated placeholders, NOT photos, so no unrelated venue is ever shown as Gulshan.
When management supplies genuine photos, drop them in this folder and reference them in:

- `src/data/business.ts`  -> `hero.desktop` (landscape, ~2400x1350) and `hero.mobile` (portrait, ~1080x1620)
- `src/data/gallery.ts`   -> `photo` per item
- `src/data/events.ts`    -> `photo` per event
- `src/data/venues.ts`    -> `photo` per venue

Use WebP/AVIF, under ~250 KB each. Any item without `photo` automatically keeps its illustration.

Important: each item's `alt` text must describe the real photograph you put in that slot.
This folder's `README.md` is not deployed (the build skips .md files). A missing file is caught by `npm run build` for hero images and falls back to the illustration for gallery/event/venue images.
