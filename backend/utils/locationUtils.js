import Provider from '../models/Provider.js';
import ServiceRequest from '../models/ServiceRequest.js';

export const normalizeIncomingLocation = (location) => {
  if (!location) return null;

  if (typeof location === 'string') {
    const trimmed = location.trim();
    if (!trimmed) return null;
    return { address: trimmed };
  }

  const lat = location.lat !== undefined && location.lat !== '' ? Number(location.lat) : undefined;
  const lng = location.lng !== undefined && location.lng !== '' ? Number(location.lng) : undefined;
  const address = String(location.address || '').trim();

  if (!address) return null;

  const normalized = { address };
  if (Number.isFinite(lat)) normalized.lat = lat;
  if (Number.isFinite(lng)) normalized.lng = lng;

  return normalized;
};

export const validateServiceLocation = (location) => {
  const normalized = normalizeIncomingLocation(location);
  if (!normalized?.address) {
    return { valid: false, message: 'Service location address is required' };
  }
  if (!Number.isFinite(normalized.lat) || !Number.isFinite(normalized.lng)) {
    return { valid: false, message: 'Service location coordinates (lat, lng) are required' };
  }
  return { valid: true, location: normalized };
};

export const formatLocationDisplay = (location) => {
  if (!location) return '—';
  if (typeof location === 'string') return location;
  if (location.address) return location.address;
  if (Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
    return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
  }
  return '—';
};

export const clearProviderLiveLocation = async (userId) => {
  await Provider.updateOne({ userId }, { $unset: { location: '' } });
};

export const stopJourneyForProvider = async (providerUserId) => {
  await ServiceRequest.updateMany(
    { providerId: providerUserId, journeyActive: true },
    { $set: { journeyActive: false } }
  );
  await clearProviderLiveLocation(providerUserId);
};
