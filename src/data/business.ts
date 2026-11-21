/**
 * Central business configuration.
 * Only facts supplied by the client live here. Anything unverified is null / flagged.
 */
export const business = {
  name: 'Gulshan Banquet Hall',
  shortName: 'Gulshan',
  tagline: 'Where Every Celebration Becomes a Beautiful Memory',
  subtitle: "Celebrate life's most precious moments with elegance, comfort and unforgettable hospitality.",
  address: {
    street: 'Sambrial Road',
    area: 'Bopalwala',
    city: 'Sialkot',
    country: 'Pakistan',
    full: 'Sambrial Road, Bopalwala, Sialkot, Pakistan',
  },
  /** The tel: link is derived from this value (see lib/contact.ts), so the two can never disagree. */
  phone: { display: '052 6501632' },

  /**
   * TODO(management): official WhatsApp-enabled number, international format, digits only
   * (e.g. '923001234567'). While null (or invalid) all WhatsApp buttons are hidden.
   */
  whatsappNumber: null as string | null,

  /** TODO(management): confirm official email. Intentionally absent (never invented). */
  email: null as string | null,

  /** Only add links once management confirms the official pages. */
  social: [] as { label: string; url: string }[],

  /**
   * By default the map is a Google Maps search for the address (approximate, shown with a notice).
   * TODO(management): open the business on Google Maps > Share > Embed a map, paste the iframe `src` into
   * `embedUrl`, then set `verifiedPin: true`.
   */
  map: {
    query: 'Gulshan Banquet Hall, Sambrial Road, Bopalwala, Sialkot, Pakistan',
    embedUrl: null as string | null,
    verifiedPin: false,
  },

  /** TODO(management): real photos in /public/images (see README there), use JPG, e.g. '/images/hero-desktop.jpg'. */
  hero: {
    desktop: null,
    mobile: null,
    alt: 'Gulshan Banquet Hall interior prepared for a celebration',
  },

  /**
   * Guest limits are PLACEHOLDER bounds for validation only.
   * TODO(management): set to the real hall capacity.
   */
  guestLimits: { min: 10, max: 1500, step: 10, verified: false },

  /** Production URL, e.g. 'https://www.example.com'. Can also be set with the SITE_URL env var at build time. */
  siteUrl: '',
} as const;
