import React, { useState } from 'react';
import { StyleSheet,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ChatThread } from '../serve/chat';
import ChatList from './ChatList';
import ChatDetail from './ChatDetail';
import UnderbossBar from '../header/underbossbar';
import { useTheme } from '../common/theme';

/**
 * Main Chat Screen - shows chat list or detail view
 */
export default function ChatScreen() {
  const { colors } = useTheme();
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);

  const handleSelectThread = (thread: ChatThread) => {
    if (!thread?.id) {
      console.warn('Attempted to select thread without ID');
      return;
    }
    setSelectedThread(thread);
  };

  const handleBack = () => {
    setSelectedThread(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <UnderbossBar />
      <View style={{ flex: 1 }}>
      {selectedThread ? (
        <ChatDetail thread={selectedThread} onBack={handleBack} />
      ) : (
        <ChatList onSelectThread={handleSelectThread} />
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
});
