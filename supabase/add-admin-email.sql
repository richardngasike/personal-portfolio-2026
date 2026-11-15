-- The one email address allowed to receive an admin password-reset link.
-- Defaults to your main address; change it here (or in Admin > Website
-- settings > Security) only to another inbox you control that is also your
-- Supabase login email. Paste this whole file into the SQL Editor and run once.

alter table public.website_settings
  add column if not exists admin_reset_email text not null default 'ngasikerichard@gmail.com';
