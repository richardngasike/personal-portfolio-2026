import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

// Landing point for links in Supabase Auth emails (password recovery).
// Exchanges the token for a session, then forwards to a path on this site.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  // Only same-site admin paths are accepted, which rules out open redirects.
  const requested = searchParams.get('next') ?? '/admin';
  const next = requested.startsWith('/admin') && !requested.startsWith('//') ? requested : '/admin';

  const failure = new URL('/admin/login?error=link', request.url);
  if (!isSupabaseConfigured) return NextResponse.redirect(failure);

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(failure);
}
