import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest reuses the Vite pipeline (JSX, path resolution) so component tests run
// against the same transforms as the app. jsdom gives leaf components a DOM to
// render into without a browser.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
