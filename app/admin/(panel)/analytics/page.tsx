import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/auth/require-admin';
import { getAnalytics } from '@/lib/analytics/stats';
import { countryFlag, countryName } from '@/lib/analytics/geo';
import { TrendChart, RankList, DeviceSplit } from '@/components/admin/analytics/Charts';

export const metadata: Metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const { supabase } = await requireAdminPage();
  const data = await getAnalytics(supabase, 30);

  const topCountry = data.countries[0];
  const stats = [
    { label: 'Views, 30 days', value: data.totalViews.toLocaleString() },
    { label: 'Unique visitors, 30 days', value: data.totalVisitors.toLocaleString() },
    { label: 'Views today', value: data.todayViews.toLocaleString() },
    {
      label: 'Top country',
      value: topCountry
        ? `${countryFlag(topCountry.key === 'XX' ? '' : topCountry.key)} ${countryName(topCountry.key === 'XX' ? null : topCountry.key)}`.trim()
        : '—',
    },
  ];

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Analytics</h1>
          <p>First-party, privacy-respecting. Last 30 days. Visitors who declined cookies are not counted.</p>
        </div>
      </header>

      {!data.hasData ? (
        <section className="panel">
          <div className="panel__body">
            <p className="empty empty--inline">
              No visits recorded yet. Data appears here once visitors accept analytics on the live site. (Run
              <code> add-analytics.sql</code> in Supabase if you have not already.)
            </p>
          </div>
        </section>
      ) : (
        <>
          <ul className="stats stats--tiles">
            {stats.map((stat) => (
              <li key={stat.label}>
                <div className="stat stat--static">
                  <span className="stat__value stat__value--sm">{stat.value}</span>
                  <span className="stat__label">{stat.label}</span>
                </div>
              </li>
            ))}
          </ul>

          <section className="panel">
            <header className="panel__header">
              <h2>Views and visitors</h2>
            </header>
            <div className="panel__body">
              <TrendChart days={data.days} />
            </div>
          </section>

          <div className="analytics-grid">
            <section className="panel">
              <header className="panel__header">
                <h2>Top countries</h2>
              </header>
              <div className="panel__body">
                <RankList items={data.countries} kind="country" empty="No country data yet." />
              </div>
            </section>

            <section className="panel">
              <header className="panel__header">
                <h2>Most-read pages</h2>
              </header>
              <div className="panel__body">
                <RankList items={data.pages} kind="page" empty="No pages yet." />
              </div>
            </section>

            <section className="panel">
              <header className="panel__header">
                <h2>Where visitors came from</h2>
              </header>
              <div className="panel__body">
                <RankList items={data.referrers} kind="referrer" empty="Mostly direct visits so far." />
              </div>
            </section>

            <section className="panel">
              <header className="panel__header">
                <h2>Devices</h2>
              </header>
              <div className="panel__body">
                <DeviceSplit devices={data.devices} />
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
