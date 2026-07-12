import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import PublicScreenLayout from '../../components/PublicScreenLayout';
import {
  HOME_HOW_IT_WORKS,
  POPULAR_SERVICES,
  POPULAR_TAGS,
} from '../../constants/publicContent';
import { colors, spacing } from '../../constants/theme';

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    navigation.navigate('Services', { query: searchQuery.trim() });
  };

  return (
    <PublicScreenLayout navigation={navigation} activeRoute="Home">
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Find trusted help for every task</Text>
        <Text style={styles.heroSubtitle}>
          Connect with skilled workers across Sri Lanka for home services, repairs, and more.
        </Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search services or workers..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <Pressable style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Search</Text>
          </Pressable>
        </View>

        <View style={styles.tagsRow}>
          {POPULAR_TAGS.map((tag) => (
            <Pressable
              key={tag}
              style={styles.tag}
              onPress={() => navigation.navigate('Services', { query: tag })}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Services</Text>
        <View style={styles.grid}>
          {POPULAR_SERVICES.map((service) => (
            <Pressable
              key={service.name}
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
        <Text style={styles.sectionTitle}>How It Works</Text>
        {HOME_HOW_IT_WORKS.map((item) => (
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
          <Text style={styles.secondaryBtnText}>Learn more</Text>
        </Pressable>
      </View>

      <View style={styles.cta}>
        <Text style={styles.ctaTitle}>Ready to earn with your skills?</Text>
        <Text style={styles.ctaText}>
          Join HireRight as a worker and start getting hired on your own schedule.
        </Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('BecomeWorker')}
        >
          <Text style={styles.primaryBtnText}>Become a Worker</Text>
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
