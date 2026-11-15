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

// A brand splash that paints immediately and is removed the moment the DOM is
// ready. If scripts never run (JS disabled or a failed load), a CSS animation
// still clears it after 3.5s, so it can never trap the visitor on a slow or
// broken network.
const SPLASH_STYLE = `#splash{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:#fbfaf7;transition:opacity .45s ease,visibility .45s ease;animation:splashTimeout 0s linear 3.5s forwards}html[data-theme=dark] #splash{background:#0c0f12}html[data-loaded] #splash{opacity:0;visibility:hidden;pointer-events:none;animation:none}#splash .splash__mark{font-family:'Newsreader Variable',Georgia,serif;font-size:34px;letter-spacing:.05em;color:#13161a;font-weight:500}html[data-theme=dark] #splash .splash__mark{color:#f2f1ee}#splash .splash__track{position:relative;width:132px;height:2px;background:rgba(0,0,0,.09);overflow:hidden;border-radius:2px}html[data-theme=dark] #splash .splash__track{background:rgba(255,255,255,.12)}#splash .splash__beam{position:absolute;top:0;left:0;height:100%;width:40%;background:#b08a35;border-radius:2px;animation:splashBeam 1.1s cubic-bezier(.4,0,.2,1) infinite}@keyframes splashBeam{0%{transform:translateX(-120%)}100%{transform:translateX(350%)}}@keyframes splashTimeout{to{opacity:0;visibility:hidden;pointer-events:none}}@media (prefers-reduced-motion:reduce){#splash .splash__beam{animation:none;width:100%;opacity:.45}#splash{transition:none}}`;

const SPLASH_DISMISS =
  "(function(){function d(){document.documentElement.setAttribute('data-loaded','')}if(document.readyState!=='loading'){d()}else{document.addEventListener('DOMContentLoaded',function(){requestAnimationFrame(d)})}window.addEventListener('load',d)})();";

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
        <style dangerouslySetInnerHTML={{ __html: SPLASH_STYLE }} />
        <script dangerouslySetInnerHTML={{ __html: SPLASH_DISMISS }} />
      </head>
      <body>
        <div id="splash" aria-hidden="true">
          <div className="splash__mark">RN</div>
          <div className="splash__track">
            <span className="splash__beam" />
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
