import { Repository, ChatMessage } from '../types';

export const indexRepository = async (file: File, name: string): Promise<Repository> => {
  // TODO: Implement API call to build.py
  // For now, we'll read the file content and simulate indexing
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const timestamp = new Date().toISOString();
      resolve({ name, path: file.name, timestamp });
    };
    reader.readAsText(file);
  });
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
