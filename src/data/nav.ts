export const navLinks = [
  { label: 'Home', id: 'home' },
  { label: 'About', id: 'about' },
  { label: 'Our Venues', id: 'venues' },
  { label: 'Services', id: 'services' },
  { label: 'Events', id: 'events' },
  { label: 'Gallery', id: 'gallery' },
  { label: 'Booking', id: 'booking' },
  { label: 'Contact', id: 'contact' },
] as const;

/** Sections that are not in the menu, mapped to the menu item they belong to (for active highlighting). */
export const navAliases: Record<string, string> = { why: 'about', faq: 'booking', location: 'contact' };
export const navIds: readonly string[] = navLinks.map((l) => l.id);
