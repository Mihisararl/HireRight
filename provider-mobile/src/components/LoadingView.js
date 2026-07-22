import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { spacing } from '../constants/theme';
import i18n from '../i18n';

const LOADING_BACKGROUND = require('../../assets/loading-page.jpg');

export default function LoadingView({ message }) {
  const displayMessage = message ?? (i18n.isInitialized ? i18n.t('common.loading') : 'Loading...');
  const tagline = i18n.isInitialized ? i18n.t('mobile.providerTagline') : 'Provider';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.04,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    entrance.start(({ finished }) => {
      if (finished) {
        pulse.start();
        glow.start();
      }
    });

    return () => {
      pulse.stop();
      glow.stop();
    };
  }, [fadeAnim, glowAnim, scaleAnim, slideAnim]);

  return (
    <ImageBackground
      source={LOADING_BACKGROUND}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          }}
        >
          <Animated.Text style={[styles.brand, { opacity: glowAnim }]}>
            HireRight
          </Animated.Text>
          <Text style={styles.tagline}>{tagline}</Text>
        </Animated.View>

        <ActivityIndicator size="large" color="#ffffff" style={styles.spinner} />
        {displayMessage ? <Text style={styles.message}>{displayMessage}</Text> : null}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  brand: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: 'rgba(37, 99, 235, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  spinner: {
    marginTop: spacing.xl,
  },
  message: {
    marginTop: spacing.md,
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
