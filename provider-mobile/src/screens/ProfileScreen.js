import React, { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getErrorMessage } from '../api/client';
import { getMyAvailability, updateAvailability } from '../api/provider';
import LoadingView from '../components/LoadingView';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../constants/theme';
import { API_BASE_URL } from '../utils/config';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(true);
  const [bookedDates, setBookedDates] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadAvailability = useCallback(async () => {
    if (user?.providerStatus !== 'approved') return;
    setLoading(true);
    try {
      const data = await getMyAvailability();
      setAvailable(Boolean(data.isAvailableToday));
      setBookedDates(data.bookedDates || []);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'Failed to load availability'));
    } finally {
      setLoading(false);
    }
  }, [user?.providerStatus]);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
      loadAvailability();
    }, [loadAvailability, refreshUser])
  );

  const toggleAvailability = async (value) => {
    setSaving(true);
    try {
      const data = await updateAvailability(value);
      setAvailable(Boolean(data.isAvailableToday));
      setBookedDates(data.bookedDates || []);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err, 'Failed to update availability'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Sign out of HireRight Provider?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading && user?.providerStatus === 'approved') {
    return <LoadingView message="Loading profile..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>{user?.phone}</Text>
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>Role: {user?.role}</Text>
          <Text style={styles.badge}>Status: {user?.providerStatus || 'pending'}</Text>
        </View>
      </View>

      {user?.providerStatus === 'approved' ? (
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Available today</Text>
              <Text style={styles.hint}>
                {available ? 'Customers can book you today' : 'Marked unavailable for today'}
              </Text>
            </View>
            <Switch
              value={available}
              onValueChange={toggleAvailability}
              disabled={saving}
            />
          </View>
          {bookedDates.length > 0 ? (
            <Text style={styles.booked}>Booked dates: {bookedDates.join(', ')}</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.pending}>
            {user?.providerStatus === 'rejected'
              ? 'Your registration was rejected. Complete registration on the web app.'
              : 'Your profile is under admin review.'}
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>API</Text>
        <Text style={styles.api}>{API_BASE_URL}</Text>
        <Text style={styles.hint}>Update src/utils/config.js for your LAN IP.</Text>
      </View>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  meta: {
    marginTop: 4,
    color: colors.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  badge: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  hint: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  booked: {
    marginTop: spacing.md,
    color: '#9a3412',
    fontSize: 13,
  },
  pending: {
    color: colors.warning,
    lineHeight: 20,
  },
  api: {
    marginTop: spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: colors.text,
  },
  logoutBtn: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
