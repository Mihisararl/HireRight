import Provider from '../models/Provider.js';
import ServiceRequest from '../models/ServiceRequest.js';
import User from '../models/User.js';

/**
 * Resolve customer User id and Provider profile id from a service request when missing.
 */
export const resolvePaymentPartyIds = async ({
  userId,
  providerId,
  serviceRequestId,
}) => {
  let resolvedUserId = userId || null;
  let resolvedProviderId = providerId || null;

  if (!serviceRequestId) {
    return { userId: resolvedUserId, providerId: resolvedProviderId };
  }

  const serviceRequest = await ServiceRequest.findById(serviceRequestId)
    .select('userId providerId')
    .lean();

  if (!serviceRequest) {
    return { userId: resolvedUserId, providerId: resolvedProviderId };
  }

  if (!resolvedUserId) {
    resolvedUserId = serviceRequest.userId;
  }

  if (!resolvedProviderId && serviceRequest.providerId) {
    const providerProfile = await Provider.findOne({ userId: serviceRequest.providerId })
      .select('_id')
      .lean();
    resolvedProviderId = providerProfile?._id || null;
  }

  return {
    userId: resolvedUserId,
    providerId: resolvedProviderId,
  };
};

/**
 * Enrich payment for admin display when userId/providerId were not stored or populated.
 */
export const enrichPaymentParties = async (payment) => {
  const enriched = { ...payment };

  const serviceRequest = enriched.serviceRequestId;
  const serviceRequestId = serviceRequest?._id || serviceRequest;

  if (!enriched.userId && serviceRequest?.userId) {
    if (typeof serviceRequest.userId === 'object' && serviceRequest.userId.name) {
      enriched.userId = serviceRequest.userId;
    } else {
      enriched.userId = await User.findById(serviceRequest.userId).select('name email').lean();
    }
  }

  if (!enriched.providerId && serviceRequest?.providerId) {
    const providerUserId = serviceRequest.providerId._id || serviceRequest.providerId;
    const providerProfile = await Provider.findOne({ userId: providerUserId })
      .select('firstName lastName email phone')
      .lean();

    if (providerProfile) {
      enriched.providerId = providerProfile;
    } else if (typeof serviceRequest.providerId === 'object' && serviceRequest.providerId.name) {
      enriched.providerId = {
        firstName: serviceRequest.providerId.name,
        lastName: '',
        email: serviceRequest.providerId.email,
        phone: serviceRequest.providerId.phone,
      };
    } else {
      const providerUser = await User.findById(providerUserId).select('name email phone').lean();
      if (providerUser) {
        enriched.providerId = {
          firstName: providerUser.name || 'Provider',
          lastName: '',
          email: providerUser.email,
          phone: providerUser.phone,
        };
      }
    }
  }

  if ((!enriched.userId || !enriched.providerId) && serviceRequestId) {
    const resolved = await resolvePaymentPartyIds({
      userId: enriched.userId?._id || enriched.userId,
      providerId: enriched.providerId?._id || enriched.providerId,
      serviceRequestId,
    });

    if (!enriched.userId && resolved.userId) {
      enriched.userId = await User.findById(resolved.userId).select('name email').lean();
    }

    if (!enriched.providerId && resolved.providerId) {
      enriched.providerId = await Provider.findById(resolved.providerId)
        .select('firstName lastName email phone')
        .lean();
    }
  }

  return enriched;
};
