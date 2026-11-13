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
import { getProfile, getSettings, getSocialLinks } from '@/lib/queries/public';
import { assetUrl } from '@/lib/storage';

export const revalidate = 300;

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [settings, profile, socialLinks] = await Promise.all([getSettings(), getProfile(), getSocialLinks()]);
  const wordmark = settings.wordmark || profile.full_name || 'Richard Ngasike';
  const logoUrl = assetUrl('website-assets', settings.logo_path);
  const photoUrl = assetUrl('profile-images', profile.photo_path);

  const sameAs = Array.from(
    new Set([profile.github_url, profile.linkedin_url, ...socialLinks.map((link) => link.url)].filter(Boolean)),
  );

  const person: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.full_name || wordmark,
    url: SITE_URL,
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
    </div>
  );
}
