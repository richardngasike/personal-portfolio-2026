'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiMenu, FiX } from 'react-icons/fi';
import { NAV_ITEMS } from './nav-items';
import { ThemeToggle } from './ThemeToggle';
import { Wordmark } from './Wordmark';

interface NavbarProps {
  wordmark: string;
  logoUrl?: string | null;
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({ wordmark, logoUrl }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu after navigation and on Escape.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Wordmark text={wordmark} logoUrl={logoUrl} />

        <nav id="site-navigation" className="site-nav" aria-label="Main" data-open={open}>
          <ul className="site-nav__list">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="site-nav__link"
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/contact" className="btn btn--primary btn--small">
            Get in Touch
          </Link>
        </nav>

        <div className="site-header__tools">
          <ThemeToggle />
  <button
            type="button"
            className="icon-toggle nav-toggle"
            aria-expanded={open}
            aria-controls="site-navigation"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}
