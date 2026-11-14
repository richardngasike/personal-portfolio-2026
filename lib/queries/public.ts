import 'server-only';

import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { assetUrl } from '@/lib/storage';
import type {
  CategoryRow,
  EducationRow,
  ExperienceRow,
  GalleryImageRow,
  HomepageRow,
  ProfileRow,
  ProjectImageRow,
  ProjectRow,
  SettingsRow,
  SkillCategoryRow,
  SkillRow,
  PostRow,
  SocialLinkRow,
} from '@/types/database';
import type { GalleryItem, PostDetail, PostSummary, ProjectDetail, ProjectSummary, SkillGroup } from '@/types/portfolio';

// All public reads go through the anonymous client, so Row Level Security
// guarantees that only published content is ever returned. Each query fails
// soft: a missing database yields empty content, never a crashed page.

const EMPTY_SETTINGS: SettingsRow = {
  site_title: 'Richard Ngasike',
  meta_description: '',
  wordmark: 'Richard Ngasike',
  logo_path: null,
  favicon_path: null,
  og_image_path: null,
  footer_text: '',
  copyright_holder: 'Richard Ngasike',
  copyright_start_year: null,
  seo_keywords: [],
  invoice_from_address: '',
  bank_account_name: '',
  bank_account_number: '',
  bank_name: '',
  bank_branch: '',
  bank_address: '',
  bank_iban: '',
  bank_swift: '',
  mpesa_details: '',
  updated_at: '',
};

const EMPTY_PROFILE: ProfileRow = {
  full_name: 'Richard Ngasike',
  headline: '',
  short_intro: '',
  biography: '',
  philosophy: '',
  journey: [],
  interests: [],
  photo_path: null,
  location: '',
  email: '',
  phone: '',
  github_url: '',
  linkedin_url: '',
  updated_at: '',
};

const EMPTY_HOMEPAGE: HomepageRow = {
  professional_title: '',
  hero_heading: '',
  hero_description: '',
  disciplines: [],
  hero_image_path: null,
  primary_button_text: '',
  primary_button_link: '',
  secondary_button_text: '',
  secondary_button_link: '',
  about_heading: '',
  about_intro: '',
  contact_heading: '',
  contact_invitation: '',
  updated_at: '',
};

async function selectAll<T>(table: string, order: string[] = ['sort_order']): Promise<T[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  let query = supabase.from(table).select('*');
  for (const column of order) query = query.order(column, { ascending: true });
  const { data, error } = await query;
  if (error) {
    console.error(`[queries] ${table}: ${error.message}`);
    return [];
  }
  return (data ?? []) as T[];
}

async function selectSingleton<T>(table: string, fallback: T): Promise<T> {
  const supabase = createPublicClient();
  if (!supabase) return fallback;
  const { data, error } = await supabase.from(table).select('*').maybeSingle();
  if (error) {
    console.error(`[queries] ${table}: ${error.message}`);
    return fallback;
  }
  return data ? ({ ...fallback, ...data } as T) : fallback;
}

export const getSettings = cache(() => selectSingleton<SettingsRow>('website_settings', EMPTY_SETTINGS));
export const getProfile = cache(() => selectSingleton<ProfileRow>('profiles', EMPTY_PROFILE));
export const getHomepage = cache(() => selectSingleton<HomepageRow>('homepage_content', EMPTY_HOMEPAGE));

export const getSocialLinks = cache(() => selectAll<SocialLinkRow>('social_links'));
export const getExperiences = cache(() => selectAll<ExperienceRow>('experiences'));
export const getEducation = cache(() => selectAll<EducationRow>('education'));
export const getProjectCategories = cache(() => selectAll<CategoryRow>('project_categories'));
export const getGalleryCategories = cache(() => selectAll<CategoryRow>('gallery_categories'));

export const getSkillGroups = cache(async (): Promise<SkillGroup[]> => {
  const [categories, skills] = await Promise.all([
    selectAll<SkillCategoryRow>('skill_categories'),
    selectAll<SkillRow>('skills'),
  ]);
  return categories
    .map((category) => ({
      ...category,
      skills: skills.filter((skill) => skill.category_id === category.id),
    }))
    .filter((group) => group.skills.length > 0);
});

function toSummary(project: ProjectRow, categories: CategoryRow[]): ProjectSummary {
  const category = categories.find((item) => item.id === project.category_id) ?? null;
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    status: project.status,
    technologies: project.technologies,
    featured: project.featured,
    category_id: project.category_id,
    updated_at: project.updated_at,
    coverUrl: assetUrl('project-images', project.cover_path),
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
  };
}

const getProjectRows = cache(() => selectAll<ProjectRow>('projects'));

export const getProjects = cache(async (): Promise<ProjectSummary[]> => {
  const [projects, categories] = await Promise.all([getProjectRows(), getProjectCategories()]);
  return projects.map((project) => toSummary(project, categories));
});

export const getFeaturedProjects = cache(async (): Promise<ProjectSummary[]> => {
  const projects = await getProjects();
  return projects.filter((project) => project.featured);
});

export const getProjectBySlug = cache(async (slug: string): Promise<ProjectDetail | null> => {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const { data: project, error } = await supabase.from('projects').select('*').eq('slug', slug).maybeSingle();
  if (error) console.error(`[queries] projects/${slug}: ${error.message}`);
  if (!project) return null;

  const [{ data: images }, categories] = await Promise.all([
    supabase.from('project_images').select('*').eq('project_id', project.id).order('sort_order', { ascending: true }),
    getProjectCategories(),
  ]);
  const row = project as ProjectRow;
  const category = categories.find((item) => item.id === row.category_id) ?? null;

  return {
    ...row,
    coverUrl: assetUrl('project-images', row.cover_path),
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    images: ((images ?? []) as ProjectImageRow[])
      .map((image) => ({ ...image, url: assetUrl('project-images', image.image_path) ?? '' }))
      .filter((image) => image.url),
  };
});

export const getGallery = cache(async (): Promise<{ categories: CategoryRow[]; items: GalleryItem[] }> => {
  const [categories, images] = await Promise.all([
    getGalleryCategories(),
    selectAll<GalleryImageRow>('gallery_images'),
  ]);

  const items: GalleryItem[] = [];
  for (const image of images) {
    const url = assetUrl('gallery-images', image.image_path);
    if (!url) continue;
    const category = categories.find((item) => item.id === image.category_id) ?? null;
    items.push({
      id: image.id,
      title: image.title,
      caption: image.caption,
      description: image.description,
      externalUrl: image.external_url,
      url,
      width: image.width,
      height: image.height,
      categorySlug: category?.slug ?? null,
      categoryName: category?.name ?? null,
      featured: image.featured,
    });
  }

  const used = new Set(items.map((item) => item.categorySlug));
  return { categories: categories.filter((category) => used.has(category.slug)), items };
});

// True when a current, published CV exists. The file itself is private.
export const hasCurrentCv = cache(async (): Promise<boolean> => {
  const supabase = createPublicClient();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('documents')
    .select('id')
    .eq('kind', 'cv')
    .eq('is_current', true)
    .eq('published', true)
    .limit(1);
  if (error) return false;
  return Boolean(data && data.length > 0);
});

// Blog ------------------------------------------------------------------------

function toPostSummary(row: PostRow): PostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverUrl: assetUrl('gallery-images', row.cover_path),
    publishedAt: row.published_at,
    tags: row.tags,
  };
}

export const getPosts = cache(async (): Promise<PostSummary[]> => {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    console.error(`[queries] posts: ${error.message}`);
    return [];
  }
  return ((data ?? []) as PostRow[]).map(toPostSummary);
});

export const getPostBySlug = cache(async (slug: string): Promise<PostDetail | null> => {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from('posts').select('*').eq('slug', slug).maybeSingle();
  if (error) console.error(`[queries] posts/${slug}: ${error.message}`);
  if (!data) return null;
  const row = data as PostRow;
  return {
    ...toPostSummary(row),
    body: row.body,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    updatedAt: row.updated_at,
  };
});
