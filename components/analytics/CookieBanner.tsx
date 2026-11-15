'use client';

import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { readConsent, writeConsent } from '@/lib/analytics/consent';

// Privacy notice shown until the visitor makes a choice. Analytics stay off
// until they accept, so declining genuinely means no tracking.
export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);

  useEffect(() => {
    // Defer to idle so the banner never competes with first paint.
    const show = () => setOpen(readConsent() === null);
    if ('requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(show);
    } else {
      const timer = setTimeout(show, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!open) return null;

  const choose = (value: 'accepted' | 'rejected') => {
    writeConsent(value);
    setOpen(false);
  };

  return (
    <div className="consent" role="dialog" aria-label="Cookie consent" aria-live="polite">
      <div className="consent__inner">
        <button type="button" className="consent__dismiss" aria-label="Dismiss" onClick={() => choose('rejected')}>
          <FiX aria-hidden />
        </button>
        <div className="consent__body">
          <p className="consent__title">A note on privacy</p>
          <p className="consent__text">
            This site uses privacy-respecting, first-party analytics to understand which work people read. No
            third-party trackers, no advertising, and nothing that identifies you. You can decline and the site works
            exactly the same.
          </p>
          {details ? (
            <ul className="consent__list">
              <li>
                <span className="consent__cat">Essential</span>
                <span>Always on. Needed for the site to load and for the admin area to stay secure.</span>
              </li>
              <li>
                <span className="consent__cat">Analytics</span>
                <span>Anonymous page views and country, aggregated only. Optional — your choice below.</span>
              </li>
            </ul>
          ) : (
            <button type="button" className="consent__more" onClick={() => setDetails(true)}>
              What this covers
            </button>
          )}
        </div>
        <div className="consent__actions">
          <button type="button" className="consent__btn consent__btn--ghost" onClick={() => choose('rejected')}>
            Decline
          </button>
          <button type="button" className="consent__btn consent__btn--solid" onClick={() => choose('accepted')}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
