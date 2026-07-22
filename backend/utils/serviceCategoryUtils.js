/** Canonical service category groups — provider labels and customer post values may differ. */
const CATEGORY_GROUPS = [
  {
    values: ['Home Cleaning', 'home cleaning', 'cleaning', 'Cleaning'],
  },
  {
    values: ['Plumbing', 'plumbing'],
  },
  {
    values: ['Electrical', 'electrical'],
  },
  {
    values: ['Carpentry', 'carpentry'],
  },
  {
    values: ['Painting', 'painting'],
  },
  {
    values: ['Landscaping', 'landscaping'],
  },
  {
    values: ['HVAC', 'hvac'],
  },
  {
    values: ['Handyman', 'handyman'],
  },
  {
    values: ['Moving', 'moving'],
  },
  {
    values: ['Other', 'other'],
  },
];

export const normalizeCategory = (value) => String(value || '').trim().toLowerCase();

const findGroupForCategory = (category) => {
  const normalized = normalizeCategory(category);
  if (!normalized) return null;

  return CATEGORY_GROUPS.find((group) =>
    group.values.some((value) => normalizeCategory(value) === normalized)
  ) || null;
};

/** All stored request category strings that match a provider's service category. */
export const getRequestCategoriesForProvider = (providerCategory) => {
  const trimmed = String(providerCategory || '').trim();
  if (!trimmed) return [];

  const group = findGroupForCategory(trimmed);
  if (group) {
    return [...new Set(group.values)];
  }

  return [trimmed, normalizeCategory(trimmed)];
};

export const categoriesMatch = (providerCategory, requestCategory) => {
  const allowed = getRequestCategoriesForProvider(providerCategory).map(normalizeCategory);
  return allowed.includes(normalizeCategory(requestCategory));
};

export const resolveProviderServiceCategory = (user, providerProfile) =>
  providerProfile?.serviceCategory?.trim()
  || user?.serviceCategory?.trim()
  || '';
