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
