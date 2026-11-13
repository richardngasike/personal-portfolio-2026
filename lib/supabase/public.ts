import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/env';

let publicClient: SupabaseClient | null = null;

// Cookie-less anonymous client for public pages. Because it never touches the
// request, pages that use it can be statically rendered and revalidated.
// Returns null when Supabase is not configured so the site can still build.
export function createPublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!publicClient) {
    publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return publicClient;
}
