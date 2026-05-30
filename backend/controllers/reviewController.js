import Review from '../models/Review.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Payment from '../models/Payment.js';
import Provider from '../models/Provider.js';

export const createReview = async (req, res) => {
  try {
    const { serviceRequestId, rating, comment } = req.body || {};

    if (!serviceRequestId || !rating) {
      return res.status(400).json({ message: 'serviceRequestId and rating are required' });
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const serviceRequest = await ServiceRequest.findById(serviceRequestId);
    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (String(serviceRequest.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to review this service request' });
    }

    if (serviceRequest.status !== 'Completed') {
      return res.status(400).json({ message: 'Service request must be completed before review' });
    }

    const payment = await Payment.findOne({ serviceRequestId: serviceRequest._id });
    if (!payment || payment.payoutStatus !== 'paid') {
      return res.status(400).json({ message: 'Payment must be released before review' });
    }

    const providerUserId = serviceRequest.providerId;
    if (!providerUserId) {
      return res.status(400).json({ message: 'Provider not assigned for this request' });
    }

    const provider = await Provider.findOne({ userId: providerUserId });
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const existingReview = await Review.findOne({ userId: req.user.id, serviceRequestId: serviceRequest._id });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this service' });
    }

    const review = await Review.create({
      userId: req.user.id,
      providerId: provider._id,
      providerUserId,
      serviceRequestId: serviceRequest._id,
      rating: numericRating,
      comment: comment || ''
    });

    const allReviews = await Review.find({ providerId: provider._id }).select('rating');
    const totalReviews = allReviews.length;
    const sumRating = allReviews.reduce((sum, item) => sum + (item.rating || 0), 0);
    const nextRating = totalReviews > 0 ? sumRating / totalReviews : 0;

    provider.totalReviews = totalReviews;
    provider.rating = Number(nextRating.toFixed(2));
    await provider.save();

    res.status(201).json({ message: 'Review submitted', review });
  } catch (error) {
    console.error('createReview error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this service' });
    }
    res.status(500).json({ message: 'Failed to submit review' });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('getUserReviews error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

export const getReviewByServiceRequest = async (req, res) => {
  try {
    const { serviceRequestId } = req.params;
    const review = await Review.findOne({ userId: req.user.id, serviceRequestId });
    res.json(review || null);
  } catch (error) {
    console.error('getReviewByServiceRequest error:', error);
    res.status(500).json({ message: 'Failed to fetch review' });
  }
};

export const getProviderReviews = async (req, res) => {
  try {
    const providerProfile = await Provider.findOne({ userId: req.user.id }).select('_id');
    if (!providerProfile) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    const reviews = await Review.find({ providerId: providerProfile._id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('getProviderReviews error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};
