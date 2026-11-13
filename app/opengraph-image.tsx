import { ImageResponse } from 'next/og';
import { getProfile, getSettings } from '@/lib/queries/public';

export const alt = 'Richard Ngasike';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

// Default social sharing image, used when no Open Graph image has been
// uploaded in the admin settings.
export default async function OpenGraphImage() {
  const [settings, profile] = await Promise.all([getSettings(), getProfile()]);
  const name = settings.wordmark || profile.full_name || 'Richard Ngasike';
  const headline = profile.headline || 'Software engineer and designer';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: '#12161a',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', width: 96, height: 4, background: '#c9a045' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 88, letterSpacing: -2, lineHeight: 1.05 }}>{name}</div>
          <div style={{ marginTop: 24, fontSize: 36, color: '#b4b6ba' }}>{headline}</div>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#c9a045', letterSpacing: 4 }}>
          {profile.location ? profile.location.toUpperCase() : 'RICHARDNGASIKE.CO.KE'}
        </div>
      </div>
    ),
    size,
  );
}
