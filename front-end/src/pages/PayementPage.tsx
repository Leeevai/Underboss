import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import UnderbossBar from '../header/underbossbar';
import { useTheme, SPACING, FONT_SIZE, FONT_WEIGHT, BRAND } from '../common/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePayments } from '../cache';
import type { Payment } from '../serve/payments';

// =============================================================================
// TYPES
// =============================================================================

type TabType = 'all' | 'pending' | 'completed';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return { bg: '#FEEBC8', text: '#DD6B20' };
    case 'processing':
      return { bg: '#BEE3F8', text: '#3182CE' };
    case 'completed':
      return { bg: '#C6F6D5', text: '#38A169' };
    case 'failed':
    case 'cancelled':
      return { bg: '#FED7D7', text: '#E53E3E' };
    case 'refunded':
      return { bg: '#E9D8FD', text: '#805AD5' };
    default:
      return { bg: '#EDF2F7', text: '#4A5568' };
  }
};

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function PaymentPage() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const {
    allPayments,
    sentPayments,
    receivedPayments,
    pending,
    completed,
    totalReceived,
    totalSent,
    loading,
    error,
    refresh,
  } = usePayments();

  // Fetch payments on mount
  useEffect(() => {
    refresh();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh(true);
    setRefreshing(false);
  };

  // Get filtered payments based on active tab
  const getFilteredPayments = (): Payment[] => {
    switch (activeTab) {
      case 'pending':
        return pending;
      case 'completed':
        return completed;
      default:
        return allPayments;
    }
  };

  const filteredPayments = getFilteredPayments();

  // Render payment card
  const renderPaymentCard = ({ item }: { item: Payment }) => {
    const statusColors = getStatusColor(item.status);
    const isReceived = item.user_role === 'payee';

    return (
      <View style={[styles.paymentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.roleIndicator, { backgroundColor: isReceived ? '#C6F6D5' : '#FED7D7' }]}>
            <Text style={[styles.roleText, { color: isReceived ? '#38A169' : '#E53E3E' }]}>
              {isReceived ? '↓ Received' : '↑ Sent'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Amount */}
        <Text style={[styles.amount, { color: isReceived ? '#38A169' : colors.text }]}>
          {isReceived ? '+' : '-'}{formatCurrency(item.amount, item.currency as string)}
        </Text>

        {/* Details */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Created:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(item.created_at)}</Text>
          </View>
          {item.paid_at && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Paid:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(item.paid_at)}</Text>
            </View>
          )}
          {item.payment_method && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Method:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{item.payment_method}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Loading state
  if (loading && allPayments.length === 0) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
        <UnderbossBar />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={BRAND.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading payments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <UnderbossBar />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Payments</Text>
        <Text style={[styles.subtitle, { color: BRAND.primary }]}>
          {sentPayments.length} sent • {receivedPayments.length} received
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Received</Text>
          <Text style={[styles.summaryValue, { color: '#38A169' }]}>
            {formatCurrency(totalReceived)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Sent</Text>
          <Text style={[styles.summaryValue, { color: '#E53E3E' }]}>
            {formatCurrency(totalSent)}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['all', 'pending', 'completed'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              { backgroundColor: colors.inputBg },
              activeTab === tab && { backgroundColor: BRAND.primary },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.textSecondary },
                activeTab === tab && { color: '#fff' },
              ]}
            >
              {tab === 'all' ? `All (${allPayments.length})` :
               tab === 'pending' ? `Pending (${pending.length})` :
               `Completed (${completed.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No payments yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Complete jobs to receive payments
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPayments}
          keyExtractor={(item) => item.payment_id}
          renderItem={renderPaymentCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Error message */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: '#FED7D7' }]}>
          <Text style={{ color: '#E53E3E' }}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.md,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    marginTop: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.sm,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  listContent: {
    padding: SPACING.lg,
    paddingTop: 0,
    gap: SPACING.md,
  },
  paymentCard: {
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  roleIndicator: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  amount: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
  },
  details: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: FONT_SIZE.sm,
  },
  detailValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
  },
  errorBanner: {
    padding: SPACING.md,
    margin: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
});
