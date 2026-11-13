import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, lead, children }: PageHeaderProps) {
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
    </header>
  );
}
