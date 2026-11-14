import 'server-only';

import { NextResponse } from 'next/server';
import { getIssuer, getSharedDocument } from './queries';
import { renderBillingPdf } from './pdf';
import type { BillingKind } from './types';

// Shared handler for /invoice/.../pdf and /quotation/.../pdf.
export async function billingPdfResponse(kind: BillingKind, year: string, month: string, code: string) {
  const document = await getSharedDocument(kind, year, month, code);
  if (!document) return new NextResponse('Document not found.', { status: 404 });

  try {
    const bytes = await renderBillingPdf(document, await getIssuer());
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.number}.pdf"`,
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (error) {
    console.error('[billing pdf]', error);
    return new NextResponse('The PDF could not be generated.', { status: 500 });
  }
}
