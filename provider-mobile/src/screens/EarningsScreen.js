import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../api/client';
import { getProviderPayments } from '../api/payment';
import EmptyState from '../components/EmptyState';
import LoadingView from '../components/LoadingView';
import { colors, spacing } from '../constants/theme';
import { getPaymentBreakdown } from '../utils/paymentHelpers';
import { formatLkr } from '../utils/moneyHelpers';

export default function EarningsScreen() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const data = await getProviderPayments();
      setPayments(data || []);
    } catch (err) {
      setError(getErrorMessage(err, t('mobile.failedLoadEarnings')));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const paid = payments.filter((p) => p.payoutStatus === 'paid' && p.status === 'approved');
  const total = paid.reduce((sum, p) => sum + getPaymentBreakdown(p).providerAmount, 0);

  if (loading) return <LoadingView message={t('mobile.loadingEarnings')} />;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>{t('mobile.totalPaidEarnings')}</Text>
        <Text style={styles.summaryValue}>{formatLkr(total)}</Text>
        <Text style={styles.summaryMeta}>{t('mobile.releasedPayments', { count: paid.length })}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={payments}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            load(false);
          }} />
        }
        renderItem={({ item }) => {
          const breakdown = getPaymentBreakdown(item);
          return (
          <View style={styles.card}>
            <Text style={styles.amount}>{formatLkr(breakdown.providerAmount)}</Text>
            <Text style={styles.meta}>{t('provider.serviceAmount')}: {formatLkr(breakdown.serviceAmount)}</Text>
            {breakdown.settlementType === 'PARTIAL_RELEASE' && (
              <Text style={styles.meta}>{t('provider.settlementType')}: {formatLkr(breakdown.settlementAmount)}</Text>
            )}
            <Text style={styles.meta}>
              {t('provider.platformCommission', { rate: breakdown.commissionRate })}: -{formatLkr(breakdown.commissionAmount)}
            </Text>
            <Text style={styles.meta}>Status: {item.payoutStatus || item.status}</Text>
            <Text style={styles.meta}>
              {item.releasedAt || item.approvedAt
                ? new Date(item.releasedAt || item.approvedAt).toLocaleDateString()
                : t('mobile.pendingRelease')}
            </Text>
          </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title={t('mobile.noPaymentsTitle')}
            subtitle={t('mobile.noPaymentsSubtitle')}
          />
        }
        contentContainerStyle={payments.length === 0 ? styles.empty : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  summary: {
    margin: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  summaryValue: {
    marginTop: spacing.xs,
    fontSize: 32,
    fontWeight: '800',
    color: colors.success,
  },
  summaryMeta: {
    marginTop: spacing.xs,
    color: colors.textMuted,
  },
  error: {
    marginHorizontal: spacing.md,
    color: colors.danger,
  },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
  },
  empty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
