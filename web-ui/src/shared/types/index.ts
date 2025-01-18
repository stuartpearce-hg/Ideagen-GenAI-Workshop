export interface Repository {
  name: string;
  timestamp: string;
  path: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface EnvironmentConfig {
  OPENAI_API_BASE: string;
  OPENAI_API_KEY: string;
  OPENAI_API_TYPE: string;
  OPENAI_API_VERSION: string;
  OPENAI_API_DEPLOYMENT_NAME: string;
  OPENAI_API_EMBEDDINGS_NAME: string;
  REPOSITORY_DIRECTORY: string;
}
