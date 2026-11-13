import Image from 'next/image';
import Link from 'next/link';
import type { IconType } from 'react-icons';
import { FiArrowRight, FiCode, FiDownload, FiGrid, FiPenTool, FiServer, FiSmartphone } from 'react-icons/fi';
import '@/styles/components/project-card.css';
import '@/styles/pages/home.css';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ContactCta } from '@/components/shared/ContactCta';
import { formatDateRange } from '@/lib/utils/format';
import {
  getExperiences,
  getFeaturedProjects,
  getHomepage,
  getProfile,
  hasCurrentCv,
} from '@/lib/queries/public';
import { assetUrl } from '@/lib/storage';

export const revalidate = 300;

const CV_PATH = '/api/cv';

// Picks an icon from the words in a discipline, so new ones added in the
// admin still get a sensible icon.
function disciplineIcon(label: string): IconType {
  const text = label.toLowerCase();
  if (text.includes('mobile')) return FiSmartphone;
  if (text.includes('infrastructure') || text.includes('cloud')) return FiServer;
  if (text.includes('design') || text.includes('creative')) return FiPenTool;
  if (text.includes('software') || text.includes('engineer') || text.includes('develop')) return FiCode;
  return FiGrid;
}

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export default async function HomePage() {
  const [home, profile, featured, experiences, cvAvailable] = await Promise.all([
    getHomepage(),
    getProfile(),
    getFeaturedProjects(),
    getExperiences(),
    hasCurrentCv(),
  ]);

  const portraitUrl = assetUrl('profile-images', home.hero_image_path || profile.photo_path);
  const heading = home.hero_heading || profile.headline || profile.full_name;
  const description = home.hero_description || profile.short_intro;

  // A button that points at the CV is only shown while a CV is published.
  const buttons = [
    { text: home.primary_button_text, href: home.primary_button_link, primary: true },
    { text: home.secondary_button_text, href: home.secondary_button_link, primary: false },
  ].filter((button) => button.text && button.href && (button.href !== CV_PATH || cvAvailable));

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            {home.professional_title ? <p className="eyebrow">{home.professional_title}</p> : null}
            <h1 className="display">{heading}</h1>
            {description ? <p className="lead">{description}</p> : null}

            {buttons.length > 0 ? (
              <div className="hero__actions">
                {buttons.map((button) => {
                  const className = `btn ${button.primary ? 'btn--primary' : 'btn--outline'}`;
                  const icon =
                    button.href === CV_PATH ? <FiDownload aria-hidden="true" /> : <FiArrowRight aria-hidden="true" />;
                  return button.href === CV_PATH || isExternal(button.href) ? (
                    <a key={button.href} className={className} href={button.href}>
                      {button.text} {icon}
                    </a>
                  ) : (
                    <Link key={button.href} className={className} href={button.href}>
                      {button.text} {icon}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>

          {portraitUrl ? (
            <figure className="hero__portrait">
              <Image
                src={portraitUrl}
                alt={`Portrait of ${profile.full_name}`}
                fill
                priority
                sizes="(max-width: 900px) 70vw, 420px"
              />
            </figure>
          ) : null}
        </div>

        {home.disciplines.length > 0 ? (
          <div className="container">
            <ul className="hero__disciplines" aria-label="Professional disciplines">
              {home.disciplines.map((discipline) => {
                const Icon = disciplineIcon(discipline);
                return (
                  <li key={discipline}>
                    <Icon aria-hidden="true" />
                    {discipline}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="section" aria-labelledby="featured-heading">
        <div className="container">
          <div className="section__header section__header--split">
            <h2 id="featured-heading" className="section__title">
              Featured Projects
            </h2>
            <Link href="/projects" className="arrow-link">
              View All Projects <FiArrowRight aria-hidden="true" />
            </Link>
          </div>

          {featured.length > 0 ? (
            <div className="project-grid">
              {featured.map((project, index) => (
                <ProjectCard key={project.id} project={project} priority={index === 0} />
              ))}
              <Link href="/projects" className="project-card project-card--more">
                <FiArrowRight aria-hidden="true" />
                <p>Explore more projects and case studies</p>
                <span className="arrow-link">View All Projects</span>
              </Link>
            </div>
          ) : (
            <p className="empty-state">Featured projects will appear here once they are published.</p>
          )}
        </div>
      </section>

      {home.about_intro || experiences.length > 0 ? (
        <section className="section section--white" aria-labelledby="intro-heading">
          <div className="container intro">
            <div className="intro__text">
              <p className="eyebrow">About</p>
              <h2 id="intro-heading" className="heading-2">
                {home.about_heading || `About ${profile.full_name}`}
              </h2>
              {home.about_intro ? <p className="lead">{home.about_intro}</p> : null}
              <Link href="/about" className="arrow-link">
                More about me <FiArrowRight aria-hidden="true" />
              </Link>
            </div>

            {experiences.length > 0 ? (
              <div className="intro__experience">
                <h3 className="intro__label">Recent experience</h3>
                <ol className="intro__list">
                  {experiences.slice(0, 4).map((experience) => (
                    <li key={experience.id}>
                      <p className="intro__role">{experience.job_title}</p>
                      <p className="intro__org">{experience.organisation}</p>
                      <p className="meta">
                        {formatDateRange({
                          start: experience.start_date,
                          end: experience.end_date,
                          isCurrent: experience.is_current,
                          display: experience.date_display,
                        })}
                      </p>
                    </li>
                  ))}
                </ol>
                <Link href="/experience" className="arrow-link">
                  Full experience <FiArrowRight aria-hidden="true" />
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <ContactCta heading={home.contact_heading || 'Get in touch'} text={home.contact_invitation} />
    </>
  );
}
