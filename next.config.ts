import type { NextConfig } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const remotePatterns: NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> = [];
// A Supabase stack running on this machine (supabase start) serves storage
// from a loopback address, which the image optimiser refuses by default.
let isLocalSupabase = false;

if (supabaseUrl) {
  try {
    const { protocol, hostname, port } = new URL(supabaseUrl);
    isLocalSupabase = hostname === 'localhost' || hostname === '127.0.0.1';
    remotePatterns.push({
      protocol: protocol.replace(':', '') as 'http' | 'https',
      hostname,
      port,
      pathname: '/storage/v1/object/public/**',
    });
  } catch {
    // An invalid URL is reported at runtime by lib/env.ts.
  }
}

// Content Security Policy. Everything is locked to this origin: no third-party
// scripts, styles, fonts, frames or form targets, which shuts down the common
// injection and clickjacking routes. Only the Supabase origin is allowed for
// images (stored media) and API calls (auth and storage). 'unsafe-inline' is
// required for scripts and styles because the site is statically rendered and
// served from the CDN for speed, so per-request nonces are not available;
// public pages reflect no untrusted input, so there is no inline-script vector.
const supabaseOrigin = (() => {
  if (!supabaseUrl) return '';
  try {
    return new URL(supabaseUrl).origin;
  } catch {
    return '';
  }
})();

// Only force HTTPS upgrades when the site's own Supabase origin is HTTPS. A
// local http://localhost Supabase (used in development) must not be upgraded,
// or the browser cannot reach it.
const allowInsecureUpgrade = !supabaseOrigin || supabaseOrigin.startsWith('https://');

const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data:${supabaseOrigin ? ` ${supabaseOrigin}` : ''}`,
  `font-src 'self'`,
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ''}`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  ...(allowInsecureUpgrade ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowLocalIP: isLocalSupabase,
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
