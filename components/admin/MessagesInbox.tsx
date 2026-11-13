'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FiArchive, FiInbox, FiMail, FiSearch, FiTrash2 } from 'react-icons/fi';
import { deleteMessage, updateMessage } from '@/lib/admin/actions';
import { formatDateTime } from '@/lib/utils/format';
import type { ContactMessageRow } from '@/types/database';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';

type View = 'inbox' | 'unread' | 'archived' | 'all';

const VIEWS: Array<{ value: View; label: string }> = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'unread', label: 'Unread' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
];

export function MessagesInbox({ messages: initialMessages }: { messages: ContactMessageRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [messages, setMessages] = useState(initialMessages);
  const [view, setView] = useState<View>('inbox');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ContactMessageRow | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return messages.filter((message) => {
      if (view === 'inbox' && message.is_archived) return false;
      if (view === 'unread' && (message.is_read || message.is_archived)) return false;
      if (view === 'archived' && !message.is_archived) return false;
      if (!term) return true;
      return [message.full_name, message.email, message.subject, message.message].some((value) =>
        value.toLowerCase().includes(term),
      );
    });
  }, [messages, view, search]);

  const open = messages.find((message) => message.id === openId) ?? null;

  function patch(id: string, changes: Partial<ContactMessageRow>) {
    setMessages((current) => current.map((message) => (message.id === id ? { ...message, ...changes } : message)));
  }

  function change(message: ContactMessageRow, changes: { is_read?: boolean; is_archived?: boolean }, notify = true) {
    const before = { is_read: message.is_read, is_archived: message.is_archived };
    patch(message.id, changes);
    startTransition(async () => {
      const result = await updateMessage(message.id, changes);
      if (result.ok) {
        if (notify) toast.success(result.message || 'Message updated.');
        router.refresh();
      } else {
        patch(message.id, before);
        toast.error(result.message || 'The message could not be updated.');
      }
    });
  }

  function openMessage(message: ContactMessageRow) {
    setOpenId(message.id);
    if (!message.is_read) change(message, { is_read: true }, false);
  }

  function confirmDelete() {
    if (!toDelete) return;
    const target = toDelete;
    startTransition(async () => {
      const result = await deleteMessage(target.id);
      setToDelete(null);
      if (result.ok) {
        setMessages((current) => current.filter((message) => message.id !== target.id));
        if (openId === target.id) setOpenId(null);
        toast.success(result.message || 'Message deleted.');
        router.refresh();
      } else {
        toast.error(result.message || 'The message could not be deleted.');
      }
    });
  }

  return (
    <div className="inbox" data-open={Boolean(open)}>
      <div className="inbox__list">
        <div className="toolbar">
          <label className="toolbar__search">
            <FiSearch aria-hidden="true" />
            <span className="visually-hidden">Search messages</span>
            <input type="search" placeholder="Search messages" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <label className="toolbar__select">
            <span className="visually-hidden">Show</span>
            <select value={view} onChange={(event) => setView(event.target.value as View)}>
              {VIEWS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {visible.length === 0 ? (
          <div className="empty">
            <FiInbox aria-hidden="true" />
            <p>{messages.length === 0 ? 'No enquiries have been received yet.' : 'No messages match this view.'}</p>
          </div>
        ) : (
          <ul className="inbox__items">
            {visible.map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  className="inbox__item"
                  data-unread={!message.is_read}
                  aria-current={message.id === openId ? 'true' : undefined}
                  onClick={() => openMessage(message)}
                >
                  <span className="inbox__sender">
                    {message.full_name}
                    {!message.is_read ? <span className="pill pill--unread">Unread</span> : null}
                    {message.is_archived ? <span className="pill pill--draft">Archived</span> : null}
                  </span>
                  <span className="inbox__subject">{message.subject}</span>
                  <span className="inbox__date">{formatDateTime(message.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="inbox__detail">
        {open ? (
          <article className="panel">
            <header className="panel__header">
              <button type="button" className="abtn abtn--ghost abtn--small inbox__back" onClick={() => setOpenId(null)}>
                Back to messages
              </button>
              <h2>{open.subject}</h2>
              <p>
                {open.full_name} &middot;{' '}
                <a className="table__link" href={`mailto:${open.email}`}>
                  {open.email}
                </a>{' '}
                &middot; {formatDateTime(open.created_at)}
              </p>
            </header>
            <div className="panel__body">
              <p className="inbox__body">{open.message}</p>
              <div className="inbox__actions">
                <a
                  className="abtn abtn--primary"
                  href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject}`)}`}
                >
                  <FiMail aria-hidden="true" /> Reply by email
                </a>
                <button type="button" className="abtn abtn--ghost" disabled={pending} onClick={() => change(open, { is_read: !open.is_read })}>
                  Mark as {open.is_read ? 'unread' : 'read'}
                </button>
                <button
                  type="button"
                  className="abtn abtn--ghost"
                  disabled={pending}
                  onClick={() => change(open, { is_archived: !open.is_archived })}
                >
                  <FiArchive aria-hidden="true" /> {open.is_archived ? 'Move to inbox' : 'Archive'}
                </button>
                <button type="button" className="abtn abtn--ghost abtn--danger-text" onClick={() => setToDelete(open)}>
                  <FiTrash2 aria-hidden="true" /> Delete
                </button>
              </div>
            </div>
          </article>
        ) : (
          <div className="empty inbox__placeholder">
            <FiMail aria-hidden="true" />
            <p>Select a message to read it.</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this message?"
        message={`The enquiry from ${toDelete?.full_name ?? ''} will be permanently deleted.`}
        busy={pending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
