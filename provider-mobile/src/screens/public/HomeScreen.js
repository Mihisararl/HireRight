import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import PublicScreenLayout from '../../components/PublicScreenLayout';
import { POPULAR_SERVICES } from '../../constants/publicContent';
import { colors, spacing } from '../../constants/theme';

const POPULAR_SERVICE_KEYS = [
  { key: 'homeRepair', emoji: '🔧' },
  { key: 'plumbing', emoji: '🚿' },
  { key: 'outdoorHelp', emoji: '🏡' },
  { key: 'photography', emoji: '📷' },
  { key: 'householdHelp', emoji: '✨' },
  { key: 'trending', emoji: '⭐' },
];

const TAG_KEYS = ['cleaning', 'repairs', 'moving', 'painting', 'photography'];

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const popularTags = useMemo(
    () => TAG_KEYS.map((key) => ({ key, label: t(`home.tags.${key}`) })),
    [t]
  );

  const popularServices = useMemo(
    () => POPULAR_SERVICE_KEYS.map((item) => ({
      ...item,
      name: t(`home.popularServices.${item.key}`),
    })),
    [t]
  );

  const howItWorksSteps = useMemo(() => ([
    { step: '1', title: t('home.howItWorks.step1Title'), description: t('home.howItWorks.step1Desc') },
    { step: '2', title: t('home.howItWorks.step2Title'), description: t('home.howItWorks.step2Desc') },
    { step: '3', title: t('home.howItWorks.step3Title'), description: t('home.howItWorks.step3Desc') },
  ]), [t]);

  const handleSearch = () => {
    navigation.navigate('Services', { query: searchQuery.trim() });
  };

  return (
    <PublicScreenLayout navigation={navigation} activeRoute="Home">
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t('home.hero.title')}</Text>
        <Text style={styles.heroSubtitle}>{t('mobile.heroSubtitleMobile')}</Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('mobile.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <Pressable style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>{t('home.hero.search')}</Text>
          </Pressable>
        </View>

        <View style={styles.tagsRow}>
          {popularTags.map((tag) => (
            <Pressable
              key={tag.key}
              style={styles.tag}
              onPress={() => navigation.navigate('Services', { query: tag.label })}
            >
              <Text style={styles.tagText}>{tag.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.popularServices.title')}</Text>
        <View style={styles.grid}>
          {popularServices.map((service) => (
            <Pressable
              key={service.key}
              style={styles.serviceCard}
              onPress={() => navigation.navigate('Services', { query: service.name })}
            >
              <Text style={styles.serviceEmoji}>{service.emoji}</Text>
              <Text style={styles.serviceName}>{service.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.sectionAlt}>
        <Text style={styles.sectionTitle}>{t('home.howItWorks.title')}</Text>
        {howItWorksSteps.map((item) => (
          <View key={item.step} style={styles.stepCard}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>{item.step}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDesc}>{item.description}</Text>
            </View>
          </View>
        ))}
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('HowItWorks')}
        >
          <Text style={styles.secondaryBtnText}>{t('mobile.learnMore')}</Text>
        </Pressable>
      </View>

      <View style={styles.cta}>
        <Text style={styles.ctaTitle}>{t('mobile.readyToEarn')}</Text>
        <Text style={styles.ctaText}>{t('mobile.becomeWorkerCta')}</Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('BecomeWorker')}
        >
          <Text style={styles.primaryBtnText}>{t('home.nav.becomeWorker')}</Text>
        </Pressable>
      </View>
    </PublicScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.lg,
    backgroundColor: '#e8f0f8',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  section: {
    padding: spacing.lg,
    backgroundColor: '#fff',
  },
  sectionAlt: {
    padding: spacing.lg,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  serviceEmoji: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  stepCard: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#fff',
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  secondaryBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: colors.primary,
    fontWeight: '700',
  },
  cta: {
    margin: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: spacing.sm,
  },
  ctaText: {
    fontSize: 15,
    color: '#e0e7ff',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
});
