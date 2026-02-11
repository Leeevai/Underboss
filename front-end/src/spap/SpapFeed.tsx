import React, { useEffect, useState, useCallback } from 'react'
import { View, FlatList, ActivityIndicator, Text, StyleSheet, RefreshControl, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRefreshOnFocus } from '../common/useRefreshOnFocus';
import { SpapStatus } from '../serve';
import { useSpaps, useReceivedSpaps } from '../cache';
import SpapPoster from './SpapPoster';
import ReceivedSpapCard from './ReceivedSpapCard';
import PapsApplicationsModal from './PapsApplicationsModal';
import UnderbossBar from '../header/underbossbar';
import { useTheme, BRAND, createShadow } from '../common/theme';

type MainTab = 'my-applications' | 'received';
type FilterTab = 'all' | SpapStatus;

export default function SpapFeed() {
  const { colors, isDark } = useTheme();
  
  // Main tab state
  const [mainTab, setMainTab] = useState<MainTab>('my-applications');
  
  // My applications state
  const { spaps, loading, error, fetchSpaps, removeSpap } = useSpaps();
  
  // Received applications state
  const { 
    spaps: receivedSpaps, 
    loading: receivedLoading, 
    error: receivedError, 
    fetchReceivedSpaps,
    acceptSpap,
    rejectSpap 
  } = useReceivedSpaps();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPapsId, setSelectedPapsId] = useState<string | null>(null);
  const [selectedPapsTitle, setSelectedPapsTitle] = useState('');

  // Fetch my applications on mount
  useEffect(() => {
    if (mainTab === 'my-applications' && spaps.length === 0 && !loading && !error) {
      fetchSpaps();
    }
  }, [mainTab, spaps.length, loading, error, fetchSpaps]);

  // Fetch received applications when switching to that tab
  useEffect(() => {
    if (mainTab === 'received' && receivedSpaps.length === 0 && !receivedLoading && !receivedError) {
      fetchReceivedSpaps();
    }
  }, [mainTab, receivedSpaps.length, receivedLoading, receivedError, fetchReceivedSpaps]);

  // Auto-refresh when screen comes into focus
  useRefreshOnFocus(
    useCallback(() => {
      if (mainTab === 'my-applications') {
        return fetchSpaps(true);
      } else {
        return fetchReceivedSpaps(true);
      }
    }, [mainTab, fetchSpaps, fetchReceivedSpaps]),
    { skipFirstFocus: true }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    if (mainTab === 'my-applications') {
      await fetchSpaps(true);
    } else {
      await fetchReceivedSpaps(true);
    }
    setRefreshing(false);
  };

  // Filter spaps by status and search
  const currentSpaps = mainTab === 'my-applications' ? spaps : receivedSpaps;
  const filteredSpaps = currentSpaps.filter((s) => {
    const matchesFilter = activeFilter === 'all' || s.status === activeFilter;
    const matchesSearch = searchQuery === '' || 
      s.paps_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.message && s.message.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Group received spaps by PAPS
  const groupedByPaps = mainTab === 'received' ? filteredSpaps.reduce((acc, spap) => {
    const papsId = (spap as any).paps_id || 'unknown';
    if (!acc[papsId]) {
      acc[papsId] = { paps_id: papsId, paps_title: spap.paps_title, applications: [] };
    }
    acc[papsId].applications.push(spap);
    return acc;
  }, {} as Record<string, { paps_id: string; paps_title: string; applications: typeof filteredSpaps }>) : null;

  const displaySpaps = mainTab === 'received' && groupedByPaps 
    ? Object.values(groupedByPaps) 
    : filteredSpaps;

  const statusTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'rejected', label: 'Rejected' },
    ...(mainTab === 'my-applications' ? [{ key: 'withdrawn' as FilterTab, label: 'Withdrawn' }] : []),
  ];

  const handleWithdraw = (spapId: string) => {
    removeSpap(spapId);
  };

  const handleAccept = useCallback(async (spapId: string) => {
    try {
      await acceptSpap(spapId);
      Alert.alert('Success', 'Application accepted!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to accept application');
    }
  }, [acceptSpap]);

  const handleReject = useCallback(async (spapId: string) => {
    Alert.alert(
      'Reject Application',
      'Are you sure you want to reject this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectSpap(spapId);
              Alert.alert('Done', 'Application rejected');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to reject application');
            }
          },
        },
      ]
    );
  }, [rejectSpap]);

  // Open applications modal
  const openApplicationsModal = useCallback((papsId: string, papsTitle: string) => {
    setSelectedPapsId(papsId);
    setSelectedPapsTitle(papsTitle);
    setModalVisible(true);
  }, []);

  // Get applications for selected PAPS
  const selectedPapsApplications = selectedPapsId 
    ? receivedSpaps.filter(s => (s as any).paps_id === selectedPapsId || s.paps_id === selectedPapsId)
    : [];

  const isLoading = mainTab === 'my-applications' ? loading : receivedLoading;
  const currentError = mainTab === 'my-applications' ? error : receivedError;

  if (isLoading && !refreshing && currentSpaps.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <UnderbossBar />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BRAND.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <UnderbossBar />
      
      {/* Main Tabs: My Applications / Received */}
      <View style={[styles.mainTabsContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.mainTab, { backgroundColor: mainTab === 'my-applications' ? colors.primary : 'transparent' }]}
          onPress={() => { setMainTab('my-applications'); setActiveFilter('all'); }}
        >
          <Text style={styles.mainTabIcon}>📤</Text>
          <Text style={[styles.mainTabText, { color: mainTab === 'my-applications' ? colors.textInverse : colors.textSecondary }]}>
            My Applications
          </Text>
          {spaps.length > 0 && (
            <View style={[styles.mainTabBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.mainTabBadgeText}>{spaps.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, { backgroundColor: mainTab === 'received' ? colors.primary : 'transparent' }]}
          onPress={() => { setMainTab('received'); setActiveFilter('all'); }}
        >
          <Text style={styles.mainTabIcon}>📥</Text>
          <Text style={[styles.mainTabText, { color: mainTab === 'received' ? colors.textInverse : colors.textSecondary }]}>
            Received
          </Text>
          {receivedSpaps.filter(s => s.status === 'pending').length > 0 && (
            <View style={[styles.mainTabBadge, styles.pendingBadge, { backgroundColor: colors.warning }]}>
              <Text style={styles.mainTabBadgeText}>
                {receivedSpaps.filter(s => s.status === 'pending').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.inputBg, color: colors.inputText }]}
          placeholder={mainTab === 'my-applications' ? "🔍 Search your applications..." : "🔍 Search received applications..."}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.inputPlaceholder}
        />
      </View>

      {/* Status Filter Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
        {statusTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              {backgroundColor: colors.backgroundTertiary},
              { borderColor: colors.border },
              activeFilter === tab.key && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeFilter === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Error state */}
      {currentError && currentSpaps.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{currentError}</Text>
          <TouchableOpacity onPress={() => mainTab === 'my-applications' ? fetchSpaps(true) : fetchReceivedSpaps(true)}>
            <Text style={styles.retryText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredSpaps.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{mainTab === 'my-applications' ? '📋' : '📥'}</Text>
          <Text style={styles.emptyTitle}>
            {mainTab === 'my-applications' ? 'No applications found' : 'No applications received'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {mainTab === 'my-applications' 
              ? (activeFilter === 'all' ? "You haven't applied to any jobs yet" : `No ${activeFilter} applications`)
              : (activeFilter === 'all' ? "No one has applied to your jobs yet" : `No ${activeFilter} applications`)
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={displaySpaps}
          keyExtractor={(item) => mainTab === 'received' ? (item as any).paps_id : item.id}
          renderItem={({ item }) => {
            if (mainTab === 'received' && (item as any).applications) {
              const group = item as any;
              return (
                <TouchableOpacity 
                  key={group.paps_id}
                  style={[styles.papsSectionHeader, { backgroundColor: colors.primary }]}
                  onPress={() => openApplicationsModal(group.paps_id, group.paps_title)}
                  activeOpacity={0.7}
                >
                  <View style={styles.papsSectionTitleContainer}>
                    <Text style={styles.papsSectionTitle}>{group.paps_title}</Text>
                    <Text style={styles.papsSectionSubtitle}>View all applications →</Text>
                  </View>
                  <View style={[styles.applicationCount, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                    <Text style={styles.applicationCountText}>{group.applications.length}</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            return mainTab === 'my-applications' ? (
              <SpapPoster spap={item} onWithdraw={handleWithdraw} />
            ) : (
              <ReceivedSpapCard 
                spap={item as any} 
                onAccept={handleAccept} 
                onReject={handleReject} 
              />
            );
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Applications Modal */}
      <PapsApplicationsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        papsTitle={selectedPapsTitle}
        papsId={selectedPapsId || ''}
        applications={selectedPapsApplications}
        onAccept={acceptSpap}
        onReject={rejectSpap}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
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
  // Main Tabs (My Applications / Received)
  mainTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  mainTabActive: {
    borderBottomColor: '#5A67D8',
  },
  mainTabIcon: {
    fontSize: 18,
  },
  mainTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#718096',
  },
  mainTabTextActive: {
    color: '#5A67D8',
  },
  mainTabBadge: {
    backgroundColor: '#5A67D8',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  pendingBadge: {
    backgroundColor: '#ED8936',
  },
  mainTabBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  // Search
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
  // Status Filter Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    borderWidth: 1,
  },
  tabActive: {
    backgroundColor: '#5A67D8',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
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
  papsSectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#5A67D8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  papsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  applicationCount: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicationCountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  papsSectionTitleContainer: {
    flex: 1,
  },
  papsSectionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontStyle: 'italic',
  },
});