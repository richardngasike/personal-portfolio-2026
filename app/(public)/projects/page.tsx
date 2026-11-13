import type { Metadata } from 'next';
import '@/styles/components/project-card.css';
import '@/styles/pages/projects.css';
import { PageHeader } from '@/components/shared/PageHeader';
import { ContactCta } from '@/components/shared/ContactCta';
import { ProjectBrowser } from '@/components/projects/ProjectBrowser';
import { pageMetadata } from '@/lib/seo';
import { getHomepage, getProjectCategories, getProjects } from '@/lib/queries/public';

export const revalidate = 300;

export const metadata: Metadata = pageMetadata({
  title: 'Projects',
  description:
    'Software projects by Richard Ngasike: web applications, mobile applications, backend systems and data tools, each with a case study.',
  path: '/projects',
});

export default async function ProjectsPage() {
  const [projects, categories, home] = await Promise.all([getProjects(), getProjectCategories(), getHomepage()]);

  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="My Projects"
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

      <ContactCta heading={home.contact_heading || 'Get in touch'} text={home.contact_invitation} />
    </>
  );
}
