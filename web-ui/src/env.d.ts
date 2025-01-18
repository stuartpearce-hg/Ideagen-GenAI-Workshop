/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_BASE: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OPENAI_API_TYPE: string
  readonly VITE_OPENAI_API_VERSION: string
  readonly VITE_OPENAI_API_DEPLOYMENT_NAME: string
  readonly VITE_OPENAI_API_EMBEDDINGS_NAME: string
  readonly VITE_REPOSITORY_DIRECTORY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
