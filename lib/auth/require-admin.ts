import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';

export interface AdminSession {
  supabase: SupabaseClient;
  user: User;
  fullName: string;
}

// Resolves the current administrator, or null. The user is verified with the
// Supabase Auth server (getUser), not read from the unverified cookie, and the
// role comes from admin_profiles in the database, never from the client.
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('role, full_name')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminProfile || adminProfile.role !== 'admin') return null;

  return { supabase, user, fullName: adminProfile.full_name || user.email || 'Administrator' };
});

// For pages and layouts: redirects visitors who are not administrators.
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return session;
}

export class UnauthorisedError extends Error {
  constructor() {
    super('You are not authorised to perform this action.');
    this.name = 'UnauthorisedError';
  }
}

// For Server Actions and Route Handlers: throws instead of redirecting.
export async function requireAdminAction(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new UnauthorisedError();
  return session;
}
