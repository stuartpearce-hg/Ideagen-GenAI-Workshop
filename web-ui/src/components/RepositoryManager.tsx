import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Input, VStack, Text } from '@chakra-ui/react';
import { Select } from '@chakra-ui/select';
import { useToast } from '@chakra-ui/toast';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { Repository } from '../shared/types';
import { indexRepository } from '../shared/api';

interface RepositoryManagerProps {
  onSelectRepo: (repoName: string) => void;
}

export const RepositoryManager: React.FC<RepositoryManagerProps> = ({ onSelectRepo }) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [repoName, setRepoName] = useState('');
  const toast = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Validate file selection
    if (acceptedFiles.length === 0) {
      toast({
        title: 'No folder selected',
        description: 'Please select a folder to index',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!repoName.trim()) {
      toast({
        title: 'Repository name required',
        description: 'Please enter a name for the repository',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (acceptedFiles.length > 0 && repoName) {
      try {
        const repo = await indexRepository(acceptedFiles[0], repoName);
        setRepositories(prev => [...prev, repo]);
        toast({
          title: 'Repository indexed',
          description: `Successfully indexed ${repoName}`,
          status: 'success',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to index repository',
          status: 'error',
        });
      }
    }
  }, [repoName, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleRepoSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedRepo(value);
    onSelectRepo(value);
  };

  return (
    <VStack spacing={4} width="100%" p={4}>
      <Box
        {...getRootProps()}
        p={6}
        border="2px dashed"
        borderColor={isDragActive ? 'blue.500' : 'gray.200'}
        borderRadius="md"
        textAlign="center"
      >
        <input {...getInputProps()} />
        <Text>
          {isDragActive
            ? 'Drop the folder here'
            : 'Drag and drop a folder here, or click to select'}
        </Text>
      </Box>

      <FormControl>
        <FormLabel>Repository Name</FormLabel>
        <Input
          placeholder="Enter repository name"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
        />
      </FormControl>

      <Button
        colorScheme="blue"
        isDisabled={!repoName}
        onClick={() => {
          document.querySelector('input[type="file"]')?.click();
        }}
      >
        Index Repository
      </Button>

      <FormControl>
        <FormLabel>Select Repository</FormLabel>
        <Select
          placeholder="Choose a repository"
          value={selectedRepo}
          onChange={handleRepoSelect}
        >
        {repositories.map((repo) => (
          <option key={`${repo.name}-${repo.timestamp}`} value={repo.name}>
            {repo.name} ({new Date(repo.timestamp).toLocaleString()})
          </option>
        ))}
      </Select>
      </FormControl>
    </VStack>
  );
};
