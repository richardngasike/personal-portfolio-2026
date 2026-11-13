import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/admin/AuthForms';

export const metadata: Metadata = { title: 'Reset password' };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="auth__title">Reset your password</h1>
      <p className="auth__intro">Enter your administrator email address and a reset link will be sent to it.</p>
      <ForgotPasswordForm />
    </>
  );
}
