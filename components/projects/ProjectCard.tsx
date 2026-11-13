import Image from 'next/image';
import Link from 'next/link';
import { PROJECT_STATUS_LABELS } from '@/lib/utils/format';
import type { ProjectSummary } from '@/types/portfolio';

interface ProjectCardProps {
  project: ProjectSummary;
  priority?: boolean;
  showSummary?: boolean;
}

export function ProjectCard({ project, priority = false, showSummary = false }: ProjectCardProps) {
  return (
    <article className="project-card">
      <div className="project-card__media">
        {project.coverUrl ? (
          <Image
            src={project.coverUrl}
            alt={`${project.title} screenshot`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 340px"
            priority={priority}
          />
        ) : (
          <div className="project-card__placeholder" aria-hidden="true">
            <span>{project.categoryName ?? 'Project'}</span>
            <span>{project.title}</span>
          </div>
        )}
      </div>
      <span className="project-card__status">{PROJECT_STATUS_LABELS[project.status] ?? project.status}</span>

      <div className="project-card__body">
        <h3 className="project-card__title">
          <Link href={`/projects/${project.slug}`}>{project.title}</Link>
        </h3>
        {project.categoryName ? <p className="project-card__category">{project.categoryName}</p> : null}
        {project.technologies.length > 0 ? (
          <p className="project-card__tech">{project.technologies.slice(0, 4).join(', ')}</p>
        ) : null}
        {showSummary && project.summary ? <p className="project-card__summary">{project.summary}</p> : null}
      </div>
    </article>
  );
}
