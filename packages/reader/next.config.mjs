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

/**
 * The reader talks to the Fastify backend DIRECTLY (`NEXT_PUBLIC_API_BASE_URL`
 * points at the backend), so no rewrite proxy is configured here. The
 * backend already allows the reader's origin via CORS_ORIGINS.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output creates `.next/standalone/` containing a minimal
  // Node server + only the node_modules needed at runtime. The Dockerfile
  // copies from this path so the runtime image stays small (no source,
  // no devDeps, no build cache).
  output: 'standalone',
  turbopack: {
    root: TURBOPACK_ROOT,
  },
  outputFileTracingRoot: TURBOPACK_ROOT,
}

export default nextConfig