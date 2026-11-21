/**
 * Date helpers. Every calculation is UTC-based on plain Y-M-D values, so results never shift with the
 * viewer's timezone or DST. The only local-time read is `todayISO()` (the viewer's calendar date).
 */
export const pad = (n: number) => String(n).padStart(2, '0');
/** `m` is 0-based (like Date). */
export const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export type YMD = { y: number; m: number; d: number };

export const parseISO = (iso: string): YMD | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = +match[1], m = +match[2] - 1, d = +match[3];
  const t = new Date(Date.UTC(y, m, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m && t.getUTCDate() === d ? { y, m, d } : null;
};

export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
export const weekdayOf = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).getUTCDay();

export const addDays = (iso: string, n: number): string => {
  const p = parseISO(iso);
  if (!p) return iso;
  const t = new Date(Date.UTC(p.y, p.m, p.d + n));
  return toISO(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
};

export const addMonths = (y: number, m: number, n: number) => {
  const total = y * 12 + m + n;
  return { y: Math.floor(total / 12), m: ((total % 12) + 12) % 12 };
};

/** Same day-of-month `n` months later, clamped to the target month's length (31 Jan + 1 => 28/29 Feb). */
export const shiftMonths = (iso: string, n: number): string => {
  const p = parseISO(iso);
  if (!p) return iso;
  const t = addMonths(p.y, p.m, n);
  return toISO(t.y, t.m, Math.min(p.d, daysInMonth(t.y, t.m)));
};

/** Weeks (Sunday first) of a month; leading/trailing blanks are null. */
export const monthWeeks = (y: number, m: number): (number | null)[][] => {
  const cells: (number | null)[] = [...Array<null>(weekdayOf(y, m, 1)).fill(null), ...Array.from({ length: daysInMonth(y, m) }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
};

/** Viewer's local calendar date as YYYY-MM-DD. Read fresh each call (never cached). */
export const todayISO = () => {
  const n = new Date();
  return toISO(n.getFullYear(), n.getMonth(), n.getDate());
};

export const isPast = (iso: string, today: string = todayISO()) => iso < today;

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => {
  const p = parseISO(iso);
  return p ? new Date(Date.UTC(p.y, p.m, p.d)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' }) : '';
};
export const formatDate = (iso: string) => fmt(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) || 'Not selected';
export const monthLabel = (y: number, m: number) => new Date(Date.UTC(y, m, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
