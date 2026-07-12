export const getProviderRateType = (profile) =>
  profile?.rateType === 'daily' ? 'daily' : 'hourly';

export const getProviderRateAmount = (profile) => {
  const rateType = getProviderRateType(profile);

  if (rateType === 'daily') {
    const daily = Number(profile?.dailyRate);
    return Number.isFinite(daily) && daily > 0 ? daily : null;
  }

  const hourly = Number(profile?.hourlyRate);
  return Number.isFinite(hourly) && hourly > 0 ? hourly : null;
};

export const formatProviderRate = (profile) => {
  const amount = getProviderRateAmount(profile);
  if (amount == null) return null;

  const rateType = getProviderRateType(profile);
  const formatted = Number(amount).toLocaleString();
  return rateType === 'daily'
    ? `Rs.${formatted}/day`
    : `Rs.${formatted}/hr`;
};

export const formatProviderRateLong = (profile) => {
  const amount = getProviderRateAmount(profile);
  if (amount == null) return null;

  const rateType = getProviderRateType(profile);
  const formatted = Number(amount).toLocaleString();
  return rateType === 'daily'
    ? `Rs. ${formatted} per day`
    : `Rs. ${formatted} per hour`;
};

export const getProviderRateTitle = (profile) =>
  getProviderRateType(profile) === 'daily' ? 'Daily Charge' : 'Hourly Rate';

export const userToRateForm = (user) => {
  const rateType = getProviderRateType(user);
  const amount = getProviderRateAmount(user);
  return {
    rateType,
    rateAmount: amount != null ? String(amount) : '',
  };
};

export const buildRatePayload = (rateType, rateAmount) => ({
  rateType,
  hourlyRate: rateType === 'hourly' ? Number(rateAmount) : null,
  dailyRate: rateType === 'daily' ? Number(rateAmount) : null,
});
