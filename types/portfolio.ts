// View models used by public pages: database rows joined and resolved to URLs.

import type { ProjectImageRow, ProjectRow, SkillCategoryRow, SkillRow } from './database';

export interface ProjectSummary
  extends Pick<
    ProjectRow,
    'id' | 'slug' | 'title' | 'summary' | 'status' | 'technologies' | 'featured' | 'category_id' | 'updated_at'
  > {
  coverUrl: string | null;
  categoryName: string | null;
  categorySlug: string | null;
}

export interface ProjectDetail extends ProjectRow {
  coverUrl: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  images: Array<ProjectImageRow & { url: string }>;
}

export interface SkillGroup extends SkillCategoryRow {
  skills: SkillRow[];
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  description: string;
  externalUrl: string;
  url: string;
  width: number | null;
  height: number | null;
  categorySlug: string | null;
  categoryName: string | null;
  featured: boolean;
}

export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  publishedAt: string;
  tags: string[];
}

export interface PostDetail extends PostSummary {
  body: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
}
