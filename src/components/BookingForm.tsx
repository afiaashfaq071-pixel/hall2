import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { business } from '../data/business';
import { verifiedVenues } from '../data/venues';
import { bookingEventTypes } from '../data/events';
import { bookingServices } from '../data/services';
import { Calendar } from './Calendar';
import { EnquiryActions } from './EnquiryActions';
import { Icon } from './Icon';
import { formatDate, isPast } from '../lib/calendar';
import { CUSTOM_PACKAGE, buildEnquiryMessage, validateDate, validateGuests, validateName, validatePhone, type Enquiry } from '../lib/enquiry';

const STEPS = [
  { key: 'event', short: 'Event', title: 'What are you celebrating?' },
  { key: 'venue', short: 'Venue', title: 'Choose your venue' },
  { key: 'date', short: 'Date & guests', title: 'Date & guest count' },
  { key: 'services', short: 'Services', title: 'Services required' },
  { key: 'package', short: 'Package', title: 'Select a package' },
  { key: 'summary', short: 'Summary', title: 'Check your enquiry' },
  { key: 'details', short: 'Your details', title: 'Your details' },
  { key: 'send', short: 'Send', title: 'Send your enquiry' },
] as const;
const LAST = STEPS.length - 1;
const DETAILS = 6;

const PACKAGES = ['Basic Celebration', 'Premium Celebration', 'Luxury Celebration'];
const DEFAULT_VENUE = 'Gulshan Banquet Hall (space confirmed by management)';
const venueOptions = verifiedVenues.length ? verifiedVenues.map((v) => v.name) : [DEFAULT_VENUE];
const { min, max, step: gstep } = business.guestLimits;

type Draft = Omit<Enquiry, 'guests'>;
const blank: Draft = { eventType: '', venue: venueOptions.length === 1 ? venueOptions[0] : '', date: '', services: [], packageName: '', name: '', phone: '', notes: '' };
type Problem = { step: number; message: string; fieldId?: string };

/** One validation function for every step, so Continue and the final "Prepare" can never disagree. */
function problemFor(step: number, d: Draft, guestText: string): Problem | null {
  switch (step) {
    case 0: return d.eventType ? null : { step, message: 'Please choose an event type.' };
    case 1: return venueOptions.includes(d.venue) ? null : { step, message: 'Please choose a venue.' };
    case 2: {
      const date = validateDate(d.date);
      if (!date.ok) return { step, message: date.message, fieldId: 'event-date' };
      const g = validateGuests(guestText);
      return g.ok ? null : { step, message: g.message, fieldId: 'guests' };
    }
    case 4: return d.packageName ? null : { step, message: 'Please choose a package or request a quote.' };
    case 6: {
      const n = validateName(d.name);
      if (!n.ok) return { step, message: n.message, fieldId: 'b-name' };
      const p = validatePhone(d.phone);
      return p.ok ? null : { step, message: p.message, fieldId: 'b-phone' };
    }
    default: return null;
  }
}

function Choice({ type, name, value, checked, onChange, children }: { type: 'radio' | 'checkbox'; name: string; value: string; checked: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="choice">
      <input type={type} name={name} value={value} checked={checked} onChange={onChange} className="choice-input sr-only" />
      <span className="choice-face">
        <span className="min-w-0">{children}</span>
        <Icon name="check" size={18} className="choice-check shrink-0 text-gold" />
      </span>
    </label>
  );
}

function Row({ label, value, onChange }: { label: string; value: string; onChange?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gold/30 py-3 text-sm">
      <dt className="shrink-0 text-charcoal/70">{label}</dt>
      <dd className="flex min-w-0 flex-wrap items-center justify-end gap-x-3 text-right font-medium text-plum">
        <span className="min-w-0 break-words">{value}</span>
        {onChange && <button type="button" onClick={onChange} className="min-h-11 px-1 text-xs font-medium text-gold-deep underline underline-offset-4">Change<span className="sr-only"> {label}</span></button>}
      </dd>
    </div>
  );
}

export function BookingForm() {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(blank);
  const [guestText, setGuestText] = useState('100'); // the single source of truth for guests; never silently clamped
  const [problem, setProblem] = useState<Problem | null>(null);
  const [prepared, setPrepared] = useState<Enquiry | null>(null);
  const top = useRef<HTMLDivElement | null>(null);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const firstRender = useRef(true);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((p) => ({ ...p, [k]: v })); setProblem(null); };
  const setDate = (iso: string) => { if (isPast(iso)) return; set('date', iso); }; // defence in depth: never store a past date

  // After each step change: bring the card into view and move focus to its heading for keyboard / screen-reader users.
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const r = top.current?.getBoundingClientRect();
    if (r && (r.top < 80 || r.top > window.innerHeight * 0.6)) top.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    heading.current?.focus({ preventScroll: true });
  }, [step]);

  // After an error appears, focus the field it is about.
  useEffect(() => {
    if (!problem) return;
    if (problem.fieldId) document.getElementById(problem.fieldId)?.focus();
  }, [problem]);

  const adjustGuests = (delta: number) => {
    const current = /^\d+$/.test(guestText.trim()) ? Number(guestText) : delta > 0 ? min - gstep : max + gstep;
    setGuestText(String(Math.min(max, Math.max(min, current + delta)))); // deliberate +/- press, not silent correction
    setProblem(null);
  };

  const show = (p: Problem) => { setStep(p.step); setProblem(p); };
  const next = () => {
    const p = problemFor(step, d, guestText);
    if (p) return setProblem(p);
    setProblem(null);
    if (step === DETAILS) return prepare();
    setStep(step + 1);
  };

  /** Re-validates EVERY step (e.g. the clock moved past the chosen date) before an enquiry can be prepared. */
  const prepare = () => {
    for (let s = 0; s <= DETAILS; s++) {
      const p = problemFor(s, d, guestText);
      if (p) return show(p);
    }
    setPrepared({ ...d, guests: Number(guestText.trim()) }); // frozen snapshot used by the final step
    setStep(LAST);
  };

  const back = () => { setProblem(null); setStep(Math.max(0, step - 1)); };
  const jump = (s: number) => { setProblem(null); setStep(s); };
  const reset = () => { setD(blank); setGuestText('100'); setPrepared(null); setProblem(null); setStep(0); };

  const toggleService = (s: string) => set('services', d.services.includes(s) ? d.services.filter((x) => x !== s) : [...d.services, s]);
  const message = useMemo(() => (prepared ? buildEnquiryMessage(prepared) : ''), [prepared]);
  const pkg = d.packageName || CUSTOM_PACKAGE;
  const stepInfo = STEPS[step];
  const gErr = problem?.fieldId === 'guests';
  const dErr = problem?.fieldId === 'event-date';

  const renderSummary = (editable: boolean) => (
    <dl>
      <Row label="Event" value={d.eventType} onChange={editable ? () => jump(0) : undefined} />
      <Row label="Venue" value={d.venue} onChange={editable ? () => jump(1) : undefined} />
      <Row label="Date" value={formatDate(d.date)} onChange={editable ? () => jump(2) : undefined} />
      <Row label="Guests" value={guestText.trim()} onChange={editable ? () => jump(2) : undefined} />
      <Row label="Services" value={d.services.length ? d.services.join(', ') : 'None selected'} onChange={editable ? () => jump(3) : undefined} />
      <Row label="Package" value={pkg} onChange={editable ? () => jump(4) : undefined} />
      <Row label="Estimated price" value="Shared by management on request" />
    </dl>
  );

  return (
    <div ref={top} className="light-zone mx-auto max-w-3xl scroll-mt-24 bg-ivory p-4 text-charcoal shadow-2xl sm:p-10">
      <p className="mb-5 flex items-start gap-2 border-l-2 border-gold bg-white px-3 py-2 text-xs leading-snug text-charcoal/80">
        <Icon name="check" size={14} className="mt-0.5 shrink-0 text-gold-deep" />
        <span><strong>Enquiry only.</strong> Completing these steps sends a request to our team. A date is not reserved until management confirms it with you.</span>
      </p>

      <ol className="mb-6 flex gap-1.5" aria-label="Enquiry progress">
        {STEPS.map((s, n) => (
          <li key={s.key} aria-current={n === step ? 'step' : undefined} className={`h-1.5 flex-1 ${n < step ? 'bg-plum' : n === step ? 'bg-gold' : 'bg-plum/15'}`}><span className="sr-only">Step {n + 1}: {s.short}{n < step ? ' (done)' : n === step ? ' (current)' : ''}</span></li>
        ))}
      </ol>
      <p className="text-xs font-medium uppercase tracking-[0.25em] text-gold-deep">Step {step + 1} of {STEPS.length} · {stepInfo.short}</p>
      <h3 id="step-title" ref={heading} tabIndex={-1} className="mb-6 mt-1 font-display text-3xl font-semibold text-plum outline-none">{stepInfo.title}</h3>

      <div>
        {step === 0 && <div role="radiogroup" aria-labelledby="step-title" className="grid gap-3 sm:grid-cols-2">{bookingEventTypes.map((t) => <Choice key={t} type="radio" name="event" value={t} checked={d.eventType === t} onChange={() => set('eventType', t)}>{t}</Choice>)}</div>}

        {step === 1 && (
          <div role="radiogroup" aria-labelledby="step-title" className="grid gap-3">
            {venueOptions.map((v) => <Choice key={v} type="radio" name="venue" value={v} checked={d.venue === v} onChange={() => set('venue', v)}>{v === DEFAULT_VENUE ? 'Gulshan Banquet Hall' : v}</Choice>)}
            {!verifiedVenues.length && <p className="text-sm text-charcoal/70">Hall options and capacity are confirmed by our team for your date.</p>}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-plum" id="date-label">Event date</p>
              <div id="event-date" tabIndex={-1} className="outline-none" aria-labelledby="date-label"><Calendar value={d.date} onChange={setDate} invalid={dErr} /></div>
              <p className="mt-2 text-center text-sm text-plum">{d.date ? formatDate(d.date) : 'No date selected'}</p>
            </div>
            <div>
              <label htmlFor="guests" className="lbl">Number of guests</label>
              <div className="flex items-center justify-center gap-3">
                <button type="button" aria-label="Decrease guests" onClick={() => adjustGuests(-gstep)} className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-plum text-plum"><Icon name="minus" /></button>
                <input id="guests" inputMode="numeric" autoComplete="off" value={guestText} maxLength={5}
                  onChange={(e: any) => { setGuestText(e.target.value.replace(/[^\d]/g, '')); setProblem(null); }}
                  aria-invalid={gErr} aria-describedby={gErr ? 'booking-error' : 'guest-hint'} className="field w-24 text-center font-display text-3xl min-[400px]:w-28" />
                <button type="button" aria-label="Increase guests" onClick={() => adjustGuests(gstep)} className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-plum text-plum"><Icon name="plus" /></button>
              </div>
              <p id="guest-hint" className="mt-3 text-center text-xs text-charcoal/70">Between {min} and {max} guests{business.guestLimits.verified ? '' : ' (final capacity is confirmed by management)'}. The buttons change the number by {gstep}.</p>
            </div>
          </div>
        )}

        {step === 3 && (<div><div role="group" aria-labelledby="step-title" className="grid gap-3 sm:grid-cols-2">{bookingServices.map((s) => <Choice key={s} type="checkbox" name="services" value={s} checked={d.services.includes(s)} onChange={() => toggleService(s)}>{s}</Choice>)}</div><p className="mt-3 text-sm text-charcoal/70">Optional. Availability of each service is confirmed by our team.</p></div>)}

        {step === 4 && (
          <div role="radiogroup" aria-labelledby="step-title" className="grid gap-3 sm:grid-cols-3">
            {PACKAGES.map((p) => (
              <Choice key={p} type="radio" name="package" value={p} checked={d.packageName === p} onChange={() => set('packageName', p)}>
                <Icon name="crown" className="mb-2 text-gold-deep" />
                <span className="block font-display text-xl font-semibold">{p}</span>
                <span className="mt-1 block text-sm opacity-80">{CUSTOM_PACKAGE}</span>
              </Choice>
            ))}
            <div className="sm:col-span-3"><Choice type="radio" name="package" value={CUSTOM_PACKAGE} checked={d.packageName === CUSTOM_PACKAGE} onChange={() => set('packageName', CUSTOM_PACKAGE)}>{CUSTOM_PACKAGE}</Choice></div>
            <p className="text-sm text-charcoal/70 sm:col-span-3">Official package pricing and inclusions are provided by management.</p>
          </div>
        )}

        {step === 5 && renderSummary(true)}

        {step === DETAILS && (
          <form noValidate onSubmit={(e: any) => { e.preventDefault(); next(); }} className="grid gap-4 sm:grid-cols-2" aria-labelledby="step-title">
            <p className="text-sm text-charcoal/80 sm:col-span-2">
              {d.eventType} · {formatDate(d.date)} · {guestText.trim()} guests.{' '}
              <button type="button" onClick={() => jump(5)} className="min-h-11 text-gold-deep underline underline-offset-4">Review or change</button>
            </p>
            <div><label htmlFor="b-name" className="lbl">Full name</label><input id="b-name" autoComplete="name" enterKeyHint="next" maxLength={80} className="field" value={d.name} onChange={(e: any) => set('name', e.target.value)} aria-invalid={problem?.fieldId === 'b-name'} aria-describedby={problem?.fieldId === 'b-name' ? 'booking-error' : undefined} /></div>
            <div><label htmlFor="b-phone" className="lbl">Phone number</label><input id="b-phone" type="tel" autoComplete="tel" inputMode="tel" enterKeyHint="done" placeholder="0300 1234567" maxLength={20} className="field" value={d.phone} onChange={(e: any) => set('phone', e.target.value)} aria-invalid={problem?.fieldId === 'b-phone'} aria-describedby={problem?.fieldId === 'b-phone' ? 'booking-error' : undefined} /></div>
            <div className="sm:col-span-2"><label htmlFor="b-notes" className="lbl">Additional requirements <span className="font-normal text-charcoal/70">(optional)</span></label><textarea id="b-notes" rows={3} maxLength={500} className="field" value={d.notes} onChange={(e: any) => set('notes', e.target.value)} /></div>
            <button type="submit" tabIndex={-1} className="sr-only">Prepare enquiry</button>
          </form>
        )}

        {step === LAST && prepared && (
          <div>
            <p className="mb-3 text-sm text-charcoal/80">Your enquiry is ready. It is <strong>not a confirmed booking</strong>. Our management team will contact you to confirm availability and details.</p>
            {renderSummary(false)}
            <p className="mb-2 mt-5 text-sm font-medium text-plum">Message that will be sent</p>
            <pre className="mb-6 max-h-64 overflow-auto whitespace-pre-wrap break-words border border-gold/50 bg-white p-4 font-sans text-sm leading-relaxed">{message}</pre>
            <EnquiryActions message={message} />
            <button type="button" onClick={reset} className="mt-6 min-h-11 text-sm text-plum underline underline-offset-4">Start a new enquiry</button>
          </div>
        )}
      </div>

      <div role="alert" aria-atomic="true">
        {problem && <p id="booking-error" className="mt-5 border-l-2 border-red-700 bg-red-50 px-4 py-2 text-sm text-red-800">{problem.message}</p>}
      </div>

      {step < LAST ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={back} disabled={step === 0} className="btn btn-plum-outline disabled:invisible"><Icon name="chevronLeft" size={18} />Back</button>
          <button type="button" onClick={next} className="btn btn-plum">{step === DETAILS ? 'Prepare enquiry' : 'Continue'}<Icon name="chevronRight" size={18} /></button>
        </div>
      ) : (
        <div className="mt-6"><button type="button" onClick={() => { setStep(DETAILS); }} className="btn btn-plum-outline"><Icon name="chevronLeft" size={18} />Edit details</button></div>
      )}
    </div>
  );
}
