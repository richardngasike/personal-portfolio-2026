-- Blog posts: news, updates and short articles shown on the Blog page.
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- It only adds the posts table; nothing else is touched.

create table public.posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null check (char_length(title) between 1 and 200),
  excerpt         text not null default '',
  body            text not null default '',
  cover_path      text,
  tags            text[] not null default '{}',
  published_at    date not null default current_date,
  published       boolean not null default false,
  seo_title       text not null default '',
  seo_description text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index posts_list_idx on public.posts (published, published_at desc);

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

revoke all on public.posts from anon, authenticated;
grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;

create policy "posts: read published" on public.posts
  for select to anon, authenticated using (published or public.is_admin());
create policy "posts: admin write" on public.posts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
