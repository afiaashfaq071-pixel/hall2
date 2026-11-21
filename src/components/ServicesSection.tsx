import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { Icon } from './Icon';
import { services } from '../data/services';
import { scrollToId } from '../lib/hooks';

export function ServicesSection() {
  return (
    <section id="services" className="bg-ivory py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow="Services" title="Everything your event may need">
          Tell us what you have in mind. Services marked “Enquire to confirm” are discussed with our team so you only plan around what is available for your date.
        </SectionHeading>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 90}>
              <article className="card-lift flex h-full flex-col border border-gold/30 bg-white p-7">
                <div className="mb-5 flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-plum text-gold"><Icon name={s.icon} size={22} /></span>
                  {!s.confirmed && <span className="border border-gold/50 px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-widest text-charcoal/80">Enquire to confirm</span>}
                </div>
                <h3 className="font-display text-2xl font-semibold text-plum">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{s.blurb}</p>
                <ul className="mt-5 space-y-2 border-t border-gold/25 pt-5 text-sm text-charcoal/85">
                  {s.items.map((it) => <li key={it} className="flex items-center gap-2.5"><Icon name="check" size={15} className="shrink-0 text-gold-deep" />{it}</li>)}
                </ul>
                <button type="button" onClick={() => scrollToId('booking')} className="mt-6 inline-flex items-center gap-2 self-start text-sm font-medium text-plum underline-offset-4 hover:underline min-h-11">Enquire <Icon name="arrow" size={16} /></button>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
