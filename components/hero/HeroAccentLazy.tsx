'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// The Three.js scene is a separate chunk, pulled in only after the hero has
// painted and only where it belongs: larger screens, motion allowed, WebGL
// present. On phones and for reduced-motion visitors it never loads, so the
// initial experience stays fast and the hero is complete without it.
const HeroAccent = dynamic(() => import('./HeroAccent'), { ssr: false });

function hasWebgl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')),
    );
  } catch {
    return false;
  }
}

export function HeroAccentLazy() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
    const update = () => setEnabled(query.matches && hasWebgl());
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  if (!enabled) return null;
  return (
    <div className="hero-accent" aria-hidden="true">
      <HeroAccent />
    </div>
  );
}
