import User from '../../models/User.js';
import UserPaymentDetails from '../../models/UserPaymentDetails.js';
import Provider from '../../models/Provider.js';
import WorkerRegistrationRequest from '../../models/WorkerRegistrationRequest.js';
import { resolveRateFields, applyResolvedRate } from '../../utils/rateUtils.js';

// ================= CURRENT USER =================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resp = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      postalCode: user.postalCode,
      profilePhoto: user.profilePhoto,
      role: user.role,
      providerStatus: user.providerStatus,
      serviceCategory: user.serviceCategory,
      yearsOfExperience: user.yearsOfExperience,
      hourlyRate: user.hourlyRate,
      dailyRate: user.dailyRate,
      rateType: user.rateType || 'hourly',
      professionalBio: user.professionalBio,
      portfolioPhoto: user.portfolioPhoto,
      city: user.city,
      district: user.district,
      needsProfileCompletion: Boolean(user.needsPhone)
    };

    if (user.role === 'provider') {
      const registrationRequest = await WorkerRegistrationRequest.findOne({
        email: user.email
      }).select('status');

      resp.workerProfileSubmitted = Boolean(registrationRequest);
      resp.workerRegistrationStatus = registrationRequest?.status || null;

      const providerDoc = await Provider.findOne({ userId: user._id });
      if (providerDoc) {
        resp.bankName = providerDoc.bankName || '';
        resp.accountNumber = providerDoc.accountNumber || '';
        resp.accountHolderName = providerDoc.accountHolderName || '';
        resp.branch = providerDoc.branch || '';
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        resp.isAvailableToday = !(
          providerDoc.availabilityDate === todayStr && providerDoc.isAvailableToday === false
        );
        resp.availabilityDate = providerDoc.availabilityDate || '';
      }
    } else {
      const bankDetails = await UserPaymentDetails.findOne({ userId: user._id });
      if (bankDetails) {
        resp.bankName = bankDetails.bankName || '';
        resp.accountNumber = bankDetails.accountNumber || '';
        resp.accountHolderName = bankDetails.accountHolderName || '';
        resp.branch = bankDetails.branch || '';
      }
    }

    res.json({ user: resp });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= UPDATE PROFILE =================
export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      postalCode,
      profilePhoto,
      serviceCategory,
      yearsOfExperience,
      hourlyRate,
      dailyRate,
      rateType,
      professionalBio,
      portfolioPhoto,
      city,
      district,
      bankName,
      accountNumber,
      accountHolderName,
      branch
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) {
      const trimmedPhone = String(phone).trim();
      if (user.needsPhone && !trimmedPhone) {
        return res.status(400).json({ message: 'Phone number is required' });
      }
      user.phone = trimmedPhone;
      if (trimmedPhone && user.needsPhone) {
        user.needsPhone = false;
      }
    }
    if (address !== undefined) user.address = address;
    if (postalCode !== undefined) user.postalCode = postalCode;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    if (district !== undefined) user.district = district;

    if (user.role === 'provider') {
      if (serviceCategory !== undefined) user.serviceCategory = serviceCategory;
      if (yearsOfExperience !== undefined) user.yearsOfExperience = Number(yearsOfExperience) || 0;

      const rateFieldsProvided = [rateType, hourlyRate, dailyRate].some((value) => value !== undefined);
      if (rateFieldsProvided) {
        const resolvedRate = resolveRateFields({ rateType, hourlyRate, dailyRate });
        if (resolvedRate.error) {
          return res.status(400).json({ message: resolvedRate.error });
        }
        applyResolvedRate(user, resolvedRate);
      }

      if (professionalBio !== undefined) user.professionalBio = professionalBio;
      if (portfolioPhoto !== undefined) user.portfolioPhoto = portfolioPhoto;
      if (city !== undefined) user.city = city;
    }

    await user.save();

    if (user.role === 'provider') {
      const providerDoc = await Provider.findOne({ userId: user._id });
      if (providerDoc) {
        if (name !== undefined && String(name).trim() !== '') {
          const parts = name.trim().split(/\s+/);
          providerDoc.firstName = parts[0] || providerDoc.firstName;
          providerDoc.lastName = parts.slice(1).join(' ') || providerDoc.lastName;
        }
        if (email !== undefined) providerDoc.email = email;
        if (phone !== undefined) providerDoc.phone = phone;
        if (district !== undefined) providerDoc.district = district;
        if (city !== undefined) providerDoc.city = city;
        if (postalCode !== undefined) providerDoc.postalCode = postalCode;
        if (serviceCategory !== undefined) providerDoc.serviceCategory = serviceCategory;
        if (yearsOfExperience !== undefined) providerDoc.yearsOfExperience = Number(yearsOfExperience) || 0;

        if (rateFieldsProvided) {
          const resolvedRate = resolveRateFields({ rateType, hourlyRate, dailyRate });
          applyResolvedRate(providerDoc, resolvedRate);
        }

        if (professionalBio !== undefined) providerDoc.professionalBio = professionalBio;
        if (portfolioPhoto !== undefined) providerDoc.portfolioPhoto = portfolioPhoto;

        const bankFieldsInRequest = [bankName, accountNumber, branch, accountHolderName]
          .some((value) => value !== undefined);
        if (bankFieldsInRequest) {
          const trimmedBank = {
            bankName: bankName !== undefined ? String(bankName).trim() : undefined,
            accountNumber: accountNumber !== undefined ? String(accountNumber).trim() : undefined,
            branch: branch !== undefined ? String(branch).trim() : undefined,
            accountHolderName: accountHolderName !== undefined ? String(accountHolderName).trim() : undefined
          };
          const hasAnyBankValue = Object.values(trimmedBank).some(Boolean);
          if (hasAnyBankValue) {
            const missing = Object.entries(trimmedBank)
              .filter(([, value]) => !value)
              .map(([key]) => key);
            if (missing.length > 0) {
              return res.status(400).json({
                message: `Missing required bank fields: ${missing.join(', ')}`
              });
            }
            providerDoc.bankName = trimmedBank.bankName;
            providerDoc.accountNumber = trimmedBank.accountNumber;
            providerDoc.branch = trimmedBank.branch;
            providerDoc.accountHolderName = trimmedBank.accountHolderName;
          }
        }

        await providerDoc.save();
      }
    }

    const bankFields = {
      bankName: bankName !== undefined ? String(bankName).trim() : undefined,
      accountNumber: accountNumber !== undefined ? String(accountNumber).trim() : undefined,
      accountHolderName: accountHolderName !== undefined ? String(accountHolderName).trim() : undefined,
      branch: branch !== undefined ? String(branch).trim() : undefined
    };
    const hasBankDetails = Object.values(bankFields).some(Boolean);

    if (hasBankDetails) {
      const missing = Object.entries(bankFields)
        .filter(([, value]) => !value)
        .map(([key]) => key);

      if (missing.length > 0) {
        return res.status(400).json({
          message: `Missing required bank fields: ${missing.join(', ')}`
        });
      }

      await UserPaymentDetails.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          postalCode: user.postalCode,
          bankName,
          accountNumber,
          accountHolderName,
          branch
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        postalCode: user.postalCode,
        profilePhoto: user.profilePhoto,
        role: user.role,
        providerStatus: user.providerStatus,
        serviceCategory: user.serviceCategory,
        yearsOfExperience: user.yearsOfExperience,
        hourlyRate: user.hourlyRate,
        dailyRate: user.dailyRate,
        rateType: user.rateType || 'hourly',
        professionalBio: user.professionalBio,
        portfolioPhoto: user.portfolioPhoto,
        city: user.city,
        district: user.district,
        needsProfileCompletion: Boolean(user.needsPhone)
      }
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
