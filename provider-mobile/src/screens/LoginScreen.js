import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PublicHeader from '../components/PublicHeader';
import PublicSidebar from '../components/PublicSidebar';
import { API_BASE_URL } from '../utils/config';
import { colors, spacing } from '../constants/theme';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t('mobile.validation'), t('mobile.emailPasswordRequired'));
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      Alert.alert(t('mobile.loginFailed'), getErrorMessage(error, t('auth.invalidCredentials')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PublicHeader navigation={navigation} activeRoute="Login" />
      <PublicSidebar />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backLink}>← {t('auth.backToHome')}</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.brand}>HireRight</Text>
          <Text style={styles.subtitle}>{t('mobile.providerAppLogin')}</Text>
          <Text style={styles.hint}>{t('mobile.signInHint')}</Text>

          <Text style={styles.label}>{t('common.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="provider@example.com"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>{t('common.password')}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t('mobile.signingIn') : t('mobile.signIn')}
            </Text>
          </Pressable>

          <Text style={styles.apiHint}>API: {API_BASE_URL}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  backLink: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 15,
  },
  hint: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  apiHint: {
    marginTop: spacing.md,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
