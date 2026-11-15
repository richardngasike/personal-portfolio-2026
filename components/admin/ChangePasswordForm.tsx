'use client';

import { useActionState, useEffect, useRef } from 'react';
import { changePassword, type AuthState } from '@/lib/auth/actions';

const INITIAL: AuthState = {};

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields once the password has been changed.
  useEffect(() => {
    if (state.message) formRef.current?.reset();
  }, [state.message]);

  return (
    <form ref={formRef} action={action} className="stacked-form">
      {state.error ? (
        <p className="form-alert form-alert--error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="form-alert form-alert--success" role="status">
          {state.message}
        </p>
      ) : null}
      <div className="field">
        <label className="field__label" htmlFor="current-password">
          Current password
        </label>
        <input id="current-password" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="change-new-password">
          New password
        </label>
        <input
          id="change-new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
        <p className="field__help">At least 12 characters. Use something long and unique.</p>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="change-confirm-password">
          Confirm new password
        </label>
        <input
          id="change-confirm-password"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </div>
      <div className="stacked-form__actions">
        <button type="submit" className="abtn abtn--primary" disabled={pending}>
          {pending ? 'Changing...' : 'Change password'}
        </button>
      </div>
    </form>
  );
}
