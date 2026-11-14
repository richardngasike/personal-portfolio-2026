import Image from 'next/image';
import Link from 'next/link';
import type { IconType } from 'react-icons';
import { FiArrowRight, FiCode, FiDownload, FiGrid, FiPenTool, FiServer, FiSmartphone } from 'react-icons/fi';
import '@/styles/components/project-card.css';
import '@/styles/pages/home.css';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectFeature } from '@/components/projects/ProjectFeature';
import { ContactCta } from '@/components/shared/ContactCta';
import { formatDateRange } from '@/lib/utils/format';
import {
  getExperiences,
  getFeaturedProjects,
  getHomepage,
  getProfile,
  getSkillGroups,
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
  const [home, profile, featured, experiences, skillGroups, cvAvailable] = await Promise.all([
    getHomepage(),
    getProfile(),
    getFeaturedProjects(),
    getExperiences(),
    getSkillGroups(),
    hasCurrentCv(),
  ]);

  const portraitUrl = assetUrl('profile-images', home.hero_image_path || profile.photo_path);
  const heading = home.hero_heading || profile.headline || profile.full_name;
  const description = home.hero_description || profile.short_intro;
  const [leadProject, ...otherProjects] = featured;

  // A button that points at the CV is only shown while a CV is published.
  const buttons = [
    { text: home.primary_button_text, href: home.primary_button_link, primary: true },
    { text: home.secondary_button_text, href: home.secondary_button_link, primary: false },
  ].filter((button) => button.text && button.href && (button.href !== CV_PATH || cvAvailable));

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero__inner">
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
              <figure className="hero__figure">
                {/* The portrait stands in front of the shape: clipped to it at the
                    bottom, free to rise above it at the top. */}
                <svg className="hero__blob" viewBox="0 0 500 500" aria-hidden="true" focusable="false">
                  <path d="M250.0000 15.0000C303.3333 7.5000 360.8333 22.5000 400.0000 50.0000C439.1667 77.5000 476.6667 131.6667 485.0000 180.0000C493.3333 228.3333 470.8333 292.5000 450.0000 340.0000C429.1667 387.5000 400.0000 440.0000 360.0000 465.0000C320.0000 490.0000 258.3333 497.5000 210.0000 490.0000C161.6667 482.5000 102.5000 458.3333 70.0000 420.0000C37.5000 381.6667 13.3333 314.1667 15.0000 260.0000C16.6667 205.8333 40.8333 135.8333 80.0000 95.0000C119.1667 54.1667 196.6667 22.5000 250.0000 15.0000Z" />
                </svg>
                <div className="hero__portrait">
                  <Image
                    src={portraitUrl}
                    alt={`Portrait of ${profile.full_name}`}
                    fill
                    priority
                    sizes="(max-width: 900px) 90vw, 520px"
                  />
                </div>
                <svg className="hero__clip" width="0" height="0" aria-hidden="true" focusable="false">
                  <defs>
                    <clipPath id="hero-portrait-clip" clipPathUnits="objectBoundingBox">
                      <path d="M0 0H1V0.6H0ZM0.5000 0.2240C0.6067 0.2120 0.7217 0.2360 0.8000 0.2800C0.8783 0.3240 0.9533 0.4107 0.9700 0.4880C0.9867 0.5653 0.9417 0.6680 0.9000 0.7440C0.8583 0.8200 0.8000 0.9040 0.7200 0.9440C0.6400 0.9840 0.5167 0.9960 0.4200 0.9840C0.3233 0.9720 0.2050 0.9333 0.1400 0.8720C0.0750 0.8107 0.0267 0.7027 0.0300 0.6160C0.0333 0.5293 0.0817 0.4173 0.1600 0.3520C0.2383 0.2867 0.3933 0.2360 0.5000 0.2240Z" />
                    </clipPath>
                  </defs>
                </svg>
              </figure>
            ) : null}
          </div>

          {home.disciplines.length > 0 ? (
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
          ) : null}
        </div>
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

          {leadProject ? (
            <>
              <ProjectFeature project={leadProject} />
              {otherProjects.length > 0 ? (
                <div className="project-grid">
                  {otherProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <p className="empty-state">Featured projects will appear here once they are published.</p>
          )}
        </div>
      </section>

      {skillGroups.length > 0 ? (
        <section className="section section--white" aria-labelledby="capabilities-heading">
          <div className="container">
            <div className="section__header section__header--split">
              <h2 id="capabilities-heading" className="section__title">
                What I work with
              </h2>
              <Link href="/expertise" className="arrow-link">
                Full expertise <FiArrowRight aria-hidden="true" />
              </Link>
            </div>
            <dl className="capabilities">
              {skillGroups.map((group) => (
                <div key={group.id} className="capabilities__row">
                  <dt className="capabilities__name">{group.name}</dt>
                  <dd className="capabilities__skills">{group.skills.map((skill) => skill.name).join(', ')}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      {home.about_intro || experiences.length > 0 ? (
        <section className="section" aria-labelledby="intro-heading">
          <div className="container intro">
            <div className="intro__text">
              <h2 id="intro-heading" className="heading-1">
                {home.about_heading || `About ${profile.full_name}`}
              </h2>
              {home.about_intro ? <p className="lead">{home.about_intro}</p> : null}
              <Link href="/about" className="arrow-link">
                More about me <FiArrowRight aria-hidden="true" />
              </Link>
            </div>

            {experiences.length > 0 ? (
              <div>
                <h3 className="intro__label">Recent experience</h3>
                <ol className="intro__list">
                  {experiences.slice(0, 4).map((experience) => (
                    <li key={experience.id}>
                      <p className="intro__role">{experience.job_title}</p>
                      <p className="intro__org">{experience.organisation}</p>
                      <p className="intro__dates">
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

      <ContactCta />
    </>
  );
}
