/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/stitch_auror_modern_reading_platform/reader_browse_dashboard/code.html',
      },
      {
        source: '/library',
        destination: '/stitch_auror_modern_reading_platform/library_history_progress/code.html',
      },
      {
        source: '/reading',
        destination: '/stitch_auror_modern_reading_platform/immersive_reading_experience/code.html',
      },
      {
        source: '/wallet',
        destination: '/stitch_auror_modern_reading_platform/reader_wallet_rewards/code.html',
      },
      {
        source: '/subscription',
        destination: '/stitch_auror_modern_reading_platform/reader_subscription_dashboard/code.html',
      },
      {
        source: '/author/analytics',
        destination: '/stitch_auror_modern_reading_platform/author_analytics_dashboard/code.html',
      },
      {
        source: '/author/earnings',
        destination: '/stitch_auror_modern_reading_platform/author_earnings_wallet/code.html',
      },
      {
        source: '/author/settings',
        destination: '/stitch_auror_modern_reading_platform/author_profile_settings/code.html',
      },
      {
        source: '/author/studio',
        destination: '/stitch_auror_modern_reading_platform/author_writing_studio/code.html',
      },
      {
        source: '/admin',
        destination: '/stitch_auror_modern_reading_platform/admin_command_center/code.html',
      },
      {
        source: '/admin/moderation',
        destination: '/stitch_auror_modern_reading_platform/admin_content_moderation/code.html',
      },
      {
        source: '/admin/users',
        destination: '/stitch_auror_modern_reading_platform/admin_user_management/code.html',
      },
      {
        source: '/login',
        destination: '/stitch_auror_modern_reading_platform/auth/login.html',
      },
      {
        source: '/register',
        destination: '/stitch_auror_modern_reading_platform/auth/register.html',
      }
    ];
  }
};

export default nextConfig;
