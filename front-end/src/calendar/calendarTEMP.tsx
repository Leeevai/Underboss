import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Image,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useAsapCalendar, AsapWithMedia } from '../cache';
import { useTheme, BRAND } from '../common/theme';
import { getMediaUrl } from '../serve';

const { width } = Dimensions.get('window');

/******************************************************************
 * 📱 CALENDAR SCREEN - View all ASAPs
 ******************************************************************/

type ViewMode = 'calendar' | 'all';
type RoleFilter = 'all' | 'underboss' | 'under_worker';

export default function CalendarScreen() {
  const { colors, isDark } = useTheme();
  const [selected, setSelected] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAsap, setSelectedAsap] = useState<AsapWithMedia | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const {
    allAsaps,
    asWorker,
    asOwner,
    loading,
    error,
    refresh,
    fetchMedia,
    getAsapsForDate,
    getAsapRole,
    getMarkedDates,
  } = useAsapCalendar();

  // Fetch ASAPs on mount
  useEffect(() => {
    if (allAsaps.length === 0 && !loading && !error) {
      refresh();
    }
  }, [allAsaps.length, loading, error, refresh]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh(true);
    setRefreshing(false);
  };

  // Get filtered ASAPs based on view mode and role filter
  const getFilteredAsaps = useCallback((): AsapWithMedia[] => {
    let asaps: AsapWithMedia[];
    
    if (viewMode === 'calendar' && selected) {
      asaps = getAsapsForDate(selected);
    } else {
      asaps = allAsaps;
    }
    
    // Apply role filter
    if (roleFilter === 'underboss') {
      asaps = asaps.filter((a) => asOwner.some((o) => o.asap_id === a.asap_id));
    } else if (roleFilter === 'under_worker') {
      asaps = asaps.filter((a) => asWorker.some((w) => w.asap_id === a.asap_id));
    }
    
    return asaps;
  }, [viewMode, selected, roleFilter, allAsaps, asWorker, asOwner, getAsapsForDate]);

  // Open ASAP detail modal
  const openAsapDetail = async (asap: AsapWithMedia) => {
    setSelectedAsap(asap);
    setModalVisible(true);
    
    // Fetch media if not loaded
    if (!asap.mediaLoaded) {
      await fetchMedia(asap.asap_id);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#C6F6D5', text: '#38A169' };
      case 'in_progress': return { bg: '#BEE3F8', text: '#3182CE' };
      case 'completed': return { bg: '#E9D8FD', text: '#805AD5' };
      case 'cancelled': return { bg: '#FED7D7', text: '#E53E3E' };
      case 'disputed': return { bg: '#FEEBC8', text: '#DD6B20' };
      default: return { bg: '#EDF2F7', text: '#4A5568' };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Get marked dates for calendar
  const markedDates = getMarkedDates();
  if (selected) {
    markedDates[selected] = {
      ...markedDates[selected],
      selected: true,
      selectedColor: BRAND.primary,
    } as any;
  }

  const filteredAsaps = getFilteredAsaps();

  // Render ASAP card
  const renderAsapCard = ({ item }: { item: AsapWithMedia }) => {
    const role = getAsapRole(item.asap_id);
    const statusColors = getStatusColor(item.status);
    
    return (
      <TouchableOpacity 
        style={[styles.asapCard, { backgroundColor: colors.card, borderColor: colors.border }]} 
        onPress={() => openAsapDetail(item)}
        activeOpacity={0.7}
      >
        {/* Header with role badge and status */}
        <View style={styles.cardHeader}>
          <View style={styles.roleBadgeContainer}>
            <View style={[
              styles.roleBadge, 
              role === 'owner' ? styles.ownerBadge : styles.workerBadge
            ]}>
              <Text style={[styles.roleBadgeText, { color: colors.text }]}>
                {role === 'owner' ? '👔 Underboss' : '🔧 Under Worker'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusTag, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {item.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Job title */}
        <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={2}>{item.paps_title}</Text>

        {/* Date info */}
        <View style={styles.dateInfo}>
          <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Created:</Text>
          <Text style={[styles.dateValue, { color: colors.text }]}>{formatDate(item.created_at)}</Text>
        </View>

        {/* Started/Completed info */}
        {item.started_at && (
          <View style={styles.dateInfo}>
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Started:</Text>
            <Text style={[styles.dateValue, { color: colors.text }]}>{formatDate(item.started_at)}</Text>
          </View>
        )}
        {item.completed_at && (
          <View style={styles.dateInfo}>
            <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>Completed:</Text>
            <Text style={[styles.dateValue, { color: colors.text }]}>{formatDate(item.completed_at)}</Text>
          </View>
        )}

        {/* Media indicator */}
        {item.media && item.media.length > 0 && (
          <View style={[styles.mediaIndicator, { borderTopColor: colors.border }]}>
            <Text style={[styles.mediaIndicatorText, { color: BRAND.primary }]}>📎 {item.media.length} media</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && allAsaps.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading assignments...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER SECTION */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Schedule</Text>
        <Text style={[styles.headerSubtitle, { color: BRAND.primary }]}>
          {asWorker.length} jobs • {asOwner.length} hires
        </Text>
      </View>

      {/* VIEW MODE TOGGLE */}
      <View style={[styles.viewModeContainer, { backgroundColor: colors.inputBg }]}>
        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'calendar' && [styles.viewModeTabActive, { backgroundColor: colors.card }]]}
          onPress={() => setViewMode('calendar')}
        >
          <Text style={[styles.viewModeText, { color: colors.textSecondary }, viewMode === 'calendar' && { color: colors.text }]}>
            📅 Calendar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeTab, viewMode === 'all' && [styles.viewModeTabActive, { backgroundColor: colors.card }]]}
          onPress={() => { setViewMode('all'); setSelected(''); }}
        >
          <Text style={[styles.viewModeText, { color: colors.textSecondary }, viewMode === 'all' && { color: colors.text }]}>
            📋 Show All
          </Text>
        </TouchableOpacity>
      </View>

      {/* ROLE FILTER TABS */}
      <View style={styles.roleFilterContainer}>
        {[
          { key: 'all' as RoleFilter, label: 'All', icon: '🔄' },
          { key: 'underboss' as RoleFilter, label: 'Underboss', icon: '👔' },
          { key: 'under_worker' as RoleFilter, label: 'Under Worker', icon: '🔧' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.roleTab, { backgroundColor: colors.inputBg }, roleFilter === tab.key && { backgroundColor: BRAND.primary }]}
            onPress={() => setRoleFilter(tab.key)}
          >
            <Text style={[styles.roleTabText, { color: colors.textSecondary }, roleFilter === tab.key && { color: '#fff' }]}>
              {tab.icon} {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CALENDAR (only in calendar mode) */}
      {viewMode === 'calendar' && (
        <View style={[styles.calendarCard, { backgroundColor: colors.card }]}>
          <Calendar
            theme={{
              backgroundColor: colors.card,
              calendarBackground: colors.card,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: BRAND.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: BRAND.accent,
              dayTextColor: colors.text,
              arrowColor: BRAND.primary,
              monthTextColor: colors.text,
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDisabledColor: colors.textSecondary,
            }}
            onDayPress={(day: DateData) => {
              setSelected(day.dateString);
            }}
            markedDates={markedDates}
            markingType="multi-dot"
          />
        </View>
      )}

      {/* SELECTED DATE INFO */}
      {viewMode === 'calendar' && selected && (
        <View style={[styles.selectedDateCard, { backgroundColor: BRAND.primary }]}>
          <Text style={styles.selectedDateText}>
            📅 {new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          <Text style={styles.selectedDateCount}>
            {filteredAsaps.length} assignment{filteredAsaps.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* ASAPS LIST */}
      {filteredAsaps.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>
            {viewMode === 'calendar' && selected ? '📅' : '📋'}
          </Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {viewMode === 'calendar' && selected 
              ? 'No assignments on this date'
              : 'No assignments yet'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {viewMode === 'calendar' && selected
              ? 'Try selecting another date'
              : 'Accepted jobs will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAsaps}
          keyExtractor={(item) => item.asap_id}
          renderItem={renderAsapCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ASAP DETAIL MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedAsap && (
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <TouchableOpacity 
                style={[styles.closeButton, { backgroundColor: colors.inputBg }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Assignment Details</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Role badge */}
              <View style={[
                styles.modalRoleBadge,
                getAsapRole(selectedAsap.asap_id) === 'owner' 
                  ? styles.ownerBadge 
                  : styles.workerBadge
              ]}>
                <Text style={[styles.modalRoleBadgeText, { color: colors.text }]}>
                  {getAsapRole(selectedAsap.asap_id) === 'owner' 
                    ? '👔 You hired someone (Underboss)' 
                    : '🔧 You are working (Under Worker)'}
                </Text>
              </View>

              {/* Status */}
              <View style={[
                styles.modalStatusBadge, 
                { backgroundColor: getStatusColor(selectedAsap.status).bg }
              ]}>
                <Text style={[
                  styles.modalStatusText, 
                  { color: getStatusColor(selectedAsap.status).text }
                ]}>
                  {selectedAsap.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>

              {/* Job title */}
              <Text style={[styles.modalJobTitle, { color: colors.text }]}>{selectedAsap.paps_title}</Text>

              {/* Dates section */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.textSecondary }]}>Timeline</Text>
                <View style={[styles.timelineItem, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.timelineLabel, { color: colors.textSecondary }]}>Created</Text>
                  <Text style={[styles.timelineValue, { color: colors.text }]}>{formatDate(selectedAsap.created_at)}</Text>
                </View>
                {selectedAsap.started_at && (
                  <View style={[styles.timelineItem, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.timelineLabel, { color: colors.textSecondary }]}>Started</Text>
                    <Text style={[styles.timelineValue, { color: colors.text }]}>{formatDate(selectedAsap.started_at)}</Text>
                  </View>
                )}
                {selectedAsap.completed_at && (
                  <View style={[styles.timelineItem, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.timelineLabel, { color: colors.textSecondary }]}>Completed</Text>
                    <Text style={[styles.timelineValue, { color: colors.text }]}>{formatDate(selectedAsap.completed_at)}</Text>
                  </View>
                )}
              </View>

              {/* Media section */}
              {selectedAsap.media && selectedAsap.media.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.textSecondary }]}>
                    Media ({selectedAsap.media.length})
                  </Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.mediaScrollView}
                  >
                    {selectedAsap.media.map((mediaItem, index) => (
                      <View key={mediaItem.media_id || index} style={styles.mediaItem}>
                        {mediaItem.media_type === 'image' ? (
                          <Image
                            source={{ uri: getMediaUrl(mediaItem.media_path) }}
                            style={[styles.mediaImage, { backgroundColor: colors.inputBg }]}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.mediaPlaceholder, { backgroundColor: colors.inputBg }]}>
                            <Text style={styles.mediaPlaceholderText}>
                              {mediaItem.media_type === 'video' ? '🎬' : '📄'}
                            </Text>
                            <Text style={[styles.mediaTypeLabel, { color: colors.textSecondary }]}>
                              {mediaItem.media_type}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Media loading indicator */}
              {!selectedAsap.mediaLoaded && (
                <View style={styles.mediaLoadingContainer}>
                  <ActivityIndicator size="small" color={BRAND.primary} />
                  <Text style={[styles.mediaLoadingText, { color: colors.textSecondary }]}>Loading media...</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

/******************************************************************
 * 🎨 STYLES
 ******************************************************************/
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
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0D3B66',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#5DA9E9',
  },
  
  // View Mode Toggle
  viewModeContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
  },
  viewModeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  viewModeTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  viewModeTextActive: {
    color: '#0D3B66',
  },

  // Role Filter
  roleFilterContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
  },
  roleTabActive: {
    backgroundColor: '#0D3B66',
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
  },
  roleTabTextActive: {
    color: '#fff',
  },

  // Calendar
  calendarCard: {
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 12,
  },

  // Selected Date
  selectedDateCard: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#0D3B66',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  selectedDateCount: {
    fontSize: 14,
    color: '#5DA9E9',
    fontWeight: '500',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  // ASAP Card
  asapCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roleBadgeContainer: {
    flex: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ownerBadge: {
    backgroundColor: '#E9D8FD',
  },
  workerBadge: {
    backgroundColor: '#C6F6D5',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3748',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
  },
  dateInfo: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 13,
    color: '#718096',
    width: 80,
  },
  dateValue: {
    fontSize: 13,
    color: '#2D3748',
    flex: 1,
  },
  mediaIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  mediaIndicatorText: {
    fontSize: 12,
    color: '#5A67D8',
    fontWeight: '500',
  },

  // Empty State
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

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#4A5568',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalRoleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  modalRoleBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  modalStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalJobTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D3B66',
    marginBottom: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  timelineLabel: {
    fontSize: 14,
    color: '#718096',
    width: 100,
  },
  timelineValue: {
    fontSize: 14,
    color: '#2D3748',
    flex: 1,
    fontWeight: '500',
  },
  mediaScrollView: {
    marginTop: 8,
  },
  mediaItem: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: width * 0.6,
    height: 180,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
  },
  mediaPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPlaceholderText: {
    fontSize: 32,
  },
  mediaTypeLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  mediaLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  mediaLoadingText: {
    fontSize: 14,
    color: '#718096',
  },
});