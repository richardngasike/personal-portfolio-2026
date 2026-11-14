// Row types for the tables defined in supabase/migrations.

export interface LabelledLink {
  label: string;
  url: string;
}

export interface JourneyStep {
  period: string;
  title: string;
  description: string;
}

export interface ChallengeItem {
  challenge: string;
  solution: string;
}

export interface ProfileRow {
  full_name: string;
  headline: string;
  short_intro: string;
  biography: string;
  philosophy: string;
  journey: JourneyStep[];
  interests: string[];
  photo_path: string | null;
  location: string;
  email: string;
  phone: string;
  github_url: string;
  linkedin_url: string;
  updated_at: string;
}

export interface HomepageRow {
  professional_title: string;
  hero_heading: string;
  hero_description: string;
  disciplines: string[];
  hero_image_path: string | null;
  primary_button_text: string;
  primary_button_link: string;
  secondary_button_text: string;
  secondary_button_link: string;
  about_heading: string;
  about_intro: string;
  contact_heading: string;
  contact_invitation: string;
  updated_at: string;
}

export interface SettingsRow {
  site_title: string;
  meta_description: string;
  wordmark: string;
  logo_path: string | null;
  favicon_path: string | null;
  og_image_path: string | null;
  footer_text: string;
  copyright_holder: string;
  copyright_start_year: number | null;
  seo_keywords: string[];
  invoice_from_address: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
  bank_branch: string;
  bank_address: string;
  bank_iban: string;
  bank_swift: string;
  mpesa_details: string;
  updated_at: string;
}

export interface SocialLinkRow {
  id: string;
  platform: string;
  label: string;
  url: string;
  sort_order: number;
  published: boolean;
}

export interface ExperienceRow {
  id: string;
  organisation: string;
  department: string;
  job_title: string;
  engagement_type: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  date_display: string;
  logo_path: string | null;
  overview: string;
  responsibilities: string[];
  contributions: string[];
  deliverables: string[];
  technologies: string[];
  related_links: LabelledLink[];
  attachments: LabelledLink[];
  sort_order: number;
  published: boolean;
  updated_at: string;
}

export interface EducationRow {
  id: string;
  kind: 'formal' | 'professional_learning';
  institution: string;
  qualification: string;
  field_of_study: string;
  awarding_body: string;
  exam_series: string;
  start_date: string | null;
  end_date: string | null;
  date_display: string;
  description: string;
  coursework: string[];
  certificate_path: string | null;
  sort_order: number;
  published: boolean;
  updated_at: string;
}

export interface SkillCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  published: boolean;
}

export interface SkillRow {
  id: string;
  category_id: string;
  name: string;
  description: string;
  sort_order: number;
  published: boolean;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category_id: string | null;
  status: 'live' | 'in_development' | 'completed' | 'archived';
  overview: string;
  problem: string;
  solution: string;
  role: string;
  objectives: string[];
  features: string[];
  architecture: string;
  technologies: string[];
  implementation: string;
  data_architecture: string;
  challenges: ChallengeItem[];
  live_url: string;
  repo_url: string;
  cover_path: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  seo_title: string;
  seo_description: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectImageRow {
  id: string;
  project_id: string;
  image_path: string;
  caption: string;
  alt_text: string;
  sort_order: number;
}

export interface GalleryImageRow {
  id: string;
  category_id: string | null;
  title: string;
  caption: string;
  description: string;
  image_path: string;
  external_url: string;
  width: number | null;
  height: number | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  updated_at: string;
}

export interface DocumentRow {
  id: string;
  title: string;
  kind: 'cv' | 'certificate' | 'other';
  file_path: string;
  is_current: boolean;
  published: boolean;
  sort_order: number;
  updated_at: string;
}

export interface ContactMessageRow {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
}

export interface PostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_path: string | null;
  tags: string[];
  published_at: string;
  published: boolean;
  seo_title: string;
  seo_description: string;
  created_at: string;
  updated_at: string;
}
