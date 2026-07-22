import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../api/client';
import {
  acceptDirectBooking,
  completeJob,
  rejectDirectBooking,
  sendOffer,
} from '../api/jobs';
import { startJourney } from '../api/provider';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { colors, spacing } from '../constants/theme';
import { formatLocationDisplay, googleMapsUrl, hasCoordinates } from '../utils/locationHelpers';
import { formatLkr, formatLkrPerDay, getRequestDailyBudget } from '../utils/moneyHelpers';

const ACTIVE_STATUSES = ['Accepted', 'Confirmed'];

export default function JobDetailsScreen({ route, navigation }) {
  const { t } = useTranslation();
  const initialJob = route.params?.job;
  const mode = route.params?.mode || 'assigned';

  const [job, setJob] = useState(initialJob);
  const [offerMessage, setOfferMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState(
    String(getRequestDailyBudget(job) || '')
  );
  const [proposedDate, setProposedDate] = useState(job?.preferredDate || '');
  const [responseMessage, setResponseMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const isActiveJob = ACTIVE_STATUSES.includes(job?.status) && !job?.providerCompleted;
  const journeyActive = Boolean(job?.journeyActive);
  const trackingEnabled = journeyActive && isActiveJob;

  const { error: trackingError, lastSentAt } = useLocationTracking(trackingEnabled);

  const customerName = job?.userId?.name || t('provider.customer');
  const coordsReady = hasCoordinates(job?.location);

  const runAction = async (label, action) => {
    setBusy(true);
    try {
      const result = await action();
      if (result?.serviceRequest) {
        setJob(result.serviceRequest);
      }
      Alert.alert(t('mobile.success'), result?.message || `${label} completed.`);
      if (mode === 'available' || mode === 'booking') {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert(t('mobile.error'), getErrorMessage(error, `${t('mobile.error')}: ${label}`));
    } finally {
      setBusy(false);
    }
  };

  const handleSendOffer = () => {
    const normalizedPrice = Number(proposedPrice);
    const offerPrice = Number.isFinite(normalizedPrice) && normalizedPrice > 0
      ? normalizedPrice
      : getRequestDailyBudget(job);

    if (!offerPrice) {
      Alert.alert(t('mobile.error'), t('mobile.invalidProposedPrice'));
      return;
    }

    return runAction(t('provider.sendOffer'), () =>
      sendOffer(job._id, {
        message: offerMessage.trim(),
        proposedPrice: offerPrice,
        proposedDate: proposedDate.trim() || job.preferredDate,
      })
    );
  };

  const handleAcceptBooking = () =>
    runAction(t('provider.acceptBooking'), () => acceptDirectBooking(job._id, responseMessage));

  const handleRejectBooking = () =>
    runAction(t('provider.rejectBooking'), () => rejectDirectBooking(job._id, responseMessage));

  const handleStartJourney = () =>
    runAction(t('provider.startJourney'), async () => {
      const data = await startJourney(job._id);
      return data;
    });

  const handleCompleteJob = () => {
    Alert.alert(t('mobile.completeJobConfirmTitle'), t('mobile.completeJobConfirmMessage'), [
      { text: t('mobile.cancel'), style: 'cancel' },
      {
        text: t('mobile.complete'),
        onPress: () => runAction(t('provider.completeJob'), () => completeJob(job._id)),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{job.serviceTitle}</Text>
      <Text style={styles.status}>{job.status}</Text>

      <Section title={t('provider.customer')}>
        <InfoRow label={t('common.name')} value={customerName} />
        {job.userId?.phone ? <InfoRow label={t('common.phone')} value={job.userId.phone} /> : null}
        {job.userId?.email ? <InfoRow label={t('common.email')} value={job.userId.email} /> : null}
      </Section>

      <Section title={t('mobile.serviceInfo')}>
        <InfoRow label={t('mobile.category')} value={job.serviceCategory} />
        <InfoRow label={t('provider.date')} value={`${job.preferredDate} ${t('provider.at')} ${job.preferredTime}`} />
        <InfoRow label={t('provider.budget')} value={formatLkrPerDay(getRequestDailyBudget(job))} />
        <InfoRow label={t('provider.description')} value={job.description} />
        {job.specificRequirements ? (
          <InfoRow label={t('mobile.requirements')} value={job.specificRequirements} />
        ) : null}
      </Section>

      <Section title={t('provider.location')}>
        <InfoRow label={t('mobile.address')} value={formatLocationDisplay(job.location)} />
        {coordsReady ? (
          <>
            <InfoRow label={t('mobile.latitude')} value={String(job.location.lat)} />
            <InfoRow label={t('mobile.longitude')} value={String(job.location.lng)} />
            <Pressable
              style={styles.linkBtn}
              onPress={() => Linking.openURL(googleMapsUrl(job.location.lat, job.location.lng))}
            >
              <Text style={styles.linkText}>{t('mobile.openGoogleMaps')}</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.warning}>{t('mobile.gpsUnavailable')}</Text>
        )}
      </Section>

      {mode === 'available' ? (
        <Section title={t('provider.sendOffer')}>
          <Field label={t('mobile.messageOptional')} value={offerMessage} onChangeText={setOfferMessage} multiline />
          <Field label={t('mobile.proposedPrice')} value={proposedPrice} onChangeText={setProposedPrice} keyboardType="numeric" />
          <Field label={t('mobile.proposedDate')} value={proposedDate} onChangeText={setProposedDate} />
          <ActionButton label={t('provider.acceptJob')} onPress={handleSendOffer} loading={busy} waitLabel={t('mobile.pleaseWait')} />
        </Section>
      ) : null}

      {mode === 'booking' ? (
        <Section title={t('mobile.bookingResponse')}>
          <Field label={t('mobile.messageOptional')} value={responseMessage} onChangeText={setResponseMessage} multiline />
          <ActionButton label={t('provider.acceptBooking')} onPress={handleAcceptBooking} loading={busy} color={colors.success} waitLabel={t('mobile.pleaseWait')} />
          <ActionButton label={t('provider.rejectBooking')} onPress={handleRejectBooking} loading={busy} color={colors.danger} waitLabel={t('mobile.pleaseWait')} />
        </Section>
      ) : null}

      {mode === 'assigned' && isActiveJob ? (
        <Section title={t('mobile.jobActions')}>
          {!journeyActive ? (
            <ActionButton
              label={t('provider.startJourney')}
              onPress={handleStartJourney}
              loading={busy}
              disabled={!coordsReady}
              waitLabel={t('mobile.pleaseWait')}
            />
          ) : (
            <View style={styles.trackingBox}>
              <Text style={styles.trackingTitle}>{t('mobile.liveTrackingActive')}</Text>
              <Text style={styles.trackingMeta}>
                {t('mobile.locationSentEvery10s')}
                {lastSentAt ? ` · ${lastSentAt.toLocaleTimeString()}` : ''}
              </Text>
              {trackingError ? <Text style={styles.trackingError}>{trackingError}</Text> : null}
            </View>
          )}

          {!job.providerCompleted ? (
            <ActionButton
              label={t('provider.completeJob')}
              onPress={handleCompleteJob}
              loading={busy}
              color={colors.success}
              waitLabel={t('mobile.pleaseWait')}
            />
          ) : (
            <Text style={styles.completedNote}>{t('mobile.markedCompleteNote')}</Text>
          )}
        </Section>
      ) : null}
    </ScrollView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText, multiline, keyboardType }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

function ActionButton({ label, onPress, loading, disabled, color = colors.primary, waitLabel = 'Please wait...' }) {
  return (
    <Pressable
      style={[styles.actionBtn, { backgroundColor: color }, (loading || disabled) && styles.actionDisabled]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      <Text style={styles.actionText}>{loading ? waitLabel : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  status: {
    marginTop: 4,
    marginBottom: spacing.md,
    color: colors.primary,
    fontWeight: '700',
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  row: {
    marginBottom: spacing.sm,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  rowValue: {
    marginTop: 2,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  linkBtn: {
    marginTop: spacing.sm,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
  warning: {
    color: colors.warning,
    fontSize: 14,
  },
  field: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#fff',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionBtn: {
    marginTop: spacing.sm,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionDisabled: {
    opacity: 0.6,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  trackingBox: {
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  trackingTitle: {
    fontWeight: '700',
    color: colors.success,
  },
  trackingMeta: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
  },
  trackingError: {
    marginTop: spacing.xs,
    color: colors.danger,
    fontSize: 13,
  },
  completedNote: {
    color: colors.success,
    fontWeight: '600',
  },
});
