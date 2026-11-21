import { useEffect, useRef, useState } from 'react';
import { navLinks, navAliases, navIds } from '../data/nav';
import { useActiveSection, useScrollLock, scrollToId } from '../lib/hooks';
import { Logo } from './Logo';
import { Icon } from './Icon';

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection(navIds, navAliases);
  const toggle = useRef<HTMLButtonElement | null>(null);
  const menu = useRef<HTMLDivElement | null>(null);
  useScrollLock(open);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>('a')?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onChange = () => desktop.matches && setOpen(false); // menu must not stay open (and lock scrolling) after a resize/rotate
    window.addEventListener('keydown', esc);
    desktop.addEventListener('change', onChange);
    return () => { window.removeEventListener('keydown', esc); desktop.removeEventListener('change', onChange); };
  }, [open]);

  const go = (id: string) => (e: any) => {
    e.preventDefault();
    setOpen(false);
    scrollToId(id);
  };

  return (
    <header className={`dark-zone fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${scrolled || open ? 'bg-plum/95 shadow-[0_1px_0_rgba(197,164,109,.25)] backdrop-blur' : 'bg-transparent'}`}>
      <nav aria-label="Primary" className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-5 sm:px-8" style={{ paddingLeft: 'max(1.25rem, env(safe-area-inset-left))', paddingRight: 'max(1.25rem, env(safe-area-inset-right))' }}>
        <a href="#home" onClick={go('home')} aria-label="Gulshan Banquet Hall, back to top"><Logo /></a>

        <ul className="hidden items-center gap-7 lg:flex">
          {navLinks.map((l) => (
            <li key={l.id}>
              <a href={`#${l.id}`} onClick={go(l.id)} aria-current={active === l.id ? 'true' : undefined}
                className={`nav-link text-[0.82rem] font-medium tracking-wide ${active === l.id ? 'text-gold' : 'text-ivory/85 hover:text-gold'}`}>{l.label}</a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a href="#booking" onClick={go('booking')} className="btn btn-gold hidden !py-2.5 !text-[0.78rem] sm:inline-flex">Book Your Event</a>
          <button ref={toggle} type="button" className="grid h-11 w-11 place-items-center rounded-full border border-gold/50 text-ivory lg:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)}>
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </nav>

      <div id="mobile-menu" ref={menu} hidden={!open} className="max-h-[calc(100svh-72px)] overflow-y-auto overscroll-contain border-t border-gold/20 bg-plum lg:hidden">
        <ul className="mx-auto max-w-7xl px-5 py-2">
          {navLinks.map((l) => (
            <li key={l.id} className="border-b border-ivory/10 last:border-0">
              <a href={`#${l.id}`} onClick={go(l.id)} aria-current={active === l.id ? 'true' : undefined} className={`flex min-h-[52px] items-center font-display text-2xl ${active === l.id ? 'text-gold' : 'text-ivory'}`}>{l.label}</a>
            </li>
          ))}
        </ul>
        <div className="px-5 pb-6 pt-2"><a href="#booking" onClick={go('booking')} className="btn btn-gold w-full">Book Your Event</a></div>
      </div>
    </header>
  );
}
