import { generalEnquiryLink } from '../lib/enquiry';
import { telHref } from '../lib/contact';
import { scrollToId, useAnyVisible } from '../lib/hooks';
import { Icon } from './Icon';

const HIDE_OVER = ['booking', 'contact'] as const; // the bar must never cover the form it points to

/** Mobile bottom bar: WhatsApp only when verified, otherwise Call + Enquire. */
export function MobileCta() {
  const wa = generalEnquiryLink();
  const hidden = useAnyVisible(HIDE_OVER);
  return (
    <div data-hidden={hidden} aria-hidden={hidden} inert={hidden} className="mobile-cta dark-zone fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-px border-t border-gold/40 bg-gold/40 sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <a href={telHref} className="flex min-h-[52px] items-center justify-center gap-2 bg-plum text-sm font-medium text-ivory"><Icon name="phone" size={18} className="text-gold" />Call</a>
      {wa
        ? <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-[52px] items-center justify-center gap-2 bg-gold text-sm font-semibold text-plum"><Icon name="chat" size={18} />WhatsApp</a>
        : <button type="button" onClick={() => scrollToId('booking')} className="flex min-h-[52px] items-center justify-center gap-2 bg-gold text-sm font-semibold text-plum"><Icon name="calendar" size={18} />Enquire</button>}
    </div>
  );
}
