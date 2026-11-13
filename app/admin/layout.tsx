import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/styles/admin/admin-layout.css';
import '@/styles/admin/admin-forms.css';
import '@/styles/admin/admin-dashboard.css';
import '@/styles/admin/admin-projects.css';
import '@/styles/admin/admin-gallery.css';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | Admin' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="admin-root">{children}</div>;
}
