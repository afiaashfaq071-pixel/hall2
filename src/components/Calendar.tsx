import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { addDays, addMonths, isPast, monthLabel, monthWeeks, parseISO, shiftMonths, todayISO, toISO, weekdayOf, formatDate, daysInMonth } from '../lib/calendar';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
type View = { y: number; m: number };

const viewOf = (iso: string): View => {
  const p = parseISO(iso) ?? parseISO(todayISO())!;
  return { y: p.y, m: p.m };
};

/**
 * Accessible single-date picker. Past days are disabled, the visible month follows the selected date,
 * and the grid supports the standard date-picker keys (arrows, Home/End, PageUp/PageDown, Shift+Page = year).
 */
export function Calendar({ value, onChange, invalid = false, describedBy }: { value: string; onChange: (iso: string) => void; invalid?: boolean; describedBy?: string }) {
  const today = todayISO();
  const [view, setView] = useState<View>(() => viewOf(value || today));
  const [focusISO, setFocusISO] = useState<string>(value && !isPast(value, today) ? value : today);
  const grid = useRef<HTMLDivElement | null>(null);
  const wantFocus = useRef(false);

  // Keep the visible month in sync with the selected date when it changes from outside (Back/Continue, reset).
  useEffect(() => {
    const target = value && parseISO(value) ? value : todayISO();
    setView(viewOf(target));
    setFocusISO(isPast(target) ? todayISO() : target);
  }, [value]);

  const min = viewOf(today);
  const minIndex = min.y * 12 + min.m;
  // Never show a month before the current one (also covers the clock moving on while the page is open).
  const shown: View = view.y * 12 + view.m < minIndex ? min : view;
  const atMin = shown.y * 12 + shown.m <= minIndex;
  const weeks = monthWeeks(shown.y, shown.m);

  const inShown = (iso: string) => { const p = parseISO(iso); return !!p && p.y === shown.y && p.m === shown.m; };
  const firstEnabled = () => { for (let d = 1; d <= daysInMonth(shown.y, shown.m); d++) { const iso = toISO(shown.y, shown.m, d); if (!isPast(iso, today)) return iso; } return today; };
  const tabStop = inShown(focusISO) && !isPast(focusISO, today) ? focusISO : firstEnabled();

  useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-iso="${focusISO}"]`)?.focus();
  }, [focusISO, shown.y, shown.m]);

  const moveMonth = (delta: number) => {
    const next = addMonths(shown.y, shown.m, delta);
    if (next.y * 12 + next.m < minIndex) return;
    setView(next);
  };

  const onKeyDown = (e: any) => {
    const current = (e.target as HTMLElement).dataset?.iso;
    if (!current) return;
    const cur = parseISO(current);
    if (!cur) return;
    const wd = weekdayOf(cur.y, cur.m, cur.d);
    let target: string | null = null;
    switch (e.key) {
      case 'ArrowLeft': target = addDays(current, -1); break;
      case 'ArrowRight': target = addDays(current, 1); break;
      case 'ArrowUp': target = addDays(current, -7); break;
      case 'ArrowDown': target = addDays(current, 7); break;
      case 'Home': target = addDays(current, -wd); break;
      case 'End': target = addDays(current, 6 - wd); break;
      case 'PageUp': target = shiftMonths(current, e.shiftKey ? -12 : -1); break;
      case 'PageDown': target = shiftMonths(current, e.shiftKey ? 12 : 1); break;
      default: return;
    }
    e.preventDefault();
    if (isPast(target, today)) target = today; // never move focus into the past; stop at today instead
    wantFocus.current = true;
    setView(viewOf(target));
    setFocusISO(target);
  };

  const title = monthLabel(shown.y, shown.m);

  return (
    <div className={`mx-auto w-full max-w-sm border bg-white p-3 min-[400px]:p-4 ${invalid ? 'border-red-700' : 'border-gold/40'}`}>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Previous month" disabled={atMin} onClick={() => moveMonth(-1)} className="grid h-11 w-11 place-items-center text-plum disabled:opacity-30"><Icon name="chevronLeft" /></button>
        <p className="font-display text-xl font-semibold text-plum" aria-live="polite" id="cal-title">{title}</p>
        <button type="button" aria-label="Next month" onClick={() => moveMonth(1)} className="grid h-11 w-11 place-items-center text-plum"><Icon name="chevronRight" /></button>
      </div>

      <div ref={grid} role="grid" aria-labelledby="cal-title" aria-describedby={describedBy} onKeyDown={onKeyDown}>
        <div role="row" className="grid grid-cols-7 text-center text-[0.7rem] uppercase tracking-wider text-charcoal/70">
          {WEEKDAYS.map((w) => <span key={w} role="columnheader" aria-label={w} className="py-1">{w[0]}</span>)}
        </div>
        {weeks.map((week, wi) => (
          <div role="row" key={wi} className="grid grid-cols-7 gap-y-1">
            {week.map((d, di) => {
              if (d === null) return <span role="gridcell" key={di} aria-hidden="true" />;
              const iso = toISO(shown.y, shown.m, d);
              const past = isPast(iso, today), sel = iso === value, isToday = iso === today;
              return (
                <span role="gridcell" key={di} aria-selected={sel} className="grid place-items-center">
                  <button type="button" data-iso={iso} disabled={past} tabIndex={iso === tabStop ? 0 : -1}
                    aria-current={isToday ? 'date' : undefined} aria-label={formatDate(iso) + (isToday ? ' (today)' : '')}
                    onClick={() => onChange(iso)}
                    className={`h-11 w-full min-w-0 max-w-11 rounded-full text-sm transition-colors ${sel ? 'bg-plum font-semibold text-gold' : isToday ? 'border border-plum font-semibold text-plum' : 'text-charcoal hover:bg-gold/25'} ${past ? 'cursor-not-allowed text-charcoal/40 hover:bg-transparent' : ''}`}>{d}</button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-charcoal/70">Use arrow keys to move between days.</p>
    </div>
  );
}
