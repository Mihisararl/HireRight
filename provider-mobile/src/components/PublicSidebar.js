import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PUBLIC_NAV_ITEMS } from '../constants/publicNav';
import { usePublicNav } from '../context/PublicNavContext';
import { colors, spacing } from '../constants/theme';

export default function PublicSidebar() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { sidebarOpen, closeSidebar } = usePublicNav();

  const activeRoute = route.name;

  const navigateTo = (routeName) => {
    closeSidebar();
    if (routeName !== activeRoute) {
      navigation.navigate(routeName);
    }
  };

  return (
    <Modal
      visible={sidebarOpen}
      transparent
      animationType="fade"
      onRequestClose={closeSidebar}
    >
      <View style={styles.overlay}>
        <View style={[styles.sidebar, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.brand}>HireRight</Text>
            <Pressable style={styles.closeBtn} onPress={closeSidebar}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.menuLabel}>{t('mobile.menu')}</Text>

          {PUBLIC_NAV_ITEMS.map((item) => {
            const active = item.key === activeRoute;
            return (
              <Pressable
                key={item.key}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => navigateTo(item.key)}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                <Text style={[styles.navText, active && styles.navTextActive]}>
                  {t(item.labelKey)}
                </Text>
              </Pressable>
            );
          })}

          <View style={styles.footer}>
            <Pressable
              style={styles.loginBtn}
              onPress={() => navigateTo('Login')}
            >
              <Text style={styles.loginText}>{t('mobile.providerLogin')}</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.backdrop} onPress={closeSidebar} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sidebar: {
    width: '78%',
    maxWidth: 320,
    alignSelf: 'stretch',
    backgroundColor: colors.card,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0066cc',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '700',
  },
  menuLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  navItemActive: {
    backgroundColor: '#dbeafe',
  },
  navIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  navText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  navTextActive: {
    color: colors.primary,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
