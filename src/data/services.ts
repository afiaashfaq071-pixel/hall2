export type Service = {
  id: string;
  title: string;
  blurb: string;
  items: string[];
  icon: 'heart' | 'utensils' | 'flower' | 'clipboard' | 'briefcase' | 'cake';
  /** false => shown as "Enquire to confirm" until management confirms */
  confirmed: boolean;
};

export const services: Service[] = [
  { id: 'wedding', title: 'Wedding Events', icon: 'heart', blurb: 'Every ceremony of the wedding season under one roof.', items: ['Mehndi', 'Baraat', 'Walima', 'Nikkah'], confirmed: false },
  { id: 'catering', title: 'Catering Services', icon: 'utensils', blurb: 'Menus and dining arrangements for your guests.', items: ['Wedding menus', 'Food arrangements', 'Buffet presentation', 'Dining management'], confirmed: false },
  { id: 'decor', title: 'Decoration', icon: 'flower', blurb: 'Stage and table styling shaped around your theme.', items: ['Wedding stage decoration', 'Floral arrangements', 'Table styling', 'Theme-based decoration'], confirmed: false },
  { id: 'management', title: 'Event Management', icon: 'clipboard', blurb: 'Coordination so the family can enjoy the day.', items: ['Event coordination', 'Guest arrangements', 'Event planning', 'Venue preparation'], confirmed: false },
  { id: 'corporate', title: 'Corporate Events', icon: 'briefcase', blurb: 'Professional gatherings in a refined setting.', items: ['Business gatherings', 'Meetings', 'Corporate celebrations'], confirmed: false },
  { id: 'family', title: 'Family Celebrations', icon: 'cake', blurb: 'Milestones with the people who matter most.', items: ['Birthday parties', 'Anniversaries', 'Family functions'], confirmed: false },
];

export const bookingServices = ['Catering', 'Decoration', 'Stage Setup', 'Event Management', 'Other Services'] as const;
