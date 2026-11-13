import Link from 'next/link';
import { PROJECT_STATUS_LABELS } from '@/lib/utils/format';
import type { ProjectSummary } from '@/types/portfolio';
import { ProjectCover } from './ProjectCover';

interface ProjectCardProps {
  project: ProjectSummary;
  priority?: boolean;
  showSummary?: boolean;
}

export function ProjectMeta({ project }: { project: ProjectSummary }) {
  return (
    <p className="project-card__meta">
      {project.categoryName ? <span>{project.categoryName}</span> : null}
      <span className="status" data-status={project.status}>
        {PROJECT_STATUS_LABELS[project.status] ?? project.status}
      </span>
    </p>
  );
}

export function ProjectCard({ project, priority = false, showSummary = true }: ProjectCardProps) {
  return (
    <article className="project-card">
      <ProjectCover project={project} priority={priority} sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 400px" />
      <div className="project-card__body">
        <ProjectMeta project={project} />
        <h3 className="project-card__title">
          <Link href={`/projects/${project.slug}`}>{project.title}</Link>
        </h3>
        {showSummary && project.summary ? <p className="project-card__summary">{project.summary}</p> : null}
        {project.technologies.length > 0 ? (
          <p className="project-card__tech">{project.technologies.slice(0, 5).join(', ')}</p>
        ) : null}
      </div>
    </article>
  );
}
