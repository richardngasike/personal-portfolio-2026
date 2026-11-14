import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getIssuer, getSharedDocument, shareUrl } from '@/lib/billing/queries';
import { KIND_LABELS, type BillingKind } from '@/lib/billing/types';
import { DocumentView } from './DocumentView';
import { ShareBar } from './ShareBar';

interface SharedProps {
  kind: BillingKind;
  year: string;
  month: string;
  code: string;
}

// Shared documents are private to whoever holds the link, so they are kept
// out of search engines and carry no social preview of their contents.
export async function sharedDocumentMetadata(kind: BillingKind, year: string, month: string, code: string): Promise<Metadata> {
  const document = await getSharedDocument(kind, year, month, code);
  const issuer = await getIssuer();
  return {
    title: document ? `${KIND_LABELS[kind]} ${document.number}` : 'Document not found',
    description: document ? `${KIND_LABELS[kind]} ${document.number} from ${issuer.name}.` : undefined,
    robots: { index: false, follow: false, nocache: true },
    openGraph: { title: document ? `${KIND_LABELS[kind]} from ${issuer.name}` : 'Document', images: [] },
  };
}

export async function SharedDocumentPage({ kind, year, month, code }: SharedProps) {
  const [document, issuer] = await Promise.all([getSharedDocument(kind, year, month, code), getIssuer()]);
  if (!document) notFound();

  const url = shareUrl(document.share_path);

  return (
    <main className="billing__main">
      <div className="billing__bar">
        <Link href="/" className="billing__home">
          {issuer.website}
        </Link>
        <ShareBar url={url} pdfHref={`/${document.share_path}/pdf`} title={`${KIND_LABELS[kind]} ${document.number} from ${issuer.name}`} />
      </div>
      <DocumentView document={document} issuer={issuer} />
    </main>
  );
}
