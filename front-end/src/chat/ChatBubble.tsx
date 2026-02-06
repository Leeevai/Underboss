import React, { memo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { getMediaUrl } from '../serve';
import type { ChatMessage } from '../serve/chat';

interface ChatBubbleProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onLongPress?: (message: ChatMessage) => void;
}

function ChatBubble({
  message,
  isCurrentUser,
  showAvatar = true,
  showTimestamp = true,
  onLongPress,
}: ChatBubbleProps) {
  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // System message style
  if (message.is_system_message || message.message_type === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        <View style={styles.systemMessageLine} />
        <Text style={styles.systemMessageText}>{message.content}</Text>
        <View style={styles.systemMessageLine} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        isCurrentUser ? styles.containerRight : styles.containerLeft,
      ]}
    >
      {/* Avatar (only for other users) */}
      {!isCurrentUser && showAvatar && (
        <View style={styles.avatarContainer}>
          {message.sender_avatar ? (
            <Image
              source={{ uri: getMediaUrl(message.sender_avatar)! }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {message.sender_username?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Spacer when avatar is hidden */}
      {!isCurrentUser && !showAvatar && <View style={styles.avatarSpacer} />}

      {/* Message content */}
      <View style={styles.bubbleWrapper}>
        {/* Sender name (for other users) */}
        {!isCurrentUser && showAvatar && (
          <Text style={styles.senderName}>{message.sender_username}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.bubble,
            isCurrentUser ? styles.bubbleRight : styles.bubbleLeft,
          ]}
          onLongPress={() => onLongPress?.(message)}
          activeOpacity={0.8}
          delayLongPress={300}
        >
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.messageTextRight : styles.messageTextLeft,
            ]}
          >
            {message.content}
          </Text>

          {/* Edited indicator */}
          {message.edited_at && (
            <Text
              style={[
                styles.editedText,
                isCurrentUser ? styles.editedTextRight : styles.editedTextLeft,
              ]}
            >
              (edited)
            </Text>
          )}
        </TouchableOpacity>

        {/* Timestamp and read status */}
        {showTimestamp && (
          <View
            style={[
              styles.metaContainer,
              isCurrentUser ? styles.metaRight : styles.metaLeft,
            ]}
          >
            <Text style={styles.timeText}>{formatTime(message.sent_at)}</Text>
            {isCurrentUser && message.read_by.length > 1 && (
              <Text style={styles.readStatus}>✓✓</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

export default memo(ChatBubble);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  containerLeft: {
    justifyContent: 'flex-start',
  },
  containerRight: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5A67D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  avatarSpacer: {
    width: 40,
  },
  bubbleWrapper: {
    maxWidth: '75%',
  },
  senderName: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleLeft: {
    backgroundColor: '#EDF2F7',
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: '#5A67D8',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageTextLeft: {
    color: '#2D3748',
  },
  messageTextRight: {
    color: '#fff',
  },
  editedText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  editedTextLeft: {
    color: '#718096',
  },
  editedTextRight: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  metaLeft: {
    justifyContent: 'flex-start',
    marginLeft: 4,
  },
  metaRight: {
    justifyContent: 'flex-end',
    marginRight: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#A0AEC0',
  },
  readStatus: {
    fontSize: 12,
    color: '#5A67D8',
    fontWeight: '600',
  },
  // System message
  systemMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  systemMessageLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  systemMessageText: {
    fontSize: 12,
    color: '#718096',
    marginHorizontal: 12,
    textAlign: 'center',
  },
});
