import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth/require-admin';
import { BillingForm } from '@/components/billing/BillingForm';
import { ShareLinkPanel } from '@/components/billing/ShareLinkPanel';
import { toDocument, shareUrl } from '@/lib/billing/queries';
import { KIND_LABELS } from '@/lib/billing/types';

export const metadata: Metadata = { title: 'Edit document' };
export const dynamic = 'force-dynamic';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBillingPage({ params }: EditPageProps) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from('billing_documents').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();

  const document = toDocument(data);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-head__crumb"><Link href="/admin/billing">Invoices and quotations</Link></p>
          <h1>{KIND_LABELS[document.kind]} {document.number}</h1>
        </div>
      </header>
      <ShareLinkPanel document={document} url={shareUrl(document.share_path)} />
      <BillingForm kind={document.kind} id={document.id} initial={document} />
    </>
  );
}
