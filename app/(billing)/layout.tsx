import type { ReactNode } from 'react';
import '@/styles/typography.css';
import '@/styles/components/buttons.css';
import '@/styles/components/navbar.css';
import '@/styles/pages/billing.css';

// Shared invoices and quotations: a quiet page with only the document on it.
export default function BillingLayout({ children }: { children: ReactNode }) {
  return <div className="site billing">{children}</div>;
}
