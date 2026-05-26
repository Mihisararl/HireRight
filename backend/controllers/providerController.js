import User from '../models/User.js';
import WorkerRegistrationRequest from '../models/WorkerRegistrationRequest.js';
import Provider from '../models/Provider.js';

const toNumber = (value) => (value === '' || value === null || value === undefined ? undefined : Number(value));

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

    if (!agreedToBackgroundCheck) {
      return res.status(400).json({
        message: 'You must agree to the background check before submitting.'
      });
    }

    // Check if email already exists in User or WorkerRegistrationRequest
    const existingUser = await User.findOne({ email: normalizedEmail });
    const existingRequest = await WorkerRegistrationRequest.findOne({ email: normalizedEmail });

    if (!existingUser) {
      return res.status(400).json({
        message: 'Please sign up first, then use the same email to submit worker registration.'
      });
    }

    if (existingUser) {
      if (String(existingUser._id) !== String(req.user.id)) {
        return res.status(400).json({ message: 'This email is already registered' });
      }

      // owner is registering themselves — update their User record to provider/pending
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
    }

    return res.status(400).json({ message: 'This email is already registered' });
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

// GET - Get all approved providers for the Services page
export const getApprovedProviders = async (req, res) => {
  try {
    const providers = await Provider.find()
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    const formattedProviders = providers.map(provider => ({
      _id: provider._id,
      userId: provider.userId._id,
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
      rating: provider.rating || 4.8,
      totalReviews: provider.totalReviews || 0,
      approvedAt: provider.approvedAt
    }));

    res.json(formattedProviders);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch approved providers',
      error: error.message
    });
  }
};

// GET - Get approved providers by service category
export const getProvidersByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const query = {};
    if (category && category !== 'All Services') {
      query.serviceCategory = category;
    }

    const providers = await Provider.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    const formattedProviders = providers.map(provider => ({
      _id: provider._id,
      userId: provider.userId._id,
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
      rating: provider.rating || 4.8,
      totalReviews: provider.totalReviews || 0,
      approvedAt: provider.approvedAt
    }));

    res.json(formattedProviders);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch providers',
      error: error.message
    });
  }
};
