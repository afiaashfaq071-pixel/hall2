import { useEffect, useRef, useState } from 'react';

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- reveal on scroll: ONE shared observer for the whole page ---------- */
const reveals = new WeakMap<Element, () => void>();
let shared: IntersectionObserver | null = null;
const observer = () =>
  (shared ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        // Also reveal elements already scrolled PAST (hash jump / back-forward), else they stay invisible.
        if (e.isIntersecting || e.boundingClientRect.bottom <= 0) {
          reveals.get(e.target)?.();
          reveals.delete(e.target);
          shared?.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  ));

export function useInView<T extends Element = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined' || reducedMotion()) {
      setSeen(true);
      return;
    }
    reveals.set(el, () => setSeen(true));
    observer().observe(el);
    return () => {
      reveals.delete(el);
      shared?.unobserve(el);
    };
  }, []);
  return [ref, seen] as const;
}

/* ---------- scroll lock shared by menu + lightbox (a counter, so one cannot unlock the other) ---------- */
let locks = 0;
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    if (locks++ === 0) {
      // Hiding a classic scrollbar widens the page and makes it jump; pad by exactly its width while locked.
      const bar = window.innerWidth - root.clientWidth;
      if (bar > 0) root.style.paddingRight = `${bar}px`;
      root.classList.add('scroll-locked');
    }
    return () => {
      if (--locks === 0) {
        root.classList.remove('scroll-locked');
        root.style.paddingRight = '';
      }
    };
  }, [active]);
}

/* ---------- in-page navigation + browser history ---------- */
export function scrollToId(id: string, opts: { push?: boolean; instant?: boolean } = {}) {
  const el = document.getElementById(id);
  if (!el) return false;
  // 'auto' would defer to CSS `scroll-behavior: smooth`, so say 'instant' explicitly when we mean it.
  el.scrollIntoView({ behavior: opts.instant || reducedMotion() ? 'instant' : 'smooth', block: 'start' });
  if (opts.push !== false && location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true }); // keep keyboard / screen-reader position in sync with the scroll
  return true;
}

/** Makes URL hashes work: initial load with #section, and browser Back/Forward between sections. */
export function useHashNavigation() {
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (id) scrollToId(id, { push: false, instant: true });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    };

    // A deep link must land on the right section even though fonts/images shift the layout just after first paint.
    // So we re-assert the position on every height change for a short while, until the visitor scrolls on their own.
    let stop = () => {};
    if (location.hash) {
      let interacted = false;
      const mark = () => { interacted = true; stop(); };
      const events = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const;
      events.forEach((e) => window.addEventListener(e, mark, { passive: true, once: true }));
      const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => { if (!interacted) go(); });
      ro?.observe(document.body);
      const timer = setTimeout(() => stop(), 3000);
      stop = () => { ro?.disconnect(); clearTimeout(timer); events.forEach((e) => window.removeEventListener(e, mark)); stop = () => {}; };
      requestAnimationFrame(go);
    }

    window.addEventListener('popstate', go);
    return () => { stop(); window.removeEventListener('popstate', go); };
  }, []);
}

/** Active nav item. `aliases` maps sections that are not in the nav onto the nav item they belong to. */
export function useActiveSection(ids: readonly string[], aliases: Record<string, string> = {}) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const all = [...new Set([...ids, ...Object.keys(aliases)])];
    let raf = 0;
    const compute = () => {
      raf = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = ids[0];
      if (atBottom) current = ids[ids.length - 1];
      else {
        const line = 140;
        let best = -Infinity;
        for (const id of all) {
          const el = document.getElementById(id);
          if (!el) continue;
          const top = el.getBoundingClientRect().top;
          if (top <= line && top > best) { best = top; current = aliases[id] ?? id; }
        }
      }
      setActive(current);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ids, aliases]);
  return active;
}

/** True while ANY of the given sections is on screen. */
export function useAnyVisible(ids: readonly string[]) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const state = new Map<string, boolean>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) state.set(e.target.id, e.isIntersecting);
      setVisible([...state.values()].some(Boolean));
    }, { rootMargin: '-80px 0px -64px 0px' }); // ignore the strips covered by the header and the bottom bar
    for (const id of ids) { const el = document.getElementById(id); if (el) io.observe(el); }
    return () => io.disconnect();
  }, [ids]);
  return visible;
}
