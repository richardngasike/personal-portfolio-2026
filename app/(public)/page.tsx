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
  const currentRole = experiences.find((experience) => experience.is_current);
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
                <div className="hero__portrait">
                  <Image
                    src={portraitUrl}
                    alt={`Portrait of ${profile.full_name}`}
                    fill
                    priority
                    sizes="(max-width: 900px) 60vw, 352px"
                  />
                </div>
                <figcaption className="hero__caption">
                  <strong>{profile.full_name}</strong>
                  {currentRole ? (
                    <span>
                      {currentRole.job_title}, {currentRole.organisation}
                    </span>
                  ) : null}
                  {profile.location ? <span>{profile.location}</span> : null}
                </figcaption>
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
