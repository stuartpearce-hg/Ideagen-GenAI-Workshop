import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { Stack } from '@fluentui/react';
import { Text } from '@fluentui/react-components';
import { RepositoryManager } from './components/RepositoryManager';
import { ChatInterface } from './components/ChatInterface';
import { useState } from 'react';


function App() {
  const [selectedRepo, setSelectedRepo] = useState('');

  return (
    <FluentProvider theme={webLightTheme}>
      <Stack styles={{
        root: {
          padding: 16,
          maxWidth: 1280,
          margin: '0 auto'
        }
      }}>
        <Stack tokens={{ childrenGap: 16 }}>
          <Text size={800} weight="semibold">Code Repository Chat</Text>
          <RepositoryManager onSelectRepo={setSelectedRepo} />
          {selectedRepo && <ChatInterface selectedRepo={selectedRepo} />}
        </Stack>
      </Stack>
    </FluentProvider>
  );
}

export default App
