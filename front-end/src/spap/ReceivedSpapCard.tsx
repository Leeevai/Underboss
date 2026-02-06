import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getMediaUrl } from '../serve';
import type { ReceivedApplication } from '../cache/spaps';

interface ReceivedSpapCardProps {
  spap: ReceivedApplication;
  onAccept: (spapId: string) => Promise<void>;
  onReject: (spapId: string) => Promise<void>;
}

export default function ReceivedSpapCard({ spap, onAccept, onReject }: ReceivedSpapCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: '#FEF3C7', text: '#D97706' };
      case 'accepted': return { bg: '#C6F6D5', text: '#38A169' };
      case 'rejected': return { bg: '#FED7D7', text: '#E53E3E' };
      default: return { bg: '#EDF2F7', text: '#4A5568' };
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await onAccept(spap.id);
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await onReject(spap.id);
    } finally {
      setRejecting(false);
    }
  };

  const statusColors = getStatusColor(spap.status);
  const isPending = spap.status === 'pending';
  const applicantAvatar = spap.applicant_photo 
    ? getMediaUrl(spap.applicant_photo) 
    : null;

  return (
    <View style={styles.container}>
      {/* Header with status and date */}
      <View style={styles.cardHeader}>
        <View style={[styles.statusTag, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {spap.status.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.dateText}>{formatDate(spap.created_at)}</Text>
      </View>

      {/* Job title */}
      <Text style={styles.jobTitle}>{spap.paps_title}</Text>

      {/* Applicant info */}
      <View style={styles.applicantSection}>
        <Text style={styles.sectionLabel}>Applicant</Text>
        <View style={styles.applicantRow}>
          {applicantAvatar ? (
            <Image source={{ uri: applicantAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {(spap.applicant_display_name || spap.applicant_username || '?')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.applicantInfo}>
            <Text style={styles.applicantName}>
              {spap.applicant_display_name || spap.applicant_username}
            </Text>
            {spap.applicant_display_name && spap.applicant_username && (
              <Text style={styles.applicantUsername}>@{spap.applicant_username}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Message if provided */}
      {spap.message && (
        <View style={styles.messageSection}>
          <Text style={styles.sectionLabel}>Message</Text>
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{spap.message}</Text>
          </View>
        </View>
      )}

      {/* Action buttons for pending applications */}
      {isPending && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
            disabled={accepting || rejecting}
          >
            {rejecting ? (
              <ActivityIndicator size="small" color="#E53E3E" />
            ) : (
              <Text style={styles.rejectButtonText}>Reject</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
            disabled={accepting || rejecting}
          >
            {accepting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.acceptButtonText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Status message for non-pending */}
      {!isPending && (
        <View style={styles.statusMessage}>
          <Text style={[styles.statusMessageText, { color: statusColors.text }]}>
            {spap.status === 'accepted' 
              ? '✓ You accepted this application' 
              : '✗ You rejected this application'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    alignItems: 'center',
    marginBottom: 12,
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
  dateText: {
    fontSize: 12,
    color: '#718096',
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  applicantSection: {
    marginBottom: 16,
  },
  applicantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5A67D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  applicantInfo: {
    marginLeft: 12,
    flex: 1,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  applicantUsername: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
  },
  messageSection: {
    marginBottom: 16,
  },
  messageBox: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#5A67D8',
  },
  messageText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: '#FED7D7',
    borderWidth: 1,
    borderColor: '#FEB2B2',
  },
  rejectButtonText: {
    color: '#E53E3E',
    fontSize: 15,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#38A169',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  statusMessage: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusMessageText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
