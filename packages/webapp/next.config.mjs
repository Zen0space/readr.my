const BACKEND_URL =
  process.env.BACKEND_URL ?? 'http://localhost:4000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Same-origin proxy: any `/api/v1/*` request is forwarded to the
      // Fastify backend at :4000, with the `/api/` prefix stripped. The
      // browser sees `https://auror.my/api/v1/stories`; the backend
      // receives `/v1/stories`. Bearer token is forwarded unchanged.
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL}/v1/:path*`,
      },
    ]
  },
}

export default nextConfig