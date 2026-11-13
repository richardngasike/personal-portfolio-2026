import type { Metadata } from 'next';

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  image?: string | null;
}

// Per-page metadata. Titles are completed by the template in app/layout.tsx.
export function pageMetadata({ title, description, path, image }: PageMetaInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: 'website',
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}
