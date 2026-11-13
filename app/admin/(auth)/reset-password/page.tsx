import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ResetPasswordForm } from '@/components/admin/AuthForms';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';

export const metadata: Metadata = { title: 'Set a new password' };
export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage() {
  if (!isSupabaseConfigured) redirect('/admin/login');

  // Reached through the emailed recovery link, which signs the user in.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login?error=link');

  return (
    <>
      <h1 className="auth__title">Set a new password</h1>
      <p className="auth__intro">Choose a new password for {user.email}.</p>
      <ResetPasswordForm />
    </>
  );
}
