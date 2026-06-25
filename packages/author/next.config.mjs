const BACKEND_URL =
  process.env.BACKEND_URL ?? 'http://localhost:4000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output creates `.next/standalone/` containing a minimal
  // Node server + only the node_modules needed at runtime. The Dockerfile
  // copies from this path so the runtime image stays small (no source,
  // no devDeps, no build cache).
  output: 'standalone',
  async rewrites() {
    return [
      // Same-origin proxy to the Fastify backend.
      // Browser sees https://auror.my/api/v1/stories → backend receives /v1/stories.
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL}/v1/:path*`,
      },
    ]
  },
}

export default nextConfig