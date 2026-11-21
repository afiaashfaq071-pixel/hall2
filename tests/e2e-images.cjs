// Image-handling checks. Needs two builds of the site: OK (real hero/gallery photos, one broken gallery path)
// and BAD (hero paths that 404). Used with scratch copies; see the audit report.
const { chromium } = require('playwright');
const OK = process.env.OK || 'http://localhost:4174', BAD = process.env.BAD || 'http://localhost:4175';
const res = []; const ok = (n, c, d = '') => res.push([c ? 'PASS' : 'FAIL', n, d]);
(async () => {
  const b = await chromium.launch();
  const mk = async (url, w, h) => { const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(String(e))); await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); }); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(900); return p; };

  for (const [w, h, want, label] of [[390, 844, 'hero-mobile.jpg', 'mobile'], [1440, 900, 'hero-desktop.jpg', 'desktop'], [768, 1024, 'hero-desktop.jpg', 'tablet (768)'], [767, 900, 'hero-mobile.jpg', '767px']]) {
    const p = await mk(OK, w, h);
    const hero = await p.evaluate(() => { const i = document.querySelector('#home img'); return { src: i.currentSrc, loaded: i.complete && i.naturalWidth > 0, nw: i.naturalWidth, nh: i.naturalHeight, prio: i.getAttribute('fetchpriority'), lazy: i.getAttribute('loading'), fit: getComputedStyle(i).objectFit, w: i.getBoundingClientRect().width, cw: document.documentElement.clientWidth, h: i.getBoundingClientRect().height, alt: i.alt }; });
    ok(`${label}: hero loads the ${want.includes('mobile') ? 'PORTRAIT mobile' : 'landscape desktop'} image`, hero.src.endsWith(want) && hero.loaded, JSON.stringify(hero));
    ok(`${label}: hero is high priority and not lazy`, hero.prio === 'high' && hero.lazy !== 'lazy');
    ok(`${label}: hero fills the viewport (object-cover) with a meaningful alt`, hero.fit === 'cover' && Math.round(hero.w) === hero.cw && hero.alt.length > 10, JSON.stringify(hero));
    const cls = await p.evaluate(() => window.__cls);
    ok(`${label}: cumulative layout shift is ${cls.toFixed(3)} (< 0.05)`, cls < 0.05);
    ok(`${label}: no JS errors`, p.errs.length === 0, p.errs.join('|'));
    await p.context().close();
  }
  {
    const p = await mk(OK, 390, 844);
    await p.evaluate(() => document.getElementById('gallery').scrollIntoView({ behavior: 'instant' })); await p.waitForTimeout(600);
    const g = await p.evaluate(() => [...document.querySelectorAll('.gal-item')].map((b) => ({ img: !!b.querySelector('img'), lazy: b.querySelector('img')?.getAttribute('loading'), ph: b.querySelector('[role=img]')?.getAttribute('aria-label') || '', alt: b.querySelector('img')?.alt || '' })));
    ok('real gallery photos render as <img> with loading=lazy', g[0].img && g[0].lazy === 'lazy' && g[1].img && g[1].lazy === 'lazy', JSON.stringify(g.slice(0, 2)));
    ok('a gallery photo whose file is MISSING falls back to the illustration (no broken-image icon)', !g[2].img && g[2].ph.startsWith('Placeholder illustration for:'), JSON.stringify(g[2]));
    ok('items without a photo keep the labelled placeholder', g.slice(3).every((x) => !x.img && x.ph.startsWith('Placeholder illustration')));
    ok('a real photo uses the real alt text (not "illustration")', !/illustration|placeholder/i.test(g[0].alt) && g[0].alt.length > 10, g[0].alt);
    const noBroken = await p.evaluate(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0 || i.loading === 'lazy' && !i.complete));
    ok('no <img> is left broken after load', noBroken);
    // below-the-fold images are not fetched until needed
    const early = await (async () => { const q = await mk(OK, 390, 844); const n = await q.evaluate(() => performance.getEntriesByType('resource').filter((r) => /g1\.jpg|g-portrait\.jpg/.test(r.name)).length); await q.context().close(); return n; })();
    ok('below-the-fold gallery images are NOT downloaded on first load (lazy)', early === 0, `${early} fetched early`);
    // lightbox with real photos: contain, never cropped, fits at 320
    await p.setViewportSize({ width: 320, height: 568 });
    await p.locator('.gal-item').first().click(); await p.waitForTimeout(500);
    const lb = await p.evaluate(() => { const i = document.querySelector('[role=dialog] img'); const r = i.getBoundingClientRect(); return { fit: getComputedStyle(i).objectFit, inView: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, ok: i.naturalWidth > 0 }; });
    ok('lightbox shows a real photo with object-fit: contain, fully on screen at 320x568', lb.fit === 'contain' && lb.inView && lb.ok, JSON.stringify(lb));
    await p.context().close();
  }
  {
    const p = await mk(BAD, 390, 844);
    const r = await p.evaluate(() => ({ heroImg: !!document.querySelector('#home img'), scene: !!document.querySelector('#home svg') }));
    ok('broken hero paths fall back to the illustrated hero (no <img>, no blank hero)', !r.heroImg && r.scene, JSON.stringify(r));
    ok('heading remains readable over the fallback', await p.evaluate(() => getComputedStyle(document.querySelector('#home h1')).color) !== 'rgba(0, 0, 0, 0)');
    ok('no page errors with broken hero paths', p.errs.length === 0, p.errs.join('|'));
    await p.context().close();
  }
  await b.close();
  for (const r of res) console.log(r[0] === 'PASS' ? 'PASS  ' + r[1] : `FAIL  ${r[1]}\n        -> ${r[2]}`);
  const f = res.filter((r) => r[0] === 'FAIL').length; console.log(`\n${res.length - f}/${res.length} image checks passed`); process.exit(f ? 1 : 0);
})().catch((e) => { console.error('CRASH', e); process.exit(2); });
