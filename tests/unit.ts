import assert from 'node:assert/strict';
import { addDays, addMonths, daysInMonth, formatDate, isPast, monthWeeks, parseISO, shiftMonths, toISO, weekdayOf } from '../src/lib/calendar';
import { normalizePkPhone, isValidPhone } from '../src/lib/phone';
import { CUSTOM_PACKAGE, buildEnquiryMessage, validateDate, validateGuests, validateName, validatePhone, whatsappLink, directionsUrl, mapsEmbedUrl } from '../src/lib/enquiry';
import { telHref, phoneDisplay, whatsappNumber } from '../src/lib/contact';
import { business } from '../src/data/business';
import { buildJsonLd, renderHead, seo } from '../src/data/seo';

let n = 0;
const t = (name: string, fn: () => void) => { fn(); n++; console.log('  ok  ' + name); };

// ---------- calendar ----------
t('days in month incl. leap years', () => {
  assert.equal(daysInMonth(2024, 1), 29); assert.equal(daysInMonth(2026, 1), 28); assert.equal(daysInMonth(2028, 1), 29);
  assert.equal(daysInMonth(1900, 1), 28); assert.equal(daysInMonth(2000, 1), 29); assert.equal(daysInMonth(2026, 3), 30); assert.equal(daysInMonth(2026, 11), 31);
});
t('parseISO rejects impossible dates', () => {
  for (const bad of ['2026-02-29', '2026-02-30', '2026-13-01', '2026-00-10', '2026-1-1', '', 'abc', '2026-04-31']) assert.equal(parseISO(bad), null, bad);
  assert.deepEqual(parseISO('2028-02-29'), { y: 2028, m: 1, d: 29 });
});
t('month grids start on the right weekday (Feb 2026=Sun, Feb 2028=Tue, Aug 2026=Sat, Nov 2026=Sun)', () => {
  const firstIdx = (y: number, m: number) => monthWeeks(y, m)[0].findIndex((c) => c === 1);
  assert.equal(firstIdx(2026, 1), 0); assert.equal(firstIdx(2028, 1), 2); assert.equal(firstIdx(2026, 7), 6); assert.equal(firstIdx(2026, 10), 0);
  assert.equal(weekdayOf(2026, 10, 20), 5); // Fri 20 Nov 2026
});
t('Feb grids have exactly the right day count and row padding', () => {
  const flat = (y: number, m: number) => monthWeeks(y, m).flat();
  assert.equal(flat(2026, 1).filter(Boolean).length, 28); assert.equal(flat(2028, 1).filter(Boolean).length, 29);
  assert.equal(monthWeeks(2026, 1).length, 4); // Feb 2026 fits exactly 4 weeks
  for (const [y, m] of [[2026, 0], [2026, 1], [2028, 1], [2026, 7]]) for (const w of monthWeeks(y, m)) assert.equal(w.length, 7);
});
t('month arithmetic crosses year boundaries both ways', () => {
  assert.deepEqual(addMonths(2026, 11, 1), { y: 2027, m: 0 }); assert.deepEqual(addMonths(2027, 0, -1), { y: 2026, m: 11 });
  assert.deepEqual(addMonths(2026, 5, 18), { y: 2027, m: 11 }); assert.deepEqual(addMonths(2026, 0, -13), { y: 2024, m: 11 });
});
t('shiftMonths clamps to month length (31 Jan -> 28/29 Feb; 29 Feb -> 28 Feb next year)', () => {
  assert.equal(shiftMonths('2026-01-31', 1), '2026-02-28'); assert.equal(shiftMonths('2028-01-31', 1), '2028-02-29');
  assert.equal(shiftMonths('2028-02-29', 12), '2029-02-28'); assert.equal(shiftMonths('2026-12-15', 1), '2027-01-15');
});
t('addDays crosses month/year/leap boundaries', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01'); assert.equal(addDays('2028-02-28', 1), '2028-02-29'); assert.equal(addDays('2026-02-28', 1), '2026-03-01'); assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});
t('isPast / validateDate', () => {
  assert.equal(isPast('2026-11-19', '2026-11-20'), true); assert.equal(isPast('2026-11-20', '2026-11-20'), false);
  assert.equal(validateDate('', '2026-11-20').ok, false); assert.equal(validateDate('2026-02-30', '2026-11-20').ok, false);
  assert.equal(validateDate('2026-11-19', '2026-11-20').ok, false); assert.equal(validateDate('2026-11-20', '2026-11-20').ok, true); assert.equal(validateDate('2027-01-01', '2026-11-20').ok, true);
});
t('formatDate / toISO never shift (checked under extreme timezones)', () => {
  assert.equal(formatDate('2026-03-01'), 'Sunday, 1 March 2026'); assert.equal(formatDate('2028-02-29'), 'Tuesday, 29 February 2028'); assert.equal(formatDate(''), 'Not selected'); assert.equal(toISO(2026, 0, 5), '2026-01-05');
});

// ---------- phone ----------
t('Pakistani phone formats normalise', () => {
  const ok: [string, string, string][] = [
    ['052 6501632', '+92526501632', '052 6501632'], ['0526501632', '+92526501632', '052 6501632'], ['+92 52 6501632', '+92526501632', '052 6501632'],
    ['0300 1234567', '+923001234567', '0300 1234567'], ['0300-1234567', '+923001234567', '0300 1234567'], ['03001234567', '+923001234567', '0300 1234567'],
    ['+92 300 1234567', '+923001234567', '0300 1234567'], ['+923001234567', '+923001234567', '0300 1234567'], ['0092 300 1234567', '+923001234567', '0300 1234567'],
    ['923001234567', '+923001234567', '0300 1234567'], ['3001234567', '+923001234567', '0300 1234567'], ['(0321) 123-4567', '+923211234567', '0321 1234567'],
    ['042 35761234', '+924235761234', '042 35761234'], ['0546 123456', '+92546123456', '0546 123456'], ['021 34567890', '+922134567890', '021 34567890'],
  ];
  for (const [raw, e164, display] of ok) { const p = normalizePkPhone(raw); assert.ok(p, raw); assert.equal(p!.e164, e164, raw); assert.equal(p!.display, display, raw); }
});
t('invalid phones are rejected', () => {
  for (const bad of ['', '123', 'abc', '0300123456', '030012345678', '+1 415 555 2671', '0000000000', '00300 1234567', '0300 12345 67a', '+92 300', '1234567890123456']) assert.equal(isValidPhone(bad), false, bad);
});

// ---------- validators ----------
t('guest validation is strict and never clamps', () => {
  const { min, max } = business.guestLimits;
  for (const bad of ['', '  ', '0', '5', String(min - 1), String(max + 1), '99999', 'abc', '12.5', '-20', '1e3']) assert.equal(validateGuests(bad).ok, false, `"${bad}"`);
  for (const good of [String(min), '100', ' 250 ', String(max)]) assert.equal(validateGuests(good).ok, true, good);
});
t('name/phone validators', () => {
  assert.equal(validateName(' A ').ok, false); assert.equal(validateName('Al').ok, true); assert.equal(validatePhone('12').ok, false); assert.equal(validatePhone('0300 1234567').ok, true);
});

// ---------- contact data consistency ----------
t('tel link is derived from the displayed number', () => {
  assert.equal(phoneDisplay, '052 6501632'); assert.equal(telHref, 'tel:+92526501632');
});
t('WhatsApp stays disabled while no verified number exists', () => {
  assert.equal(business.whatsappNumber, null); assert.equal(whatsappNumber, null); assert.equal(whatsappLink('hello'), null);
});
t('enquiry message carries every selection + never invents info', () => {
  const m = buildEnquiryMessage({ eventType: 'Walima', venue: 'Gulshan Banquet Hall', date: '2026-12-15', guests: 220, services: ['Catering', 'Decoration'], packageName: '', name: '  Ali   Raza ', phone: '0300-1234567', notes: ' roses ' });
  for (const s of ['Name: Ali Raza', 'Phone: 0300 1234567', 'Event type: Walima', 'Tuesday, 15 December 2026', 'Guests: 220', 'Services: Catering, Decoration', `Package: ${CUSTOM_PACKAGE}`, 'Notes: roses']) assert.ok(m.includes(s), s);
  assert.ok(!/@|http/.test(m));
});
t('maps URLs use the configured address; unverified pin is flagged', () => {
  assert.ok(directionsUrl().includes(encodeURIComponent(business.map.query))); assert.ok(mapsEmbedUrl().includes(encodeURIComponent(business.map.query))); assert.equal(business.map.verifiedPin, false);
});

// ---------- SEO ----------
t('JSON-LD is valid and contains only verified facts', () => {
  const j = buildJsonLd('') as Record<string, any>;
  assert.equal(j['@type'], 'EventVenue'); assert.equal(j.telephone, '+92526501632'); assert.equal(j.address.addressLocality, 'Sialkot'); assert.equal(j.address.addressCountry, 'PK');
  for (const k of ['geo', 'email', 'sameAs', 'url', 'image', 'aggregateRating', 'openingHours', 'priceRange']) assert.ok(!(k in j), `must not invent ${k}`);
  assert.equal((buildJsonLd('https://example.com') as any).url, 'https://example.com');
});
t('title/description lengths and head output', () => {
  assert.ok(seo.title.length <= 60, `title ${seo.title.length}`); assert.ok(seo.description.length >= 70 && seo.description.length <= 160, `desc ${seo.description.length}`);
  const noUrl = renderHead(''); assert.ok(!noUrl.includes('rel="canonical"') && !noUrl.includes('og:image"') && noUrl.includes('content="summary"'));
  const withUrl = renderHead('https://example.com/'); assert.ok(withUrl.includes('rel="canonical" href="https://example.com/"') && withUrl.includes('https://example.com/og-default.png') && withUrl.includes('summary_large_image'));
});

console.log(`\n${n} unit tests passed`);
