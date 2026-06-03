import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { getErrorMessage } from '../api/client';
import { getGoogleAuthRequestConfig } from '../utils/config';
import { colors, spacing } from '../constants/theme';

/**
 * Isolated so Google.useAuthRequest only runs when OAuth client IDs are configured.
 * Android requires androidClientId; iOS requires iosClientId.
 */
export default function GoogleSignInButton({ onSignIn, busy, disabled }) {
  const [loading, setLoading] = useState(false);
  const googleConfig = getGoogleAuthRequestConfig();

  const [request, response, promptAsync] = Google.useAuthRequest(googleConfig || {});

  useEffect(() => {
    const runGoogleLogin = async () => {
      if (response?.type !== 'success') return;

      const idToken =
        response.authentication?.idToken ||
        response.params?.id_token;

      if (!idToken) {
        Alert.alert('Google sign-in failed', 'No ID token received from Google.');
        return;
      }

      setLoading(true);
      try {
        await onSignIn(idToken);
      } catch (error) {
        Alert.alert('Google sign-in failed', getErrorMessage(error, 'Could not sign in with Google'));
      } finally {
        setLoading(false);
      }
    };

    runGoogleLogin();
  }, [response, onSignIn]);

  useEffect(() => {
    if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setLoading(false);
    }
    if (response?.type === 'error') {
      setLoading(false);
      Alert.alert('Google sign-in failed', 'Google sign-in was cancelled or failed.');
    }
  }, [response]);

  const handlePress = async () => {
    if (!googleConfig) {
      Alert.alert('Not configured', 'Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in provider-mobile/.env');
      return;
    }
    if (!request) {
      Alert.alert('Google sign-in', 'Google sign-in is not ready yet. Try again in a moment.');
      return;
    }

    setLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      Alert.alert('Google sign-in failed', getErrorMessage(error, 'Could not open Google sign-in'));
      setLoading(false);
    }
  };

  const isBusy = busy || loading;

  return (
    <Pressable
      style={[styles.googleButton, isBusy && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={isBusy || disabled || !request}
    >
      <Text style={styles.googleButtonText}>
        {loading ? 'Signing in with Google...' : 'Continue with Google'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  googleButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
});
