/** Pakistani phone handling: accepts 03xx.., +92 3xx.., 0092.., 92.. and landlines such as 052 6501632. */
export type PkPhone = { e164: string; display: string; kind: 'mobile' | 'landline' };

/** Major cities with 2-digit area codes (Karachi, Hyderabad, Faisalabad, Lahore, Islamabad/Rawalpindi, Sialkot, Gujrat, Gujranwala, Multan, Sukkur, Quetta, Peshawar). */
const TWO_DIGIT_AREA = new Set(['21', '22', '41', '42', '51', '52', '53', '55', '61', '71', '81', '91']);

export function normalizePkPhone(raw: string): PkPhone | null {
  let d = raw.trim().replace(/[\s\-().]/g, '');
  if (!/^\+?\d+$/.test(d)) return null;
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('0092')) d = d.slice(4);
  else if (d.startsWith('92') && d.length >= 11) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  if (d.startsWith('0')) return null; // e.g. "00300..." or a doubled zero

  if (/^3\d{9}$/.test(d)) {
    return { kind: 'mobile', e164: `+92${d}`, display: `0${d.slice(0, 3)} ${d.slice(3)}` };
  }
  if (/^[24-9]\d{8,9}$/.test(d)) {
    const area = TWO_DIGIT_AREA.has(d.slice(0, 2)) ? 2 : 3; // cosmetic only: the E.164 value is exact either way
    return { kind: 'landline', e164: `+92${d}`, display: `0${d.slice(0, area)} ${d.slice(area)}` };
  }
  return null;
}

export const isValidPhone = (raw: string) => normalizePkPhone(raw) !== null;
