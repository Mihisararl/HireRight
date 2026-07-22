import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import PublicScreenLayout from '../../components/PublicScreenLayout';
import { colors, spacing } from '../../constants/theme';

export default function BecomeWorkerScreen({ navigation }) {
  const { t } = useTranslation();

  const features = useMemo(
    () => t('mobile.publicContent.becomeWorkerFeatures', { returnObjects: true }) || [],
    [t]
  );
  const steps = useMemo(
    () => t('mobile.publicContent.becomeWorkerSteps', { returnObjects: true }) || [],
    [t]
  );
  const categories = useMemo(
    () => t('mobile.publicContent.workerCategories', { returnObjects: true }) || [],
    [t]
  );

  return (
    <PublicScreenLayout navigation={navigation} activeRoute="BecomeWorker">
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t('mobile.becomeWorkerHeroTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('mobile.becomeWorkerHeroSubtitle')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('mobile.whyWorkWithUs')}</Text>
        {features.map((feature) => (
          <View key={feature.title} style={styles.featureCard}>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDesc}>{feature.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionAlt}>
        <Text style={styles.sectionTitle}>{t('mobile.gettingStartedEasy')}</Text>
        {steps.map((step) => (
          <View key={step.number} style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{step.number}</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('mobile.popularCategories')}</Text>
        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <View key={category} style={styles.categoryCard}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.cta}>
        <Text style={styles.ctaTitle}>{t('mobile.readyToEarn')}</Text>
        <Text style={styles.ctaText}>{t('mobile.becomeWorkerCta')}</Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryBtnText}>{t('mobile.providerLogin')}</Text>
        </Pressable>
      </View>
    </PublicScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.lg,
    backgroundColor: '#667eea',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    lineHeight: 24,
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
  featureCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
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
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  stepBody: {
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
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
