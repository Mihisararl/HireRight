import jwt from 'jsonwebtoken';
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

    // Optionally decode bearer token to identify requester (token contains user id)
    const authHeader = req.header('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    let requesterEmail = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        if (decoded.id) {
          const requester = await User.findById(decoded.id).select('email');
          requesterEmail = requester?.email ? String(requester.email).trim().toLowerCase() : null;
        }
      } catch (err) {
        // ignore invalid token — treat as unauthenticated
      }
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

    if (existingUser) {
      // If an account exists for this email, only allow the authenticated owner to register
      if (!requesterEmail || requesterEmail !== normalizedEmail) {
        return res.status(400).json({ message: 'This email is already registered' });
      }

      // owner is registering themselves — update their User record to provider/pending
      existingUser.role = 'provider';
      existingUser.providerStatus = 'pending';
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

    // No existing user — proceed to create a new User and registration request
    if (existingRequest) {
      return res.status(400).json({ message: 'A registration request with this email already exists.' });
    }

    const user = await User.create({
      name: `${firstName} ${lastName}`.trim(),
      email: normalizedEmail,
      phone: providerPhone,
      district,
      postalCode,
      password,
      role: 'provider',
      providerStatus: 'pending',
      serviceCategory,
      yearsOfExperience: toNumber(yearsOfExperience),
      hourlyRate: toNumber(hourlyRate),
      professionalBio,
      portfolioPhoto,
      idDocument,
      city,
      isVerified: true
    });

    // Create WorkerRegistrationRequest record
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
