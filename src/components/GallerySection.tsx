import { useState } from 'react';
import { SectionHeading } from './SectionHeading';
import { Lightbox } from './Lightbox';
import { Photo } from './Photo';
import { Icon } from './Icon';
import { gallery, galleryCategories } from '../data/gallery';

export function GallerySection() {
  const [cat, setCat] = useState<(typeof galleryCategories)[number]>('All');
  const [open, setOpen] = useState<number | null>(null);
  const items = cat === 'All' ? gallery : gallery.filter((g) => g.category === cat);

  return (
    <section id="gallery" className="bg-ivory py-20 sm:py-28">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <SectionHeading eyebrow="Gallery" title="A glimpse of the celebrations">
          Illustrated placeholders are shown until official Gulshan Banquet Hall photographs are added.
        </SectionHeading>

        <div role="group" aria-label="Filter gallery by category" className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          {galleryCategories.map((c) => (
            <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
              className={`min-h-11 shrink-0 border px-5 text-sm transition-colors ${cat === c ? 'border-plum bg-plum text-gold' : 'border-gold-deep/60 text-charcoal hover:border-plum'}`}>{c}</button>
          ))}
        </div>
        <p role="status" className="mb-6 text-sm text-charcoal/70">Showing {items.length} {items.length === 1 ? 'image' : 'images'}{cat === 'All' ? '' : ` in ${cat}`}</p>

        {items.length === 0 ? <p className="py-10 text-center text-charcoal/70">No images in this category yet.</p> : (
          <div className="gallery-grid" key={cat}>
            {items.map((g, i) => (
              <button key={g.id} type="button" onClick={() => setOpen(i)} aria-label={`View larger: ${g.alt}`}
                className={`gal-item group relative block w-full overflow-hidden ${g.tall ? 'aspect-[3/4]' : 'aspect-[4/3]'}`} style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
                <div className="h-full transition-transform duration-700 group-hover:scale-105"><Photo photo={g.photo} scene={g.scene} alt={g.alt} /></div>
                <span className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-plum/80 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="text-sm text-ivory">{g.category}</span><Icon name="expand" size={18} className="text-gold" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {open !== null && items[open] && <Lightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </section>
  );
}
