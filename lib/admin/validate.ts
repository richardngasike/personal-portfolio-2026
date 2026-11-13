import { allFields, type FieldDef, type ResourceDef } from './resources';

export type FieldErrors = Record<string, string>;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const URL_PATTERN = /^https?:\/\/[^\s]+$/i;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LIST_ITEMS = 60;

function text(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\u0000/g, '').replace(/\r\n/g, '\n').trim().slice(0, max);
}

function coerce(field: FieldDef, raw: unknown): { value: unknown; error?: string } {
  switch (field.type) {
    case 'text':
    case 'textarea':
    case 'longtext': {
      const fallbackMax = field.type === 'longtext' ? 12000 : field.type === 'textarea' ? 2000 : 300;
      return { value: text(raw, field.maxLength ?? fallbackMax) };
    }
    case 'email': {
      const value = text(raw, 254).toLowerCase();
      if (value && !EMAIL_PATTERN.test(value)) return { value, error: 'Enter a valid email address.' };
      return { value };
    }
    case 'url': {
      const value = text(raw, 500);
      if (value && !URL_PATTERN.test(value)) return { value, error: 'Enter a full URL starting with http:// or https://.' };
      return { value };
    }
    case 'slug': {
      const value = text(raw, 80).toLowerCase();
      if (value && !SLUG_PATTERN.test(value)) {
        return { value, error: 'Use lowercase letters, numbers and single hyphens only.' };
      }
      return { value };
    }
    case 'date': {
      const value = text(raw, 10);
      if (!value) return { value: null };
      if (!DATE_PATTERN.test(value) || Number.isNaN(Date.parse(value))) return { value: null, error: 'Enter a valid date.' };
      return { value };
    }
    case 'number': {
      if (raw === null || raw === undefined || raw === '') return { value: null };
      const value = Number(raw);
      if (!Number.isInteger(value)) return { value: null, error: 'Enter a whole number.' };
      if (field.min !== undefined && value < field.min) return { value, error: `Must be ${field.min} or more.` };
      if (field.max !== undefined && value > field.max) return { value, error: `Must be ${field.max} or less.` };
      return { value };
    }
    case 'boolean':
      return { value: raw === true || raw === 'true' };
    case 'select': {
      const value = text(raw, 80);
      if (value && !field.options?.some((option) => option.value === value)) {
        return { value, error: 'Choose one of the listed options.' };
      }
      return { value };
    }
    case 'relation': {
      const value = text(raw, 40);
      if (!value) return { value: null };
      if (!UUID_PATTERN.test(value)) return { value: null, error: 'Choose one of the listed options.' };
      return { value };
    }
    case 'list': {
      if (!Array.isArray(raw)) return { value: [] };
      const items = raw
        .map((item) => text(item, 600))
        .filter(Boolean)
        .slice(0, MAX_LIST_ITEMS);
      return { value: Array.from(new Set(items)) };
    }
    case 'pairs': {
      if (!Array.isArray(raw)) return { value: [] };
      const keys = field.pairFields ?? [];
      const rows: Array<Record<string, string>> = [];
      for (const item of raw.slice(0, MAX_LIST_ITEMS)) {
        if (!item || typeof item !== 'object') continue;
        const row: Record<string, string> = {};
        let hasContent = false;
        for (const key of keys) {
          const value = text((item as Record<string, unknown>)[key.key], key.multiline ? 2000 : 500);
          if (key.url && value && !URL_PATTERN.test(value)) {
            return { value: rows, error: `${key.label} must be a full URL starting with http:// or https://.` };
          }
          row[key.key] = value;
          if (value) hasContent = true;
        }
        if (hasContent) rows.push(row);
      }
      return { value: rows };
    }
    case 'image':
    case 'file': {
      const value = text(raw, 600);
      if (!value) return { value: null };
      // Object keys only: no traversal, no control characters.
      if (value.includes('..') || /[\u0000-\u001f\\]/.test(value)) return { value: null, error: 'Invalid file reference.' };
      return { value };
    }
    default:
      return { value: null };
  }
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
}

// Validates and normalises a submitted record against its resource
// definition. Only declared fields survive, so a crafted request cannot set
// columns such as id, created_at or a role.
export function sanitizeRecord(
  resource: ResourceDef,
  input: Record<string, unknown>,
): { data: Record<string, unknown>; errors: FieldErrors } {
  const data: Record<string, unknown> = {};
  const errors: FieldErrors = {};

  for (const field of allFields(resource)) {
    const { value, error } = coerce(field, input[field.name]);
    data[field.name] = value;
    if (error) errors[field.name] = error;
    else if (field.required && isEmpty(value)) errors[field.name] = `${field.label} is required.`;
  }

  if (resource.publishable) data.published = input.published === true;

  const start = data.start_date;
  const end = data.end_date;
  if (typeof start === 'string' && typeof end === 'string' && end < start) {
    errors.end_date = 'The end date cannot be before the start date.';
  }

  return { data, errors };
}
