import React, { useState } from 'react';
import { Box, Button, Input, VStack, Text } from '@chakra-ui/react';
import { useToast } from '@chakra-ui/toast';

import { InputGroup, InputRightElement } from '@chakra-ui/input';
import { ChatMessage } from '../shared/types';
import { queryRepository } from '../shared/api';

interface ChatInterfaceProps {
  selectedRepo: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedRepo }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const toast = useToast();

  const handleSend = async () => {
    if (!input.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter a message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!input.trim() || !selectedRepo) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await queryRepository(input, selectedRepo);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get response',
        status: 'error',
      });
    }
  };

  return (
    <VStack spacing={4} width="100%" height="100%" p={4}>
      <Box
        flex={1}
        w="full"
        overflowY="auto"
        borderRadius="md"
        bg="gray.50"
        p={4}
      >
        {messages.map((message, index) => (
          <Box
            key={index}
            bg={message.role === 'user' ? 'blue.100' : 'white'}
            p={2}
            borderRadius="md"
            mb={2}
          >
            <Text>{message.content}</Text>
          </Box>
        ))}
      </Box>

      <InputGroup size="md">
        <Input
          pr="4.5rem"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <InputRightElement width="4.5rem">
          <Button h="1.75rem" size="sm" onClick={handleSend}>
            Send
          </Button>
        </InputRightElement>
      </InputGroup>
    </VStack>
  );
};
