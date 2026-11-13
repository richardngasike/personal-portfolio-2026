'use client';

import { FiMoon, FiSun } from 'react-icons/fi';

// Switches between light and dark mode and remembers the choice. Both icons
// are rendered and CSS shows the right one, so server and client markup match.
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for this page only.
    }
  }

  return (
    <button type="button" className="icon-toggle theme-toggle" onClick={toggle} aria-label="Switch between light and dark mode" title="Light / dark mode">
      <FiMoon className="theme-toggle__moon" aria-hidden="true" />
      <FiSun className="theme-toggle__sun" aria-hidden="true" />
    </button>
  );
}
