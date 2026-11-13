import type { MetadataRoute } from 'next';
import { getSettings } from '@/lib/queries/public';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings();
  const name = settings.site_title || 'Richard Ngasike';

  return {
    name,
    short_name: settings.wordmark || name,
    description: settings.meta_description || undefined,
    start_url: '/',
    display: 'standalone',
    background_color: '#fbfaf7',
    theme_color: '#101317',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
