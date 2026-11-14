import { SharedDocumentPage, sharedDocumentMetadata } from '@/components/billing/SharedDocumentPage';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ year: string; month: string; code: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { year, month, code } = await params;
  return sharedDocumentMetadata('quotation', year, month, code);
}

export default async function Page({ params }: PageProps) {
  const { year, month, code } = await params;
  return <SharedDocumentPage kind="quotation" year={year} month={month} code={code} />;
}
