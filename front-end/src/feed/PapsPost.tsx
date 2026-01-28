import React, { useState } from 'react';
import { Alert, Modal, View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Pressable, ScrollView } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';


// Get screen width for full-width images
const { width } = Dimensions.get('window')

interface Pap {
  created_at: string // RFC 1123 date string
  description: string

  distance_km: number | null
  end_datetime: string | null
  estimated_duration_minutes: number | null
  expires_at: string | null

  id: string
  interest_match_score: number
  is_public: boolean

  location_address: string | null
  location_lat: number | null
  location_lng: number | null
  location_timezone: string | null

  max_applicants: number | null
  max_assignees: number | null

  owner_avatar: string | null
  owner_email: string | null
  owner_id: string
  owner_name: string | null
  owner_username: string | null

  payment_amount: number | null
  payment_currency: string
  payment_type: 'hourly' | 'fixed' | string

  publish_at: string
  start_datetime: string | null

  status: string
  subtitle: string
  title: string

  updated_at: string | null
  // Add other fields if returned by API
}

interface PapsPostProps {
  pap: Pap
}

export default function PapsPost({ pap }: PapsPostProps) {
  // Use first image or a placeholder
  const imageUrl = pap.media_urls && pap.media_urls.length > 0
    ? pap.media_urls[0].media_url
    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjBGMEYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <View style={{ flexDirection: 'column' }}>
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
              {pap.subtitle||pap.description}
            </Text>

            <View style={styles.cardMeta}>
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={styles.metaText}>{pap.location_address}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>🕒</Text>
                <Text style={styles.metaText}>{pap.start_datetime || 'To be decided with the boss'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>💰</Text>
                <Text style={styles.metaText}>{pap.payment_amount} {pap.payment_currency} {pap.payment_type} </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.footerUser}>User @{pap.owner_username}</Text>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
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
              <View style={styles.modalContent}>
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
                      <View style={styles.categoryTagSmall}>
                        <Text style={styles.categoryTextSmall}>Moving</Text>
                      </View>
                    </View>
            
                    <View style={styles.postedTimeRow}>
                       <Text style={styles.cardDescription} numberOfLines={2}>{pap.subtitle}</Text>
                      <Text style={styles.postedTimeText}>🕒 Posted the {pap.publish_at||'Unkown'}</Text>
                      
                    </View>
                  

                    <View style={styles.infoBoxesRow}>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxIcon}>💰</Text>
                        <View>
                          <Text style={styles.infoBoxLabel}>Payment</Text>
                          <Text style={styles.infoBoxValue}>€{pap.payment_amount || ''}</Text>
                        </View>
                      </View>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxIcon}>🕒</Text>
                        <View>
                          <Text style={styles.infoBoxLabel}>Staring day</Text>
                          <Text style={styles.infoBoxValue}>{pap.start_datetime || 'To be decided with the boss'}</Text>
                        </View>
                      </View>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxIcon}>📍</Text>
                        <View>
                          <Text style={styles.infoBoxLabel}>{pap.location_address}</Text>
                          <Text style={styles.infoBoxValue} numberOfLines={2}>{pap.location_address}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.sectionTitle}>Description</Text>
                      <Text style={styles.sectionText}>{pap.description}</Text>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.sectionTitle}>Posted by</Text>
                      <View style={styles.postedByCard}>
                        <View style={styles.avatarCircle}>
                          {pap.owner_avatar ? (
                            <Image source={{ uri: pap.owner_avatar }} style={styles.avatarImage} />
                          ) : (
                            <Text style={styles.avatarInitial}>
                              {pap.owner_username ? pap.owner_username.charAt(0).toUpperCase() : '?'}
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
                        <View style={styles.infoListItem}>
                          <Text style={styles.infoListLabel}>Numbers of workers</Text>
                          <Text style={styles.infoListValue}>{pap.max_assignees}</Text>
                        </View>
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
                    <TouchableOpacity style={styles.applyActionBtn}>
                      <Text style={styles.applyActionBtnText}>Apply for this job</Text>
                    </TouchableOpacity>
                  </View>
                </SafeAreaView>
              </View>
            </View>
          </Modal>
        </View>
      </View>
      <View style={{ flex: 2 }}></View>
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
  applyActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
})