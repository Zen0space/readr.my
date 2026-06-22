/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // MIGRATE: see docs/development/dev-frontend-migration.md Phase E (Admin home)
      {
        source: '/admin',
        destination: '/stitch_auror_modern_reading_platform/admin_command_center/code.html',
      },
      // MIGRATE: see docs/development/dev-frontend-migration.md Phase E (Admin moderation)
      {
        source: '/admin/moderation',
        destination: '/stitch_auror_modern_reading_platform/admin_content_moderation/code.html',
      },
      // MIGRATE: see docs/development/dev-frontend-migration.md Phase E (Admin users)
      {
        source: '/admin/users',
        destination: '/stitch_auror_modern_reading_platform/admin_user_management/code.html',
      },
    ];
  },
};

export default nextConfig;
