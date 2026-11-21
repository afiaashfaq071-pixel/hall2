import { Reveal } from './Reveal';
import { Photo } from './Photo';
import { business } from '../data/business';

export function AboutSection() {
  return (
    <section id="about" className="bg-ivory py-20 sm:py-28">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-6">
          <div className="relative mx-auto max-w-md lg:max-w-none">
            <div className="aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-md border border-gold/40 p-2">
              <div className="h-full overflow-hidden rounded-t-[999px] rounded-b-sm"><Photo scene="hall" alt="Arched banquet hall interior with chandeliers" /></div>
            </div>
            <div className="dark-zone absolute -bottom-5 right-0 max-w-[13rem] bg-plum px-5 py-4 text-ivory shadow-xl sm:-right-6">
              <p className="font-display text-xl leading-snug">Sambrial Road,<br />Bopalwala, Sialkot</p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={120} className="lg:col-span-6">
          <p className="mb-3 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.35em] text-gold-deep"><span className="h-px w-8 bg-gold-deep" aria-hidden="true" />About Gulshan</p>
          <h2 className="font-display text-4xl font-semibold leading-tight text-plum sm:text-5xl">Creating Beautiful Memories, One Celebration at a Time</h2>
          <div className="mt-6 space-y-5 text-[1.02rem] leading-relaxed text-charcoal/80">
            <p>{business.name} welcomes families to Sambrial Road in Sialkot for the occasions that matter most. From the colour of a mehndi night to the quiet dignity of a nikkah, we want every gathering to feel warm, welcoming and well looked after.</p>
            <p>Our approach is simple: listen to your plans, talk honestly about what is possible for your date, and look after your guests with genuine hospitality. Wedding celebrations and family gatherings are at the heart of what we do.</p>
            <p>Every enquiry is handled personally by our team, so you hear about availability, arrangements and details directly from the people who will host you.</p>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {['Wedding celebrations', 'Family gatherings', 'Warm hospitality', 'Personal guidance'].map((t) => (
              <li key={t} className="flex items-center gap-3 border-l-2 border-gold pl-4 font-display text-xl text-plum">{t}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
