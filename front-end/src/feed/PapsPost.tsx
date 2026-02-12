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
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { serv, getMediaUrl, getCurrentUser } from '../serve';
import { useSpaps } from '../cache/spaps';
import type { Paps, PapsDetail } from '../serve/paps';
import type { MediaItem } from '../serve/common/types';
import type { Comment } from '../serve/comments';
import MediaViewer from '../common/MediaViewer';
import { useAvatarUrl } from '../cache/profiles';
import { getCategoryColorByName } from '../cache/categories';
import { useTheme, BRAND, createShadow } from '../common/theme';

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
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const currentUser = getCurrentUser();
  const { fetchSpaps } = useSpaps();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [papsDetail, setPapsDetail] = useState<PapsDetail | null>(null);
  const [papsMedia, setPapsMedia] = useState<MediaItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  
  // Apply modal state
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [applicationMedia, setApplicationMedia] = useState<Asset[]>([]);
  const [uploadingApplicationMedia, setUploadingApplicationMedia] = useState(false);

  // Status change modal state
  const [statusChangeModalVisible, setStatusChangeModalVisible] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  // Get avatar from cache (auto-fetches if not cached)
  const { avatarUrl: avatarUri } = useAvatarUrl(pap.owner_username);

  const cardSize = CARD_SIZES[variant];
  
  // Check if current user is the owner
  const isOwner = currentUser?.username === pap.owner_username;

  // Check if anyone has been accepted for this job
  const hasAccepted = papsDetail?.assigned_count ? papsDetail.assigned_count > 0 : false;
  const canChangeStatus = isOwner && !hasAccepted;

  // Get first category from pap.categories (for card view)
  const firstCategory = pap.categories?.[0] as any;
  const cardCategoryName = firstCategory 
    ? (typeof firstCategory === 'object' ? (firstCategory?.category_name || firstCategory?.name) : firstCategory)
    : null;
  const cardCategoryColor = cardCategoryName ? getCategoryColorByName(cardCategoryName) : null;

  // Get first category from papsDetail (for modal view - more complete data)
  const modalFirstCategory = (papsDetail?.categories?.[0] || pap.categories?.[0]) as any;
  const modalCategoryName = modalFirstCategory
    ? (typeof modalFirstCategory === 'object' ? (modalFirstCategory?.category_name || modalFirstCategory?.name) : modalFirstCategory)
    : null;
  const modalCategoryColor = modalCategoryName ? getCategoryColorByName(modalCategoryName) : null;

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
    
    // Fetch comments
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const response = await serv('comments.list', { paps_id: pap.id, limit: 20 });
        setComments(response.comments || []);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoadingComments(false);
      }
    };
    fetchComments();
  }, [modalVisible, pap.id]);

  // Post a new comment
  const handlePostComment = useCallback(async () => {
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      await serv('comments.create', { 
        paps_id: pap.id, 
        content: newComment.trim() 
      });
      // Refetch comments to get the new one with full data
      const commentsResponse = await serv('comments.list', { paps_id: pap.id, limit: 20 });
      setComments(commentsResponse.comments || []);
      setNewComment('');
    } catch (error: any) {
      Alert.alert('Error', error?.getUserMessage?.() || 'Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  }, [newComment, pap.id]);

  // Handle apply - show apply modal
  const openApplyModal = useCallback(() => {
    setModalVisible(false); // Close detail modal first
    setApplicationMessage('');
    setApplicationMedia([]);
    setTimeout(() => {
      setApplyModalVisible(true);
    }, 100); // Small delay to allow detail modal to close
  }, []);

  // Close apply modal and go back to detail
  const closeApplyModalAndReturn = useCallback(() => {
    setApplyModalVisible(false);
    setTimeout(() => {
      setModalVisible(true);
    }, 100);
  }, []);

  // Pick media for application
  const pickApplicationMedia = useCallback(async () => {
    if (applicationMedia.length >= 5) {
      Alert.alert('Limit Reached', 'Maximum 5 files allowed');
      return;
    }
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 5 - applicationMedia.length,
        quality: 0.8,
      });
      if (result.assets && result.assets.length > 0) {
        setApplicationMedia(prev => [...prev, ...result.assets!]);
      }
    } catch (err) {
      console.error('Failed to pick media:', err);
    }
  }, [applicationMedia.length]);

  // Remove media from application
  const removeApplicationMedia = useCallback((index: number) => {
    setApplicationMedia(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  // Submit application
  const handleSubmitApplication = useCallback(async () => {
    console.log('[Apply] handleSubmitApplication called', { paps_id: pap.id, message: applicationMessage, mediaCount: applicationMedia.length });
    setApplying(true);
    try {
      console.log('[Apply] Calling serv spap.apply...');
      const response = await serv('spap.apply', {
        paps_id: pap.id,
        message: applicationMessage.trim() || 'I am interested in this job opportunity.',
      });
      console.log('[Apply] Application created:', response);
      
      // Upload media if any
      if (applicationMedia.length > 0 && response.spap_id) {
        setUploadingApplicationMedia(true);
        console.log('[Apply] Uploading media...');
        try {
          // Prepare files array for upload
          const files = applicationMedia
            .filter(asset => asset.uri)
            .map(asset => ({
              uri: asset.uri!,
              type: asset.type || 'image/jpeg',
              name: asset.fileName || `media_${Date.now()}.jpg`,
            }));
          
          if (files.length > 0) {
            await serv('spap.media.upload', {
              spap_id: response.spap_id,
              files,
            });
            console.log('[Apply] Media uploaded successfully');
          }
        } catch (mediaError) {
          console.error('[Apply] Media upload failed:', mediaError);
          // Don't fail the whole application if media upload fails
        } finally {
          setUploadingApplicationMedia(false);
        }
      }
      
      setHasApplied(true);
      setApplyModalVisible(false);
      setApplicationMedia([]);
      // Refresh spaps list to show the new application
      fetchSpaps(true);
      Alert.alert('Success', 'Your application has been submitted!', [
        { text: 'OK' },
      ]);
    } catch (error: any) {
      console.error('[Apply] Error:', error);
      Alert.alert(
        'Error',
        error?.getUserMessage?.() || error?.message || 'Failed to submit application.',
        [{ text: 'OK' }]
      );
    } finally {
      setApplying(false);
    }
  }, [pap.id, applicationMessage, applicationMedia, fetchSpaps]);

  // Handle status change
  const handleStatusChange = useCallback(async (newStatus: string) => {
    setChangingStatus(true);
    try {
      await serv('paps.update', {
        paps_id: pap.id,
        status: newStatus,
      });
      // Update local state - update both the detail and the root pap
      setPapsDetail(prev => prev ? { ...prev, status: newStatus } : null);
      
      // Also update the root pap object for immediate UI feedback
      // This ensures the status picker header reflects the change
      pap.status = newStatus as any;
      
      setStatusChangeModalVisible(false);
      Alert.alert('Success', `Job status changed to ${newStatus}`);
      
      // Optional: Refetch details to ensure server consistency
      const updatedDetails = await serv('paps.get', { paps_id: pap.id });
      setPapsDetail(updatedDetails);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.getUserMessage?.() || 'Failed to change status.',
        [{ text: 'OK' }]
      );
    } finally {
      setChangingStatus(false);
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
        style={[
          styles.card, 
          { 
            width: cardSize.width, 
            minHeight: cardSize.height,
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          createShadow(4, isDark)
        ]}
      >
        {/* Category Badge - First category only */}
        {cardCategoryName && cardCategoryColor && (
          <View style={[styles.categoryBadge, { backgroundColor: cardCategoryColor.bg }]}>
            <Text style={[styles.categoryBadgeText, { color: cardCategoryColor.text }]}>{cardCategoryName}</Text>
          </View>
        )}

        {/* Card Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={cardSize.titleLines}>
            {pap.title}
          </Text>
          
          <Text style={[styles.cardDescription, { color: colors.textTertiary }]} numberOfLines={cardSize.descLines}>
            {pap.description}
          </Text>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            {pap.location_address && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {pap.location_address}
                </Text>
              </View>
            )}
            
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>💰</Text>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {formatCurrency(pap.payment_amount, pap.payment_currency)}
                {pap.payment_type !== 'fixed' && ` ${formatPaymentType(pap.payment_type)}`}
              </Text>
            </View>

            {pap.estimated_duration_minutes && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>⏱️</Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  ~{Math.round(pap.estimated_duration_minutes / 60)}h
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Card Footer */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.userInfo}>
            <View style={[styles.avatarSmall, { backgroundColor: colors.backgroundTertiary }]}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarSmallImage} />
              ) : (
                <Text style={[styles.avatarSmallInitial, { color: colors.textSecondary }]}>
                  {pap.owner_username?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              )}
            </View>
            <Text style={[styles.username, { color: colors.textTertiary }]} numberOfLines={1}>
              @{pap.owner_username}
            </Text>
          </View>
          
          <View style={styles.actionArea}>
            <Text style={[styles.timeAgo, { color: colors.textMuted }]}>{formatRelativeTime(pap.created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* =================================================================== */}
      {/* DETAIL MODAL */}
      {/* =================================================================== */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop - tap to dismiss */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          
          {/* Modal Content - does not dismiss on tap */}
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.card }]} edges={['bottom']}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
                <View style={[styles.modalDragIndicator, { backgroundColor: colors.borderDark }]} />
                <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Job Details</Text>
                <TouchableOpacity
                  style={[styles.modalCloseBtn, { backgroundColor: colors.backgroundTertiary }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.modalCloseBtnText, { color: colors.textTertiary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Loading State */}
              {loadingDetail ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading job details...</Text>
                </View>
              ) : (
              /* Modal Content - Scrollable */
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                {/* Title & Category */}
                <View style={styles.modalTitleSection}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{pap.title}</Text>
                  {modalCategoryName && modalCategoryColor && (
                    <View style={[styles.modalCategoryBadge, { backgroundColor: modalCategoryColor.bg }]}>
                      <Text style={[styles.modalCategoryText, { color: modalCategoryColor.text }]}>{modalCategoryName}</Text>
                    </View>
                  )}
                </View>

                {/* Posted Time & Status */}
                <View style={styles.modalMetaRow}>
                  <Text style={[styles.modalMetaText, { color: colors.textTertiary }]}>
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
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
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
                  <View style={[styles.infoBox, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
                    <Text style={styles.infoBoxIcon}>💰</Text>
                    <Text style={[styles.infoBoxLabel, { color: colors.primary }]}>Payment</Text>
                    <Text style={[styles.infoBoxValue, { color: colors.text }]}>
                      {formatCurrency(pap.payment_amount, pap.payment_currency)}
                    </Text>
                    <Text style={[styles.infoBoxSub, { color: colors.textTertiary }]}>
                      {formatPaymentType(pap.payment_type)}
                    </Text>
                  </View>
                  
                  <View style={[styles.infoBox, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
                    <Text style={styles.infoBoxIcon}>📍</Text>
                    <Text style={[styles.infoBoxLabel, { color: colors.primary }]}>Location</Text>
                    <Text style={[styles.infoBoxValue, { color: colors.text }]} numberOfLines={2}>
                      {pap.location_address || 'Remote'}
                    </Text>
                  </View>
                  
                  <View style={[styles.infoBox, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
                    <Text style={styles.infoBoxIcon}>👥</Text>
                    <Text style={[styles.infoBoxLabel, { color: colors.primary }]}>Openings</Text>
                    <Text style={[styles.infoBoxValue, { color: colors.text }]}>
                      {pap.max_assignees || 1}
                    </Text>
                    <Text style={[styles.infoBoxSub, { color: colors.textTertiary }]}>
                      of {pap.max_applicants || 10} max
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.modalSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                  <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{pap.description}</Text>
                </View>

                {/* Schedule (if available) */}
                {pap.start_datetime && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Schedule</Text>
                    <View style={[styles.scheduleCard, { backgroundColor: colors.backgroundSecondary }]}>
                      <View style={styles.scheduleRow}>
                        <Text style={[styles.scheduleLabel, { color: colors.textTertiary }]}>Start</Text>
                        <Text style={[styles.scheduleValue, { color: colors.text }]}>
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
                          <Text style={[styles.scheduleLabel, { color: colors.textTertiary }]}>End</Text>
                          <Text style={[styles.scheduleValue, { color: colors.text }]}>
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
                          <Text style={[styles.scheduleLabel, { color: colors.textTertiary }]}>Duration</Text>
                          <Text style={[styles.scheduleValue, { color: colors.text }]}>
                            ~{Math.round(pap.estimated_duration_minutes / 60)} hours
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Posted By */}
                <View style={styles.modalSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Posted by</Text>
                  <TouchableOpacity 
                    style={[styles.postedByCard, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => {
                      setModalVisible(false);
                      navigation.navigate('ProfilePage', { username: pap.owner_username });
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.avatarMedium, { backgroundColor: colors.backgroundTertiary }]}>
                      {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.avatarMediumImage} />
                      ) : (
                        <Text style={[styles.avatarMediumInitial, { color: colors.textSecondary }]}>
                          {pap.owner_username?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.postedByInfo}>
                      <Text style={[styles.postedByName, { color: colors.text }]}>@{pap.owner_username}</Text>
                      {papsDetail && (
                        <Text style={[styles.postedByStats, { color: colors.textTertiary }]}>
                          {papsDetail.applications_count || 0} applications • {papsDetail.comments_count || 0} comments
                        </Text>
                      )}
                    </View>
                    <View style={[styles.viewProfileBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.viewProfileBtnText, { color: colors.textSecondary }]}>View</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Additional Info */}
                {loadingDetail ? (
                  <View style={styles.loadingSection}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading details...</Text>
                  </View>
                ) : (
                  <View style={styles.modalSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
                    <View style={[styles.detailsList, { backgroundColor: colors.backgroundSecondary }]}>
                      <View style={[styles.detailItem, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Job ID</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                          {pap.id.slice(0, 8)}...
                        </Text>
                      </View>
                      <View style={[styles.detailItem, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Visibility</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                          {pap.is_public ? 'Public' : 'Private'}
                        </Text>
                      </View>
                      {pap.expires_at && (
                        <View style={[styles.detailItem, { borderBottomColor: colors.border }]}>
                          <Text style={styles.detailLabel}>Expires</Text>
                          <Text style={styles.detailValue}>
                            {new Date(pap.expires_at).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Comments Section */}
                <View style={styles.modalSection}>
                  <View style={styles.commentsSectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Comments {comments.length > 0 && `(${comments.length})`}
                    </Text>
                  </View>
                  
                  {/* Add Comment Input */}
                  <View style={[styles.addCommentBox]}>
                    <TextInput
                      style={[styles.commentInput, {backgroundColor: colors.backgroundTertiary, borderColor: colors.borderLight, color: colors.text}]}
                      placeholder="Write a comment..."
                      placeholderTextColor={colors.textMuted}
                      value={newComment}
                      onChangeText={setNewComment}
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity
                      style={[
                        styles.postCommentBtn,
                        { backgroundColor: colors.primary },
                        (!newComment.trim() || postingComment) && { backgroundColor: colors.textMuted },
                      ]}
                      onPress={handlePostComment}
                      disabled={!newComment.trim() || postingComment}
                    >
                      {postingComment ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.postCommentBtnText}>Post</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  {/* Comments List */}
                  {loadingComments ? (
                    <View style={styles.commentsLoading}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.loadingText, { color: colors.textTertiary }]}>Loading comments...</Text>
                    </View>
                  ) : comments.length === 0 ? (
                    <View style={styles.noComments}>
                      <Text style={[styles.noCommentsText, { color: colors.textTertiary }]}>No comments yet. Be the first to comment!</Text>
                    </View>
                  ) : (
                    <View style={styles.commentsList}>
                      {(showAllComments ? comments : comments.slice(0, 3)).map((comment) => (
                        <View key={comment.comment_id} style={[styles.commentItem, {backgroundColor: colors.backgroundTertiary}]}>
                          <View style={styles.commentHeader}>
                            <View style={[styles.commentAvatar, { backgroundColor: colors.border }]}>
                              {comment.author_avatar ? (
                                <Image 
                                  source={{ uri: getMediaUrl(comment.author_avatar)! }} 
                                  style={styles.commentAvatarImage} 
                                />
                              ) : (
                                <Text style={[styles.commentAvatarInitial, { color: colors.textSecondary }]}>
                                  {comment.author_username?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                              )}
                            </View>
                            <View style={styles.commentMeta}>
                              <Text style={[styles.commentUsername,{color:colors.text}]}>@{comment.author_username}</Text>
                              <Text style={[styles.commentTime, { color: colors.textMuted }]}>
                                {formatRelativeTime(comment.created_at)}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.commentContent,{color:colors.textSecondary}]}>{comment.content}</Text>
                          {comment.reply_count > 0 && (
                            <Text style={[styles.replyCount, { color: colors.primary }]}>
                              {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                            </Text>
                          )}
                        </View>
                      ))}
                      {comments.length > 3 && !showAllComments && (
                        <TouchableOpacity
                          style={styles.showMoreCommentsBtn}
                          onPress={() => setShowAllComments(true)}
                        >
                          <Text style={[styles.showMoreCommentsText, { color: colors.primary }]}>
                            Show {comments.length - 3} more comments
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                {/* Bottom spacing */}
                <View style={styles.bottomSpacer} />
              </ScrollView>
              )}

              {/* Footer Actions */}
              <View style={[styles.modalFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: colors.backgroundTertiary }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.closeBtnText, { color: colors.textSecondary }]}>Close</Text>
                </TouchableOpacity>
                {isOwner && canChangeStatus && (
                  <TouchableOpacity
                    style={[styles.changeStatusBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setStatusChangeModalVisible(true)}
                  >
                    <Text style={styles.changeStatusBtnText}>Change Status</Text>
                  </TouchableOpacity>
                )}
                {!isOwner && (
                  <TouchableOpacity
                    style={[
                      styles.applyBtn,
                      { backgroundColor: colors.primary },
                      (hasApplied || isOwner) && { backgroundColor: colors.textMuted },
                    ]}
                    onPress={openApplyModal}
                    disabled={hasApplied || isOwner}
                  >
                    <Text style={styles.applyBtnText}>
                      {hasApplied ? '✓ Applied' : 'Apply Now'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* Apply Modal */}
      <Modal
        visible={applyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeApplyModalAndReturn}
      >
        <KeyboardAvoidingView 
          style={styles.applyModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeApplyModalAndReturn}
          />
          <View style={[styles.applyModalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.applyModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.applyModalTitle, { color: colors.text }]}>Apply to Job</Text>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: colors.backgroundTertiary }]}
                onPress={closeApplyModalAndReturn}
              >
                <Text style={[styles.modalCloseBtnText, { color: colors.textTertiary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.applyModalBody}>
              <Text style={[styles.applyJobTitle, { color: colors.text }]} numberOfLines={2}>{pap.title}</Text>
              <Text style={[styles.applyInputLabel, { color: colors.textSecondary }]}>Your Message</Text>
              <TextInput
                style={[styles.applicationInput, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border, color: colors.text }]}
                placeholder="Write a message to the job poster..."
                placeholderTextColor={colors.textMuted}
                value={applicationMessage}
                onChangeText={setApplicationMessage}
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={[styles.applicationCharCount, { color: colors.textMuted }]}>
                {applicationMessage.length}/1000
              </Text>

              {/* Media Section */}
              <Text style={[styles.applyInputLabel, { color: colors.textSecondary, marginTop: 16 }]}>
                Attachments (optional)
              </Text>
              <Text style={[styles.applyMediaHint, { color: colors.textMuted }]}>
                Add photos or documents to support your application ({applicationMedia.length}/5)
              </Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.applyMediaScrollView}>
                {applicationMedia.map((asset, index) => (
                  <View key={asset.uri || index} style={styles.applyMediaPreviewContainer}>
                    <Image
                      source={{ uri: asset.uri }}
                      style={styles.applyMediaPreview}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.applyMediaRemoveBtn}
                      onPress={() => removeApplicationMedia(index)}
                    >
                      <Text style={styles.applyMediaRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                
                {applicationMedia.length < 5 && (
                  <TouchableOpacity
                    style={[styles.applyMediaAddBtn, { borderColor: colors.border, backgroundColor: colors.backgroundTertiary }]}
                    onPress={pickApplicationMedia}
                  >
                    <Text style={styles.applyMediaAddIcon}>+</Text>
                    <Text style={[styles.applyMediaAddText, { color: colors.textSecondary }]}>Add</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </ScrollView>
            
            <View style={[styles.applyModalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.cancelApplyBtn, { backgroundColor: colors.backgroundTertiary }]}
                onPress={closeApplyModalAndReturn}
                disabled={applying || uploadingApplicationMedia}
              >
                <Text style={[styles.cancelApplyBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitApplyBtn, { backgroundColor: colors.primary }, (applying || uploadingApplicationMedia) && { backgroundColor: colors.textMuted }]}
                onPress={handleSubmitApplication}
                disabled={applying || uploadingApplicationMedia}
              >
                {applying || uploadingApplicationMedia ? (
                  <View style={styles.submitApplyBtnLoading}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={[styles.submitApplyBtnText, { marginLeft: 8 }]}>
                      {uploadingApplicationMedia ? 'Uploading...' : 'Submitting...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.submitApplyBtnText}>Submit Application</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Status Change Modal */}
      <Modal
        visible={statusChangeModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setStatusChangeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.statusPickerOverlay}
          activeOpacity={1}
          onPress={() => setStatusChangeModalVisible(false)}
        />
        <View style={[styles.statusPickerContent, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.statusPickerHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.statusPickerDrag} />
            <Text style={[styles.statusPickerTitle, { color: colors.text }]}>Update Status</Text>
          </View>

          {/* Status Options */}
          <View style={styles.statusPickerBody}>
            {(['draft', 'published', 'open', 'closed', 'cancelled'] as const).map((status, index) => (
              <TouchableOpacity
                key={status}
                onPress={() => handleStatusChange(status)}
                disabled={changingStatus || pap.status === status}
                activeOpacity={0.7}
                style={[
                  styles.statusPickerOption,
                  {
                    backgroundColor: pap.status === status ? colors.primary + '15' : 'transparent',
                    borderBottomColor: colors.border,
                    borderBottomWidth: index < 4 ? 1 : 0,
                  }
                ]}
              >
                <View style={styles.statusPickerOptionLeft}>
                  <View
                    style={[
                      styles.statusPickerOptionIcon,
                      {
                        backgroundColor: getStatusColor(status).bg,
                        borderColor: getStatusColor(status).bg,
                      }
                    ]}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {status === 'draft' && '📝'}
                      {status === 'published' && '📢'}
                      {status === 'open' && '🔓'}
                      {status === 'closed' && '✓'}
                      {status === 'cancelled' && '✕'}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.statusPickerOptionTitle, { color: colors.text }]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                    <Text style={[styles.statusPickerOptionDesc, { color: colors.textTertiary }]}>
                      {status === 'draft' && 'Not yet published'}
                      {status === 'published' && 'Published but not active'}
                      {status === 'open' && 'Accepting applications'}
                      {status === 'closed' && 'No longer accepting'}
                      {status === 'cancelled' && 'Job is cancelled'}
                    </Text>
                  </View>
                </View>
                {pap.status === status && (
                  <Text style={[styles.statusPickerCheckmark, { color: colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View style={[styles.statusPickerFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setStatusChangeModalVisible(false)}
              activeOpacity={0.7}
              style={[styles.statusPickerCancelBtn, { backgroundColor: colors.backgroundTertiary }]}
            >
              <Text style={[styles.statusPickerCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  categoryBadgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    zIndex: 1,
    maxWidth: '80%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 1,
  },
  categoryBadgeMore: {
    backgroundColor: '#EDF2F7',
  },
  categoryBadgeText: {
    color: '#319795',
    fontSize: 10,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxHeight: '95%',
    minHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
  },
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
    fontSize: 18,
    color: '#718096',
    fontWeight: '400',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#718096',
  },

  // Modal content sections
  modalTitleSection: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
    lineHeight: 36,
    marginBottom: 12,
  },
  modalCategoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalCategoryBadge: {
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
    gap: 12,
    marginBottom: 28,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#F0FFF4',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  infoBoxIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  infoBoxLabel: {
    fontSize: 11,
    color: '#38A169',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoBoxValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#22543D',
    textAlign: 'center',
  },
  infoBoxSub: {
    fontSize: 11,
    color: '#48BB78',
    marginTop: 4,
    fontWeight: '500',
  },

  // Sections
  modalSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 14,
  },
  descriptionText: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 26,
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

  // Comments styles
  commentsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addCommentBox: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D3748',
    maxHeight: 80,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  postCommentBtn: {
    backgroundColor: '#3182CE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCommentBtnDisabled: {
    backgroundColor: '#A0AEC0',
  },
  postCommentBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
  },
  noComments: {
    padding: 20,
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: 14,
    color: '#718096',
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  commentAvatarImage: {
    width: '100%',
    height: '100%',
  },
  commentAvatarInitial: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A5568',
  },
  commentMeta: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3748',
  },
  commentTime: {
    fontSize: 11,
    color: '#A0AEC0',
  },
  commentContent: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  replyCount: {
    fontSize: 12,
    color: '#3182CE',
    marginTop: 8,
    fontWeight: '500',
  },
  showMoreCommentsBtn: {
    padding: 12,
    alignItems: 'center',
  },
  showMoreCommentsText: {
    fontSize: 14,
    color: '#3182CE',
    fontWeight: '600',
  },

  // Apply Modal styles
  applyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  applyModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  applyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  applyModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
  },
  applyModalBody: {
    padding: 20,
  },
  applyJobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 16,
  },
  applyInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
  },
  applicationInput: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2D3748',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  applicationCharCount: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'right',
    marginTop: 6,
  },
  applyModalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  cancelApplyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
  },
  cancelApplyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A5568',
  },
  submitApplyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3182CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitApplyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitApplyBtnLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyMediaHint: {
    fontSize: 12,
    marginBottom: 12,
  },
  applyMediaScrollView: {
    marginBottom: 16,
  },
  applyMediaPreviewContainer: {
    position: 'relative',
    marginRight: 12,
  },
  applyMediaPreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  applyMediaRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E53E3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyMediaRemoveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  applyMediaAddBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyMediaAddIcon: {
    fontSize: 24,
    color: '#718096',
  },
  applyMediaAddText: {
    fontSize: 11,
    marginTop: 4,
  },
  changeStatusBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3182CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeStatusBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Status picker modal styles - modern bottom sheet
  statusPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  statusPickerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  statusPickerHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  statusPickerDrag: {
    width: 32,
    height: 4,
    backgroundColor: '#CBD5E0',
    borderRadius: 2,
    marginBottom: 12,
  },
  statusPickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    letterSpacing: 0.3,
  },
  statusPickerBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  statusPickerOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusPickerOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
  },
  statusPickerOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 2,
  },
  statusPickerOptionDesc: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  statusPickerCheckmark: {
    fontSize: 18,
    color: '#3182CE',
    fontWeight: '700',
  },
  statusPickerFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  statusPickerCancelBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
  },
  statusPickerCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A5568',
  },
});
