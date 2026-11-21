export type Venue = {
  id: string;
  name: string;
  description: string;
  capacity?: string; // only when verified
  facilities: string[];
  photo?: string;
  scene: SceneKind;
};
export type SceneKind = 'hall' | 'stage' | 'decor' | 'dining' | 'garden' | 'special' | 'hero';

/**
 * TODO(management): add each separate space ONLY once confirmed (name, capacity, facilities).
 * While this array is empty the site shows one general venue showcase and does not
 * pretend there are multiple halls.
 */
export const verifiedVenues: Venue[] = [];

export const generalShowcase = {
  name: 'Gulshan Banquet Hall',
  description:
    'A celebration venue on Sambrial Road, Bopalwala, Sialkot, prepared for weddings and family occasions. Spaces, capacity and facilities are confirmed personally by our team for your date, so you plan with accurate information.',
  scene: 'hall' as SceneKind,
};
