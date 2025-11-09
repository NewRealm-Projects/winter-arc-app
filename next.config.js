/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed temporary ignoreBuildErrors (migration complete) - fix outstanding TS errors instead.
  typescript: {},
  experimental: {
    optimizePackageImports: ['@/components', '@/lib', '@/utils'],
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      // Service Worker headers for PWA
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  // Vercel-specific optimizations
  compress: true,
  poweredByHeader: false,
  trailingSlash: false,
  generateEtags: true,
  reactStrictMode: true,
};

export default nextConfig;
