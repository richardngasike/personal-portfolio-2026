import type { Metadata } from 'next';
import '@/styles/components/gallery.css';
import '@/styles/pages/creative-work.css';
import { PageHeader } from '@/components/shared/PageHeader';
import { ContactCta } from '@/components/shared/ContactCta';
import { GalleryBrowser } from '@/components/gallery/GalleryBrowser';
import { pageMetadata } from '@/lib/seo';
import { getGallery } from '@/lib/queries/public';

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: 'Creative work: brand identity, publication and graphic design',
  description:
    'Graphic design by Richard Ngasike: brand identity, logos, publications, posters, infographics, data visualisation and presentation design.',
  path: '/creative-work',
});

export default async function CreativeWorkPage() {
  const { categories, items } = await getGallery();

  return (
    <>
      <PageHeader
        path="/creative-work"
        eyebrow="Creative work"
        title="Visual communication, design and brand identity."
        lead="Visual communication, design and brand identity. Select any piece to view it at full size."
      />

      <section className="section section--flush-top">
        <div className="container">
          {items.length > 0 ? (
            <GalleryBrowser
              items={items}
              categories={categories.map((category) => ({ slug: category.slug, name: category.name }))}
            />
          ) : (
            <p className="empty-state">Design work has not been published yet.</p>
          )}
        </div>
      </section>

      <ContactCta />
    </>
  );
}
