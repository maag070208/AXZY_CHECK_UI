/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_ENV: string;
}

interface Window {
  __BUILD_VERSION__?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
