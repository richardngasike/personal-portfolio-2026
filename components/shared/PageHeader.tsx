import type { ReactNode } from 'react';
import { breadcrumbJsonLd } from '@/lib/seo';
import { JsonLd } from './JsonLd';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  lead?: string;
  /** Route of the page, used for breadcrumb structured data. */
  path?: string;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, lead, path, children }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="container">
        <div className="page-header__inner">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="heading-1">{title}</h1>
          {lead ? <p className="lead">{lead}</p> : null}
          {children}
        </div>
      </div>
      {path ? <JsonLd data={breadcrumbJsonLd([{ name: eyebrow, path }])} /> : null}
    </header>
  );
}
