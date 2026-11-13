import type { Metadata } from 'next';
import Link from 'next/link';
import { GalleryUploader } from '@/components/admin/GalleryUploader';
import { requireAdminPage } from '@/lib/auth/require-admin';

export const metadata: Metadata = { title: 'Upload gallery images' };

export default async function GalleryUploadPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from('gallery_categories').select('id, name').order('sort_order', { ascending: true });

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-head__crumb">
            <Link href="/admin/gallery">Creative gallery</Link>
          </p>
          <h1>Upload images</h1>
        </div>
      </header>
      <GalleryUploader categories={(data ?? []).map((category) => ({ value: category.id, label: category.name }))} />
    </>
  );
}
