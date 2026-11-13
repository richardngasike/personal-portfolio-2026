import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth">
      <div className="auth__card">
        <p className="auth__brand">Portfolio admin</p>
        {children}
      </div>
      <Link href="/" className="auth__link auth__link--home">
        Back to the website
      </Link>
    </main>
  );
}
