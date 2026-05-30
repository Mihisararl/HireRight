import User from '../models/User.js';
import WorkerRegistrationRequest from '../models/WorkerRegistrationRequest.js';
import Provider from '../models/Provider.js';
import Review from '../models/Review.js';
import ServiceRequest from '../models/ServiceRequest.js';

const toNumber = (value) => (value === '' || value === null || value === undefined ? undefined : Number(value));

const getLocalDateString = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Available by default each day; only unavailable when explicitly marked for today
const isProviderAvailableToday = (provider) => {
  const today = getLocalDateString();
  if (provider.availabilityDate === today && provider.isAvailableToday === false) {
    return false;
  }
  return true;
};

const formatProviderResponse = (provider, bookedDatesMap, today) => {
  const userId = provider.userId?._id || provider.userId;
  const userIdStr = String(userId);
  const bookedDates = bookedDatesMap.get(userIdStr) || [];

  return {
    _id: provider._id,
    userId,
    firstName: provider.firstName,
    lastName: provider.lastName,
    email: provider.email,
    phone: provider.phone,
    serviceCategory: provider.serviceCategory,
    city: provider.city,
    district: provider.district,
    yearsOfExperience: provider.yearsOfExperience,
    hourlyRate: provider.hourlyRate,
    professionalBio: provider.professionalBio,
    portfolioPhoto: provider.portfolioPhoto,
    profilePhoto: provider.userId?.profilePhoto || null,
    rating: provider.totalReviews > 0 ? provider.rating : 0,
    totalReviews: provider.totalReviews || 0,
    approvedAt: provider.approvedAt,
    isAvailableToday: isProviderAvailableToday(provider),
    availabilityDate: provider.availabilityDate,
    bookedDates,
    bookedToday: bookedDates.includes(today)
  };
};

const loadBookedDatesByProvider = async (userIds) => {
  const bookedByProvider = new Map();
  if (userIds.length === 0) return bookedByProvider;

  const bookedRequests = await ServiceRequest.find({
    providerId: { $in: userIds },
    status: { $in: ['Accepted', 'Confirmed'] },
    preferredDate: { $exists: true, $ne: '' }
  }).select('providerId preferredDate');

  for (const request of bookedRequests) {
    const pid = String(request.providerId);
    if (!bookedByProvider.has(pid)) {
      bookedByProvider.set(pid, []);
    }
    const dates = bookedByProvider.get(pid);
    if (!dates.includes(request.preferredDate)) {
      dates.push(request.preferredDate);
    }
  }

  for (const dates of bookedByProvider.values()) {
    dates.sort();
  }

  return bookedByProvider;
};

const syncProviderRatings = async (providers) => {
  const providerIds = providers.map((provider) => provider._id);
  if (providerIds.length === 0) return;

  const reviewStats = await Review.aggregate([
    { $match: { providerId: { $in: providerIds } } },
    {
      $group: {
        _id: '$providerId',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const statsMap = new Map(
    reviewStats.map((stat) => [String(stat._id), stat])
  );

  const bulkUpdates = providers.map((provider) => {
    const stat = statsMap.get(String(provider._id));
    const totalReviews = stat ? stat.totalReviews : 0;
    const rating = stat ? Number(stat.avgRating.toFixed(2)) : 0;
    if (provider.totalReviews !== totalReviews || provider.rating !== rating) {
      provider.totalReviews = totalReviews;
      provider.rating = rating;
      return {
        updateOne: {
          filter: { _id: provider._id },
          update: { $set: { totalReviews, rating } }
        }
      };
    }
    return null;
  }).filter(Boolean);

  if (bulkUpdates.length > 0) {
    await Provider.bulkWrite(bulkUpdates);
  }
};

export const registerProvider = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      phoneNumber,
      password,
      serviceCategory,
      yearsOfExperience,
      hourlyRate,
      professionalBio,
      portfolioPhoto,
      city,
      district,
      postalCode,
      idDocument,
      bankName,
      accountNumber,
      branch,
      accountHolderName,
      agreedToBackgroundCheck
    } = req.body;

    const providerPhone = phone || phoneNumber;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const requester = await User.findById(req.user.id).select('email');
    if (!requester?.email) {
      return res.status(401).json({ message: 'Please log in to submit worker registration.' });
    }

    const requesterEmail = String(requester.email).trim().toLowerCase();
    if (normalizedEmail !== requesterEmail) {
      return res.status(400).json({
        message: 'Worker registration email must match your account email.'
      });
    }

    if (!firstName || !lastName || !normalizedEmail || !providerPhone || !password) {
      return res.status(400).json({
        message: 'First name, last name, email, phone and password are required.'
      });
    }

    if (!serviceCategory || yearsOfExperience === undefined || hourlyRate === undefined || !city || !district || !idDocument) {
      return res.status(400).json({
        message: 'Complete all required worker registration fields before submitting.'
      });
    }

    if (!bankName || !accountNumber || !branch || !accountHolderName) {
      return res.status(400).json({
        message: 'Bank name, account number, branch, and account holder name are required.'
      });
    }

    if (!agreedToBackgroundCheck) {
      return res.status(400).json({
        message: 'You must agree to the background check before submitting.'
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    const existingRequest = await WorkerRegistrationRequest.findOne({ email: normalizedEmail });

    if (!existingUser) {
      return res.status(400).json({
        message: 'Please sign up first, then use the same email to submit worker registration.'
      });
    }

    if (String(existingUser._id) !== String(req.user.id)) {
      return res.status(400).json({ message: 'This email is already registered' });
    }

    existingUser.role = 'provider';
    existingUser.providerStatus = 'pending';
    existingUser.isVerified = true;
    existingUser.serviceCategory = serviceCategory || existingUser.serviceCategory;
    existingUser.yearsOfExperience = toNumber(yearsOfExperience) ?? existingUser.yearsOfExperience;
    existingUser.hourlyRate = toNumber(hourlyRate) ?? existingUser.hourlyRate;
    existingUser.professionalBio = professionalBio || existingUser.professionalBio;
    existingUser.portfolioPhoto = portfolioPhoto || existingUser.portfolioPhoto;
    existingUser.idDocument = idDocument || existingUser.idDocument;
    existingUser.city = city || existingUser.city;
    existingUser.phone = providerPhone || existingUser.phone;
    await existingUser.save();

    if (existingRequest) {
      return res.status(400).json({ message: 'A registration request with this email already exists.' });
    }

    const registrationRequest = await WorkerRegistrationRequest.create({
      firstName,
      lastName,
      email: normalizedEmail,
      phone: providerPhone,
      password,
      serviceCategory,
      yearsOfExperience: toNumber(yearsOfExperience),
      hourlyRate: toNumber(hourlyRate),
      professionalBio,
      portfolioPhoto,
      city,
      district,
      postalCode,
      idDocument,
      bankName,
      accountNumber,
      branch,
      accountHolderName,
      agreedToBackgroundCheck: Boolean(agreedToBackgroundCheck),
      status: 'pending'
    });

    return res.status(201).json({
      message: 'Worker registration submitted successfully. Awaiting admin approval.',
      registrationRequest: {
        _id: registrationRequest._id,
        firstName: registrationRequest.firstName,
        lastName: registrationRequest.lastName,
        email: registrationRequest.email,
        serviceCategory: registrationRequest.serviceCategory,
        status: registrationRequest.status,
        createdAt: registrationRequest.createdAt
      }
    });
  } catch (error) {
    console.error('registerProvider error:', error);
    return res.status(500).json({
      message: 'Failed to submit worker registration',
      error: error.message
    });
  }
};

export const getWorkerRegistrationRequests = async (req, res) => {
  try {
    const requests = await WorkerRegistrationRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch worker registration requests',
      error: error.message
    });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const { isAvailableToday } = req.body;

    if (typeof isAvailableToday !== 'boolean') {
      return res.status(400).json({ message: 'isAvailableToday must be true or false' });
    }

    const provider = await Provider.findOne({ userId: req.user.id });
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const today = getLocalDateString();
    provider.availabilityDate = today;
    provider.isAvailableToday = isAvailableToday;
    await provider.save();

    const bookedDatesMap = await loadBookedDatesByProvider([req.user.id]);

    res.json({
      message: 'Availability updated successfully',
      isAvailableToday: isProviderAvailableToday(provider),
      availabilityDate: provider.availabilityDate,
      bookedDates: bookedDatesMap.get(String(req.user.id)) || []
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update availability',
      error: error.message
    });
  }
};

export const getMyAvailability = async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user.id });
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const bookedDatesMap = await loadBookedDatesByProvider([req.user.id]);
    const today = getLocalDateString();

    res.json({
      isAvailableToday: isProviderAvailableToday(provider),
      availabilityDate: provider.availabilityDate,
      bookedDates: bookedDatesMap.get(String(req.user.id)) || [],
      bookedToday: (bookedDatesMap.get(String(req.user.id)) || []).includes(today)
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch availability',
      error: error.message
    });
  }
};

export const getApprovedProviders = async (req, res) => {
  try {
    const providers = await Provider.find()
      .populate('userId', 'name email phone profilePhoto')
      .sort({ createdAt: -1 });

    await syncProviderRatings(providers);

    const userIds = providers
      .map((provider) => provider.userId?._id || provider.userId)
      .filter(Boolean);
    const bookedDatesMap = await loadBookedDatesByProvider(userIds);
    const today = getLocalDateString();

    const formattedProviders = providers.map((provider) =>
      formatProviderResponse(provider, bookedDatesMap, today)
    );

    res.json(formattedProviders);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch approved providers',
      error: error.message
    });
  }
};

export const getProvidersByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const query = {};
    if (category && category !== 'All Services') {
      query.serviceCategory = category;
    }

    const providers = await Provider.find(query)
      .populate('userId', 'name email phone profilePhoto')
      .sort({ createdAt: -1 });

    await syncProviderRatings(providers);

    const userIds = providers
      .map((provider) => provider.userId?._id || provider.userId)
      .filter(Boolean);
    const bookedDatesMap = await loadBookedDatesByProvider(userIds);
    const today = getLocalDateString();

    const formattedProviders = providers.map((provider) =>
      formatProviderResponse(provider, bookedDatesMap, today)
    );

    res.json(formattedProviders);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch providers',
      error: error.message
    });
  }
};
