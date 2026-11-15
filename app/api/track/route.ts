import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PATH = 300;

// Derives an anonymous visitor hash that rotates every day, so a visitor
// cannot be tracked across days and the raw address is never stored.
function visitorHash(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwarded || request.headers.get('x-real-ip') || 'unknown';
  const ua = request.headers.get('user-agent') || '';
  const salt = process.env.CONTACT_RATE_LIMIT_SALT || 'analytics';
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${salt}:${day}:${address}:${ua}`).digest('hex').slice(0, 32);
}

function country(request: NextRequest): string | null {
  // Vercel and most edge platforms set one of these.
  const code =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('x-country') ||
    request.headers.get('cf-ipcountry') ||
    '';
  return /^[A-Za-z]{2}$/.test(code) ? code.toUpperCase() : null;
}

function device(request: NextRequest): 'mobile' | 'tablet' | 'desktop' {
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet';
  if (/mobi|iphone|android.*mobile|phone/.test(ua)) return 'mobile';
  return 'desktop';
}

function sameOrigin(request: NextRequest): boolean {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (!host) return false;
  // sendBeacon does not always set Origin, so fall back to the Referer host.
  const candidate = request.headers.get('origin') || request.headers.get('referer');
  if (!candidate) return false;
  try {
    return new URL(candidate).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // Fire-and-forget beacon. It always answers 204 so the page never waits on
  // it or shows an error, even when tracking is unavailable.
  const noContent = new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  if (!sameOrigin(request)) return noContent;

  try {
    const raw = await request.text();
    if (raw.length > 2000) return noContent;
    const body = JSON.parse(raw || '{}') as { path?: unknown; referrer?: unknown };

    let path = typeof body.path === 'string' ? body.path : '/';
    if (!path.startsWith('/') || path.startsWith('//')) path = '/';
    path = path.split('?')[0].split('#')[0].slice(0, MAX_PATH);
    // Never record admin or API paths.
    if (path.startsWith('/admin') || path.startsWith('/api')) return noContent;

    let referrerHost: string | null = null;
    if (typeof body.referrer === 'string' && body.referrer) {
      try {
        const url = new URL(body.referrer);
        const self = request.headers.get('x-forwarded-host') || request.headers.get('host');
        referrerHost = url.host === self ? null : url.host.slice(0, 120);
      } catch {
        referrerHost = null;
      }
    }

    const supabase = createServiceClient();
    await supabase.from('page_views').insert({
      path,
      country: country(request),
      referrer_host: referrerHost,
      device: device(request),
      visitor_hash: visitorHash(request),
    });
  } catch {
    // Analytics must never break the site; swallow everything.
  }
  return noContent;
}
