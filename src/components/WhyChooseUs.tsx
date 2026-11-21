import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';
import { Icon } from './Icon';
import { reasons } from '../data/why';

export function WhyChooseUs() {
  return (
    <section id="why" className="bg-white py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow="Why Gulshan" title="Why families choose Gulshan" center />
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r, i) => (
            <Reveal key={r.title} delay={(i % 3) * 90}>
              <div className="text-center sm:text-left">
                <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-gold-deep text-gold-deep sm:mx-0"><Icon name={r.icon} size={24} /></span>
                <h3 className="font-display text-2xl font-semibold text-plum">{r.title}</h3>
                <p className="mt-2 text-charcoal/70">{r.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
