import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { Photo } from './Photo';
import { events } from '../data/events';

export function EventsSection() {
  return (
    <section id="events" className="dark-zone bg-plum py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow="Events We Host" title="For every moment worth celebrating" light>From the first mehndi dance to the final farewell, we welcome enquiries for every chapter of your celebration.</SectionHeading>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {events.map((e, i) => (
            <Reveal key={e.id} delay={(i % 4) * 80}>
              <article className="group relative aspect-[3/4] overflow-hidden">
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"><Photo photo={e.photo} scene={e.scene} alt={`${e.title} celebration at Gulshan Banquet Hall`} /></div>
                <div className="absolute inset-0 bg-gradient-to-t from-plum via-plum/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <h3 className="font-display text-xl font-semibold text-gold sm:text-2xl">{e.title}</h3>
                  <p className="mt-1 text-xs leading-snug text-ivory/90 sm:text-sm">{e.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
