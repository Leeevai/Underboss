/**
 * PapsListModal - Reusable modal for displaying a list of PAPS
 * 
 * Used for:
 * - "See All" section views
 * - Quick category filter results
 * - Search results
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Modal,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Paps } from '../serve/paps';
import { useTheme, BRAND } from '../common/theme';
import PapsPost from './PapsPost';

// =============================================================================
// TYPES
// =============================================================================

export type PapsListType = 
  | 'featured'
  | 'newest'
  | 'nearby'
  | 'recommended'
  | 'category'
  | 'search'
  | 'filter';

interface PapsListModalProps {
  visible: boolean;
  onClose: () => void;
  paps: Paps[];
  title: string;
  subtitle?: string;
  listType: PapsListType;
  loading?: boolean;
  emptyMessage?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function PapsListModal({
  visible,
  onClose,
  paps,
  title,
  subtitle,
  listType,
  loading = false,
  emptyMessage = 'No jobs found',
  showSearch = false,
  onSearch,
}: PapsListModalProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter paps based on search query (client-side for quick filter)
  const filteredPaps = useMemo(() => {
    if (!searchQuery.trim()) return paps;
    const query = searchQuery.toLowerCase();
    return paps.filter(
      (pap) =>
        pap.title?.toLowerCase().includes(query) ||
        pap.description?.toLowerCase().includes(query) ||
        pap.owner_username?.toLowerCase().includes(query) ||
        pap.location_address?.toLowerCase().includes(query)
    );
  }, [paps, searchQuery]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (onSearch) {
      onSearch(text);
    }
  }, [onSearch]);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  // Get icon for list type
  const getListIcon = () => {
    switch (listType) {
      case 'featured': return '⭐';
      case 'newest': return '🆕';
      case 'nearby': return '📍';
      case 'recommended': return '💡';
      case 'category': return '📁';
      case 'search': return '🔍';
      case 'filter': return '⚡';
      default: return '📋';
    }
  };

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{emptyMessage}</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
        Try adjusting your filters or check back later
      </Text>
    </View>
  );

  // Render loading state
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={BRAND.primary} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading jobs...</Text>
    </View>
  );

  // Render pap item
  const renderItem = useCallback(({ item }: { item: Paps }) => (
    <View style={styles.itemContainer}>
      <PapsPost pap={item} variant="standard" />
    </View>
  ), []);

  const keyExtractor = useCallback((item: Paps, index: number) => 
    item?.id?.toString() || `pap-${index}`, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        edges={['top']}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.backgroundTertiary }]}
              onPress={handleClose}
            >
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerIcon}>{getListIcon()}</Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
            </View>
            
            <View style={styles.headerRight}>
              <Text style={[styles.countBadge, { color: colors.primary }]}>
                {filteredPaps.length}
              </Text>
            </View>
          </View>
          
          {subtitle && (
            <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
          )}
          
          {/* Search Bar */}
          {showSearch && (
            <View style={[styles.searchContainer, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search in results..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Text style={[styles.clearIcon, { color: colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Content */}
        {loading ? (
          renderLoading()
        ) : filteredPaps.length === 0 ? (
          renderEmpty()
        ) : (
          <FlatList
            data={filteredPaps}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={5}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '400',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    minWidth: 36,
    alignItems: 'flex-end',
  },
  countBadge: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
  },
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  clearIcon: {
    fontSize: 14,
    padding: 4,
  },
  
  // List
  listContent: {
    padding: 12,
  },
  itemContainer: {
    marginBottom: 8,
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
