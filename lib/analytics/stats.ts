import type { SupabaseClient } from '@supabase/supabase-js';

export interface DayPoint {
  day: string; // YYYY-MM-DD
  views: number;
  visitors: number;
}

export interface Ranked {
  key: string;
  count: number;
}

export interface Analytics {
  totalViews: number;
  totalVisitors: number;
  todayViews: number;
  days: DayPoint[];
  countries: Ranked[];
  pages: Ranked[];
  referrers: Ranked[];
  devices: Ranked[];
  hasData: boolean;
  rangeDays: number;
}

interface ViewRow {
  path: string;
  country: string | null;
  referrer_host: string | null;
  device: string | null;
  visitor_hash: string | null;
  created_at: string;
}

function dayKey(value: string): string {
  return String(value).slice(0, 10);
}

function rank(map: Map<string, number>, limit: number): Ranked[] {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Aggregates the raw page-view rows into everything the dashboard renders.
// Runs against the authenticated admin client, so RLS already guarantees the
// caller is an administrator.
export async function getAnalytics(supabase: SupabaseClient, rangeDays = 30): Promise<Analytics> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (rangeDays - 1));
  since.setUTCHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from('page_views')
    .select('path, country, referrer_host, device, visitor_hash, created_at')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(50000);

  const rows = (data ?? []) as ViewRow[];

  // Seed an entry for every day in the window so the trend has no gaps.
  const byDay = new Map<string, { views: number; visitors: Set<string> }>();
  for (let i = 0; i < rangeDays; i += 1) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    byDay.set(d.toISOString().slice(0, 10), { views: 0, visitors: new Set() });
  }

  const countries = new Map<string, number>();
  const pages = new Map<string, number>();
  const referrers = new Map<string, number>();
  const devices = new Map<string, number>();
  const visitorSet = new Set<string>();
  let todayViews = 0;

  for (const row of rows) {
    const day = dayKey(row.created_at);
    const bucket = byDay.get(day);
    if (bucket) {
      bucket.views += 1;
      if (row.visitor_hash) bucket.visitors.add(row.visitor_hash);
    }
    if (day === today) todayViews += 1;
    if (row.visitor_hash) visitorSet.add(row.visitor_hash);
    countries.set(row.country ?? 'XX', (countries.get(row.country ?? 'XX') ?? 0) + 1);
    pages.set(row.path, (pages.get(row.path) ?? 0) + 1);
    if (row.referrer_host) referrers.set(row.referrer_host, (referrers.get(row.referrer_host) ?? 0) + 1);
    const dev = row.device ?? 'desktop';
    devices.set(dev, (devices.get(dev) ?? 0) + 1);
  }

  const days: DayPoint[] = [...byDay.entries()].map(([day, value]) => ({
    day,
    views: value.views,
    visitors: value.visitors.size,
  }));

  return {
    totalViews: rows.length,
    totalVisitors: visitorSet.size,
    todayViews,
    days,
    countries: rank(countries, 8),
    pages: rank(pages, 8),
    referrers: rank(referrers, 6),
    devices: rank(devices, 3),
    hasData: rows.length > 0,
    rangeDays,
  };
}
