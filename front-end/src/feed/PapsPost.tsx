import React, { useState,useEffect } from 'react';
import { Alert, Modal, View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Pressable, ScrollView, FlatList } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { serv, getMediaUrl,PapsDetail,MediaItem } from '../serve';
import type { Paps } from '../serve/paps';


// Get screen width for full-width images
const { width } = Dimensions.get('window')

interface PapsPostProps {
  pap: Paps
}


export default function PapsPost({ pap }: PapsPostProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [papsDetail, setPapsDetail] = useState<any>(null);
  const [papsMedia, setPapsMedia] = useState<MediaItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!pap.owner_username) return;
  
      try {
        // Fetch user profile to get avatar_url
        const profile = await serv('profile.getByUsername', { username: pap.owner_username });
        
        // Convert media path to full URL
        const mediaUrl = getMediaUrl(profile.avatar_url);
        setAvatarUri(mediaUrl); // React Native Image component handles the fetch
        
      } catch (error: any) {
        // Silently handle 404 errors (user has no avatar/profile)
        if (error?.status !== 404) {
          console.error("Error fetching avatar:", error);
        }
        setAvatarUri(null); // Fallback to initials
      }
    };
  
    fetchAvatar();
  }, [pap.owner_username]);

  // Fetch full PAPS details when modal opens
  useEffect(() => {
    const fetchPapsDetails = async () => {
      if (!modalVisible) return;
      
      if (!pap.id) {
        console.error("No id available:", pap);
        return;
      }
      
      setLoadingDetail(true);
      try {
        console.log("Fetching PAPS details for ID:", pap.id);
        const details = await serv('paps.get', { paps_id: pap.id });
        setPapsDetail(details);
      } catch (error: any) {
        console.error("Error fetching PAPS details:", error);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchPapsDetails();
    fetchPapsMedia();
  }, [modalVisible, pap.id]);

  const fetchPapsMedia = async () => {
    if (!pap.id) return;
    serv('paps.media.list', { paps_id: pap.id })
      .then((response) => {
        setPapsMedia(response.media || []);
      })
      .catch((error) => {
        console.error("Error fetching PAPS media:", error);
      });
  };
  // Handle apply for job
  const handleApply = async () => {
    setApplying(true);
    try {
      await serv('spap.apply', { 
        paps_id: pap.id,
        message: 'I am interested in this job opportunity.'
      });
      setHasApplied(true);
      Alert.alert(
        'Success',
        'Your application has been submitted successfully!',
        [{ text: 'OK', onPress: () => setModalVisible(false) }]
      );
    } catch (error: any) {
      console.error('Error applying to job:', error);
      Alert.alert(
        'Error',
        error.getUserMessage ? error.getUserMessage() : 'Failed to submit application. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setApplying(false);
    }
  };
  
  return (
    <View id="global view for post" style={{ flexDirection: 'column' }}>
      <View style={{ flex: 1, backgroundColor: '#792c2c13' }}>
        <View style={styles.container}>
          <View style={styles.cardHeader}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>Put here the category</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{pap.title}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {pap.description}
            </Text>

            <View style={styles.cardMeta}>
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={styles.metaText}>{pap.location_address}</Text>
                <Text></Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>🕒</Text>
                <Text style={styles.metaText}>{'To be decided with the boss'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>💰</Text>
                <Text style={styles.metaText}>{pap.payment_amount} {pap.payment_currency}</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.footerUser}>User @{pap.owner_username}</Text>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                console.log('Opening modal for pap:', pap.id);
                setModalVisible(true);
              }}
            >
              <Text style={styles.applyButtonText}>More info</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={{ flex: 2 }}></View>

      {/* Modal for more info - moved outside the card container */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        presentationStyle="overFullScreen"
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
                <SafeAreaView edges={['bottom', 'left', 'right']}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalHeaderTitle}>Job details</Text>
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={styles.modalCloseButton}
                    >
                      <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                    <View style={styles.modalTitleRow}>
                      <Text style={styles.modalJobTitle}>{pap.title}</Text>
                      {pap.categories && pap.categories.length > 0 && (
                        <View style={styles.categoryTagSmall}>
                          <Text style={styles.categoryTextSmall}>
                            {typeof pap.categories[0] === 'string' 
                              ? pap.categories[0] 
                              : pap.categories[0].name || pap.categories[0]?.category_id || 'Category??'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.postedTimeRow}>
                      <Text style={styles.postedTimeText}>🕒 Posted {pap.publish_at ? new Date(pap.publish_at).toLocaleDateString() : 'Unknown'}</Text>
                    </View>

                    {/* Medias */}
                    {papsMedia.length > 0 ? (
                      <View style={{ marginBottom: 24, padding:10, backgroundColor:'#d4e3e4'}}>
                        <FlatList
                          data={papsMedia}
                          keyExtractor={(item, index) => item.media_id.toString() || `media-${index}`}
                          horizontal
                          showsHorizontalScrollIndicator={true}
                          renderItem={({ item }) => {
                            const mediaUrl = getMediaUrl(item.media_url);
                            console.log("\n\n\nRendering media item:", item.media_url);
                            if (item.media_type === 'image' && mediaUrl) {
                              return (
                                <Image
                                  source={{ uri: mediaUrl }}
                                  style={{ width: 300, height: 300, borderRadius: 12, marginRight: 12 }}
                                  resizeMode="cover"
                                />
                                
                              );
                            } else if (item.media_type === 'video') {
                              return (
                                <View style={{ width: 300, height: 300, borderRadius: 12, marginRight: 12, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }}>
                                  <Text>Video</Text>
                                </View>
                              );
                            } else if (item.media_type === 'document') {
                              return (
                                <View style={{ width: 300, height: 300, borderRadius: 12, marginRight: 12, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }}>
                                  <Text>PDF</Text>
                                </View>
                              );
                            } else {
                              return null;
                            }
                          }}
                        />
                      </View>
                    ) : null}

                    <View style={styles.infoBoxesRow}>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxIcon}>💰</Text>
                        <View>
                          <Text style={styles.infoBoxLabel}>Payment</Text>
                          <Text style={styles.infoBoxValue}>{pap.payment_amount || 'TBD'} {pap.payment_currency}</Text>
                        </View>
                      </View>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxIcon}>🕒</Text>
                        <View>
                          <Text style={styles.infoBoxLabel}>Starting day</Text>
                          <Text style={styles.infoBoxValue}>To be decided</Text>
                        </View>
                      </View>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxIcon}>📍</Text>
                        <Text></Text>
                        <View>
                          <Text style={styles.infoBoxLabel}>Location</Text>
                          <Text style={styles.infoBoxValue} numberOfLines={2}>{pap.location_address || 'Remote'}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.sectionTitle}>Description</Text>
                      <Text style={styles.sectionText}>{pap.description}</Text>
                    </View>

                    {loadingDetail ? (
                      <View style={styles.modalSection}>
                        <Text style={styles.sectionText}>Loading additional details...</Text>
                      </View>
                    ) : papsDetail ? (
                      <>
                        {papsDetail.schedule && papsDetail.schedule.length > 0 && (
                          <View style={styles.modalSection}>
                            <Text style={styles.sectionTitle}>Schedule</Text>
                            {papsDetail.schedule.map((sched: any, idx: number) => (
                              <View key={idx} style={styles.scheduleItem}>
                                <Text style={styles.sectionText}>
                                  {new Date(sched.start_time).toLocaleString()} - {new Date(sched.end_time).toLocaleString()}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                        
                        {papsDetail.media && papsDetail.media.length > 0 && (
                          <View style={styles.modalSection}>
                            <Text style={styles.sectionTitle}>Media ({papsDetail.media.length})</Text>
                            <Text style={styles.sectionText}>This job has {papsDetail.media.length} attached media file(s)</Text>
                          </View>
                        )}
                      </>
                    ) : null}

                    <View style={styles.modalSection}>
                      <Text style={styles.sectionTitle}>Posted by</Text>
                      <View style={styles.postedByCard}>
                        <View style={styles.avatarCircle}>
                          {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                          ) : (
                            <Text style={styles.avatarInitial}>
                              {pap.owner_username.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={styles.postedByInfo}>
                          <Text style={styles.postedByName}>{pap.owner_username}</Text>
                          <Text style={styles.postedByStats}></Text>
                        </View>
                        <TouchableOpacity style={styles.viewProfileButton}>
                          <Text style={styles.viewProfileText}>View profile</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.sectionTitle}>Additional information</Text>
                      <View style={styles.infoList}>
                        <View style={styles.infoListItem}>
                          <Text style={styles.infoListLabel}>Job ID</Text>
                          <Text style={styles.infoListValue}>{pap.id}</Text>
                        </View>
                        <View style={styles.infoListItem}>
                          <Text style={styles.infoListLabel}>Status</Text>
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>{pap.status}</Text>
                          </View>
                        </View>
                        {papsDetail && (
                          <>
                            <View style={styles.infoListItem}>
                              <Text style={styles.infoListLabel}>Applications</Text>
                              <Text style={styles.infoListValue}>{papsDetail.application_count || 0}</Text>
                            </View>
                            <View style={styles.infoListItem}>
                              <Text style={styles.infoListLabel}>Assignments</Text>
                              <Text style={styles.infoListValue}>{papsDetail.assignment_count || 0}</Text>
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  </ScrollView>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      style={styles.closeActionBtn}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.closeActionBtnText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.applyActionBtn, (applying || hasApplied) && styles.applyActionBtnDisabled]}
                      onPress={handleApply}
                      disabled={applying || hasApplied}
                    >
                      <Text style={styles.applyActionBtnText}>
                        {hasApplied ? '✓ Applied' : applying ? 'Applying...' : 'Apply for this job'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </SafeAreaView>
              </Pressable>
            </Pressable>
          </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    marginVertical: 8,
    width: 280,
    height: 300,
    borderWidth: 1,
    borderColor: '#F0F4F8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: '#E6F6F4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#38A19F',
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 12,
    color: '#718096',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardMeta: {
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaIcon: {
    fontSize: 14,
  },
  metaText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F7FAFC',
  },
  footerUser: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#3182CE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
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
    padding: 30,

  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modalJobTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A202C',
    flex: 1,
    marginRight: 10,
  },
  categoryTagSmall: {
    backgroundColor: '#E6F6F4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryTextSmall: {
    color: '#38A19F',
    fontSize: 10,
    fontWeight: '700',
  },
  postedTimeRow: {
    marginBottom: 20,
  },
  postedTimeText: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  infoBoxesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#E6F6F4',
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
  postedByCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F6F4',
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
  postedByInfo: {
    flex: 1,
  },
  postedByName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2D3748',
  },
  postedByStats: {
    fontSize: 12,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3748',
  },
  statusBadge: {
    backgroundColor: '#C6F6D5',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#38A169',
    fontSize: 12,
    fontWeight: '700',
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
  applyActionBtn: {
    flex: 1.5,
    backgroundColor: '#3182CE',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyActionBtnDisabled: {
    backgroundColor: '#A0AEC0',
  },
  applyActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  scheduleItem: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
})