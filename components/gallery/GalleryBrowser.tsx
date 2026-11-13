'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Lightbox, type LightboxItem } from './Lightbox';
import type { GalleryItem } from '@/types/portfolio';

interface GalleryBrowserProps {
  items: GalleryItem[];
  categories: Array<{ slug: string; name: string }>;
}

export function GalleryBrowser({ items, categories }: GalleryBrowserProps) {
  const [active, setActive] = useState('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const visible = useMemo(
    () => (active === 'all' ? items : items.filter((item) => item.categorySlug === active)),
    [active, items],
  );

  const lightboxItems: LightboxItem[] = useMemo(
    () =>
      visible.map((item) => ({
        id: item.id,
        url: item.url,
        title: item.title,
        caption: item.caption,
        description: item.description,
        externalUrl: item.externalUrl,
        meta: item.categoryName ?? undefined,
      })),
    [visible],
  );

  return (
    <div>
      {categories.length > 1 ? (
        <div className="filter-bar" role="group" aria-label="Filter work by category">
          <button
            type="button"
            className="filter-bar__button"
            aria-pressed={active === 'all'}
            onClick={() => setActive('all')}
          >
            All Work
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              className="filter-bar__button"
              aria-pressed={active === category.slug}
              onClick={() => setActive(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
      ) : null}

      <ul className="gallery-grid">
        {visible.map((item, index) => (
          <li key={item.id} className="gallery-tile">
            <button
              type="button"
              className="gallery-tile__button"
              onClick={() => setOpenIndex(index)}
              aria-label={`Open ${item.title || 'image'} in full size`}
            >
              <span className="gallery-tile__media">
                <Image
                  src={item.url}
                  alt={item.title || item.caption || 'Design work'}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 380px"
                />
              </span>
              <span className="gallery-tile__caption">
                {item.categoryName ? <span className="gallery-tile__category">{item.categoryName}</span> : null}
                {item.title ? <span className="gallery-tile__title">{item.title}</span> : null}
                {item.caption ? <span className="gallery-tile__text">{item.caption}</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Lightbox items={lightboxItems} index={openIndex} onChange={setOpenIndex} />
    </div>
  );
}
