/**
 * PapsFeed - Home page with multiple PAPS sections
 * 
 * Displays job postings in organized horizontal scrollable sections:
 * - Featured Jobs
 * - Newest Paps
 * - Near You (location-based)
 * - You Might Like (recommendations)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Paps } from '../serve/paps';
import PapsPost from './PapsPost';
import UnderbossBar from '../header/underbossbar';
import {
  useFeaturedPaps,
  useNewestPaps,
  useNearbyPaps,
  useRecommendedPaps,
} from '../cache/paps';
import { useTheme, BRAND, createShadow } from '../common/theme';


// =============================================================================
// TYPES
// =============================================================================

// =============================================================================
// SECTION HEADER COMPONENT
// =============================================================================

function SectionHeader({
  title,
  subtitle,
  icon,
  onSeeAll,
  count,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  onSeeAll?: () => void;
  count?: number;
}) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>}
        </View>
      </View>
      {onSeeAll && (
        <TouchableOpacity style={styles.seeAllBtn} onPress={onSeeAll}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          {count !== undefined && (
            <View style={[styles.countBadge, { backgroundColor: colors.backgroundTertiary }]}>
              <Text style={[styles.countBadgeText, { color: colors.primary }]}>{count}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

// =============================================================================
// HORIZONTAL PAPS LIST COMPONENT
// =============================================================================

function HorizontalPapsList({
  paps,
  variant,
  loading,
  error,
  onRetry,
  emptyMessage = 'No jobs available',
}: {
  paps: Paps[];
  variant: 'compact' | 'standard' | 'featured';
  loading: boolean;
  error?: string;
  onRetry?: () => void;
  emptyMessage?: string;
}) {
  const { colors, isDark } = useTheme();
  
  if (loading) {
    return (
      <View style={styles.listLoading}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.listError}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        {onRetry && (
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.errorLight }]} onPress={onRetry}>
            <Text style={[styles.retryBtnText, { color: colors.error }]}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (paps.length === 0) {
    return (
      <View style={[styles.listEmpty, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={paps}
      keyExtractor={(item, index) => item?.id?.toString() || `pap-${index}`}
      renderItem={({ item }) => <PapsPost pap={item} variant={variant} />}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      snapToAlignment="start"
      decelerationRate="fast"
    />
  );
}

// =============================================================================
// QUICK CATEGORY FILTERS
// =============================================================================

const QUICK_CATEGORIES = [
  { id: 'all', label: 'All', icon: '🔥' },
  { id: 'nearby', label: 'Nearby', icon: '📍' },
  { id: 'urgent', label: 'Urgent', icon: '⚡' },
  { id: 'high-pay', label: 'High Pay', icon: '💰' },
  { id: 'remote', label: 'Remote', icon: '🏠' },
];

function QuickFilters({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const { colors, isDark } = useTheme();
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filtersContainer}
      contentContainerStyle={styles.filtersContent}
    >
      {QUICK_CATEGORIES.map((cat) => {
        const isActive = selected === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.filterChip,
              { backgroundColor: colors.card, borderColor: colors.borderLight },
              isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => onSelect(cat.id)}
          >
            <Text style={styles.filterIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.filterLabel,
                { color: colors.textSecondary },
                isActive && { color: colors.textInverse },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// =============================================================================
// MAIN FEED COMPONENT
// =============================================================================

export default function PapsFeed() {
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Use cached data from Jotai atoms
  const { paps: featuredPaps, loading: featuredLoading, error: featuredError, refresh: refreshFeatured } = useFeaturedPaps();
  const { paps: newestPaps, loading: newestLoading, error: newestError, refresh: refreshNewest } = useNewestPaps();
  const { paps: nearbyPaps, loading: nearbyLoading, error: nearbyError, refresh: refreshNearby } = useNearbyPaps();
  const { paps: recommendedPaps, loading: recommendedLoading, error: recommendedError, refresh: refreshRecommended } = useRecommendedPaps();

  // ========================================================================
  // DATA FETCHING - handled by cache, just need refresh
  // ========================================================================

  // Pull to refresh - triggers a single fetch that updates all derived atoms
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshFeatured(); // This refreshes the base atom, all derived atoms update automatically
    setRefreshing(false);
  }, [refreshFeatured]);

  // ========================================================================
  // SEARCH HANDLER
  // ========================================================================

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    // TODO: Navigate to search results page
    console.log('Searching for:', searchQuery);
  }, [searchQuery]);

  // ========================================================================
  // CHECK IF ALL LOADING
  // ========================================================================

  const isInitialLoading = 
    featuredLoading && newestLoading && nearbyLoading && recommendedLoading &&
    featuredPaps.length === 0 && newestPaps.length === 0;

  // ========================================================================
  // RENDER
  // ========================================================================

  if (isInitialLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <UnderbossBar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND.primary} />
          <Text style={[styles.loadingMainText, { color: colors.textSecondary }]}>Loading Jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <UnderbossBar />

      {/* Main Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BRAND.primary}
            colors={[BRAND.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrapper, { backgroundColor: colors.card, borderColor: colors.border }, createShadow(2, isDark)]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search for jobs..."
              placeholderTextColor={colors.inputPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => setSearchQuery('')}
              >
                <Text style={[styles.clearBtnText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Filters */}
        <QuickFilters selected={activeFilter} onSelect={setActiveFilter} />

        {/* Featured Jobs Section */}
        <View style={styles.section}>
          <SectionHeader
            title="Featured Jobs"
            subtitle="Top opportunities"
            icon="⭐"
            onSeeAll={() => console.log('See all featured')}
            count={featuredPaps.length}
          />
          <HorizontalPapsList
            paps={featuredPaps}
            variant="featured"
            loading={featuredLoading}
            error={featuredError || undefined}
            onRetry={refreshFeatured}
            emptyMessage="No featured jobs available"
          />
        </View>

        {/* Newest Paps Section */}
        <View style={styles.section}>
          <SectionHeader
            title="Newest Paps"
            subtitle="Just posted"
            icon="🆕"
            onSeeAll={() => console.log('See all newest')}
            count={newestPaps.length}
          />
          <HorizontalPapsList
            paps={newestPaps}
            variant="standard"
            loading={newestLoading}
            error={newestError || undefined}
            onRetry={refreshNewest}
            emptyMessage="No new jobs posted yet"
          />
        </View>

        {/* Near You Section */}
        <View style={styles.section}>
          <SectionHeader
            title="Near You"
            subtitle="Jobs in your area"
            icon="📍"
            onSeeAll={() => console.log('See all nearby')}
            count={nearbyPaps.length}
          />
          <HorizontalPapsList
            paps={nearbyPaps}
            variant="standard"
            loading={nearbyLoading}
            error={nearbyError || undefined}
            onRetry={refreshNearby}
            emptyMessage="No jobs found nearby"
          />
        </View>

        {/* Recommended Section */}
        <View style={styles.section}>
          <SectionHeader
            title="You Might Like"
            subtitle="Based on your interests"
            icon="💡"
            onSeeAll={() => console.log('See all recommended')}
            count={recommendedPaps.length}
          />
          <HorizontalPapsList
            paps={recommendedPaps}
            variant="compact"
            loading={recommendedLoading}
            error={recommendedError || undefined}
            onRetry={refreshRecommended}
            emptyMessage="No recommendations yet"
          />
        </View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingMainText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 8,
    elevation: 2,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 8,
  },
  clearBtnText: {
    fontSize: 14,
  },

  // Quick Filters
  filtersContainer: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginHorizontal: 4,
    elevation: 1,
    borderWidth: 1,
  },
  filterIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    fontSize: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // List states
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  listLoading: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },
  listError: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listEmpty: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
});
