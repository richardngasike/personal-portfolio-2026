import type { Metadata } from 'next';
import { FiExternalLink } from 'react-icons/fi';
import '@/styles/components/timeline.css';
import '@/styles/pages/experience.css';
import { PageHeader } from '@/components/shared/PageHeader';
import { ContactCta } from '@/components/shared/ContactCta';
import { pageMetadata } from '@/lib/seo';
import { formatDateRange } from '@/lib/utils/format';
import { getExperiences } from '@/lib/queries/public';
import { assetUrl } from '@/lib/storage';

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: 'Professional experience and career history',
  description:
    'Career history of Richard Ngasike: roles, responsibilities, contributions and deliverables across software development, design and data work.',
  path: '/experience',
});

function DetailList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="experience__block">
      <h4 className="experience__subheading">{title}</h4>
      <ul className="bullet-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default async function ExperiencePage() {
  const experiences = await getExperiences();

  return (
    <>
      <PageHeader
        path="/experience"
        eyebrow="Professional experience"
        title="Building solutions, contributing to meaningful work."
        lead="Where I have worked, what I was responsible for and what I delivered."
      />

      <section className="section section--flush-top">
        <div className="container">
          {experiences.length > 0 ? (
            <ol className="timeline">
              {experiences.map((experience) => {
                const logoUrl = assetUrl('organisation-logos', experience.logo_path);
                const dates = formatDateRange({
                  start: experience.start_date,
                  end: experience.end_date,
                  isCurrent: experience.is_current,
                  display: experience.date_display,
                });
                const links = [...experience.related_links, ...experience.attachments].filter(
                  (link) => link?.label && /^https?:\/\//i.test(link.url ?? ''),
                );

                return (
                  <li key={experience.id} className="timeline__item">
                    <article className="experience">
                      <header className="experience__header">
                        {logoUrl ? (
                          // Organisation logos have arbitrary dimensions.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="experience__logo" src={logoUrl} alt="" loading="lazy" />
                        ) : null}
                        <div>
                          <h2 className="experience__org">{experience.organisation}</h2>
                          {experience.department ? <p className="experience__dept">{experience.department}</p> : null}
                          <p className="experience__role">{experience.job_title}</p>
                          <p className="experience__meta">
                            <span>{[dates, experience.location].filter(Boolean).join(' / ')}</span>
                            <span className="timeline__badge" data-current={experience.is_current}>
                              {[experience.engagement_type, experience.is_current ? 'Current' : 'Past']
                                .filter(Boolean)
                                .join(' / ')}
                            </span>
                          </p>
                        </div>
                      </header>

                      {experience.overview ? <p className="experience__overview">{experience.overview}</p> : null}

                      <DetailList title="Responsibilities" items={experience.responsibilities} />
                      <DetailList title="Key contributions" items={experience.contributions} />
                      <DetailList title="Deliverables" items={experience.deliverables} />

                      {experience.technologies.length > 0 ? (
                        <div className="experience__block">
                          <h4 className="experience__subheading">Technologies and tools</h4>
                          <ul className="tag-list">
                            {experience.technologies.map((technology) => (
                              <li key={technology} className="tag">
                                {technology}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {links.length > 0 ? (
                        <ul className="experience__links">
                          {links.map((link) => (
                            <li key={link.url}>
                              <a className="text-link" href={link.url} target="_blank" rel="noopener noreferrer">
                                {link.label} <FiExternalLink aria-hidden="true" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="empty-state">Experience records have not been published yet.</p>
          )}
        </div>
      </section>

      <ContactCta />
    </>
  );
}
