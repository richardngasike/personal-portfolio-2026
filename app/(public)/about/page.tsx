import type { Metadata } from 'next';
import Image from 'next/image';
import '@/styles/pages/about.css';
import { PageHeader } from '@/components/shared/PageHeader';
import { ContactCta } from '@/components/shared/ContactCta';
import { pageMetadata } from '@/lib/seo';
import { paragraphs } from '@/lib/utils/format';
import { getHomepage, getProfile } from '@/lib/queries/public';
import { assetUrl } from '@/lib/storage';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return pageMetadata({
    title: 'About',
    description: profile.short_intro || `About ${profile.full_name}.`,
    path: '/about',
  });
}

export default async function AboutPage() {
  const [profile, home] = await Promise.all([getProfile(), getHomepage()]);
  const photoUrl = assetUrl('profile-images', profile.photo_path);
  const biography = paragraphs(profile.biography);
  const philosophy = paragraphs(profile.philosophy);

  return (
    <>
      <PageHeader eyebrow="About me" title={profile.headline || profile.full_name} lead={profile.short_intro} />

      <section className="section section--white" aria-labelledby="biography-heading">
        <div className="container about">
          {photoUrl ? (
            <figure className="about__portrait">
              <div className="about__portrait-frame">
                <Image
                  src={photoUrl}
                  alt={`Portrait of ${profile.full_name}`}
                  fill
                  sizes="(max-width: 900px) 80vw, 380px"
                />
              </div>
              <figcaption className="caption">
                {profile.full_name}
                {profile.location ? `, ${profile.location}` : ''}
              </figcaption>
            </figure>
          ) : null}

          <div>
            <h2 id="biography-heading" className="heading-2">
              Background
            </h2>
            {biography.length > 0 ? (
              <div className="prose about__prose">
                {biography.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="empty-state">The biography has not been published yet.</p>
            )}
          </div>
        </div>
      </section>

      {profile.journey.length > 0 ? (
        <section className="section" aria-labelledby="journey-heading">
          <div className="container">
            <div className="section__header">
              <p className="eyebrow">Professional journey</p>
              <h2 id="journey-heading" className="heading-1">
                My Journey
              </h2>
            </div>
            <ol className="journey">
              {profile.journey.map((step, index) => (
                <li key={`${step.period}-${index}`} className="journey__step">
                  <p className="journey__period">{step.period}</p>
                  <h3 className="heading-3">{step.title}</h3>
                  {step.description ? <p className="meta">{step.description}</p> : null}
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {philosophy.length > 0 || profile.interests.length > 0 ? (
        <section className="section section--white" aria-labelledby="approach-heading">
          <div className="container approach">
            {philosophy.length > 0 ? (
              <div>
                <p className="eyebrow">How I work</p>
                <h2 id="approach-heading" className="heading-1">
                  Working philosophy
                </h2>
                <div className="prose approach__prose">
                  {philosophy.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            ) : null}

            {profile.interests.length > 0 ? (
              <aside className="approach__interests" aria-labelledby="interests-heading">
                <h3 id="interests-heading" className="intro__label">
                  Professional interests
                </h3>
                <ul className="bullet-list">
                  {profile.interests.map((interest) => (
                    <li key={interest}>{interest}</li>
                  ))}
                </ul>
              </aside>
            ) : null}
          </div>
        </section>
      ) : null}

      <ContactCta heading={home.contact_heading || 'Get in touch'} text={home.contact_invitation} />
    </>
  );
}
