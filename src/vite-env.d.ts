/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SEED_MOCK_DATA: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
