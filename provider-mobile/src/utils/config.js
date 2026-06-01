import { Platform } from 'react-native';
import Constants from 'expo-constants';

const BACKEND_PORT = 5000;
const API_PATH = '/api';

/**
 * Resolve the dev machine IP from Expo (same host Metro uses).
 * Falls back to emulator/simulator defaults.
 */
const getDevMachineHost = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }

  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
};

/**
 * Override for production or fixed LAN IP:
 * set EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api in provider-mobile/.env
 */
const manualUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export const API_BASE_URL =
  manualUrl || `http://${getDevMachineHost()}:${BACKEND_PORT}${API_PATH}`;

export const LOCATION_SEND_INTERVAL_MS = 10000;
