'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

type Phase = 'idle' | 'loading' | 'done';

// A slim progress bar at the very top of the viewport. It starts when an
// in-app link is clicked and finishes when the new route is shown, so slow
// navigations never look frozen. No dependency, no layout shift.
export function RouteProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('idle');
  const first = useRef(true);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      const target = anchor.getAttribute('target');
      if (!href || !href.startsWith('/') || href.startsWith('//') || target === '_blank') return;
      if (href === window.location.pathname) return;
      setPhase('loading');
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setPhase('done');
    const timer = setTimeout(() => setPhase('idle'), 380);
    return () => clearTimeout(timer);
  }, [pathname]);

  return <div className={`routebar routebar--${phase}`} role="presentation" aria-hidden />;
}
