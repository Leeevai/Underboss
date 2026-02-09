/**
 * PapsApplicationsModal - Modal showing PAPS details with received applications
 * 
 * Displays job details & all applications received for that job with accept/reject actions
 */

import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { ReceivedApplication } from '../cache/spaps';
import { useTheme, BRAND, createShadow } from '../common/theme';
import { getMediaUrl } from '../serve';

interface PapsApplicationsModalProps {
  visible: boolean;
  onClose: () => void;
  papsTitle: string;
  papsId: string;
  applications: ReceivedApplication[];
  onAccept: (spapId: string) => Promise<void>;
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

  const handleAccept = async (spapId: string) => {
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
                                onPress={() => handleAccept(app.id)}
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
});
