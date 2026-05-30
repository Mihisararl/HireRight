import React, { useEffect, useState } from 'react';
import { ExternalLink, Navigation } from 'lucide-react';
import TrackingMap from './TrackingMap';
import { startProviderJourney } from '../../api/location';
import { useGeolocationSender } from '../../hooks/useGeolocationSender';
import {
  formatLocationDisplay,
  googleMapsNavUrl,
  hasCoordinates,
} from '../../utils/locationHelpers';

const ACTIVE_STATUSES = ['Accepted', 'Confirmed'];

const ProviderJobTracking = ({ serviceRequest, onJourneyChange }) => {
  const [journeyActive, setJourneyActive] = useState(Boolean(serviceRequest?.journeyActive));
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  const customerLocation = serviceRequest?.location;
  const coordsReady = hasCoordinates(customerLocation);
  const isActiveJob = ACTIVE_STATUSES.includes(serviceRequest?.status)
    && !serviceRequest?.providerCompleted;

  const trackingEnabled = journeyActive && isActiveJob;
  const { error: sendError, lastSentAt } = useGeolocationSender(trackingEnabled);

  useEffect(() => {
    setJourneyActive(Boolean(serviceRequest?.journeyActive));
  }, [serviceRequest?.journeyActive, serviceRequest?._id]);

  useEffect(() => {
    if (!isActiveJob && journeyActive) {
      setJourneyActive(false);
    }
  }, [isActiveJob, journeyActive]);

  const handleStartJourney = async () => {
    setStarting(true);
    setStartError('');
    try {
      const data = await startProviderJourney(serviceRequest._id);
      setJourneyActive(Boolean(data.serviceRequest?.journeyActive));
      onJourneyChange?.(data.serviceRequest);
    } catch (err) {
      setStartError(err.response?.data?.message || 'Failed to start journey');
    } finally {
      setStarting(false);
    }
  };

  if (!isActiveJob) return null;

  return (
    <div className="tracking-panel">
      <h4 className="tracking-panel-title">Navigate to customer</h4>
      <p className="tracking-panel-meta">
        {formatLocationDisplay(customerLocation)}
      </p>

      {coordsReady ? (
        <>
          <TrackingMap
            customerLocation={customerLocation}
            providerLocation={null}
            height={220}
            showRoute={false}
          />
          <div className="tracking-panel-actions">
            <a
              href={googleMapsNavUrl(customerLocation.lat, customerLocation.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="location-picker-btn secondary"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={16} />
              Open in Google Maps
            </a>
            {!journeyActive ? (
              <button
                type="button"
                className="location-picker-btn primary"
                onClick={handleStartJourney}
                disabled={starting}
              >
                <Navigation size={16} />
                {starting ? 'Starting…' : 'Start Journey'}
              </button>
            ) : (
              <span className="tracking-panel-status">
                Live tracking active — location sent every 10 seconds
                {lastSentAt ? ` (last: ${lastSentAt.toLocaleTimeString()})` : ''}
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="tracking-panel-error">
          Customer coordinates are not available. Ask the customer to update their service location.
        </p>
      )}

      {(startError || sendError) && (
        <div className="tracking-panel-error">{startError || sendError}</div>
      )}
    </div>
  );
};

export default ProviderJobTracking;
