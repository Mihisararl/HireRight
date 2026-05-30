import React from 'react';
import TrackingMap from './TrackingMap';
import { useProviderLocationPoll } from '../../hooks/useProviderLocationPoll';
import {
  formatDistance,
  formatLocationDisplay,
  haversineDistanceKm,
  hasCoordinates,
} from '../../utils/locationHelpers';

const CustomerProviderTracking = ({
  providerUserId,
  customerLocation,
  enabled = true,
}) => {
  const { tracking, providerLocation, error, loading } = useProviderLocationPoll(
    providerUserId,
    enabled && Boolean(providerUserId)
  );

  const customerCoords = hasCoordinates(customerLocation) ? customerLocation : null;
  const providerCoords = providerLocation?.lat != null ? providerLocation : null;

  const distanceKm = customerCoords && providerCoords
    ? haversineDistanceKm(
      customerCoords.lat,
      customerCoords.lng,
      providerCoords.lat,
      providerCoords.lng
    )
    : null;

  if (!enabled || !providerUserId) return null;

  return (
    <div className="tracking-panel">
      <h4 className="tracking-panel-title">Track your provider</h4>
      <p className="tracking-panel-meta">
        Service at: {formatLocationDisplay(customerLocation)}
      </p>

      {!customerCoords && (
        <p className="tracking-panel-error">
          Your job location does not have map coordinates yet.
        </p>
      )}

      {customerCoords && (
        <>
          <TrackingMap
            customerLocation={customerCoords}
            providerLocation={providerCoords}
            height={260}
          />
          {distanceKm != null && providerCoords && (
            <p className="tracking-distance">
              Distance to provider: {formatDistance(distanceKm)}
            </p>
          )}
          {loading && !providerCoords && (
            <p className="tracking-panel-meta">Loading provider location…</p>
          )}
          {!tracking && (
            <p className="tracking-panel-meta">
              Waiting for provider to start their journey…
            </p>
          )}
          {tracking && !providerCoords && (
            <p className="tracking-panel-meta">
              Provider is on the way. Location will appear shortly.
            </p>
          )}
          {tracking && providerCoords && (
            <p className="tracking-panel-status">
              Live tracking — updates every 10 seconds
              {providerLocation.updatedAt
                ? ` (updated ${new Date(providerLocation.updatedAt).toLocaleTimeString()})`
                : ''}
            </p>
          )}
        </>
      )}

      {error && <div className="tracking-panel-error">{error}</div>}
    </div>
  );
};

export default CustomerProviderTracking;
