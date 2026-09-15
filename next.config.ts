import type {NextConfig} from 'next';

const isDev = process.env.NODE_ENV === 'development';

// Derive the Supabase host from NEXT_PUBLIC_SUPABASE_URL so photos load
// automatically when the project is swapped (e.g. for another cafe owner).
// No hardcoded project ref: without the env var the Supabase remote pattern
// is simply omitted (photos then only work if the bucket URL is allowed some
// other way, e.g. local dev).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
let supabaseHost = '';
try {
  const u = new URL(supabaseUrl);
  if (u.protocol === 'https:' && u.hostname.endsWith('.supabase.co')) {
    supabaseHost = u.hostname;
  }
} catch {
  supabaseHost = '';
}

const remotePatterns: Array<{protocol: 'https'; hostname: string; port: string; pathname: string}> = [];
if (supabaseHost) {
  remotePatterns.push({
    protocol: 'https',
    hostname: supabaseHost,
    port: '',
    pathname: '/storage/v1/**',
  });
}
remotePatterns.push({
  protocol: 'https',
  hostname: 'lh3.googleusercontent.com',
  port: '',
  pathname: '/**',
});

// 'unsafe-eval' is only required by React/Next in dev mode (never in the
// production build). 'unsafe-inline' stays because App Router emits inline
// RSC payload scripts — dropping it would break hydration without a nonce.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: csp,
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns,
    qualities: [75, 90],
  },
  transpilePackages: ['motion'],
};

export default nextConfig;
