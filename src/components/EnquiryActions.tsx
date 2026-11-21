import { useEffect, useRef, useState } from 'react';
import { whatsappLink } from '../lib/enquiry';
import { copyText } from '../lib/clipboard';
import { phoneDisplay, telHref } from '../lib/contact';
import { Icon } from './Icon';

type CopyState = 'idle' | 'copied' | 'failed';

/** Send options for a prepared enquiry. WhatsApp only appears when a verified number is configured. */
export function EnquiryActions({ message }: { message: string }) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fallback = useRef<HTMLTextAreaElement | null>(null);
  const wa = whatsappLink(message);

  useEffect(() => () => clearTimeout(timer.current), []);
  // A new/edited message invalidates any earlier "copied" confirmation.
  useEffect(() => setState('idle'), [message]);
  useEffect(() => { if (state === 'failed') { fallback.current?.focus(); fallback.current?.select(); } }, [state]);

  const copy = async () => {
    clearTimeout(timer.current);
    const ok = await copyText(message);
    setState(ok ? 'copied' : 'failed');
    if (ok) timer.current = setTimeout(() => setState('idle'), 3000);
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-gold"><Icon name="chat" size={18} />Send on WhatsApp</a>}
        <a href={telHref} className={`btn ${wa ? 'btn-plum' : 'btn-gold'}`}><Icon name="phone" size={18} />Call {phoneDisplay}</a>
        <button type="button" onClick={copy} className="btn btn-plum-outline"><Icon name={state === 'copied' ? 'check' : 'copy'} size={18} />{state === 'copied' ? 'Copied' : 'Copy enquiry'}</button>
      </div>

      <div role="status" aria-live="polite" className="mt-3 text-sm text-charcoal/80">
        {state === 'copied' && 'Enquiry copied to your clipboard. Paste it into WhatsApp or SMS to send.'}
      </div>
      {state === 'failed' && (
        <div role="alert" className="mt-3 border-l-2 border-red-700 bg-red-50 p-3 text-sm text-red-800">
          <p>Your browser blocked copying, so nothing was copied. Select the text below and copy it manually (long-press on a phone, Ctrl+C on a computer).</p>
          <label htmlFor="copy-fallback" className="sr-only">Enquiry text to copy</label>
          <textarea id="copy-fallback" ref={fallback} readOnly rows={6} value={message} onFocus={(e: any) => e.target.select()} className="field mt-2 text-sm" />
        </div>
      )}
      {wa
        ? <p className="mt-3 text-sm text-charcoal/70">WhatsApp opens with your message ready. Press Send there to submit it. Nothing is sent until you do.</p>
        : <p className="mt-3 text-sm text-charcoal/70">WhatsApp sending will be enabled once the official WhatsApp number is confirmed. For now, copy your enquiry or call us.</p>}
    </div>
  );
}
