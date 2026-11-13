'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL, isSupabaseConfigured } from '@/lib/env';

export interface AuthState {
  error?: string;
  message?: string;
}

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

export async function signIn(_previous: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured for this deployment.' };

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!EMAIL_PATTERN.test(email) || !password) return { error: 'Enter your email address and password.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: 'Incorrect email address or password.' };

  // A valid login is not enough: the account must hold the admin role.
  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('role')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (!adminProfile || adminProfile.role !== 'admin') {
    await supabase.auth.signOut();
    return { error: 'Incorrect email address or password.' };
  }

  redirect('/admin');
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect('/admin/login');
}

export async function requestPasswordReset(_previous: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured for this deployment.' };

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return { error: 'Enter a valid email address.' };

  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') || 'https';
  const origin = host ? `${protocol}://${host}` : SITE_URL;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/admin/reset-password`,
  });

  // The same response whether or not the address exists, so the form cannot
  // be used to discover administrator accounts.
  return { message: 'If that address belongs to an administrator, a reset link has been sent to it.' };
}

export async function updatePassword(_previous: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured for this deployment.' };

  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirmation') ?? '');
  if (password.length < 12) return { error: 'Use at least 12 characters.' };
  if (password !== confirmation) return { error: 'The two passwords do not match.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Your reset link has expired. Request a new one.' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: 'The password could not be changed. Request a new reset link and try again.' };

  redirect('/admin');
}
