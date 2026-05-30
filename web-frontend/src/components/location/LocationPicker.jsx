import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, Navigation, Search } from 'lucide-react';
import {
  SRI_LANKA_BOUNDS,
  SRI_LANKA_CENTER,
  SRI_LANKA_DEFAULT_ZOOM,
  SRI_LANKA_MAX_ZOOM,
  SRI_LANKA_MIN_ZOOM,
  SRI_LANKA_PICK_ZOOM,
  geolocationErrorMessage,
  hasCoordinates,
  isWithinSriLanka,
  tryGetBrowserLocation,
} from '../../utils/locationHelpers';
import { geocodeAddressInSriLanka, reverseGeocodeInSriLanka } from '../../utils/geocode';
import { MapFlyTo, SriLankaBoundsLock } from './SriLankaMapControls';
import 'leaflet/dist/leaflet.css';
import '../../styles/location.css';

const GEOCODE_DEBOUNCE_MS = 900;
const MIN_ADDRESS_LENGTH = 3;

const MapClickHandler = ({ onPick, onInvalidPick }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (!isWithinSriLanka(lat, lng)) {
        onInvalidPick();
        return;
      }
      onPick(lat, lng);
    },
  });
  return null;
};

const emptyLocation = () => ({ address: '' });

const LocationPicker = ({ value, onChange, required = true }) => {
  const [geoError, setGeoError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const geocodeRequestRef = useRef(0);
  const skipGeocodeRef = useRef(false);
  const lastGeocodedAddressRef = useRef('');

  const coords = useMemo(() => {
    if (!hasCoordinates(value)) return null;
    return { lat: Number(value.lat), lng: Number(value.lng) };
  }, [value]);

  const mapCenter = coords ? [coords.lat, coords.lng] : SRI_LANKA_CENTER;
  const mapZoom = coords ? SRI_LANKA_PICK_ZOOM : SRI_LANKA_DEFAULT_ZOOM;

  const applyLocation = useCallback((patch) => {
    const base = hasCoordinates(value)
      ? { lat: value.lat, lng: value.lng, address: value.address || '' }
      : emptyLocation();
    onChange({ ...base, ...patch });
  }, [onChange, value]);

  const runGeocode = useCallback(async (addressText) => {
    const address = addressText.trim();
    if (address.length < MIN_ADDRESS_LENGTH) return;

    if (address === lastGeocodedAddressRef.current && hasCoordinates(value)) {
      return;
    }

    const requestId = geocodeRequestRef.current + 1;
    geocodeRequestRef.current = requestId;
    setGeocodeLoading(true);
    setGeoError('');

    try {
      const result = await geocodeAddressInSriLanka(address);
      if (geocodeRequestRef.current !== requestId) return;

      if (!result) {
        setGeoError('Could not find that address in Sri Lanka. Try more detail or tap the map.');
        return;
      }

      lastGeocodedAddressRef.current = address;
      skipGeocodeRef.current = true;
      applyLocation({
        address,
        lat: result.lat,
        lng: result.lng,
      });
    } catch {
      if (geocodeRequestRef.current === requestId) {
        setGeoError('Address lookup failed. Tap the map to set your pin.');
      }
    } finally {
      if (geocodeRequestRef.current === requestId) {
        setGeocodeLoading(false);
      }
    }
  }, [applyLocation, value]);

  useEffect(() => {
    if (skipGeocodeRef.current) {
      skipGeocodeRef.current = false;
      return undefined;
    }

    const address = String(value?.address || '').trim();
    if (address.length < MIN_ADDRESS_LENGTH) return undefined;

    const timer = setTimeout(() => {
      runGeocode(address);
    }, GEOCODE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value?.address, runGeocode]);

  const handleMapPick = async (lat, lng) => {
    setGeoError('');
    lastGeocodedAddressRef.current = '';

    const currentAddress = String(value?.address || '').trim();
    if (currentAddress) {
      skipGeocodeRef.current = true;
      applyLocation({ lat, lng, address: currentAddress });
      return;
    }

    skipGeocodeRef.current = true;
    applyLocation({ lat, lng });

    try {
      const reversed = await reverseGeocodeInSriLanka(lat, lng);
      if (reversed?.address) {
        lastGeocodedAddressRef.current = reversed.address;
        skipGeocodeRef.current = true;
        applyLocation({ lat, lng, address: reversed.address });
      }
    } catch {
      // Pin is saved; address can be entered manually
    }
  };

  const handleInvalidPick = () => {
    setGeoError('Please select a location within Sri Lanka.');
  };

  const handleAddressChange = (address) => {
    setGeoError('');
    lastGeocodedAddressRef.current = '';
    applyLocation({ address });
  };

  const handleAddressBlur = () => {
    const address = String(value?.address || '').trim();
    if (address.length >= MIN_ADDRESS_LENGTH) {
      runGeocode(address);
    }
  };

  const handleFindOnMap = () => {
    const address = String(value?.address || '').trim();
    if (address.length < MIN_ADDRESS_LENGTH) {
      setGeoError('Enter at least 3 characters to search.');
      return;
    }
    runGeocode(address);
  };

  const handleUseMyLocation = async () => {
    setGeoLoading(true);
    setGeoError('');
    try {
      const pos = await tryGetBrowserLocation();
      const { latitude: lat, longitude: lng } = pos.coords;

      if (!isWithinSriLanka(lat, lng)) {
        setGeoError(
          'Your detected location is outside Sri Lanka. Tap the map to set your service location.'
        );
        return;
      }

      lastGeocodedAddressRef.current = '';
      skipGeocodeRef.current = true;
      applyLocation({ lat, lng });

      const reversed = await reverseGeocodeInSriLanka(lat, lng);
      if (reversed?.address) {
        lastGeocodedAddressRef.current = reversed.address;
        skipGeocodeRef.current = true;
        applyLocation({ lat, lng, address: reversed.address });
      }
    } catch (err) {
      setGeoError(geolocationErrorMessage(err));
    } finally {
      setGeoLoading(false);
    }
  };

  const coordsReady = hasCoordinates(value);
  const addressReady = Boolean(String(value?.address || '').trim());

  return (
    <div className="location-picker">
      <label className="location-picker-label">
        Service Location (Sri Lanka) {required ? '*' : ''}
      </label>
      <p className="location-picker-hint">
        Tap the map to drop a pin, type an address to find it on the map, or use GPS.
      </p>

      <div className="location-picker-map-wrap">
        <MapContainer
          center={SRI_LANKA_CENTER}
          zoom={SRI_LANKA_DEFAULT_ZOOM}
          className="location-picker-map"
          scrollWheelZoom
          minZoom={SRI_LANKA_MIN_ZOOM}
          maxZoom={SRI_LANKA_MAX_ZOOM}
          maxBounds={SRI_LANKA_BOUNDS}
          maxBoundsViscosity={1}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <SriLankaBoundsLock />
          <MapFlyTo position={mapCenter} zoom={mapZoom} />
          <MapClickHandler onPick={handleMapPick} onInvalidPick={handleInvalidPick} />
          {coords && <Marker position={[coords.lat, coords.lng]} />}
        </MapContainer>
        {geocodeLoading && (
          <div className="location-picker-map-overlay">Finding address on map…</div>
        )}
      </div>

      <div className="location-picker-actions">
        <button
          type="button"
          className="location-picker-btn secondary"
          onClick={handleUseMyLocation}
          disabled={geoLoading || geocodeLoading}
        >
          <Navigation size={16} />
          {geoLoading ? 'Getting location…' : 'Use my location'}
        </button>
        {coords && (
          <span className="location-picker-coords">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </span>
        )}
      </div>

      {geoError && <div className="location-picker-error">{geoError}</div>}

      <div className="location-picker-address-row">
        <div className="location-picker-address-wrap">
          <MapPin size={18} className="location-picker-address-icon" />
          <input
            type="text"
            className="location-picker-address-input"
            placeholder="e.g. Aluthgama, Bandaragama"
            value={value?.address || ''}
            onChange={(e) => handleAddressChange(e.target.value)}
            onBlur={handleAddressBlur}
            required={required}
          />
        </div>
        <button
          type="button"
          className="location-picker-btn secondary location-picker-find-btn"
          onClick={handleFindOnMap}
          disabled={geocodeLoading}
          title="Show this address on the map"
        >
          <Search size={16} />
          Find on map
        </button>
      </div>

      {required && (!coordsReady || !addressReady) && (
        <p className="location-picker-validation">
          Enter an address or tap the map inside Sri Lanka to set your service location.
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
