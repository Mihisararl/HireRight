const EARTH_RADIUS_KM = 6371;

/** Geographic center of Sri Lanka */
export const SRI_LANKA_CENTER = [7.8731, 80.7718];
export const DEFAULT_MAP_CENTER = SRI_LANKA_CENTER;
export const SRI_LANKA_DEFAULT_ZOOM = 8;
export const DEFAULT_MAP_ZOOM = SRI_LANKA_DEFAULT_ZOOM;
export const SRI_LANKA_PICK_ZOOM = 14;
export const SRI_LANKA_MIN_ZOOM = 7;
export const SRI_LANKA_MAX_ZOOM = 18;

/** Leaflet maxBounds: south-west, north-east */
export const SRI_LANKA_BOUNDS = [
  [5.92, 79.52],
  [9.95, 81.95],
];

const isSetCoord = (value) => (
  value !== null
  && value !== undefined
  && value !== ''
);

export const isWithinSriLanka = (lat, lng) => {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  if (Math.abs(la) < 0.05 && Math.abs(ln) < 0.05) return false;
  return la >= 5.92 && la <= 9.95 && ln >= 79.52 && ln <= 81.95;
};

export const hasCoordinates = (location) => {
  if (!location || typeof location !== 'object') return false;
  if (!isSetCoord(location.lat) || !isSetCoord(location.lng)) return false;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  return isWithinSriLanka(lat, lng);
};

export const formatLocationDisplay = (location) => {
  if (!location) return '—';
  if (typeof location === 'string') return location;
  if (location.address) return location.address;
  if (hasCoordinates(location)) {
    return `${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)}`;
  }
  return '—';
};

export const googleMapsNavUrl = (lat, lng) => (
  `https://www.google.com/maps?q=${lat},${lng}`
);

export const haversineDistanceKm = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = (
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  );
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

export const formatDistance = (km) => {
  if (!Number.isFinite(km)) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

export const geolocationErrorMessage = (error) => {
  if (!error) return 'Unable to access your location.';
  switch (error.code) {
    case 1:
    case error.PERMISSION_DENIED:
      return 'Location permission denied. Allow location in your browser settings, or tap the map to set your pin in Sri Lanka.';
    case 2:
    case error.POSITION_UNAVAILABLE:
      return 'GPS is not available on this device (common on desktop). Tap the map to place your pin in Sri Lanka.';
    case 3:
    case error.TIMEOUT:
      return 'Location request timed out. Tap the map to set your location in Sri Lanka.';
    default:
      return error.message || 'Unable to access your location. Tap the map to set your pin.';
  }
};

const getCurrentPosition = (options) => new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
    reject(new Error('Geolocation is not supported'));
    return;
  }
  navigator.geolocation.getCurrentPosition(resolve, reject, options);
});

/** Tries low-accuracy first (works better on Windows/desktop), then high-accuracy. */
export const tryGetBrowserLocation = async () => {
  const strategies = [
    { enableHighAccuracy: false, timeout: 25000, maximumAge: 300000 },
    { enableHighAccuracy: false, timeout: 30000, maximumAge: 0 },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 },
  ];

  let lastError;
  for (const options of strategies) {
    try {
      return await getCurrentPosition(options);
    } catch (err) {
      lastError = err;
      if (err?.code === 1) break;
    }
  }
  throw lastError;
};

/** LKR per day — supports legacy `budget` field on older service requests */
export const getRequestDailyBudget = (request) => (
  Number(request?.dailyBudget ?? request?.budget ?? 0)
);

/** Total amount customer pays (accepted offer price, or daily budget fallback) */
export const getRequestPayableAmount = (request) => {
  if (!request) return 0;

  const offerPrice = request.providerOffer?.proposedPrice;
  if (offerPrice != null && Number(offerPrice) > 0) {
    return Number(offerPrice);
  }

  return getRequestDailyBudget(request);
};
