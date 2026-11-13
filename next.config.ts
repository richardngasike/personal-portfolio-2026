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

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
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
