import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Relative asset URLs. The built demo has to run from wherever it is put — a
  // sub-path on a static host, a USB stick, or opened straight off disk — and an
  // absolute "/assets/..." resolves to the filesystem root under file://, which
  // is why the build previously showed a blank page when double-clicked.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'RwaSport — Rwanda National Sports Platform',
        short_name: 'RwaSport',
        description: 'The official digital home for Rwandan Sports.',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111120',
        theme_color: '#E8002D',
        icons: [
          { src: './pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: './pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: './pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: null,
        // Never let the shell fallback swallow API or upload requests.
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        // Deliberately no runtimeCaching for /api: live scores and standings
        // must never be served from a stale cache.
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  // The demo is a self-contained sandbox — its own dev port so it never clashes
  // with the real app (5173), and no backend proxy because it has no backend.
  server: {
    port: 4174,
  },
  build: {
    // Build straight into demo/dist, which serve.js serves.
    outDir: '../dist',
    emptyOutDir: true,
    target: 'esnext',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy, rarely-changing vendor code into cacheable chunks.
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
          'vendor-data': ['@tanstack/react-query', 'axios', 'zustand'],
        },
      },
    },
  },
});