import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/env';
import { getPosts, getProfile, getProjects, getSettings } from '@/lib/queries/public';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 3600;

const STATIC_PATHS = ['', '/about', '/experience', '/expertise', '/projects', '/creative-work', '/blog', '/education', '/contact'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts, profile, settings] = await Promise.all([getProjects(), getPosts(), getProfile(), getSettings()]);
  const latest = [profile.updated_at, settings.updated_at, ...projects.map((project) => project.updated_at)]
    .filter(Boolean)
    .sort()
    .pop();
  const siteModified = latest ? new Date(latest) : undefined;

  return [
    ...STATIC_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: siteModified,
      changeFrequency: 'monthly' as const,
      priority: path === '' ? 1 : 0.8,
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...projects.map((project) => ({
      url: `${SITE_URL}/projects/${project.slug}`,
      lastModified: project.updated_at ? new Date(project.updated_at) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      ...(project.coverUrl ? { images: [absoluteUrl(project.coverUrl)] } : {}),
    })),
  ];
}
