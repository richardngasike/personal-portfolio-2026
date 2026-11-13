import Link from 'next/link';
import type { ProjectSummary } from '@/types/portfolio';
import { ProjectMeta } from './ProjectCard';
import { ProjectCover } from './ProjectCover';

// Large two-column presentation for the lead project on the homepage.
export function ProjectFeature({ project }: { project: ProjectSummary }) {
  return (
    <article className="project-feature">
      <ProjectCover project={project} priority sizes="(max-width: 820px) 100vw, 680px" />
      <div className="project-feature__body">
        <ProjectMeta project={project} />
        <h3 className="project-feature__title">
          <Link href={`/projects/${project.slug}`}>{project.title}</Link>
        </h3>
        {project.summary ? <p className="project-feature__summary">{project.summary}</p> : null}
        {project.technologies.length > 0 ? (
          <ul className="tag-list" aria-label="Technologies">
            {project.technologies.slice(0, 6).map((technology) => (
              <li key={technology} className="tag">
                {technology}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
