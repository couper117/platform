/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Typed environment variables exposed to the app via `import.meta.env`.
// Keep in sync with the VITE_* keys in apps/frontend/.env.
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_PUSHER_KEY: string;
  readonly VITE_PUSHER_CLUSTER: string;
  readonly VITE_DEMO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Injected by vite.config.js at build time — the commit the running bundle was
 * built from, and when. Declared so TypeScript knows they exist; they are
 * replaced literally, so there is nothing to import.
 */
declare const __BUILD_SHA__: string;
declare const __BUILD_AT__: string;
