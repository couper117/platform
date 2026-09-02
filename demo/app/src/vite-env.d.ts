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
