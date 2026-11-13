'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowDown, FiArrowUp, FiEdit2, FiEye, FiEyeOff, FiPlus, FiSearch, FiStar, FiTrash2 } from 'react-icons/fi';
import { deleteRecord, reorderRecords, setRecordFlag } from '@/lib/admin/actions';
import { RESOURCES, allFields, optionLabel, type ResourceKey } from '@/lib/admin/resources';
import { assetUrl } from '@/lib/storage';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';

type Row = Record<string, unknown> & { id: string };

interface ResourceListProps {
  resourceKey: ResourceKey;
  rows: Row[];
  relations: Record<string, Array<{ value: string; label: string }>>;
  secondaryAction?: { href: string; label: string };
}

export function ResourceList({ resourceKey, rows: initialRows, relations, secondaryAction }: ResourceListProps) {
  const resource = RESOURCES[resourceKey];
  const fields = useMemo(() => allFields(resource), [resource]);
  const router = useRouter();
  const toast = useToast();

  const [rows, setRows] = useState<Row[]>(initialRows);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [filter, setFilter] = useState('all');
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [pending, startTransition] = useTransition();

  const filterField = fields.find((field) => field.name === resource.filterField);
  const filterOptions = filterField
    ? filterField.type === 'relation'
      ? (relations[filterField.name] ?? [])
      : (filterField.options ?? [])
    : [];

  const imageField = fields.find((field) => field.name === resource.imageField);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== 'all' && (row.published === true) !== (status === 'published')) return false;
      if (filter !== 'all' && resource.filterField && String(row[resource.filterField] ?? '') !== filter) return false;
      if (!term) return true;
      return resource.searchFields.some((name) => String(row[name] ?? '').toLowerCase().includes(term));
    });
  }, [rows, search, status, filter, resource]);

  const isFiltered = search.trim() !== '' || status !== 'all' || filter !== 'all';
  const canReorder = resource.orderable && !isFiltered && rows.length > 1;

  function cell(row: Row, column: (typeof resource.columns)[number]) {
    const value = row[column.field];
    if (column.type === 'status') {
      return <span className={`pill pill--${value ? 'published' : 'draft'}`}>{value ? 'Published' : 'Draft'}</span>;
    }
    if (column.type === 'relation') {
      return relations[column.field]?.find((option) => option.value === value)?.label ?? 'None';
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    const field = fields.find((item) => item.name === column.field);
    if (field?.type === 'select') return optionLabel(field, value);
    return String(value ?? '');
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const previous = rows;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
    startTransition(async () => {
      const result = await reorderRecords(resource.key, next.map((row) => row.id));
      if (!result.ok) {
        setRows(previous);
        toast.error(result.message || 'The order could not be saved.');
      }
    });
  }

  function toggle(row: Row, flag: 'published' | 'featured') {
    const value = !(row[flag] === true);
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, [flag]: value } : item)));
    startTransition(async () => {
      const result = await setRecordFlag(resource.key, row.id, flag, value);
      if (result.ok) {
        toast.success(result.message || 'Saved.');
      } else {
        setRows((current) => current.map((item) => (item.id === row.id ? { ...item, [flag]: !value } : item)));
        toast.error(result.message || 'The change could not be saved.');
      }
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const target = toDelete;
    startTransition(async () => {
      const result = await deleteRecord(resource.key, target.id);
      setToDelete(null);
      if (result.ok) {
        setRows((current) => current.filter((row) => row.id !== target.id));
        toast.success(result.message || 'Deleted.');
        router.refresh();
      } else {
        toast.error(result.message || 'The record could not be deleted.');
      }
    });
  }

  return (
    <div className="resource">
      <div className="toolbar">
        <label className="toolbar__search">
          <FiSearch aria-hidden="true" />
          <span className="visually-hidden">Search {resource.plural.toLowerCase()}</span>
          <input type="search" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>

        {resource.publishable ? (
          <label className="toolbar__select">
            <span className="visually-hidden">Filter by status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </label>
        ) : null}

        {filterField && filterOptions.length > 0 ? (
          <label className="toolbar__select">
            <span className="visually-hidden">Filter by {filterField.label.toLowerCase()}</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">Any {filterField.label.toLowerCase()}</option>
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="toolbar__new">
          {secondaryAction ? (
            <Link href={secondaryAction.href} className="abtn abtn--ghost">
              {secondaryAction.label}
            </Link>
          ) : null}
          <Link href={`/admin/${resource.key}/new`} className="abtn abtn--primary">
            <FiPlus aria-hidden="true" /> New {resource.singular.toLowerCase()}
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <p>No {resource.plural.toLowerCase()} yet.</p>
          <Link href={`/admin/${resource.key}/new`} className="abtn abtn--primary">
            <FiPlus aria-hidden="true" /> Add the first one
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <p>Nothing matches the current search or filters.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {resource.orderable ? <th scope="col" className="table__order">Order</th> : null}
                {resource.columns.map((column) => (
                  <th key={column.field} scope="col">
                    {column.label}
                  </th>
                ))}
                <th scope="col" className="table__actions">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const index = rows.findIndex((item) => item.id === row.id);
                const title = String(row[resource.titleField] || 'Untitled');
                const thumb = imageField?.bucket ? assetUrl(imageField.bucket, row[imageField.name] as string | null) : null;

                return (
                  <tr key={row.id}>
                    {resource.orderable ? (
                      <td className="table__order">
                        <div className="order-buttons">
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => move(index, -1)}
                            disabled={!canReorder || index === 0 || pending}
                            aria-label={`Move ${title} up`}
                          >
                            <FiArrowUp aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => move(index, 1)}
                            disabled={!canReorder || index === rows.length - 1 || pending}
                            aria-label={`Move ${title} down`}
                          >
                            <FiArrowDown aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    ) : null}

                    {resource.columns.map((column, columnIndex) => (
                      <td key={column.field} data-label={column.label}>
                        {columnIndex === 0 ? (
                          <div className="table__title">
                            {imageField ? (
                              <span className="table__thumb">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                {thumb ? <img src={thumb} alt="" loading="lazy" /> : null}
                              </span>
                            ) : null}
                            <span>
                              <Link href={`/admin/${resource.key}/${row.id}`} className="table__link">
                                {title}
                              </Link>
                              {resource.subtitleField && row[resource.subtitleField] ? (
                                <span className="table__subtitle">{String(row[resource.subtitleField])}</span>
                              ) : null}
                            </span>
                          </div>
                        ) : (
                          cell(row, column)
                        )}
                      </td>
                    ))}

                    <td className="table__actions">
                      <div className="row-actions">
                        {resource.featurable ? (
                          <button
                            type="button"
                            className="icon-button"
                            data-active={row.featured === true}
                            onClick={() => toggle(row, 'featured')}
                            disabled={pending}
                            aria-pressed={row.featured === true}
                            aria-label={row.featured ? `Stop featuring ${title}` : `Feature ${title}`}
                            title={row.featured ? 'Featured' : 'Feature'}
                          >
                            <FiStar aria-hidden="true" />
                          </button>
                        ) : null}
                        {resource.publishable ? (
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => toggle(row, 'published')}
                            disabled={pending}
                            aria-label={row.published ? `Unpublish ${title}` : `Publish ${title}`}
                            title={row.published ? 'Unpublish' : 'Publish'}
                          >
                            {row.published ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                          </button>
                        ) : null}
                        <Link href={`/admin/${resource.key}/${row.id}`} className="icon-button" aria-label={`Edit ${title}`} title="Edit">
                          <FiEdit2 aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          className="icon-button icon-button--danger"
                          onClick={() => setToDelete(row)}
                          aria-label={`Delete ${title}`}
                          title="Delete"
                        >
                          <FiTrash2 aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {resource.orderable && isFiltered && rows.length > 1 ? (
        <p className="resource__note">Clear the search and filters to change the order.</p>
      ) : null}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete this ${resource.singular.toLowerCase()}?`}
        message={`"${String(toDelete?.[resource.titleField] || 'Untitled')}" will be permanently deleted, together with its uploaded files. This cannot be undone.`}
        busy={pending}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
