import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getErrorMessage } from '../api/client';
import { getProviderPayments } from '../api/payment';
import EmptyState from '../components/EmptyState';
import LoadingView from '../components/LoadingView';
import { colors, spacing } from '../constants/theme';

export default function EarningsScreen() {
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
      setError(getErrorMessage(err, 'Failed to load earnings'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const paid = payments.filter((p) => p.payoutStatus === 'paid');
  const total = paid.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (loading) return <LoadingView message="Loading earnings..." />;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total paid earnings</Text>
        <Text style={styles.summaryValue}>Rs. {total.toLocaleString()}</Text>
        <Text style={styles.summaryMeta}>{paid.length} released payment(s)</Text>
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.amount}>Rs. {Number(item.amount || 0).toLocaleString()}</Text>
            <Text style={styles.meta}>Status: {item.payoutStatus || item.status}</Text>
            <Text style={styles.meta}>
              {item.releasedAt || item.approvedAt
                ? new Date(item.releasedAt || item.approvedAt).toLocaleDateString()
                : 'Pending release'}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No payments yet"
            subtitle="Released payments from completed jobs will show here."
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
