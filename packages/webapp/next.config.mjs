/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // MIGRATE: see docs/development/dev-frontend-migration.md Phase C (Browse)
      {
        source: '/',
        destination: '/stitch_auror_modern_reading_platform/reader_browse_dashboard/code.html',
      },
      // MIGRATE: see docs/development/dev-frontend-migration.md Phase C (Library)
      {
        source: '/library',
        destination: '/stitch_auror_modern_reading_platform/library_history_progress/code.html',
      },
      // MIGRATE: see docs/development/dev-frontend-migration.md Phase C (Reader)
      {
        source: '/reading',
        destination: '/stitch_auror_modern_reading_platform/immersive_reading_experience/code.html',
      },
      // MIGRATE: see docs/development/dev-frontend-migration.md Phase C (Wallet)
      {
        source: '/wallet',
        destination: '/stitch_auror_modern_reading_platform/reader_wallet_rewards/code.html',
      },
      // MIGRATE: see docs/development/dev-frontend-migration.md Phase C (Subscription)
      {
        source: '/subscription',
        destination: '/stitch_auror_modern_reading_platform/reader_subscription_dashboard/code.html',
      },
      // MIGRATE: see docs/development/dev-frontend-migration.md Phase D (Author analytics)
      {
        source: '/author/analytics',
        destination: '/stitch_auror_modern_reading_platform/author_analytics_dashboard/code.html',
      },
      // MIGRATE: see docs/development/dev-frontend-migration.md Phase D (Author earnings)
      {
        source: '/author/earnings',
        destination: '/stitch_auror_modern_reading_platform/author_earnings_wallet/code.html',
      },
      // MIGRATE: see docs/development/dev-frontend-migration.md Phase D (Author settings)
      {
        source: '/author/settings',
        destination: '/stitch_auror_modern_reading_platform/author_profile_settings/code.html',
      },
      // MIGRATE: see docs/development/dev-frontend-migration.md Phase D (Author studio)
      {
        source: '/author/studio',
        destination: '/stitch_auror_modern_reading_platform/author_writing_studio/code.html',
      },
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
