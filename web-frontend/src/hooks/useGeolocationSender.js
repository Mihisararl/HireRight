import { useCallback, useEffect, useRef, useState } from 'react';
import { updateProviderLocation } from '../api/location';
import { geolocationErrorMessage, isWithinSriLanka } from '../utils/locationHelpers';

const SEND_INTERVAL_MS = 10000;

export const useGeolocationSender = (enabled) => {
  const [error, setError] = useState('');
  const [lastSentAt, setLastSentAt] = useState(null);
  const watchIdRef = useRef(null);
  const intervalIdRef = useRef(null);
  const latestPositionRef = useRef(null);

  const sendLatestPosition = useCallback(async () => {
    const position = latestPositionRef.current;
    if (!position) return;
    try {
      await updateProviderLocation(position.lat, position.lng);
      setLastSentAt(new Date());
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send location to server');
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      latestPositionRef.current = null;
      return undefined;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return undefined;
    }

    setError('');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!isWithinSriLanka(lat, lng)) {
          setError('GPS position is outside Sri Lanka. Move into coverage or use the map.');
          return;
        }
        latestPositionRef.current = { lat, lng };
        setError('');
      },
      (geoError) => {
        setError(geolocationErrorMessage(geoError));
      },
      { enableHighAccuracy: false, maximumAge: 10000, timeout: 25000 }
    );

    sendLatestPosition();
    intervalIdRef.current = setInterval(sendLatestPosition, SEND_INTERVAL_MS);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [enabled, sendLatestPosition]);

  return { error, lastSentAt };
};
