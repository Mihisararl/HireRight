import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingView from './src/components/LoadingView';
import i18n, { initI18n } from './src/i18n';

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().finally(() => setI18nReady(true));
  }, []);

  if (!i18nReady) {
    return (
      <SafeAreaProvider>
        <LoadingView message={i18n.isInitialized ? i18n.t('mobile.startingApp') : 'Starting HireRight...'} />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="dark" />
        </AuthProvider>
      </SafeAreaProvider>
    </I18nextProvider>
  );
}
