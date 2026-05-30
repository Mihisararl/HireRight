import { useCallback, useEffect, useState } from 'react';
import { getProviderLocation } from '../api/location';

const POLL_INTERVAL_MS = 10000;

export const useProviderLocationPoll = (providerUserId, enabled) => {
  const [tracking, setTracking] = useState(false);
  const [providerLocation, setProviderLocation] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLocation = useCallback(async () => {
    if (!providerUserId || !enabled) return;
    try {
      setLoading(true);
      const data = await getProviderLocation(providerUserId);
      setTracking(Boolean(data.tracking));
      setProviderLocation(data.location || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load provider location');
    } finally {
      setLoading(false);
    }
  }, [providerUserId, enabled]);

  useEffect(() => {
    if (!enabled || !providerUserId) {
      setTracking(false);
      setProviderLocation(null);
      return undefined;
    }

    fetchLocation();
    const intervalId = setInterval(fetchLocation, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [enabled, providerUserId, fetchLocation]);

  return { tracking, providerLocation, error, loading, refresh: fetchLocation };
};
