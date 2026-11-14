'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiCopy, FiExternalLink, FiDownload } from 'react-icons/fi';
import { useToast } from '@/components/admin/Toast';
import { setBillingStatus } from '@/lib/billing/actions';
import { STATUS_LABELS, STATUSES_BY_KIND, type BillingDocument } from '@/lib/billing/types';

interface ShareLinkPanelProps {
  document: BillingDocument;
  url: string;
}

// Shown on the edit page: the public link, quick status changes, and a note
// that the link only works while the document is not a draft.
export function ShareLinkPanel({ document, url }: ShareLinkPanelProps) {
  const router = useRouter();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const path = `/${document.share_path}`;
  const isDraft = document.status === 'draft';

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('Copy this link', url);
    }
  }

  function changeStatus(status: string) {
    startTransition(async () => {
      const result = await setBillingStatus(document.id, status as BillingDocument['status']);
      if (result.ok) {
        toast.success(result.message || 'Status updated.');
        router.refresh();
      } else {
        toast.error(result.message || 'The status could not be changed.');
      }
    });
  }

  return (
    <section className="panel share-panel">
      <header className="panel__header">
        <h2>Client link</h2>
      </header>
      <div className="panel__body">
        {isDraft ? (
          <p className="share-panel__draft">
            This is a draft. The link below does not work until you set the status to <strong>Sent</strong> or later.
          </p>
        ) : null}

        <div className="share-panel__link">
          <input type="text" readOnly value={url} aria-label="Public link" onFocus={(e) => e.target.select()} />
          <button type="button" className="abtn abtn--primary abtn--small" onClick={copy}>
            {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="share-panel__actions">
          <a className="abtn abtn--ghost abtn--small" href={path} target="_blank" rel="noopener noreferrer" aria-disabled={isDraft} onClick={(e) => isDraft && e.preventDefault()}>
            <FiExternalLink aria-hidden="true" /> View
          </a>
          <a className="abtn abtn--ghost abtn--small" href={`${path}/pdf`} target="_blank" rel="noopener noreferrer" aria-disabled={isDraft} onClick={(e) => isDraft && e.preventDefault()}>
            <FiDownload aria-hidden="true" /> PDF
          </a>
        </div>

        <div className="share-panel__status">
          <span className="share-panel__status-label">Mark as</span>
          <div className="share-panel__status-buttons">
            {STATUSES_BY_KIND[document.kind].map((status) => (
              <button
                key={status}
                type="button"
                className="abtn abtn--ghost abtn--small"
                data-active={document.status === status}
                disabled={pending || document.status === status}
                onClick={() => changeStatus(status)}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
