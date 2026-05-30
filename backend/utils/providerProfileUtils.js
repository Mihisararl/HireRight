import Provider from '../models/Provider.js';

export const buildProviderProfileSummary = (providerDoc) => {
  if (!providerDoc) return null;

  const totalReviews = providerDoc.totalReviews || 0;
  return {
    firstName: providerDoc.firstName,
    lastName: providerDoc.lastName,
    fullName: `${providerDoc.firstName} ${providerDoc.lastName}`.trim(),
    serviceCategory: providerDoc.serviceCategory,
    city: providerDoc.city,
    district: providerDoc.district,
    yearsOfExperience: providerDoc.yearsOfExperience,
    hourlyRate: providerDoc.hourlyRate,
    professionalBio: providerDoc.professionalBio || '',
    portfolioPhoto: providerDoc.portfolioPhoto || null,
    rating: totalReviews > 0 ? providerDoc.rating : 0,
    totalReviews,
  };
};

export const attachProviderProfilesToRequests = async (requests) => {
  const list = Array.isArray(requests) ? requests : [];
  const providerUserIds = [
    ...new Set(
      list
        .map((request) => request.providerId?._id || request.providerId)
        .filter(Boolean)
        .map(String)
    ),
  ];

  if (providerUserIds.length === 0) {
    return list.map((request) => ({
      ...(request.toObject ? request.toObject() : request),
      providerProfile: null,
    }));
  }

  const providers = await Provider.find({ userId: { $in: providerUserIds } }).lean();
  const profileByUserId = new Map(
    providers.map((provider) => [String(provider.userId), buildProviderProfileSummary(provider)])
  );

  return list.map((request) => {
    const plain = request.toObject ? request.toObject() : { ...request };
    const providerUserId = plain.providerId?._id || plain.providerId;
    return {
      ...plain,
      providerProfile: providerUserId
        ? profileByUserId.get(String(providerUserId)) || null
        : null,
    };
  });
};
