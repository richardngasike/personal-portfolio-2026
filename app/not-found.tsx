import Link from 'next/link';
import '@/styles/typography.css';
import '@/styles/components/buttons.css';
import '@/styles/components/sections.css';

export default function NotFound() {
  return (
    <main className="site page-header">
      <div className="container">
        <div className="page-header__inner">
          <p className="eyebrow">404</p>
          <h1 className="heading-1">Page not found</h1>
          <p className="lead">The page you are looking for does not exist or has been moved.</p>
          <div>
            <Link href="/" className="btn btn--primary">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
