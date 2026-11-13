import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/newsreader';
import '@fontsource-variable/instrument-sans';
import '@/styles/variables.css';
import '@/styles/globals.css';
import { SITE_URL } from '@/lib/env';
import { getSettings } from '@/lib/queries/public';
import { assetUrl } from '@/lib/storage';

export const revalidate = 300;

const THEME_SCRIPT =
  "try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t}}catch(e){}";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.site_title || 'Richard Ngasike';
  const ogImage = assetUrl('website-assets', settings.og_image_path);
  const favicon = assetUrl('website-assets', settings.favicon_path);

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${title}` },
    description: settings.meta_description || undefined,
    keywords: settings.seo_keywords.length > 0 ? settings.seo_keywords : undefined,
    authors: [{ name: settings.copyright_holder || title, url: SITE_URL }],
    creator: settings.copyright_holder || title,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: title,
      title,
      description: settings.meta_description || undefined,
      url: '/',
      locale: 'en_GB',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description: settings.meta_description || undefined },
    robots: { index: true, follow: true },
    ...(favicon ? { icons: { icon: favicon } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: '#12161a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint, so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
