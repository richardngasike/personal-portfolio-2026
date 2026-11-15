'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/admin';
import { SITE_URL, SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/env';

// Verifies an email/password pair against the auth token endpoint directly.
// Using a bare fetch (no Supabase client) means the live admin session cookies
// are never read or written, so a failed check cannot sign the administrator
// out of the panel.
async function verifyPassword(email: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

// The address allowed to receive a reset link when settings are unavailable.
const DEFAULT_RESET_EMAIL = 'ngasikerichard@gmail.com';

async function allowedResetEmail(): Promise<string> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase.from('website_settings').select('admin_reset_email').maybeSingle();
    const configured = (data?.admin_reset_email ?? '').trim().toLowerCase();
    return configured || DEFAULT_RESET_EMAIL;
  } catch {
    return DEFAULT_RESET_EMAIL;
  }
}

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

  const generic = {
    message: 'If that address belongs to an administrator, a reset link has been sent to it.',
  };

  // Reset links are only ever sent to the single configured administrator
  // address. Any other address gets the same generic response, so the form
  // reveals nothing and cannot be used to reset someone else's password.
  if (email !== (await allowedResetEmail())) return generic;

  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') || 'https';
  const origin = host ? `${protocol}://${host}` : SITE_URL;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/admin/reset-password`,
  });

  return generic;
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

// In-panel password change for a signed-in administrator. The current password
// is re-verified before the change so a hijacked open session cannot set a new
// password on its own.
export async function changePassword(_previous: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured for this deployment.' };

  const current = String(formData.get('current') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirmation') ?? '');
  if (!current) return { error: 'Enter your current password.' };
  if (password.length < 12) return { error: 'Use at least 12 characters for the new password.' };
  if (password !== confirmation) return { error: 'The two new passwords do not match.' };
  if (password === current) return { error: 'Choose a new password that is different from the current one.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: 'Your session has expired. Sign in again.' };

  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!adminProfile || adminProfile.role !== 'admin') return { error: 'Your session has expired. Sign in again.' };

  // Confirm the current password without disturbing the live session.
  if (!(await verifyPassword(user.email, current))) {
    return { error: 'Your current password is not correct.' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: 'The password could not be changed. Try again.' };

  return { message: 'Your password has been changed.' };
}
