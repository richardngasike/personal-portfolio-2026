
alter table public.website_settings
  add column if not exists admin_reset_email text not null default 'ngasikerichard@gmail.com';
