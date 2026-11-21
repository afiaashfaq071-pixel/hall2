import { SectionHeading } from './SectionHeading';
import { Icon } from './Icon';
import { business } from '../data/business';
import { directionsUrl, generalEnquiryLink, mapsEmbedUrl, mapsOpenUrl } from '../lib/enquiry';
import { phoneDisplay, telHref } from '../lib/contact';

export function LocationSection() {
  const wa = generalEnquiryLink();
  return (
    <section id="location" className="bg-ivory py-20 sm:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SectionHeading eyebrow="Find Us" title="Visit Gulshan Banquet Hall" />
          <address className="not-italic">
            <p className="flex gap-3 text-charcoal/85"><Icon name="pin" className="mt-1 shrink-0 text-gold-deep" />{business.address.full}</p>
            <p className="mt-4 flex gap-3 text-charcoal/85"><Icon name="phone" className="mt-1 shrink-0 text-gold-deep" /><a href={telHref} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">{phoneDisplay}</a></p>
          </address>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <a href={directionsUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-plum"><Icon name="navigation" size={18} />Get Directions<span className="sr-only"> (opens Google Maps)</span></a>
            <a href={telHref} className="btn btn-plum-outline"><Icon name="phone" size={18} />Call Now</a>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-gold"><Icon name="chat" size={18} />WhatsApp Enquiry</a>}
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="aspect-[4/3] w-full overflow-hidden border border-gold/50 bg-plum/5 sm:aspect-[16/10]">
            <iframe title="Map showing Gulshan Banquet Hall, Sambrial Road, Bopalwala, Sialkot" src={mapsEmbedUrl()} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-full w-full border-0" allowFullScreen />
          </div>
          <p className="mt-3 text-sm text-charcoal/80">
            {business.map.verifiedPin ? 'Map pin confirmed by Gulshan Banquet Hall.' : 'This map is a search for the address above, so the pin may be approximate. We will confirm the exact entrance when you enquire.'}{' '}
            <a href={mapsOpenUrl()} target="_blank" rel="noopener noreferrer" className="text-plum underline underline-offset-4">Open in Google Maps<span className="sr-only"> (new tab)</span></a>
          </p>
        </div>
      </div>
    </section>
  );
}
