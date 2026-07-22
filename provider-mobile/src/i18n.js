import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en/translation.json';
import si from './locales/si/translation.json';

/** Same storage key as web frontend for consistent language preference. */
export const LANGUAGE_STORAGE_KEY = 'hireright_language';

const SUPPORTED_LANGUAGES = ['en', 'si'];

let initPromise = null;

export const initI18n = async () => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let lng = 'en';
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
        lng = saved;
      }
    } catch {
      // AsyncStorage unavailable
    }

    await i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        si: { translation: si },
      },
      lng,
      fallbackLng: 'en',
      supportedLngs: SUPPORTED_LANGUAGES,
      compatibilityJSON: 'v3',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

    i18n.on('languageChanged', async (language) => {
      try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      } catch {
        // ignore
      }
    });

    return i18n;
  })();

  return initPromise;
};

export default i18n;
