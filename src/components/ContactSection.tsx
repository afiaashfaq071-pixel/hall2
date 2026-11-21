import { useMemo, useState } from 'react';
import { SectionHeading } from './SectionHeading';
import { EnquiryActions } from './EnquiryActions';
import { business } from '../data/business';
import { validateName, validatePhone } from '../lib/enquiry';
import { normalizePkPhone } from '../lib/phone';
import { phoneDisplay, telHref } from '../lib/contact';

export function ContactSection() {
  const [f, setF] = useState({ name: '', phone: '', message: '' });
  const [errs, setErrs] = useState<{ name?: string; phone?: string; message?: string }>({});
  const [ready, setReady] = useState(false);
  const message = useMemo(() => [`Assalam o Alaikum, I have a question for ${business.name}.`, '', `Name: ${f.name.replace(/\s+/g, ' ').trim()}`, `Phone: ${normalizePkPhone(f.phone)?.display ?? f.phone.trim()}`, '', f.message.trim()].join('\n'), [f]);
  const upd = (k: 'name' | 'phone' | 'message') => (e: any) => { setF({ ...f, [k]: e.target.value }); setReady(false); };

  const submit = (e: any) => {
    e.preventDefault();
    const n: typeof errs = {};
    const nm = validateName(f.name), ph = validatePhone(f.phone);
    if (!nm.ok) n.name = nm.message;
    if (!ph.ok) n.phone = ph.message;
    if (f.message.trim().length < 5) n.message = 'Please write a short message (at least 5 characters).';
    setErrs(n);
    setReady(Object.keys(n).length === 0);
    const first = n.name ? 'c-name' : n.phone ? 'c-phone' : n.message ? 'c-msg' : null;
    if (first) document.getElementById(first)?.focus(); // errors keep what was typed and send focus to the first problem
  };

  return (
    <section id="contact" className="dark-zone bg-plum py-20 sm:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Contact" title="Let’s talk about your celebration" light>Prefer to speak with someone? Call {phoneDisplay}. Or leave a message and choose how to send it.</SectionHeading>
          <p className="font-display text-3xl text-gold"><a href={telHref} className="inline-flex min-h-11 items-center">{phoneDisplay}</a></p>
          <p className="mt-2 text-ivory/70">{business.address.full}</p>
        </div>
        <form onSubmit={submit} noValidate className="light-zone bg-ivory p-5 sm:p-9" aria-label="Contact form">
          <div className="grid gap-5">
            <div><label htmlFor="c-name" className="lbl">Full name</label><input id="c-name" autoComplete="name" maxLength={80} className="field" value={f.name} onChange={upd('name')} aria-invalid={!!errs.name} aria-describedby={errs.name ? 'c-name-e' : undefined} />{errs.name && <p id="c-name-e" className="err">{errs.name}</p>}</div>
            <div><label htmlFor="c-phone" className="lbl">Phone number</label><input id="c-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="0300 1234567" className="field" value={f.phone} onChange={upd('phone')} aria-invalid={!!errs.phone} aria-describedby={errs.phone ? 'c-phone-e' : undefined} />{errs.phone && <p id="c-phone-e" className="err">{errs.phone}</p>}</div>
            <div><label htmlFor="c-msg" className="lbl">Message</label><textarea id="c-msg" rows={4} maxLength={800} className="field" value={f.message} onChange={upd('message')} aria-invalid={!!errs.message} aria-describedby={errs.message ? 'c-msg-e' : undefined} />{errs.message && <p id="c-msg-e" className="err">{errs.message}</p>}</div>
            <button type="submit" className="btn btn-plum justify-self-start">Prepare message</button>
          </div>
          {ready && (
            <div className="mt-7 border-t border-gold/40 pt-6">
              <p role="status" className="mb-4 text-sm text-charcoal/80">Your message is ready. It has <strong>not been sent yet</strong>. Choose how to send it:</p>
              <EnquiryActions message={message} />
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
