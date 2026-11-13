'use client';

import { useCallback, useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiExternalLink, FiX } from 'react-icons/fi';

export interface LightboxItem {
  id: string;
  url: string;
  title: string;
  caption?: string;
  description?: string;
  externalUrl?: string;
  meta?: string;
}

interface LightboxProps {
  items: LightboxItem[];
  index: number | null;
  onChange: (index: number | null) => void;
}

// Full-size image viewer built on the native <dialog>, which provides the
// focus trap, Escape handling and inert background.
export function Lightbox({ items, index, onChange }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = index !== null && index >= 0 && index < items.length;
  const item = isOpen ? items[index] : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const step = useCallback(
    (delta: number) => {
      if (index === null || items.length < 2) return;
      onChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onChange],
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, step]);

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-label={item?.title || 'Image preview'}
      onClose={() => onChange(null)}
      onClick={(event) => {
        if (event.target === dialogRef.current) onChange(null);
      }}
    >
      {item ? (
        <div className="lightbox__frame">
          <div className="lightbox__toolbar">
            <p className="lightbox__count" aria-live="polite">
              {index! + 1} / {items.length}
            </p>
            <button type="button" className="lightbox__button" onClick={() => onChange(null)} aria-label="Close preview">
              <FiX aria-hidden="true" />
            </button>
          </div>

          <div className="lightbox__stage">
            {items.length > 1 ? (
              <button
                type="button"
                className="lightbox__button lightbox__button--prev"
                onClick={() => step(-1)}
                aria-label="Previous image"
              >
                <FiChevronLeft aria-hidden="true" />
              </button>
            ) : null}

            {/* Full-size preview: deliberately not resized by the image optimiser. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={item.id} src={item.url} alt={item.title || item.caption || 'Preview'} className="lightbox__image" />

            {items.length > 1 ? (
              <button
                type="button"
                className="lightbox__button lightbox__button--next"
                onClick={() => step(1)}
                aria-label="Next image"
              >
                <FiChevronRight aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className="lightbox__caption">
            <div>
              {item.meta ? <p className="lightbox__meta">{item.meta}</p> : null}
              {item.title ? <h2 className="lightbox__title">{item.title}</h2> : null}
              {item.caption ? <p>{item.caption}</p> : null}
              {item.description ? <p className="lightbox__description">{item.description}</p> : null}
            </div>
            {item.externalUrl ? (
              <a className="btn btn--outline btn--small" href={item.externalUrl} target="_blank" rel="noopener noreferrer">
                View project <FiExternalLink aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
