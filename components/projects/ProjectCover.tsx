import Image from 'next/image';
import type { ProjectSummary } from '@/types/portfolio';

interface ProjectCoverProps {
  project: ProjectSummary;
  priority?: boolean;
  sizes: string;
}

// Screenshot when one exists; otherwise a typographic cover built from the
// project's own name, category and stack.
export function ProjectCover({ project, priority = false, sizes }: ProjectCoverProps) {
  return (
    <div className="cover">
      {project.coverUrl ? (
        <Image src={project.coverUrl} alt={`${project.title} screenshot`} fill sizes={sizes} priority={priority} />
      ) : (
        <div className="cover__type" aria-hidden="true">
          <span className="cover__type-category">{project.categoryName ?? 'Project'}</span>
          <span className="cover__type-title">{project.title}</span>
          <span className="cover__type-stack">{project.technologies.slice(0, 4).join(' / ')}</span>
        </div>
      )}
    </div>
  );
}
