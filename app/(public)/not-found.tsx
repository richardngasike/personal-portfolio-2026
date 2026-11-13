import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

export default function NotFound() {
  return (
    <section className="page-header">
      <div className="container">
        <div className="page-header__inner">
          <p className="eyebrow">404</p>
          <h1 className="heading-1">Page not found</h1>
          <p className="lead">The page you are looking for does not exist or has been moved.</p>
          <div>
            <Link href="/" className="btn btn--primary">
              Back to home <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
