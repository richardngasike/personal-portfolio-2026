import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProjectImagesManager } from '@/components/admin/ProjectImagesManager';
import { RecordForm } from '@/components/admin/RecordForm';
import { loadRelations } from '@/lib/admin/data';
import { RESOURCES, isResourceKey } from '@/lib/admin/resources';
import { requireAdminPage } from '@/lib/auth/require-admin';
import type { ProjectImageRow } from '@/types/database';

interface EditRecordPageProps {
  params: Promise<{ resource: string; id: string }>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: EditRecordPageProps): Promise<Metadata> {
  const { resource } = await params;
  return { title: isResourceKey(resource) ? `Edit ${RESOURCES[resource].singular.toLowerCase()}` : 'Not found' };
}

export default async function EditRecordPage({ params }: EditRecordPageProps) {
  const { resource: key, id } = await params;
  if (!isResourceKey(key) || RESOURCES[key].singleton || !UUID_PATTERN.test(id)) notFound();
  const resource = RESOURCES[key];
  const { supabase } = await requireAdminPage();

  const [{ data: row }, relations] = await Promise.all([
    supabase.from(resource.table).select('*').eq('id', id).maybeSingle(),
    loadRelations(supabase, resource),
  ]);
  if (!row) notFound();

  let screenshots: ProjectImageRow[] = [];
  if (key === 'projects') {
    const { data } = await supabase
      .from('project_images')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true });
    screenshots = (data ?? []) as ProjectImageRow[];
  }

  const title = String(row[resource.titleField] || 'Untitled');

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-head__crumb">
            <Link href={`/admin/${key}`}>{resource.plural}</Link>
          </p>
          <h1>{title}</h1>
        </div>
        {key === 'projects' && row.published ? (
          <a className="abtn abtn--ghost" href={`/projects/${row.slug}`} target="_blank" rel="noopener noreferrer">
            View on site
          </a>
        ) : null}
      </header>
      <RecordForm resourceKey={key} id={id} initial={row} relations={relations} />
      {key === 'projects' ? <ProjectImagesManager projectId={id} images={screenshots} /> : null}
    </>
  );
}
