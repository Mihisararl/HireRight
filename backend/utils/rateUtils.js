const toNumber = (value) =>
  value === '' || value === null || value === undefined ? undefined : Number(value);

export const resolveRateFields = ({ rateType, hourlyRate, dailyRate }) => {
  const type = rateType === 'daily' ? 'daily' : 'hourly';

  if (type === 'daily') {
    const daily = toNumber(dailyRate);
    if (daily === undefined || daily < 0) {
      return { error: 'Daily charge is required and must be a positive number.' };
    }
    return { rateType: 'daily', dailyRate: daily, hourlyRate: undefined };
  }

  const hourly = toNumber(hourlyRate);
  if (hourly === undefined || hourly < 0) {
    return { error: 'Hourly rate is required and must be a positive number.' };
  }
  return { rateType: 'hourly', hourlyRate: hourly, dailyRate: undefined };
};

export const applyResolvedRate = (doc, resolvedRate) => {
  if (!doc || !resolvedRate || resolvedRate.error) return;
  doc.rateType = resolvedRate.rateType;
  doc.hourlyRate = resolvedRate.hourlyRate;
  doc.dailyRate = resolvedRate.dailyRate;
};
