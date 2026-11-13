-- Richard Ngasike portfolio: core schema
-- Run in order: 000001_schema, 000002_rls, 000003_storage, then seed.sql

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Administrators
-- ---------------------------------------------------------------------------

create table public.admin_profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'admin' check (role in ('admin', 'editor')),
  full_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_profiles_updated_at
  before update on public.admin_profiles
  for each row execute function public.set_updated_at();

-- Role check used by every RLS policy. SECURITY DEFINER so the lookup itself
-- is not blocked by RLS on admin_profiles; search_path pinned for safety.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Singletons: profile, homepage, website settings
-- A boolean primary key constrained to TRUE guarantees exactly one row.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id            boolean primary key default true check (id),
  full_name     text not null default '',
  headline      text not null default '',
  short_intro   text not null default '',
  biography     text not null default '',
  philosophy    text not null default '',
  journey       jsonb not null default '[]'::jsonb,
  interests     text[] not null default '{}',
  photo_path    text,
  location      text not null default '',
  email         text not null default '',
  phone         text not null default '',
  github_url    text not null default '',
  linkedin_url  text not null default '',
  updated_at    timestamptz not null default now(),
  constraint profiles_journey_is_array check (jsonb_typeof(journey) = 'array')
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.homepage_content (
  id                     boolean primary key default true check (id),
  professional_title     text not null default '',
  hero_heading           text not null default '',
  hero_description       text not null default '',
  disciplines            text[] not null default '{}',
  hero_image_path        text,
  primary_button_text    text not null default '',
  primary_button_link    text not null default '',
  secondary_button_text  text not null default '',
  secondary_button_link  text not null default '',
  about_heading          text not null default '',
  about_intro            text not null default '',
  contact_heading        text not null default '',
  contact_invitation     text not null default '',
  updated_at             timestamptz not null default now()
);

create trigger homepage_content_updated_at
  before update on public.homepage_content
  for each row execute function public.set_updated_at();

create table public.website_settings (
  id                    boolean primary key default true check (id),
  site_title            text not null default '',
  meta_description      text not null default '',
  wordmark              text not null default '',
  logo_path             text,
  favicon_path          text,
  og_image_path         text,
  footer_text           text not null default '',
  copyright_holder      text not null default '',
  copyright_start_year  integer check (copyright_start_year is null or copyright_start_year between 1990 and 2100),
  seo_keywords          text[] not null default '{}',
  updated_at            timestamptz not null default now()
);

create trigger website_settings_updated_at
  before update on public.website_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Social links
-- ---------------------------------------------------------------------------

create table public.social_links (
  id          uuid primary key default gen_random_uuid(),
  platform    text not null check (char_length(platform) between 1 and 40),
  label       text not null default '',
  url         text not null check (url ~* '^https?://'),
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index social_links_order_idx on public.social_links (published, sort_order);

create trigger social_links_updated_at
  before update on public.social_links
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Experience
-- ---------------------------------------------------------------------------

create table public.experiences (
  id                uuid primary key default gen_random_uuid(),
  organisation      text not null check (char_length(organisation) between 1 and 200),
  department        text not null default '',
  job_title         text not null check (char_length(job_title) between 1 and 200),
  engagement_type   text not null default '',
  location          text not null default '',
  start_date        date,
  end_date          date,
  is_current        boolean not null default false,
  -- Free-text override for records whose dates are only known to the year.
  date_display      text not null default '',
  logo_path         text,
  overview          text not null default '',
  responsibilities  text[] not null default '{}',
  contributions     text[] not null default '{}',
  deliverables      text[] not null default '{}',
  technologies      text[] not null default '{}',
  related_links     jsonb not null default '[]'::jsonb,
  attachments       jsonb not null default '[]'::jsonb,
  sort_order        integer not null default 0,
  published         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint experiences_dates_ordered check (end_date is null or start_date is null or end_date >= start_date),
  constraint experiences_links_is_array check (jsonb_typeof(related_links) = 'array'),
  constraint experiences_attachments_is_array check (jsonb_typeof(attachments) = 'array')
);

create index experiences_order_idx on public.experiences (published, sort_order);

create trigger experiences_updated_at
  before update on public.experiences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Education and professional learning
-- ---------------------------------------------------------------------------

create table public.education (
  id                uuid primary key default gen_random_uuid(),
  kind              text not null default 'formal' check (kind in ('formal', 'professional_learning')),
  institution       text not null default '',
  qualification     text not null check (char_length(qualification) between 1 and 250),
  field_of_study    text not null default '',
  awarding_body     text not null default '',
  exam_series       text not null default '',
  start_date        date,
  end_date          date,
  date_display      text not null default '',
  description       text not null default '',
  coursework        text[] not null default '{}',
  certificate_path  text,
  sort_order        integer not null default 0,
  published         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint education_dates_ordered check (end_date is null or start_date is null or end_date >= start_date)
);

create index education_order_idx on public.education (published, kind, sort_order);

create trigger education_updated_at
  before update on public.education
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Skills
-- ---------------------------------------------------------------------------

create table public.skill_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 120),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description  text not null default '',
  sort_order   integer not null default 0,
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger skill_categories_updated_at
  before update on public.skill_categories
  for each row execute function public.set_updated_at();

create table public.skills (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.skill_categories (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 120),
  description  text not null default '',
  sort_order   integer not null default 0,
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint skills_unique_per_category unique (category_id, name)
);

create index skills_category_idx on public.skills (category_id, sort_order);

create trigger skills_updated_at
  before update on public.skills
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------

create table public.project_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger project_categories_updated_at
  before update on public.project_categories
  for each row execute function public.set_updated_at();

create table public.projects (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title              text not null check (char_length(title) between 1 and 200),
  summary            text not null default '',
  category_id        uuid references public.project_categories (id) on delete set null,
  status             text not null default 'in_development'
                       check (status in ('live', 'in_development', 'completed', 'archived')),
  overview           text not null default '',
  problem            text not null default '',
  solution           text not null default '',
  role               text not null default '',
  objectives         text[] not null default '{}',
  features           text[] not null default '{}',
  architecture       text not null default '',
  technologies       text[] not null default '{}',
  implementation     text not null default '',
  data_architecture  text not null default '',
  challenges         jsonb not null default '[]'::jsonb,
  live_url           text not null default '' check (live_url = '' or live_url ~* '^https?://'),
  repo_url           text not null default '' check (repo_url = '' or repo_url ~* '^https?://'),
  cover_path         text,
  featured           boolean not null default false,
  published          boolean not null default false,
  sort_order         integer not null default 0,
  seo_title          text not null default '',
  seo_description    text not null default '',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint projects_challenges_is_array check (jsonb_typeof(challenges) = 'array')
);

create index projects_listing_idx on public.projects (published, sort_order);
create index projects_featured_idx on public.projects (featured) where featured and published;
create index projects_category_idx on public.projects (category_id);

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create table public.project_images (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  image_path  text not null,
  caption     text not null default '',
  alt_text    text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index project_images_project_idx on public.project_images (project_id, sort_order);

create trigger project_images_updated_at
  before update on public.project_images
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Creative gallery
-- ---------------------------------------------------------------------------

create table public.gallery_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger gallery_categories_updated_at
  before update on public.gallery_categories
  for each row execute function public.set_updated_at();

create table public.gallery_images (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid references public.gallery_categories (id) on delete set null,
  title         text not null default '',
  caption       text not null default '',
  description   text not null default '',
  image_path    text not null,
  external_url  text not null default '' check (external_url = '' or external_url ~* '^https?://'),
  width         integer check (width is null or width > 0),
  height        integer check (height is null or height > 0),
  featured      boolean not null default false,
  published     boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index gallery_images_listing_idx on public.gallery_images (published, sort_order);
create index gallery_images_category_idx on public.gallery_images (category_id);

create trigger gallery_images_updated_at
  before update on public.gallery_images
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Documents (CV and other professional documents)
-- ---------------------------------------------------------------------------

create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 200),
  kind        text not null default 'other' check (kind in ('cv', 'certificate', 'other')),
  file_path   text not null,
  is_current  boolean not null default false,
  published   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- At most one current CV at any time.
create unique index documents_one_current_cv on public.documents (kind) where kind = 'cv' and is_current;

create trigger documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Contact messages
-- ---------------------------------------------------------------------------

create table public.contact_messages (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null check (char_length(full_name) between 2 and 120),
  email        text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subject      text not null check (char_length(subject) between 2 and 200),
  message      text not null check (char_length(message) between 10 and 5000),
  is_read      boolean not null default false,
  is_archived  boolean not null default false,
  -- Salted SHA-256 of the sender address, used only for rate limiting.
  ip_hash      text,
  created_at   timestamptz not null default now()
);

create index contact_messages_inbox_idx on public.contact_messages (is_archived, created_at desc);
create index contact_messages_rate_idx on public.contact_messages (ip_hash, created_at desc);
