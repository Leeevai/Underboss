import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { useSortedChats } from '../cache/chats';
import { getMediaUrl } from '../serve';
import type { ChatThread } from '../serve/chat';
import { useTheme, BRAND } from '../common/theme';
import { useRefreshOnFocus } from '../common/useRefreshOnFocus';

interface ChatListProps {
  onSelectThread: (thread: ChatThread) => void;
}

// Separator component for FlatList
const ItemSeparator = ({ colors }: { colors: any }) => (
  <View style={[separatorStyle.separator, { backgroundColor: colors.border }]} />
);
const separatorStyle = StyleSheet.create({
  separator: { height: 1, marginLeft: 80 },
});

export default function ChatList({ onSelectThread }: ChatListProps) {
  const { colors, isDark } = useTheme();
  const { threads, loading, error, totalUnread, refresh } = useSortedChats();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  console.log('[ChatList] Render - threads:', threads.length, 'loading:', loading, 'error:', error);

  // Memoized separator to avoid creating component inline during render
  const renderItemSeparator = useCallback(
    () => <ItemSeparator colors={colors} />,
    [colors]
  );

  // Fetch threads on mount
  useEffect(() => {
    console.log('[ChatList] Mounted, calling refresh(true)...');
    refresh(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh when screen comes into focus (e.g., tab switch, back navigation)
  useRefreshOnFocus(() => refresh(true), { skipFirstFocus: true });

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh(true);
    setRefreshing(false);
  };

  // Filter threads by search
  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    // Search in PAPS title
    if (thread.paps_title?.toLowerCase().includes(query)) return true;
    
    // Search in participant names
    const participantMatch = thread.participants.some(
      (p) => p.username.toLowerCase().includes(query)
    );
    if (participantMatch) return true;
    
    // Search in last message
    if (thread.last_message?.content.toLowerCase().includes(query)) return true;
    
    return false;
  });

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get thread type label and icon
  const getThreadTypeInfo = (type: string) => {
    switch (type) {
      case 'spap_discussion':
        return { label: 'Application', icon: '📝', color: '#5A67D8' };
      case 'asap_discussion':
        return { label: 'Assignment', icon: '📋', color: '#38A169' };
      case 'group_chat':
        return { label: 'Group', icon: '👥', color: '#DD6B20' };
      default:
        return { label: 'Chat', icon: '💬', color: '#718096' };
    }
  };

  // Render chat thread item
  const renderThread = ({ item }: { item: ChatThread }) => {
    // Skip threads without ID
    if (!item?.id) return null;
    
    const typeInfo = getThreadTypeInfo(item.thread_type);
    const hasUnread = item.unread_count > 0;
    
    // Use other_username and other_avatar_url from backend (the other participant)
    const otherUsername = (item as any).other_username;
    const otherAvatarUrl = (item as any).other_avatar_url;
    
    return (
      <TouchableOpacity
        style={[
          styles.threadItem, 
          { backgroundColor: colors.card },
          hasUnread && { backgroundColor: isDark ? colors.backgroundSecondary : '#F0F4FF' }
        ]}
        onPress={() => onSelectThread(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {otherAvatarUrl ? (
            <Image
              source={{ uri: getMediaUrl(otherAvatarUrl)! }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: typeInfo.color }]}>
              <Text style={styles.avatarPlaceholderText}>
                {otherUsername?.[0]?.toUpperCase() || typeInfo.icon}
              </Text>
            </View>
          )}
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unread_count > 99 ? '99+' : item.unread_count}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.threadContent}>
          {/* Header row */}
          <View style={styles.threadHeader}>
            <View style={styles.threadTitleContainer}>
              <Text style={[styles.threadTitle, { color: colors.text }, hasUnread && styles.textBold]} numberOfLines={1}>
                {item.paps_title || otherUsername || 'Chat'}
              </Text>
              <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '20' }]}>
                <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                  {typeInfo.icon} {typeInfo.label}
                </Text>
              </View>
            </View>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {item.last_message ? formatRelativeTime(item.last_message.sent_at) : ''}
            </Text>
          </View>

          {/* Last message */}
          {item.last_message && (
            <Text 
              style={[styles.lastMessage, { color: colors.textSecondary }, hasUnread && styles.textBold]} 
              numberOfLines={2}
            >
              {item.last_message.sender_username}: {item.last_message.content}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && threads.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
        {totalUnread > 0 && (
          <View style={[styles.totalUnreadBadge, { backgroundColor: colors.error }]}>
            <Text style={styles.totalUnreadText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.inputBg, color: colors.inputText }]}
          placeholder="🔍 Search conversations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.inputPlaceholder}
        />
      </View>

      {/* Error state */}
      {error && threads.length === 0 ? (
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={() => refresh(true)}>
            <Text style={[styles.retryText, { color: BRAND.primary }]}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredThreads.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No conversations yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {searchQuery 
              ? 'No matches found for your search' 
              : 'Chat threads will appear here when you apply to jobs or receive applications'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredThreads.filter(t => t?.id)}
          keyExtractor={(item, index) => item.id || `thread-${index}`}
          renderItem={renderThread}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={BRAND.primary}
              colors={[BRAND.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={renderItemSeparator}
        />
      )}
    </View>
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
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#718096',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D3748',
  },
  totalUnreadBadge: {
    marginLeft: 12,
    backgroundColor: '#E53E3E',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  totalUnreadText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInput: {
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#2D3748',
  },
  listContent: {
    paddingBottom: 32,
  },
  threadItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  threadItemUnread: {
    backgroundColor: '#EBF4FF',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E53E3E',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  threadContent: {
    flex: 1,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  threadTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    flexShrink: 1,
  },
  textBold: {
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 8,
  },
  participantsText: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 16,
    marginBottom: 12,
  },
  retryText: {
    color: '#5A67D8',
    fontWeight: '700',
    fontSize: 14,
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
    lineHeight: 20,
  },
});
