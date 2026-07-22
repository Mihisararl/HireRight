import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LanguageSwitcher from './LanguageSwitcher';
import { ROUTE_LABEL_KEYS } from '../constants/publicNav';
import { usePublicNav } from '../context/PublicNavContext';
import { colors, spacing } from '../constants/theme';

export default function PublicHeader({ navigation, activeRoute }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { openSidebar } = usePublicNav();

  const routeLabel = activeRoute && activeRoute !== 'Login'
    ? t(ROUTE_LABEL_KEYS[activeRoute] || activeRoute)
    : null;

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable style={styles.menuBtn} onPress={openSidebar}>
        <Text style={styles.menuIcon}>☰</Text>
      </Pressable>

      <Pressable style={styles.brandWrap} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.brand}>HireRight</Text>
        {routeLabel ? <Text style={styles.routeHint}>{routeLabel}</Text> : null}
      </Pressable>

      <LanguageSwitcher compact />
      <Pressable style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>{t('home.nav.login')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 22,
    color: colors.text,
    fontWeight: '700',
  },
  brandWrap: {
    flex: 1,
  },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0066cc',
  },
  routeHint: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loginText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
