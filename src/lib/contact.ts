import { business } from '../data/business';
import { normalizePkPhone } from './phone';

/** Single source of truth: the tel: link is DERIVED from the displayed number, so they can never drift apart. */
const parsed = normalizePkPhone(business.phone.display);
if (!parsed) throw new Error(`business.phone.display "${business.phone.display}" is not a valid Pakistani number`);
export const phoneDisplay = parsed.display;
export const phoneE164 = parsed.e164;
export const telHref = `tel:${parsed.e164}`;

/**
 * WhatsApp number is used ONLY if it is digits in international format (no "+", spaces or zeros prefix),
 * and, for +92 numbers, a valid Pakistani number. Anything else disables WhatsApp instead of producing a broken link.
 */
export const whatsappNumber: string | null = (() => {
  const n = business.whatsappNumber;
  if (!n) return null;
  const ok = /^\d{10,15}$/.test(n) && (!n.startsWith('92') || normalizePkPhone(`+${n}`) !== null);
  if (!ok && typeof console !== 'undefined') console.warn('[Gulshan] business.whatsappNumber is invalid; WhatsApp links are disabled.');
  return ok ? n : null;
})();
