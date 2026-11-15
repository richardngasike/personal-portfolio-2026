import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminPage } from '@/lib/auth/require-admin';
import { ChangePasswordForm } from '@/components/admin/ChangePasswordForm';

export const metadata: Metadata = { title: 'Security' };
export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  const { supabase, fullName } = await requireAdminPage();
  const { data } = await supabase.from('website_settings').select('admin_reset_email').maybeSingle();
  const resetEmail = (data?.admin_reset_email ?? 'ngasikerichard@gmail.com').trim() || 'ngasikerichard@gmail.com';

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Security</h1>
          <p>Signed in as {fullName}. Manage the admin password and account recovery.</p>
        </div>
      </header>

      <div className="security-grid">
        <section className="panel">
          <header className="panel__header">
            <h2>Change password</h2>
          </header>
          <div className="panel__body">
            <ChangePasswordForm />
          </div>
        </section>

        <section className="panel">
          <header className="panel__header">
            <h2>Password recovery</h2>
          </header>
          <div className="panel__body">
            <p className="security-note">
              If you ever forget the password, use <Link href="/admin/forgot-password">Forgot your password</Link> on the
              sign-in screen. A reset link is only ever sent to your registered recovery address:
            </p>
            <p className="security-note">
              <code>{resetEmail}</code>
            </p>
            <p className="security-note">
              No other address can trigger a reset, so the admin account cannot be taken over through the reset form. To
              change this address, update <strong>Recovery email</strong> in{' '}
              <Link href="/admin/settings">Website settings</Link>. It must stay an inbox you control and match your
              Supabase login email.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
