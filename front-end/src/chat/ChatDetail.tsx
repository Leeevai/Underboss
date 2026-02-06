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
import { useTheme, BRAND } from '../common/theme';

interface ChatDetailProps {
  thread: ChatThread;
  onBack: () => void;
}

export default function ChatDetail({ thread, onBack }: ChatDetailProps) {
  const { colors, isDark } = useTheme();
  const threadId = thread?.id || '';
  const { messages, loading, fetchMessages, sendMessage, editMessage } = useChatMessages(threadId);
  const { markThreadRead } = useChats();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.userId;

  // Group messages by date (must be before early return)
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

  // Fetch messages on mount
  useEffect(() => {
    if (!threadId) return;
    fetchMessages();
    if (thread?.unread_count && thread.unread_count > 0) {
      markThreadRead(threadId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Early return if no valid thread (after ALL hooks)
  if (!thread?.id) {
    return (
      <SafeAreaView style={[styles.emptyContainer, { backgroundColor: colors.background }]} edges={['top']}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No chat selected</Text>
        <TouchableOpacity onPress={onBack} style={styles.goBackButton}>
          <Text style={{ color: BRAND.primary }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
      Alert.alert('Message Options', '', [
        {
          text: 'Edit',
          onPress: () => {
            setEditingMessage(message);
            setInputText(message.content);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingMessage(null);
    setInputText('');
  };

  // Get display title
  const participants = thread.participants || [];
  const getDisplayTitle = () => {
    if (thread.paps_title) return thread.paps_title;
    const otherParticipants = participants.filter((p) => p.user_id !== currentUserId);
    if (otherParticipants.length > 0) {
      return otherParticipants.map((p) => p.username).join(', ');
    }
    return 'Chat';
  };

  // Get thread type info
  const getThreadTypeInfo = () => {
    switch (thread.thread_type) {
      case 'spap_discussion':
        return { label: 'Application Chat', color: BRAND.primary };
      case 'asap_discussion':
        return { label: 'Assignment Chat', color: BRAND.accent };
      case 'group_chat':
        return { label: 'Group Chat', color: BRAND.warning };
      default:
        return { label: 'Chat', color: colors.textMuted };
    }
  };

  const groupedMessages = groupMessagesByDate(messages);
  const typeInfo = getThreadTypeInfo();

  // Render item (message or date separator)
  const renderItem = ({ item, index }: { item: ChatMessage | { type: 'date'; date: string }; index: number }) => {
    if ('type' in item && item.type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>{item.date}</Text>
          <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
        </View>
      );
    }

    const message = item as ChatMessage;
    const isCurrentUser = message.sender_id === currentUserId;
    const prevItem = index > 0 ? groupedMessages[index - 1] : null;
    const showAvatar = !prevItem || 'type' in prevItem || (prevItem as ChatMessage).sender_id !== message.sender_id;

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={[styles.backButtonText, { color: BRAND.primary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{getDisplayTitle()}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={BRAND.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backButtonText, { color: BRAND.primary }]}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
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
          {participants.slice(0, 3).map((p, i) => (
            <View key={p.user_id} style={[styles.participantAvatar, i > 0 && styles.participantAvatarStacked]}>
              {p.avatar_url ? (
                <Image source={{ uri: getMediaUrl(p.avatar_url)! }} style={styles.participantAvatarImage} />
              ) : (
                <View style={[styles.participantAvatarPlaceholder, { backgroundColor: BRAND.primary }]}>
                  <Text style={styles.participantAvatarText}>{p.username[0].toUpperCase()}</Text>
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
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Send a message to start the conversation</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={groupedMessages}
            keyExtractor={(item, index) => ('type' in item ? `date-${index}` : item.id || `msg-${index}`)}
            renderItem={renderItem}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Edit indicator */}
        {editingMessage && (
          <View style={[styles.editIndicator, { backgroundColor: isDark ? colors.card : '#EBF4FF', borderTopColor: isDark ? colors.border : '#BEE3F8' }]}>
            <Text style={[styles.editIndicatorText, { color: BRAND.primary }]}>✏️ Editing message...</Text>
            <TouchableOpacity onPress={cancelEdit}>
              <Text style={[styles.cancelEditText, { color: BRAND.error }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={5000}
            placeholderTextColor={colors.inputPlaceholder}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: BRAND.primary }, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>{editingMessage ? '✓' : '↑'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: { fontSize: 22 },
  headerSpacer: { width: 40 },
  headerCenter: { flex: 1, marginHorizontal: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  threadTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  threadTypeText: { fontSize: 11, fontWeight: '600' },
  participantsPreview: { flexDirection: 'row', alignItems: 'center' },
  participantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  participantAvatarStacked: { marginLeft: -8 },
  participantAvatarImage: { width: '100%', height: '100%' },
  participantAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantAvatarText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  keyboardAvoid: { flex: 1 },
  messagesList: { paddingVertical: 16 },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  dateLine: { flex: 1, height: 1 },
  dateText: { fontSize: 12, marginHorizontal: 12, fontWeight: '500' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16 },
  goBackButton: { marginTop: 16, padding: 12 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  editIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  editIndicatorText: { fontSize: 13 },
  cancelEditText: { fontSize: 13, fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { fontSize: 18, color: '#fff', fontWeight: '600' },
});
