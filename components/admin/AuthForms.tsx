'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { requestPasswordReset, signIn, updatePassword, type AuthState } from '@/lib/auth/actions';

const INITIAL: AuthState = {};

function Feedback({ state }: { state: AuthState }) {
  if (state.error) {
    return (
      <p className="auth__alert auth__alert--error" role="alert">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p className="auth__alert auth__alert--success" role="status">
        {state.message}
      </p>
    );
  }
  return null;
}

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(signIn, INITIAL);
  return (
    <form action={action} className="auth__form">
      {notice && !state.error ? (
        <p className="auth__alert auth__alert--error" role="alert">
          {notice}
        </p>
      ) : null}
      <Feedback state={state} />
      <div className="field">
        <label className="field__label" htmlFor="login-email">
          Email address
        </label>
        <input id="login-email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="login-password">
          Password
        </label>
        <input id="login-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button type="submit" className="abtn abtn--primary abtn--block" disabled={pending}>
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
      <Link href="/admin/forgot-password" className="auth__link">
        Forgot your password?
      </Link>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, INITIAL);
  return (
    <form action={action} className="auth__form">
      <Feedback state={state} />
      <div className="field">
        <label className="field__label" htmlFor="reset-email">
          Email address
        </label>
        <input id="reset-email" name="email" type="email" autoComplete="username" required />
      </div>
      <button type="submit" className="abtn abtn--primary abtn--block" disabled={pending}>
        {pending ? 'Sending...' : 'Send reset link'}
      </button>
      <Link href="/admin/login" className="auth__link">
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, INITIAL);
  return (
    <form action={action} className="auth__form">
      <Feedback state={state} />
      <div className="field">
        <label className="field__label" htmlFor="new-password">
          New password
        </label>
        <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={12} required />
        <p className="field__help">At least 12 characters.</p>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="confirm-password">
          Confirm new password
        </label>
        <input id="confirm-password" name="confirmation" type="password" autoComplete="new-password" minLength={12} required />
      </div>
      <button type="submit" className="abtn abtn--primary abtn--block" disabled={pending}>
        {pending ? 'Saving...' : 'Set new password'}
      </button>
    </form>
  );
}
