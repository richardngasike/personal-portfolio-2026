# Richard Ngasike - Portfolio and CMS

Full-stack portfolio for richardngasike.co.ke: a public site, a private admin dashboard and a Supabase backend, in one Next.js application.

- Next.js 16 (App Router, Server Components, Server Actions, Route Handlers), React 19, TypeScript
- Supabase: PostgreSQL, Auth, Storage, Row Level Security
- Plain external CSS in `styles/` (no Tailwind, no UI library), light and dark mode
- Deploys to Vercel

## Structure

```
app/(public)/        public pages: home, about, experience, expertise, projects, creative-work, education, contact
app/admin/(auth)/    login, forgot-password, reset-password
app/admin/(panel)/   dashboard, messages, and one generic list/new/edit route for every content type
app/api/contact      contact form endpoint        app/api/cv   signed CV download
app/auth/confirm     landing route for password-reset emails
components/          navigation, shared, projects, gallery, forms, admin
lib/supabase/        client.ts (browser), server.ts (cookie session), public.ts (anon), admin.ts (service role)
lib/admin/           resources.ts (content type definitions), validate.ts, actions.ts (Server Actions)
lib/auth/            require-admin.ts, actions.ts
lib/queries/         public read queries
styles/              variables, globals, typography, components/, pages/, admin/
supabase/migrations  schema, RLS policies, storage buckets      supabase/seed.sql  starting content
proxy.ts             session refresh and first gate for /admin (Next.js 16 name for middleware)
```

Every admin module (experience, education, skills, projects, gallery, documents, social links, categories, profile, homepage, settings) is described once in `lib/admin/resources.ts`. The list page, the form and the server-side validation are generated from that definition. To add a field: add the column in a new migration, then add the field to the resource.

## Environment variables

Copy `.env.example` to `.env.local`.

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | browser + server | Canonical URLs, sitemap, reset links. `https://www.richardngasike.co.ke` in production |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Anon key. Safe to expose; RLS limits it to published content |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Stores contact messages, signs CV links, creates the admin. Never prefix with `NEXT_PUBLIC_` |
| `CONTACT_RATE_LIMIT_SALT` | server only | Random string (`openssl rand -hex 32`) used to hash sender addresses for rate limiting |

## Supabase setup

1. Create a project at supabase.com. Copy the URL, anon key and service role key (Project Settings > API) into `.env.local`.
2. Apply the database. Either with the CLI:
   ```bash
   npx supabase link --project-ref YOUR-PROJECT-REF
   npx supabase db push
   ```
   or paste the three files in `supabase/migrations/` into the SQL Editor in order (`000001_schema`, `000002_rls`, `000003_storage`).
3. Load the starting content: run `supabase/seed.sql` in the SQL Editor. It is safe to run more than once.
4. Authentication > URL Configuration: set Site URL to the production URL and add `https://www.richardngasike.co.ke/auth/confirm` and `http://localhost:3000/auth/confirm` to Redirect URLs.
5. Authentication > Sign In / Providers: turn off "Allow new users to sign up". There is no public registration; the administrator is created by the script below.
6. Create the administrator:
   ```bash
   node --env-file=.env.local scripts/create-admin.mjs you@example.com "Richard Ngasike"
   ```
   It asks for a password (12 characters or more), creates the user and grants the `admin` role in `admin_profiles`.

Storage buckets created by the migration: `profile-images`, `project-images`, `gallery-images`, `organisation-logos`, `website-assets` (public read) and `documents` (private; the CV is served through `/api/cv` with a 60-second signed URL). Each bucket has a size limit and a MIME-type allowlist.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000, admin at /admin
npm run typecheck
npm run build && npm start
```

Requires Node.js 20 or newer.

## Deploying to Vercel

1. Push the repository to GitHub and import it in Vercel (framework preset: Next.js, no extra settings).
2. Add the five environment variables for Production (and Preview if wanted).
3. Deploy, then open `/admin/login`.
4. Domain: in Vercel > Project > Domains add `richardngasike.co.ke` and `www.richardngasike.co.ke`. If the current site is already a Vercel project on this account, move the domain to the new project there; no DNS change is needed. If it is hosted elsewhere, change only the records Vercel asks for (the apex A record and the `www` CNAME). Leave nameservers and mail records as they are. Vercel issues the SSL certificate automatically.

## Invoices and quotations

The admin has an **Invoices & quotes** section (`/admin/billing`) for billing clients.

- Create an invoice or a quotation, enter the client, line items, discount, tax and payment terms. Totals are computed as you type.
- Each document gets an automatic reference (`INV-2026-0001`, `QUO-2026-0001`; the two series are numbered separately per year) and a private share link, for example `richardngasike.co.ke/invoice/2026/7/28-K7M2Q9XA`. The random code at the end keeps the link private to whoever you send it to.
- Share the link: the client opens a branded page where they can view, download the PDF, print, or share it onward. Invoices and quotations each have their own design but use the same brand (your signature/logo, charcoal, gold accent, serif headings).
- A document stays a **draft** (its link returns 404) until you set the status to Sent or later. Mark invoices Paid, or quotations Accepted/Declined, from the edit page.
- Billing data is admin-only. Visitors have no database access to it at all; the public pages fetch a single document by its exact secret link, server-side.

To enable this on an existing database, run `supabase/add-billing.sql` once in the Supabase SQL Editor. (A fresh setup from `supabase-setup.sql` does not include it — run `add-billing.sql` after.)


## Security model

- `/admin` is gated three times: `proxy.ts` (session), every page and Server Action (`requireAdminPage` / `requireAdminAction`, which verify the user with Supabase Auth and read the role from `admin_profiles`), and RLS in the database (`public.is_admin()`).
- Visitors use the anon key and can only select published rows. They cannot write to any table.
- Contact submissions go through `/api/contact`: same-origin check, honeypot, minimum fill time, server-side validation, and rate limits (5 per sender per hour, 60 site-wide per hour). The row is inserted with the service role; visitors have no access to `contact_messages`.
- The service role key is used only in `lib/supabase/admin.ts`, which is marked `server-only`.
- Admin form input is validated against the resource definition; only declared fields are written.

## Backups and schema changes

- Backup: `npx supabase db dump -f backup.sql` (schema) and `npx supabase db dump --data-only -f data.sql` (content). Supabase also takes daily backups on paid plans. Storage files are downloaded from the dashboard or with the Storage API.
- Schema changes: add a new timestamped file in `supabase/migrations/` and run `npx supabase db push`. Do not edit a migration that has already been applied.
- Before replacing the live site, keep the current deployment available in Vercel (Deployments > Promote to roll back) and keep the old repository.

## Content

`content-import/CONTENT-NOTES.md` lists where each seeded record came from and what was left as an unpublished draft for review.
