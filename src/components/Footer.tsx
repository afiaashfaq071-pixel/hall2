import { Logo } from './Logo';
import { business } from '../data/business';
import { navLinks } from '../data/nav';
import { services } from '../data/services';
import { scrollToId } from '../lib/hooks';
import { phoneDisplay, telHref } from '../lib/contact';

export function Footer() {
  return (
    <footer className="dark-zone bg-charcoal pt-16 text-ivory/80 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-12">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed">Weddings and family celebrations on Sambrial Road, Sialkot, hosted with warmth and care.</p>
        </div>
        <nav aria-label="Footer navigation"><h2 className="foot-h">Explore</h2><ul className="text-sm">{navLinks.map((l) => <li key={l.id}><a href={`#${l.id}`} onClick={(e: any) => { e.preventDefault(); scrollToId(l.id); }} className="inline-flex min-h-11 min-w-11 items-center hover:text-gold">{l.label}</a></li>)}</ul></nav>
        <div><h2 className="foot-h">Services</h2><ul className="space-y-2.5 text-sm">{services.map((s) => <li key={s.id} className="py-0.5">{s.title}</li>)}</ul></div>
        <div><h2 className="foot-h">Visit &amp; Call</h2>
          <address className="space-y-2.5 text-sm not-italic"><p>{business.address.full}</p><p><a href={telHref} className="inline-flex min-h-11 min-w-11 items-center text-gold">{phoneDisplay}</a></p></address>
          {business.social.length > 0 && <ul className="mt-4 flex gap-4 text-sm">{business.social.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-gold">{s.label}</a></li>)}</ul>}
        </div>
      </div>
      <div className="mx-auto mt-12 w-full max-w-7xl border-t border-ivory/10 px-5 pt-6 text-xs sm:px-8">© {new Date().getFullYear()} {business.name}. All rights reserved.</div>
    </footer>
  );
}
