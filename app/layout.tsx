import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/newsreader';
import '@fontsource-variable/instrument-sans';
import '@/styles/variables.css';
import '@/styles/globals.css';
import { SITE_URL } from '@/lib/env';
import { getProfile, getSettings, getSocialLinks } from '@/lib/queries/public';
import { assetUrl } from '@/lib/storage';

export const revalidate = 300;

const THEME_SCRIPT =
  "try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.dataset.theme=t}}catch(e){}";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, profile, socialLinks] = await Promise.all([getSettings(), getProfile(), getSocialLinks()]);
  const title = settings.site_title || 'Richard Ngasike';
  // Home title carries the role and city, which is what people search for.
  const descriptor = [profile.headline, profile.location].filter(Boolean).join(' in ');
  const homeTitle = descriptor ? `${title} | ${descriptor}` : title;
  const xLink = socialLinks.find((link) => ['x', 'twitter'].includes(link.platform.toLowerCase()));
  const xHandle = xLink ? `@${xLink.url.replace(/\/+$/, '').split('/').pop()}` : undefined;
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
  const ogImage = assetUrl('website-assets', settings.og_image_path);
  const favicon = assetUrl('website-assets', settings.favicon_path);

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: homeTitle, template: `%s | ${title}` },
    applicationName: title,
    category: 'technology',
    publisher: settings.copyright_holder || title,
    formatDetection: { telephone: false },
    description: settings.meta_description || undefined,
    keywords: settings.seo_keywords.length > 0 ? settings.seo_keywords : undefined,
    authors: [{ name: settings.copyright_holder || title, url: SITE_URL }],
    creator: settings.copyright_holder || title,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: title,
      title: homeTitle,
      description: settings.meta_description || undefined,
      url: '/',
      locale: 'en_GB',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: homeTitle,
      description: settings.meta_description || undefined,
      ...(xHandle ? { creator: xHandle, site: xHandle } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    ...(googleVerification || bingVerification
      ? {
          verification: {
            ...(googleVerification ? { google: googleVerification } : {}),
            ...(bingVerification ? { other: { 'msvalidate.01': bingVerification } } : {}),
          },
        }
      : {}),
    ...(favicon ? { icons: { icon: favicon } } : {}),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf7' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0f12' },
  ],
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
