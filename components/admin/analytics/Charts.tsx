import type { DayPoint, Ranked } from '@/lib/analytics/stats';
import { countryFlag, countryName } from '@/lib/analytics/geo';

// All charts are server-rendered inline SVG — no client JS, no chart library,
// so the admin analytics page stays fast and themable through CSS tokens.

function niceMax(value: number): number {
  if (value <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const steps = [1, 2, 2.5, 5, 10];
  for (const step of steps) {
    const candidate = step * pow;
    if (candidate >= value) return candidate;
  }
  return 10 * pow;
}

export function TrendChart({ days }: { days: DayPoint[] }) {
  const W = 720;
  const H = 200;
  const padX = 8;
  const padTop = 16;
  const padBottom = 28;
  const plotH = H - padTop - padBottom;
  const max = niceMax(Math.max(1, ...days.map((d) => d.views)));
  const n = days.length;
  const slot = (W - padX * 2) / n;
  const barW = Math.max(3, slot * 0.56);

  const y = (v: number) => padTop + plotH - (v / max) * plotH;
  const cx = (i: number) => padX + slot * i + slot / 2;

  const linePts = days.map((d, i) => `${cx(i).toFixed(1)},${y(d.visitors).toFixed(1)}`).join(' ');

  // Label roughly five evenly spaced dates.
  const labelEvery = Math.ceil(n / 5);
  const fmt = (day: string) => {
    const d = new Date(`${day}T00:00:00Z`);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  };

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart__svg" role="img" aria-label="Daily views and visitors trend">
        <line x1={padX} x2={W - padX} y1={y(0)} y2={y(0)} className="chart__axis" />
        <line x1={padX} x2={W - padX} y1={y(max)} y2={y(max)} className="chart__grid" />
        <text x={padX} y={y(max) - 5} className="chart__gridlabel">
          {max}
        </text>
        {days.map((d, i) => (
          <rect
            key={d.day}
            x={cx(i) - barW / 2}
            y={y(d.views)}
            width={barW}
            height={Math.max(0, y(0) - y(d.views))}
            rx={1.5}
            className="chart__bar"
          >
            <title>{`${fmt(d.day)}: ${d.views} views, ${d.visitors} visitors`}</title>
          </rect>
        ))}
        <polyline points={linePts} className="chart__line" fill="none" />
        {days.map((d, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={`l-${d.day}`} x={cx(i)} y={H - 8} className="chart__xlabel" textAnchor="middle">
              {fmt(d.day)}
            </text>
          ) : null,
        )}
      </svg>
      <figcaption className="chart__legend">
        <span className="chart__key chart__key--bar">Views</span>
        <span className="chart__key chart__key--line">Unique visitors</span>
      </figcaption>
    </figure>
  );
}

export function RankList({
  items,
  kind,
  empty,
}: {
  items: Ranked[];
  kind: 'country' | 'page' | 'referrer';
  empty: string;
}) {
  if (items.length === 0) return <p className="rank__empty">{empty}</p>;
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <ul className="rank">
      {items.map((item) => {
        const label =
          kind === 'country'
            ? `${countryFlag(item.key === 'XX' ? '' : item.key)} ${countryName(item.key === 'XX' ? null : item.key)}`.trim()
            : kind === 'page'
              ? item.key
              : item.key;
        return (
          <li key={item.key} className="rank__row">
            <span className="rank__bar" style={{ width: `${(item.count / max) * 100}%` }} aria-hidden />
            <span className="rank__label" title={label}>
              {label}
            </span>
            <span className="rank__count">{item.count}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function DeviceSplit({ devices }: { devices: Ranked[] }) {
  const total = devices.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return <p className="rank__empty">No device data yet.</p>;
  const order = ['desktop', 'mobile', 'tablet'];
  const sorted = order
    .map((name) => devices.find((d) => d.key === name) ?? { key: name, count: 0 })
    .filter((d) => d.count > 0);
  return (
    <div className="device">
      <div className="device__bar" role="img" aria-label="Device breakdown">
        {sorted.map((d, i) => (
          <span
            key={d.key}
            className={`device__seg device__seg--${i}`}
            style={{ width: `${(d.count / total) * 100}%` }}
            title={`${d.key}: ${Math.round((d.count / total) * 100)}%`}
          />
        ))}
      </div>
      <ul className="device__legend">
        {sorted.map((d, i) => (
          <li key={d.key}>
            <span className={`device__dot device__seg--${i}`} aria-hidden />
            <span className="device__name">{d.key}</span>
            <span className="device__pct">{Math.round((d.count / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
