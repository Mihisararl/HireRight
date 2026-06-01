export const formatLocationDisplay = (location) => {
  if (!location) return 'Location not set';
  if (typeof location === 'string') return location;
  const address = location.address?.trim();
  if (address) return address;
  if (location.lat != null && location.lng != null) {
    return `${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)}`;
  }
  return 'Location not set';
};

export const hasCoordinates = (location) => {
  if (!location || typeof location !== 'object') return false;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
};

export const googleMapsUrl = (lat, lng) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
