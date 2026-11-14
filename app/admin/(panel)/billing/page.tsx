import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/auth/require-admin';
import { BillingList } from '@/components/billing/BillingList';
import { toDocument } from '@/lib/billing/queries';
import { SITE_URL } from '@/lib/env';

export const metadata: Metadata = { title: 'Invoices and quotations' };
export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase
    .from('billing_documents')
    .select('*')
    .order('issue_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500);

  const documents = ((data ?? []) as Array<Record<string, unknown>>).map(toDocument);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Invoices and quotations</h1>
          <p>Create a document, then share its link with the client to view or download the PDF.</p>
        </div>
      </header>
      <BillingList documents={documents} siteUrl={SITE_URL} />
    </>
  );
}
