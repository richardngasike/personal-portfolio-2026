import type { Metadata } from 'next';
import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdminPage } from '@/lib/auth/require-admin';
import { formatDateTime } from '@/lib/utils/format';
import type { ContactMessageRow } from '@/types/database';

export const metadata: Metadata = { title: 'Dashboard' };

async function count(
  supabase: SupabaseClient,
  table: string,
  filter?: { column: string; value: boolean },
): Promise<number> {
  let query = supabase.from(table).select('id', { count: 'exact', head: true });
  if (filter) query = query.eq(filter.column, filter.value);
  const { count: total } = await query;
  return total ?? 0;
}

interface RecentUpdate {
  label: string;
  type: string;
  href: string;
  updatedAt: string;
}

const UPDATE_SOURCES = [
  { table: 'projects', title: 'title', type: 'Project', path: 'projects' },
  { table: 'experiences', title: 'job_title', type: 'Experience', path: 'experience' },
  { table: 'education', title: 'qualification', type: 'Education', path: 'education' },
  { table: 'gallery_images', title: 'title', type: 'Gallery image', path: 'gallery' },
  { table: 'skills', title: 'name', type: 'Skill', path: 'skills' },
  { table: 'documents', title: 'title', type: 'Document', path: 'documents' },
];

export default async function DashboardPage() {
  const { supabase, fullName } = await requireAdminPage();

  const [publishedProjects, draftProjects, galleryImages, experiences, education, messages, recentMessages, updates] =
    await Promise.all([
      count(supabase, 'projects', { column: 'published', value: true }),
      count(supabase, 'projects', { column: 'published', value: false }),
      count(supabase, 'gallery_images'),
      count(supabase, 'experiences'),
      count(supabase, 'education'),
      count(supabase, 'contact_messages'),
      supabase
        .from('contact_messages')
        .select('id, full_name, email, subject, message, is_read, is_archived, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      Promise.all(
        UPDATE_SOURCES.map(async (source) => {
          const { data } = await supabase
            .from(source.table)
            .select(`id, ${source.title}, updated_at`)
            .order('updated_at', { ascending: false })
            .limit(5);
          return ((data ?? []) as unknown as Array<Record<string, string>>).map<RecentUpdate>((row) => ({
            label: row[source.title] || 'Untitled',
            type: source.type,
            href: `/admin/${source.path}/${row.id}`,
            updatedAt: row.updated_at,
          }));
        }),
      ),
    ]);

  const stats = [
    { label: 'Published projects', value: publishedProjects, href: '/admin/projects' },
    { label: 'Draft projects', value: draftProjects, href: '/admin/projects' },
    { label: 'Gallery images', value: galleryImages, href: '/admin/gallery' },
    { label: 'Experience records', value: experiences, href: '/admin/experience' },
    { label: 'Education records', value: education, href: '/admin/education' },
    { label: 'Contact enquiries', value: messages, href: '/admin/messages' },
  ];

  const recentUpdates = updates
    .flat()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 8);

  const inbox = (recentMessages.data ?? []) as ContactMessageRow[];

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Signed in as {fullName}.</p>
        </div>
      </header>

      <ul className="stats">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Link href={stat.href} className="stat">
              <span className="stat__value">{stat.value}</span>
              <span className="stat__label">{stat.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="dashboard-grid">
        <section className="panel">
          <header className="panel__header panel__header--split">
            <h2>Recent messages</h2>
            <Link href="/admin/messages" className="table__link">
              Open inbox
            </Link>
          </header>
          <div className="panel__body">
            {inbox.length > 0 ? (
              <ul className="feed">
                {inbox.map((message) => (
                  <li key={message.id}>
                    <Link href="/admin/messages" className="feed__item">
                      <span className="feed__title">
                        {message.subject}
                        {!message.is_read ? <span className="pill pill--unread">Unread</span> : null}
                      </span>
                      <span className="feed__meta">
                        {message.full_name} &middot; {formatDateTime(message.created_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty empty--inline">No enquiries have been received yet.</p>
            )}
          </div>
        </section>

        <section className="panel">
          <header className="panel__header">
            <h2>Recent content updates</h2>
          </header>
          <div className="panel__body">
            {recentUpdates.length > 0 ? (
              <ul className="feed">
                {recentUpdates.map((update) => (
                  <li key={update.href}>
                    <Link href={update.href} className="feed__item">
                      <span className="feed__title">{update.label}</span>
                      <span className="feed__meta">
                        {update.type} &middot; {formatDateTime(update.updatedAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty empty--inline">No content has been added yet.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
