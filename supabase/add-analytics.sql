-- First-party, privacy-respecting page-view analytics.
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- No personal data is stored: the visitor hash rotates daily and cannot be
-- linked across days or to a person.

create table public.page_views (
  id            bigint generated always as identity primary key,
  path          text not null,
  country       text,
  referrer_host text,
  device        text check (device in ('mobile', 'tablet', 'desktop') or device is null),
  visitor_hash  text,
  created_at    timestamptz not null default now()
);

create index page_views_created_idx on public.page_views (created_at desc);
create index page_views_country_idx on public.page_views (country);
create index page_views_path_idx on public.page_views (path);

alter table public.page_views enable row level security;

-- No anon access at all. Rows are written by the server (service role) and
-- read only by an administrator.
revoke all on public.page_views from anon, authenticated;
grant select on public.page_views to authenticated;

create policy "page_views: admin read" on public.page_views
  for select to authenticated using (public.is_admin());
