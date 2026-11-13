import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { isStoragePath } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SIGNED_URL_TTL_SECONDS = 60;

// Redirects to the current published CV. The file lives in the private
// "documents" bucket, so each download gets a short-lived signed URL.
export async function GET() {
  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    return new NextResponse('CV download is not configured.', { status: 503 });
  }

  const { data: cv, error } = await supabase
    .from('documents')
    .select('file_path, title')
    .eq('kind', 'cv')
    .eq('is_current', true)
    .eq('published', true)
    .maybeSingle();

  if (error || !cv) {
    return new NextResponse('No CV is published at the moment.', { status: 404 });
  }

  if (!isStoragePath(cv.file_path)) {
    return new NextResponse('No CV is published at the moment.', { status: 404 });
  }

  const fileName = `${cv.title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'CV'}.pdf`;
  const { data: signed, error: signError } = await supabase.storage
    .from('documents')
    .createSignedUrl(cv.file_path, SIGNED_URL_TTL_SECONDS, { download: fileName });

  if (signError || !signed?.signedUrl) {
    console.error('[cv] could not sign url', signError?.message);
    return new NextResponse('The CV could not be retrieved.', { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302, headers: { 'Cache-Control': 'no-store' } });
}
