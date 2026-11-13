import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { RecordForm } from '@/components/admin/RecordForm';
import { loadRelations } from '@/lib/admin/data';
import { RESOURCES, isResourceKey } from '@/lib/admin/resources';
import { requireAdminPage } from '@/lib/auth/require-admin';

interface NewRecordPageProps {
  params: Promise<{ resource: string }>;
}

export async function generateMetadata({ params }: NewRecordPageProps): Promise<Metadata> {
  const { resource } = await params;
  return { title: isResourceKey(resource) ? `New ${RESOURCES[resource].singular.toLowerCase()}` : 'Not found' };
}

export default async function NewRecordPage({ params }: NewRecordPageProps) {
  const { resource: key } = await params;
  if (!isResourceKey(key) || RESOURCES[key].singleton) notFound();
  const resource = RESOURCES[key];
  const { supabase } = await requireAdminPage();
  const relations = await loadRelations(supabase, resource);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-head__crumb">
            <Link href={`/admin/${key}`}>{resource.plural}</Link>
          </p>
          <h1>New {resource.singular.toLowerCase()}</h1>
        </div>
      </header>
      <RecordForm resourceKey={key} id={null} initial={null} relations={relations} />
    </>
  );
}
