import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

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
      scope: process.env.VITE_BASE_PATH || '/',
      start_url: process.env.VITE_BASE_PATH || '/',
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
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,otf,webp,avif}'],
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
      runtimeCaching: [
        // HTML pages - Network First with offline fallback
        {
          urlPattern: /^https?.*\.html$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'html-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 // 24 hours
            },
            networkTimeoutSeconds: 3,
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        // Firebase Firestore API - Network First with offline support
        {
          urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'firestore-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
            },
            networkTimeoutSeconds: 5,
            cacheableResponse: {
              statuses: [0, 200]
            },
            backgroundSync: {
              name: 'firestore-sync',
              options: {
                maxRetentionTime: 60 * 60 * 24 // 24 hours
              }
            }
          }
        },
        // Firebase Auth API - Network Only (no caching for security)
        {
          urlPattern: /^https:\/\/(identitytoolkit|securetoken)\.googleapis\.com\/.*/i,
          handler: 'NetworkOnly'
        },
        // Static assets (JS, CSS) - Cache First
        {
          urlPattern: /\.(?:js|css)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'static-resources',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        // Images - Cache First with network fallback
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        // Fonts - Cache First (rarely change)
        {
          urlPattern: /\.(?:woff|woff2|ttf|otf)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        // Google Fonts - Cache First
        {
          urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        // Weather API - Network First with stale cache
        {
          urlPattern: /^https:\/\/api\.(?:openweathermap|open-meteo)\.(?:org|com)\/.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'weather-api',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 // 1 hour
            },
            networkTimeoutSeconds: 3
          }
        },
        // AI API - Network Only (no caching for dynamic content)
        {
          urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/,
          handler: 'NetworkOnly'
        }
      ],
      skipWaiting: true,
      clientsClaim: true,
      cleanupOutdatedCaches: true,
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/(api|__)\//]
    }
  }),
  visualizer({
    filename: 'stats.html',
    gzipSize: true,
    brotliSize: true,
  }) as unknown as PluginOption,
];

export default defineConfig({
  // Support dynamic base path for PR previews (e.g., /pr-123/)
  base: process.env.VITE_BASE_PATH || '/',
  plugins,
  resolve: {
    alias: {
      '@': path.resolve(fileURLToPath(new URL('./src', import.meta.url))),
    },
  },
  server: {
    watch: {
      // Exclude directories that trigger infinite reload loops
      ignored: [
        '**/node_modules/**',
        '**/coverage/**',
        '**/dist/**',
        '**/.git/**',
        '**/.vscode/**',
        '**/.idea/**',
        '**/openspec/changes/**', // OpenSpec proposal changes don't need HMR
      ],
    },
    headers: {
      // Security headers for development
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      // CSP for development (more permissive for HMR)
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' ws: wss: http://localhost:* https://*.firebaseio.com https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://firebaseinstallations.googleapis.com https://content-firebaseappcheck.googleapis.com https://api.openweathermap.org https://api.open-meteo.com https://generativelanguage.googleapis.com https://*.sentry.io",
        "frame-src https://*.firebaseapp.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "worker-src 'self' blob:",
        "manifest-src 'self'"
      ].join('; ')
    }
  },
  build: {
    sourcemap: shouldUploadSourcemaps,
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React framework + Recharts (must load together)
          // FIX: Recharts needs React, so bundle together to prevent
          // "Cannot read properties of undefined (reading 'forwardRef')" error
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'vendor';
          }
          if (id.includes('recharts') || id.includes('d3')) {
            return 'vendor';  // Bundle with React to ensure correct load order
          }

          // Firebase SDK (large, but often used)
          if (id.includes('firebase')) {
            return 'firebase';
          }

          // AI library (very heavy, lazy-loaded)
          if (id.includes('@google/generative-ai')) {
            return 'ai';
          }

          // Sentry monitoring (can be deferred)
          if (id.includes('@sentry')) {
            return 'monitoring';
          }

          // Animation library
          if (id.includes('framer-motion')) {
            return 'animation';
          }

          // Date utilities
          if (id.includes('date-fns')) {
            return 'utils';
          }

          // Icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }

          // State management
          if (id.includes('zustand')) {
            return 'state';
          }
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/${chunkInfo.name}-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').pop() || 'asset';
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name || '')) {
            return 'assets/img/[name]-[hash][extname]';
          }
          if (/\.(woff2?|ttf|otf|eot)$/i.test(assetInfo.name || '')) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          if (/\.css$/i.test(assetInfo.name || '')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[ext]/[name]-[hash][extname]';
        },
      },
      // Optimize bundle size
      treeshake: {
        preset: 'recommended',
        propertyReadSideEffects: false,
      },
    },
    // Reduce chunk size warning limit
    chunkSizeWarningLimit: 200,
    // Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets < 4KB
  },
});
