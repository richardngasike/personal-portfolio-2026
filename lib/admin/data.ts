import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { RESOURCES, allFields, type ResourceDef } from './resources';

export type RelationOptions = Record<string, Array<{ value: string; label: string }>>;

// Loads the option lists for every relation field of a resource.
export async function loadRelations(supabase: SupabaseClient, resource: ResourceDef): Promise<RelationOptions> {
  const relations: RelationOptions = {};
  for (const field of allFields(resource)) {
    if (field.type !== 'relation' || !field.relation) continue;
    const target = RESOURCES[field.relation];
    const { data } = await supabase
      .from(target.table)
      .select(`id, ${target.titleField}`)
      .order('sort_order', { ascending: true });
    relations[field.name] = ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => ({
      value: String(row.id),
      label: String(row[target.titleField] ?? ''),
    }));
  }
  return relations;
}
