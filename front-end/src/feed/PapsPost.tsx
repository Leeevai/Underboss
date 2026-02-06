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
import { serv, getMediaUrl } from '../serve';
import type { Paps, PapsDetail } from '../serve/paps';
import type { MediaItem } from '../serve/common/types';
import type { Comment } from '../serve/comments';
import MediaViewer from '../common/MediaViewer';
import { useAvatarUrl } from '../cache/profiles';
import { getCategoryColorByName } from '../cache/categories';

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

  // Get avatar from cache (auto-fetches if not cached)
  const { avatarUrl: avatarUri } = useAvatarUrl(pap.owner_username);

  const cardSize = CARD_SIZES[variant];
  
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
    setApplicationMessage('');
    setApplyModalVisible(true);
  }, []);
  
  // Submit application
  const handleSubmitApplication = useCallback(async () => {
    setApplying(true);
    try {
      await serv('spap.apply', {
        paps_id: pap.id,
        message: applicationMessage.trim() || 'I am interested in this job opportunity.',
      });
      setHasApplied(true);
      setApplyModalVisible(false);
      Alert.alert('Success', 'Your application has been submitted!', [
        { text: 'OK' },
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
  }, [pap.id, applicationMessage]);

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
        {/* Category Badge - First category only */}
        {cardCategoryName && cardCategoryColor && (
          <View style={[styles.categoryBadge, { backgroundColor: cardCategoryColor.bg }]}>
            <Text style={[styles.categoryBadgeText, { color: cardCategoryColor.text }]}>{cardCategoryName}</Text>
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
          <View style={styles.modalSheet}>
            <SafeAreaView style={styles.modalContainer} edges={['bottom']}>
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

              {/* Loading State */}
              {loadingDetail ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3182CE" />
                  <Text style={styles.loadingText}>Loading job details...</Text>
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
                  <Text style={styles.modalTitle}>{pap.title}</Text>
                  {modalCategoryName && modalCategoryColor && (
                    <View style={[styles.modalCategoryBadge, { backgroundColor: modalCategoryColor.bg }]}>
                      <Text style={[styles.modalCategoryText, { color: modalCategoryColor.text }]}>{modalCategoryName}</Text>
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

                {/* Comments Section */}
                <View style={styles.modalSection}>
                  <View style={styles.commentsSectionHeader}>
                    <Text style={styles.sectionTitle}>
                      Comments {comments.length > 0 && `(${comments.length})`}
                    </Text>
                  </View>
                  
                  {/* Add Comment Input */}
                  <View style={styles.addCommentBox}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Write a comment..."
                      placeholderTextColor="#A0AEC0"
                      value={newComment}
                      onChangeText={setNewComment}
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity
                      style={[
                        styles.postCommentBtn,
                        (!newComment.trim() || postingComment) && styles.postCommentBtnDisabled,
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
                      <ActivityIndicator size="small" color="#3182CE" />
                      <Text style={styles.loadingText}>Loading comments...</Text>
                    </View>
                  ) : comments.length === 0 ? (
                    <View style={styles.noComments}>
                      <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
                    </View>
                  ) : (
                    <View style={styles.commentsList}>
                      {(showAllComments ? comments : comments.slice(0, 3)).map((comment) => (
                        <View key={comment.comment_id} style={styles.commentItem}>
                          <View style={styles.commentHeader}>
                            <View style={styles.commentAvatar}>
                              {comment.author_avatar ? (
                                <Image 
                                  source={{ uri: getMediaUrl(comment.author_avatar)! }} 
                                  style={styles.commentAvatarImage} 
                                />
                              ) : (
                                <Text style={styles.commentAvatarInitial}>
                                  {comment.author_username?.charAt(0)?.toUpperCase() || '?'}
                                </Text>
                              )}
                            </View>
                            <View style={styles.commentMeta}>
                              <Text style={styles.commentUsername}>@{comment.author_username}</Text>
                              <Text style={styles.commentTime}>
                                {formatRelativeTime(comment.created_at)}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.commentContent}>{comment.content}</Text>
                          {comment.reply_count > 0 && (
                            <Text style={styles.replyCount}>
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
                          <Text style={styles.showMoreCommentsText}>
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
                    hasApplied && styles.applyBtnDisabled,
                  ]}
                  onPress={openApplyModal}
                  disabled={hasApplied}
                >
                  <Text style={styles.applyBtnText}>
                    {hasApplied ? '✓ Applied' : 'Apply Now'}
                  </Text>
                </TouchableOpacity>
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
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.applyModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setApplyModalVisible(false)}
          />
          <View style={styles.applyModalContent}>
            <View style={styles.applyModalHeader}>
              <Text style={styles.applyModalTitle}>Apply to Job</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setApplyModalVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.applyModalBody}>
              <Text style={styles.applyJobTitle} numberOfLines={2}>{pap.title}</Text>
              <Text style={styles.applyInputLabel}>Your Message</Text>
              <TextInput
                style={styles.applicationInput}
                placeholder="Write a message to the job poster..."
                placeholderTextColor="#A0AEC0"
                value={applicationMessage}
                onChangeText={setApplicationMessage}
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={styles.applicationCharCount}>
                {applicationMessage.length}/1000
              </Text>
            </View>
            
            <View style={styles.applyModalFooter}>
              <TouchableOpacity
                style={styles.cancelApplyBtn}
                onPress={() => setApplyModalVisible(false)}
              >
                <Text style={styles.cancelApplyBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitApplyBtn, applying && styles.applyBtnDisabled]}
                onPress={handleSubmitApplication}
                disabled={applying}
              >
                {applying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitApplyBtnText}>Submit Application</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
});
