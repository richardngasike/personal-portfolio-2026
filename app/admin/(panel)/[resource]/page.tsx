import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RecordForm } from '@/components/admin/RecordForm';
import { ResourceList } from '@/components/admin/ResourceList';
import { loadRelations } from '@/lib/admin/data';
import { RESOURCES, isResourceKey } from '@/lib/admin/resources';
import { requireAdminPage } from '@/lib/auth/require-admin';

interface ResourcePageProps {
  params: Promise<{ resource: string }>;
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const { resource } = await params;
  return { title: isResourceKey(resource) ? RESOURCES[resource].plural : 'Not found' };
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { resource: key } = await params;
  if (!isResourceKey(key)) notFound();
  const resource = RESOURCES[key];
  const { supabase } = await requireAdminPage();

  if (resource.singleton) {
    const { data } = await supabase.from(resource.table).select('*').maybeSingle();
    return (
      <>
        <header className="page-head">
          <div>
            <h1>{resource.plural}</h1>
            <p>{resource.description}</p>
          </div>
        </header>
        <RecordForm resourceKey={key} id={null} initial={data ?? null} relations={{}} />
      </>
    );
  }

  let query = supabase.from(resource.table).select('*');
  if (resource.orderable) query = query.order('sort_order', { ascending: true });
  const [{ data: rows }, relations] = await Promise.all([query, loadRelations(supabase, resource)]);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>{resource.plural}</h1>
          <p>{resource.description}</p>
        </div>
      </header>
      <ResourceList
        resourceKey={key}
        rows={(rows ?? []) as Array<Record<string, unknown> & { id: string }>}
        relations={relations}
        secondaryAction={key === 'gallery' ? { href: '/admin/gallery/upload', label: 'Upload several images' } : undefined}
      />
    </>
  );
}
