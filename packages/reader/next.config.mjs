const BACKEND_URL =
  process.env.BACKEND_URL ?? 'http://localhost:4000'

// The monorepo lives two levels up from this config (packages/reader/ →
// auror.my/). Turbopack auto-detects the project root by walking up
// looking for a lockfile, but on this machine there is a stub
// `pnpm-lock.yaml` at /Volumes/Dev/users/Dev/ that wins, which makes
// Turbopack look in the wrong place and break route detection. Pinning
// the root to the monorepo fixes that. `outputFileTracingRoot` must
// match `turbopack.root` exactly per Next 16's warning.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TURBOPACK_ROOT = path.resolve(__dirname, '../..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: TURBOPACK_ROOT,
  },
  outputFileTracingRoot: TURBOPACK_ROOT,
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