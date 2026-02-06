import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatMessages, useChats } from '../cache/chats';
import { getMediaUrl, getCurrentUser } from '../serve';
import type { ChatThread, ChatMessage } from '../serve/chat';
import ChatBubble from './ChatBubble';

interface ChatDetailProps {
  thread: ChatThread;
  onBack: () => void;
}

export default function ChatDetail({ thread, onBack }: ChatDetailProps) {
  const { messages, loading, fetchMessages, sendMessage, editMessage } = useChatMessages(thread.id);
  const { markThreadRead } = useChats();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.userId;

  // Fetch messages on mount
  useEffect(() => {
    fetchMessages();
    
    // Mark thread as read
    if (thread.unread_count > 0) {
      markThreadRead(thread.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Send or edit message
  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    setSending(true);
    try {
      if (editingMessage) {
        await editMessage(editingMessage.id, inputText.trim());
        setEditingMessage(null);
      } else {
        await sendMessage(inputText.trim());
      }
      setInputText('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle long press on message (for editing)
  const handleMessageLongPress = (message: ChatMessage) => {
    if (message.sender_id === currentUserId && !message.is_system_message) {
      Alert.alert(
        'Message Options',
        '',
        [
          {
            text: 'Edit',
            onPress: () => {
              setEditingMessage(message);
              setInputText(message.content);
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingMessage(null);
    setInputText('');
  };

  // Get display title
  const getDisplayTitle = () => {
    if (thread.paps_title) return thread.paps_title;
    const otherParticipants = thread.participants.filter((p) => p.user_id !== currentUserId);
    if (otherParticipants.length > 0) {
      return otherParticipants.map((p) => p.username).join(', ');
    }
    return 'Chat';
  };

  // Get thread type info
  const getThreadTypeInfo = () => {
    switch (thread.thread_type) {
      case 'spap_discussion':
        return { label: 'Application Chat', color: '#5A67D8' };
      case 'asap_discussion':
        return { label: 'Assignment Chat', color: '#38A169' };
      case 'group_chat':
        return { label: 'Group Chat', color: '#DD6B20' };
      default:
        return { label: 'Chat', color: '#718096' };
    }
  };

  // Group messages by date
  const groupMessagesByDate = useCallback((msgs: ChatMessage[]) => {
    const grouped: (ChatMessage | { type: 'date'; date: string })[] = [];
    let currentDate = '';

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.sent_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      if (msgDate !== currentDate) {
        currentDate = msgDate;
        grouped.push({ type: 'date', date: msgDate });
      }
      grouped.push(msg);
    });

    return grouped;
  }, []);

  const groupedMessages = groupMessagesByDate(messages);
  const typeInfo = getThreadTypeInfo();

  // Render item (message or date separator)
  const renderItem = ({ item, index }: { item: ChatMessage | { type: 'date'; date: string }; index: number }) => {
    if ('type' in item && item.type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <View style={styles.dateLine} />
          <Text style={styles.dateText}>{item.date}</Text>
          <View style={styles.dateLine} />
        </View>
      );
    }

    const message = item as ChatMessage;
    const isCurrentUser = message.sender_id === currentUserId;
    
    // Check if we should show avatar (first message from this sender in a group)
    const prevItem = index > 0 ? groupedMessages[index - 1] : null;
    const showAvatar = !prevItem || 
      'type' in prevItem || 
      (prevItem as ChatMessage).sender_id !== message.sender_id;

    return (
      <ChatBubble
        message={message}
        isCurrentUser={isCurrentUser}
        showAvatar={showAvatar}
        onLongPress={handleMessageLongPress}
      />
    );
  };

  // Loading state
  if (loading && messages.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getDisplayTitle()}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5A67D8" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {getDisplayTitle()}
          </Text>
          <View style={[styles.threadTypeBadge, { backgroundColor: typeInfo.color + '20' }]}>
            <Text style={[styles.threadTypeText, { color: typeInfo.color }]}>
              {typeInfo.label}
            </Text>
          </View>
        </View>

        {/* Participants preview */}
        <View style={styles.participantsPreview}>
          {thread.participants.slice(0, 3).map((p, i) => (
            <View 
              key={p.user_id} 
              style={[styles.participantAvatar, i > 0 && styles.participantAvatarStacked]}
            >
              {p.avatar_url ? (
                <Image
                  source={{ uri: getMediaUrl(p.avatar_url)! }}
                  style={styles.participantAvatarImage}
                />
              ) : (
                <View style={styles.participantAvatarPlaceholder}>
                  <Text style={styles.participantAvatarText}>
                    {p.username[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>Send a message to start the conversation</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={groupedMessages}
            keyExtractor={(item, index) => 
              'type' in item ? `date-${index}` : item.id
            }
            renderItem={renderItem}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            inverted={false}
          />
        )}

        {/* Edit indicator */}
        {editingMessage && (
          <View style={styles.editIndicator}>
            <Text style={styles.editIndicatorText}>
              ✏️ Editing message...
            </Text>
            <TouchableOpacity onPress={cancelEdit}>
              <Text style={styles.cancelEditText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={5000}
            placeholderTextColor="#A0AEC0"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>
                {editingMessage ? '✓' : '↑'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 22,
    color: '#2D3748',
  },
  headerSpacer: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D3748',
  },
  threadTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  threadTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  participantsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  participantAvatarStacked: {
    marginLeft: -8,
  },
  participantAvatarImage: {
    width: '100%',
    height: '100%',
  },
  participantAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#5A67D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantAvatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  keyboardAvoid: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 16,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dateText: {
    fontSize: 12,
    color: '#718096',
    marginHorizontal: 12,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  editIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EBF4FF',
    borderTopWidth: 1,
    borderTopColor: '#BEE3F8',
  },
  editIndicatorText: {
    fontSize: 13,
    color: '#2B6CB0',
  },
  cancelEditText: {
    fontSize: 13,
    color: '#E53E3E',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#EDF2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 12,
    fontSize: 15,
    color: '#2D3748',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5A67D8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  sendButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
});
