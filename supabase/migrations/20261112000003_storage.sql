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
