import { isWithinSriLanka } from './locationHelpers';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'HireRight/1.0 (service location picker)';

const nominatimFetch = async (path) => {
  const response = await fetch(`${NOMINATIM_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) {
    throw new Error('Location lookup failed');
  }

  return response.json();
};

/**
 * Forward geocode: address text → coordinates in Sri Lanka (OpenStreetMap Nominatim).
 */
export const geocodeAddressInSriLanka = async (address) => {
  const query = String(address || '').trim();
  if (query.length < 3) return null;

  const params = new URLSearchParams({
    q: query.includes('Sri Lanka') ? query : `${query}, Sri Lanka`,
    format: 'json',
    limit: '1',
    countrycodes: 'lk',
    viewbox: '79.52,9.95,81.95,5.92',
    bounded: '1',
  });

  const results = await nominatimFetch(`/search?${params.toString()}`);
  if (!Array.isArray(results) || results.length === 0) return null;

  const hit = results[0];
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);

  if (!isWithinSriLanka(lat, lng)) return null;

  return {
    lat,
    lng,
    label: hit.display_name,
  };
};

/**
 * Reverse geocode: map pin → readable address.
 */
export const reverseGeocodeInSriLanka = async (lat, lng) => {
  if (!isWithinSriLanka(lat, lng)) return null;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    zoom: '16',
    addressdetails: '1',
  });

  const result = await nominatimFetch(`/reverse?${params.toString()}`);
  const addr = result?.address;
  if (!addr) return null;

  const parts = [
    addr.road || addr.neighbourhood || addr.suburb,
    addr.city || addr.town || addr.village || addr.county,
    addr.state,
  ].filter(Boolean);

  return {
    address: parts.join(', ') || result.display_name,
    label: result.display_name,
  };
};
