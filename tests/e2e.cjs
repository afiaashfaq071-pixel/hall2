// End-to-end suite (Playwright + Chromium). Run against a served build:
//   npm run build && PORT=4173 npm run preview &   then   BASE=http://localhost:4173 node tests/e2e.cjs
// Playwright is NOT a project dependency; install it separately to run this.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:4173';
const SHOTS = process.env.SHOTS || '';
const results = [];
const info = [];
const ok = (name, cond, detail = '') => { results.push([cond ? 'PASS' : 'FAIL', name, cond ? '' : detail]); };
const noise = /fonts\.g|ERR_(NAME|INTERNET|CONNECTION|BLOCKED|TUNNEL|FAILED)|Failed to load resource|google\.com\/maps|gstatic/i;
const stable = async (p) => { let last = -1, same = 0; for (let i = 0; i < 80 && same < 4; i++) { const y = await p.evaluate(() => Math.round(scrollY)); same = y === last ? same + 1 : 0; last = y; await p.waitForTimeout(60); } };
const topOf = (p, id) => p.evaluate((i) => Math.round(document.getElementById(i).getBoundingClientRect().top), id);
const shot = (p, name, o = {}) => SHOTS && p.screenshot({ path: `${SHOTS}/${name}.png`, ...o });
const karachi = { timezoneId: 'Asia/Karachi', locale: 'en-GB' };

async function newPage(browser, vp, extra = {}) {
  const ctx = await browser.newContext({ viewport: vp, ...karachi, ...extra });
  const p = await ctx.newPage();
  p.errs = [];
  p.on('console', (m) => m.type() === 'error' && !noise.test(m.text()) && p.errs.push(m.text()));
  p.on('pageerror', (e) => p.errs.push(String(e)));
  return p;
}
const open = async (p, hash = '') => { await p.goto(BASE + '/' + hash, { waitUntil: 'load' }); await p.waitForTimeout(500); };
const booking = (p) => p.locator('#booking');
const cont = (p) => booking(p).locator('.btn:has-text("Continue")');
const alertText = async (p) => (await booking(p).locator('[role=alert]').innerText()).trim();
const stepTitle = (p) => booking(p).locator('#step-title').innerText();

(async () => {
  const browser = await chromium.launch();

  /* ============ 1. RESPONSIVE: overflow, console, offenders, touch targets ============ */
  for (const [w, h] of [[320, 640], [360, 740], [375, 812], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]]) {
    const p = await newPage(browser, { width: w, height: h });
    await open(p);
    const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    ok(`@${w} no horizontal overflow`, m.sw <= m.cw, `${m.sw}>${m.cw}`);
    ok(`@${w} no console/page errors`, p.errs.length === 0, p.errs.join(' | '));
    const off = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth, out = [];
      for (const e of document.body.querySelectorAll('*')) {
        if (e instanceof SVGElement || e.closest('svg') || e.closest('[hidden]') || e.closest('noscript')) continue;
        const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = e.getBoundingClientRect(); if (r.width <= 1 || r.height <= 1) continue;
        if (r.right > vw + 1 || r.left < -1) {
          let a = e.parentElement, clipped = false;
          while (a && a !== document.body) { const o = getComputedStyle(a).overflowX; if (['auto', 'scroll', 'hidden', 'clip'].includes(o)) { const ar = a.getBoundingClientRect(); if (ar.right <= vw + 1 && ar.left >= -1) { clipped = true; break; } } a = a.parentElement; }
          if (!clipped) out.push(e.tagName + '.' + String(e.className).slice(0, 50) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
        }
      }
      return out.slice(0, 8);
    });
    ok(`@${w} no element pokes outside the viewport`, off.length === 0, off.join(' ; '));
    const small = await p.evaluate(() => {
      const bad = [], soft = [];
      for (const e of document.querySelectorAll('a[href],button,input:not(.sr-only),select,textarea,[role=tab]')) {
        if (e.closest('[hidden]') || e.closest('.sr-only') || e.classList.contains('sr-only') || e.closest('noscript')) continue;
        const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = e.getBoundingClientRect(); if (r.width === 0) continue;
        const inline = cs.display === 'inline' && e.closest('p,li,address,figcaption');
        if (inline) continue;
        const label = (e.getAttribute('aria-label') || e.textContent || e.id).trim().slice(0, 24);
        if (r.width < 24 || r.height < 24) bad.push(`${label} ${Math.round(r.width)}x${Math.round(r.height)}`);
        else if (r.width < 44 || r.height < 44) soft.push(`${label} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      return { bad, soft };
    });
    ok(`@${w} every control >=24x24 (WCAG 2.5.8 AA)`, small.bad.length === 0, small.bad.slice(0, 6).join(' ; '));
    if (w <= 430) info.push(`@${w}: ${small.soft.length} controls between 24 and 44px: ${[...new Set(small.soft)].slice(0, 8).join(', ')}`);
    ok(`@${w} no duplicate element ids`, await p.evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map((e) => e.id); return ids.length === new Set(ids).size; }));
    if (SHOTS && [320, 390, 1024, 1920].includes(w)) { await shot(p, `hero-${w}`); }
    await p.context().close();
  }

  /* ============ 2. NAVIGATION (desktop) ============ */
  {
    const p = await newPage(browser, { width: 1280, height: 900 });
    await open(p);
    const dead = await p.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].filter((a) => { const id = a.getAttribute('href').slice(1); return !id || !document.getElementById(id); }).map((a) => a.getAttribute('href')));
    ok('every in-page link targets an existing id (no dead anchors)', dead.length === 0, dead.join(','));
    const emptyBtns = await p.evaluate(() => [...document.querySelectorAll('button')].filter((b) => !(b.textContent || '').trim() && !b.getAttribute('aria-label')).length);
    ok('every button has an accessible name', emptyBtns === 0, String(emptyBtns));
    for (const id of ['home', 'about', 'venues', 'services', 'events', 'gallery', 'booking', 'contact']) {
      await p.click(`header nav ul a[href="#${id}"]`); await stable(p);
      const top = await topOf(p, id);
      ok(`nav -> #${id} lands under the 72px header`, id === 'home' ? top === 0 : Math.abs(top - 72) <= 3, `top=${top}`);
      const cur = await p.locator('header nav ul a[aria-current="true"]').getAttribute('href');
      ok(`nav highlights ${id} after navigating`, cur === `#${id}`, `highlighted ${cur}`);
      ok(`hash updated to #${id}`, (await p.evaluate(() => location.hash)) === `#${id}`);
    }
    for (const [sec, expect] of [['faq', '#booking'], ['location', '#contact'], ['why', '#about']]) {
      await p.evaluate((i) => document.getElementById(i).scrollIntoView({ behavior: 'instant', block: 'start' }), sec); await p.waitForTimeout(250);
      const cur = await p.locator('header nav ul a[aria-current="true"]').getAttribute('href');
      ok(`non-menu section #${sec} keeps "${expect}" highlighted`, cur === expect, `highlighted ${cur}`);
    }
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(300);
    ok('page bottom highlights Contact', (await p.locator('header nav ul a[aria-current="true"]').getAttribute('href')) === '#contact');
    // history
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200);
    await p.click('header nav ul a[href="#about"]'); await stable(p);
    await p.click('header nav ul a[href="#gallery"]'); await stable(p);
    await p.goBack(); await stable(p);
    ok('browser Back returns to #about', (await p.evaluate(() => location.hash)) === '#about' && Math.abs((await topOf(p, 'about')) - 72) <= 3, `hash=${await p.evaluate(() => location.hash)} top=${await topOf(p, 'about')}`);
    await p.goForward(); await stable(p);
    ok('browser Forward returns to #gallery', (await p.evaluate(() => location.hash)) === '#gallery' && Math.abs((await topOf(p, 'gallery')) - 72) <= 3);
    await p.goBack(); await p.goBack(); await stable(p);
    ok('Back to the start returns to the top', (await p.evaluate(() => Math.round(scrollY))) === 0, `y=${await p.evaluate(() => scrollY)}`);
    // deep link + reveal after jump
    { const f = await p.context().newPage(); await f.goto(BASE + '/#contact'); await f.waitForTimeout(400); ok('deep link: a FRESH load of /#contact lands on Contact immediately (no long animated scroll)', Math.abs((await topOf(f, 'contact')) - 72) <= 3, `top=${await topOf(f, 'contact')}`); await f.close(); }
    await p.goto(BASE + '/#contact'); await p.waitForTimeout(900);
    ok('same-document hash change scrolls there too', Math.abs((await topOf(p, 'contact')) - 72) <= 3, `top=${await topOf(p, 'contact')}`);
    const hiddenAbove = await p.evaluate(() => [...document.querySelectorAll('.reveal:not(.is-in)')].filter((e) => e.getBoundingClientRect().bottom < 0).length);
    ok('sections skipped by a hash jump are not stuck invisible', hiddenAbove === 0, String(hiddenAbove));
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
    ok('no JS errors during navigation', p.errs.length === 0, p.errs.join('|'));
    // skip link
    await open(p); await p.keyboard.press('Tab');
    ok('first Tab stop is the skip link', (await p.evaluate(() => document.activeElement.textContent)).includes('Skip'));
    await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    ok('skip link moves focus to <main>', await p.evaluate(() => document.activeElement.id) === 'main');
    await p.context().close();
  }

  /* ============ 3. MOBILE MENU ============ */
  {
    const p = await newPage(browser, { width: 375, height: 812 });
    await open(p);
    const tg = p.locator('button[aria-controls="mobile-menu"]');
    ok('hamburger visible, menu closed', (await tg.isVisible()) && (await tg.getAttribute('aria-expanded')) === 'false');
    await tg.click(); await p.waitForTimeout(250);
    ok('menu opens (aria-expanded=true)', (await tg.getAttribute('aria-expanded')) === 'true' && await p.locator('#mobile-menu').isVisible());
    ok('menu open locks page scroll', await p.evaluate(() => document.documentElement.classList.contains('scroll-locked') && getComputedStyle(document.body).overflow === 'hidden'));
    ok('focus moves into the menu', await p.evaluate(() => !!document.activeElement.closest('#mobile-menu')));
    if (SHOTS) await shot(p, 'mobile-menu');
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    ok('Escape closes the menu', !(await p.locator('#mobile-menu').isVisible()));
    ok('Escape returns focus to the hamburger', await p.evaluate(() => document.activeElement.getAttribute('aria-controls') === 'mobile-menu'));
    ok('scroll lock released after close', await p.evaluate(() => !document.documentElement.classList.contains('scroll-locked')));
    await tg.click(); await p.waitForTimeout(200);
    await p.click('#mobile-menu a[href="#gallery"]'); await stable(p);
    ok('choosing an item closes the menu', !(await p.locator('#mobile-menu').isVisible()));
    ok('...navigates to the section under the header', Math.abs((await topOf(p, 'gallery')) - 72) <= 3, `top=${await topOf(p, 'gallery')}`);
    ok('...and unlocks scrolling', await p.evaluate(() => !document.documentElement.classList.contains('scroll-locked')));
    await tg.click(); await p.waitForTimeout(200);
    await p.setViewportSize({ width: 1100, height: 800 }); await p.waitForTimeout(300);
    ok('resizing to desktop while open closes the menu and unlocks scroll', await p.evaluate(() => !document.documentElement.classList.contains('scroll-locked') && document.getElementById('mobile-menu').hidden));
    await p.context().close();
  }

  /* ============ 4. CALENDAR (mocked clock: 20 Dec 2026, Karachi) ============ */
  {
    const p = await newPage(browser, { width: 1280, height: 900 });
    await p.clock.install({ time: new Date('2026-12-20T10:00:00+05:00') });
    await open(p);
    await booking(p).scrollIntoViewIfNeeded();
    await booking(p).locator('label.choice:has-text("Walima")').click(); await cont(p).click(); await cont(p).click();
    ok('reached date step', (await stepTitle(p)).includes('Date'));
    const title = () => booking(p).locator('#cal-title').innerText();
    ok('calendar opens on the current month', (await title()) === 'December 2026', await title());
    ok('past days of the current month are disabled (19 of them)', (await booking(p).locator('[role=grid] button[disabled]').count()) === 19);
    ok('previous-month button disabled in the current month', await booking(p).locator('button[aria-label="Previous month"]').isDisabled());
    ok("today (20 Dec) is marked aria-current=date", (await booking(p).locator('button[data-iso="2026-12-20"]').getAttribute('aria-current')) === 'date');
    await booking(p).locator('button[aria-label="Next month"]').click();
    ok('Dec -> Jan rolls the year (January 2027)', (await title()) === 'January 2027');
    ok('previous enabled once past the current month', !(await booking(p).locator('button[aria-label="Previous month"]').isDisabled()));
    await booking(p).locator('button[aria-label="Previous month"]').click();
    ok('Jan -> Dec rolls back (December 2026)', (await title()) === 'December 2026');
    await booking(p).locator('button[aria-label="Next month"]').click(); // Jan 2027
    await booking(p).locator('button[aria-label="Next month"]').click();
    ok('Feb 2027 has 28 days and starts on Monday', (await title()) === 'February 2027' && (await booking(p).locator('[role=grid] button[data-iso]').count()) === 28 && (await booking(p).locator('button[data-iso="2027-02-01"]').getAttribute('aria-label')).startsWith('Monday'));
    for (let i = 0; i < 12; i++) await booking(p).locator('button[aria-label="Next month"]').click(); // -> Feb 2028
    ok('Feb 2028 (leap year) has 29 days and 29 Feb is a Tuesday', (await title()) === 'February 2028' && (await booking(p).locator('[role=grid] button[data-iso]').count()) === 29 && (await booking(p).locator('button[data-iso="2028-02-29"]').getAttribute('aria-label')).startsWith('Tuesday, 29 February 2028'));
    for (let i = 0; i < 13; i++) await booking(p).locator('button[aria-label="Previous month"]').click();
    await booking(p).locator('button[data-iso="2027-01-15"]').click();
    ok('selecting a date highlights it (aria-selected)', (await booking(p).locator('[role=gridcell][aria-selected="true"]').count()) === 1);
    ok('...and shows the formatted date', (await booking(p).innerText()).includes('Friday, 15 January 2027'));
    await booking(p).locator('button[aria-label="Next month"]').click(); await booking(p).locator('button[aria-label="Previous month"]').click();
    ok('selected date stays highlighted after browsing away and back', (await booking(p).locator('[role=gridcell][aria-selected="true"]').count()) === 1);
    // keyboard
    await booking(p).locator('button[data-iso="2027-01-15"]').focus();
    const focusedIso = () => p.evaluate(() => document.activeElement.dataset.iso);
    await p.keyboard.press('ArrowRight'); ok('ArrowRight -> next day', (await focusedIso()) === '2027-01-16');
    await p.keyboard.press('ArrowDown'); ok('ArrowDown -> +7 days', (await focusedIso()) === '2027-01-23');
    await p.keyboard.press('ArrowLeft'); ok('ArrowLeft -> previous day', (await focusedIso()) === '2027-01-22');
    await p.keyboard.press('ArrowUp'); ok('ArrowUp -> -7 days', (await focusedIso()) === '2027-01-15');
    await p.keyboard.press('Home'); ok('Home -> start of week (Sunday 10 Jan)', (await focusedIso()) === '2027-01-10');
    await p.keyboard.press('End'); ok('End -> end of week (Saturday 16 Jan)', (await focusedIso()) === '2027-01-16');
    await p.keyboard.press('PageDown'); await p.waitForTimeout(100);
    ok('PageDown -> next month, same day, view follows', (await focusedIso()) === '2027-02-16' && (await title()) === 'February 2027', `${await focusedIso()} ${await title()}`);
    await p.keyboard.press('Shift+PageUp'); await p.waitForTimeout(100);
    ok('Shift+PageUp -> a year back is clamped at today, never the past', (await focusedIso()) === '2026-12-20' && (await title()) === 'December 2026', `${await focusedIso()} ${await title()}`);
    await p.keyboard.press('ArrowLeft');
    ok('ArrowLeft at today does not enter the past', (await focusedIso()) === '2026-12-20');
    await p.keyboard.press('ArrowRight'); await p.keyboard.press('Enter');
    ok('Enter selects the focused day', (await booking(p).locator('[role=gridcell][aria-selected="true"] button').getAttribute('data-iso')) === '2026-12-21');
    const tabStops = await booking(p).locator('[role=grid] button[tabindex="0"]').count();
    ok('grid has a single roving tab stop', tabStops === 1, String(tabStops));
    ok('no console errors in calendar tests', p.errs.length === 0, p.errs.join('|'));
    await p.context().close();
  }

  /* ============ 5. BOOKING FLOW (desktop), validation, state, stale date ============ */
  {
    const p = await newPage(browser, { width: 1280, height: 900 }, { permissions: ['clipboard-read', 'clipboard-write'] });
    await p.clock.install({ time: new Date('2026-12-20T10:00:00+05:00') });
    await open(p);
    ok('"enquiry only" notice is visible on step 1', (await booking(p).innerText()).includes('Enquiry only'));
    ok('step indicator reads "Step 1 of 8"', (await booking(p).innerText()).toLowerCase().includes('step 1 of 8'));
    await cont(p).click();
    ok('step 1 requires an event type (alert)', (await alertText(p)).includes('event type'));
    await booking(p).locator('label.choice:has-text("Walima")').click();
    ok('error clears once the user fixes it', (await alertText(p)) === '');
    // radio keyboard semantics
    await booking(p).locator('input[name="event"]').first().focus(); await p.keyboard.press('ArrowDown');
    ok('event choices are real radios: arrow keys change selection', (await booking(p).locator('input[name="event"]:checked').getAttribute('value')) === 'Baraat');
    await booking(p).locator('label.choice:has-text("Walima")').click();
    await cont(p).click();
    ok('after Continue, focus moves to the new step heading', await p.evaluate(() => document.activeElement.id) === 'step-title');
    ok('venue step: single real venue pre-selected', (await booking(p).locator('input[name="venue"]:checked').count()) === 1);
    await cont(p).click();
    // step 3: date + guests
    await cont(p).click();
    ok('date is required', (await alertText(p)).includes('date'));
    ok('invalid date -> focus goes to the date field', await p.evaluate(() => document.activeElement.id) === 'event-date');
    await booking(p).locator('button[aria-label="Next month"]').click();
    await booking(p).locator('button[data-iso="2027-01-15"]').click();
    const g = booking(p).locator('#guests');
    ok('guests default shown as 100', (await g.inputValue()) === '100');
    await booking(p).locator('button[aria-label="Increase guests"]').click(); await booking(p).locator('button[aria-label="Increase guests"]').click();
    ok('guest + works (120)', (await g.inputValue()) === '120');
    await booking(p).locator('button[aria-label="Decrease guests"]').click();
    ok('guest - works (110)', (await g.inputValue()) === '110');
    for (const bad of ['5', '9', '1501', '99999', '0']) {
      await g.fill(bad); await cont(p).click();
      const msg = await alertText(p);
      ok(`guests "${bad}" is rejected, not silently fixed`, msg.includes('between 10 and 1500') && (await g.inputValue()) === bad && (await stepTitle(p)).includes('Date'), `msg="${msg}" value=${await g.inputValue()}`);
    }
    await g.fill(''); await cont(p).click();
    ok('empty guests -> "enter the number"', (await alertText(p)).includes('number of guests'));
    await g.fill('1a2b3'); ok('non-digits are stripped while typing', (await g.inputValue()) === '123');
    ok('invalid guests -> focus goes to guests field', (await (async () => { await g.fill('3'); await cont(p).click(); return p.evaluate(() => document.activeElement.id); })()) === 'guests');
    await g.fill('1500'); await booking(p).locator('button[aria-label="Increase guests"]').click();
    ok('+ at the maximum stays at 1500', (await g.inputValue()) === '1500');
    await g.fill('10'); await booking(p).locator('button[aria-label="Decrease guests"]').click();
    ok('- at the minimum stays at 10', (await g.inputValue()) === '10');
    await g.fill('250'); await cont(p).click();
    ok('valid date + guests continue to Services', (await stepTitle(p)).includes('Services'));
    // back/forward keep state
    await booking(p).locator('button:has-text("Back")').click();
    ok('Back keeps guests (250)', (await booking(p).locator('#guests').inputValue()) === '250');
    ok('Back keeps the date and shows its month', (await booking(p).locator('#cal-title').innerText()) === 'January 2027' && (await booking(p).locator('[role=gridcell][aria-selected="true"] button').getAttribute('data-iso')) === '2027-01-15');
    await cont(p).click();
    // services (checkboxes)
    await booking(p).locator('label.choice:has-text("Catering")').click(); await booking(p).locator('label.choice:has-text("Decoration")').click(); await booking(p).locator('label.choice:has-text("Stage Setup")').click();
    await booking(p).locator('label.choice:has-text("Decoration")').click(); // untoggle
    ok('services are multi-select checkboxes (2 selected)', (await booking(p).locator('input[name="services"]:checked').count()) === 2);
    await cont(p).click();
    await cont(p).click();
    ok('package is required', (await alertText(p)).includes('package'));
    await booking(p).locator('label.choice:has-text("Premium Celebration")').click(); await cont(p).click();
    ok('summary step reached', (await stepTitle(p)).includes('Check'));
    const sum = await booking(p).locator('dl').innerText();
    for (const s of ['Walima', 'Gulshan Banquet Hall', 'Friday, 15 January 2027', '250', 'Catering, Stage Setup', 'Premium Celebration', 'Shared by management']) ok(`summary shows "${s}"`, sum.includes(s), sum);
    ok('summary does not show an invented price', !/Rs|PKR|\d{2,3},\d{3}/.test(sum));
    // change from summary
    await booking(p).locator('dl button:has-text("Change")').nth(0).click();
    ok('"Change Event" jumps to step 1', (await stepTitle(p)).includes('celebrating'));
    await booking(p).locator('label.choice:has-text("Nikkah")').click();
    for (let i = 0; i < 5; i++) await cont(p).click();
    ok('...and the edited choice appears in the summary', (await booking(p).locator('dl').innerText()).includes('Nikkah') && !(await booking(p).locator('dl').innerText()).includes('Walima'));
    await cont(p).click();
    ok('details step reached', (await stepTitle(p)).includes('details'));
    await booking(p).locator('.btn:has-text("Prepare enquiry")').click();
    ok('empty name -> error + focus on name', (await alertText(p)).includes('name') && (await p.evaluate(() => document.activeElement.id)) === 'b-name');
    ok('invalid field is flagged aria-invalid', (await booking(p).locator('#b-name').getAttribute('aria-invalid')) === 'true');
    await booking(p).locator('#b-name').fill('Ali Raza'); await booking(p).locator('#b-phone').fill('12345');
    await booking(p).locator('.btn:has-text("Prepare enquiry")').click();
    ok('bad phone -> error + focus on phone', (await alertText(p)).includes('valid Pakistani number') && (await p.evaluate(() => document.activeElement.id)) === 'b-phone');
    await booking(p).locator('#b-phone').fill('0300-1234567'); await booking(p).locator('#b-notes').fill('Need stage with roses');
    // stale date: clock moves past the chosen date before the enquiry is prepared
    await p.clock.setSystemTime(new Date('2027-01-16T09:00:00+05:00'));
    await booking(p).locator('.btn:has-text("Prepare enquiry")').click();
    ok('a date that became past is caught at the final step', (await stepTitle(p)).includes('Date') && (await alertText(p)).includes('already passed'), `${await stepTitle(p)} / ${await alertText(p)}`);
    ok('...and the enquiry was NOT prepared', (await booking(p).locator('pre').count()) === 0);
    await p.clock.setSystemTime(new Date('2026-12-20T10:00:00+05:00'));
    ok('state survived the bounce (guests still 250)', (await booking(p).locator('#guests').inputValue()) === '250');
    await cont(p).click();
    for (let i = 0; i < 3; i++) await cont(p).click();
    ok('back on the details step with name kept', (await booking(p).locator('#b-name').inputValue()) === 'Ali Raza');
    // Enter key submits; double activation does not duplicate
    await booking(p).locator('#b-phone').press('Enter');
    ok('Enter in a field prepares the enquiry', (await stepTitle(p)).includes('Send'));
    ok('exactly one message preview', (await booking(p).locator('pre').count()) === 1);
    const msg = await booking(p).locator('pre').innerText();
    for (const s of ['Name: Ali Raza', 'Phone: 0300 1234567', 'Event type: Nikkah', 'Friday, 15 January 2027', 'Guests: 250', 'Services: Catering, Stage Setup', 'Package: Premium Celebration', 'Notes: Need stage with roses']) ok(`final message has "${s}"`, msg.includes(s), msg);
    ok('final step says it is NOT a confirmed booking', (await booking(p).innerText()).includes('not a confirmed booking'));
    ok('no wa.me link while WhatsApp number is unverified', (await p.locator('a[href*="wa.me"]').count()) === 0);
    ok('Call link = tel:+92526501632 and shows 052 6501632', (await booking(p).locator('a[href^="tel:"]').getAttribute('href')) === 'tel:+92526501632' && (await booking(p).locator('a[href^="tel:"]').innerText()).includes('052 6501632'));
    // clipboard success
    await booking(p).locator('button:has-text("Copy enquiry")').click(); await p.waitForTimeout(200);
    ok('copy success is announced only when it worked', (await booking(p).locator('[role=status]').innerText()).includes('copied'));
    ok('clipboard really contains the message', (await p.evaluate(() => navigator.clipboard.readText())) === msg);
    // edit after prepare
    await booking(p).locator('.btn:has-text("Edit details")').click();
    await booking(p).locator('#b-name').fill('Sara Khan'); await booking(p).locator('.btn:has-text("Prepare enquiry")').click();
    ok('re-preparing after an edit updates the message', (await booking(p).locator('pre').innerText()).includes('Name: Sara Khan'));
    await booking(p).locator('button:has-text("Start a new enquiry")').click(); await p.waitForTimeout(200);
    ok('"Start a new enquiry" resets to step 1 with nothing selected', (await stepTitle(p)).includes('celebrating') && (await booking(p).locator('input:checked').count()) === 0);
    await cont(p).click(); // error
    await booking(p).locator('label.choice:has-text("Mehndi")').click(); await cont(p).click(); await cont(p).click();
    ok('after reset the calendar is back on the current month with no date', (await booking(p).locator('#cal-title').innerText()) === 'December 2026' && (await booking(p).locator('[role=gridcell][aria-selected="true"]').count()) === 0);
    ok('no console errors in booking flow', p.errs.length === 0, p.errs.join('|'));
    await p.context().close();
  }

  /* ============ 6. DUPLICATE SUBMIT + BOOKING AT 320 / 390 ============ */
  for (const [w, h] of [[320, 640], [390, 844]]) {
    const p = await newPage(browser, { width: w, height: h });
    await p.clock.install({ time: new Date('2026-12-20T10:00:00+05:00') });
    await open(p);
    await booking(p).scrollIntoViewIfNeeded();
    await booking(p).locator('label.choice:has-text("Birthday")').click(); await cont(p).click(); await cont(p).click();
    await booking(p).locator('button[aria-label="Next month"]').click();
    await booking(p).locator('button[data-iso="2027-01-08"]').click();
    const cal = await p.evaluate(() => {
      const btns = [...document.querySelectorAll('#booking [role=grid] [role=row]')].map((r) => [...r.querySelectorAll('button')].map((b) => b.getBoundingClientRect()));
      let overlap = 0, minW = 999; for (const row of btns) for (let i = 0; i < row.length; i++) { minW = Math.min(minW, row[i].width); if (i && row[i].left < row[i - 1].right - 0.5) overlap++; }
      const card = document.querySelector('#booking .light-zone').getBoundingClientRect(), grid = document.querySelector('#booking [role=grid]').getBoundingClientRect();
      return { overlap, minW: Math.round(minW), cardOk: card.left >= 0 && card.right <= innerWidth, gridOk: grid.left >= card.left - 1 && grid.right <= card.right + 1 };
    });
    ok(`@${w} calendar day buttons never overlap`, cal.overlap === 0, JSON.stringify(cal));
    ok(`@${w} calendar fits inside its card/viewport (min cell ${cal.minW}px)`, cal.cardOk && cal.gridOk, JSON.stringify(cal));
    await booking(p).locator('#guests').fill('150'); await cont(p).click();
    for (let i = 0; i < 3; i++) await cont(p).click(); // services, package(needs pick)
    await booking(p).locator('label.choice:has(input[value^="Custom Package"])').click(); await cont(p).click(); await cont(p).click();
    await booking(p).locator('#b-name').fill('Test User'); await booking(p).locator('#b-phone').fill('052 6501632');
    await booking(p).locator('.btn:has-text("Prepare enquiry")').dblclick();
    ok(`@${w} double-clicking Prepare gives one clean final step`, (await stepTitle(p)).includes('Send') && (await booking(p).locator('pre').count()) === 1 && (await alertText(p)) === '', await stepTitle(p));
    const fit = await p.evaluate(() => [...document.querySelectorAll('#booking .btn, #booking button')].filter((b) => b.getBoundingClientRect().right > innerWidth || b.getBoundingClientRect().left < 0).length);
    ok(`@${w} no booking button exceeds the screen`, fit === 0, String(fit));
    if (SHOTS) { await booking(p).scrollIntoViewIfNeeded(); await shot(p, `booking-final-${w}`); }
    ok(`@${w} no console errors`, p.errs.length === 0, p.errs.join('|'));
    await p.context().close();
  }

  /* ============ 7. CLIPBOARD FAILURE / FALLBACK ============ */
  {
    const prep = async (p) => { await p.clock.install({ time: new Date('2026-12-20T10:00:00+05:00') }); await open(p); await booking(p).scrollIntoViewIfNeeded(); await booking(p).locator('label.choice:has-text("Mehndi")').click(); await cont(p).click(); await cont(p).click(); await booking(p).locator('button[aria-label="Next month"]').click(); await booking(p).locator('button[data-iso="2027-01-08"]').click(); await cont(p).click(); await cont(p).click(); await booking(p).locator('label.choice:has(input[value^="Custom Package"])').click(); await cont(p).click(); await cont(p).click(); await booking(p).locator('#b-name').fill('Test User'); await booking(p).locator('#b-phone').fill('03001234567'); await booking(p).locator('.btn:has-text("Prepare enquiry")').click(); };
    let p = await newPage(browser, { width: 1000, height: 800 });
    await p.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } }); document.execCommand = () => false; });
    await prep(p);
    await booking(p).locator('button:has-text("Copy enquiry")').click(); await p.waitForTimeout(300);
    const al = await booking(p).locator('[role=alert]:has-text("copy")').innerText();
    ok('copy failure shows an explicit error', al.includes('blocked copying') || al.includes('nothing was copied'), al);
    ok('...never claims success', !(await booking(p).innerText()).includes('copied to your clipboard') && !(await booking(p).locator('button:has-text("Copied")').count()));
    ok('...and offers the text in a focused, selectable textarea', (await booking(p).locator('#copy-fallback').inputValue()).includes('Test User') && (await p.evaluate(() => document.activeElement.id)) === 'copy-fallback');
    await p.context().close();
    p = await newPage(browser, { width: 1000, height: 800 });
    await p.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: undefined }); window.__copied = null; document.execCommand = (c) => { if (c === 'copy') { window.__copied = document.getSelection().toString() || document.activeElement.value; return true; } return false; }; });
    await prep(p);
    await booking(p).locator('button:has-text("Copy enquiry")').click(); await p.waitForTimeout(300);
    ok('legacy execCommand fallback works and reports success', (await booking(p).locator('[role=status]').innerText()).includes('copied') && (await p.evaluate(() => window.__copied || '')).includes('Test User'));
    await p.context().close();
  }

  /* ============ 8. CONTACT FORM, CALL/WHATSAPP, MOBILE CTA ============ */
  {
    const p = await newPage(browser, { width: 390, height: 844 });
    await open(p);
    const wa = await p.locator('a[href*="wa.me"], a[href*="whatsapp"]').count();
    ok('no WhatsApp links anywhere while the number is unverified', wa === 0);
    const tels = await p.evaluate(() => [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href')));
    ok(`all ${tels.length} call links use the same number`, tels.length >= 4 && tels.every((t) => t === 'tel:+92526501632'), tels.join(','));
    const shown = await p.evaluate(() => [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.textContent.replace(/\D/g, '')).filter((x) => x.length > 3));
    ok('visible numbers match the tel: href', shown.every((s) => s.endsWith('6501632')), shown.join(','));
    // mobile CTA
    const cta = p.locator('.mobile-cta');
    ok('mobile CTA is visible at the top', (await cta.getAttribute('data-hidden')) === 'false' && await cta.isVisible());
    ok('mobile CTA bar has safe-area bottom padding', (await cta.evaluate((e) => e.style.paddingBottom)).includes('safe-area-inset-bottom'));
    await p.evaluate(() => document.getElementById('gallery').scrollIntoView({ behavior: 'instant' })); await p.waitForTimeout(400);
    ok('mobile CTA stays visible over content sections', (await cta.getAttribute('data-hidden')) === 'false');
    await cta.locator('button:has-text("Enquire")').click(); await stable(p);
    ok('Enquire button scrolls to the booking section', Math.abs((await topOf(p, 'booking')) - 72) <= 3, `top=${await topOf(p, 'booking')}`);
    await p.waitForTimeout(300);
    ok('mobile CTA hides itself over the booking form (never covers it)', (await cta.getAttribute('data-hidden')) === 'true' && (await cta.getAttribute('aria-hidden')) === 'true');
    ok('...and its links are not focusable while hidden', await cta.evaluate((e) => e.hasAttribute('inert') && getComputedStyle(e).visibility === 'hidden'));
    await p.evaluate(() => document.getElementById('faq').scrollIntoView({ behavior: 'instant' })); await p.waitForTimeout(400);
    ok('...and returns after leaving the form', (await cta.getAttribute('data-hidden')) === 'false');
    // contact form
    await p.evaluate(() => document.getElementById('contact').scrollIntoView({ behavior: 'instant' })); await p.waitForTimeout(300);
    await p.locator('#contact button:has-text("Prepare message")').click();
    ok('contact: 3 field errors shown, focus on first invalid', (await p.locator('#contact .err').count()) === 3 && (await p.evaluate(() => document.activeElement.id)) === 'c-name');
    await p.fill('#c-name', 'Sara'); await p.fill('#c-phone', '123'); await p.fill('#c-msg', 'Is 5 March free?');
    await p.locator('#contact button:has-text("Prepare message")').click();
    ok('contact: bad phone rejected; typed values are kept', (await p.locator('#c-phone').getAttribute('aria-invalid')) === 'true' && (await p.inputValue('#c-name')) === 'Sara' && (await p.inputValue('#c-msg')) === 'Is 5 March free?');
    await p.fill('#c-phone', '+92 300 1234567'); await p.locator('#contact button:has-text("Prepare message")').click();
    ok('contact: valid form reveals send options with an honest "not sent yet"', (await p.locator('#contact [role=status]:has-text("not been sent")').innerText()).includes('not been sent yet'));
    await p.fill('#c-msg', 'Is 6 March free?');
    ok('contact: editing hides stale send options (no stale message)', (await p.locator('#contact a[href^="tel:"]').count()) === 1); // only the heading phone link remains
    ok('...and the other fields were not lost', (await p.inputValue('#c-name')) === 'Sara' && (await p.inputValue('#c-phone')) === '+92 300 1234567');
    await p.locator('#contact button:has-text("Prepare message")').click();
    await p.locator('#contact button:has-text("Copy enquiry")').click(); await p.waitForTimeout(200);
    // location
    const dir = await p.locator('a:has-text("Get Directions")').getAttribute('href');
    ok('Get Directions uses the configured address', dir.includes('maps/dir') && dir.includes(encodeURIComponent('Sambrial Road, Bopalwala, Sialkot')), dir);
    const map = await p.locator('iframe').getAttribute('src');
    ok('map embed uses the configured address', map.includes(encodeURIComponent('Sambrial Road, Bopalwala, Sialkot')), map);
    ok('approximate map is clearly labelled as approximate', (await p.locator('#location').innerText()).includes('may be approximate'));
    p.errs.length && ok('no console errors', false, p.errs.join('|'));
    await p.context().close();
    const d = await newPage(browser, { width: 1024, height: 768 });
    await open(d);
    ok('mobile CTA is not rendered at >=640px', (await d.locator('.mobile-cta').evaluate((e) => getComputedStyle(e).display)) === 'none');
    await d.context().close();
  }

  /* ============ 9. GALLERY + LIGHTBOX ============ */
  {
    const p = await newPage(browser, { width: 1280, height: 900 });
    await open(p);
    await p.evaluate(() => document.getElementById('gallery').scrollIntoView({ behavior: 'instant' }));
    const counts = { All: 9, 'Hall Interiors': 2, 'Wedding Stages': 2, Decorations: 2, 'Dining Arrangements': 1, 'Outdoor Spaces': 1, 'Special Events': 1 };
    for (const [c, n] of Object.entries(counts)) {
      await p.locator(`#gallery button[aria-pressed]:text-is("${c}")`).click(); await p.waitForTimeout(150);
      const got = await p.locator('.gal-item').count();
      const cats = await p.evaluate(() => [...document.querySelectorAll('.gal-item')].length);
      ok(`filter "${c}" shows ${n}`, got === n && cats === n, String(got));
      ok(`filter "${c}" marks exactly one button pressed and announces the count`, (await p.locator('#gallery button[aria-pressed="true"]').count()) === 1 && (await p.locator('#gallery [role=status]').innerText()).includes(`Showing ${n}`));
    }
    await p.locator('#gallery button[aria-pressed]:text-is("Hall Interiors")').click(); await p.waitForTimeout(200);
    const thumb = p.locator('.gal-item').first();
    const thumbLabel = await thumb.getAttribute('aria-label');
    await thumb.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
    const dlg = p.locator('[role=dialog]');
    ok('Enter on a thumbnail opens the lightbox', await dlg.count() === 1 && (await dlg.getAttribute('aria-modal')) === 'true');
    ok('focus moves to Close', (await p.evaluate(() => document.activeElement.getAttribute('aria-label'))) === 'Close image viewer');
    ok('lightbox is labelled by its caption', (await dlg.getAttribute('aria-labelledby')) === 'lb-caption' && (await p.locator('#lb-caption').innerText()).includes('Hall Interiors'));
    ok('page scroll is locked', await p.evaluate(() => document.documentElement.classList.contains('scroll-locked')));
    const y0 = await p.evaluate(() => scrollY); await p.mouse.wheel(0, 900); await p.waitForTimeout(250);
    ok('mouse wheel cannot scroll the page behind the modal', (await p.evaluate(() => scrollY)) === y0);
    ok('first of two images: "1 / 2"', (await p.locator('#lb-caption + span, figcaption span').last().innerText()).includes('1 / 2'));
    await p.keyboard.press('ArrowRight'); ok('ArrowRight -> 2 / 2', (await p.locator('figcaption').innerText()).includes('2 / 2'));
    await p.keyboard.press('ArrowRight'); ok('next wraps to 1 / 2 (works after filtering)', (await p.locator('figcaption').innerText()).includes('1 / 2'));
    await p.keyboard.press('ArrowLeft'); ok('previous wraps to 2 / 2', (await p.locator('figcaption').innerText()).includes('2 / 2'));
    let escaped = 0;
    for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); if (!(await p.evaluate(() => !!document.activeElement.closest('[role=dialog]')))) escaped++; }
    for (let i = 0; i < 6; i++) { await p.keyboard.press('Shift+Tab'); if (!(await p.evaluate(() => !!document.activeElement.closest('[role=dialog]')))) escaped++; }
    ok('focus never leaves the open modal (18 Tab / Shift+Tab presses)', escaped === 0, `${escaped} escapes`);
    // swipe
    await dlg.evaluate((el) => { const mk = (x) => new Touch({ identifier: 1, target: el, clientX: x, clientY: 200 }); el.dispatchEvent(new TouchEvent('touchstart', { touches: [mk(300)], bubbles: true })); el.dispatchEvent(new TouchEvent('touchend', { changedTouches: [mk(100)], bubbles: true })); });
    ok('swiping left goes to the next image', (await p.locator('figcaption').innerText()).includes('1 / 2'));
    await p.keyboard.press('Escape'); await p.waitForTimeout(250);
    ok('Escape closes the lightbox', await dlg.count() === 0);
    ok('focus returns to the exact thumbnail that opened it', (await p.evaluate(() => document.activeElement.getAttribute('aria-label'))) === thumbLabel && await p.evaluate(() => document.activeElement.classList.contains('gal-item')), await p.evaluate(() => document.activeElement.outerHTML.slice(0, 80)));
    ok('page scroll unlocked after close', await p.evaluate(() => !document.documentElement.classList.contains('scroll-locked')));
    await p.locator('.gal-item').nth(1).click(); await p.waitForTimeout(200);
    await p.mouse.click(10, 10); await p.waitForTimeout(250);
    ok('clicking the backdrop closes it too', await dlg.count() === 0);
    ok('every thumbnail has a meaningful accessible name', await p.evaluate(() => [...document.querySelectorAll('.gal-item')].every((b) => (b.getAttribute('aria-label') || '').length > 15)));
    ok('no console errors in gallery', p.errs.length === 0, p.errs.join('|'));
    await p.context().close();
    for (const [w, h] of [[320, 568], [375, 667], [390, 844]]) {
      const m = await newPage(browser, { width: w, height: h }); await open(m);
      await m.evaluate(() => document.getElementById('gallery').scrollIntoView({ behavior: 'instant' })); await m.waitForTimeout(300);
      await m.locator('.gal-item').first().click(); await m.waitForTimeout(300);
      const r = await m.evaluate(() => { const f = document.querySelector('figure').getBoundingClientRect(), vh = innerHeight, vw = innerWidth; const btns = [...document.querySelectorAll('[role=dialog] button')].map((b) => b.getBoundingClientRect()); const cap = document.querySelector('figcaption').getBoundingClientRect(); return { fits: f.left >= 0 && f.right <= vw && f.top >= 0 && cap.bottom <= vh, btnsIn: btns.every((b) => b.left >= 0 && b.right <= vw && b.top >= 0 && b.bottom <= vh), h: Math.round(f.height + cap.height), vh }; });
      ok(`@${w}x${h} lightbox image + caption fit on screen`, r.fits, JSON.stringify(r));
      ok(`@${w}x${h} lightbox controls are on screen`, r.btnsIn);
      if (SHOTS && w === 320) await shot(m, 'lightbox-320');
      await m.context().close();
    }
  }

  /* ============ 10. MENU + LIGHTBOX SCROLL-LOCK COUNTER ============ */
  {
    const p = await newPage(browser, { width: 375, height: 812 }); await open(p);
    await p.evaluate(() => document.getElementById('gallery').scrollIntoView({ behavior: 'instant' })); await p.waitForTimeout(200);
    await p.locator('.gal-item').first().click(); await p.waitForTimeout(200);
    ok('lock is held while the lightbox is open', await p.evaluate(() => document.documentElement.classList.contains('scroll-locked')));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    ok('and released after (no stuck lock)', await p.evaluate(() => !document.documentElement.classList.contains('scroll-locked')));
    await p.context().close();
  }

  /* ============ 11. ACCESSIBILITY: focus rings, contrast, reduced motion, structure ============ */
  {
    const p = await newPage(browser, { width: 1280, height: 900 }, { reducedMotion: 'reduce' });
    await open(p);
    ok('reduced motion: every .reveal is visible immediately', await p.evaluate(() => [...document.querySelectorAll('.reveal')].every((e) => e.classList.contains('is-in'))));
    ok('reduced motion: smooth scrolling is off', (await p.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)) === 'auto');
    ok('reduced motion: animations are effectively instant', await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.hero-in')).animationDuration) < 0.01));
    const struct = await p.evaluate(() => ({ h1: document.querySelectorAll('h1').length, lang: document.documentElement.lang, main: document.querySelectorAll('main').length, navs: [...document.querySelectorAll('nav')].map((n) => n.getAttribute('aria-label')), levels: [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]) }));
    let jumps = 0; for (let i = 1; i < struct.levels.length; i++) if (struct.levels[i] - struct.levels[i - 1] > 1) jumps++;
    ok('exactly one <h1>, lang=en, one <main>, labelled navs', struct.h1 === 1 && struct.lang === 'en' && struct.main === 1 && struct.navs.every(Boolean), JSON.stringify(struct));
    ok('heading levels never skip downward (h1>h2>h3)', jumps === 0, struct.levels.join(''));
    ok('all form controls have labels', await p.evaluate(() => [...document.querySelectorAll('input:not([type=hidden]),textarea,select')].every((i) => i.labels?.length || i.getAttribute('aria-label'))));
    // focus ring colours: gold on dark zones, plum on light zones
    await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(400); // skip link -> logo (let the outline transition settle)
    const ring = () => p.evaluate(() => { const c = getComputedStyle(document.activeElement); return `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`; });
    ok('focus ring on dark header is gold', /solid 2px rgb\(197, 164, 109\)/.test(await ring()), await ring());
    await p.evaluate(() => document.querySelector('#faq button').focus({ focusVisible: true }));
    ok('focus ring in light FAQ section is plum', /rgb\(48, 33, 42\)/.test(await ring()), await ring());
    await p.evaluate(() => document.getElementById('booking').scrollIntoView({ behavior: 'instant' }));
    await p.locator('#booking input[name="event"]').first().focus(); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
    const faceRing = await p.evaluate(() => { const f = document.activeElement.nextElementSibling; const c = getComputedStyle(f); return `${c.outlineStyle} ${c.outlineColor}`; });
    ok('keyboard focus on a booking choice draws a visible plum ring on its card', /solid rgb\(48, 33, 42\)/.test(faceRing), faceRing);
    // contrast
    await p.evaluate(() => scrollTo(0, 400)); await p.waitForTimeout(700); // header is solid plum once scrolled (over the hero it is transparent)
    const bad = await p.evaluate(() => {
      const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); cv.canvas.width = cv.canvas.height = 1;
      const rgba = (c) => { cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
      const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
      const out = [];
      for (const el of document.querySelectorAll('body *')) {
        if (el.closest('svg,noscript,#home,.sr-only,[hidden]') || el.classList.contains('sr-only')) continue;
        const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim(); if (!text) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || el.disabled) continue;
        const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
        let opacity = 1, skip = false, bg = null, a = el; const layers = [];
        while (a) { const s = getComputedStyle(a); opacity *= parseFloat(s.opacity); if (s.backgroundImage !== 'none') { skip = true; break; } const c = rgba(s.backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } a = a.parentElement; }
        if (skip || opacity < 0.5 || el.closest('[class*="bg-gradient"],.gal-item')) continue;
        bg = [255, 255, 255]; for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
        const fgc = rgba(cs.color); const fg = over([fgc[0], fgc[1], fgc[2], fgc[3] * opacity], bg);
        const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700, large = px >= 24 || (px >= 18.66 && bold);
        if (ratio < (large ? 3 : 4.5)) out.push(`${ratio.toFixed(2)} "${text.slice(0, 28)}" <${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}>`);
      }
      return out;
    });
    ok('text contrast meets WCAG AA (4.5:1, 3:1 large) on every solid-background text element', bad.length === 0, bad.slice(0, 40).join(' ; '));
    info.push(`contrast checker skipped text over images/gradients (hero, event cards, gallery overlays): reviewed visually instead.`);
    await p.context().close();
  }

  /* ============ 12. VISUAL SNAPSHOTS ============ */
  if (SHOTS) {
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      const p = await newPage(browser, { width: w, height: h }, { reducedMotion: 'reduce' }); await open(p);
      await p.screenshot({ path: `${SHOTS}/full-${w}.png`, fullPage: true }); await p.context().close();
    }
  }

  await browser.close();
  const fails = results.filter((r) => r[0] === 'FAIL');
  for (const r of results) console.log(r[0] === 'PASS' ? `PASS  ${r[1]}` : `FAIL  ${r[1]}\n        -> ${r[2]}`);
  console.log('\nINFO:\n  ' + info.join('\n  '));
  console.log(`\n${results.length - fails.length}/${results.length} checks passed, ${fails.length} failed`);
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('SUITE CRASHED', e); process.exit(2); });
