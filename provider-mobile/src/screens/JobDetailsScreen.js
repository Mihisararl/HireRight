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

const ACTIVE_STATUSES = ['Accepted', 'Confirmed'];

export default function JobDetailsScreen({ route, navigation }) {
  const initialJob = route.params?.job;
  const mode = route.params?.mode || 'assigned';

  const [job, setJob] = useState(initialJob);
  const [offerMessage, setOfferMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState(String(job?.budget || ''));
  const [proposedDate, setProposedDate] = useState(job?.preferredDate || '');
  const [responseMessage, setResponseMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const isActiveJob = ACTIVE_STATUSES.includes(job?.status) && !job?.providerCompleted;
  const journeyActive = Boolean(job?.journeyActive);
  const trackingEnabled = journeyActive && isActiveJob;

  const { error: trackingError, lastSentAt } = useLocationTracking(trackingEnabled);

  const customerName = job?.userId?.name || 'Customer';
  const coordsReady = hasCoordinates(job?.location);

  const runAction = async (label, action) => {
    setBusy(true);
    try {
      const result = await action();
      if (result?.serviceRequest) {
        setJob(result.serviceRequest);
      }
      Alert.alert('Success', result?.message || `${label} completed.`);
      if (mode === 'available' || mode === 'booking') {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error, `Failed to ${label.toLowerCase()}`));
    } finally {
      setBusy(false);
    }
  };

  const handleSendOffer = () => {
    const normalizedPrice = Number(proposedPrice);
    const offerPrice = Number.isFinite(normalizedPrice) && normalizedPrice > 0
      ? normalizedPrice
      : Number(job.budget) || 0;

    if (!offerPrice) {
      Alert.alert('Error', 'Please enter a valid proposed price.');
      return;
    }

    return runAction('Send offer', () =>
      sendOffer(job._id, {
        message: offerMessage.trim(),
        proposedPrice: offerPrice,
        proposedDate: proposedDate.trim() || job.preferredDate,
      })
    );
  };

  const handleAcceptBooking = () =>
    runAction('Accept booking', () => acceptDirectBooking(job._id, responseMessage));

  const handleRejectBooking = () =>
    runAction('Reject booking', () => rejectDirectBooking(job._id, responseMessage));

  const handleStartJourney = () =>
    runAction('Start journey', async () => {
      const data = await startJourney(job._id);
      return data;
    });

  const handleCompleteJob = () => {
    Alert.alert('Complete job', 'Mark this job as completed on your side?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: () => runAction('Complete job', () => completeJob(job._id)),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{job.serviceTitle}</Text>
      <Text style={styles.status}>{job.status}</Text>

      <Section title="Customer">
        <InfoRow label="Name" value={customerName} />
        {job.userId?.phone ? <InfoRow label="Phone" value={job.userId.phone} /> : null}
        {job.userId?.email ? <InfoRow label="Email" value={job.userId.email} /> : null}
      </Section>

      <Section title="Service">
        <InfoRow label="Category" value={job.serviceCategory} />
        <InfoRow label="Date" value={`${job.preferredDate} at ${job.preferredTime}`} />
        <InfoRow label="Budget" value={`Rs. ${Number(job.budget || 0).toLocaleString()}`} />
        <InfoRow label="Description" value={job.description} />
        {job.specificRequirements ? (
          <InfoRow label="Requirements" value={job.specificRequirements} />
        ) : null}
      </Section>

      <Section title="Location">
        <InfoRow label="Address" value={formatLocationDisplay(job.location)} />
        {coordsReady ? (
          <>
            <InfoRow label="Latitude" value={String(job.location.lat)} />
            <InfoRow label="Longitude" value={String(job.location.lng)} />
            <Pressable
              style={styles.linkBtn}
              onPress={() => Linking.openURL(googleMapsUrl(job.location.lat, job.location.lng))}
            >
              <Text style={styles.linkText}>Open in Google Maps</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.warning}>GPS coordinates not available for this job.</Text>
        )}
      </Section>

      {mode === 'available' ? (
        <Section title="Send Offer">
          <Field label="Message (optional)" value={offerMessage} onChangeText={setOfferMessage} multiline />
          <Field label="Proposed price (Rs.)" value={proposedPrice} onChangeText={setProposedPrice} keyboardType="numeric" />
          <Field label="Proposed date" value={proposedDate} onChangeText={setProposedDate} />
          <ActionButton label="Accept Job / Send Offer" onPress={handleSendOffer} loading={busy} />
        </Section>
      ) : null}

      {mode === 'booking' ? (
        <Section title="Booking Response">
          <Field label="Message (optional)" value={responseMessage} onChangeText={setResponseMessage} multiline />
          <ActionButton label="Accept Booking" onPress={handleAcceptBooking} loading={busy} color={colors.success} />
          <ActionButton label="Reject Booking" onPress={handleRejectBooking} loading={busy} color={colors.danger} />
        </Section>
      ) : null}

      {mode === 'assigned' && isActiveJob ? (
        <Section title="Job Actions">
          {!journeyActive ? (
            <ActionButton
              label="Start Journey"
              onPress={handleStartJourney}
              loading={busy}
              disabled={!coordsReady}
            />
          ) : (
            <View style={styles.trackingBox}>
              <Text style={styles.trackingTitle}>Live tracking active</Text>
              <Text style={styles.trackingMeta}>
                Location sent every 10 seconds
                {lastSentAt ? ` · Last: ${lastSentAt.toLocaleTimeString()}` : ''}
              </Text>
              {trackingError ? <Text style={styles.trackingError}>{trackingError}</Text> : null}
            </View>
          )}

          {!job.providerCompleted ? (
            <ActionButton
              label="Complete Job"
              onPress={handleCompleteJob}
              loading={busy}
              color={colors.success}
            />
          ) : (
            <Text style={styles.completedNote}>You marked this job complete.</Text>
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

function ActionButton({ label, onPress, loading, disabled, color = colors.primary }) {
  return (
    <Pressable
      style={[styles.actionBtn, { backgroundColor: color }, (loading || disabled) && styles.actionDisabled]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      <Text style={styles.actionText}>{loading ? 'Please wait...' : label}</Text>
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
