import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getErrorMessage } from '../api/client';
import {
  getAvailableJobs,
  getDirectBookingRequests,
  getProviderJobs,
} from '../api/jobs';
import EmptyState from '../components/EmptyState';
import JobCard from '../components/JobCard';
import LoadingView from '../components/LoadingView';
import SegmentTabs from '../components/SegmentTabs';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../constants/theme';

const TABS = [
  { key: 'my', label: 'My Jobs' },
  { key: 'available', label: 'Find Work' },
  { key: 'bookings', label: 'Bookings' },
];

export default function JobsScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [bookingCount, setBookingCount] = useState(0);

  const isApproved = user?.providerStatus === 'approved';

  const loadJobs = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      let data = [];
      if (activeTab === 'my') {
        data = await getProviderJobs();
        data = data.filter((j) => !['Completed', 'ProviderRejected'].includes(j.status));
      } else if (activeTab === 'available') {
        data = await getAvailableJobs();
      } else {
        data = await getDirectBookingRequests();
        setBookingCount(data.length);
      }
      setJobs(data);
      if (activeTab !== 'bookings') {
        const bookings = await getDirectBookingRequests();
        setBookingCount(bookings.length);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load jobs'));
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [loadJobs])
  );

  const tabs = TABS.map((tab) =>
    tab.key === 'bookings' ? { ...tab, badge: bookingCount || undefined } : tab
  );

  const openDetails = (job, mode) => {
    navigation.navigate('JobDetails', { job, mode });
  };

  const renderItem = ({ item }) => {
    if (activeTab === 'available') {
      return (
        <JobCard
          job={item}
          onPress={() => openDetails(item, 'available')}
          actionLabel="Send Offer"
          onAction={() => openDetails(item, 'available')}
          actionDisabled={!isApproved}
        />
      );
    }

    if (activeTab === 'bookings') {
      return (
        <JobCard
          job={item}
          onPress={() => openDetails(item, 'booking')}
          actionLabel="Review Booking"
          onAction={() => openDetails(item, 'booking')}
        />
      );
    }

    return (
      <JobCard
        job={item}
        onPress={() => openDetails(item, 'assigned')}
        actionLabel="View Job"
        onAction={() => openDetails(item, 'assigned')}
      />
    );
  };

  if (loading) return <LoadingView message="Loading jobs..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jobs</Text>
        <Text style={styles.welcome}>Hi, {user?.name || 'Provider'}</Text>
      </View>

      <SegmentTabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

      {error ? (
        <PressableBanner message={error} onRetry={() => loadJobs(false)} />
      ) : null}

      {!isApproved && activeTab === 'available' ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Your profile must be approved before you can send offers.
          </Text>
        </View>
      ) : null}

      <FlatList
        data={jobs}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadJobs(false);
          }} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No jobs here"
            subtitle={
              activeTab === 'my'
                ? 'Accepted jobs will appear here.'
                : activeTab === 'available'
                  ? 'No open service requests right now.'
                  : 'No pending booking requests.'
            }
          />
        }
        contentContainerStyle={jobs.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

function PressableBanner({ message, onRetry }) {
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
      <Text style={styles.retry} onPress={onRetry}>Tap to retry</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  welcome: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 14,
  },
  banner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
  },
  bannerText: {
    color: '#9a3412',
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    padding: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  retry: {
    marginTop: spacing.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
