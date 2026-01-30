import React, { useState, useEffect } from 'react';
import { Alert, Modal, View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { serv, getMediaUrl } from '../serve';
import type { Spap } from '../serve/spap';

// Get screen width for responsive design
const { width } = Dimensions.get('window')

interface SpapPosterProps {
  spap: Spap
}

export default function SpapPoster({ spap }: SpapPosterProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [papsDetail, setPapsDetail] = useState<any>(null);
  const [loadingPaps, setLoadingPaps] = useState(false);
  
  // Fetch PAPS details when modal opens
  useEffect(() => {
    const fetchPapsDetails = async () => {
      if (!modalVisible || papsDetail) return;
      
      setLoadingPaps(true);
      try {
        const details = await serv('paps.get', { paps_id: spap.paps_id });
        setPapsDetail(details);
      } catch (error: any) {
        console.error("Error fetching PAPS details:", error);
      } finally {
        setLoadingPaps(false);
      }
    };
    
    fetchPapsDetails();
  }, [modalVisible, spap.paps_id]);

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
      case 'pending': return { bg: '#FED7D7', text: '#C53030' };
      case 'accepted': return { bg: '#C6F6D5', text: '#38A169' };
      case 'rejected': return { bg: '#FEB2B2', text: '#E53E3E' };
      case 'withdrawn': return { bg: '#E2E8F0', text: '#718096' };
      default: return { bg: '#EDF2F7', text: '#4A5568' };
    }
  };

  const statusColors = getStatusColor(spap.status);
  
  return (
    <View id="global view for application" style={{ flexDirection: 'column' }}>
      <View style={{ flex: 1, backgroundColor: '#792c2c13' }}>
        <View style={styles.container}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusTag, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>{spap.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{spap.paps_title}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {spap.message || 'No message provided'}
            </Text>

            <View style={styles.cardMeta}>
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>📅</Text>
                <Text style={styles.metaText}>Applied {formatDate(spap.created_at)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>📋</Text>
                <Text style={styles.metaText}>ID: {spap.id.substring(0, 8)}...</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>💼</Text>
                <Text style={styles.metaText}>Job: {spap.paps_id.substring(0, 8)}...</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.footerText}>Status: {spap.status}</Text>
            <TouchableOpacity
              style={styles.detailsButton}
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
              <View style={styles.modalContent}>
                <SafeAreaView edges={['bottom', 'left', 'right']}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalHeaderTitle}>Application Details</Text>
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={styles.modalCloseButton}
                    >
                      <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
                    <View style={styles.modalTitleRow}>
                      <Text style={styles.modalJobTitle}>{spap.paps_title}</Text>
                      <View style={[styles.statusTagLarge, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.statusTextLarge, { color: statusColors.text }]}>{spap.status}</Text>
                      </View>
                    </View>

                    <View style={styles.infoBoxesRow}>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxIcon}>📅</Text>
                        <View>
                          <Text style={styles.infoBoxLabel}>Applied On</Text>
                          <Text style={styles.infoBoxValue}>{formatDate(spap.created_at)}</Text>
                        </View>
                      </View>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxIcon}>🔄</Text>
                        <View>
                          <Text style={styles.infoBoxLabel}>Updated</Text>
                          <Text style={styles.infoBoxValue}>{formatDate(spap.updated_at)}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.sectionTitle}>Application Message</Text>
                      <Text style={styles.sectionText}>
                        {spap.message || 'No message was included with this application.'}
                      </Text>
                    </View>

                    {loadingPaps ? (
                      <View style={styles.modalSection}>
                        <Text style={styles.sectionTitle}>Job Details</Text>
                        <Text style={styles.sectionText}>Loading job details...</Text>
                      </View>
                    ) : papsDetail ? (
                      <View style={styles.modalSection}>
                        <Text style={styles.sectionTitle}>Job Details</Text>
                        <View style={styles.jobDetailCard}>
                          <Text style={styles.jobDetailTitle}>{papsDetail.title}</Text>
                          <Text style={styles.jobDetailDescription} numberOfLines={3}>
                            {papsDetail.description}
                          </Text>
                          {papsDetail.payment_amount && (
                            <View style={styles.jobDetailRow}>
                              <Text style={styles.jobDetailLabel}>💰 Payment:</Text>
                              <Text style={styles.jobDetailValue}>
                                {papsDetail.payment_amount} {papsDetail.payment_currency}
                              </Text>
                            </View>
                          )}
                          {papsDetail.location_address && (
                            <View style={styles.jobDetailRow}>
                              <Text style={styles.jobDetailLabel}>📍 Location:</Text>
                              <Text style={styles.jobDetailValue}>{papsDetail.location_address}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ) : null}

                    <View style={styles.modalSection}>
                      <Text style={styles.sectionTitle}>Additional Information</Text>
                      <View style={styles.infoList}>
                        <View style={styles.infoListItem}>
                          <Text style={styles.infoListLabel}>Application ID</Text>
                          <Text style={styles.infoListValue}>{spap.id}</Text>
                        </View>
                        <View style={styles.infoListItem}>
                          <Text style={styles.infoListLabel}>Job ID</Text>
                          <Text style={styles.infoListValue}>{spap.paps_id}</Text>
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
                    <TouchableOpacity style={styles.actionBtn}>
                      <Text style={styles.actionBtnText}>View Job</Text>
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
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
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
  footerText: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  detailsButton: {
    backgroundColor: '#5A67D8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
})