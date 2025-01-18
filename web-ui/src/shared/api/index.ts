import { Repository, ChatMessage } from '../types';

export const indexRepository = async (path: string, name: string): Promise<Repository> => {
  // TODO: Implement API call to build.py
  const timestamp = new Date().toISOString();
  return { name, path, timestamp };
};

export const queryRepository = async (message: string, repositoryName: string): Promise<ChatMessage> => {
  // TODO: Implement API call to query.py
  return {
    role: 'assistant',
    content: 'API integration pending'
  };
};

export const getRepositories = async (): Promise<Repository[]> => {
  // TODO: Implement API call to list indexed repositories
  return [];
};
