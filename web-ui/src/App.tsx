import { ChakraProvider, Container, VStack, Heading } from '@chakra-ui/react';
import { RepositoryManager } from './components/RepositoryManager';
import { ChatInterface } from './components/ChatInterface';
import { useState } from 'react';



function App() {
  const [selectedRepo, setSelectedRepo] = useState('');

  return (
    <ChakraProvider>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} width="100%">
          <Heading>Code Repository Chat</Heading>
          <RepositoryManager onSelectRepo={setSelectedRepo} />
          {selectedRepo && <ChatInterface selectedRepo={selectedRepo} />}
        </VStack>
      </Container>
    </ChakraProvider>
  );
}

export default App
