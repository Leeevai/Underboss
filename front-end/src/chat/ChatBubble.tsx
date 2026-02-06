import React, { memo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { getMediaUrl } from '../serve';
import type { ChatMessage } from '../serve/chat';
import { useTheme, BRAND } from '../common/theme';

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
  const { colors, isDark } = useTheme();

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // System message
  if (message.is_system_message || message.message_type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <View style={[styles.systemLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.systemText, { color: colors.textMuted }]}>{message.content}</Text>
        <View style={[styles.systemLine, { backgroundColor: colors.border }]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isCurrentUser ? styles.containerRight : styles.containerLeft]}>
      {/* Avatar */}
      {!isCurrentUser && showAvatar && (
        <View style={styles.avatarWrap}>
          {message.sender_avatar ? (
            <Image
              source={{ uri: getMediaUrl(message.sender_avatar)! }}
              style={[styles.avatar, { backgroundColor: colors.border }]}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: BRAND.primary }]}>
              <Text style={styles.avatarText}>
                {message.sender_username?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
      )}
      {!isCurrentUser && !showAvatar && <View style={styles.avatarSpacer} />}

      {/* Bubble */}
      <View style={styles.bubbleWrap}>
        {!isCurrentUser && showAvatar && (
          <Text style={[styles.senderName, { color: colors.textMuted }]}>{message.sender_username}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.bubble,
            isCurrentUser
              ? { backgroundColor: BRAND.primary, borderBottomRightRadius: 4 }
              : { backgroundColor: isDark ? colors.backgroundTertiary : '#EDF2F7', borderBottomLeftRadius: 4 },
          ]}
          onLongPress={() => onLongPress?.(message)}
          activeOpacity={0.8}
          delayLongPress={300}
        >
          <Text style={[styles.messageText, { color: isCurrentUser ? '#fff' : colors.text }]}>
            {message.content}
          </Text>
          {message.edited_at && (
            <Text style={[styles.editedText, { color: isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>
              (edited)
            </Text>
          )}
        </TouchableOpacity>

        {showTimestamp && (
          <View style={[styles.meta, isCurrentUser ? styles.metaRight : styles.metaLeft]}>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(message.sent_at)}</Text>
            {isCurrentUser && (message.read_by?.length ?? 0) > 1 && (
              <Text style={[styles.readStatus, { color: BRAND.primary }]}>✓✓</Text>
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
  containerLeft: { justifyContent: 'flex-start' },
  containerRight: { justifyContent: 'flex-end' },
  avatarWrap: { marginRight: 8, alignSelf: 'flex-end' },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  avatarSpacer: { width: 40 },
  bubbleWrap: { maxWidth: '75%' },
  senderName: { fontSize: 12, marginBottom: 2, marginLeft: 4 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  messageText: { fontSize: 15, lineHeight: 21 },
  editedText: { fontSize: 11, fontStyle: 'italic', marginTop: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  metaLeft: { justifyContent: 'flex-start', marginLeft: 4 },
  metaRight: { justifyContent: 'flex-end', marginRight: 4 },
  timeText: { fontSize: 11 },
  readStatus: { fontSize: 12, fontWeight: '600' },
  systemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  systemLine: { flex: 1, height: 1 },
  systemText: { fontSize: 12, marginHorizontal: 12, textAlign: 'center' },
});
