import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Winter Arc Tracker',
    short_name: 'Winter Arc',
    description: 'Track your fitness journey with push-ups, sports, nutrition, and weight management',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        // "any maskable" is not a valid union; use separate entries if needed. Here we keep maskable for better PWA adaptive icons.
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['health', 'fitness', 'lifestyle'],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View your daily tracking dashboard',
        url: '/dashboard',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Leaderboard',
        short_name: 'Leaderboard',
        description: 'Check group rankings',
        url: '/leaderboard',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
