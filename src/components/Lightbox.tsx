import { useEffect, useRef } from 'react';
import type { GalleryItem } from '../data/gallery';
import { useScrollLock } from '../lib/hooks';
import { Photo } from './Photo';
import { Icon } from './Icon';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

type Props = { items: GalleryItem[]; index: number; onIndex: (i: number) => void; onClose: () => void };

/** Modal image viewer: traps focus, closes on Esc/backdrop, locks page scroll, restores focus to the opener. */
export function Lightbox({ items, index, onIndex, onClose }: Props) {
  const dialog = useRef<HTMLDivElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement | null>(null);
  const opener = useRef<Element | null>(document.activeElement); // the thumbnail that opened us
  const touchX = useRef<number | null>(null);
  const count = items.length;
  const item = items[index];
  useScrollLock(true);

  // Always call the latest handlers from the single long-lived key listener.
  const latest = useRef({ index, count, onIndex, onClose });
  latest.current = { index, count, onIndex, onClose };

  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const { index: i, count: n, onIndex: setI, onClose: close } = latest.current;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight') setI((i + 1) % n);
      else if (e.key === 'ArrowLeft') setI((i - 1 + n) % n);
      else if (e.key === 'Tab') {
        const nodes = [...(dialog.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter((el) => !el.hasAttribute('disabled'));
        if (!nodes.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        const inside = dialog.current?.contains(document.activeElement);
        if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const el = opener.current as HTMLElement | null;
    return () => {
      document.removeEventListener('keydown', onKey);
      if (el?.isConnected) el.focus(); // give focus back to the exact image that was opened
    };
  }, []);

  if (!item) return null;
  const step = (d: number) => onIndex((index + d + count) % count);

  return (
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="lb-caption" className="lightbox dark-zone fixed inset-0 z-[60] grid place-items-center overscroll-contain bg-charcoal/95 p-3 sm:p-6" onClick={onClose}
      onTouchStart={(e: any) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e: any) => { const s = touchX.current; touchX.current = null; if (s === null) return; const dx = e.changedTouches[0].clientX - s; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); }}>
      <button ref={closeBtn} type="button" aria-label="Close image viewer" onClick={onClose} className="absolute right-3 top-3 z-10 grid h-12 w-12 place-items-center rounded-full border border-gold/60 bg-charcoal/60 text-ivory" style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}><Icon name="close" /></button>
      {count > 1 && <>
        <button type="button" aria-label="Previous image" onClick={(e: any) => { e.stopPropagation(); step(-1); }} className="absolute left-2 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-gold/60 bg-charcoal/60 text-ivory sm:left-6"><Icon name="chevronLeft" /></button>
        <button type="button" aria-label="Next image" onClick={(e: any) => { e.stopPropagation(); step(1); }} className="absolute right-2 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-gold/60 bg-charcoal/60 text-ivory sm:right-6"><Icon name="chevronRight" /></button>
      </>}
      <figure className="lightbox-img flex w-full max-w-4xl flex-col items-center" key={item.id} onClick={(e: any) => e.stopPropagation()}>
        {/* Width is derived from the available height so the 4:3 box never overflows small screens. */}
        <div className="aspect-[4/3] overflow-hidden" style={{ width: 'min(100%, calc((100dvh - 9rem) * 4 / 3))' }}>
          <Photo photo={item.photo} scene={item.scene} alt={item.alt} fit="contain" eager />
        </div>
        <figcaption id="lb-caption" className="mt-3 flex w-full justify-between gap-4 text-sm text-ivory/90" style={{ maxWidth: 'min(100%, calc((100dvh - 9rem) * 4 / 3))' }}>
          <span>{item.category}: {item.alt}</span><span aria-live="polite" className="shrink-0">{index + 1} / {count}</span>
        </figcaption>
      </figure>
    </div>
  );
}
