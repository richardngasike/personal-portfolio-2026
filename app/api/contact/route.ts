import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { validateContact } from '@/lib/validations/contact';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 20_000;
const MIN_FILL_TIME_MS = 3_000;
const PER_SENDER_LIMIT = 5; // submissions per sender per hour
const GLOBAL_LIMIT = 60; // submissions site-wide per hour

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function senderHash(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwarded || request.headers.get('x-real-ip') || 'unknown';
  const salt = process.env.CONTACT_RATE_LIMIT_SALT || 'portfolio-contact';
  return createHash('sha256').update(`${salt}:${address}`).digest('hex');
}

// Rejects cross-site form posts: the Origin header must match this host.
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return json({ ok: false, message: 'Request not allowed.' }, 403);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ ok: false, message: 'Message is too large.' }, 413);
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid body');
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, message: 'Invalid request.' }, 400);
  }

  // Spam traps. Bots fill the hidden "website" field and submit instantly.
  // They receive a normal success response so they learn nothing.
  const honeypot = typeof body.website === 'string' ? body.website.trim() : '';
  const startedAt = typeof body.startedAt === 'number' ? body.startedAt : 0;
  const elapsed = Date.now() - startedAt;
  if (honeypot || !startedAt || elapsed < MIN_FILL_TIME_MS) {
    return json({ ok: true });
  }

  const { data, errors } = validateContact(body);
  if (Object.keys(errors).length > 0) {
    return json({ ok: false, message: 'Please correct the highlighted fields.', errors }, 422);
  }

  let supabase;
  try {
    supabase = createServiceClient();
  } catch {
    console.error('[contact] SUPABASE_SERVICE_ROLE_KEY is not configured.');
    return json({ ok: false, message: 'The contact form is not available right now. Please email me directly.' }, 503);
  }

  const ipHash = senderHash(request);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [perSender, global] = await Promise.all([
    supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since),
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).gte('created_at', since),
  ]);

  if (perSender.error || global.error) {
    console.error('[contact] rate-limit lookup failed', perSender.error?.message || global.error?.message);
    return json({ ok: false, message: 'Something went wrong. Please try again shortly.' }, 500);
  }

  if ((perSender.count ?? 0) >= PER_SENDER_LIMIT || (global.count ?? 0) >= GLOBAL_LIMIT) {
    return json({ ok: false, message: 'Too many messages sent. Please try again in an hour.' }, 429);
  }

  const { error } = await supabase.from('contact_messages').insert({
    full_name: data.fullName,
    email: data.email,
    subject: data.subject,
    message: data.message,
    ip_hash: ipHash,
  });

  if (error) {
    console.error('[contact] insert failed', error.message);
    return json({ ok: false, message: 'Something went wrong. Please try again shortly.' }, 500);
  }

  return json({ ok: true });
}
