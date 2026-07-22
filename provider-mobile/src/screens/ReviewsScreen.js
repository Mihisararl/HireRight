import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../api/client';
import { getProviderReviews } from '../api/review';
import EmptyState from '../components/EmptyState';
import LoadingView from '../components/LoadingView';
import { colors, spacing } from '../constants/theme';

export default function ReviewsScreen() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const data = await getProviderReviews();
      setReviews(data || []);
    } catch (err) {
      setError(getErrorMessage(err, t('mobile.failedLoadReviews')));
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

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(2)
    : '0.00';

  if (loading) return <LoadingView message={t('mobile.loadingReviews')} />;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>{t('provider.reviewsTitle')}</Text>
        <Text style={styles.summaryValue}>{average} / 5</Text>
        <Text style={styles.summaryMeta}>{t('mobile.reviewCount', { count: reviews.length })}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={reviews}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            load(false);
          }} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.userId?.name || t('mobile.customerLabel')}</Text>
              <Text style={styles.rating}>{item.rating} ★</Text>
            </View>
            <Text style={styles.date}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
            </Text>
            <Text style={styles.comment}>{item.comment || t('provider.noComment')}</Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState title={t('mobile.noReviewsTitle')} subtitle={t('mobile.noReviewsSubtitle')} />
        }
        contentContainerStyle={reviews.length === 0 ? styles.empty : undefined}
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
  },
  summaryValue: {
    marginTop: spacing.xs,
    fontSize: 28,
    fontWeight: '800',
    color: colors.warning,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontWeight: '700',
    color: colors.text,
  },
  rating: {
    fontWeight: '700',
    color: colors.warning,
  },
  date: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
  comment: {
    marginTop: spacing.sm,
    color: colors.text,
    lineHeight: 20,
  },
  empty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
