/**
 * PapsApplicationsModal - Modal showing PAPS details with received applications
 * 
 * Displays job details & all applications received for that job with accept/reject actions
 * 
 * ASAP Media Upload:
 * When accepting an application, onAccept returns the new asap_id.
 * You can then use serv('asap.media.upload', { asap_id, files }) to upload media.
 * 
 * Example:
 * const handleAccept = async (spapId: string) => {
 *   const asapId = await acceptSpap(spapId);
 *   if (asapId && selectedMedia.length > 0) {
 *     await serv('asap.media.upload', { asap_id: asapId, files: selectedMedia });
 *   }
 * };
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import type { ReceivedApplication } from '../cache/spaps';
import type { MediaItem } from '../serve/common/types';
import { useTheme, BRAND, createShadow } from '../common/theme';
import { getMediaUrl, serv } from '../serve';

interface PapsApplicationsModalProps {
  visible: boolean;
  onClose: () => void;
  papsTitle: string;
  papsId: string;
  applications: ReceivedApplication[];
  onAccept: (spapId: string) => Promise<string | null>; // Returns asap_id
  onReject: (spapId: string) => Promise<void>;
}

export default function PapsApplicationsModal({
  visible,
  onClose,
  papsTitle,
  papsId,
  applications,
  onAccept,
  onReject,
}: PapsApplicationsModalProps) {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  
  // SPAP media state - map of spap_id to media items
  const [spapMediaMap, setSpapMediaMap] = useState<Record<string, MediaItem[]>>({});
  const [loadingMediaMap, setLoadingMediaMap] = useState<Record<string, boolean>>({});
  
  // Fetch SPAP media for all applications when modal opens
  useEffect(() => {
    if (!visible || applications.length === 0) return;
    
    const fetchAllMedia = async () => {
      for (const app of applications) {
        // Skip if already loaded
        if (spapMediaMap[app.id] !== undefined) continue;
        
        setLoadingMediaMap(prev => ({ ...prev, [app.id]: true }));
        try {
          const response = await serv('spap.media.list', { spap_id: app.id });
          setSpapMediaMap(prev => ({ ...prev, [app.id]: response?.media || [] }));
        } catch (err) {
          console.error('Failed to fetch SPAP media:', err);
          setSpapMediaMap(prev => ({ ...prev, [app.id]: [] }));
        } finally {
          setLoadingMediaMap(prev => ({ ...prev, [app.id]: false }));
        }
      }
    };
    
    fetchAllMedia();
  }, [visible, applications]);
  
  // Accept with media modal
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [selectedSpapForAccept, setSelectedSpapForAccept] = useState<ReceivedApplication | null>(null);
  const [acceptMedia, setAcceptMedia] = useState<Asset[]>([]);
  const [uploadingAcceptMedia, setUploadingAcceptMedia] = useState(false);

  const openAcceptModal = (spap: ReceivedApplication) => {
    setSelectedSpapForAccept(spap);
    setAcceptMedia([]);
    setAcceptModalVisible(true);
  };

  const pickAcceptMedia = async () => {
    if (acceptMedia.length >= 5) {
      Alert.alert('Limit Reached', 'Maximum 5 files allowed');
      return;
    }
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 5 - acceptMedia.length,
        quality: 0.8,
      });
      if (result.assets && result.assets.length > 0) {
        setAcceptMedia(prev => [...prev, ...result.assets!]);
      }
    } catch (err) {
      console.error('Failed to pick media:', err);
    }
  };

  const removeAcceptMedia = (index: number) => {
    setAcceptMedia(prev => prev.filter((_, i) => i !== index));
  };

  const confirmAccept = async () => {
    if (!selectedSpapForAccept) return;
    
    setAcceptingId(selectedSpapForAccept.id);
    try {
      const asapId = await onAccept(selectedSpapForAccept.id);
      
      // Upload media if any
      if (asapId && acceptMedia.length > 0) {
        setUploadingAcceptMedia(true);
        try {
          const files = acceptMedia
            .filter(asset => asset.uri)
            .map(asset => ({
              uri: asset.uri!,
              type: asset.type || 'image/jpeg',
              name: asset.fileName || `media_${Date.now()}.jpg`,
            }));
          
          if (files.length > 0) {
            await serv('asap.media.upload', { asap_id: asapId, files });
          }
        } catch (mediaError) {
          console.error('ASAP media upload failed:', mediaError);
          // Media upload failure is non-critical
        } finally {
          setUploadingAcceptMedia(false);
        }
      }
      
      setAcceptModalVisible(false);
      setSelectedSpapForAccept(null);
      setAcceptMedia([]);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleAccept = async (spapId: string, spap: ReceivedApplication) => {
    // Show modal for media attachment option
    openAcceptModal(spap);
  };

  const handleQuickAccept = async (spapId: string) => {
    setAcceptingId(spapId);
    try {
      await onAccept(spapId);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (spapId: string) => {
    setRejectingId(spapId);
    try {
      await onReject(spapId);
    } finally {
      setRejectingId(null);
    }
  };

  const pendingCount = applications.filter(app => app.status === 'pending').length;
  const acceptedCount = applications.filter(app => app.status === 'accepted').length;
  const rejectedCount = applications.filter(app => app.status === 'rejected').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#FEF3C7', text: '#D97706' };
      case 'accepted': return { bg: '#C6F6D5', text: '#38A169' };
      case 'rejected': return { bg: '#FED7D7', text: '#E53E3E' };
      default: return { bg: '#EDF2F7', text: '#4A5568' };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop - tap to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        
        {/* Modal Content */}
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.card }]} edges={['bottom']}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={[styles.modalDragIndicator, { backgroundColor: colors.border }]} />
              <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Applications</Text>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: colors.backgroundTertiary }]}
                onPress={onClose}
              >
                <Text style={[styles.modalCloseBtnText, { color: colors.textTertiary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Content - Scrollable */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {/* Job Title Section */}
              <View style={styles.titleSection}>
                <Text style={[styles.jobTitle, { color: colors.text }]}>{papsTitle}</Text>
              </View>

              {/* Stats Overview */}
              <View style={styles.statsRow}>
                <View style={[styles.statBox, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
                  <Text style={styles.statIcon}>📊</Text>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Total</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{applications.length}</Text>
                </View>
                
                <View style={[styles.statBox, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}>
                  <Text style={styles.statIcon}>⏳</Text>
                  <Text style={[styles.statLabel, { color: '#D97706' }]}>Pending</Text>
                  <Text style={[styles.statValue, { color: '#D97706' }]}>{pendingCount}</Text>
                </View>
                
                <View style={[styles.statBox, { backgroundColor: '#C6F6D5', borderColor: '#86EFAC' }]}>
                  <Text style={styles.statIcon}>✓</Text>
                  <Text style={[styles.statLabel, { color: '#38A169' }]}>Accepted</Text>
                  <Text style={[styles.statValue, { color: '#38A169' }]}>{acceptedCount}</Text>
                </View>
              </View>

              {/* Applications List */}
              <View style={styles.applicationsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Applications</Text>
                
                {applications.length === 0 ? (
                  <View style={styles.emptySection}>
                    <Text style={[styles.emptySectionText, { color: colors.textTertiary }]}>No applications yet</Text>
                  </View>
                ) : (
                  <View style={styles.applicationsList}>
                    {applications.map((app) => {
                      const statusColors = getStatusColor(app.status);
                      const isPending = app.status === 'pending';
                      const applicantAvatar = app.applicant_photo 
                        ? getMediaUrl(app.applicant_photo) 
                        : null;

                      return (
                        <View key={app.id} style={[styles.applicationCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                          {/* Card Header with Status */}
                          <View style={styles.appCardHeader}>
                            <View style={[styles.statusTag, { backgroundColor: statusColors.bg }]}>
                              <Text style={[styles.statusText, { color: statusColors.text }]}>
                                {app.status.toUpperCase()}
                              </Text>
                            </View>
                            <Text style={[styles.appDate, { color: colors.textSecondary }]}>
                              {formatDate(app.created_at)}
                            </Text>
                          </View>

                          {/* Applicant Info */}
                          <TouchableOpacity 
                            style={styles.applicantRow}
                            onPress={() => navigation.navigate('ProfilePage', { username: app.applicant_username })}
                            activeOpacity={0.7}
                          >
                            {applicantAvatar ? (
                              <Image source={{ uri: applicantAvatar }} style={styles.applicantAvatar} />
                            ) : (
                              <View style={[styles.applicantAvatarPlaceholder, { backgroundColor: BRAND.primary }]}>
                                <Text style={styles.applicantAvatarText}>
                                  {(app.applicant_display_name || app.applicant_username || '?')[0].toUpperCase()}
                                </Text>
                              </View>
                            )}
                            <View style={styles.applicantInfo}>
                              <Text style={[styles.applicantName, { color: colors.text }]}>
                                {app.applicant_display_name || app.applicant_username}
                              </Text>
                              {app.applicant_username && (
                                <Text style={[styles.applicantUsername, { color: colors.textSecondary }]}>
                                  @{app.applicant_username}
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>

                          {/* Message */}
                          {app.message && (
                            <View style={styles.messageSection}>
                              <Text style={[styles.messageLabel, { color: colors.textSecondary }]}>Message</Text>
                              <Text style={[styles.messageText, { color: colors.textSecondary }]}>
                                {app.message}
                              </Text>
                            </View>
                          )}

                          {/* Attached Media */}
                          {(loadingMediaMap[app.id] || (spapMediaMap[app.id] && spapMediaMap[app.id].length > 0)) && (
                            <View style={styles.appMediaSection}>
                              <Text style={[styles.messageLabel, { color: colors.textSecondary }]}>
                                Attached Media {spapMediaMap[app.id]?.length ? `(${spapMediaMap[app.id].length})` : ''}
                              </Text>
                              {loadingMediaMap[app.id] ? (
                                <ActivityIndicator size="small" color={BRAND.primary} style={{ marginTop: 8 }} />
                              ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.appMediaScroll}>
                                  {spapMediaMap[app.id]?.map((media, idx) => (
                                    <Image
                                      key={media.media_id || idx}
                                      source={{ uri: getMediaUrl(media.media_url) }}
                                      style={styles.appMediaThumb}
                                      resizeMode="cover"
                                    />
                                  ))}
                                </ScrollView>
                              )}
                            </View>
                          )}

                          {/* Action Buttons */}
                          {isPending ? (
                            <View style={styles.actionButtons}>
                              <TouchableOpacity
                                style={[styles.rejectBtn, { borderColor: BRAND.error }]}
                                onPress={() => handleReject(app.id)}
                                disabled={acceptingId === app.id || rejectingId === app.id}
                              >
                                {rejectingId === app.id ? (
                                  <ActivityIndicator size="small" color={BRAND.error} />
                                ) : (
                                  <Text style={[styles.rejectBtnText, { color: BRAND.error }]}>Reject</Text>
                                )}
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.acceptBtn, { backgroundColor: BRAND.accent }]}
                                onPress={() => handleAccept(app.id, app)}
                                disabled={acceptingId === app.id || rejectingId === app.id}
                              >
                                {acceptingId === app.id ? (
                                  <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                  <Text style={styles.acceptBtnText}>Accept</Text>
                                )}
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={[styles.statusMessage, { backgroundColor: statusColors.bg }]}>
                              <Text style={[styles.statusMessageText, { color: statusColors.text }]}>
                                {app.status === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Bottom spacing */}
              <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Footer Actions */}
            <View style={[styles.modalFooter, { backgroundColor: colors.backgroundTertiary, borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>

      {/* Accept with Media Modal */}
      <Modal
        visible={acceptModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAcceptModalVisible(false)}
      >
        <View style={styles.acceptModalOverlay}>
          <View style={[styles.acceptModalBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.acceptModalTitle, { color: colors.text }]}>Accept Application</Text>
            
            {selectedSpapForAccept && (
              <Text style={[styles.acceptModalSubtitle, { color: colors.textSecondary }]}>
                Accept {selectedSpapForAccept.applicant_display_name || selectedSpapForAccept.applicant_username}?
              </Text>
            )}

            {/* Media Section */}
            <View style={styles.acceptMediaSection}>
              <Text style={[styles.acceptMediaLabel, { color: colors.textSecondary }]}>
                Attach media (optional)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.acceptMediaScroll}>
                {acceptMedia.map((asset, index) => (
                  <View key={index} style={styles.acceptMediaItem}>
                    <Image source={{ uri: asset.uri }} style={styles.acceptMediaThumb} />
                    <TouchableOpacity
                      style={styles.acceptMediaRemove}
                      onPress={() => removeAcceptMedia(index)}
                    >
                      <Text style={styles.acceptMediaRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {acceptMedia.length < 5 && (
                  <TouchableOpacity
                    style={[styles.acceptMediaAdd, { borderColor: colors.border }]}
                    onPress={pickAcceptMedia}
                  >
                    <Text style={[styles.acceptMediaAddText, { color: colors.textTertiary }]}>+</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>

            {/* Buttons */}
            <View style={styles.acceptModalButtons}>
              <TouchableOpacity
                style={[styles.acceptModalCancelBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setAcceptModalVisible(false);
                  setSelectedSpapForAccept(null);
                  setAcceptMedia([]);
                }}
              >
                <Text style={[styles.acceptModalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.acceptModalConfirmBtn, { backgroundColor: BRAND.accent }]}
                onPress={confirmAccept}
                disabled={acceptingId !== null || uploadingAcceptMedia}
              >
                {acceptingId !== null || uploadingAcceptMedia ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.acceptModalConfirmText}>
                    {acceptMedia.length > 0 ? `Accept (${acceptMedia.length})` : 'Accept'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  
  // Title Section
  titleSection: {
    marginBottom: 24,
  },
  jobTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
    lineHeight: 36,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10,
    color: '#718096',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D3748',
  },

  // Applications Section
  applicationsSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 14,
  },
  emptySection: {
    padding: 32,
    alignItems: 'center',
  },
  emptySectionText: {
    fontSize: 14,
    color: '#718096',
  },
  applicationsList: {
    gap: 12,
  },
  applicationCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  appCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  appDate: {
    fontSize: 12,
    color: '#718096',
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  applicantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  applicantAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applicantAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  applicantInfo: {
    marginLeft: 10,
    flex: 1,
  },
  applicantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  applicantUsername: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  messageSection: {
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 18,
  },
  appMediaSection: {
    marginBottom: 12,
  },
  appMediaScroll: {
    marginTop: 8,
  },
  appMediaThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#E2E8F0',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E53E3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E53E3E',
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#38A169',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  statusMessage: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusMessageText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },

  // Footer
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
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

  // Accept with Media Modal
  acceptModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  acceptModalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 20,
  },
  acceptModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  acceptModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  acceptMediaSection: {
    marginBottom: 20,
  },
  acceptMediaLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  acceptMediaScroll: {
    flexDirection: 'row',
  },
  acceptMediaItem: {
    position: 'relative',
    marginRight: 8,
  },
  acceptMediaThumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  acceptMediaRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E53E3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptMediaRemoveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  acceptMediaAdd: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptMediaAddText: {
    fontSize: 24,
  },
  acceptModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptModalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  acceptModalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  acceptModalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptModalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
