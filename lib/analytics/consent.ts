// Shared, client-side cookie-consent state. No third-party code, no cookies
// are set until the visitor accepts; the choice lives in localStorage only.

export type Consent = 'accepted' | 'rejected';

const KEY = 'rn-consent';
export const CONSENT_EVENT = 'rn-consent-change';

export function readConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
}

export function writeConsent(value: Consent): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // Private mode or storage disabled; nothing persists but the banner still closes.
  }
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_EVENT, { detail: value }));
}
