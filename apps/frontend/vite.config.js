import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * WHICH COMMIT IS ACTUALLY DEPLOYED.
 *
 * "I pushed and the site has not changed" is unanswerable without this, and it
 * cost a whole evening: nobody could tell a stale deployment from a stale
 * browser cache from a build that never ran, because the running app carried no
 * mark of where it came from. Now it does, in the HTML itself, so `view-source`
 * or one console line settles it in seconds.
 *
 * Vercel sets VERCEL_GIT_COMMIT_SHA during a build. Locally there is no such
 * variable, so it falls back to asking git, and to 'unknown' where even that
 * fails (a tarball, a container without git) — never to a fabricated value.
 */
const buildSha = () => {
  const fromCi = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
  if (fromCi) return String(fromCi).slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim();
  } catch {
    return 'unknown';
  }
};

const BUILD = { sha: buildSha(), at: new Date().toISOString() };

/** Stamps the build into the served HTML, where it survives any JS failure. */
const buildStamp = () => ({
  name: 'rwasport-build-stamp',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { name: 'app-build', content: `${BUILD.sha} ${BUILD.at}` }, injectTo: 'head' },
  ],
});

export default defineConfig({
  define: {
    __BUILD_SHA__: JSON.stringify(BUILD.sha),
    __BUILD_AT__: JSON.stringify(BUILD.at),
  },
  plugins: [
    react(),
    buildStamp(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'RwaSport — Rwanda National Sports Platform',
        short_name: 'RwaSport',
        description: 'The official digital home for Rwandan Sports.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111120',
        theme_color: '#E8002D',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: '/index.html',
        // Never let the shell fallback swallow API or upload requests.
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        // Deliberately no runtimeCaching for /api: live scores and standings
        // must never be served from a stale cache.
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    // 5174 is this project's port. `strictPort` makes a clash FAIL rather than
    // silently moving to the next free port — a dev server quietly landing on a
    // different port than the one you opened is how you end up staring at a stale
    // tab wondering why a change did not appear.
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
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