'use client';

import { useState, useTransition, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveRecord } from '@/lib/admin/actions';
import { RESOURCES, allFields, type FieldDef, type ResourceKey } from '@/lib/admin/resources';
import type { FieldErrors } from '@/lib/admin/validate';
import { slugify } from '@/lib/utils/format';
import { ListField } from './fields/ListField';
import { PairsField } from './fields/PairsField';
import { UploadField } from './fields/UploadField';
import { useToast } from './Toast';

type Values = Record<string, unknown>;

interface RecordFormProps {
  resourceKey: ResourceKey;
  id: string | null;
  initial: Values | null;
  relations: Record<string, Array<{ value: string; label: string }>>;
}

function defaultValue(field: FieldDef): unknown {
  switch (field.type) {
    case 'boolean':
      return false;
    case 'list':
    case 'pairs':
      return [];
    case 'select':
      return field.required ? (field.options?.[0]?.value ?? '') : '';
    case 'image':
    case 'file':
    case 'date':
    case 'number':
    case 'relation':
      return null;
    default:
      return '';
  }
}

function initialValues(resourceKey: ResourceKey, initial: Values | null): Values {
  const values: Values = {};
  for (const field of allFields(RESOURCES[resourceKey])) {
    const current = initial?.[field.name];
    values[field.name] = current === undefined || current === null ? defaultValue(field) : current;
  }
  return values;
}

export function RecordForm({ resourceKey, id, initial, relations }: RecordFormProps) {
  const resource = RESOURCES[resourceKey];
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<Values>(() => initialValues(resourceKey, initial));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, startTransition] = useTransition();
  // A slug follows its source field until it is edited by hand or already saved.
  const [slugLocked, setSlugLocked] = useState(Boolean(id));

  const wasPublished = initial?.published === true;
  const listHref = `/admin/${resource.key}`;

  function set(name: string, value: unknown) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      if (!slugLocked) {
        for (const field of allFields(resource)) {
          if (field.type === 'slug' && field.slugFrom === name) next[field.name] = slugify(String(value ?? ''));
        }
      }
      return next;
    });
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
  }

  function submit(published: boolean) {
    const missing: FieldErrors = {};
    for (const field of allFields(resource)) {
      const value = values[field.name];
      const empty = value === null || value === '' || (Array.isArray(value) && value.length === 0);
      if (field.required && empty) missing[field.name] = `${field.label} is required.`;
    }
    if (Object.keys(missing).length > 0) {
      setErrors(missing);
      toast.error('Please complete the required fields.');
      document.getElementById(`field-${Object.keys(missing)[0]}`)?.focus();
      return;
    }

    startTransition(async () => {
      const result = await saveRecord(resource.key, id, { ...values, published });
      if (!result.ok) {
        setErrors(result.errors ?? {});
        toast.error(result.message || 'The change could not be saved.');
        return;
      }
      setErrors({});
      toast.success(result.message || 'Saved.');
      if (resource.singleton) {
        router.refresh();
      } else if (!id && result.id && resource.key === 'projects') {
        // Continue on the edit page, where screenshots can be added.
        router.push(`/admin/projects/${result.id}`);
      } else {
        router.push(listHref);
        router.refresh();
      }
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(resource.publishable ? wasPublished : false);
  }

  function renderControl(field: FieldDef) {
    const fieldId = `field-${field.name}`;
    const value = values[field.name];
    const invalid = Boolean(errors[field.name]);
    const common = {
      id: fieldId,
      name: field.name,
      'aria-invalid': invalid,
      'aria-describedby': invalid ? `${fieldId}-error` : field.help ? `${fieldId}-help` : undefined,
    };

    switch (field.type) {
      case 'textarea':
      case 'longtext':
        return (
          <textarea
            {...common}
            rows={field.type === 'longtext' ? 9 : 3}
            maxLength={field.maxLength}
            value={String(value ?? '')}
            onChange={(event) => set(field.name, event.target.value)}
          />
        );
      case 'boolean':
        return (
          <label className="check">
            <input
              id={fieldId}
              type="checkbox"
              checked={value === true}
              onChange={(event) => set(field.name, event.target.checked)}
            />
            <span>{field.label}</span>
          </label>
        );
      case 'select':
        return (
          <select {...common} value={String(value ?? '')} onChange={(event) => set(field.name, event.target.value)}>
            {field.required ? null : <option value="">None</option>}
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'relation':
        return (
          <select {...common} value={String(value ?? '')} onChange={(event) => set(field.name, event.target.value || null)}>
            <option value="">{field.required ? 'Select...' : 'None'}</option>
            {(relations[field.name] ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'list':
        return (
          <ListField
            id={fieldId}
            value={Array.isArray(value) ? (value as string[]) : []}
            itemLabel={field.itemLabel ?? 'item'}
            onChange={(next) => set(field.name, next)}
          />
        );
      case 'pairs':
        return (
          <PairsField
            id={fieldId}
            value={Array.isArray(value) ? (value as Array<Record<string, string>>) : []}
            fields={field.pairFields ?? []}
            itemLabel={field.itemLabel ?? 'item'}
            onChange={(next) => set(field.name, next)}
          />
        );
      case 'image':
      case 'file':
        return (
          <UploadField
            id={fieldId}
            kind={field.type}
            bucket={field.bucket!}
            folder={field.folder ?? 'uploads'}
            value={typeof value === 'string' ? value : null}
            onChange={(next) => set(field.name, next)}
            onError={toast.error}
          />
        );
      case 'date':
        return <input {...common} type="date" value={String(value ?? '')} onChange={(event) => set(field.name, event.target.value || null)} />;
      case 'number':
        return (
          <input
            {...common}
            type="number"
            min={field.min}
            max={field.max}
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(event) => set(field.name, event.target.value === '' ? null : Number(event.target.value))}
          />
        );
      case 'slug':
        return (
          <input
            {...common}
            type="text"
            value={String(value ?? '')}
            maxLength={80}
            onChange={(event) => {
              setSlugLocked(true);
              set(field.name, event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
            }}
          />
        );
      default:
        return (
          <input
            {...common}
            type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'}
            maxLength={field.maxLength}
            placeholder={field.placeholder ?? (field.type === 'url' ? 'https://' : undefined)}
            value={String(value ?? '')}
            onChange={(event) => set(field.name, event.target.value)}
          />
        );
    }
  }

  return (
    <form className="record-form" onSubmit={onSubmit} noValidate>
      {resource.groups.map((group) => (
        <section key={group.title} className="panel">
          <header className="panel__header">
            <h2>{group.title}</h2>
            {group.description ? <p>{group.description}</p> : null}
          </header>
          <div className="panel__body field-grid">
            {group.fields.map((field) => (
              <div key={field.name} className={`field${field.half ? ' field--half' : ''}`}>
                {field.type === 'boolean' ? null : (
                  <label className="field__label" htmlFor={`field-${field.name}`}>
                    {field.label}
                    {field.required ? <span aria-hidden="true"> *</span> : null}
                  </label>
                )}
                {renderControl(field)}
                {field.help ? (
                  <p id={`field-${field.name}-help`} className="field__help">
                    {field.help}
                  </p>
                ) : null}
                {errors[field.name] ? (
                  <p id={`field-${field.name}-error`} className="field__error" role="alert">
                    {errors[field.name]}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="record-form__bar">
        {resource.publishable ? (
          <p className="record-form__status">
            Status: <span className={`pill pill--${wasPublished ? 'published' : 'draft'}`}>{wasPublished ? 'Published' : 'Draft'}</span>
          </p>
        ) : (
          <span />
        )}
        <div className="record-form__actions">
          {resource.singleton ? null : (
            <Link href={listHref} className="abtn abtn--ghost">
              Cancel
            </Link>
          )}
          {resource.publishable ? (
            <>
              <button type="button" className="abtn abtn--ghost" disabled={pending} onClick={() => submit(false)}>
                {wasPublished ? 'Unpublish and save' : 'Save draft'}
              </button>
              <button type="button" className="abtn abtn--primary" disabled={pending} onClick={() => submit(true)}>
                {pending ? 'Saving...' : wasPublished ? 'Save changes' : 'Save and publish'}
              </button>
            </>
          ) : (
            <button type="submit" className="abtn abtn--primary" disabled={pending}>
              {pending ? 'Saving...' : 'Save changes'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
