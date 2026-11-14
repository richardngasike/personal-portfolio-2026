'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiCheck, FiCopy, FiEdit2, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';
import { deleteBillingDocument } from '@/lib/billing/actions';
import { formatMoney, formatDate } from '@/lib/billing/compute';
import { KIND_LABELS, STATUS_LABELS, type BillingDocument } from '@/lib/billing/types';

interface BillingListProps {
  documents: BillingDocument[];
  siteUrl: string;
}

export function BillingList({ documents: initial, siteUrl }: BillingListProps) {
  const router = useRouter();
  const toast = useToast();
  const [documents, setDocuments] = useState(initial);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | 'invoice' | 'quotation'>('all');
  const [toDelete, setToDelete] = useState<BillingDocument | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return documents.filter((doc) => {
      if (kindFilter !== 'all' && doc.kind !== kindFilter) return false;
      if (!term) return true;
      return [doc.number, doc.client_name, doc.client_company, doc.title].some((v) => v.toLowerCase().includes(term));
    });
  }, [documents, search, kindFilter]);

  async function copyLink(doc: BillingDocument) {
    const url = `${siteUrl}/${doc.share_path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(doc.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.prompt('Copy this link', url);
    }
  }

  function confirmDelete() {
    if (!toDelete) return;
    const target = toDelete;
    startTransition(async () => {
      const result = await deleteBillingDocument(target.id);
      setToDelete(null);
      if (result.ok) {
        setDocuments((c) => c.filter((d) => d.id !== target.id));
        toast.success(result.message || 'Deleted.');
        router.refresh();
      } else {
        toast.error(result.message || 'The document could not be deleted.');
      }
    });
  }

  return (
    <div className="resource">
      <div className="toolbar">
        <label className="toolbar__search">
          <FiSearch aria-hidden="true" />
          <span className="visually-hidden">Search documents</span>
          <input type="search" placeholder="Search by number, client or title" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label className="toolbar__select">
          <span className="visually-hidden">Filter by type</span>
          <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as typeof kindFilter)}>
            <option value="all">All documents</option>
            <option value="invoice">Invoices</option>
            <option value="quotation">Quotations</option>
          </select>
        </label>
        <div className="toolbar__new">
          <Link href="/admin/billing/new?kind=quotation" className="abtn abtn--ghost"><FiPlus aria-hidden="true" /> Quotation</Link>
          <Link href="/admin/billing/new?kind=invoice" className="abtn abtn--primary"><FiPlus aria-hidden="true" /> Invoice</Link>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="empty">
          <p>No invoices or quotations yet.</p>
          <Link href="/admin/billing/new?kind=invoice" className="abtn abtn--primary"><FiPlus aria-hidden="true" /> Create your first invoice</Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty"><p>Nothing matches the current search or filter.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Number</th>
                <th scope="col">Client</th>
                <th scope="col">Date</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
                <th scope="col" className="table__actions"><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((doc) => (
                <tr key={doc.id}>
                  <td data-label="Number">
                    <Link href={`/admin/billing/${doc.id}`} className="table__link">{doc.number}</Link>
                    <span className="table__subtitle">{KIND_LABELS[doc.kind]}</span>
                  </td>
                  <td data-label="Client">
                    {doc.client_name}
                    {doc.client_company ? <span className="table__subtitle">{doc.client_company}</span> : null}
                  </td>
                  <td data-label="Date">{formatDate(doc.issue_date)}</td>
                  <td data-label="Total">{formatMoney(doc.total, doc.currency)}</td>
                  <td data-label="Status"><span className="pill" data-billing-status={doc.status}>{STATUS_LABELS[doc.status]}</span></td>
                  <td className="table__actions">
                    <div className="row-actions">
                      <button type="button" className="icon-button" onClick={() => copyLink(doc)} disabled={doc.status === 'draft'} aria-label={`Copy link for ${doc.number}`} title={doc.status === 'draft' ? 'Publish first to share' : 'Copy link'}>
                        {copiedId === doc.id ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
                      </button>
                      <Link href={`/admin/billing/${doc.id}`} className="icon-button" aria-label={`Edit ${doc.number}`} title="Edit"><FiEdit2 aria-hidden="true" /></Link>
                      <button type="button" className="icon-button icon-button--danger" onClick={() => setToDelete(doc)} aria-label={`Delete ${doc.number}`} title="Delete"><FiTrash2 aria-hidden="true" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete ${toDelete?.number}?`}
        message="This permanently deletes the document and immediately stops its shared link from working. This cannot be undone."
        busy={pending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
