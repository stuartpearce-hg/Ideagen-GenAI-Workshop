import { Repository, ChatMessage } from '../types';

export const indexRepository = async (file: File, name: string): Promise<Repository> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);

  const response = await fetch('http://localhost:8000/api/repositories', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to index repository');
  }

  return response.json();
};

export const queryRepository = async (message: string, repositoryName: string): Promise<ChatMessage> => {
  const response = await fetch('http://localhost:8000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      repository_name: repositoryName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get response');
  }

  return response.json();
};

export const getRepositories = async (): Promise<Repository[]> => {
  const response = await fetch('http://localhost:8000/api/repositories');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch repositories');
  }

  return response.json();
};
