import React from 'react';
import { Star, MapPin, Briefcase, Clock, Phone } from 'lucide-react';
import '../../styles/providerOfferProfile.css';

const getInitials = (name) => {
  if (!name) return 'P';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const formatCategory = (category) => {
  if (!category) return 'Service Provider';
  return category.charAt(0).toUpperCase() + category.slice(1);
};

const ProviderOfferProfile = ({ providerUser, providerProfile }) => {
  const profile = providerProfile || {};
  const name = profile.fullName || providerUser?.name || 'Provider';
  const photo = profile.portfolioPhoto || providerUser?.profilePhoto;
  const phone = providerUser?.phone;
  const rating = Number(profile.rating) || 0;
  const totalReviews = profile.totalReviews || 0;
  const bio = profile.professionalBio?.trim();

  return (
    <div className="provider-offer-profile">
      <div className="provider-offer-profile-header">
        <div className="provider-offer-avatar">
          {photo ? (
            <img src={photo} alt={name} className="provider-offer-avatar-img" />
          ) : (
            getInitials(name)
          )}
        </div>
        <div className="provider-offer-profile-main">
          <div className="provider-offer-name">{name}</div>
          <div className="provider-offer-category">{formatCategory(profile.serviceCategory)}</div>
          <div className="provider-offer-rating-row">
            <Star size={14} fill="#f59e0b" color="#f59e0b" />
            <span className="provider-offer-rating-value">
              {totalReviews > 0 ? rating.toFixed(1) : 'New'}
            </span>
            <span className="provider-offer-rating-meta">
              {totalReviews > 0 ? `(${totalReviews} review${totalReviews === 1 ? '' : 's'})` : 'No reviews yet'}
            </span>
          </div>
        </div>
      </div>

      <div className="provider-offer-meta-grid">
        {(profile.city || profile.district) && (
          <div className="provider-offer-meta-item">
            <MapPin size={14} />
            <span>{[profile.city, profile.district].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {profile.yearsOfExperience != null && (
          <div className="provider-offer-meta-item">
            <Briefcase size={14} />
            <span>{profile.yearsOfExperience} yr{profile.yearsOfExperience === 1 ? '' : 's'} experience</span>
          </div>
        )}
        {profile.hourlyRate != null && (
          <div className="provider-offer-meta-item">
            <Clock size={14} />
            <span>Rs.{Number(profile.hourlyRate).toLocaleString()}/hr</span>
          </div>
        )}
        {phone && (
          <div className="provider-offer-meta-item">
            <Phone size={14} />
            <span>{phone}</span>
          </div>
        )}
      </div>

      {bio && (
        <p className="provider-offer-bio">{bio}</p>
      )}
    </div>
  );
};

export default ProviderOfferProfile;
