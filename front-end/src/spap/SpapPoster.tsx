import React, { useState, useEffect } from 'react';
import { Alert, Modal, View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { serv, getMediaUrl, ApiError } from '../serve';
import type { Spap } from '../serve/spap';
import type { MediaItem } from '../serve/common/types';
import { useTheme, BRAND } from '../common/theme';
import { removeThreadFromCacheImperative } from '../cache/chats';

// Get screen width for responsive design
const { width } = Dimensions.get('window')

interface SpapPosterProps {
  spap: Spap;
  onWithdraw?: (spapId: string) => void;
}

export default function SpapPoster({ spap, onWithdraw }: SpapPosterProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [modalVisible, setModalVisible] = useState(false);
  const [papsDetail, setPapsDetail] = useState<any>(null);
  const [loadingPaps, setLoadingPaps] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  
  // SPAP media state
  const [spapMedia, setSpapMedia] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  
  // Fetch PAPS details and SPAP media when modal opens
  useEffect(() => {
    const fetchData = async () => {
      if (!modalVisible) return;
      
      // Fetch PAPS details
      if (!papsDetail) {
        setLoadingPaps(true);
        try {
          const details = await serv('paps.get', { paps_id: spap.paps_id });
          setPapsDetail(details);
        } catch (error: any) {
          console.error("Error fetching PAPS details:", error);
        } finally {
          setLoadingPaps(false);
        }
      }
      
      // Fetch SPAP media
      if (spapMedia.length === 0) {
        setLoadingMedia(true);
        try {
          const mediaResponse = await serv('spap.media.list', { spap_id: spap.id });
          if (mediaResponse?.media) {
            setSpapMedia(mediaResponse.media);
          }
        } catch (error: any) {
          console.error("Error fetching SPAP media:", error);
        } finally {
          setLoadingMedia(false);
        }
      }
    };
    
    fetchData();
  }, [modalVisible, spap.paps_id, spap.id]);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Status color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#FEF3C7', text: '#D97706' };
      case 'accepted': return { bg: '#C6F6D5', text: '#38A169' };
      case 'rejected': return { bg: '#FED7D7', text: '#E53E3E' };
      case 'withdrawn': return { bg: '#E2E8F0', text: '#718096' };
      default: return { bg: '#EDF2F7', text: '#4A5568' };
    }
  };

  // Handle withdraw application
  const handleWithdraw = async () => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw this application? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            setWithdrawing(true);
            try {
              const response = await serv('spap.withdraw', { spap_id: spap.id });
              // Remove the deleted chat thread from cache
              if (response?.deleted_thread_id) {
                removeThreadFromCacheImperative(response.deleted_thread_id);
              }
              setModalVisible(false);
              onWithdraw?.(spap.id);
            } catch (err) {
              const message = err instanceof ApiError ? err.getUserMessage() : 'Failed to withdraw application';
              Alert.alert('Error', message);
            } finally {
              setWithdrawing(false);
            }
          },
        },
      ]
    );
  };

  const canWithdraw = spap.status === 'pending';

  const statusColors = getStatusColor(spap.status);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusTag, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>{spap.status.toUpperCase()}</Text>
        </View>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(spap.created_at)}</Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{spap.paps_title}</Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {spap.message || 'No message provided'}
        </Text>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        {canWithdraw && (
          <TouchableOpacity
            style={styles.quickWithdrawBtn}
            onPress={handleWithdraw}
            disabled={withdrawing}
          >
            {withdrawing ? (
              <ActivityIndicator size="small" color={BRAND.error} />
            ) : (
              <Text style={[styles.quickWithdrawText, { color: BRAND.error }]}>Withdraw</Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.detailsButton, { backgroundColor: BRAND.primary }, canWithdraw && { flex: 1 }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for more info */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Application Details</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[styles.modalCloseButton, { backgroundColor: colors.inputBg }]}
                >
                  <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalTitleRow}>
                  <Text style={[styles.modalJobTitle, { color: colors.text }]}>{spap.paps_title}</Text>
                  <View style={[styles.statusTagLarge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusTextLarge, { color: statusColors.text }]}>{spap.status}</Text>
                  </View>
                </View>

                <View style={styles.infoBoxesRow}>
                  <View style={[styles.infoBox, { backgroundColor: colors.inputBg }]}>
                    <Text style={styles.infoBoxIcon}>📅</Text>
                    <View>
                      <Text style={[styles.infoBoxLabel, { color: colors.textSecondary }]}>Applied On</Text>
                      <Text style={[styles.infoBoxValue, { color: colors.text }]}>{formatDate(spap.created_at)}</Text>
                    </View>
                  </View>
                  <View style={[styles.infoBox, { backgroundColor: colors.inputBg }]}>
                    <Text style={styles.infoBoxIcon}>🔄</Text>
                    <View>
                      <Text style={[styles.infoBoxLabel, { color: colors.textSecondary }]}>Updated</Text>
                      <Text style={[styles.infoBoxValue, { color: colors.text }]}>{formatDate(spap.updated_at)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Application Message</Text>
                  <Text style={[styles.sectionText, { color: colors.text }]}>
                    {spap.message || 'No message was included with this application.'}
                  </Text>
                </View>

                {/* Application Media */}
                {(loadingMedia || spapMedia.length > 0) && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                      Attached Media {spapMedia.length > 0 && `(${spapMedia.length})`}
                    </Text>
                    {loadingMedia ? (
                      <ActivityIndicator size="small" color={BRAND.primary} />
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
                        {spapMedia.map((media, index) => (
                          <View key={media.media_id || index} style={styles.mediaItem}>
                            <Image
                              source={{ uri: getMediaUrl(media.media_url) }}
                              style={styles.mediaThumb}
                              resizeMode="cover"
                            />
                            <Text style={[styles.mediaType, { color: colors.textSecondary }]}>
                              {media.media_type || 'Image'}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}

                {loadingPaps ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Job Details</Text>
                    <Text style={[styles.sectionText, { color: colors.text }]}>Loading job details...</Text>
                  </View>
                ) : papsDetail ? (
                  <View style={styles.modalSection}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Job Details</Text>
                    <View style={[styles.jobDetailCard, { backgroundColor: colors.inputBg }]}>
                      <Text style={[styles.jobDetailTitle, { color: colors.text }]}>{papsDetail.title}</Text>
                      <Text style={[styles.jobDetailDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                        {papsDetail.description}
                      </Text>
                      {papsDetail.owner_username && (
                        <TouchableOpacity 
                          style={styles.jobDetailRow}
                          onPress={() => {
                            setModalVisible(false);
                            navigation.navigate('ProfilePage', { username: papsDetail.owner_username });
                          }}
                        >
                          <Text style={[styles.jobDetailLabel, { color: colors.textSecondary }]}>👤 Posted by:</Text>
                          <Text style={[styles.jobDetailValue, { color: BRAND.primary }]}>@{papsDetail.owner_username}</Text>
                        </TouchableOpacity>
                      )}
                      {papsDetail.payment_amount && (
                        <View style={styles.jobDetailRow}>
                          <Text style={[styles.jobDetailLabel, { color: colors.textSecondary }]}>💰 Payment:</Text>
                          <Text style={[styles.jobDetailValue, { color: colors.text }]}>
                            {papsDetail.payment_amount} {papsDetail.payment_currency}
                            {papsDetail.payment_type === 'hourly' ? '/hr' : ''}
                          </Text>
                        </View>
                      )}
                      {papsDetail.location_address && (
                        <View style={styles.jobDetailRow}>
                          <Text style={[styles.jobDetailLabel, { color: colors.textSecondary }]}>📍 Location:</Text>
                          <Text style={[styles.jobDetailValue, { color: colors.text }]}>{papsDetail.location_address}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) : null}

                <View style={styles.modalSection}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Additional Information</Text>
                  <View style={[styles.infoList, { borderColor: colors.border }]}>
                    <View style={[styles.infoListItem, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.infoListLabel, { color: colors.textSecondary }]}>Application ID</Text>
                      <Text style={[styles.infoListValue, { color: colors.text }]}>{spap.id}</Text>
                    </View>
                    <View style={styles.infoListItem}>
                      <Text style={[styles.infoListLabel, { color: colors.textSecondary }]}>Job ID</Text>
                      <Text style={[styles.infoListValue, { color: colors.text }]}>{spap.paps_id}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                {canWithdraw && (
                  <TouchableOpacity
                    style={[styles.withdrawBtn, withdrawing && styles.btnDisabled]}
                    onPress={handleWithdraw}
                    disabled={withdrawing}
                  >
                    {withdrawing ? (
                      <ActivityIndicator size="small" color={BRAND.error} />
                    ) : (
                      <Text style={[styles.withdrawBtnText, { color: BRAND.error }]}>Withdraw</Text>
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.closeActionBtn, { backgroundColor: colors.inputBg }, !canWithdraw && { flex: 1 }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.closeActionBtnText, { color: colors.text }]}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: BRAND.primary }]}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('Main', { screen: 'Home' });
                  }}
                >
                  <Text style={styles.actionBtnText}>View Job</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  cardBody: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
  },
  quickWithdrawBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7D7',
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
  },
  quickWithdrawText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E53E3E',
  },
  detailsButton: {
    backgroundColor: '#5A67D8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D3748',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#A0AEC0',
    fontWeight: '300',
  },
  modalScrollBody: {
    padding: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalJobTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A202C',
    flex: 1,
    marginRight: 10,
  },
  statusTagLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusTextLarge: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoBoxesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoBoxIcon: {
    fontSize: 16,
  },
  infoBoxLabel: {
    fontSize: 10,
    color: '#718096',
    fontWeight: '500',
  },
  infoBoxValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D3748',
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D3748',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 22,
  },
  applicantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#A0AEC0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D3748',
  },
  applicantId: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
  viewProfileButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D3748',
  },
  infoList: {
    gap: 12,
  },
  infoListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  infoListLabel: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  infoListValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
    textAlign: 'right',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  closeActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  closeActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A5568',
  },
  withdrawBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7D7',
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
  },
  withdrawBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E53E3E',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  actionBtn: {
    flex: 1.5,
    backgroundColor: '#5A67D8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  jobDetailCard: {
    backgroundColor: '#F7FAFC',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  jobDetailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2D3748',
  },
  jobDetailDescription: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  jobDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobDetailLabel: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '600',
  },
  jobDetailValue: {
    fontSize: 13,
    color: '#2D3748',
    fontWeight: '700',
    flex: 1,
  },
  
  // Media styles
  mediaScroll: {
    marginTop: 8,
  },
  mediaItem: {
    marginRight: 12,
    alignItems: 'center',
  },
  mediaThumb: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  mediaType: {
    fontSize: 11,
    marginTop: 4,
    textTransform: 'capitalize',
  },
})