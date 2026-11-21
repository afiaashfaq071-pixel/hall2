import type { ReactNode } from 'react';

export function SectionHeading({ eyebrow, title, children, light = false, center = false }: { eyebrow: string; title: string; children?: ReactNode; light?: boolean; center?: boolean }) {
  return (
    <div className={`mb-12 max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <p className={`mb-3 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.35em] ${light ? 'text-gold' : 'text-gold-deep'} ${center ? 'justify-center' : ''}`}>
        <span className={`h-px w-8 ${light ? 'bg-gold' : 'bg-gold-deep'}`} aria-hidden="true" />{eyebrow}
      </p>
      <h2 className={`font-display text-4xl font-semibold leading-tight sm:text-5xl ${light ? 'text-ivory' : 'text-plum'}`}>{title}</h2>
      {children && <p className={`mt-5 text-base leading-relaxed ${light ? 'text-ivory/80' : 'text-charcoal/80'}`}>{children}</p>}
    </div>
  );
}
