'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseEnv } from '@/lib/env';

let browserClient: SupabaseClient | undefined;

// Browser client for the signed-in administrator. It carries the user's
// session, so every request is still subject to Row Level Security.
export function createClient(): SupabaseClient {
  if (!browserClient) {
    const { url, anonKey } = requireSupabaseEnv();
    browserClient = createBrowserClient(url, anonKey);
  }
  return browserClient;
}
