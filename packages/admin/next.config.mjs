const BACKEND_URL =
  process.env.BACKEND_URL ?? 'http://localhost:4000'

/**
 * Admin is the strictest security boundary of the three frontends. The CSP
 * below locks down what the browser can fetch to the same origin + the
 * Supabase endpoints we actually talk to. next/image is disabled so every
 * image goes through Supabase storage's CDN with its own URL.
 *
 * Reader + author can loosen this in Phase 4 once we wire a /cdn/* proxy
 * for cover/avatar images — admin stays strict per the split plan (§D.2).
 */
const CSP = [
  "default-src 'self'",
  // connect-src: same-origin (Next.js + rewrite to backend) + Supabase auth
  // + Supabase storage (the avatars / covers buckets live there).
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  // img-src: same-origin + Supabase storage + data: (avatars are URLs there).
  "img-src 'self' https://*.supabase.co data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output creates `.next/standalone/` containing a minimal
  // Node server + only the node_modules needed at runtime. The Dockerfile
  // copies from this path so the runtime image stays small (no source,
  // no devDeps, no build cache).
  output: 'standalone',
  images: {
    // Admin never optimizes third-party images; covers + avatars come from
    // Supabase storage with their own CDN URL.
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL}/v1/:path*`,
      },
    ]
  },
}

export default nextConfig