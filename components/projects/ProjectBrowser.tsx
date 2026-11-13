'use client';

import { useMemo, useState } from 'react';
import { ProjectCard } from './ProjectCard';
import type { ProjectSummary } from '@/types/portfolio';

interface ProjectBrowserProps {
  projects: ProjectSummary[];
  categories: Array<{ slug: string; name: string }>;
}

export function ProjectBrowser({ projects, categories }: ProjectBrowserProps) {
  const [active, setActive] = useState<string>('all');

  const visible = useMemo(
    () => (active === 'all' ? projects : projects.filter((project) => project.categorySlug === active)),
    [active, projects],
  );

  return (
    <div>
      <div className="filter-bar" role="group" aria-label="Filter projects by category">
        <button
          type="button"
          className="filter-bar__button"
          aria-pressed={active === 'all'}
          onClick={() => setActive('all')}
        >
          All Projects
        </button>
        {categories.map((category) => (
          <button
            key={category.slug}
            type="button"
            className="filter-bar__button"
            aria-pressed={active === category.slug}
            onClick={() => setActive(category.slug)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <p className="visually-hidden" role="status">
        {visible.length} {visible.length === 1 ? 'project' : 'projects'} shown
      </p>

      {visible.length > 0 ? (
        <div className="project-grid">
          {visible.map((project, index) => (
            <ProjectCard key={project.id} project={project} priority={index < 3} showSummary />
          ))}
        </div>
      ) : (
        <p className="empty-state">There are no published projects in this category yet.</p>
      )}
    </div>
  );
}
