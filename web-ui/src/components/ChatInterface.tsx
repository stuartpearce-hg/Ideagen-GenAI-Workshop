import React, { useState } from 'react';
import {
  Stack,
  PrimaryButton,
  TextField,
  MessageBar,
  MessageBarType
} from '@fluentui/react';
import { Text } from '@fluentui/react-components';
import { ChatMessage } from '../shared/types';
import { queryRepository } from '../shared/api';

interface ChatInterfaceProps {
  selectedRepo: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedRepo }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim()) {
      setError('Please enter a message');
      return;
    }
    if (!selectedRepo) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError(null);

    try {
      const response = await queryRepository(input, selectedRepo);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      setError('Failed to get response');
    }
  };

  return (
    <Stack styles={{
        root: {
          width: '100%',
          height: '100%',
          padding: 16,
          gap: 16
        }
      }}>
        {error && (
          <MessageBar
            messageBarType={MessageBarType.error}
            onDismiss={() => setError(null)}
            isMultiline={false}
          >
            {error}
          </MessageBar>
        )}
        <Stack.Item grow styles={{
          root: {
            overflowY: 'auto',
            backgroundColor: '#f5f5f5',
            padding: 16,
            borderRadius: 4
          }
        }}>
          {messages.map((message, index) => (
            <Stack key={index} styles={{
              root: {
                backgroundColor: message.role === 'user' ? '#e5f1ff' : 'white',
                padding: 8,
                borderRadius: 4,
                marginBottom: 8
              }
            }}>
              <Text>{message.content}</Text>
            </Stack>
          ))}
        </Stack.Item>

        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <Stack.Item grow>
            <TextField
              value={input}
              onChange={(_, newValue?: string) => setInput(newValue || '')}
              placeholder="Type your message..."
              onKeyDown={(ev: React.KeyboardEvent<HTMLInputElement>) => ev.key === 'Enter' && handleSend()}
            />
          </Stack.Item>
          <PrimaryButton onClick={handleSend}>
            Send
          </PrimaryButton>
        </Stack>
      </Stack>
  );
};
