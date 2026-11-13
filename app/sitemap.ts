import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/env';
import { getProjects } from '@/lib/queries/public';

export const revalidate = 3600;

const STATIC_PATHS = ['', '/about', '/experience', '/expertise', '/projects', '/creative-work', '/education', '/contact'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects();

  return [
    ...STATIC_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1 : 0.8,
    })),
    ...projects.map((project) => ({
      url: `${SITE_URL}/projects/${project.slug}`,
      lastModified: project.updated_at ? new Date(project.updated_at) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
