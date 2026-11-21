/**
 * Everything that goes into <head>, generated at BUILD time from the same business data the app uses
 * (scripts/build.mjs bundles this file). Nothing here is invented: unknown values are simply omitted.
 */
import { business } from './business';
import { phoneDisplay, phoneE164 } from '../lib/contact';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const seo = {
  title: `${business.name} | Wedding & Event Venue in ${business.address.city}`,
  description: `${business.name} on ${business.address.street}, ${business.address.area}, ${business.address.city}. Plan a wedding, mehndi, walima or family celebration. Send an enquiry or call ${phoneDisplay}.`,
  themeColor: '#30212A',
};

export const buildJsonLd = (siteUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'EventVenue',
  name: business.name,
  description: seo.description,
  telephone: phoneE164,
  address: {
    '@type': 'PostalAddress',
    streetAddress: `${business.address.street}, ${business.address.area}`,
    addressLocality: business.address.city,
    addressCountry: 'PK',
  },
  // Optional fields appear ONLY when the underlying fact exists. No geo coordinates: the pin is not verified.
  ...(siteUrl ? { url: siteUrl } : {}),
  ...(siteUrl && business.hero.desktop ? { image: siteUrl + business.hero.desktop } : {}),
  ...(business.email ? { email: business.email } : {}),
  ...(business.social.length ? { sameAs: business.social.map((s) => s.url) } : {}),
});

export function renderHead(siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  const ogImage = base ? `${base}/og-default.png` : '';
  const t = (name: string, content: string, attr: 'name' | 'property' = 'name') => `<meta ${attr}="${name}" content="${esc(content)}" />`;
  const lines = [
    `<title>${esc(seo.title)}</title>`,
    t('description', seo.description),
    t('theme-color', seo.themeColor),
    base ? `<link rel="canonical" href="${esc(base)}/" />` : '<!-- canonical: set business.siteUrl or the SITE_URL env var -->',
    t('og:type', 'website', 'property'),
    t('og:site_name', business.name, 'property'),
    t('og:title', seo.title, 'property'),
    t('og:description', seo.description, 'property'),
    t('og:locale', 'en_PK', 'property'),
    ...(base ? [t('og:url', `${base}/`, 'property')] : []),
    ...(ogImage ? [t('og:image', ogImage, 'property'), t('og:image:width', '1200', 'property'), t('og:image:height', '630', 'property'), t('og:image:alt', `${business.name}, ${business.address.city}`, 'property')] : []),
    t('twitter:card', ogImage ? 'summary_large_image' : 'summary'),
    t('twitter:title', seo.title),
    t('twitter:description', seo.description),
    ...(ogImage ? [t('twitter:image', ogImage)] : []),
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
    ...(business.hero.mobile ? [`<link rel="preload" as="image" href="${esc(business.hero.mobile)}" media="(max-width: 767px)" fetchpriority="high" />`] : []),
    ...(business.hero.desktop ? [`<link rel="preload" as="image" href="${esc(business.hero.desktop)}" media="(min-width: 768px)" fetchpriority="high" />`] : []),
    `<script type="application/ld+json">${JSON.stringify(buildJsonLd(base)).replace(/</g, '\\u003c')}</script>`,
  ];
  return lines.join('\n    ');
}

/** Visible without JavaScript (and to crawlers that do not run it). Real details only. */
export const renderNoscript = () =>
  `<noscript><div style="font-family:Georgia,serif;max-width:36rem;margin:3rem auto;padding:0 1.25rem;color:#30212A"><h1>${esc(business.name)}</h1><p>${esc(business.address.full)}</p><p>Call <a href="tel:${phoneE164}">${esc(phoneDisplay)}</a> to enquire about your event.</p><p>Please enable JavaScript to use the online enquiry planner.</p></div></noscript>`;

export const siteUrlFromBusiness: string = business.siteUrl;
