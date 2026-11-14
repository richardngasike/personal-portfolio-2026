import { billingPdfResponse } from '@/lib/billing/pdf-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ year: string; month: string; code: string }> }) {
  const { year, month, code } = await params;
  return billingPdfResponse('quotation', year, month, code);
}
