import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  SRI_LANKA_BOUNDS,
  SRI_LANKA_CENTER,
  SRI_LANKA_DEFAULT_ZOOM,
  SRI_LANKA_MAX_ZOOM,
  SRI_LANKA_MIN_ZOOM,
  hasCoordinates,
} from '../../utils/locationHelpers';
import { SriLankaBoundsLock } from './SriLankaMapControls';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const customerIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'customer-marker-icon',
});

const providerIcon = new L.DivIcon({
  className: 'provider-marker-icon',
  html: '<div style="background:#2563eb;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const FitBounds = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    const valid = (points || []).filter((p) => hasCoordinates(p));
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 15);
      return;
    }
    const bounds = L.latLngBounds(valid.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [map, points]);

  return null;
};

const TrackingMap = ({
  customerLocation,
  providerLocation,
  height = 280,
  showRoute = true,
}) => {
  const customerPoint = hasCoordinates(customerLocation)
    ? { lat: Number(customerLocation.lat), lng: Number(customerLocation.lng) }
    : null;
  const providerPoint = providerLocation?.lat != null && providerLocation?.lng != null
    ? { lat: Number(providerLocation.lat), lng: Number(providerLocation.lng) }
    : null;

  const center = customerPoint
    ? [customerPoint.lat, customerPoint.lng]
    : providerPoint
      ? [providerPoint.lat, providerPoint.lng]
      : SRI_LANKA_CENTER;

  const routePoints = customerPoint && providerPoint
    ? [[customerPoint.lat, customerPoint.lng], [providerPoint.lat, providerPoint.lng]]
    : [];

  return (
    <div style={{ height, width: '100%', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <MapContainer
        center={SRI_LANKA_CENTER}
        zoom={SRI_LANKA_DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
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
        <FitBounds points={[customerPoint, providerPoint].filter(Boolean)} />

        {customerPoint && (
          <Marker position={[customerPoint.lat, customerPoint.lng]} icon={customerIcon}>
            <Popup>Customer location</Popup>
          </Marker>
        )}

        {providerPoint && (
          <Marker position={[providerPoint.lat, providerPoint.lng]} icon={providerIcon}>
            <Popup>Provider location</Popup>
          </Marker>
        )}

        {showRoute && routePoints.length === 2 && (
          <Polyline positions={routePoints} color="#2563eb" weight={3} dashArray="6 8" />
        )}
      </MapContainer>
    </div>
  );
};

export default TrackingMap;
