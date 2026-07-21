import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getApprovedProviders } from '../../api/public';
import PublicScreenLayout from '../../components/PublicScreenLayout';
import { SERVICE_CATEGORIES } from '../../constants/publicContent';
import { colors, spacing } from '../../constants/theme';
import { formatProviderRateLong } from '../../utils/providerRate';

const ALL_CATEGORY = 'ALL';

export default function PublicServicesScreen({ navigation, route }) {
  const { t } = useTranslation();
  const initialQuery = route.params?.query || '';
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getApprovedProviders();
        setProviders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch providers', error);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (route.params?.query) {
      setSearchQuery(route.params.query);
    }
  }, [route.params?.query]);

  const categoryOptions = useMemo(
    () => [
      { value: ALL_CATEGORY, label: t('mobile.allServices') },
      ...SERVICE_CATEGORIES.filter((c) => c !== 'All Services').map((category) => ({
        value: category,
        label: category,
      })),
    ],
    [t]
  );

  const filteredProviders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return providers.filter((provider) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORY || provider.serviceCategory === selectedCategory;
      const name = `${provider.firstName || ''} ${provider.lastName || ''}`.trim().toLowerCase();
      const matchesQuery =
        !query
        || name.includes(query)
        || (provider.serviceCategory || '').toLowerCase().includes(query)
        || (provider.city || '').toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [providers, searchQuery, selectedCategory]);

  return (
    <PublicScreenLayout navigation={navigation} activeRoute="Services">
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t('mobile.browseServicesTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('mobile.browseServicesSubtitle')}</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('mobile.servicesSearchPlaceholder')}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {categoryOptions.map((category) => {
          const active = category.value === selectedCategory;
          return (
            <Pressable
              key={category.value}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(category.value)}
            >
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.listSection}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : filteredProviders.length === 0 ? (
          <Text style={styles.emptyText}>{t('mobile.noServicesFound')}</Text>
        ) : (
          filteredProviders.map((provider) => (
            <View key={provider._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {t('mobile.serviceSuffix', { category: provider.serviceCategory })}
                </Text>
                <Text style={styles.rating}>
                  ⭐ {Number(provider.rating || 0).toFixed(1)} ({provider.totalReviews || 0})
                </Text>
              </View>
              <Text style={styles.providerName}>
                {provider.firstName} {provider.lastName}
              </Text>
              <Text style={styles.meta}>
                📍 {provider.city || t('mobile.locationNotSet')}
                {provider.district ? `, ${provider.district}` : ''}
              </Text>
              {provider.phone ? (
                <Text style={styles.meta}>📞 {provider.phone}</Text>
              ) : null}
              {provider.yearsOfExperience != null ? (
                <Text style={styles.meta}>
                  {t('mobile.yearsExperience', { count: provider.yearsOfExperience })}
                </Text>
              ) : null}
              <Text style={styles.price}>{formatProviderRateLong(provider)}</Text>
              {provider.professionalBio ? (
                <Text style={styles.bio} numberOfLines={3}>{provider.professionalBio}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </PublicScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.lg,
    backgroundColor: '#fff',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  categories: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoryChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  categoryTextActive: {
    color: colors.primary,
  },
  listSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  loader: {
    marginTop: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
    fontSize: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  rating: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
  },
  price: {
    marginTop: spacing.sm,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  bio: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
