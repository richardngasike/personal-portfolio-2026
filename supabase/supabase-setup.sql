-- Richard Ngasike portfolio: complete database setup.
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- It runs in one transaction: if anything fails, nothing is applied.

begin;

-- ============================================================================
-- migrations/20261112000001_schema.sql
-- ============================================================================

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

-- ============================================================================
-- migrations/20261112000002_rls.sql
-- ============================================================================

-- Row Level Security
-- Visitors (anon) read published rows only. Administrators have full access.
-- contact_messages has no anon policy at all: submissions are written by the
-- server with the service role after validation and rate limiting.

do $$
declare
  t text;
begin
  foreach t in array array[
    'admin_profiles', 'profiles', 'homepage_content', 'website_settings', 'social_links',
    'experiences', 'education', 'skill_categories', 'skills', 'project_categories',
    'projects', 'project_images', 'gallery_categories', 'gallery_images', 'documents',
    'contact_messages'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Table privileges. RLS still decides which rows are visible.
revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.profiles, public.homepage_content, public.website_settings, public.social_links,
  public.experiences, public.education, public.skill_categories, public.skills,
  public.project_categories, public.projects, public.project_images,
  public.gallery_categories, public.gallery_images, public.documents
to anon;

grant select, insert, update, delete on
  public.profiles, public.homepage_content, public.website_settings, public.social_links,
  public.experiences, public.education, public.skill_categories, public.skills,
  public.project_categories, public.projects, public.project_images,
  public.gallery_categories, public.gallery_images, public.documents,
  public.contact_messages
to authenticated;

grant select on public.admin_profiles to authenticated;

-- Administrators -------------------------------------------------------------

create policy "admin_profiles: read own row"
  on public.admin_profiles for select to authenticated
  using (user_id = auth.uid());

-- No insert/update/delete policy on admin_profiles: roles are provisioned with
-- the service role only (scripts/create-admin.mjs or the SQL editor).

-- Singletons -----------------------------------------------------------------

create policy "profiles: public read" on public.profiles
  for select to anon, authenticated using (true);
create policy "profiles: admin write" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "homepage_content: public read" on public.homepage_content
  for select to anon, authenticated using (true);
create policy "homepage_content: admin write" on public.homepage_content
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "website_settings: public read" on public.website_settings
  for select to anon, authenticated using (true);
create policy "website_settings: admin write" on public.website_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Categories (always readable; they carry no draft content) ---------------------

create policy "project_categories: public read" on public.project_categories
  for select to anon, authenticated using (true);
create policy "project_categories: admin write" on public.project_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "gallery_categories: public read" on public.gallery_categories
  for select to anon, authenticated using (true);
create policy "gallery_categories: admin write" on public.gallery_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Published content ------------------------------------------------------------

create policy "social_links: read published" on public.social_links
  for select to anon, authenticated using (published or public.is_admin());
create policy "social_links: admin write" on public.social_links
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "experiences: read published" on public.experiences
  for select to anon, authenticated using (published or public.is_admin());
create policy "experiences: admin write" on public.experiences
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "education: read published" on public.education
  for select to anon, authenticated using (published or public.is_admin());
create policy "education: admin write" on public.education
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "skill_categories: read published" on public.skill_categories
  for select to anon, authenticated using (published or public.is_admin());
create policy "skill_categories: admin write" on public.skill_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "skills: read published" on public.skills
  for select to anon, authenticated
  using (
    public.is_admin()
    or (
      published
      and exists (
        select 1 from public.skill_categories c
        where c.id = skills.category_id and c.published
      )
    )
  );
create policy "skills: admin write" on public.skills
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "projects: read published" on public.projects
  for select to anon, authenticated using (published or public.is_admin());
create policy "projects: admin write" on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "project_images: read for published projects" on public.project_images
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.projects p
      where p.id = project_images.project_id and p.published
    )
  );
create policy "project_images: admin write" on public.project_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "gallery_images: read published" on public.gallery_images
  for select to anon, authenticated using (published or public.is_admin());
create policy "gallery_images: admin write" on public.gallery_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Private tables ---------------------------------------------------------------

-- Visitors may learn that a current CV exists (so the site can show the
-- download button). The file itself sits in a private bucket and is only
-- reachable through a signed URL issued by /api/cv.
create policy "documents: read current published cv" on public.documents
  for select to anon, authenticated
  using ((kind = 'cv' and is_current and published) or public.is_admin());
create policy "documents: admin write" on public.documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "contact_messages: admin read" on public.contact_messages
  for select to authenticated using (public.is_admin());
create policy "contact_messages: admin update" on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "contact_messages: admin delete" on public.contact_messages
  for delete to authenticated using (public.is_admin());

-- ============================================================================
-- migrations/20261112000003_storage.sql
-- ============================================================================

-- Storage buckets and policies
-- Public buckets hold assets shown on the public site. "documents" is private:
-- the CV is served through /api/cv with a short-lived signed URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-images',     'profile-images',     true,  5242880,
     array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('project-images',     'project-images',     true,  8388608,
     array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('gallery-images',     'gallery-images',     true,  10485760,
     array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('organisation-logos', 'organisation-logos', true,  2097152,
     array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('website-assets',     'website-assets',     true,  5242880,
     array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']),
  ('documents',          'documents',          false, 10485760,
     array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "storage: public read of display assets"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id in ('profile-images', 'project-images', 'gallery-images', 'organisation-logos', 'website-assets')
  );

create policy "storage: admin read of documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.is_admin());

create policy "storage: admin insert"
  on storage.objects for insert to authenticated
  with check (
    public.is_admin()
    and bucket_id in ('profile-images', 'project-images', 'gallery-images', 'organisation-logos', 'website-assets', 'documents')
  );

create policy "storage: admin update"
  on storage.objects for update to authenticated
  using (public.is_admin())
  with check (
    public.is_admin()
    and bucket_id in ('profile-images', 'project-images', 'gallery-images', 'organisation-logos', 'website-assets', 'documents')
  );

create policy "storage: admin delete"
  on storage.objects for delete to authenticated
  using (public.is_admin());

-- ============================================================================
-- seed.sql
-- ============================================================================

-- Seed content for richardngasike.co.ke
-- Every statement is idempotent: running the file twice does not duplicate rows.
--
-- Sources: the existing website, Richard's CV, and the UNAIDS contract and
-- interim report. Records that could not be confirmed from those sources are
-- inserted with published = false so they stay off the public site until
-- they are reviewed in the admin dashboard.

-- Singletons -------------------------------------------------------------------

insert into public.website_settings
  (id, site_title, meta_description, wordmark, footer_text, copyright_holder, copyright_start_year, seo_keywords)
values (
  true,
  'Richard Ngasike',
  'Richard Ngasike is a software engineer and designer based in Nairobi, Kenya, building web and mobile applications and designing publications and brand identities.',
  'Richard Ngasike',
  'Software engineering, mobile development and design from Nairobi, Kenya.',
  'Richard Ngasike',
  2025,
  array['Richard Ngasike', 'software engineer Nairobi', 'Flutter developer Kenya', 'Next.js developer', 'graphic designer Nairobi']
)
on conflict (id) do nothing;

insert into public.profiles
  (id, full_name, headline, short_intro, biography, philosophy, journey, interests,
   photo_path, location, email, phone, github_url, linkedin_url)
values (
  true,
  'Richard Ngasike',
  'Software engineer and designer',
  'I build web and mobile applications and design the publications, figures and brand identities that go with them. I work from Nairobi, Kenya.',
  E'I trained in Information and Communication Technology and have spent most of my working life somewhere between code and design.\n\nMy first paid work with computers was digitising birth certificate records at the County Registrar''s office in Samburu County. It was careful, repetitive work, and it taught me early that a system is only as good as the data people put into it. After that I taught computer literacy at Butterfly Techies, taking learners from operating a computer for the first time to building their first web pages in HTML, CSS and JavaScript.\n\nAlongside teaching I started building software for clients. On the web I work mainly with Next.js, React and TypeScript on the front end, and Django or Node.js with PostgreSQL behind it. On mobile I build with Flutter and Dart for Android and iOS. I prefer to own a product from the database schema through to deployment, so I am comfortable on a Linux server as well as in a design file.\n\nDesign has always run in parallel. At Extravis Solutions Africa I designed logos, product labels, packaging, catalogues and campaign graphics for print and digital. That experience is why I still care about typography, spacing and print-ready files when I am writing an interface.\n\nSince late 2025 I have worked with UNAIDS, first as an intern and then as a consultant developer and graphics designer. That work brought the two halves together: laying out slide decks and publication figures on one day, and writing Python scripts for data extraction or building the interface for a health tax simulation model on the next.\n\nI am currently spending my study time on cloud infrastructure, application security and the infrastructure side of AI and machine learning.',
  E'I start with the problem and the people who have it, not with the technology. Most of what I build is used by people on modest phones and unreliable connections, so I aim for software that is clear, fast and difficult to misuse.\n\nI would rather ship something small that is finished than something large that is almost working. I write things down, I check my work against the source, and I do not publish a number I cannot trace.',
  '[
    {"period": "2019", "title": "Records digitisation, Samburu County", "description": "Digitised civil registration records at the County Registrar''s office. My first professional work with structured data."},
    {"period": "2021 - 2022", "title": "Teaching computer literacy", "description": "Taught computer fundamentals and introductory web development at Butterfly Techies."},
    {"period": "2024 - 2025", "title": "Graphic design in industry", "description": "Designed brand, packaging and marketing material at Extravis Solutions Africa while completing a Diploma in ICT."},
    {"period": "2025 - 2026", "title": "UNAIDS internship", "description": "Joined UNAIDS as an intern and coordinated communication among interns across countries."},
    {"period": "2026", "title": "UNAIDS consultancy", "description": "Engaged as a developer and graphics designer: publication design, data work and health tax model interfaces."}
  ]'::jsonb,
  array['Cloud infrastructure', 'Application security', 'AI and ML infrastructure', 'Software architecture', 'Information design'],
  '/images/richard-ngasike.png',
  'Nairobi, Kenya',
  'richardmax254@gmail.com',
  '+254 718 959 781',
  'https://github.com/richardngasike',
  'https://www.linkedin.com/in/richard-ngasike-6247b5232/'
)
on conflict (id) do nothing;

insert into public.homepage_content
  (id, professional_title, hero_heading, hero_description, disciplines, hero_image_path,
   primary_button_text, primary_button_link, secondary_button_text, secondary_button_link,
   about_heading, about_intro, contact_heading, contact_invitation)
values (
  true,
  'Software Engineer · Mobile Developer · Designer',
  'Building digital products through engineering, technology and design.',
  'I''m Richard Ngasike, a software engineer and creative technology professional focused on building practical digital solutions, scalable applications and meaningful digital experiences.',
  array['Software Engineering', 'Mobile Development', 'Technology Infrastructure', 'Creative Design'],
  '/images/richard-ngasike.png',
  'Explore My Work', '/projects',
  'Download CV', '/api/cv',
  'Engineering and design, practised together',
  'I work across the whole product: database and API design, web and mobile interfaces, deployment, and the visual identity around them. My background covers records digitisation in county government, digital skills training, commercial graphic design and, most recently, development and publication design work with UNAIDS.',
  'Have a project in mind?',
  'I take on web and mobile development, backend work and design projects. Tell me what you are trying to build and I will reply by email.'
)
on conflict (id) do nothing;

-- Social links -----------------------------------------------------------------

insert into public.social_links (platform, label, url, sort_order, published)
select v.platform, v.label, v.url, v.sort_order, true
from (values
  ('github',   'GitHub',   'https://github.com/richardngasike', 1),
  ('linkedin', 'LinkedIn', 'https://www.linkedin.com/in/richard-ngasike-6247b5232/', 2),
  ('x',        'X',        'https://x.com/sudopacmansyu', 3)
) as v(platform, label, url, sort_order)
where not exists (select 1 from public.social_links);

-- Experience -------------------------------------------------------------------

insert into public.experiences
  (organisation, department, job_title, engagement_type, location, start_date, end_date, is_current,
   date_display, overview, responsibilities, contributions, deliverables, technologies, sort_order, published)
select * from (values
  (
    'UNAIDS',
    'Sustainability Team, Equitable Finance Practice',
    'Developer and Graphics Designer',
    'Consultancy',
    'Nairobi, Kenya',
    date '2026-06-03', date '2026-12-31', true,
    'June 2026 - December 2026',
    'I am engaged as a consultant developer and graphics designer. The assignment covers the layout and design of integration policy briefs and case studies, and it has grown to include data work and the interface for a health tax simulation model.',
    array[
      'Design and lay out technical slide presentations, policy briefs and infographics on HIV integration.',
      'Prepare publication figures to journal specifications as editable vector artwork.',
      'Write Python scripts that retrieve, clean and consolidate country-level data from public international databases into a master workbook.',
      'Build the user interface and computational backend for health tax simulation models.',
      'Document methods, data sources and limitations in technical notes and progress reports.'
    ],
    array[
      'Recreated and refined six figures for a team publication in Adobe Illustrator, working from the source workbook and the journal''s figure guidelines.',
      'Automated data extraction and matching by country and year for a debt displacement analysis covering 134 countries from 2000 to 2024.',
      'Implemented two health tax models as a web application with a Next.js interface and a Python computation backend.',
      'Developed a conceptual framework infographic through several rounds of review.'
    ],
    array[
      'Slide deck: Integrating HIV into health systems',
      'Slide deck: Operationalising HIV integration',
      'Conceptual framework infographic',
      'Six high-resolution publication figures',
      'Data extraction, cleaning and consolidation for the debt displacement effect analysis',
      'Health tax simulation model interface and computation (two models)'
    ],
    array['Next.js', 'Python', 'Adobe Illustrator', 'Microsoft PowerPoint', 'Microsoft Excel'],
    1, true
  ),
  (
    'UNAIDS',
    'Sustainability Team, Equitable Finance Practice',
    'Intern',
    'Internship',
    '',
    date '2025-11-01', date '2026-04-30', false,
    'November 2025 - April 2026',
    'I joined UNAIDS as an intern. During the internship I also served as coordinator for the organisation''s interns across countries.',
    array[
      'Coordinated communication and engagement among interns working in different countries.',
      'Acted as the liaison between the Staff Development Team and the intern group.',
      'Supported knowledge transfer and day-to-day coordination between interns and staff.'
    ],
    array[]::text[],
    array[]::text[],
    array[]::text[],
    2, true
  ),
  (
    'Extravis Solutions Africa',
    '',
    'Graphic Designer',
    'Full-time',
    '',
    date '2024-11-01', date '2025-11-30', false,
    'November 2024 - November 2025',
    'I designed brand and marketing material for a supplier of sewing and textile products, for both print and digital channels.',
    array[
      'Designed logos, product labels, packaging and marketing materials for sewing and textile supplies.',
      'Created promotional graphics for social media, print and advertising campaigns.',
      'Developed product catalogues and brochures to support sales and branding.',
      'Kept the brand consistent across digital and print platforms.',
      'Prepared print-ready artwork and coordinated with production vendors.'
    ],
    array[]::text[],
    array['Logos and product labels', 'Packaging artwork', 'Product catalogues and brochures', 'Social media and campaign graphics'],
    array['Adobe Illustrator', 'Adobe Photoshop', 'Canva'],
    3, true
  ),
  (
    'Butterfly Techies',
    '',
    'Computer Literacy Instructor',
    '',
    '',
    date '2021-05-01', date '2022-02-28', false,
    'May 2021 - February 2022',
    'I taught computer literacy and introductory web development to learners with a wide range of prior experience.',
    array[
      'Taught computer fundamentals, including operating systems, internet use and Microsoft Office applications.',
      'Introduced students to basic web development with HTML, CSS and JavaScript.',
      'Guided learners in building simple responsive web pages and practical mini-projects.',
      'Ran hands-on sessions to strengthen problem-solving and digital literacy.',
      'Assessed student progress and mentored learners on further study and careers in technology.'
    ],
    array[]::text[],
    array[]::text[],
    array['HTML', 'CSS', 'JavaScript', 'Microsoft Office'],
    4, true
  ),
  (
    'County Registrar Office - Samburu County',
    'Civil Registration',
    'Data Entry Clerk',
    '',
    'Samburu County, Kenya',
    null::date, null::date, false,
    '2019',
    'I worked on the digitisation of birth certificate records, converting physical registers into structured electronic records.',
    array[
      'Digitised birth certificate records by converting physical documentation into structured database entries.',
      'Entered high-volume demographic data accurately and in line with data protection standards.',
      'Verified and validated records for consistency and completeness.',
      'Cross-checked physical files against digital records to maintain data integrity.',
      'Supported database organisation so that records were easier for the office to retrieve.'
    ],
    array[]::text[],
    array[]::text[],
    array[]::text[],
    5, true
  ),
  (
    'Independent',
    '',
    'Freelance Developer',
    'Freelance',
    'Nairobi, Kenya',
    null::date, null::date, true,
    '2020 - Present',
    'Web and mobile development for clients in Kenya and abroad.',
    array[]::text[],
    array[]::text[],
    array[]::text[],
    array[]::text[],
    6, false
  )
) as v
where not exists (select 1 from public.experiences);

-- Education --------------------------------------------------------------------

insert into public.education
  (kind, institution, qualification, field_of_study, awarding_body, exam_series,
   start_date, end_date, date_display, description, coursework, sort_order, published)
select * from (values
  (
    'formal', 'St. John''s Training College, Maralal',
    'Diploma in Information and Communication Technology',
    'Information and Communication Technology',
    'Kenya National Examinations Council (KNEC)',
    'March 2026',
    date '2024-01-01', date '2025-11-30', 'January 2024 - November 2025',
    'A KNEC-examined diploma covering the foundations of computing, programming, databases, networking and systems.',
    array[]::text[], 1, true
  ),
  (
    'formal', 'Mount Kenya University',
    'Bachelor of Science in Information and Communication Technology',
    'Information and Communication Technology', '', '',
    date '2019-09-01', date '2023-11-22', '2019 - 2023',
    '', array[]::text[], 2, false
  ),
  (
    'formal', 'Kenyatta University',
    'KIEP-SKIES Rapid Tech Skills Program in Software Engineering',
    'Software Engineering', '', '',
    date '2024-03-01', date '2024-05-28', 'March 2024 - May 2024',
    '', array[]::text[], 3, false
  ),
  (
    'formal', 'Power Learn Project',
    'Artificial Intelligence',
    'Artificial Intelligence', '', '',
    null::date, null::date, '2026 - Present',
    '', array[]::text[], 4, false
  ),
  ('professional_learning', '', 'Python programming', '', '', '', null::date, null::date, '', '', array[]::text[], 1, true),
  ('professional_learning', '', 'Django development', '', '', '', null::date, null::date, '', '', array[]::text[], 2, true),
  ('professional_learning', '', 'PostgreSQL', '', '', '', null::date, null::date, '', '', array[]::text[], 3, true),
  ('professional_learning', '', 'Advanced Flutter development', '', '', '', null::date, null::date, '', '', array[]::text[], 4, true),
  ('professional_learning', '', 'Backend engineering', '', '', '', null::date, null::date, '', '', array[]::text[], 5, true),
  ('professional_learning', '', 'Cloud infrastructure', '', '', '', null::date, null::date, '', '', array[]::text[], 6, true),
  ('professional_learning', '', 'AI and ML infrastructure', '', '', '', null::date, null::date, '', '', array[]::text[], 7, true),
  ('professional_learning', '', 'Cybersecurity', '', '', '', null::date, null::date, '', '', array[]::text[], 8, true),
  ('professional_learning', '', 'Software architecture', '', '', '', null::date, null::date, '', '', array[]::text[], 9, true)
) as v
where not exists (select 1 from public.education);

-- Skills -----------------------------------------------------------------------

insert into public.skill_categories (name, slug, description, sort_order, published) values
  ('Frontend Engineering',     'frontend-engineering',     'Interfaces for the web, built to be fast, accessible and maintainable.', 1, true),
  ('Mobile Engineering',       'mobile-engineering',       'Cross-platform applications for Android and iOS from a single codebase.', 2, true),
  ('Backend Engineering',      'backend-engineering',      'APIs, authentication and business logic behind web and mobile clients.', 3, true),
  ('Database Engineering',     'database-engineering',     'Relational and document data stores, schema design and data modelling.', 4, true),
  ('Cloud and Infrastructure', 'cloud-and-infrastructure', 'Version control, containers, servers and deployment.', 5, true),
  ('Cybersecurity',            'cybersecurity',            'Security principles and tooling applied to the applications I build.', 6, true),
  ('Creative Technologies',    'creative-technologies',    'Design tools and practice for brand, publication and interface work.', 7, true)
on conflict (slug) do nothing;

insert into public.skills (category_id, name, sort_order, published)
select c.id, v.name, v.sort_order, true
from (values
  ('frontend-engineering', 'JavaScript', 1), ('frontend-engineering', 'TypeScript', 2),
  ('frontend-engineering', 'React', 3), ('frontend-engineering', 'Next.js', 4),
  ('frontend-engineering', 'HTML5', 5), ('frontend-engineering', 'CSS3', 6),
  ('frontend-engineering', 'Responsive web development', 7),
  ('mobile-engineering', 'Flutter', 1), ('mobile-engineering', 'Dart', 2),
  ('mobile-engineering', 'Android development', 3), ('mobile-engineering', 'iOS development', 4),
  ('mobile-engineering', 'Cross-platform application architecture', 5),
  ('backend-engineering', 'Python', 1), ('backend-engineering', 'Django', 2),
  ('backend-engineering', 'FastAPI', 3), ('backend-engineering', 'Node.js', 4),
  ('backend-engineering', 'Express.js', 5), ('backend-engineering', 'REST API development', 6),
  ('database-engineering', 'PostgreSQL', 1), ('database-engineering', 'MongoDB', 2),
  ('database-engineering', 'Supabase', 3), ('database-engineering', 'Database architecture', 4),
  ('database-engineering', 'Data modelling', 5),
  ('cloud-and-infrastructure', 'Docker', 1), ('cloud-and-infrastructure', 'Linux', 2),
  ('cloud-and-infrastructure', 'Git', 3), ('cloud-and-infrastructure', 'GitHub', 4),
  ('cloud-and-infrastructure', 'Vercel', 5), ('cloud-and-infrastructure', 'Render', 6),
  ('cloud-and-infrastructure', 'VPS administration', 7), ('cloud-and-infrastructure', 'Application deployment', 8),
  ('cybersecurity', 'OWASP security principles', 1), ('cybersecurity', 'Burp Suite', 2),
  ('cybersecurity', 'Wireshark', 3), ('cybersecurity', 'Metasploit', 4),
  ('cybersecurity', 'Application security testing', 5),
  ('creative-technologies', 'Adobe Illustrator', 1), ('creative-technologies', 'Adobe Photoshop', 2),
  ('creative-technologies', 'Figma', 3), ('creative-technologies', 'UI/UX design', 4),
  ('creative-technologies', 'Brand identity design', 5)
) as v(category_slug, name, sort_order)
join public.skill_categories c on c.slug = v.category_slug
on conflict (category_id, name) do nothing;

-- Projects ---------------------------------------------------------------------

insert into public.project_categories (name, slug, sort_order) values
  ('Web Applications',         'web-applications',    1),
  ('Mobile Applications',      'mobile-applications', 2),
  ('Backend Systems',          'backend-systems',     3),
  ('Data and Analytics',       'data-and-analytics',  4),
  ('Other Technical Projects', 'other-technical',     5)
on conflict (slug) do nothing;

insert into public.projects
  (slug, title, summary, category_id, status, overview, problem, solution, role, objectives, features,
   architecture, technologies, implementation, data_architecture, challenges, live_url, repo_url,
   cover_path, featured, published, sort_order)
values
  (
    'flashx', 'FlashX',
    'A mobile social networking application for Android and iOS with posts, stories, short-form video, messaging and live streaming.',
    (select id from public.project_categories where slug = 'mobile-applications'),
    'in_development',
    'FlashX is a social networking application for Android and iOS. People share posts, stories and short-form videos, message each other, and broadcast live. The Flutter app talks to a REST API that I designed and built first, before any of the mobile screens.',
    '',
    'I built the complete backend first as a Django REST Framework API, then the Flutter client on top of it. Media is uploaded from the phone directly to Cloudinary using signed uploads, so large video files never pass through the API server.',
    'Sole developer. I designed the data model and API, built the Flutter application, and handle builds and deployment.',
    array[
      'Give the product its own identity instead of copying an existing social app.',
      'Keep the mobile client thin, with all business rules in the API.',
      'Run on both Android and iOS from one codebase.'
    ],
    array[
      'Posts, stories and short-form videos',
      'Direct messaging',
      'Live streaming with real-time viewer interaction',
      'Discovery and search',
      'Token-based authentication with rotating refresh tokens',
      'Admin and moderation tools'
    ],
    'A Flutter client communicates only with a Django REST Framework API over HTTPS. Authentication uses short-lived JSON Web Tokens with rotating refresh tokens that are blacklisted on logout. Application data lives in PostgreSQL. Media files live on Cloudinary and are uploaded from the device with signed requests.',
    array['Flutter', 'Dart', 'Django', 'Django REST Framework', 'PostgreSQL', 'Cloudinary'],
    'State management in the Flutter app uses Provider. The API is documented with OpenAPI. Search uses PostgreSQL trigram matching.',
    'PostgreSQL holds accounts, content, relationships and messages. Media is stored on Cloudinary and referenced by identifier.',
    '[]'::jsonb,
    '', '', null, true, true, 1
  ),
  (
    'nairobi-vacant-houses', 'Nairobi Vacant Houses',
    'A property discovery platform that helps people find vacant rental houses around Nairobi.',
    (select id from public.project_categories where slug = 'web-applications'),
    'live',
    'Nairobi Vacant Houses is a listing platform for rental property in Nairobi and its surroundings. Landlords and agents list vacant houses with the price, amenities, location and a phone number, and people looking for a home browse and contact them directly.',
    'Finding a vacant house in Nairobi usually means walking through estates looking for signs on gates, or relying on agents. Listings are scattered and often out of date.',
    'A single place where vacant houses are listed with the details a tenant needs before making a call: price, amenities, location and contact number.',
    'Sole developer and designer, including the brand identity.',
    array[]::text[],
    array[
      'Property listings with price, amenities, location and contact number',
      'Multi-step listing creation for landlords',
      'Listing payment by M-Pesa with approval before a listing is published',
      'Account registration and sign-in'
    ],
    '',
    array['Next.js', 'Django', 'PostgreSQL', 'M-Pesa'],
    '', '',
    '[]'::jsonb,
    'https://nairobivacanthouses.com', '', null, true, true, 2
  ),
  (
    'naretu-ecommerce', 'Naretu E-commerce',
    'A multi-vendor e-commerce platform that connects buyers and sellers in one online marketplace.',
    (select id from public.project_categories where slug = 'web-applications'),
    'live',
    'Naretu is a multi-vendor marketplace. Vendors list products by category, manage inventory, set prices and track orders. Customers browse, search, compare products and pay online.',
    '', '',
    'Developer.',
    array[]::text[],
    array[
      'Vendor product listings organised by category',
      'Inventory and price management for vendors',
      'Order tracking',
      'Product browsing, search and comparison',
      'Online checkout with M-Pesa'
    ],
    '',
    array['Next.js', 'CSS', 'PostgreSQL', 'M-Pesa'],
    '', '',
    '[]'::jsonb,
    'https://naretu.com', '', null, true, true, 3
  ),
  (
    'kibarua', 'Kibarua',
    'A local services platform that connects customers with nearby service providers.',
    (select id from public.project_categories where slug = 'mobile-applications'),
    'in_development',
    'Kibarua connects people who need a job done with service providers near them. Customers discover services, view provider profiles and send location-based requests, then communicate with the provider to coordinate the work.',
    '', '', '',
    array[]::text[],
    array[
      'Service discovery',
      'Provider profiles',
      'Location-based service requests',
      'Communication between customer and provider',
      'Service coordination'
    ],
    '', array[]::text[], '', '',
    '[]'::jsonb,
    '', '', null, false, true, 4
  ),
  (
    'ssb-tax-model', 'SSB Tax Model',
    'A web application for health tax simulation, with a Next.js interface and a Python computation backend.',
    (select id from public.project_categories where slug = 'data-and-analytics'),
    'in_development',
    'The SSB Tax Model is a health financing tool that lets a user run a tax simulation for sugar-sweetened beverages in the browser instead of in a spreadsheet. It was developed as part of my consultancy work on health tax modelling.',
    'The underlying models existed as Excel workbooks. Workbooks are hard to share, easy to break and difficult for a non-specialist to operate.',
    'I rebuilt the workbook logic as a Python computation engine and put a web interface in front of it. The user enters parameters, the backend runs the model, and the results are presented in the browser.',
    'Developer. I built the interface and implemented the model computations from the workbooks supplied to me.',
    array[
      'Reproduce the workbook calculations faithfully in code.',
      'Make the model usable by someone who has never opened the workbook.'
    ],
    array[
      'Parameter entry through a web interface',
      'Model computation on a Python backend',
      'Presentation of model outputs in the browser'
    ],
    'A Next.js front end sends model inputs to a Python API, which runs the computation and returns the outputs for display.',
    array['Next.js', 'Python', 'Django REST Framework', 'NumPy'],
    'The central constraint was fidelity to the source workbook: each computed value is checked against the corresponding spreadsheet cell.',
    '',
    '[{"challenge": "Spreadsheet formulas hide their dependencies across sheets.", "solution": "I traced each output back through the workbook and reimplemented the chain step by step, verifying intermediate values against the original cells."}]'::jsonb,
    '', '', null, true, true, 5
  )
on conflict (slug) do nothing;

-- Creative gallery -------------------------------------------------------------

insert into public.gallery_categories (name, slug, sort_order) values
  ('Brand Identity',        'brand-identity',        1),
  ('Logo Design',           'logo-design',           2),
  ('Corporate Branding',    'corporate-branding',    3),
  ('Publications',          'publications',          4),
  ('Posters',               'posters',               5),
  ('Social Media Graphics', 'social-media-graphics', 6),
  ('UI/UX Design',          'ui-ux-design',          7),
  ('Infographics',          'infographics',          8),
  ('Data Visualisation',    'data-visualisation',    9),
  ('Presentation Design',   'presentation-design',   10)
on conflict (slug) do nothing;

commit;
