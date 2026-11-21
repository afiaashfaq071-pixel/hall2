import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { Photo } from './Photo';
import { Icon } from './Icon';
import { verifiedVenues, generalShowcase } from '../data/venues';
import { scrollToId } from '../lib/hooks';

export function VenueSection() {
  const enquire = () => scrollToId('booking');
  return (
    <section id="venues" className="bg-white py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow="Our Venues" title="A setting made for celebration">
          Discover the space where your celebration will take place. We confirm hall options, capacity and facilities personally for your date.
        </SectionHeading>

        {verifiedVenues.length === 0 ? (
          <Reveal>
            <article className="dark-zone grid overflow-hidden bg-plum text-ivory lg:grid-cols-2">
              <div className="aspect-[4/3] lg:aspect-auto lg:min-h-[420px]"><Photo scene={generalShowcase.scene} alt="Gulshan Banquet Hall venue interior" /></div>
              <div className="flex flex-col justify-center p-8 sm:p-12">
                <h3 className="font-display text-4xl font-semibold text-gold">{generalShowcase.name}</h3>
                <p className="mt-4 leading-relaxed text-ivory/80">{generalShowcase.description}</p>
                <p className="mt-6 flex items-start gap-3 text-sm text-ivory/80"><Icon name="pin" className="mt-0.5 shrink-0 text-gold" size={18} />Sambrial Road, Bopalwala, Sialkot</p>
                <p className="mt-3 flex items-start gap-3 text-sm text-ivory/80"><Icon name="users" className="mt-0.5 shrink-0 text-gold" size={18} />Capacity and facilities: ask our team for your date</p>
                <button type="button" onClick={enquire} className="btn btn-gold mt-8 self-start">Enquire Now</button>
              </div>
            </article>
          </Reveal>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {verifiedVenues.map((v, i) => (
              <Reveal key={v.id} delay={i * 80}>
                <article className="group overflow-hidden bg-ivory">
                  <div className="aspect-[4/3] overflow-hidden"><div className="h-full transition-transform duration-700 group-hover:scale-105"><Photo photo={v.photo} scene={v.scene} alt={v.name} /></div></div>
                  <div className="p-6">
                    <h3 className="font-display text-3xl text-plum">{v.name}</h3>
                    <p className="mt-2 text-charcoal/80">{v.description}</p>
                    {v.capacity && <p className="mt-3 text-sm font-medium text-plum">Capacity: {v.capacity}</p>}
                    <ul className="mt-3 flex flex-wrap gap-2">{v.facilities.map((f) => <li key={f} className="border border-gold/50 px-3 py-1 text-xs text-charcoal/80">{f}</li>)}</ul>
                    <button type="button" onClick={enquire} className="btn btn-plum mt-5">Enquire Now</button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
