import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { updateLocation } from '../api/provider';
import { LOCATION_SEND_INTERVAL_MS } from '../utils/config';

export const useLocationTracking = (enabled) => {
  const [error, setError] = useState('');
  const [lastSentAt, setLastSentAt] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }

    let cancelled = false;

    const sendPosition = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission is required for journey tracking.');
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (cancelled) return;

        await updateLocation(position.coords.latitude, position.coords.longitude);
        setLastSentAt(new Date());
        setError('');
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || err.message || 'Failed to send location');
        }
      }
    };

    sendPosition();
    intervalRef.current = setInterval(sendPosition, LOCATION_SEND_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);

  return { error, lastSentAt };
};
