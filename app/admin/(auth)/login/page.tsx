import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/AuthForms';
import { getAdminSession } from '@/lib/auth/require-admin';
import { isSupabaseConfigured } from '@/lib/env';

export const metadata: Metadata = { title: 'Sign in' };

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAdminSession();
  if (session) redirect('/admin');

  const { error } = await searchParams;
  const notice = !isSupabaseConfigured
    ? 'Supabase is not configured. Add the environment variables described in the README.'
    : error === 'link'
      ? 'That link is invalid or has expired. Request a new one.'
      : undefined;

  return (
    <>
      <h1 className="auth__title">Sign in</h1>
      <p className="auth__intro">Administrator access only.</p>
      <LoginForm notice={notice} />
    </>
  );
}
