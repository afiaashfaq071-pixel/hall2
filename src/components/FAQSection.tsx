import { useState } from 'react';
import { SectionHeading } from './SectionHeading';
import { Icon } from './Icon';
import { faqs } from '../data/faqs';

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-white py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" center />
        <div className="divide-y divide-gold/30 border-y border-gold/30">
          {faqs.map((f, n) => (
            <div key={f.q}>
              <h3>
                <button type="button" id={`faq-q-${n}`} aria-expanded={open === n} aria-controls={`faq-a-${n}`} onClick={() => setOpen(open === n ? null : n)}
                  className="flex min-h-[64px] w-full items-center justify-between gap-4 py-4 text-left font-display text-xl font-semibold text-plum sm:text-2xl">
                  {f.q}<Icon name="chevronDown" className={`shrink-0 text-gold-deep transition-transform duration-300 ${open === n ? 'rotate-180' : ''}`} />
                </button>
              </h3>
              <div id={`faq-a-${n}`} role="region" aria-labelledby={`faq-q-${n}`} className={`faq-panel ${open === n ? 'is-open' : ''}`}>
                <div><p className="pb-5 leading-relaxed text-charcoal/80">{f.a}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
