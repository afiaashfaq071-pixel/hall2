import type { SceneKind } from './venues';
export type GalleryItem = { id: string; category: GalleryCategory; alt: string; scene: SceneKind; photo?: string; tall?: boolean };
export const galleryCategories = ['All', 'Hall Interiors', 'Wedding Stages', 'Decorations', 'Dining Arrangements', 'Outdoor Spaces', 'Special Events'] as const;
export type GalleryCategory = Exclude<(typeof galleryCategories)[number], 'All'>;

/**
 * `alt` describes the photograph that belongs in this slot. Until `photo` is set, an illustrated placeholder is shown
 * (clearly labelled as a placeholder for assistive tech). TODO(management): add `photo: '/images/gallery-01.jpg'` per item.
 */
export const gallery: GalleryItem[] = [
  { id: 'g1', category: 'Hall Interiors', scene: 'hall', tall: true, alt: 'Banquet hall interior with arched ceiling and chandeliers' },
  { id: 'g2', category: 'Wedding Stages', scene: 'stage', alt: 'Wedding stage with floral backdrop' },
  { id: 'g3', category: 'Decorations', scene: 'decor', alt: 'Hall decorated with hanging florals' },
  { id: 'g4', category: 'Dining Arrangements', scene: 'dining', tall: true, alt: 'Round guest tables set for dining' },
  { id: 'g5', category: 'Outdoor Spaces', scene: 'garden', alt: 'Outdoor space in the evening with string lights' },
  { id: 'g6', category: 'Special Events', scene: 'special', alt: 'Celebration with hanging lanterns' },
  { id: 'g7', category: 'Hall Interiors', scene: 'hall', alt: 'Hall seating layout for guests' },
  { id: 'g8', category: 'Wedding Stages', scene: 'stage', tall: true, alt: 'Stage framed by an arch' },
  { id: 'g9', category: 'Decorations', scene: 'decor', alt: 'Table centrepieces and decoration' },
];
