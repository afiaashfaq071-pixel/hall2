import { business } from '../data/business';
import { formatDate, isPast, parseISO, todayISO } from './calendar';
import { normalizePkPhone } from './phone';
import { whatsappNumber } from './contact';

export type Enquiry = {
  eventType: string;
  venue: string;
  date: string;
  guests: number;
  services: string[];
  packageName: string;
  name: string;
  phone: string;
  notes: string;
};

export const CUSTOM_PACKAGE = 'Custom Package – Request a Quote';
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();

export const buildEnquiryMessage = (e: Enquiry) =>
  [
    `Assalam o Alaikum, I would like to enquire about an event at ${business.name}.`,
    '',
    `Name: ${oneLine(e.name) || '-'}`,
    `Phone: ${normalizePkPhone(e.phone)?.display ?? (oneLine(e.phone) || '-')}`,
    `Event type: ${e.eventType || '-'}`,
    `Venue: ${e.venue || '-'}`,
    `Preferred date: ${formatDate(e.date)}`,
    `Guests: ${e.guests}`,
    `Services: ${e.services.length ? e.services.join(', ') : 'None selected'}`,
    `Package: ${e.packageName || CUSTOM_PACKAGE}`,
    `Notes: ${e.notes.trim() || '-'}`,
    '',
    'Please confirm availability and share details. Thank you.',
  ].join('\n');

/** wa.me link, or null when no verified WhatsApp number exists (so no dead link is ever rendered). */
export const whatsappLink = (message: string): string | null =>
  whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}` : null;

/** Generic "I'd like to enquire" link for buttons outside the planner. */
export const generalEnquiryLink = () => whatsappLink(`Assalam o Alaikum, I would like to enquire about an event at ${business.name}.`);

export const mapsEmbedUrl = () => business.map.embedUrl ?? `https://www.google.com/maps?q=${encodeURIComponent(business.map.query)}&output=embed`;
export const directionsUrl = () => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.map.query)}`;
export const mapsOpenUrl = () => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.map.query)}`;

/* ---------- validation (pure, shared by the form and tests) ---------- */
export type Check = { ok: true } | { ok: false; message: string };
const fail = (message: string): Check => ({ ok: false, message });
const pass: Check = { ok: true };

export const validateName = (v: string): Check => (oneLine(v).length >= 2 ? pass : fail('Please enter your full name.'));
export const validatePhone = (v: string): Check => (normalizePkPhone(v) ? pass : fail('Enter a valid Pakistani number, e.g. 0300 1234567 or 052 6501632.'));

/** Strict: never clamps. Invalid input stays invalid until the user fixes it. */
export const validateGuests = (text: string): Check => {
  const { min, max } = business.guestLimits;
  const t = text.trim();
  if (!t) return fail('Please enter the number of guests.');
  if (!/^\d+$/.test(t)) return fail('Guest count must be a whole number.');
  const n = Number(t);
  return n >= min && n <= max ? pass : fail(`Guest count must be between ${min} and ${max}.`);
};

export const validateDate = (iso: string, today: string = todayISO()): Check => {
  if (!iso) return fail('Please pick your preferred event date.');
  if (!parseISO(iso)) return fail('That date is not valid. Please pick it from the calendar.');
  if (isPast(iso, today)) return fail('That date has already passed. Please choose a future date.');
  return pass;
};
