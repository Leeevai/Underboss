/**
 * PapsPost - Job posting card component
 * 
 * Displays a PAPS (job) as a card with modal details view
 * Supports images, videos, and documents via MediaViewer
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { serv, getMediaUrl } from '../serve';
import type { Paps, PapsDetail } from '../serve/paps';
import type { MediaItem } from '../serve/common/types';
import MediaViewer from '../common/MediaViewer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// =============================================================================
// TYPES
// =============================================================================

interface PapsPostProps {
  /** PAPS data to display */
  pap: Paps;
  /** Card size variant */
  variant?: 'compact' | 'standard' | 'featured';
  /** Callback when card is pressed */
  onPress?: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPaymentType(type: string): string {
  switch (type) {
    case 'fixed': return 'Fixed';
    case 'hourly': return '/hr';
    case 'negotiable': return 'Negotiable';
    default: return '';
  }
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Recently';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function getStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'published':
    case 'open':
      return { bg: '#C6F6D5', text: '#22543D' };
    case 'closed':
      return { bg: '#FED7D7', text: '#822727' };
    case 'cancelled':
      return { bg: '#E2E8F0', text: '#4A5568' };
    case 'draft':
    default:
      return { bg: '#FEFCBF', text: '#744210' };
  }
}

// =============================================================================
// CARD SIZE CONFIGURATIONS
// =============================================================================

const CARD_SIZES = {
  compact: { width: 260, height: 180, titleLines: 1, descLines: 1 },
  standard: { width: 300, height: 260, titleLines: 2, descLines: 2 },
  featured: { width: SCREEN_WIDTH - 32, height: 320, titleLines: 2, descLines: 3 },
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PapsPost({ pap, variant = 'standard', onPress }: PapsPostProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [papsDetail, setPapsDetail] = useState<PapsDetail | null>(null);
  const [papsMedia, setPapsMedia] = useState<MediaItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const cardSize = CARD_SIZES[variant];
  const primaryCategory = pap.categories?.[0];
  const categoryName = typeof primaryCategory === 'object' 
    ? primaryCategory?.name 
    : primaryCategory;

  // Fetch avatar on mount
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!pap.owner_username) return;
      try {
        const profile = await serv('profile.getByUsername', { username: pap.owner_username });
        setAvatarUri(getMediaUrl(profile.avatar_url));
      } catch {
        setAvatarUri(null);
      }
    };
    fetchAvatar();
  }, [pap.owner_username]);

  // Fetch details when modal opens
  useEffect(() => {
    if (!modalVisible || !pap.id) return;

    const fetchDetails = async () => {
      setLoadingDetail(true);
      try {
        const [details, mediaResponse] = await Promise.all([
          serv('paps.get', { paps_id: pap.id }),
          serv('paps.media.list', { paps_id: pap.id }),
        ]);
        setPapsDetail(details);
        setPapsMedia(mediaResponse.media || []);
      } catch (error) {
        console.error('Error fetching PAPS details:', error);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetails();
  }, [modalVisible, pap.id]);

  // Handle apply
  const handleApply = useCallback(async () => {
    setApplying(true);
    try {
      await serv('spap.apply', {
        paps_id: pap.id,
        message: 'I am interested in this job opportunity.',
      });
      setHasApplied(true);
      Alert.alert('Success', 'Your application has been submitted!', [
        { text: 'OK', onPress: () => setModalVisible(false) },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.getUserMessage?.() || 'Failed to submit application.',
        [{ text: 'OK' }]
      );
    } finally {
      setApplying(false);
    }
  }, [pap.id]);

  const openModal = () => {
    console.log('Opening modal, onPress:', !!onPress);
    if (onPress) {
      onPress();
    } else {
      setModalVisible(true);
    }
  };

  // ==========================================================================
  // RENDER CARD
  // ==========================================================================

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={openModal}
        style={[styles.card, { width: cardSize.width, minHeight: cardSize.height }]}
      >
        {/* Category Badge */}
        {categoryName && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{categoryName}</Text>
          </View>
        )}

        {/* Card Content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={cardSize.titleLines}>
            {pap.title}
          </Text>
          
          <Text style={styles.cardDescription} numberOfLines={cardSize.descLines}>
            {pap.description}
          </Text>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            {pap.location_address && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={styles.metaText} numberOfLines={1}>
                  {pap.location_address}
                </Text>
              </View>
            )}
            
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>💰</Text>
              <Text style={styles.metaText}>
                {formatCurrency(pap.payment_amount, pap.payment_currency)}
                {pap.payment_type !== 'fixed' && ` ${formatPaymentType(pap.payment_type)}`}
              </Text>
            </View>

            {pap.estimated_duration_minutes && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>⏱️</Text>
                <Text style={styles.metaText}>
                  ~{Math.round(pap.estimated_duration_minutes / 60)}h
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.userInfo}>
            <View style={styles.avatarSmall}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarSmallImage} />
              ) : (
                <Text style={styles.avatarSmallInitial}>
                  {pap.owner_username?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              )}
            </View>
            <Text style={styles.username} numberOfLines={1}>
              @{pap.owner_username}
            </Text>
          </View>
          
          <View style={styles.actionArea}>
            <Text style={styles.timeAgo}>{formatRelativeTime(pap.created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* =================================================================== */}
      {/* DETAIL MODAL */}
      {/* =================================================================== */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalDragIndicator} />
            <Text style={styles.modalHeaderTitle}>Job Details</Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Modal Content - Scrollable */}
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Title & Category */}
            <View style={styles.modalTitleSection}>
                  <Text style={styles.modalTitle}>{pap.title}</Text>
                  {categoryName && (
                    <View style={styles.modalCategoryBadge}>
                      <Text style={styles.modalCategoryText}>{categoryName}</Text>
                    </View>
                  )}
                </View>

                {/* Posted Time & Status */}
                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMetaText}>
                    Posted {formatRelativeTime(pap.created_at)}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(pap.status).bg }
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      { color: getStatusColor(pap.status).text }
                    ]}>
                      {pap.status.charAt(0).toUpperCase() + pap.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Media Section */}
                {papsMedia.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>
                      Media ({papsMedia.length})
                    </Text>
                    <MediaViewer
                      media={papsMedia}
                      size="medium"
                      layout="carousel"
                      maxVisible={5}
                    />
                  </View>
                )}

                {/* Quick Info Boxes */}
                <View style={styles.infoBoxRow}>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxIcon}>💰</Text>
                    <Text style={styles.infoBoxLabel}>Payment</Text>
                    <Text style={styles.infoBoxValue}>
                      {formatCurrency(pap.payment_amount, pap.payment_currency)}
                    </Text>
                    <Text style={styles.infoBoxSub}>
                      {formatPaymentType(pap.payment_type)}
                    </Text>
                  </View>
                  
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxIcon}>📍</Text>
                    <Text style={styles.infoBoxLabel}>Location</Text>
                    <Text style={styles.infoBoxValue} numberOfLines={2}>
                      {pap.location_address || 'Remote'}
                    </Text>
                  </View>
                  
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxIcon}>👥</Text>
                    <Text style={styles.infoBoxLabel}>Openings</Text>
                    <Text style={styles.infoBoxValue}>
                      {pap.max_assignees || 1}
                    </Text>
                    <Text style={styles.infoBoxSub}>
                      of {pap.max_applicants || 10} max
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>{pap.description}</Text>
                </View>

                {/* Schedule (if available) */}
                {pap.start_datetime && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Schedule</Text>
                    <View style={styles.scheduleCard}>
                      <View style={styles.scheduleRow}>
                        <Text style={styles.scheduleLabel}>Start</Text>
                        <Text style={styles.scheduleValue}>
                          {new Date(pap.start_datetime).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      {pap.end_datetime && (
                        <View style={styles.scheduleRow}>
                          <Text style={styles.scheduleLabel}>End</Text>
                          <Text style={styles.scheduleValue}>
                            {new Date(pap.end_datetime).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      )}
                      {pap.estimated_duration_minutes && (
                        <View style={styles.scheduleRow}>
                          <Text style={styles.scheduleLabel}>Duration</Text>
                          <Text style={styles.scheduleValue}>
                            ~{Math.round(pap.estimated_duration_minutes / 60)} hours
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Posted By */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Posted by</Text>
                  <View style={styles.postedByCard}>
                    <View style={styles.avatarMedium}>
                      {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatarMediumImage} />
                      ) : (
                        <Text style={styles.avatarMediumInitial}>
                          {pap.owner_username?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.postedByInfo}>
                      <Text style={styles.postedByName}>@{pap.owner_username}</Text>
                      {papsDetail && (
                        <Text style={styles.postedByStats}>
                          {papsDetail.applications_count || 0} applications • {papsDetail.comments_count || 0} comments
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.viewProfileBtn}>
                      <Text style={styles.viewProfileBtnText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Additional Info */}
                {loadingDetail ? (
                  <View style={styles.loadingSection}>
                    <ActivityIndicator size="small" color="#3182CE" />
                    <Text style={styles.loadingText}>Loading details...</Text>
                  </View>
                ) : (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionTitle}>Details</Text>
                    <View style={styles.detailsList}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Job ID</Text>
                        <Text style={styles.detailValue} numberOfLines={1}>
                          {pap.id.slice(0, 8)}...
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Visibility</Text>
                        <Text style={styles.detailValue}>
                          {pap.is_public ? 'Public' : 'Private'}
                        </Text>
                      </View>
                      {pap.expires_at && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Expires</Text>
                          <Text style={styles.detailValue}>
                            {new Date(pap.expires_at).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Bottom spacing */}
                <View style={styles.bottomSpacer} />
              </ScrollView>

              {/* Footer Actions */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.applyBtn,
                    (applying || hasApplied) && styles.applyBtnDisabled,
                  ]}
                  onPress={handleApply}
                  disabled={applying || hasApplied}
                >
                  {applying ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.applyBtnText}>
                      {hasApplied ? '✓ Applied' : 'Apply Now'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>
    </>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  // Card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 6,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1,
  },
  categoryBadgeText: {
    color: '#319795',
    fontSize: 11,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
    marginTop: 28,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 6,
    lineHeight: 22,
  },
  cardDescription: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 18,
    marginBottom: 12,
  },
  metaContainer: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 13,
  },
  metaText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarSmallImage: {
    width: '100%',
    height: '100%',
  },
  avatarSmallInitial: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A5568',
  },
  username: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
    flex: 1,
  },
  actionArea: {
    alignItems: 'flex-end',
  },
  timeAgo: {
    fontSize: 11,
    color: '#A0AEC0',
    fontWeight: '500',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  modalDragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
  },
  modalCloseBtn: {
    position: 'absolute',
    right: 16,
    top: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '300',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },

  // Modal content sections
  modalTitleSection: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A202C',
    lineHeight: 30,
    marginBottom: 8,
  },
  modalCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  modalCategoryText: {
    color: '#319795',
    fontSize: 12,
    fontWeight: '700',
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalMetaText: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Info boxes
  infoBoxRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  infoBoxIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  infoBoxLabel: {
    fontSize: 10,
    color: '#718096',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoBoxValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
  },
  infoBoxSub: {
    fontSize: 10,
    color: '#A0AEC0',
    marginTop: 2,
  },

  // Sections
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 22,
  },

  // Schedule
  scheduleCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleLabel: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  scheduleValue: {
    fontSize: 13,
    color: '#2D3748',
    fontWeight: '600',
  },

  // Posted by
  postedByCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  avatarMedium: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarMediumImage: {
    width: '100%',
    height: '100%',
  },
  avatarMediumInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A5568',
  },
  postedByInfo: {
    flex: 1,
  },
  postedByName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 2,
  },
  postedByStats: {
    fontSize: 12,
    color: '#718096',
  },
  viewProfileBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewProfileBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
  },

  // Details list
  detailsList: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  detailLabel: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },

  // Loading
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#718096',
  },

  // Footer
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A5568',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3182CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnDisabled: {
    backgroundColor: '#A0AEC0',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 20,
  },
});
