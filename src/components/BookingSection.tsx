import { SectionHeading } from './SectionHeading';
import { BookingForm } from './BookingForm';

export function BookingSection() {
  return (
    <section id="booking" className="dark-zone relative bg-plum py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-3 min-[400px]:px-5 sm:px-8">
        <SectionHeading eyebrow="Plan Your Event" title="Start your enquiry" light center>
          Share your plans in a few simple steps. We will confirm availability and details with you. Submitting an enquiry does not reserve a date.
        </SectionHeading>
        <BookingForm />
      </div>
    </section>
  );
}
