import type { Metadata } from 'next';
import { FiGithub, FiLinkedin, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import '@/styles/components/forms.css';
import '@/styles/pages/contact.css';
import { PageHeader } from '@/components/shared/PageHeader';
import { ContactForm } from '@/components/forms/ContactForm';
import { pageMetadata } from '@/lib/seo';
import { getHomepage, getProfile } from '@/lib/queries/public';

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: 'Contact Richard Ngasike',
  description: 'Contact Richard Ngasike about web development, mobile development, backend work or design.',
  path: '/contact',
});

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}

export default async function ContactPage() {
  const [profile, home] = await Promise.all([getProfile(), getHomepage()]);

  return (
    <>
      <PageHeader
        path="/contact"
        eyebrow="Get in touch"
        title={home.contact_heading || 'Get in touch'}
        lead={home.contact_invitation || undefined}
      />

      <section className="section section--flush-top">
        <div className="container contact">
          <div className="contact__details">
            <h2 className="heading-2">Contact details</h2>
            <ul className="contact__list">
              {profile.email ? (
                <li>
                  <FiMail aria-hidden="true" />
                  <div>
                    <p className="contact__label">Email</p>
                    <a className="text-link" href={`mailto:${profile.email}`}>
                      {profile.email}
                    </a>
                  </div>
                </li>
              ) : null}
              {profile.phone ? (
                <li>
                  <FiPhone aria-hidden="true" />
                  <div>
                    <p className="contact__label">Phone</p>
                    <a className="text-link" href={`tel:${profile.phone.replace(/[^+\d]/g, '')}`}>
                      {profile.phone}
                    </a>
                  </div>
                </li>
              ) : null}
              {profile.location ? (
                <li>
                  <FiMapPin aria-hidden="true" />
                  <div>
                    <p className="contact__label">Location</p>
                    <p>{profile.location}</p>
                  </div>
                </li>
              ) : null}
              {profile.github_url ? (
                <li>
                  <FiGithub aria-hidden="true" />
                  <div>
                    <p className="contact__label">GitHub</p>
                    <a className="text-link" href={profile.github_url} target="_blank" rel="noopener noreferrer">
                      {displayUrl(profile.github_url)}
                    </a>
                  </div>
                </li>
              ) : null}
              {profile.linkedin_url ? (
                <li>
                  <FiLinkedin aria-hidden="true" />
                  <div>
                    <p className="contact__label">LinkedIn</p>
                    <a className="text-link" href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                      {displayUrl(profile.linkedin_url)}
                    </a>
                  </div>
                </li>
              ) : null}
            </ul>
          </div>

          <div className="contact__form">
            <h2 className="heading-2">Send a message</h2>
            <p className="meta">All fields are required.</p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
