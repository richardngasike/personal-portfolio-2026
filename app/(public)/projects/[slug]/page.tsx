import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiArrowLeft, FiExternalLink, FiGithub } from 'react-icons/fi';
import '@/styles/components/project-card.css';
import '@/styles/components/gallery.css';
import '@/styles/pages/projects.css';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ScreenshotGrid } from '@/components/gallery/ScreenshotGrid';
import { ContactCta } from '@/components/shared/ContactCta';
import { JsonLd } from '@/components/shared/JsonLd';
import { SITE_URL } from '@/lib/env';
import { pageMetadata } from '@/lib/seo';
import { PROJECT_STATUS_LABELS, paragraphs } from '@/lib/utils/format';
import { getHomepage, getProfile, getProjectBySlug, getProjects } from '@/lib/queries/public';

export const revalidate = 300;

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: 'Project not found' };

  return pageMetadata({
    title: project.seo_title || project.title,
    description: project.seo_description || project.summary || project.overview.slice(0, 160),
    path: `/projects/${project.slug}`,
    image: project.coverUrl,
  });
}

function TextSection({ id, title, text }: { id: string; title: string; text: string }) {
  const parts = paragraphs(text);
  if (parts.length === 0) return null;
  return (
    <section className="case__section" aria-labelledby={id}>
      <h2 id={id} className="heading-2">
        {title}
      </h2>
      <div className="prose">
        {parts.map((part, index) => (
          <p key={index}>{part}</p>
        ))}
      </div>
    </section>
  );
}

function ListSection({ id, title, items }: { id: string; title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="case__section" aria-labelledby={id}>
      <h2 id={id} className="heading-2">
        {title}
      </h2>
      <ul className="bullet-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const [allProjects, home, profile] = await Promise.all([getProjects(), getHomepage(), getProfile()]);
  const others = allProjects.filter((item) => item.id !== project.id);
  const related = [
    ...others.filter((item) => item.category_id && item.category_id === project.category_id),
    ...others.filter((item) => !item.category_id || item.category_id !== project.category_id),
  ].slice(0, 3);

  const challenges = project.challenges.filter((item) => item?.challenge);
  const screenshots = project.images.filter((image) => image.url !== project.coverUrl || project.images.length > 1);

  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    url: `${SITE_URL}/projects/${project.slug}`,
    ...(project.summary ? { description: project.summary } : {}),
    ...(project.technologies.length > 0 ? { keywords: project.technologies.join(', ') } : {}),
    author: { '@type': 'Person', name: profile.full_name, url: SITE_URL },
  };

  return (
    <>
      <header className="page-header">
        <div className="container">
          <div className="page-header__inner">
            <nav aria-label="Breadcrumb">
              <ol className="breadcrumbs">
                <li>
                  <Link href="/projects">Projects</Link>
                </li>
                {project.categoryName ? <li>{project.categoryName}</li> : null}
              </ol>
            </nav>
            <h1 className="heading-1">{project.title}</h1>
            {project.summary ? <p className="lead">{project.summary}</p> : null}

            {project.live_url || project.repo_url ? (
              <div className="case__actions">
                {project.live_url ? (
                  <a className="btn btn--primary" href={project.live_url} target="_blank" rel="noopener noreferrer">
                    Live site <FiExternalLink aria-hidden="true" />
                  </a>
                ) : null}
                {project.repo_url ? (
                  <a className="btn btn--outline" href={project.repo_url} target="_blank" rel="noopener noreferrer">
                    Source code <FiGithub aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="section section--white">
        <div className="container case">
          <aside className="case__facts" aria-label="Project facts">
            <dl>
              <div>
                <dt>Status</dt>
                <dd>{PROJECT_STATUS_LABELS[project.status] ?? project.status}</dd>
              </div>
              {project.categoryName ? (
                <div>
                  <dt>Category</dt>
                  <dd>{project.categoryName}</dd>
                </div>
              ) : null}
              {project.role ? (
                <div>
                  <dt>My role</dt>
                  <dd>{project.role}</dd>
                </div>
              ) : null}
              {project.technologies.length > 0 ? (
                <div>
                  <dt>Technology stack</dt>
                  <dd>
                    <ul className="tag-list">
                      {project.technologies.map((technology) => (
                        <li key={technology} className="tag">
                          {technology}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
            </dl>
          </aside>

          <div className="case__body">
            {project.coverUrl ? (
              <figure className="case__cover">
                <Image
                  src={project.coverUrl}
                  alt={`${project.title} screenshot`}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 820px"
                />
              </figure>
            ) : null}

            <TextSection id="overview" title="Overview" text={project.overview} />
            <TextSection id="problem" title="The problem" text={project.problem} />
            <TextSection id="solution" title="The solution" text={project.solution} />
            <ListSection id="objectives" title="Objectives" items={project.objectives} />
            <ListSection id="features" title="Main functionality" items={project.features} />
            <TextSection id="architecture" title="Technical architecture" text={project.architecture} />
            <TextSection id="implementation" title="Implementation" text={project.implementation} />
            <TextSection id="data" title="Database and system design" text={project.data_architecture} />

            {screenshots.length > 0 ? (
              <section className="case__section" aria-labelledby="screenshots">
                <h2 id="screenshots" className="heading-2">
                  Screenshots
                </h2>
                <ScreenshotGrid images={screenshots} projectTitle={project.title} />
              </section>
            ) : null}

            {challenges.length > 0 ? (
              <section className="case__section" aria-labelledby="challenges">
                <h2 id="challenges" className="heading-2">
                  Challenges and solutions
                </h2>
                <dl className="case__challenges">
                  {challenges.map((item, index) => (
                    <div key={index}>
                      <dt>{item.challenge}</dt>
                      {item.solution ? <dd>{item.solution}</dd> : null}
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <Link href="/projects" className="arrow-link case__back">
              <FiArrowLeft aria-hidden="true" /> All projects
            </Link>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="section" aria-labelledby="related-heading">
          <div className="container">
            <div className="section__header">
              <p className="eyebrow">More work</p>
              <h2 id="related-heading" className="heading-1">
                Related Projects
              </h2>
            </div>
            <div className="project-grid">
              {related.map((item) => (
                <ProjectCard key={item.id} project={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ContactCta heading={home.contact_heading || 'Get in touch'} text={home.contact_invitation} />
      <JsonLd data={structuredData} />
    </>
  );
}
