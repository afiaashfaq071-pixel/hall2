import { useState } from 'react';
import { business } from '../data/business';
import { scrollToId } from '../lib/hooks';
import { Scene } from './Photo';
import { Icon } from './Icon';

export function HeroSection() {
  const { desktop, mobile, alt } = business.hero;
  const main = desktop ?? mobile;
  const [failed, setFailed] = useState(false);
  const showPhoto = !!main && !failed;

  return (
    <section id="home" aria-label="Welcome" className="dark-zone hero-h relative isolate flex items-center overflow-hidden bg-plum">
      <div className="absolute inset-0 -z-10">
        {showPhoto ? (
          <picture>
            {mobile && <source media="(max-width: 767px)" srcSet={mobile} />}
            {desktop && <source media="(min-width: 768px)" srcSet={desktop} />}
            {/* Above the fold: eager + high priority. A broken path falls back to the illustration. */}
            <img src={main} alt={alt} fetchPriority="high" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover" />
          </picture>
        ) : (
          <div className="h-full w-full scale-110"><Scene kind="hero" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-plum/70 via-plum/45 to-plum/90" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 pb-36 pt-28 sm:px-8 sm:pb-24 sm:pt-32">
        <p className="hero-in mb-5 text-xs font-medium uppercase tracking-[0.4em] text-gold" style={{ animationDelay: '100ms' }}>Sambrial Road · Sialkot</p>
        <h1 className="hero-in max-w-3xl font-display text-[2.6rem] font-semibold leading-[1.05] text-ivory min-[400px]:text-[2.9rem] sm:text-6xl lg:text-7xl" style={{ animationDelay: '250ms' }}>
          Where Every Celebration Becomes a <em className="text-gold">Beautiful Memory</em>
        </h1>
        <p className="hero-in mt-6 max-w-xl text-base leading-relaxed text-ivory/85 sm:text-lg" style={{ animationDelay: '450ms' }}>{business.subtitle}</p>
        <div className="hero-in mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '650ms' }}>
          <button type="button" className="btn btn-gold" onClick={() => scrollToId('venues')}>Explore Our Venue</button>
          <button type="button" className="btn btn-outline" onClick={() => scrollToId('booking')}>Plan Your Event</button>
        </div>
      </div>

      <button type="button" aria-label="Scroll to About section" onClick={() => scrollToId('about')} className="absolute bottom-24 left-1/2 hidden min-h-11 min-w-11 -translate-x-1/2 flex-col items-center gap-1 text-gold sm:bottom-6 sm:flex">
        <span className="text-[0.65rem] uppercase tracking-[0.3em]">Scroll</span>
        <span className="scroll-cue"><Icon name="chevronDown" size={18} /></span>
      </button>
    </section>
  );
}
