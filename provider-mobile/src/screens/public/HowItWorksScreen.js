import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import PublicScreenLayout from '../../components/PublicScreenLayout';
import {
  HOW_IT_WORKS_CUSTOMERS,
  HOW_IT_WORKS_WORKERS,
  WHY_CHOOSE,
} from '../../constants/publicContent';
import { colors, spacing } from '../../constants/theme';

function StepSection({ title, subtitle, items }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      {items.map((item) => (
        <View key={item.step} style={styles.stepCard}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{item.step}</Text>
          </View>
          <View style={styles.stepBody}>
            <Text style={styles.stepTitle}>{item.title}</Text>
            <Text style={styles.stepDesc}>{item.description}</Text>
            {item.details.map((detail) => (
              <Text key={detail} style={styles.detail}>✓ {detail}</Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export default function HowItWorksScreen({ navigation }) {
  return (
    <PublicScreenLayout navigation={navigation} activeRoute="HowItWorks">
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>How HireRight Works</Text>
        <Text style={styles.heroSubtitle}>
          Simple, secure, and efficient. Connect with professionals or find work in a few steps.
        </Text>
      </View>

      <StepSection
        title="For Customers"
        subtitle="Getting help is simple. Follow these three easy steps."
        items={HOW_IT_WORKS_CUSTOMERS}
      />

      <StepSection
        title="For Workers"
        subtitle="Turn your skills into income on your own schedule."
        items={HOW_IT_WORKS_WORKERS}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose HireRight?</Text>
        {WHY_CHOOSE.map((item) => (
          <View key={item.title} style={styles.featureCard}>
            <Text style={styles.featureTitle}>{item.title}</Text>
            <Text style={styles.featureDesc}>{item.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cta}>
        <Text style={styles.ctaTitle}>Ready to get started?</Text>
        <View style={styles.ctaRow}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Services')}
          >
            <Text style={styles.primaryBtnText}>Browse Services</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('BecomeWorker')}
          >
            <Text style={styles.secondaryBtnText}>Become a Worker</Text>
          </Pressable>
        </View>
      </View>
    </PublicScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: spacing.lg,
    backgroundColor: '#4299e1',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#e0f2fe',
    lineHeight: 24,
  },
  section: {
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  stepCard: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: '#f8fafc',
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
    marginBottom: spacing.xs,
  },
  detail: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
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
  cta: {
    margin: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: spacing.md,
  },
  ctaRow: {
    gap: spacing.sm,
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
  },
  secondaryBtn: {
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
