import Provider from '../models/Provider.js';
import ServiceRequest from '../models/ServiceRequest.js';

const ACTIVE_STATUSES = ['Accepted', 'Confirmed'];

const parseCoords = (lat, lng) => {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return null;
  }
  if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
    return null;
  }
  return { lat: parsedLat, lng: parsedLng };
};

export const updateProviderLocation = async (req, res) => {
  try {
    const coords = parseCoords(req.body.lat, req.body.lng);
    if (!coords) {
      return res.status(400).json({ message: 'Valid lat and lng are required' });
    }

    const provider = await Provider.findOne({ userId: req.user.id });
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const activeJourney = await ServiceRequest.findOne({
      providerId: req.user.id,
      journeyActive: true,
      status: { $in: ACTIVE_STATUSES },
    });

    if (!activeJourney) {
      return res.status(400).json({
        message: 'Start journey on an accepted job before sending location updates',
      });
    }

    provider.location = {
      lat: coords.lat,
      lng: coords.lng,
      updatedAt: new Date(),
    };
    await provider.save();

    return res.json({
      message: 'Location updated',
      location: provider.location,
    });
  } catch (error) {
    console.error('updateProviderLocation error:', error);
    return res.status(500).json({
      message: 'Failed to update location',
      error: error.message,
    });
  }
};

export const startProviderJourney = async (req, res) => {
  try {
    const { serviceRequestId } = req.body;
    if (!serviceRequestId) {
      return res.status(400).json({ message: 'serviceRequestId is required' });
    }

    const serviceRequest = await ServiceRequest.findOne({
      _id: serviceRequestId,
      providerId: req.user.id,
      status: { $in: ACTIVE_STATUSES },
    });

    if (!serviceRequest) {
      return res.status(404).json({
        message: 'Accepted job not found or you are not assigned to it',
      });
    }

    const loc = serviceRequest.location;
    if (!loc?.lat || !loc?.lng) {
      return res.status(400).json({
        message: 'Customer location coordinates are not available for this job',
      });
    }

    await ServiceRequest.updateMany(
      { providerId: req.user.id, journeyActive: true, _id: { $ne: serviceRequest._id } },
      { $set: { journeyActive: false } }
    );

    serviceRequest.journeyActive = true;
    serviceRequest.journeyStartedAt = new Date();
    await serviceRequest.save();

    return res.json({
      message: 'Journey started',
      serviceRequest,
    });
  } catch (error) {
    console.error('startProviderJourney error:', error);
    return res.status(500).json({
      message: 'Failed to start journey',
      error: error.message,
    });
  }
};

export const getProviderLocation = async (req, res) => {
  try {
    const providerUserId = req.params.id;

    const provider = await Provider.findOne({ userId: providerUserId }).select('location userId');
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const activeJourney = await ServiceRequest.findOne({
      providerId: providerUserId,
      journeyActive: true,
      status: { $in: ACTIVE_STATUSES },
      userId: req.user.id,
    });

    if (!activeJourney) {
      return res.json({
        tracking: false,
        location: null,
        message: 'Provider is not currently sharing location',
      });
    }

    if (!provider.location?.lat || !provider.location?.lng) {
      return res.json({
        tracking: true,
        location: null,
        journeyStartedAt: activeJourney.journeyStartedAt,
      });
    }

    return res.json({
      tracking: true,
      location: {
        lat: provider.location.lat,
        lng: provider.location.lng,
        updatedAt: provider.location.updatedAt,
      },
      journeyStartedAt: activeJourney.journeyStartedAt,
      serviceRequestId: activeJourney._id,
    });
  } catch (error) {
    console.error('getProviderLocation error:', error);
    return res.status(500).json({
      message: 'Failed to fetch provider location',
      error: error.message,
    });
  }
};
