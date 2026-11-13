import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import { getHomepage, getProfile } from '@/lib/queries/public';

// Closing band shown at the end of every public page. It reads its own
// content (both queries are cached per request), so pages just render it.
export async function ContactCta() {
  const [home, profile] = await Promise.all([getHomepage(), getProfile()]);

  return (
    <section className="cta" aria-labelledby="contact-cta-heading">
      <div className="container">
        <div className="cta__inner">
          <div>
            <h2 id="contact-cta-heading" className="cta__title">
              {home.contact_heading || 'Get in touch'}
            </h2>
            {home.contact_invitation ? <p>{home.contact_invitation}</p> : null}
          </div>
          <div className="cta__actions">
            {profile.email ? (
              <a className="cta__email" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
            ) : null}
            <Link href="/contact" className="btn btn--primary">
              Get in Touch <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
