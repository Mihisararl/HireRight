import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '../constants/theme';

export default function LanguageSwitcher({ compact = false, style }) {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('si') ? 'si' : 'en';

  const setLanguage = (lng) => {
    if (lng !== current) {
      i18n.changeLanguage(lng);
    }
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]}>
      <Pressable
        style={[styles.btn, current === 'en' && styles.btnActive]}
        onPress={() => setLanguage('en')}
      >
        <Text style={[styles.btnText, current === 'en' && styles.btnTextActive]}>EN</Text>
      </Pressable>
      <Text style={styles.divider}>|</Text>
      <Pressable
        style={[styles.btn, current === 'si' && styles.btnActive]}
        onPress={() => setLanguage('si')}
      >
        <Text style={[styles.btnText, current === 'si' && styles.btnTextActive]}>SI</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 4,
    gap: 2,
  },
  wrapCompact: {
    alignSelf: 'center',
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnActive: {
    backgroundColor: colors.primary,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  btnTextActive: {
    color: '#fff',
  },
  divider: {
    color: '#cbd5e1',
    fontWeight: '600',
    paddingHorizontal: 2,
  },
});
