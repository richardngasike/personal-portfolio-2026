import { SUPABASE_URL } from '@/lib/env';

export type BucketId =
  | 'profile-images'
  | 'project-images'
  | 'gallery-images'
  | 'organisation-logos'
  | 'website-assets'
  | 'documents';

interface BucketRule {
  isPublic: boolean;
  maxBytes: number;
  mimeTypes: string[];
  label: string;
}

const MB = 1024 * 1024;
const RASTER = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

// Mirrors supabase/migrations/20261112000003_storage.sql. The bucket limits in
// the database are the enforcement; these values give early feedback in the UI.
export const BUCKETS: Record<BucketId, BucketRule> = {
  'profile-images': { isPublic: true, maxBytes: 5 * MB, mimeTypes: RASTER, label: 'JPG, PNG, WebP or AVIF, up to 5 MB' },
  'project-images': { isPublic: true, maxBytes: 8 * MB, mimeTypes: RASTER, label: 'JPG, PNG, WebP or AVIF, up to 8 MB' },
  'gallery-images': { isPublic: true, maxBytes: 10 * MB, mimeTypes: RASTER, label: 'JPG, PNG, WebP or AVIF, up to 10 MB' },
  'organisation-logos': {
    isPublic: true,
    maxBytes: 2 * MB,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    label: 'JPG, PNG, WebP or SVG, up to 2 MB',
  },
  'website-assets': {
    isPublic: true,
    maxBytes: 5 * MB,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'],
    label: 'JPG, PNG, WebP, SVG or ICO, up to 5 MB',
  },
  documents: { isPublic: false, maxBytes: 10 * MB, mimeTypes: ['application/pdf'], label: 'PDF, up to 10 MB' },
};

// A stored path is either an object key inside a bucket, a file shipped in
// /public (starts with "/"), or an absolute URL.
export function isStoragePath(path: string | null | undefined): path is string {
  return Boolean(path) && !path!.startsWith('/') && !/^https?:\/\//i.test(path!);
}

export function assetUrl(bucket: BucketId, path: string | null | undefined): string | null {
  if (!path) return null;
  if (!isStoragePath(path)) return path;
  if (!SUPABASE_URL) return null;
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encoded}`;
}

export function validateFile(bucket: BucketId, file: { size: number; type: string; name: string }): string | null {
  const rule = BUCKETS[bucket];
  if (!rule.mimeTypes.includes(file.type)) {
    return `${file.name}: unsupported file type. Allowed: ${rule.label}.`;
  }
  if (file.size > rule.maxBytes) {
    return `${file.name}: file is too large. Allowed: ${rule.label}.`;
  }
  return null;
}

export function buildObjectPath(folder: string, fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  const ext = dot > -1 ? fileName.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const base = (dot > -1 ? fileName.slice(0, dot) : fileName)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${folder}/${unique}-${base || 'file'}${ext ? `.${ext}` : ''}`;
}
