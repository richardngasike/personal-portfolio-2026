import type { Metadata } from 'next';
import { MessagesInbox } from '@/components/admin/MessagesInbox';
import { requireAdminPage } from '@/lib/auth/require-admin';
import type { ContactMessageRow } from '@/types/database';

export const metadata: Metadata = { title: 'Messages' };

export default async function MessagesPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase
    .from('contact_messages')
    .select('id, full_name, email, subject, message, is_read, is_archived, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Messages</h1>
          <p>Enquiries sent through the contact form.</p>
        </div>
      </header>
      <MessagesInbox messages={(data ?? []) as ContactMessageRow[]} />
    </>
  );
}
