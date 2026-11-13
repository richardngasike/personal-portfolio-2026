'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdminAction, UnauthorisedError } from '@/lib/auth/require-admin';
import { BUCKETS, isStoragePath, type BucketId } from '@/lib/storage';
import { RESOURCES, allFields, isResourceKey, type ResourceDef } from './resources';
import { sanitizeRecord, type FieldErrors } from './validate';

// Every action in this file starts with requireAdminAction(), which verifies
// the session with Supabase Auth and the admin role in the database. The
// queries then run as that user, so Row Level Security applies a second,
// independent check.

export interface ActionResult {
  ok: boolean;
  message?: string;
  errors?: FieldErrors;
  id?: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(error: unknown, fallback = 'Something went wrong. Please try again.'): ActionResult {
  if (error instanceof UnauthorisedError) return { ok: false, message: error.message };
  console.error('[admin action]', error);
  return { ok: false, message: fallback };
}

function describeDbError(error: { code?: string; message: string }): string {
  if (error.code === '23505') return 'A record with the same unique value (for example the slug or name) already exists.';
  if (error.code === '23503') return 'This record is still referenced by other content.';
  if (error.code === '23514') return 'One of the values is not allowed. Check the form and try again.';
  if (error.code === '42501') return 'You are not authorised to perform this action.';
  return 'The change could not be saved. Please try again.';
}

function resolve(resourceKey: string): ResourceDef {
  if (!isResourceKey(resourceKey)) throw new Error(`Unknown resource: ${resourceKey}`);
  return RESOURCES[resourceKey];
}

function refreshPublicSite() {
  revalidatePath('/', 'layout');
}

async function removeObjects(supabase: SupabaseClient, files: Array<{ bucket: BucketId; path: unknown }>) {
  const byBucket = new Map<BucketId, string[]>();
  for (const file of files) {
    if (typeof file.path !== 'string' || !isStoragePath(file.path)) continue;
    byBucket.set(file.bucket, [...(byBucket.get(file.bucket) ?? []), file.path]);
  }
  for (const [bucket, paths] of byBucket) {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) console.error(`[admin action] could not remove files from ${bucket}: ${error.message}`);
  }
}

function fileFields(resource: ResourceDef) {
  return allFields(resource).filter((field) => (field.type === 'image' || field.type === 'file') && field.bucket);
}

// Create / update ---------------------------------------------------------------

export async function saveRecord(
  resourceKey: string,
  id: string | null,
  input: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    const resource = resolve(resourceKey);
    const { data, errors } = sanitizeRecord(resource, input ?? {});
    if (Object.keys(errors).length > 0) {
      return { ok: false, message: 'Please correct the highlighted fields.', errors };
    }

    if (resource.key === 'documents') {
      if (data.kind !== 'cv') data.is_current = false;
      if (data.is_current === true) {
        // Only one CV may be current; clear the flag elsewhere first.
        let clear = supabase.from('documents').update({ is_current: false }).eq('kind', 'cv').eq('is_current', true);
        if (id) clear = clear.neq('id', id);
        const { error: clearError } = await clear;
        if (clearError) return { ok: false, message: describeDbError(clearError) };
      }
    }

    if (resource.singleton) {
      const { data: previous } = await supabase.from(resource.table).select('*').maybeSingle();
      const { error } = await supabase.from(resource.table).upsert({ id: true, ...data });
      if (error) return { ok: false, message: describeDbError(error) };
      if (previous) await removeReplacedFiles(supabase, resource, previous, data);
      refreshPublicSite();
      return { ok: true, message: `${resource.singular} saved.` };
    }

    if (id) {
      if (!UUID_PATTERN.test(id)) return { ok: false, message: 'Record not found.' };
      const { data: previous } = await supabase.from(resource.table).select('*').eq('id', id).maybeSingle();
      if (!previous) return { ok: false, message: 'Record not found.' };

      const { error } = await supabase.from(resource.table).update(data).eq('id', id);
      if (error) return { ok: false, message: describeDbError(error) };

      await removeReplacedFiles(supabase, resource, previous, data);
      refreshPublicSite();
      return { ok: true, id, message: `${resource.singular} saved.` };
    }

    if (resource.orderable) {
      const { data: last } = await supabase
        .from(resource.table)
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);
      data.sort_order = ((last?.[0]?.sort_order as number | undefined) ?? 0) + 1;
    }

    const { data: created, error } = await supabase.from(resource.table).insert(data).select('id').single();
    if (error) return { ok: false, message: describeDbError(error) };

    refreshPublicSite();
    return { ok: true, id: created.id as string, message: `${resource.singular} created.` };
  } catch (error) {
    return fail(error);
  }
}

async function removeReplacedFiles(
  supabase: SupabaseClient,
  resource: ResourceDef,
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
) {
  const stale = fileFields(resource)
    .filter((field) => previous[field.name] && previous[field.name] !== next[field.name])
    .map((field) => ({ bucket: field.bucket as BucketId, path: previous[field.name] }));
  await removeObjects(supabase, stale);
}

// Delete -----------------------------------------------------------------------

export async function deleteRecord(resourceKey: string, id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    const resource = resolve(resourceKey);
    if (resource.singleton || !UUID_PATTERN.test(id)) return { ok: false, message: 'Record not found.' };

    const { data: row } = await supabase.from(resource.table).select('*').eq('id', id).maybeSingle();
    if (!row) return { ok: false, message: 'Record not found.' };

    const files = fileFields(resource).map((field) => ({ bucket: field.bucket as BucketId, path: row[field.name] }));

    if (resource.key === 'projects') {
      const { data: images } = await supabase.from('project_images').select('image_path').eq('project_id', id);
      for (const image of images ?? []) files.push({ bucket: 'project-images', path: image.image_path });
    }

    const { error } = await supabase.from(resource.table).delete().eq('id', id);
    if (error) return { ok: false, message: describeDbError(error) };

    await removeObjects(supabase, files);
    refreshPublicSite();
    return { ok: true, message: `${resource.singular} deleted.` };
  } catch (error) {
    return fail(error);
  }
}

// Publish / feature toggles ----------------------------------------------------------

export async function setRecordFlag(
  resourceKey: string,
  id: string,
  flag: 'published' | 'featured',
  value: boolean,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    const resource = resolve(resourceKey);
    if (!UUID_PATTERN.test(id)) return { ok: false, message: 'Record not found.' };
    if (flag === 'published' && !resource.publishable) return { ok: false, message: 'This content cannot be published.' };
    if (flag === 'featured' && !resource.featurable) return { ok: false, message: 'This content cannot be featured.' };
    if (flag !== 'published' && flag !== 'featured') return { ok: false, message: 'Unknown setting.' };

    const { error } = await supabase.from(resource.table).update({ [flag]: value === true }).eq('id', id);
    if (error) return { ok: false, message: describeDbError(error) };

    refreshPublicSite();
    const label = flag === 'published' ? (value ? 'Published.' : 'Moved to drafts.') : value ? 'Featured.' : 'No longer featured.';
    return { ok: true, message: label };
  } catch (error) {
    return fail(error);
  }
}

// Reorder ----------------------------------------------------------------------

export async function reorderRecords(resourceKey: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    const resource = resolve(resourceKey);
    if (!resource.orderable) return { ok: false, message: 'This content cannot be reordered.' };
    if (!Array.isArray(orderedIds) || orderedIds.length > 500 || !orderedIds.every((id) => UUID_PATTERN.test(id))) {
      return { ok: false, message: 'Invalid order.' };
    }

    const results = await Promise.all(
      orderedIds.map((id, index) => supabase.from(resource.table).update({ sort_order: index + 1 }).eq('id', id)),
    );
    const failed = results.find((result) => result.error);
    if (failed?.error) return { ok: false, message: describeDbError(failed.error) };

    refreshPublicSite();
    return { ok: true, message: 'Order saved.' };
  } catch (error) {
    return fail(error);
  }
}

// Project screenshots ------------------------------------------------------------

function cleanPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const path = value.trim();
  if (!path || path.length > 600 || path.includes('..') || /[\u0000-\u001f\\]/.test(path)) return null;
  return path;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\u0000/g, '').trim().slice(0, max) : '';
}

export async function addProjectImages(projectId: string, paths: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!UUID_PATTERN.test(projectId)) return { ok: false, message: 'Project not found.' };
    const valid = (Array.isArray(paths) ? paths : []).map(cleanPath).filter((path): path is string => Boolean(path));
    if (valid.length === 0 || valid.length > 30) return { ok: false, message: 'Select between 1 and 30 images.' };

    const { data: last } = await supabase
      .from('project_images')
      .select('sort_order')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: false })
      .limit(1);
    const start = ((last?.[0]?.sort_order as number | undefined) ?? 0) + 1;

    const { error } = await supabase
      .from('project_images')
      .insert(valid.map((image_path, index) => ({ project_id: projectId, image_path, sort_order: start + index })));
    if (error) return { ok: false, message: describeDbError(error) };

    refreshPublicSite();
    return { ok: true, message: `${valid.length} ${valid.length === 1 ? 'screenshot' : 'screenshots'} added.` };
  } catch (error) {
    return fail(error);
  }
}

export async function updateProjectImage(
  id: string,
  input: { caption?: string; alt_text?: string },
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!UUID_PATTERN.test(id)) return { ok: false, message: 'Image not found.' };
    const { error } = await supabase
      .from('project_images')
      .update({ caption: cleanText(input?.caption, 300), alt_text: cleanText(input?.alt_text, 300) })
      .eq('id', id);
    if (error) return { ok: false, message: describeDbError(error) };
    refreshPublicSite();
    return { ok: true, message: 'Screenshot saved.' };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteProjectImage(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!UUID_PATTERN.test(id)) return { ok: false, message: 'Image not found.' };
    const { data: row } = await supabase.from('project_images').select('image_path').eq('id', id).maybeSingle();
    if (!row) return { ok: false, message: 'Image not found.' };
    const { error } = await supabase.from('project_images').delete().eq('id', id);
    if (error) return { ok: false, message: describeDbError(error) };
    await removeObjects(supabase, [{ bucket: 'project-images', path: row.image_path }]);
    refreshPublicSite();
    return { ok: true, message: 'Screenshot deleted.' };
  } catch (error) {
    return fail(error);
  }
}

export async function reorderProjectImages(projectId: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!UUID_PATTERN.test(projectId) || !Array.isArray(orderedIds) || !orderedIds.every((id) => UUID_PATTERN.test(id))) {
      return { ok: false, message: 'Invalid order.' };
    }
    const results = await Promise.all(
      orderedIds.map((id, index) =>
        supabase.from('project_images').update({ sort_order: index + 1 }).eq('id', id).eq('project_id', projectId),
      ),
    );
    const failed = results.find((result) => result.error);
    if (failed?.error) return { ok: false, message: describeDbError(failed.error) };
    refreshPublicSite();
    return { ok: true, message: 'Order saved.' };
  } catch (error) {
    return fail(error);
  }
}

// Gallery bulk upload -------------------------------------------------------------

export interface GalleryUploadItem {
  image_path: string;
  title: string;
  width: number | null;
  height: number | null;
}

export async function createGalleryImages(
  items: GalleryUploadItem[],
  options: { categoryId: string | null; published: boolean },
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!Array.isArray(items) || items.length === 0 || items.length > 40) {
      return { ok: false, message: 'Select between 1 and 40 images.' };
    }
    const categoryId = options?.categoryId && UUID_PATTERN.test(options.categoryId) ? options.categoryId : null;

    const { data: last } = await supabase
      .from('gallery_images')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);
    const start = ((last?.[0]?.sort_order as number | undefined) ?? 0) + 1;

    const rows = [];
    for (const [index, item] of items.entries()) {
      const image_path = cleanPath(item?.image_path);
      if (!image_path) return { ok: false, message: 'One of the uploaded files is invalid.' };
      const dimension = (value: unknown) =>
        typeof value === 'number' && Number.isInteger(value) && value > 0 && value < 100000 ? value : null;
      rows.push({
        image_path,
        title: cleanText(item.title, 200),
        category_id: categoryId,
        width: dimension(item.width),
        height: dimension(item.height),
        published: options?.published === true,
        sort_order: start + index,
      });
    }

    const { error } = await supabase.from('gallery_images').insert(rows);
    if (error) return { ok: false, message: describeDbError(error) };

    refreshPublicSite();
    return { ok: true, message: `${rows.length} ${rows.length === 1 ? 'image' : 'images'} added to the gallery.` };
  } catch (error) {
    return fail(error);
  }
}

// Contact messages ------------------------------------------------------------------

export async function updateMessage(
  id: string,
  changes: { is_read?: boolean; is_archived?: boolean },
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!UUID_PATTERN.test(id)) return { ok: false, message: 'Message not found.' };
    const update: Record<string, boolean> = {};
    if (typeof changes?.is_read === 'boolean') update.is_read = changes.is_read;
    if (typeof changes?.is_archived === 'boolean') update.is_archived = changes.is_archived;
    if (Object.keys(update).length === 0) return { ok: false, message: 'Nothing to change.' };

    const { error } = await supabase.from('contact_messages').update(update).eq('id', id);
    if (error) return { ok: false, message: describeDbError(error) };
    revalidatePath('/admin', 'layout');
    return { ok: true, message: 'Message updated.' };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!UUID_PATTERN.test(id)) return { ok: false, message: 'Message not found.' };
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) return { ok: false, message: describeDbError(error) };
    revalidatePath('/admin', 'layout');
    return { ok: true, message: 'Message deleted.' };
  } catch (error) {
    return fail(error);
  }
}

// Private files -----------------------------------------------------------------------

export async function getSignedFileUrl(bucket: string, path: string): Promise<ActionResult & { url?: string }> {
  try {
    const { supabase } = await requireAdminAction();
    const cleaned = cleanPath(path);
    if (!Object.prototype.hasOwnProperty.call(BUCKETS, bucket) || !cleaned || !isStoragePath(cleaned)) {
      return { ok: false, message: 'File not found.' };
    }
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(cleaned, 120);
    if (error || !data?.signedUrl) return { ok: false, message: 'The file could not be opened.' };
    return { ok: true, url: data.signedUrl };
  } catch (error) {
    return fail(error);
  }
}
