import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { ChatThread } from '../serve/chat';
import ChatList from './ChatList';
import ChatDetail from './ChatDetail';

/**
 * Main Chat Screen - shows chat list or detail view
 */
export default function ChatScreen() {
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);

  const handleSelectThread = (thread: ChatThread) => {
    setSelectedThread(thread);
  };

  const handleBack = () => {
    setSelectedThread(null);
  };

  return (
    <View style={styles.container}>
      {selectedThread ? (
        <ChatDetail thread={selectedThread} onBack={handleBack} />
      ) : (
        <ChatList onSelectThread={handleSelectThread} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});
