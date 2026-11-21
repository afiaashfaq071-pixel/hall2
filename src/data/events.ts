
import type { SceneKind } from './venues';

export type EventType = {
  id: string;
  title: string;
  text: string;
  scene: SceneKind;
  photo?: string;
};

export const events: EventType[] = [
  {
    id: 'mehndi',
    title: 'Mehndi',
    text: 'Colour, music and family joy to open the wedding celebrations.',
    scene: 'decor',
  },
  {
    id: 'baraat',
    title: 'Baraat',
    text: 'A grand welcome for the groom and his family.',
    scene: 'hall',
  },
  {
    id: 'walima',
    title: 'Walima',
    text: 'An elegant reception to celebrate the newlyweds.',
    scene: 'dining',
  },
  {
    id: 'nikkah',
    title: 'Nikkah',
    text: 'A graceful, intimate setting for the ceremony.',
    scene: 'stage',
  },
  {
    id: 'engagement',
    title: 'Engagement',
    text: 'A beautiful start to the journey ahead.',
    scene: 'special',
  },
  {
    id: 'birthday',
    title: 'Birthday Celebrations',
    text: 'Parties that bring loved ones together.',
    scene: 'special',
  },
  {
    id: 'corporate',
    title: 'Corporate Functions',
    text: 'Gatherings with a professional, polished feel.',
    scene: 'hall',
  },
  {
    id: 'family',
    title: 'Family Gatherings',
    text: 'Room for the whole family to celebrate.',
    scene: 'garden',
  },
];

export const bookingEventTypes = [
  'Mehndi',
  'Baraat',
  'Walima',
  'Nikkah',
  'Engagement',
  'Birthday',
  'Corporate Event',
  'Other',
] as const;
