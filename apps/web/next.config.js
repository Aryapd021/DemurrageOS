/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for optimal deployment
  output: 'standalone',

  // Allow all image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Ignore TypeScript errors in CI (already verified locally)
  typescript: {
    ignoreBuildErrors: false,
  },

  // Ignore ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
