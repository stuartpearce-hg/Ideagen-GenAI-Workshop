import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Stack,
  PrimaryButton,
  TextField,
  Dropdown,
  IDropdownOption,
  Label,
  MessageBar,
  MessageBarType
} from '@fluentui/react';
import { Text } from '@fluentui/react-components';
import { Repository } from '../shared/types';
import { indexRepository } from '../shared/api';

interface RepositoryManagerProps {
  onSelectRepo: (repoName: string) => void;
}

export const RepositoryManager: React.FC<RepositoryManagerProps> = ({ onSelectRepo }) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [repoName, setRepoName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setSuccess(null);

    // Validate file selection
    if (acceptedFiles.length === 0) {
      setError('Please select a folder to index');
      return;
    }
    if (!repoName.trim()) {
      setError('Please enter a name for the repository');
      return;
    }

    if (acceptedFiles.length > 0 && repoName) {
      try {
        const repo = await indexRepository(acceptedFiles[0], repoName);
        setRepositories(prev => [...prev, repo]);
        setSuccess(`Successfully indexed ${repoName}`);
      } catch (error) {
        setError('Failed to index repository');
      }
    }
  }, [repoName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleRepoSelect = (_: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    if (option) {
      setSelectedRepo(option.key as string);
      onSelectRepo(option.key as string);
    }
  };

  return (
    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { width: '100%', padding: 16 } }}>
      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)} isMultiline={false}>
          {error}
        </MessageBar>
      )}
      {success && (
        <MessageBar messageBarType={MessageBarType.success} onDismiss={() => setSuccess(null)} isMultiline={false}>
          {success}
        </MessageBar>
      )}
      
      <Stack.Item>
        <div
          {...getRootProps()}
          style={{
            padding: '24px',
            border: `2px dashed ${isDragActive ? '#0078d4' : '#8a8886'}`,
            borderRadius: '4px',
            textAlign: 'center',
            cursor: 'pointer'
          }}
        >
          <input {...getInputProps()} />
          <Text>
            {isDragActive
              ? 'Drop the folder here'
              : 'Drag and drop a folder here, or click to select'}
          </Text>
        </div>
      </Stack.Item>

      <Stack.Item>
        <Label>Repository Name</Label>
        <TextField
          placeholder="Enter repository name"
          value={repoName}
          onChange={(_, newValue?: string) => setRepoName(newValue || '')}
        />
      </Stack.Item>

      <Stack.Item>
        <PrimaryButton
          disabled={!repoName}
          onClick={() => {
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput instanceof HTMLInputElement) {
              fileInput.click();
            }
          }}
        >
          Index Repository
        </PrimaryButton>
      </Stack.Item>

      <Stack.Item>
        <Label>Select Repository</Label>
        <Dropdown
          placeholder="Choose a repository"
          selectedKey={selectedRepo}
          onChange={handleRepoSelect}
          options={repositories.map((repo) => ({
            key: repo.name,
            text: `${repo.name} (${new Date(repo.timestamp).toLocaleString()})`
          }))}
        />
      </Stack.Item>
    </Stack>
  );
};
