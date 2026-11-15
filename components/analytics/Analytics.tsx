'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { CONSENT_EVENT, readConsent, type Consent } from '@/lib/analytics/consent';

// Sends an anonymous page-view beacon on each route change, but only once the
// visitor has accepted analytics. Everything is fire-and-forget.
export function Analytics() {
  const pathname = usePathname();
  const allowed = useRef(false);
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    allowed.current = readConsent() === 'accepted';
    const onChange = (event: Event) => {
      const value = (event as CustomEvent<Consent>).detail;
      allowed.current = value === 'accepted';
      if (allowed.current) send(window.location.pathname);
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith('/admin')) return;
    send(pathname);
  }, [pathname]);

  function send(path: string) {
    if (!allowed.current) return;
    if (lastSent.current === path) return;
    lastSent.current = path;
    const payload = JSON.stringify({ path, referrer: document.referrer || '' });
    try {
      // Beacon survives the page unloading; fetch is the fallback.
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
      } else {
        void fetch('/api/track', { method: 'POST', body: payload, keepalive: true, headers: { 'Content-Type': 'application/json' } });
      }
    } catch {
      // Never let analytics surface an error to the visitor.
    }
  }

  return null;
}
