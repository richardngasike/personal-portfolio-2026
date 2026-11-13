'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Lightbox, type LightboxItem } from './Lightbox';

interface ScreenshotGridProps {
  images: Array<{ id: string; url: string; caption: string; alt_text: string }>;
  projectTitle: string;
}

export function ScreenshotGrid({ images, projectTitle }: ScreenshotGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items: LightboxItem[] = images.map((image) => ({
    id: image.id,
    url: image.url,
    title: image.caption || projectTitle,
  }));

  return (
    <>
      <ul className="screenshot-grid">
        {images.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              className="screenshot"
              onClick={() => setOpenIndex(index)}
              aria-label={`Open screenshot ${index + 1} of ${images.length} in full size`}
            >
              <span className="screenshot__media">
                <Image
                  src={image.url}
                  alt={image.alt_text || image.caption || `${projectTitle} screenshot ${index + 1}`}
                  fill
                  sizes="(max-width: 720px) 100vw, 560px"
                />
              </span>
              {image.caption ? <span className="caption screenshot__caption">{image.caption}</span> : null}
            </button>
          </li>
        ))}
      </ul>
      <Lightbox items={items} index={openIndex} onChange={setOpenIndex} />
    </>
  );
}
