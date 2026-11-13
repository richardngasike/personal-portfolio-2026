import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdminPage } from '@/lib/auth/require-admin';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const { supabase, fullName } = await requireAdminPage();

  const { count } = await supabase
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)
    .eq('is_archived', false);

  return (
    <AdminShell userName={fullName} unreadMessages={count ?? 0}>
      {children}
    </AdminShell>
  );
}
