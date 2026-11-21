import type { ReactNode } from 'react';
import { useInView } from '../lib/hooks';

export function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const [ref, seen] = useInView();
  return (
    <div ref={ref} className={`reveal ${seen ? 'is-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
