import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { sentryVitePlugin } from '@sentry/vite-plugin';

const shouldUploadSourcemaps = Boolean(process.env.SENTRY_AUTH_TOKEN);

const plugins: PluginOption[] = [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Winter Arc Tracker',
      short_name: 'Winter Arc',
      description: 'Track your winter fitness journey with pushups, sports, nutrition, and weight tracking',
      theme_color: '#1e40af',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'firestore-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 // 24 hours
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    }
  }),
  visualizer({
    filename: 'stats.html',
    gzipSize: true,
    brotliSize: true,
  }) as unknown as PluginOption,
];

if (shouldUploadSourcemaps) {
  const releaseName =
    process.env.SENTRY_RELEASE ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA;

  plugins.push(
    sentryVitePlugin({
      org: process.env.SENTRY_ORG ?? 'newrealm',
      project: process.env.SENTRY_PROJECT ?? 'javascript-react',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      sourcemaps: {
        assets: './dist/assets/**',
        filesToDeleteAfterUpload: ['./dist/assets/**/*.map', './dist/**/*.js.map'],
      },
      release: releaseName ? { name: releaseName } : undefined,
    })
  );
}

export default defineConfig({
  base: '/',
  plugins,
  resolve: {
    alias: {
      '@': path.resolve(fileURLToPath(new URL('./src', import.meta.url))),
    },
  },
  build: {
    sourcemap: shouldUploadSourcemaps,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'charts': ['recharts'],
          'ai': ['@google/generative-ai'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
