import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  SRI_LANKA_BOUNDS,
  SRI_LANKA_CENTER,
  SRI_LANKA_DEFAULT_ZOOM,
  SRI_LANKA_MIN_ZOOM,
} from '../../utils/locationHelpers';

export const SriLankaBoundsLock = () => {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(SRI_LANKA_BOUNDS);
    map.setMaxBounds(bounds);
    map.setMinZoom(SRI_LANKA_MIN_ZOOM);
    map.options.maxBoundsViscosity = 1.0;

    if (!bounds.contains(map.getCenter())) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map]);

  return null;
};

export const MapFlyTo = ({ position, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (position?.length === 2 && Number.isFinite(position[0]) && Number.isFinite(position[1])) {
      map.flyTo(position, zoom, { duration: 0.6 });
    } else {
      map.flyTo(SRI_LANKA_CENTER, SRI_LANKA_DEFAULT_ZOOM, { duration: 0.4 });
    }
  }, [map, position, zoom]);

  return null;
};
