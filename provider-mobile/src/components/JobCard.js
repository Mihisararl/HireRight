import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '../constants/theme';
import { formatLocationDisplay, hasCoordinates, googleMapsUrl } from '../utils/locationHelpers';
import { formatLkrPerDay, getRequestDailyBudget } from '../utils/moneyHelpers';

export default function JobCard({ job, onPress, actionLabel, onAction, actionDisabled }) {
  const { t } = useTranslation();
  const customerName = job.userId?.name || t('provider.customer');
  const status = job.status || 'Pending';

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{job.serviceTitle}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <Text style={styles.category}>{job.serviceCategory}</Text>
      <Text style={styles.meta}>{t('provider.customer')}: {customerName}</Text>
      <Text style={styles.meta}>{t('provider.location')}: {formatLocationDisplay(job.location)}</Text>
      <Text style={styles.meta}>{t('provider.date')}: {job.preferredDate} · {job.preferredTime}</Text>
      <Text style={styles.budget}>{formatLkrPerDay(getRequestDailyBudget(job))}</Text>

      {hasCoordinates(job.location) ? (
        <Pressable
          onPress={() => Linking.openURL(googleMapsUrl(job.location.lat, job.location.lng))}
          style={styles.mapLink}
        >
          <Text style={styles.mapLinkText}>{t('mobile.openGoogleMaps')}</Text>
        </Pressable>
      ) : null}

      {actionLabel && onAction ? (
        <Pressable
          style={[styles.actionBtn, actionDisabled && styles.actionDisabled]}
          onPress={onAction}
          disabled={actionDisabled}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  statusPill: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  category: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textMuted,
  },
  budget: {
    marginTop: spacing.sm,
    fontSize: 18,
    fontWeight: '700',
    color: colors.success,
  },
  mapLink: {
    marginTop: spacing.sm,
  },
  mapLinkText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  actionBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
