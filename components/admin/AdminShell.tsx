'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { IconType } from 'react-icons';
import {
  FiAward,
  FiBriefcase,
  FiExternalLink,
  FiFileText,
  FiFolder,
  FiGrid,
  FiHome,
  FiImage,
  FiInbox,
  FiLayers,
  FiLink,
  FiLogOut,
  FiMenu,
  FiSettings,
  FiTag,
  FiTool,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { signOut } from '@/lib/auth/actions';
import { ToastProvider } from './Toast';

interface NavItem {
  href: string;
  label: string;
  icon: IconType;
  badge?: number;
}

interface AdminShellProps {
  userName: string;
  unreadMessages: number;
  children: ReactNode;
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ userName, unreadMessages, children }: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const groups: Array<{ title: string; items: NavItem[] }> = [
    {
      title: 'Overview',
      items: [
        { href: '/admin', label: 'Dashboard', icon: FiGrid },
        { href: '/admin/messages', label: 'Messages', icon: FiInbox, badge: unreadMessages },
        { href: '/admin/billing', label: 'Invoices & quotes', icon: FiFileText },
      ],
    },
    {
      title: 'Pages',
      items: [
        { href: '/admin/homepage', label: 'Homepage', icon: FiHome },
        { href: '/admin/profile', label: 'Profile', icon: FiUser },
      ],
    },
    {
      title: 'Content',
      items: [
        { href: '/admin/experience', label: 'Experience', icon: FiBriefcase },
        { href: '/admin/education', label: 'Education', icon: FiAward },
        { href: '/admin/skills', label: 'Skills', icon: FiTool },
        { href: '/admin/skill-categories', label: 'Skill categories', icon: FiTag },
        { href: '/admin/projects', label: 'Projects', icon: FiLayers },
        { href: '/admin/project-categories', label: 'Project categories', icon: FiTag },
        { href: '/admin/gallery', label: 'Creative gallery', icon: FiImage },
        { href: '/admin/gallery-categories', label: 'Gallery categories', icon: FiTag },
        { href: '/admin/documents', label: 'CV and documents', icon: FiFileText },
      ],
    },
    {
      title: 'Site',
      items: [
        { href: '/admin/social-links', label: 'Social links', icon: FiLink },
        { href: '/admin/settings', label: 'Website settings', icon: FiSettings },
      ],
    },
  ];

  return (
    <ToastProvider>
      <div className="admin" data-nav-open={open}>
        <aside className="admin__sidebar" aria-label="Administration">
          <div className="admin__brand">
            <FiFolder aria-hidden="true" />
            <span>Portfolio admin</span>
          </div>

          <nav className="admin__nav">
            {groups.map((group) => (
              <div key={group.title} className="admin__nav-group">
                <p className="admin__nav-title">{group.title}</p>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="admin__nav-link"
                        aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                      >
                        <item.icon aria-hidden="true" />
                        <span>{item.label}</span>
                        {item.badge ? (
                          <span className="admin__badge" aria-label={`${item.badge} unread`}>
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <button
          type="button"
          className="admin__scrim"
          aria-label="Close navigation"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
        />

        <div className="admin__main">
          <header className="admin__topbar">
            <button
              type="button"
              className="admin__menu-button"
              aria-label={open ? 'Close navigation' : 'Open navigation'}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
            </button>
            <p className="admin__user">{userName}</p>
            <div className="admin__topbar-actions">
              <a className="abtn abtn--ghost abtn--small" href="/" target="_blank" rel="noopener noreferrer">
                View site <FiExternalLink aria-hidden="true" />
              </a>
              <form action={signOut}>
                <button type="submit" className="abtn abtn--ghost abtn--small">
                  Sign out <FiLogOut aria-hidden="true" />
                </button>
              </form>
            </div>
          </header>
          <div className="admin__content">{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}
