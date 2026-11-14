import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth/require-admin';
import { BillingForm } from '@/components/billing/BillingForm';
import { KIND_LABELS, type BillingKind } from '@/lib/billing/types';

export const metadata: Metadata = { title: 'New document' };
export const dynamic = 'force-dynamic';

interface NewPageProps {
  searchParams: Promise<{ kind?: string }>;
}

export default async function NewBillingPage({ searchParams }: NewPageProps) {
  await requireAdminPage();
  const { kind: raw } = await searchParams;
  const kind: BillingKind = raw === 'quotation' ? 'quotation' : 'invoice';

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-head__crumb"><Link href="/admin/billing">Invoices and quotations</Link></p>
          <h1>New {KIND_LABELS[kind].toLowerCase()}</h1>
        </div>
      </header>
      <BillingForm kind={kind} id={null} initial={null} />
    </>
  );
}
