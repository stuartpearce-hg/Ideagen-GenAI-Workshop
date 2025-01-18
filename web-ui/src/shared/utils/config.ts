export const getConfig = () => ({
  OPENAI_API_BASE: import.meta.env.VITE_OPENAI_API_BASE,
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
  OPENAI_API_TYPE: import.meta.env.VITE_OPENAI_API_TYPE,
  OPENAI_API_VERSION: import.meta.env.VITE_OPENAI_API_VERSION,
  OPENAI_API_DEPLOYMENT_NAME: import.meta.env.VITE_OPENAI_API_DEPLOYMENT_NAME,
  OPENAI_API_EMBEDDINGS_NAME: import.meta.env.VITE_OPENAI_API_EMBEDDINGS_NAME,
  REPOSITORY_DIRECTORY: import.meta.env.VITE_REPOSITORY_DIRECTORY,
});
