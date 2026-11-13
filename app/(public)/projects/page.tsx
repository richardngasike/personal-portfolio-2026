import type { Metadata } from 'next';
import '@/styles/components/project-card.css';
import '@/styles/pages/projects.css';
import { PageHeader } from '@/components/shared/PageHeader';
import { ContactCta } from '@/components/shared/ContactCta';
import { ProjectBrowser } from '@/components/projects/ProjectBrowser';
import { JsonLd } from '@/components/shared/JsonLd';
import { absoluteUrl, pageMetadata } from '@/lib/seo';
import { getProjectCategories, getProjects } from '@/lib/queries/public';

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: 'Projects: web, mobile and data applications',
  description:
    'Software projects by Richard Ngasike: web applications, mobile applications, backend systems and data tools, each with a case study.',
  path: '/projects',
});

export default async function ProjectsPage() {
  const [projects, categories] = await Promise.all([getProjects(), getProjectCategories()]);

  return (
    <>
      <PageHeader
        path="/projects"
        eyebrow="Projects"
        title="Software projects that solve real problems."
        lead="Web, mobile, backend and data projects. Each one links to a case study covering the problem, the build and the stack."
      />

      <section className="section section--flush-top">
        <div className="container">
          {projects.length > 0 ? (
            <ProjectBrowser
              projects={projects}
              categories={categories.map((category) => ({ slug: category.slug, name: category.name }))}
            />
          ) : (
            <p className="empty-state">Projects have not been published yet.</p>
          )}
        </div>
      </section>

      <ContactCta />
      {projects.length > 0 ? (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Projects by Richard Ngasike',
            itemListElement: projects.map((project, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: project.title,
              url: absoluteUrl(`/projects/${project.slug}`),
            })),
          }}
        />
      ) : null}
    </>
  );
}
