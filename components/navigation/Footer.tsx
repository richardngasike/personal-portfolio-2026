import Link from 'next/link';
import { NAV_ITEMS } from './nav-items';
import { Wordmark } from './Wordmark';
import { SocialIcon } from '@/components/shared/SocialIcon';
import type { ProfileRow, SettingsRow, SocialLinkRow } from '@/types/database';

interface FooterProps {
  settings: SettingsRow;
  profile: ProfileRow;
  socialLinks: SocialLinkRow[];
  logoUrl: string | null;
}

function copyrightYears(startYear: number | null): string {
  const current = new Date().getFullYear();
  if (!startYear || startYear >= current) return String(current);
  return `${startYear} - ${current}`;
}

export function Footer({ settings, profile, socialLinks, logoUrl }: FooterProps) {
  const holder = settings.copyright_holder || settings.wordmark || profile.full_name;

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <Wordmark text={settings.wordmark || profile.full_name} logoUrl={logoUrl} />
            {settings.footer_text ? <p>{settings.footer_text}</p> : null}
          </div>

          <nav aria-label="Footer">
            <h2 className="site-footer__heading">Site</h2>
            <ul className="site-footer__links site-footer__links--columns">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="site-footer__heading">Contact</h2>
            <ul className="site-footer__links">
              {profile.email ? (
                <li>
                  <a href={`mailto:${profile.email}`}>{profile.email}</a>
                </li>
              ) : null}
              {profile.phone ? (
                <li>
                  <a href={`tel:${profile.phone.replace(/[^+\d]/g, '')}`}>{profile.phone}</a>
                </li>
              ) : null}
              {profile.location ? <li>{profile.location}</li> : null}
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>
            &copy; {copyrightYears(settings.copyright_start_year)} {holder}. All rights reserved.
          </p>
          {socialLinks.length > 0 ? (
            <ul className="site-footer__social">
              {socialLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label={link.label || link.platform}>
                    <SocialIcon platform={link.platform} />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
