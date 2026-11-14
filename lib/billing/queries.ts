import 'server-only';

import { cache } from 'react';
import { createServiceClient } from '@/lib/supabase/admin';
import { SITE_URL } from '@/lib/env';
import { getProfile, getSettings } from '@/lib/queries/public';
import { assetUrl } from '@/lib/storage';
import type { BillingDocument, BillingKind, Issuer } from './types';

const CODE_PATTERN = /^\d{1,2}-[A-Z0-9]{6,12}$/;

// Normalises numeric columns, which PostgREST may return as strings.
export function toDocument(row: Record<string, unknown>): BillingDocument {
  const number = (value: unknown) => Number(value) || 0;
  return {
    ...(row as unknown as BillingDocument),
    items: Array.isArray(row.items) ? (row.items as BillingDocument['items']) : [],
    discount: number(row.discount),
    tax_rate: number(row.tax_rate),
    amount_paid: number(row.amount_paid),
    subtotal: number(row.subtotal),
    tax_amount: number(row.tax_amount),
    total: number(row.total),
    balance_due: number(row.balance_due),
  };
}

// Looks up one shared document by the exact path in its link. Drafts are
// never returned. This is the only public read of billing data, and it can
// only fetch a document whose random code the visitor already holds.
export const getSharedDocument = cache(
  async (kind: BillingKind, year: string, month: string, code: string): Promise<BillingDocument | null> => {
    if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || !CODE_PATTERN.test(code)) return null;

    let supabase;
    try {
      supabase = createServiceClient();
    } catch {
      return null;
    }

    const { data, error } = await supabase
      .from('billing_documents')
      .select('*')
      .eq('share_path', `${kind}/${year}/${month}/${code}`)
      .eq('kind', kind)
      .neq('status', 'draft')
      .maybeSingle();

    if (error || !data) return null;
    return toDocument(data);
  },
);

export const getIssuer = cache(async (): Promise<Issuer> => {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);
  return {
    name: profile.full_name || settings.wordmark || 'Richard Ngasike',
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    website: SITE_URL.replace(/^https?:\/\//, ''),
    logoUrl: assetUrl('website-assets', settings.logo_path),
  };
});

export function shareUrl(sharePath: string): string {
  return `${SITE_URL}/${sharePath}`;
}
