import React, { useEffect, useState, useCallback } from 'react'
import { View, FlatList, ActivityIndicator, Text, StyleSheet, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native'
import { SpapStatus } from '../serve';
import { useSpaps, useReceivedSpaps } from '../cache';
import SpapPoster from './SpapPoster';
import ReceivedSpapCard from './ReceivedSpapCard';
import UnderbossBar from '../header/underbossbar';

type MainTab = 'my-applications' | 'received';
type FilterTab = 'all' | SpapStatus;

export default function SpapFeed() {
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

  const isLoading = mainTab === 'my-applications' ? loading : receivedLoading;
  const currentError = mainTab === 'my-applications' ? error : receivedError;

  if (isLoading && !refreshing && currentSpaps.length === 0) {
    return (
      <View style={styles.container}>
        <UnderbossBar />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5A67D8" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <UnderbossBar />
      
      {/* Main Tabs: My Applications / Received */}
      <View style={styles.mainTabsContainer}>
        <TouchableOpacity
          style={[styles.mainTab, mainTab === 'my-applications' && styles.mainTabActive]}
          onPress={() => { setMainTab('my-applications'); setActiveFilter('all'); }}
        >
          <Text style={styles.mainTabIcon}>📤</Text>
          <Text style={[styles.mainTabText, mainTab === 'my-applications' && styles.mainTabTextActive]}>
            My Applications
          </Text>
          {spaps.length > 0 && (
            <View style={styles.mainTabBadge}>
              <Text style={styles.mainTabBadgeText}>{spaps.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, mainTab === 'received' && styles.mainTabActive]}
          onPress={() => { setMainTab('received'); setActiveFilter('all'); }}
        >
          <Text style={styles.mainTabIcon}>📥</Text>
          <Text style={[styles.mainTabText, mainTab === 'received' && styles.mainTabTextActive]}>
            Received
          </Text>
          {receivedSpaps.filter(s => s.status === 'pending').length > 0 && (
            <View style={[styles.mainTabBadge, styles.pendingBadge]}>
              <Text style={styles.mainTabBadgeText}>
                {receivedSpaps.filter(s => s.status === 'pending').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={mainTab === 'my-applications' ? "🔍 Search your applications..." : "🔍 Search received applications..."}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#718096"
        />
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.tabsContainer}>
        {statusTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeFilter === tab.key && styles.tabActive,
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
          data={filteredSpaps}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            mainTab === 'my-applications' ? (
              <SpapPoster spap={item} onWithdraw={handleWithdraw} />
            ) : (
              <ReceivedSpapCard 
                spap={item as any} 
                onAccept={handleAccept} 
                onReject={handleReject} 
              />
            )
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
  },
  tabActive: {
    backgroundColor: '#5A67D8',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
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
});