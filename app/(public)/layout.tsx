import type { ReactNode } from 'react';
import '@/styles/typography.css';
import '@/styles/components/buttons.css';
import '@/styles/components/navbar.css';
import '@/styles/components/footer.css';
import '@/styles/components/sections.css';
import { Navbar } from '@/components/navigation/Navbar';
import { Footer } from '@/components/navigation/Footer';
import { JsonLd } from '@/components/shared/JsonLd';
import { SITE_URL } from '@/lib/env';
import {
  getEducation,
  getExperiences,
  getProfile,
  getSettings,
  getSkillGroups,
  getSocialLinks,
} from '@/lib/queries/public';
import { assetUrl } from '@/lib/storage';

export const revalidate = 300;

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [settings, profile, socialLinks, experiences, education, skillGroups] = await Promise.all([
    getSettings(),
    getProfile(),
    getSocialLinks(),
    getExperiences(),
    getEducation(),
    getSkillGroups(),
  ]);
  const wordmark = settings.wordmark || profile.full_name || 'Richard Ngasike';
  const logoUrl = assetUrl('website-assets', settings.logo_path);
  const photoUrl = assetUrl('profile-images', profile.photo_path);

  const sameAs = Array.from(
    new Set([profile.github_url, profile.linkedin_url, ...socialLinks.map((link) => link.url)].filter(Boolean)),
  );

  const currentRole = experiences.find((experience) => experience.is_current);
  const qualifications = education.filter((record) => record.kind === 'formal');
  const knowsAbout = skillGroups.flatMap((group) => group.skills.map((skill) => skill.name)).slice(0, 40);

  // Person structured data, built only from published records.
  const person: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: profile.full_name || wordmark,
    url: SITE_URL,
    mainEntityOfPage: `${SITE_URL}/about`,
    ...(currentRole ? { worksFor: { '@type': 'Organization', name: currentRole.organisation } } : {}),
    ...(qualifications.length > 0
      ? {
          alumniOf: qualifications
            .filter((record) => record.institution)
            .map((record) => ({ '@type': 'EducationalOrganization', name: record.institution })),
          hasCredential: qualifications.map((record) => ({
            '@type': 'EducationalOccupationalCredential',
            name: record.qualification,
            ...(record.awarding_body ? { recognizedBy: { '@type': 'Organization', name: record.awarding_body } } : {}),
          })),
        }
      : {}),
    ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
    ...(profile.headline ? { jobTitle: profile.headline } : {}),
    ...(profile.short_intro ? { description: profile.short_intro } : {}),
    ...(photoUrl ? { image: photoUrl.startsWith('/') ? `${SITE_URL}${photoUrl}` : photoUrl } : {}),
    ...(profile.email ? { email: `mailto:${profile.email}` } : {}),
    ...(profile.location ? { address: { '@type': 'PostalAddress', addressLocality: profile.location } } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <div className="site">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar wordmark={wordmark} logoUrl={logoUrl} />
      <main id="main-content">{children}</main>
      <Footer settings={settings} profile={profile} socialLinks={socialLinks} logoUrl={logoUrl} />
      <JsonLd data={person} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: SITE_URL,
          name: settings.site_title || wordmark,
          ...(settings.meta_description ? { description: settings.meta_description } : {}),
          inLanguage: 'en',
          publisher: { '@id': `${SITE_URL}/#person` },
        }}
      />
    </div>
  );
}
